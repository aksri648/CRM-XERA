import { Router } from 'express';
import Campaign from '../models/Campaign.js';
import Segment from '../models/Segment.js';

const router = Router();

router.post('/chat', async (req, res, next) => {
  try {
    const { session_id, message } = req.body;
    const recentCampaigns = await Campaign.find().sort({ createdAt: -1 }).limit(5).lean();
    const segments = await Segment.find().limit(10).lean();
    const context = {
      recent_campaigns: recentCampaigns,
      segments,
      total_campaigns: await Campaign.countDocuments(),
      total_segments: await Segment.countDocuments(),
    };

    const agentServiceUrl = process.env.AGENT_SERVICE_URL || 'http://localhost:8001';
    const agentResponse = await fetch(`${agentServiceUrl}/crew/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id, message, context }),
    });

    if (!agentResponse.ok) {
      return res.status(502).json({ error: 'Agent service error' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const reader = agentResponse.body.getReader();
    const decoder = new TextDecoder();
    let closed = false;
    req.on('close', () => { closed = true; });

    while (true) {
      const { done, value } = await reader.read();
      if (done || closed) { res.end(); break; }
      res.write(decoder.decode(value));
    }
  } catch (err) {
    res.write(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`);
    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();
  }
});

router.post('/command', async (req, res, next) => {
  try {
    const { session_id, message } = req.body;
    const agentServiceUrl = process.env.AGENT_SERVICE_URL || 'http://localhost:8001';
    const agentResponse = await fetch(`${agentServiceUrl}/crew/command`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id, message, context: {} }),
    });

    if (!agentResponse.ok) {
      return res.status(502).json({ error: 'Agent service error' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const reader = agentResponse.body.getReader();
    const decoder = new TextDecoder();
    let closed = false;
    req.on('close', () => { closed = true; });

    while (true) {
      const { done, value } = await reader.read();
      if (done || closed) { res.end(); break; }
      res.write(decoder.decode(value));
    }
  } catch (err) {
    res.write(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`);
    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();
  }
});

router.post('/confirm', async (req, res, next) => {
  try {
    const { session_id, action, data } = req.body;
    res.json({ success: true, result: { acknowledged: true } });
  } catch (err) { next(err); }
});

router.get('/system-status', async (req, res, next) => {
  try {
    const active_campaigns = await Campaign.countDocuments({ status: 'running' });
    res.json({ active_campaigns, queue_depth: 0, worker_health: 'healthy' });
  } catch (err) { next(err); }
});

export default router;
