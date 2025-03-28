const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    walletId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wallet',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['credit', 'debit'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    associatedOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
    },
    date:{
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['success', 'failed'],
      default: 'success',
    }
  },{
    timestamps:true
  });
  
  const Transaction = mongoose.model('Transaction', transactionSchema);
  module.exports = Transaction