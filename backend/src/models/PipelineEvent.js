import mongoose from 'mongoose';

const PipelineEventSchema = new mongoose.Schema({
  type:        { type: String },
  title:       { type: String },
  description: { type: String },
  badge:       { type: String, enum: ['Event', 'OK', 'Retry', 'Failed'] },
  campaignId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', default: null },
  createdAt:   { type: Date, default: Date.now, index: true },
});

export default mongoose.model('PipelineEvent', PipelineEventSchema);
