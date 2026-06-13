import mongoose from 'mongoose';

const STATUS_ORDER = ['pending', 'sent', 'delivered', 'opened', 'read', 'clicked', 'converted', 'failed'];

const CommunicationSchema = new mongoose.Schema({
  campaignId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true, index: true },
  customerId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  message:     { type: String, required: true },
  channel:     { type: String, required: true },
  status:      { type: String, enum: STATUS_ORDER, default: 'pending', index: true },
  sentAt:      { type: Date },
  updatedAt:   { type: Date, default: Date.now },
});

CommunicationSchema.index({ campaignId: 1, status: 1 });

export { STATUS_ORDER };
export default mongoose.model('Communication', CommunicationSchema);
