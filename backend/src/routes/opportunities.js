import { Router } from 'express';
import Opportunity from '../models/Opportunity.js';
import AgentProposal from '../models/AgentProposal.js';
import Customer from '../models/Customer.js';
import Campaign from '../models/Campaign.js';
import Order from '../models/Order.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};
    const opportunities = await Opportunity.find(query).sort({ createdAt: -1 }).lean();
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

    const [totalCustomers, customersByCity, ltvSegments, totalOrders, topCampaigns, lapsedCount] = await Promise.all([
      Customer.countDocuments(),
      Customer.aggregate([
        { $group: { _id: '$city', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
      Customer.aggregate([
        {
          $bucket: {
            groupBy: '$ltv',
            boundaries: [0, 1000, 5000, 10000, 50000, 100000],
            default: 'unknown',
            output: { count: { $sum: 1 } },
          },
        },
      ]),
      Order.countDocuments(),
      Campaign.find({ status: 'completed' })
        .sort({ 'stats.revenue': -1 })
        .limit(5)
        .select('name channel stats')
        .lean(),
      Customer.countDocuments({
        lastOrderAt: { $lt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) },
        ltv: { $gt: 0 },
      }),
    ]);

    const context = {
      total_customers: totalCustomers,
      customers_by_city: customersByCity.reduce((acc, c) => ({ ...acc, [c._id]: c.count }), {}),
      ltv_segments: ltvSegments.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
      total_orders: totalOrders,
      top_campaigns: topCampaigns.map(c => ({
        name: c.name,
        channel: c.channel,
        revenue: c.stats?.revenue || 0,
        sent: c.stats?.sent || 0,
      })),
      lapsed_high_value_customers: lapsedCount,
      scan_request: 'Find top marketing opportunities, trending marketing catchphrases, and campaign ideas',
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000);

    const response = await fetch(`${agentServiceUrl}/crew/opportunities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ context }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      const text = await response.text();
      return res.status(502).json({ error: 'Agent service error', detail: text });
    }
    const result = await response.json();
    const opps = result.opportunities || [];
    const docs = opps.map(opp => ({
      title: opp.title,
      description: opp.description,
      audienceDescription: opp.audience_description,
      expectedRevenue: opp.expected_revenue_inr,
      aiReasoning: opp.ai_reasoning,
    }));
    const created = docs.length > 0 ? await Opportunity.insertMany(docs) : [];
    res.json({ opportunities: created, count: created.length });
  } catch (err) {
    if (err.name === 'AbortError') {
      return res.status(504).json({ error: 'Agent service timed out', opportunities: [] });
    }
    next(err);
  }
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
    const opp = await Opportunity.findById(req.params.id).lean();
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
