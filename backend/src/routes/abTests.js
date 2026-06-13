import { Router } from 'express';
import ABTest from '../models/ABTest.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const tests = await ABTest.find({ userId: req.userId }).sort({ createdAt: -1 }).lean();
    res.json({ tests });
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const test = await ABTest.create({ ...req.body, userId: req.userId });
    res.status(201).json({ test });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const test = await ABTest.findOne({ _id: req.params.id, userId: req.userId }).lean();
    if (!test) return res.status(404).json({ error: 'Not found' });
    res.json({ test });
  } catch (err) { next(err); }
});

router.patch('/:id/winner', async (req, res, next) => {
  try {
    const { winnerCampaignId } = req.body;
    const test = await ABTest.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { winnerCampaignId, status: 'completed' },
      { new: true }
    );
    if (!test) return res.status(404).json({ error: 'Not found' });
    res.json({ test });
  } catch (err) { next(err); }
});

export default router;
