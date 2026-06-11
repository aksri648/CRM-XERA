import { Router } from 'express';
import { requireAuth } from '@clerk/express';
import Customer from '../models/Customer.js';
import Order from '../models/Order.js';

const router = Router();
router.use(requireAuth());

router.get('/', async (req, res, next) => {
  try {
    const { search, tag, page = 1, limit = 12 } = req.query;
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }
    if (tag) query.tags = { $in: [tag] };
    const total = await Customer.countDocuments(query);
    const customers = await Customer.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ customers, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const customer = await Customer.create(req.body);
    res.status(201).json({ customer });
  } catch (err) { next(err); }
});

router.post('/bulk', async (req, res, next) => {
  try {
    const { customers } = req.body;
    if (!Array.isArray(customers)) return res.status(400).json({ error: 'customers must be an array' });
    if (customers.length > 10000) return res.status(400).json({ error: 'Maximum 10000 customers per request' });
    let inserted = 0, skipped = 0, errors = [];
    for (const c of customers) {
      try {
        await Customer.create(c);
        inserted++;
      } catch (err) {
        if (err.code === 11000) skipped++;
        else errors.push({ email: c.email, error: err.message });
      }
    }
    res.json({ inserted, skipped, errors });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ error: 'Not found' });
    const orders = await Order.find({ customerId: req.params.id }).sort({ orderedAt: -1 }).limit(20);
    res.json({ customer, orders });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

export default router;
