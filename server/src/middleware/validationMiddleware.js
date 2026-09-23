const { validationResult } = require('express-validator');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const firstMsg = errors.array()[0].msg;
    return res.status(400).json({
      success: false,
      code: 'VALIDATION_ERROR',
      error: firstMsg,
      message: firstMsg,
      errors: errors.array().map((err) => ({
        field: err.path || err.param,
        message: err.msg,
      })),
    });
  }
  next();
};

module.exports = {
  validateRequest,
};
