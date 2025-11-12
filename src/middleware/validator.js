const Joi = require('joi');

const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errors = error.details.map(detail => detail.message);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors,
      });
    }
    
    next();
  };
};

const schemas = {
  register: Joi.object({
    name: Joi.string().required().min(3).max(100),
    ownerEmail: Joi.string().email().required(),
  }),

  collectEvent: Joi.object({
    event: Joi.string().required().min(1).max(100),
    url: Joi.string().uri().optional().allow(''),
    referrer: Joi.string().uri().optional().allow(''),
    device: Joi.string().optional().allow(''),
    ipAddress: Joi.string().ip().optional().allow(''),
    timestamp: Joi.date().iso().optional(),
    userId: Joi.string().optional().allow(''),
    metadata: Joi.object().optional(),
  }),

  getApiKey: Joi.object({
    email: Joi.string().email().required(),
  }),

  revokeKey: Joi.object({
    appId: Joi.string().uuid().required(),
  }),

  regenerateKey: Joi.object({
    appId: Joi.string().uuid().required(),
  }),
};

module.exports = {
  validateRequest,
  schemas,
};
