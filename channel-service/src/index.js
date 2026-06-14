import express from 'express';
import crypto from 'crypto';
import { DELIVERY_RATES, ENGAGEMENT_FUNNEL, DELAYS, randomDelay, randomBool } from './simulator.js';

const VALID_CHANNELS = ['whatsapp', 'sms', 'email', 'rcs'];

global.processedCount = 0;
global.stats = {
  total_sent: 0,
  outcomes: { delivered: 0, failed: 0, opened: 0, read: 0, clicked: 0, converted: 0 },
};

const app = express();
app.use(express.json());

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
  process.exit(1);
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
  console.error(`Callback failed after ${maxRetries} attempts for ${payload.communication_id}`);
  return false;
}

function buildPayload(job, event) {
  return {
    communication_id: job.communication_id,
    campaign_id:      job.campaign_id,
    customer_id:      job.customer_id,
    channel:          job.channel,
    event,
    timestamp:        new Date().toISOString(),
  };
}

async function processJob(job) {
  const { callback_url, channel } = job;

  const deliveryRate = DELIVERY_RATES[channel];
  if (!deliveryRate) {
    console.error(`Invalid channel ${channel}, skipping job ${job.id}`);
    global.stats.outcomes.failed++;
    await sendCallback(callback_url, buildPayload(job, 'failed'));
    return;
  }

  await new Promise(r => setTimeout(r, randomDelay(...DELAYS.pending_to_sent)));
  await sendCallback(callback_url, buildPayload(job, 'sent'));
  global.stats.total_sent++;

  await new Promise(r => setTimeout(r, randomDelay(...DELAYS.sent_to_delivered)));
  const isDelivered = randomBool(deliveryRate);

  if (!isDelivered) {
    await sendCallback(callback_url, buildPayload(job, 'failed'));
    global.stats.outcomes.failed++;
    return;
  }

  await sendCallback(callback_url, buildPayload(job, 'delivered'));
  global.stats.outcomes.delivered++;

  if (!randomBool(ENGAGEMENT_FUNNEL.opened)) return;
  await new Promise(r => setTimeout(r, randomDelay(...DELAYS.delivered_to_opened)));
  await sendCallback(callback_url, buildPayload(job, 'opened'));
  global.stats.outcomes.opened++;

  if (!randomBool(ENGAGEMENT_FUNNEL.read)) return;
  await new Promise(r => setTimeout(r, randomDelay(...DELAYS.opened_to_read)));
  await sendCallback(callback_url, buildPayload(job, 'read'));

  if (!randomBool(ENGAGEMENT_FUNNEL.clicked)) return;
  await new Promise(r => setTimeout(r, randomDelay(...DELAYS.read_to_clicked)));
  await sendCallback(callback_url, buildPayload(job, 'clicked'));
  global.stats.outcomes.clicked++;

  if (!randomBool(ENGAGEMENT_FUNNEL.converted)) return;
  await new Promise(r => setTimeout(r, randomDelay(...DELAYS.clicked_to_converted)));
  await sendCallback(callback_url, buildPayload(job, 'converted'));
  global.stats.outcomes.converted++;
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

  const job = {
    id: crypto.randomUUID(),
    communication_id,
    campaign_id,
    customer_id,
    channel,
    message,
    callback_url,
  };

  processJob(job).catch(err => {
    console.error(`Job ${job.id} failed with error:`, err.message);
    sendCallback(callback_url, buildPayload(job, 'failed')).catch(() => {});
  });
  global.processedCount++;

  return res.status(202).json({
    accepted: true,
    job_id: job.id,
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    processed_total: global.processedCount || 0,
  });
});

app.get('/stats', (req, res) => {
  res.json({
    total_sent: global.stats?.total_sent || 0,
    outcomes: global.stats?.outcomes || { delivered: 0, failed: 0, opened: 0, read: 0, clicked: 0, converted: 0 },
  });
});

const PORT = process.env.PORT || 8002;
app.listen(PORT, () => console.log(`Channel service running on :${PORT}`));
