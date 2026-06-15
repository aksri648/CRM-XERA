import { Router } from 'express';
import mongoose from 'mongoose';
import Campaign from '../models/Campaign.js';
import Segment from '../models/Segment.js';
import Customer from '../models/Customer.js';
import Opportunity from '../models/Opportunity.js';
import AgentProposal from '../models/AgentProposal.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.post('/chat', async (req, res, next) => {
  try {
    const { session_id, message } = req.body;
    const userId = req.userId;
    const [recentCampaigns, segments, total_campaigns, total_segments] = await Promise.all([
      Campaign.find({ userId }).sort({ createdAt: -1 }).limit(5).select('name channel status stats createdAt').lean(),
      Segment.find({ userId }).limit(10).select('name description customerCount').lean(),
      Campaign.countDocuments({ userId }),
      Segment.countDocuments({ userId }),
    ]);
    const context = {
      recent_campaigns: recentCampaigns,
      segments,
      total_campaigns,
      total_segments,
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
    const context = { userId: req.userId };
    const agentResponse = await fetch(`${agentServiceUrl}/crew/command`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id, message, context }),
    });

    if (!agentResponse.ok) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.write(`data: ${JSON.stringify({ type: 'error', message: 'Agent service unreachable' })}\n\n`);
      res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
      return res.end();
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

const TOOL_DISPATCH = {
  create_customer: (p) => ({ method: 'POST', path: '/api/customers', body: p }),
  delete_customer: (p) => ({ method: 'DELETE', path: `/api/customers/${p.id}` }),

  create_campaign: (p) => ({ method: 'POST', path: '/api/campaigns', body: p }),
  update_campaign: (p) => ({ method: 'PATCH', path: `/api/campaigns/${p.id}`, body: p.patch || {} }),
  launch_campaign: (p) => ({ method: 'POST', path: `/api/campaigns/${p.id}/launch` }),
  stop_campaign:   (p) => ({ method: 'PATCH', path: `/api/campaigns/${p.id}/stop` }),
  delete_campaign: (p) => ({ method: 'DELETE', path: `/api/campaigns/${p.id}` }),

  create_segment: (p) => ({ method: 'POST', path: '/api/segments', body: p }),
  delete_segment: (p) => ({ method: 'DELETE', path: `/api/segments/${p.id}` }),

  dismiss_opportunity:               (p) => ({ method: 'PATCH', path: `/api/opportunities/${p.id}/dismiss` }),
  generate_campaign_from_opportunity:(p) => ({ method: 'POST',  path: `/api/opportunities/${p.id}/generate-campaign` }),

  approve_proposal: (p) => ({ method: 'PATCH', path: `/api/proposals/${p.id}/approve` }),
  reject_proposal:  (p) => ({ method: 'PATCH', path: `/api/proposals/${p.id}/reject` }),
  update_proposal:  (p) => ({ method: 'PATCH', path: `/api/proposals/${p.id}`, body: p.patch || {} }),

  update_settings: (p) => ({ method: 'PUT', path: '/api/settings', body: p }),
};

const ID_FIELD_RESOLVERS = {
  create_campaign:   [{ field: 'segmentId', Model: Segment }],
  update_campaign:   [{ field: 'id', Model: Campaign }],
  launch_campaign:   [{ field: 'id', Model: Campaign }],
  stop_campaign:     [{ field: 'id', Model: Campaign }],
  delete_campaign:   [{ field: 'id', Model: Campaign }],
  delete_customer:   [{ field: 'id', Model: Customer }],
  delete_segment:    [{ field: 'id', Model: Segment }],
  dismiss_opportunity: [{ field: 'id', Model: Opportunity }],
  generate_campaign_from_opportunity: [{ field: 'id', Model: Opportunity }],
  approve_proposal:  [{ field: 'id', Model: AgentProposal }],
  reject_proposal:   [{ field: 'id', Model: AgentProposal }],
  update_proposal:   [{ field: 'id', Model: AgentProposal }],
};

const NAME_FIELDS = new Map([
  [Campaign, 'name'],
  [Segment, 'name'],
  [Customer, 'name'],
  [Opportunity, 'title'],
  [AgentProposal, 'title'],
]);

const isObjectId = (v) => typeof v === 'string' && /^[0-9a-fA-F]{24}$/.test(v) && mongoose.Types.ObjectId.isValid(v);

const escapeRegex = (s) => s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');

async function resolveByName(Model, value, userId) {
  if (!value || typeof value !== 'string') return null;
  const nameField = NAME_FIELDS.get(Model) || 'name';
  const pattern = escapeRegex(value).trim();
  if (!pattern) return null;
  const match = { userId };
  match[nameField] = { $regex: `^${pattern}$`, $options: 'i' };
  let doc = await Model.findOne(match).select('_id').lean();
  if (doc) return String(doc._id);
  const matchSub = { userId };
  matchSub[nameField] = { $regex: pattern, $options: 'i' };
  doc = await Model.findOne(matchSub).select('_id').lean();
  return doc ? String(doc._id) : null;
}

async function resolveEntityIds(tool, params, userId) {
  const resolvers = ID_FIELD_RESOLVERS[tool] || [];
  for (const { field, Model } of resolvers) {
    const value = params[field];
    if (!value || isObjectId(value)) continue;
    const resolved = await resolveByName(Model, value, userId);
    if (!resolved) {
      const nameField = NAME_FIELDS.get(Model) || 'name';
      throw new Error(`No ${Model.modelName} found matching "${value}" by ${nameField}. Use the list tool to get a real ID.`);
    }
    params[field] = resolved;
  }
}

router.post('/execute', async (req, res) => {
  const { tool, params } = req.body || {};
  if (!tool || !TOOL_DISPATCH[tool]) {
    return res.status(400).json({ ok: false, error: `Unknown or disallowed tool: ${tool}` });
  }
  const resolved = { ...(params || {}) };
  try {
    await resolveEntityIds(tool, resolved, req.userId);
  } catch (err) {
    return res.status(200).json({ ok: false, error: err.message });
  }
  try {
    const { method, path, body } = TOOL_DISPATCH[tool](resolved);
    const baseUrl = `http://localhost:${process.env.PORT || 8000}`;
    const init = { method, headers: { 'Content-Type': 'application/json' } };
    if (body !== undefined) init.body = JSON.stringify(body);
    const upstream = await fetch(`${baseUrl}${path}`, init);
    const text = await upstream.text();
    let parsed;
    try { parsed = text ? JSON.parse(text) : {}; } catch { parsed = { raw: text }; }
    if (!upstream.ok) {
      return res.status(200).json({ ok: false, status: upstream.status, error: parsed?.error || text || 'Backend error' });
    }
    res.json({ ok: true, tool, result: parsed, resolvedParams: resolved });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.get('/system-status', async (req, res, next) => {
  try {
    const active_campaigns = await Campaign.countDocuments({ userId: req.userId, status: 'running' });
    res.json({ active_campaigns });
  } catch (err) { next(err); }
});

export default router;
