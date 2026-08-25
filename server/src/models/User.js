const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { memoryStore, isInMemory } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email address'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['admin', 'operator'],
      default: 'operator',
    },
    lastLogin: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Hash password prior to saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const MongooseUser = mongoose.models.User || mongoose.model('User', UserSchema);

// Hybrid Model wrapper for seamless in-memory or mongo execution
class UserModelWrapper {
  static async create(userData) {
    if (!isInMemory && mongoose.connection.readyState === 1) {
      return await MongooseUser.create(userData);
    }
    
    // In-memory fallback
    const id = uuidv4();
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(userData.password, salt);
    
    const userDoc = {
      _id: id,
      id: id,
      name: userData.name,
      email: userData.email.toLowerCase(),
      password: hashedPassword,
      role: userData.role || 'operator',
      lastLogin: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      async matchPassword(pwd) {
        return await bcrypt.compare(pwd, this.password);
      },
      toObject() {
        const copy = { ...this };
        delete copy.password;
        return copy;
      },
      toJSON() {
        return this.toObject();
      }
    };
    
    memoryStore.users.set(id, userDoc);
    return userDoc;
  }

  static async findOne(query) {
    if (!isInMemory && mongoose.connection.readyState === 1) {
      return MongooseUser.findOne(query);
    }
    
    for (const user of memoryStore.users.values()) {
      let match = true;
      if (query.email && user.email !== query.email.toLowerCase()) match = false;
      if (query._id && user._id !== query._id && user.id !== query._id) match = false;
      if (match) return user;
    }
    return null;
  }

  static async findById(id) {
    if (!isInMemory && mongoose.connection.readyState === 1) {
      return MongooseUser.findById(id);
    }
    return memoryStore.users.get(id) || null;
  }

  static async findByIdAndUpdate(id, update, options = {}) {
    if (!isInMemory && mongoose.connection.readyState === 1) {
      return MongooseUser.findByIdAndUpdate(id, update, options);
    }
    const user = memoryStore.users.get(id);
    if (!user) return null;
    Object.assign(user, update.$set || update, { updatedAt: new Date() });
    memoryStore.users.set(id, user);
    return user;
  }

  static async countDocuments(query = {}) {
    if (!isInMemory && mongoose.connection.readyState === 1) {
      return MongooseUser.countDocuments(query);
    }
    return memoryStore.users.size;
  }
}

module.exports = UserModelWrapper;
