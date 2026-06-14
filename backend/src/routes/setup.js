import { Router } from 'express';
import { faker } from '@faker-js/faker';
import Customer from '../models/Customer.js';
import Order from '../models/Order.js';
import Segment from '../models/Segment.js';
import Campaign from '../models/Campaign.js';
import Communication from '../models/Communication.js';
import Opportunity from '../models/Opportunity.js';
import AgentProposal from '../models/AgentProposal.js';
import Settings from '../models/Settings.js';
import PipelineEvent from '../models/PipelineEvent.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

const INDIAN_CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Pune', 'Kolkata', 'Jaipur', 'Ahmedabad', 'Surat', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane'];
const PRODUCTS = [
  { name: 'Cotton Kurta', category: 'fashion' }, { name: 'Silk Saree', category: 'fashion' },
  { name: 'Face Moisturizer', category: 'beauty' }, { name: 'Hair Oil', category: 'beauty' },
  { name: 'Organic Spices', category: 'food' }, { name: 'Premium Tea', category: 'food' },
  { name: 'Wireless Earbuds', category: 'electronics' }, { name: 'Smart Watch', category: 'electronics' },
  { name: 'Leather Wallet', category: 'accessories' }, { name: 'Handbag', category: 'accessories' },
];

function generateIndianPhone() {
  const first = faker.helpers.arrayElement(['6', '7', '8', '9']);
  return first + faker.string.numeric(9);
}

function buildMongoQuery(filterRules, logic) {
  if (!filterRules || filterRules.length === 0) return {};
  const conditions = filterRules.map(rule => {
    const { field, operator, value } = rule;
    if (field === 'last_order_days') {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - Number(value));
      return operator === 'gt' ? { lastOrderAt: { $lt: cutoff } } : { lastOrderAt: { $gte: cutoff } };
    }
    const mongoOp = { gt: '$gt', lt: '$lt', eq: '$eq', gte: '$gte', lte: '$lte', contains: '$in', not_contains: '$nin' }[operator];
    if (!mongoOp) return {};
    const queryValue = operator === 'contains' || operator === 'not_contains' ? (Array.isArray(value) ? value : [value]) : (isNaN(value) ? value : Number(value));
    return { [field]: { [mongoOp]: queryValue } };
  }).filter(Boolean);
  if (conditions.length === 0) return {};
  return logic === 'AND' ? { $and: conditions } : { $or: conditions };
}

router.get('/check', async (req, res, next) => {
  try {
    const count = await Customer.countDocuments({ userId: req.userId });
    res.json({ hasData: count > 0, customerCount: count });
  } catch (err) { next(err); }
});

router.post('/seed', async (req, res, next) => {
  try {
    const userId = req.userId;

    const existing = await Customer.countDocuments({ userId });
    if (existing > 0) {
      return res.json({ ok: true, message: 'Data already exists', skipped: true });
    }

    const customers = [];
    for (let i = 0; i < 10000; i++) {
      const first = faker.person.firstName();
      const last = faker.person.lastName();
      customers.push({
        userId,
        name: `${first} ${last}`,
        email: `${first.toLowerCase()}.${last.toLowerCase()}.${i}@email.com`,
        phone: generateIndianPhone(),
        city: faker.helpers.arrayElement(INDIAN_CITIES),
        gender: faker.helpers.arrayElement(['male', 'female', 'other']),
        age: faker.number.int({ min: 18, max: 65 }),
        tags: [],
        ltv: 0,
        totalOrders: 0,
        lastOrderAt: null,
      });
    }
    const insertedCustomers = await Customer.insertMany(customers);

    const orders = [];
    for (let i = 0; i < 30000; i++) {
      const customer = insertedCustomers[faker.number.int({ min: 0, max: insertedCustomers.length - 1 })];
      const product = faker.helpers.arrayElement(PRODUCTS);
      orders.push({
        userId,
        customerId: customer._id,
        productName: product.name,
        category: product.category,
        amount: faker.number.int({ min: 200, max: 15000 }),
        orderedAt: new Date(Date.now() - faker.number.int({ min: 0, max: 730 }) * 86400000),
      });
    }
    await Order.insertMany(orders);

    const agg = await Order.aggregate([
      { $match: { userId } },
      { $group: { _id: '$customerId', totalAmount: { $sum: '$amount' }, count: { $sum: 1 }, lastOrder: { $max: '$orderedAt' } } },
    ]);
    if (agg.length > 0) {
      await Customer.bulkWrite(agg.map(a => ({
        updateOne: { filter: { _id: a._id }, update: { $set: { ltv: a.totalAmount, totalOrders: a.count, lastOrderAt: a.lastOrder } } },
      })));
    }

    const aiSegments = [
      { name: 'VIP Customers', description: 'Customers with LTV > ₹10,000', filterRules: [{ field: 'ltv', operator: 'gt', value: 10000 }], logic: 'AND', createdBy: 'agent' },
      { name: 'Inactive 60+ Days', description: 'Customers inactive for over 60 days', filterRules: [{ field: 'last_order_days', operator: 'gt', value: 60 }], logic: 'AND', createdBy: 'agent' },
      { name: 'High-Value Fashion Buyers', description: 'Fashion category buyers with high LTV', filterRules: [{ field: 'ltv', operator: 'gt', value: 5000 }, { field: 'category', operator: 'contains', value: 'fashion' }], logic: 'AND', createdBy: 'agent' },
      { name: 'New Customers', description: 'Customers who joined in the last 30 days', filterRules: [{ field: 'last_order_days', operator: 'lte', value: 30 }], logic: 'AND', createdBy: 'agent' },
      { name: 'At-Risk Reactivation', description: 'High LTV customers at risk of churning', filterRules: [{ field: 'ltv', operator: 'gt', value: 2000 }, { field: 'last_order_days', operator: 'gt', value: 45 }], logic: 'AND', createdBy: 'agent' },
    ];
    for (const s of aiSegments) {
      const count = await Customer.countDocuments({ ...buildMongoQuery(s.filterRules, s.logic), userId });
      await Segment.create({ ...s, userId, customerCount: count });
    }

    const campaign = await Campaign.create({
      userId, name: 'Summer Sale 2025', channel: 'whatsapp',
      messageTemplate: 'Hey {name}! Summer sale is here with up to 50% off!',
      status: 'completed',
      stats: { sent: 5000, delivered: 4600, opened: 2070, read: 1449, clicked: 434, converted: 52, revenue: 52000 },
      createdBy: 'agent',
      launchedAt: new Date(Date.now() - 30 * 86400000),
      completedAt: new Date(Date.now() - 25 * 86400000),
    });

    const opps = [
      { title: 'Reactivate High-Value Lapsing Customers', description: '12% of top-tier customers haven\'t purchased in 60+ days', audienceDescription: 'Customers with LTV > ₹10,000, inactive 60+ days', expectedRevenue: 450000, aiReasoning: 'Historical data shows 18% reactivation rate for this segment' },
      { title: 'Cross-sell Beauty to Fashion Buyers', description: 'Fashion buyers rarely purchase beauty products', audienceDescription: 'Fashion category buyers, no beauty purchases', expectedRevenue: 280000, aiReasoning: 'Beauty has 45% margin and 62% cross-sell conversion' },
      { title: 'New Customer Welcome Nurture', description: 'First-time buyers have only 22% repeat rate', audienceDescription: 'Customers with exactly 1 order', expectedRevenue: 320000, aiReasoning: 'Welcome sequence improves repeat rate to 41%' },
      { title: 'VIP Loyalty Rewards Program', description: 'Top 5% spenders deserve recognition', audienceDescription: 'Top 5% by LTV', expectedRevenue: 180000, aiReasoning: 'Loyalty programs increase LTV by 25% on average' },
      { title: 'Mumbai Festival Season Campaign', description: 'Mumbai customers peak spend in Oct-Dec', audienceDescription: 'Mumbai customers, active last 90 days', expectedRevenue: 210000, aiReasoning: 'Festive season sees 3x engagement in Mumbai' },
    ];
    for (const opp of opps) await Opportunity.create({ ...opp, userId });

    const proposals = [
      { title: 'VIP Win-Back Campaign', channel: 'whatsapp', messageTemplate: 'Hey {name}! We miss you. Here\'s 15% off: COMEBACK15', confidenceScore: 0.87, aiReasoning: 'WhatsApp has highest open rate for VIP segments.' },
      { title: 'Festive Fashion Collection Launch', channel: 'email', messageTemplate: 'Hi {name}, our new festive collection is here! Shop with exclusive early access.', confidenceScore: 0.91, aiReasoning: 'Email allows rich visuals for fashion.' },
      { title: 'SMS Flash Sale Alert', channel: 'sms', messageTemplate: 'FLASH SALE! 40% off everything for 24hrs. Use code FLASH40.', confidenceScore: 0.75, aiReasoning: 'SMS has 95%+ delivery rate.' },
    ];
    for (const p of proposals) await AgentProposal.create({ ...p, userId });

    await Settings.create({ userId });

    res.json({ ok: true, message: 'Demo data seeded', customers: insertedCustomers.length });
  } catch (err) { next(err); }
});

export default router;
