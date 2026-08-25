const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  console.error('💥 [Server Error]:', err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = `Resource not found with id ${err.value}`;
    return res.status(404).json({
      success: false,
      code: 'RESOURCE_NOT_FOUND',
      error: message,
    });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    return res.status(400).json({
      success: false,
      code: 'DUPLICATE_KEY',
      error: message,
    });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((val) => val.message);
    return res.status(400).json({
      success: false,
      code: 'VALIDATION_ERROR',
      error: message,
    });
  }

  // Integration not connected error
  if (err.message && err.message.includes('INTEGRATION_NOT_CONNECTED')) {
    return res.status(400).json({
      success: false,
      code: 'INTEGRATION_NOT_CONNECTED',
      error: err.message,
    });
  }

  // Auth expired
  if (err.message && err.message.includes('AUTH_EXPIRED')) {
    return res.status(401).json({
      success: false,
      code: 'AUTH_EXPIRED',
      error: err.message,
    });
  }

  res.status(error.statusCode || 500).json({
    success: false,
    code: error.code || 'SERVER_ERROR',
    error: error.message || 'Internal Server Error',
  });
};

module.exports = errorHandler;
