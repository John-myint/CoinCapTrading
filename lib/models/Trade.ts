import mongoose from 'mongoose';

const tradeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['buy', 'sell'],
      required: true,
    },
    cryptoSymbol: {
      type: String,
      required: true,
      uppercase: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Amount must be positive'],
    },
    pricePerUnit: {
      type: Number,
      required: true,
      min: [0, 'Price must be positive'],
    },
    totalValue: {
      type: Number,
      required: true,
      min: [0, 'Total value must be positive'],
    },
    status: {
      type: String,
      enum: ['completed', 'pending', 'cancelled'],
      default: 'completed',
    },
    transactionId: {
      type: String,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

tradeSchema.index({ userId: 1, createdAt: -1 });
// transactionId already has unique index from schema definition
tradeSchema.index({ cryptoSymbol: 1 });
tradeSchema.index({ status: 1 });

export default mongoose.models.Trade || mongoose.model('Trade', tradeSchema);
