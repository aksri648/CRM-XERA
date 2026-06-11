import { Router } from 'express';
import { requireAuth } from '@clerk/express';
import Order from '../models/Order.js';

const router = Router();
router.use(requireAuth());

router.get('/', async (req, res, next) => {
  try {
    const { customerId, page = 1, limit = 20 } = req.query;
    const query = customerId ? { customerId } : {};
    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .sort({ orderedAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ orders, total, page: Number(page) });
  } catch (err) { next(err); }
});

router.post('/bulk', async (req, res, next) => {
  try {
    const { orders } = req.body;
    if (!Array.isArray(orders)) return res.status(400).json({ error: 'orders must be an array' });
    if (orders.length > 10000) return res.status(400).json({ error: 'Maximum 10000 orders per request' });
    const inserted = await Order.insertMany(orders, { ordered: false });
    res.json({ inserted: inserted.length });
  } catch (err) { next(err); }
});

export default router;
