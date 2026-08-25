const mongoose = require('mongoose');
const { memoryStore, isInMemory } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const NotificationSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    workflowId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workflow',
      default: null,
    },
    executionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Execution',
      default: null,
    },
    type: {
      type: String,
      enum: ['success', 'failure', 'escalation', 'system'],
      default: 'system',
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const MongooseNotification = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);

class NotificationModelWrapper {
  static async create(data) {
    if (!isInMemory && mongoose.connection.readyState === 1) {
      return await MongooseNotification.create(data);
    }

    const id = uuidv4();
    const doc = {
      _id: id,
      id: id,
      owner: data.owner,
      workflowId: data.workflowId || null,
      executionId: data.executionId || null,
      type: data.type || 'system',
      title: data.title,
      message: data.message,
      read: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      toObject() { return { ...this }; },
      toJSON() { return { ...this }; }
    };

    memoryStore.notifications.set(id, doc);
    return doc;
  }

  static async find(query = {}) {
    if (!isInMemory && mongoose.connection.readyState === 1) {
      return MongooseNotification.find(query).sort({ createdAt: -1 });
    }

    const results = [];
    for (const notif of memoryStore.notifications.values()) {
      let match = true;
      if (query.owner && String(notif.owner) !== String(query.owner)) match = false;
      if (query.read !== undefined && notif.read !== query.read) match = false;
      if (match) results.push({ ...notif });
    }
    return results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  static async updateMany(query, update) {
    if (!isInMemory && mongoose.connection.readyState === 1) {
      return MongooseNotification.updateMany(query, update);
    }

    let modifiedCount = 0;
    for (const [id, notif] of memoryStore.notifications.entries()) {
      let match = true;
      if (query.owner && String(notif.owner) !== String(query.owner)) match = false;
      if (match) {
        const patch = update.$set ? update.$set : update;
        Object.assign(notif, patch, { updatedAt: new Date() });
        memoryStore.notifications.set(id, notif);
        modifiedCount++;
      }
    }
    return { modifiedCount };
  }
}

module.exports = NotificationModelWrapper;
