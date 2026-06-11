import { Router } from 'express';
import { requireAuth } from '@clerk/express';
import Customer from '../models/Customer.js';
import Order from '../models/Order.js';

const router = Router();
router.use(requireAuth());

router.get('/distributions', async (req, res, next) => {
  try {
    const totalCustomers = await Customer.countDocuments();

    const ltvBuckets = [
      { bucket: '0-500', min: 0, max: 500 },
      { bucket: '501-1000', min: 501, max: 1000 },
      { bucket: '1001-2500', min: 1001, max: 2500 },
      { bucket: '2501-5000', min: 2501, max: 5000 },
      { bucket: '5001-10000', min: 5001, max: 10000 },
      { bucket: '10001+', min: 10001, max: Infinity },
    ];
    const ltvDistribution = await Promise.all(ltvBuckets.map(async (b) => {
      const count = await Customer.countDocuments({ ltv: { $gte: b.min, $lt: b.max } });
      const agg = await Customer.aggregate([
        { $match: { ltv: { $gte: b.min, $lt: b.max } } },
        { $group: { _id: null, avgLtv: { $avg: '$ltv' } } },
      ]);
      return { bucket: b.bucket, count, avgLtv: Math.round(agg[0]?.avgLtv || 0) };
    }));

    const orderBuckets = [
      { bucket: '0 orders', min: 0, max: 0 },
      { bucket: '1 order', min: 1, max: 1 },
      { bucket: '2-3 orders', min: 2, max: 3 },
      { bucket: '4-5 orders', min: 4, max: 5 },
      { bucket: '6+ orders', min: 6, max: Infinity },
    ];
    const orderCountDistribution = await Promise.all(orderBuckets.map(async (b) => {
      const count = await Customer.countDocuments({ totalOrders: { $gte: b.min, $lt: b.max === Infinity ? 999999 : b.max } });
      return { bucket: b.bucket, count };
    }));

    const now = new Date();
    const recencyBuckets = [
      { bucket: '0-7 days', min: 0, max: 7 },
      { bucket: '8-30 days', min: 8, max: 30 },
      { bucket: '31-60 days', min: 31, max: 60 },
      { bucket: '61-90 days', min: 61, max: 90 },
      { bucket: '90+ days', min: 91, max: Infinity },
    ];
    const recencyDistribution = await Promise.all(recencyBuckets.map(async (b) => {
      const cutoffOld = new Date(now);
      cutoffOld.setDate(cutoffOld.getDate() - b.min);
      const cutoffNew = new Date(now);
      cutoffNew.setDate(cutoffNew.getDate() - b.max);
      const count = await Customer.countDocuments({
        lastOrderAt: { $gte: b.max === Infinity ? new Date(0) : cutoffNew, $lt: cutoffOld },
      });
      return { bucket: b.bucket, count };
    }));

    const cityDistribution = await Customer.aggregate([
      { $match: { city: { $exists: true, $ne: null } } },
      { $group: { _id: '$city', count: { $sum: 1 }, avgLtv: { $avg: '$ltv' } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]);

    const genderDistribution = await Customer.aggregate([
      { $match: { gender: { $exists: true, $ne: null } } },
      { $group: { _id: '$gender', count: { $sum: 1 } } },
    ]);

    res.json({
      totalCustomers,
      ltvDistribution,
      orderCountDistribution,
      recencyDistribution,
      cityDistribution,
      genderDistribution,
    });
  } catch (err) { next(err); }
});

router.get('/', async (req, res, next) => {
  try {
    const { search, tag, page = 1, limit = 12, sort } = req.query;
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
    const sortMap = { ltv: { ltv: -1 }, createdAt: { createdAt: -1 }, lastOrderAt: { lastOrderAt: -1 } };
    const sortObj = sortMap[sort] || { createdAt: -1 };
    const customers = await Customer.find(query)
      .sort(sortObj)
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
