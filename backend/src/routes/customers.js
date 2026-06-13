import { Router } from 'express';
import Customer from '../models/Customer.js';
import Order from '../models/Order.js';
import Segment from '../models/Segment.js';
import { buildMongoQuery } from '../services/segmentation.js';

const router = Router();

const TAG_RULES = {
  active: { lastOrderAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
  vip: { ltv: { $gt: 10000 } },
  at_risk: { $and: [{ ltv: { $gt: 2000 } }, { lastOrderAt: { $lt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000) } }] },
  new: { createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
};

router.get('/distributions', async (req, res, next) => {
  try {
    const now = new Date();

    const [result] = await Customer.aggregate([
      {
        $facet: {
          total: [{ $count: 'count' }],
          ltv: [
            {
              $bucket: {
                groupBy: '$ltv',
                boundaries: [0, 500, 1000, 2500, 5000, 10000, Infinity],
                default: 'other',
                output: {
                  count: { $sum: 1 },
                  avgLtv: { $avg: '$ltv' },
                },
              },
            },
          ],
          orderCount: [
            {
              $bucket: {
                groupBy: '$totalOrders',
                boundaries: [0, 1, 2, 4, 6, Infinity],
                default: 'other',
                output: { count: { $sum: 1 } },
              },
            },
          ],
          recency: [
            {
              $addFields: {
                daysSinceOrder: {
                  $divide: [{ $subtract: [now, '$lastOrderAt'] }, 86400000],
                },
              },
            },
            {
              $bucket: {
                groupBy: '$daysSinceOrder',
                boundaries: [0, 7, 30, 60, 90, Infinity],
                default: 'other',
                output: { count: { $sum: 1 } },
              },
            },
          ],
          city: [
            { $match: { city: { $exists: true, $ne: null } } },
            { $group: { _id: '$city', count: { $sum: 1 }, avgLtv: { $avg: '$ltv' } } },
            { $sort: { count: -1 } },
            { $limit: 20 },
          ],
          gender: [
            { $match: { gender: { $exists: true, $ne: null } } },
            { $group: { _id: '$gender', count: { $sum: 1 } } },
          ],
        },
      },
    ]);

    const ltvBucketLabels = ['0-500', '501-1000', '1001-2500', '2501-5000', '5001-10000', '10001+'];
    const ltvDistribution = (result.ltv || []).map((b, i) => ({
      bucket: ltvBucketLabels[i] || String(b._id),
      count: b.count,
      avgLtv: Math.round(b.avgLtv || 0),
    }));

    const orderBucketLabels = ['0 orders', '1 order', '2-3 orders', '4-5 orders', '6+ orders'];
    const orderCountDistribution = (result.orderCount || []).map((b, i) => ({
      bucket: orderBucketLabels[i] || String(b._id),
      count: b.count,
    }));

    const recencyBucketLabels = ['0-7 days', '8-30 days', '31-60 days', '61-90 days', '90+ days'];
    const recencyDistribution = (result.recency || []).map((b, i) => ({
      bucket: recencyBucketLabels[i] || String(b._id),
      count: b.count,
    }));

    res.json({
      totalCustomers: result.total[0]?.count || 0,
      ltvDistribution,
      orderCountDistribution,
      recencyDistribution,
      cityDistribution: result.city || [],
      genderDistribution: result.gender || [],
    });
  } catch (err) { next(err); }
});

router.get('/', async (req, res, next) => {
  try {
    const { search, tag, segment: segmentId, page = 1, limit = 12, sort } = req.query;
    const query = {};

    if (segmentId) {
      const segment = await Segment.findById(segmentId).lean();
      if (segment) {
        const segmentQuery = buildMongoQuery(segment.filterRules, segment.logic);
        Object.assign(query, segmentQuery);
      }
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }
    if (tag) {
      const tagQuery = TAG_RULES[tag];
      if (tagQuery) Object.assign(query, tagQuery);
    }
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
    try {
      const result = await Customer.insertMany(customers, { ordered: false });
      inserted = result.length;
    } catch (err) {
      if (err.writeErrors) {
        inserted = err.insertedDocs.length;
        skipped = err.writeErrors.length;
        errors = err.writeErrors.map((e, i) => ({ email: customers[e.index]?.email, error: e.errmsg }));
      } else if (err.code === 11000) {
        skipped = 1;
      } else {
        throw err;
      }
    }
    res.json({ inserted, skipped, errors });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id).lean();
    if (!customer) return res.status(404).json({ error: 'Not found' });
    const orders = await Order.find({ customerId: req.params.id }).sort({ orderedAt: -1 }).limit(20).lean();
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
