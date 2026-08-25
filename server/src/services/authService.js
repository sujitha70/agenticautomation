const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/env');

class AuthService {
  generateToken(id) {
    return jwt.sign({ id }, config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRES_IN,
    });
  }

  async register({ name, email, password, role = 'operator' }) {
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      const error = new Error('User already exists with this email address.');
      error.statusCode = 400;
      error.code = 'DUPLICATE_EMAIL';
      throw error;
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: role === 'admin' ? 'admin' : 'operator',
    });

    const token = this.generateToken(user._id || user.id);

    return {
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
      token,
    };
  }

  async login({ email, password }) {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      const error = new Error('Invalid email or password credentials.');
      error.statusCode = 401;
      error.code = 'INVALID_CREDENTIALS';
      throw error;
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      const error = new Error('Invalid email or password credentials.');
      error.statusCode = 401;
      error.code = 'INVALID_CREDENTIALS';
      throw error;
    }

    // Update lastLogin
    await User.findByIdAndUpdate(user._id || user.id, { lastLogin: new Date() });

    const token = this.generateToken(user._id || user.id);

    return {
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        lastLogin: new Date(),
      },
      token,
    };
  }

  async getProfile(userId) {
    const user = await User.findById(userId);
    if (!user) {
      const error = new Error('User not found.');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    return {
      id: user._id || user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
    };
  }
}

module.exports = new AuthService();
