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

const CHANNELS = ['whatsapp', 'email', 'sms', 'rcs'];

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

function funnelRandom(base, decay) {
  let v = base;
  const result = [];
  for (let i = 0; i < 5; i++) {
    v = Math.max(0, Math.round(v * (1 - faker.number.float({ min: 0, max: decay }))));
    result.push(v);
  }
  return result;
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

    // ── Customers ──
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

    // ── Orders ──
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

    // ── Aggregate LTV per customer ──
    const agg = await Order.aggregate([
      { $match: { userId } },
      { $group: { _id: '$customerId', totalAmount: { $sum: '$amount' }, count: { $sum: 1 }, lastOrder: { $max: '$orderedAt' } } },
    ]);
    if (agg.length > 0) {
      await Customer.bulkWrite(agg.map(a => ({
        updateOne: { filter: { _id: a._id }, update: { $set: { ltv: a.totalAmount, totalOrders: a.count, lastOrderAt: a.lastOrder } } },
      })));
    }

    // ── Segments (8 total: 5 AI + 3 human) ──
    const segmentDefs = [
      { name: 'VIP Customers', description: 'Customers with LTV > ₹10,000', filterRules: [{ field: 'ltv', operator: 'gt', value: 10000 }], logic: 'AND', createdBy: 'agent' },
      { name: 'Inactive 60+ Days', description: 'Customers inactive for over 60 days', filterRules: [{ field: 'last_order_days', operator: 'gt', value: 60 }], logic: 'AND', createdBy: 'agent' },
      { name: 'High-Value Fashion Buyers', description: 'Fashion category buyers with high LTV', filterRules: [{ field: 'ltv', operator: 'gt', value: 5000 }, { field: 'category', operator: 'contains', value: 'fashion' }], logic: 'AND', createdBy: 'agent' },
      { name: 'New Customers', description: 'Customers who joined in the last 30 days', filterRules: [{ field: 'last_order_days', operator: 'lte', value: 30 }], logic: 'AND', createdBy: 'agent' },
      { name: 'At-Risk Reactivation', description: 'High LTV customers at risk of churning', filterRules: [{ field: 'ltv', operator: 'gt', value: 2000 }, { field: 'last_order_days', operator: 'gt', value: 45 }], logic: 'AND', createdBy: 'agent' },
      { name: 'Mumbai High Spenders', description: 'Mumbai customers with LTV > ₹8,000', filterRules: [{ field: 'ltv', operator: 'gt', value: 8000 }, { field: 'city', operator: 'eq', value: 'Mumbai' }], logic: 'AND', createdBy: 'human' },
      { name: 'Electronics Enthusiasts', description: 'Customers who bought electronics', filterRules: [{ field: 'category', operator: 'contains', value: 'electronics' }], logic: 'AND', createdBy: 'human' },
      { name: 'Bulk Buyers (3+ orders)', description: 'Customers with 3 or more orders', filterRules: [{ field: 'totalOrders', operator: 'gte', value: 3 }], logic: 'AND', createdBy: 'human' },
    ];
    const insertedSegments = [];
    for (const s of segmentDefs) {
      const count = await Customer.countDocuments({ ...buildMongoQuery(s.filterRules, s.logic), userId });
      const seg = await Segment.create({ ...s, userId, customerCount: count });
      insertedSegments.push(seg);
    }

    // ── Campaigns (6 with varied statuses) ──
    const campaignDefs = [
      {
        name: 'Summer Sale 2025', channel: 'whatsapp', status: 'completed', createdBy: 'agent',
        messageTemplate: 'Hey {name}! Summer sale is here with up to 50% off!',
        stats: { sent: 5000, delivered: 4600, opened: 2070, read: 1449, clicked: 434, converted: 52, revenue: 52000, failed: 48 },
        launchedAt: new Date(Date.now() - 30 * 86400000), completedAt: new Date(Date.now() - 25 * 86400000),
      },
      {
        name: 'Monsoon Essentials Blast', channel: 'email', status: 'completed', createdBy: 'agent',
        messageTemplate: 'Hi {name}, monsoon is here! Check out our curated rain essentials.',
        stats: { sent: 3500, delivered: 3200, opened: 1600, read: 1120, clicked: 336, converted: 28, revenue: 38500, failed: 60 },
        launchedAt: new Date(Date.now() - 20 * 86400000), completedAt: new Date(Date.now() - 15 * 86400000),
      },
      {
        name: 'Festival Season Diwali Deals', channel: 'whatsapp', status: 'running', createdBy: 'human',
        messageTemplate: 'Happy Diwali {name}! Light up your home with our exclusive deals.',
        stats: { sent: 2800, delivered: 2600, opened: 1300, read: 910, clicked: 273, converted: 18, revenue: 24000, failed: 32 },
        launchedAt: new Date(Date.now() - 3 * 86400000),
      },
      {
        name: 'Flash Friday SMS', channel: 'sms', status: 'completed', createdBy: 'agent',
        messageTemplate: 'FLASH SALE! 40% off everything for 24hrs. Use code FLASH40.',
        stats: { sent: 8000, delivered: 7800, opened: 3900, read: 2730, clicked: 819, converted: 98, revenue: 78000, failed: 40 },
        launchedAt: new Date(Date.now() - 12 * 86400000), completedAt: new Date(Date.now() - 11 * 86400000),
      },
      {
        name: 'VIP Exclusive Preview', channel: 'email', status: 'draft', createdBy: 'human',
        messageTemplate: 'Dear {name}, get early access to our premium collection before anyone else.',
        stats: { sent: 0, delivered: 0, opened: 0, read: 0, clicked: 0, converted: 0, revenue: 0, failed: 0 },
      },
      {
        name: 'Win-Back Lapsed Users', channel: 'rcs', status: 'stopped', createdBy: 'agent',
        messageTemplate: 'We miss you {name}! Come back and enjoy 20% off on your next order.',
        stats: { sent: 1200, delivered: 1100, opened: 440, read: 308, clicked: 62, converted: 6, revenue: 7200, failed: 20 },
        launchedAt: new Date(Date.now() - 8 * 86400000), completedAt: new Date(Date.now() - 6 * 86400000),
      },
    ];

    const insertedCampaigns = [];
    for (const c of campaignDefs) {
      const camp = await Campaign.create({ ...c, userId });
      insertedCampaigns.push(camp);
    }

    // ── Communications (for completed + running campaigns) ──
    const communicationDocs = [];
    const statusWeights = ['delivered', 'delivered', 'delivered', 'opened', 'opened', 'read', 'clicked', 'converted', 'failed'];
    for (const camp of insertedCampaigns) {
      if (camp.status === 'draft' || camp.stats.sent === 0) continue;
      const sampleSize = Math.min(camp.stats.sent, 200);
      const sampleCustomers = faker.helpers.arrayElements(insertedCustomers, sampleSize);
      for (const cust of sampleCustomers) {
        const status = faker.helpers.arrayElement(statusWeights);
        const sentAt = camp.launchedAt ? new Date(camp.launchedAt.getTime() + faker.number.int({ min: 0, max: 86400000 })) : new Date();
        communicationDocs.push({
          userId,
          campaignId: camp._id,
          customerId: cust._id,
          message: camp.messageTemplate.replace('{name}', cust.name.split(' ')[0]),
          channel: camp.channel,
          status,
          sentAt,
          updatedAt: sentAt,
        });
      }
    }
    if (communicationDocs.length > 0) {
      await Communication.insertMany(communicationDocs);
    }

    // ── Opportunities (8 with varied statuses) ──
    const oppDefs = [
      { title: 'Reactivate High-Value Lapsing Customers', description: '12% of top-tier customers haven\'t purchased in 60+ days', audienceDescription: 'Customers with LTV > ₹10,000, inactive 60+ days', expectedRevenue: 450000, aiReasoning: 'Historical data shows 18% reactivation rate for this segment', status: 'active' },
      { title: 'Cross-sell Beauty to Fashion Buyers', description: 'Fashion buyers rarely purchase beauty products', audienceDescription: 'Fashion category buyers, no beauty purchases', expectedRevenue: 280000, aiReasoning: 'Beauty has 45% margin and 62% cross-sell conversion', status: 'active' },
      { title: 'New Customer Welcome Nurture', description: 'First-time buyers have only 22% repeat rate', audienceDescription: 'Customers with exactly 1 order', expectedRevenue: 320000, aiReasoning: 'Welcome sequence improves repeat rate to 41%', status: 'converted' },
      { title: 'VIP Loyalty Rewards Program', description: 'Top 5% spenders deserve recognition', audienceDescription: 'Top 5% by LTV', expectedRevenue: 180000, aiReasoning: 'Loyalty programs increase LTV by 25% on average', status: 'active' },
      { title: 'Mumbai Festival Season Campaign', description: 'Mumbai customers peak spend in Oct-Dec', audienceDescription: 'Mumbai customers, active last 90 days', expectedRevenue: 210000, aiReasoning: 'Festive season sees 3x engagement in Mumbai', status: 'dismissed' },
      { title: 'Electronics Upsell to Accessories', description: 'Electronics buyers rarely add accessories', audienceDescription: 'Electronics buyers, no accessory purchases', expectedRevenue: 150000, aiReasoning: 'Bundle offers increase AOV by 35%', status: 'active' },
      { title: 'Referral Program for Inactive Users', description: 'Inactive users can be reactivated via referrals', audienceDescription: 'Customers inactive 30-60 days, 1+ orders', expectedRevenue: 190000, aiReasoning: 'Referral programs have 3x higher conversion than cold outreach', status: 'active' },
      { title: 'Premium Tea Subscription Box', description: 'Food buyers love recurring subscription offers', audienceDescription: 'Food category buyers, LTV > ₹3,000', expectedRevenue: 240000, aiReasoning: 'Subscription models have 68% retention at 6 months', status: 'converted' },
    ];
    for (const opp of oppDefs) await Opportunity.create({ ...opp, userId });

    // ── Agent Proposals (6 with varied statuses + linked to segments) ──
    const proposalDefs = [
      { title: 'VIP Win-Back Campaign', channel: 'whatsapp', messageTemplate: 'Hey {name}! We miss you. Here\'s 15% off: COMEBACK15', confidenceScore: 0.87, aiReasoning: 'WhatsApp has highest open rate for VIP segments.', status: 'approved', segmentIdx: 0 },
      { title: 'Festive Fashion Collection Launch', channel: 'email', messageTemplate: 'Hi {name}, our new festive collection is here! Shop with exclusive early access.', confidenceScore: 0.91, aiReasoning: 'Email allows rich visuals for fashion.', status: 'pending', segmentIdx: 2 },
      { title: 'SMS Flash Sale Alert', channel: 'sms', messageTemplate: 'FLASH SALE! 40% off everything for 24hrs. Use code FLASH40.', confidenceScore: 0.75, aiReasoning: 'SMS has 95%+ delivery rate.', status: 'approved', segmentIdx: 7 },
      { title: 'Re-engagement via RCS', channel: 'rcs', messageTemplate: 'Hi {name}, we\'ve saved something special for you. Tap to view your exclusive offer.', confidenceScore: 0.68, aiReasoning: 'RCS provides rich media experience for re-engagement.', status: 'rejected', segmentIdx: 1 },
      { title: 'Mumbai Monsoon Special', channel: 'whatsapp', messageTemplate: 'Hey {name}! Stay dry with our monsoon essentials — 30% off today only!', confidenceScore: 0.82, aiReasoning: 'Mumbai segment shows 2.4x engagement during monsoon.', status: 'pending', segmentIdx: 5 },
      { title: 'New User Onboarding Drip', channel: 'email', messageTemplate: 'Welcome {name}! Here are 3 tips to get the most out of our platform.', confidenceScore: 0.93, aiReasoning: 'Onboarding emails increase 30-day retention by 40%.', status: 'pending', segmentIdx: 3 },
    ];
    for (const p of proposalDefs) {
      await AgentProposal.create({
        userId,
        title: p.title,
        channel: p.channel,
        messageTemplate: p.messageTemplate,
        confidenceScore: p.confidenceScore,
        aiReasoning: p.aiReasoning,
        status: p.status,
        segmentId: insertedSegments[p.segmentIdx]?._id || null,
      });
    }

    // ── Pipeline Events ──
    const eventDefs = [
      { type: 'system', title: 'Channel service connected', description: 'WhatsApp Business API connection established', badge: 'OK' },
      { type: 'system', title: 'Agent service heartbeat', description: 'AI agent service is healthy and responsive', badge: 'OK' },
      { type: 'campaign_launch', title: `Campaign launched: ${campaignDefs[0].name}`, description: 'Dispatching 5,000 WhatsApp messages', badge: 'Event', campaignIdx: 0 },
      { type: 'delivery', title: 'Message batch delivered', description: '4,600 of 5,000 messages delivered successfully', badge: 'OK', campaignIdx: 0 },
      { type: 'delivery', title: 'Delivery failures detected', description: '48 messages failed — invalid numbers or blocked users', badge: 'Retry', campaignIdx: 0 },
      { type: 'campaign_launch', title: `Campaign launched: ${campaignDefs[1].name}`, description: 'Dispatching 3,500 emails via SendGrid', badge: 'Event', campaignIdx: 1 },
      { type: 'delivery', title: 'Email batch processed', description: '3,200 of 3,500 emails delivered', badge: 'OK', campaignIdx: 1 },
      { type: 'campaign_launch', title: `Campaign launched: ${campaignDefs[2].name}`, description: 'Dispatching 2,800 WhatsApp messages', badge: 'Event', campaignIdx: 2 },
      { type: 'delivery', title: 'Messages delivered', description: '2,600 of 2,800 messages delivered', badge: 'OK', campaignIdx: 2 },
      { type: 'campaign_launch', title: `Campaign launched: ${campaignDefs[3].name}`, description: 'Dispatching 8,000 SMS via route', badge: 'Event', campaignIdx: 3 },
      { type: 'delivery', title: 'SMS batch delivered', description: '7,800 of 8,000 SMS delivered successfully', badge: 'OK', campaignIdx: 3 },
      { type: 'delivery', title: 'SMS delivery failures', description: '40 numbers unreachable or invalid', badge: 'Retry', campaignIdx: 3 },
      { type: 'campaign_launch', title: `Campaign stopped: ${campaignDefs[5].name}`, description: 'User manually stopped the campaign', badge: 'Event', campaignIdx: 5 },
      { type: 'system', title: 'Rate limit warning', description: 'Approaching WhatsApp API rate limit (85% used)', badge: 'Retry' },
      { type: 'system', title: 'AI scan completed', description: 'Opportunity scan found 3 new marketing opportunities', badge: 'OK' },
      { type: 'delivery', title: 'Conversion tracked', description: '52 conversions attributed to Summer Sale campaign', badge: 'OK', campaignIdx: 0 },
      { type: 'system', title: 'Weekly digest generated', description: 'Performance report ready for review', badge: 'Event' },
      { type: 'delivery', title: 'Conversion tracked', description: '98 conversions from Flash Friday SMS', badge: 'OK', campaignIdx: 3 },
      { type: 'system', title: 'Database backup completed', description: 'Automated backup to cloud storage successful', badge: 'OK' },
      { type: 'system', title: 'Agent proposal generated', description: 'AI agent proposed 3 new campaign ideas', badge: 'Event' },
    ];
    for (const evt of eventDefs) {
      const campaignId = evt.campaignIdx !== undefined ? insertedCampaigns[evt.campaignIdx]._id : null;
      await PipelineEvent.create({
        userId,
        type: evt.type,
        title: evt.title,
        description: evt.description,
        badge: evt.badge,
        campaignId,
        createdAt: new Date(Date.now() - faker.number.int({ min: 0, max: 30 }) * 86400000),
      });
    }

    // ── Settings ──
    await Settings.create({ userId });

    res.json({ ok: true, message: 'Demo data seeded', customers: insertedCustomers.length });
  } catch (err) { next(err); }
});

export default router;
