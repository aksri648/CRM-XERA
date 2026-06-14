import express from 'express';
import crypto from 'crypto';
import { DELIVERY_RATES, ENGAGEMENT_FUNNEL, DELAYS, randomDelay, randomBool } from './simulator.js';

const VALID_CHANNELS = ['whatsapp', 'sms', 'email', 'rcs'];

const WORKER_COUNT = parseInt(process.env.WORKER_COUNT || '50', 10);
const QUEUE_LIMIT  = parseInt(process.env.QUEUE_LIMIT  || '10000', 10);

global.processedCount = 0;
global.stats = {
  total_sent: 0,
  outcomes: { delivered: 0, failed: 0, opened: 0, read: 0, clicked: 0, converted: 0 },
  queue_depth: 0,
  rejected_full: 0,
};

const jobQueue = [];
const workers = new Set();

const app = express();
app.use(express.json());

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

async function sendCallback(callbackUrl, payload) {
  const maxRetries = 3;
  const delays = [1000, 2000, 4000];
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(callbackUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) return true;
      console.error(`Callback non-2xx response: ${res.status} on attempt ${attempt}`);
    } catch (err) {
      console.error(`Callback network error on attempt ${attempt}:`, err.message);
    }
    if (attempt < maxRetries) {
      await new Promise(r => setTimeout(r, delays[attempt - 1]));
    }
  }
  console.error(`Callback failed after ${maxRetries} attempts for ${payload.communication_id} (event=${payload.event})`);
  return false;
}

function buildPayload(job, event, terminal = false) {
  return {
    communication_id: job.communication_id,
    campaign_id:      job.campaign_id,
    customer_id:      job.customer_id,
    channel:          job.channel,
    event,
    terminal,
    timestamp:        new Date().toISOString(),
  };
}

function planOutcome(channel) {
  const sequence = [];
  const deliveryRate = DELIVERY_RATES[channel];

  if (!randomBool(deliveryRate)) {
    sequence.push('sent', 'failed');
    return sequence;
  }
  sequence.push('sent', 'delivered');

  if (!randomBool(ENGAGEMENT_FUNNEL.opened))    return sequence;
  sequence.push('opened');
  if (!randomBool(ENGAGEMENT_FUNNEL.read))      return sequence;
  sequence.push('read');
  if (!randomBool(ENGAGEMENT_FUNNEL.clicked))   return sequence;
  sequence.push('clicked');
  if (!randomBool(ENGAGEMENT_FUNNEL.converted)) return sequence;
  sequence.push('converted');
  return sequence;
}

const STEP_DELAYS = {
  sent:      DELAYS.pending_to_sent,
  delivered: DELAYS.sent_to_delivered,
  failed:    DELAYS.sent_to_delivered,
  opened:    DELAYS.delivered_to_opened,
  read:      DELAYS.opened_to_read,
  clicked:   DELAYS.read_to_clicked,
  converted: DELAYS.clicked_to_converted,
};

async function processJob(job) {
  const { callback_url, channel } = job;

  if (!DELIVERY_RATES[channel]) {
    console.error(`Invalid channel ${channel}, skipping job ${job.id}`);
    global.stats.outcomes.failed++;
    await sendCallback(callback_url, buildPayload(job, 'failed', true));
    return;
  }

  const sequence = planOutcome(channel);

  for (let i = 0; i < sequence.length; i++) {
    const event    = sequence[i];
    const terminal = i === sequence.length - 1;
    const [min, max] = STEP_DELAYS[event];

    await new Promise(r => setTimeout(r, randomDelay(min, max)));
    const ok = await sendCallback(callback_url, buildPayload(job, event, terminal));

    if (event === 'sent') {
      if (!ok) {
        global.stats.outcomes.failed++;
        const failOk = await sendCallback(callback_url, buildPayload(job, 'failed', true));
        if (!failOk) {
          console.error(`ABANDON: comm ${job.communication_id} could not be notified — CRM may need to sweep`);
        }
        return;
      }
      global.processedCount++;
      global.stats.total_sent++;
      continue;
    }

    if (ok && global.stats.outcomes[event] !== undefined) {
      global.stats.outcomes[event]++;
    }
  }
}

async function workerLoop(id) {
  while (true) {
    if (jobQueue.length === 0) {
      await new Promise(r => setTimeout(r, 25));
      continue;
    }
    const job = jobQueue.shift();
    global.stats.queue_depth = jobQueue.length;
    try {
      await processJob(job);
    } catch (err) {
      console.error(`Worker ${id} job ${job.id} crashed:`, err.message);
      sendCallback(job.callback_url, buildPayload(job, 'failed', true)).catch(() => {});
    }
  }
}

for (let i = 0; i < WORKER_COUNT; i++) {
  const p = workerLoop(i);
  workers.add(p);
}

app.post('/send', (req, res) => {
  const { communication_id, campaign_id, customer_id, channel, message, callback_url } = req.body;

  if (!communication_id || !channel || !callback_url) {
    return res.status(400).json({ error: 'Missing required fields: communication_id, channel, callback_url' });
  }
  if (!customer_id) {
    return res.status(400).json({ error: 'Missing required field: customer_id' });
  }
  if (!message) {
    return res.status(400).json({ error: 'Missing required field: message' });
  }
  if (!VALID_CHANNELS.includes(channel)) {
    return res.status(400).json({ error: `Invalid channel: ${channel}. Must be one of: ${VALID_CHANNELS.join(', ')}` });
  }

  if (jobQueue.length >= QUEUE_LIMIT) {
    global.stats.rejected_full++;
    return res.status(429).json({ error: 'Channel service queue full', queue_depth: jobQueue.length });
  }

  const job = {
    id: crypto.randomUUID(),
    communication_id,
    campaign_id,
    customer_id,
    channel,
    message,
    callback_url,
  };
  jobQueue.push(job);
  global.stats.queue_depth = jobQueue.length;

  return res.status(202).json({
    accepted: true,
    job_id: job.id,
    queue_depth: jobQueue.length,
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    processed_total: global.processedCount || 0,
    queue_depth: jobQueue.length,
    workers: WORKER_COUNT,
  });
});

app.get('/stats', (req, res) => {
  res.json({
    total_sent:    global.stats?.total_sent || 0,
    outcomes:      global.stats?.outcomes   || { delivered: 0, failed: 0, opened: 0, read: 0, clicked: 0, converted: 0 },
    queue_depth:   jobQueue.length,
    rejected_full: global.stats?.rejected_full || 0,
    workers:       WORKER_COUNT,
    queue_limit:   QUEUE_LIMIT,
  });
});

const PORT = process.env.PORT || 8002;
app.listen(PORT, () => console.log(`Channel service running on :${PORT} with ${WORKER_COUNT} workers, queue limit ${QUEUE_LIMIT}`));
