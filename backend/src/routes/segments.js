import { Router } from 'express';
import { requireAuth } from '@clerk/express';
import Segment from '../models/Segment.js';
import Customer from '../models/Customer.js';
import { buildMongoQuery } from '../services/segmentation.js';

const router = Router();
router.use(requireAuth());

router.get('/', async (req, res, next) => {
  try {
    const { created_by } = req.query;
    const query = created_by ? { createdBy: created_by } : {};
    const segments = await Segment.find(query).sort({ createdAt: -1 });
    res.json({ segments });
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    if (req.body.name) {
      const existing = await Segment.findOne({ name: { $regex: `^${req.body.name}$`, $options: 'i' } });
      if (existing) return res.status(200).json({ segment: existing });
    }
    const segment = await Segment.create(req.body);
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
    const segment = await Segment.findById(req.params.id);
    if (!segment) return res.status(404).json({ error: 'Not found' });
    res.json({ segment });
  } catch (err) { next(err); }
});

router.get('/:id/customers', async (req, res, next) => {
  try {
    const segment = await Segment.findById(req.params.id);
    if (!segment) return res.status(404).json({ error: 'Not found' });
    const mongoQuery = buildMongoQuery(segment.filterRules, segment.logic);
    const { page = 1, limit = 20 } = req.query;
    const total = await Customer.countDocuments(mongoQuery);
    const customers = await Customer.find(mongoQuery)
      .skip((page - 1) * limit)
      .limit(Number(limit));
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
