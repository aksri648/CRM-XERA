import { DELIVERY_RATES, ENGAGEMENT_FUNNEL, DELAYS, randomDelay, randomBool } from './simulator.js';

export const queue = [];
global.processedCount = 0;
global.stats = {
  total_sent: 0,
  outcomes: { delivered: 0, failed: 0, opened: 0, read: 0, clicked: 0, converted: 0 },
};

const RETRY_DELAYS = [1000, 2000, 4000];

async function sendCallback(callbackUrl, payload, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
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
    if (attempt < retries) {
      await new Promise(r => setTimeout(r, RETRY_DELAYS[attempt - 1]));
    }
  }
  console.error(`Callback failed after ${retries} attempts for ${payload.communication_id}`);
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

  await new Promise(r => setTimeout(r, randomDelay(...DELAYS.queued_to_sent)));
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

export async function processQueue() {
  while (true) {
    if (queue.length > 0) {
      const job = queue.shift();
      global.processedCount++;
      try {
        await processJob(job);
      } catch (err) {
        console.error(`Job ${job.id} failed with error:`, err.message);
        try {
          await sendCallback(job.callback_url, buildPayload(job, 'failed'));
        } catch (_) {}
      }
    }
    await new Promise(r => setTimeout(r, 50));
  }
}
