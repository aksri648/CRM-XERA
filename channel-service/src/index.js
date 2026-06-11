import express from 'express';
import crypto from 'crypto';
import { queue, processQueue } from './queue.js';

const VALID_CHANNELS = ['whatsapp', 'sms', 'email', 'rcs'];

const app = express();
app.use(express.json());

processQueue();

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
  process.exit(1);
});

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

  queue.push({
    id: crypto.randomUUID(),
    communication_id,
    campaign_id,
    customer_id,
    channel,
    message,
    callback_url,
    queued_at: new Date().toISOString(),
  });

  return res.status(202).json({
    accepted: true,
    job_id: queue[queue.length - 1].id,
    queue_depth: queue.length,
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    queue_depth: queue.length,
    processed_total: global.processedCount || 0,
  });
});

app.get('/stats', (req, res) => {
  res.json({
    total_sent: global.stats?.total_sent || 0,
    outcomes: global.stats?.outcomes || { delivered: 0, failed: 0, opened: 0, read: 0, clicked: 0, converted: 0 },
  });
});

app.listen(8002, () => console.log('Channel service running on :8002'));
