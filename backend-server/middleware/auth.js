const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-me';

function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer '
    const decoded = jwt.verify(token, JWT_SECRET);
    
    req.user = {
      agentCode: decoded.agentCode,
      role: decoded.role,
      teamId: decoded.teamId
    };
    
    next();
    
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired'
      });
    }
    
    return res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
}

module.exports = authMiddleware;
