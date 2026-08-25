const jwt = require('jsonwebtoken');
const config = require('../config/env');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token = null;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route. No token provided.',
      code: 'AUTH_UNAUTHORIZED'
    });
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User belonging to this token no longer exists.',
        code: 'AUTH_USER_NOT_FOUND'
      });
    }

    req.user = {
      _id: user._id || user.id,
      id: user._id || user.id,
      name: user.name,
      email: user.email,
      role: user.role || 'operator',
    };

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized. Token invalid or expired.',
      code: 'AUTH_EXPIRED'
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `User role '${req.user.role}' is not authorized to perform this action.`,
        code: 'FORBIDDEN'
      });
    }
    next();
  };
};

module.exports = {
  protect,
  authorize
};
