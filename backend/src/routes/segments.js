import { Router } from 'express';
import Segment from '../models/Segment.js';
import Customer from '../models/Customer.js';
import { buildMongoQuery } from '../services/segmentation.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { created_by } = req.query;
    const match = created_by ? { createdBy: created_by } : {};
    const segments = await Segment.aggregate([
      { $match: match },
      { $sort: { createdAt: -1 } },
      { $group: { _id: { $toLower: '$name' }, doc: { $first: '$$ROOT' } } },
      { $replaceRoot: { newRoot: '$doc' } },
      { $sort: { createdAt: -1 } },
    ]);
    res.json({ segments });
  } catch (err) { next(err); }
});

router.post('/generate', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '');

    const response = await fetch(`${process.env.AGENT_SERVICE_URL || 'http://localhost:8001'}/api/crew/segment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: err });
    }

    const result = await response.json();
    res.json({ ok: true, segments: result });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    if (!req.body.name) return res.status(400).json({ error: 'name is required' });
    const { filterRules, logic } = req.body;
    const mongoQuery = buildMongoQuery(filterRules || [], logic || 'AND');
    const customerCount = await Customer.countDocuments(mongoQuery);
    const segment = await Segment.findOneAndUpdate(
      { name: { $regex: `^${req.body.name}$`, $options: 'i' } },
      { $setOnInsert: { ...req.body, customerCount } },
      { upsert: true, new: true, runValidators: true }
    );
    if (segment.customerCount !== customerCount) {
      segment.customerCount = customerCount;
      await segment.save();
    }
    res.status(201).json({ segment });
  } catch (err) { next(err); }
});

router.post('/preview', async (req, res, next) => {
  try {
    const { filterRules, logic } = req.body;
    const mongoQuery = buildMongoQuery(filterRules, logic);
    const count = await Customer.countDocuments(mongoQuery);
    const sample = await Customer.find(mongoQuery).limit(3).select('name email city ltv');
    res.json({ count, sample });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const segment = await Segment.findById(req.params.id).lean();
    if (!segment) return res.status(404).json({ error: 'Not found' });
    res.json({ segment });
  } catch (err) { next(err); }
});

router.get('/:id/customers', async (req, res, next) => {
  try {
    const segment = await Segment.findById(req.params.id).lean();
    if (!segment) return res.status(404).json({ error: 'Not found' });
    const mongoQuery = buildMongoQuery(segment.filterRules, segment.logic);
    const { page = 1, limit = 20 } = req.query;
    const total = await Customer.countDocuments(mongoQuery);
    const customers = await Customer.find(mongoQuery)
      .select('name email phone city gender tags ltv totalOrders lastOrderAt')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();
    res.json({ customers, total, page: Number(page) });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await Segment.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

export default router;
