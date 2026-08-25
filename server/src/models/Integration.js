const mongoose = require('mongoose');
const { memoryStore, isInMemory } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const IntegrationSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    provider: {
      type: String,
      enum: ['gmail', 'slack', 'discord', 'google-sheets', 'openrouter', 'gemini'],
      required: true,
    },
    status: {
      type: String,
      enum: ['connected', 'disconnected', 'expired'],
      default: 'disconnected',
    },
    scopes: {
      type: [String],
      default: [],
    },
    encryptedAccessToken: {
      type: String,
      default: '',
    },
    encryptedRefreshToken: {
      type: String,
      default: '',
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    config: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({}),
    },
    error: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  { timestamps: true }
);

const MongooseIntegration = mongoose.models.Integration || mongoose.model('Integration', IntegrationSchema);

class IntegrationModelWrapper {
  static async create(data) {
    if (!isInMemory && mongoose.connection.readyState === 1) {
      return await MongooseIntegration.create(data);
    }

    const id = uuidv4();
    const doc = {
      _id: id,
      id: id,
      owner: data.owner,
      provider: data.provider,
      status: data.status || 'disconnected',
      scopes: data.scopes || [],
      encryptedAccessToken: data.encryptedAccessToken || '',
      encryptedRefreshToken: data.encryptedRefreshToken || '',
      expiresAt: data.expiresAt || null,
      config: data.config || {},
      error: data.error || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      toObject() { return { ...this }; },
      toJSON() { return { ...this }; }
    };

    memoryStore.integrations.set(id, doc);
    return doc;
  }

  static async find(query = {}) {
    if (!isInMemory && mongoose.connection.readyState === 1) {
      return MongooseIntegration.find(query);
    }

    const results = [];
    for (const item of memoryStore.integrations.values()) {
      let match = true;
      if (query.owner && String(item.owner) !== String(query.owner)) match = false;
      if (query.provider && item.provider !== query.provider) match = false;
      if (query.status && item.status !== query.status) match = false;
      if (match) results.push({ ...item });
    }
    return results;
  }

  static async findOne(query = {}) {
    if (!isInMemory && mongoose.connection.readyState === 1) {
      return MongooseIntegration.findOne(query);
    }

    for (const item of memoryStore.integrations.values()) {
      let match = true;
      if (query.owner && String(item.owner) !== String(query.owner)) match = false;
      if (query.provider && item.provider !== query.provider) match = false;
      if (query._id && item._id !== query._id && item.id !== query._id) match = false;
      if (match) return { ...item };
    }
    return null;
  }

  static async findById(id) {
    if (!isInMemory && mongoose.connection.readyState === 1) {
      return MongooseIntegration.findById(id);
    }
    const item = memoryStore.integrations.get(id);
    return item ? { ...item } : null;
  }

  static async findOneAndUpdate(query, update, options = {}) {
    if (!isInMemory && mongoose.connection.readyState === 1) {
      return MongooseIntegration.findOneAndUpdate(query, update, { new: true, upsert: options.upsert });
    }

    let existing = await this.findOne(query);
    if (!existing && options.upsert) {
      const data = {
        ...query,
        ...(update.$set || update),
      };
      return await this.create(data);
    }

    if (!existing) return null;

    const patch = update.$set ? update.$set : update;
    const updated = { ...existing, ...patch, updatedAt: new Date() };
    memoryStore.integrations.set(existing.id || existing._id, updated);
    return updated;
  }

  static async deleteOne(query) {
    if (!isInMemory && mongoose.connection.readyState === 1) {
      return MongooseIntegration.deleteOne(query);
    }
    const existing = await this.findOne(query);
    if (existing) {
      memoryStore.integrations.delete(existing.id || existing._id);
      return { deletedCount: 1 };
    }
    return { deletedCount: 0 };
  }
}

module.exports = IntegrationModelWrapper;
