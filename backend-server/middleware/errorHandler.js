function errorHandler(err, req, res, next) {
  console.error('Error:', err);
  
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: messages
    });
  }
  
  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      error: 'Duplicate field value'
    });
  }
  
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
  
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
}

module.exports = errorHandler;
