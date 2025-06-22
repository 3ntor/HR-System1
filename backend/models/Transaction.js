const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  transactionNumber: String,
  type: { type: String, enum: ['income', 'expense'], required: true },
  amount: { type: Number, required: true },
  currency: String,
  description: String,
  category: String,
  subcategory: String,
  date: Date,
  dueDate: Date,
  status: String,
  paymentMethod: String,
  paymentStatus: String,
  reference: String,
  invoice: {
    number: String,
    issueDate: Date,
    dueDate: Date
  },
  clientId: String,
  employeeId: String,
  projectId: String,
  departmentId: String,
  tags: [String],
  attachments: [String],
  approvalHistory: [
    {
      action: String,
      by: String,
      date: Date,
      comment: String
    }
  ],
  tax: {
    rate: Number,
    amount: Number,
    included: Boolean
  },
  recurring: {
    isRecurring: Boolean,
    frequency: String,
    nextDate: Date,
    endDate: Date
  },
  notes: String,
  createdBy: String,
  createdAt: Date,
  updatedBy: String,
  updatedAt: Date,
  approvedBy: String,
  approvedAt: Date
}, {
  timestamps: true
});

transactionSchema.index({ transactionNumber: 1 });
transactionSchema.index({ type: 1 });
transactionSchema.index({ date: -1 });
transactionSchema.index({ dueDate: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ paymentStatus: 1 });
transactionSchema.index({ clientId: 1 });
transactionSchema.index({ employeeId: 1 });
transactionSchema.index({ projectId: 1 });
transactionSchema.index({ category: 1 });
transactionSchema.index({ amount: 1 });
transactionSchema.index({ createdAt: -1 });
transactionSchema.index({ 'invoice.number': 1 });

module.exports = mongoose.model('Transaction', transactionSchema); 