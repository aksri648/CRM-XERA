import { Router } from 'express';
import { requireAuth } from '@clerk/express';
import Opportunity from '../models/Opportunity.js';
import AgentProposal from '../models/AgentProposal.js';

const router = Router();
router.use(requireAuth());

router.get('/', async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};
    const opportunities = await Opportunity.find(query).sort({ createdAt: -1 });
    res.json({ opportunities });
  } catch (err) { next(err); }
});

router.get('/count', async (req, res, next) => {
  try {
    const count = await Opportunity.countDocuments({ status: 'active' });
    res.json({ count });
  } catch (err) { next(err); }
});

router.post('/scan', async (req, res, next) => {
  try {
    const agentServiceUrl = process.env.AGENT_SERVICE_URL || 'http://localhost:8001';
    const context = { message: 'Scan for new marketing opportunities' };
    const response = await fetch(`${agentServiceUrl}/crew/opportunities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ context }),
    });
    if (!response.ok) {
      const text = await response.text();
      return res.status(502).json({ error: 'Agent service error', detail: text });
    }
    const result = await response.json();
    const opps = result.opportunities || [];
    const created = [];
    for (const opp of opps) {
      const doc = await Opportunity.create({
        title: opp.title,
        description: opp.description,
        audienceDescription: opp.audience_description,
        expectedRevenue: opp.expected_revenue_inr,
        aiReasoning: opp.ai_reasoning,
      });
      created.push(doc);
    }
    res.json({ opportunities: created, count: created.length });
  } catch (err) { next(err); }
});

router.patch('/:id/dismiss', async (req, res, next) => {
  try {
    const opp = await Opportunity.findByIdAndUpdate(req.params.id, { status: 'dismissed' });
    if (!opp) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

router.post('/:id/generate-campaign', async (req, res, next) => {
  try {
    const opp = await Opportunity.findById(req.params.id);
    if (!opp) return res.status(404).json({ error: 'Not found' });
    const proposal = await AgentProposal.create({
      title: `Campaign: ${opp.title}`,
      aiReasoning: opp.aiReasoning,
      status: 'pending',
    });
    res.json({ proposal });
  } catch (err) { next(err); }
});

export default router;
