import mongoose from 'mongoose';

const AgentProposalSchema = new mongoose.Schema({
  userId:        { type: String, required: true, index: true },
  title:         { type: String, required: true },
  segmentId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Segment', default: null },
  channel:         { type: String, enum: ['whatsapp', 'sms', 'email', 'rcs'] },
  messageTemplate: { type: String },
  confidenceScore: { type: Number, min: 0, max: 1 },
  aiReasoning:     { type: String },
  status:          { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  createdAt:       { type: Date, default: Date.now },
});

AgentProposalSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model('AgentProposal', AgentProposalSchema);
