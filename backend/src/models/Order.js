import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
  customerId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
  productName:  { type: String, required: true },
  category:     { type: String, enum: ['fashion', 'beauty', 'food', 'electronics', 'accessories'] },
  amount:       { type: Number, required: true },
  orderedAt:    { type: Date, default: Date.now },
});

export default mongoose.model('Order', OrderSchema);
