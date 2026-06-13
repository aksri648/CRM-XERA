import mongoose from 'mongoose';

const CampaignSchema = new mongoose.Schema({
  userId:        { type: String, required: true, index: true },
  name:          { type: String, required: true },
  segmentId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Segment' },
  channel:         { type: String, enum: ['whatsapp', 'sms', 'email', 'rcs'], required: true },
  messageTemplate: { type: String, required: true },
  status:          { type: String, enum: ['draft', 'running', 'stopped', 'completed'], default: 'draft' },
  createdBy:       { type: String, enum: ['human', 'agent'], default: 'human' },
  abTestId:        { type: mongoose.Schema.Types.ObjectId, ref: 'ABTest', default: null },
  stats: {
    sent:       { type: Number, default: 0 },
    delivered:  { type: Number, default: 0 },
    opened:     { type: Number, default: 0 },
    read:       { type: Number, default: 0 },
    clicked:    { type: Number, default: 0 },
    converted:  { type: Number, default: 0 },
    revenue:    { type: Number, default: 0 },
    failed:     { type: Number, default: 0 },
  },
  launchedAt:   { type: Date },
  completedAt:  { type: Date },
  createdAt:    { type: Date, default: Date.now },
});

CampaignSchema.index({ status: 1, createdAt: -1 });
CampaignSchema.index({ 'stats.revenue': -1 });

export default mongoose.model('Campaign', CampaignSchema);
