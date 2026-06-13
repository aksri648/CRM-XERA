import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { clerkMiddleware } from '@clerk/express';
import { connectDB } from './db.js';
import customersRouter from './routes/customers.js';
import ordersRouter from './routes/orders.js';
import segmentsRouter from './routes/segments.js';
import campaignsRouter from './routes/campaigns.js';
import receiptsRouter from './routes/receipts.js';
import analyticsRouter from './routes/analytics.js';
import opportunitiesRouter from './routes/opportunities.js';
import proposalsRouter from './routes/proposals.js';
import pipelineRouter from './routes/pipeline.js';
import settingsRouter from './routes/settings.js';
import setupRouter from './routes/setup.js';
import agentRouter from './routes/agent.js';
import errorHandler from './middleware/errorHandler.js';

const app = express();

app.use(cors({
  origin: [process.env.FRONTEND_URL || 'http://localhost:5173'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

app.use(clerkMiddleware({
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
  secretKey: process.env.CLERK_SECRET_KEY,
}));

app.use('/api/customers', customersRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/segments', segmentsRouter);
app.use('/api/campaigns', campaignsRouter);
app.use('/api/receipts', receiptsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/opportunities', opportunitiesRouter);
app.use('/api/proposals', proposalsRouter);
app.use('/api/pipeline', pipelineRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/setup', setupRouter);
app.use('/api/agent', agentRouter);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use(errorHandler);

connectDB().then(() => {
  const PORT = process.env.PORT || 8000;
  app.listen(PORT, () => console.log(`Backend running on :${PORT}`));
}).catch(err => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
