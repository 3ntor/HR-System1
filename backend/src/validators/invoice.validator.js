const Joi = require('joi');

const validateInvoice = (data) => {
  const schema = Joi.object({
    client: Joi.string().required().messages({
      'string.empty': 'Client is required',
      'any.required': 'Client is required'
    }),
    amount: Joi.number().required().min(0).messages({
      'number.base': 'Amount must be a number',
      'number.min': 'Amount must be greater than or equal to 0',
      'any.required': 'Amount is required'
    }),
    description: Joi.string().required().min(3).max(500).messages({
      'string.empty': 'Description is required',
      'string.min': 'Description must be at least 3 characters long',
      'string.max': 'Description cannot exceed 500 characters',
      'any.required': 'Description is required'
    }),
    dueDate: Joi.date().required().min('now').messages({
      'date.base': 'Due date must be a valid date',
      'date.min': 'Due date must be in the future',
      'any.required': 'Due date is required'
    }),
    paymentMethod: Joi.string().required().valid('cash', 'bank_transfer', 'check', 'credit_card', 'debit_card').messages({
      'string.empty': 'Payment method is required',
      'any.only': 'Invalid payment method',
      'any.required': 'Payment method is required'
    }),
    notes: Joi.string().allow('').max(1000).messages({
      'string.max': 'Notes cannot exceed 1000 characters'
    })
  });

  return schema.validate(data);
};

module.exports = {
  validateInvoice
}; 