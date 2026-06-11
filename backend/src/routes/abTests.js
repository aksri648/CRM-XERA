import { Router } from 'express';
import { requireAuth } from '@clerk/express';
import ABTest from '../models/ABTest.js';

const router = Router();
router.use(requireAuth());

router.get('/', async (req, res, next) => {
  try {
    const tests = await ABTest.find().sort({ createdAt: -1 });
    res.json({ tests });
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const test = await ABTest.create(req.body);
    res.status(201).json({ test });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const test = await ABTest.findById(req.params.id);
    if (!test) return res.status(404).json({ error: 'Not found' });
    res.json({ test });
  } catch (err) { next(err); }
});

router.patch('/:id/winner', async (req, res, next) => {
  try {
    const { winnerCampaignId } = req.body;
    const test = await ABTest.findByIdAndUpdate(
      req.params.id,
      { winnerCampaignId, status: 'completed' },
      { new: true }
    );
    if (!test) return res.status(404).json({ error: 'Not found' });
    res.json({ test });
  } catch (err) { next(err); }
});

export default router;
