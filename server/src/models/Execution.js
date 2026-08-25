const mongoose = require('mongoose');
const { memoryStore, isInMemory } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const ExecutionSchema = new mongoose.Schema(
  {
    workflowId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workflow',
      required: true,
    },
    workflowSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'RETRYING', 'PAUSED', 'CANCELLED'],
      default: 'PENDING',
    },
    currentNodeId: {
      type: String,
      default: null,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    duration: {
      type: Number,
      default: 0,
    },
    inputPayload: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({}),
    },
    outputPayload: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({}),
    },
    error: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    retryCount: {
      type: Number,
      default: 0,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    langGraphStatus: {
      type: String,
      enum: ['available', 'not-installed'],
      default: 'available',
    },
  },
  { timestamps: true }
);

const MongooseExecution = mongoose.models.Execution || mongoose.model('Execution', ExecutionSchema);

class ExecutionModelWrapper {
  static async create(data) {
    if (!isInMemory && mongoose.connection.readyState === 1) {
      return await MongooseExecution.create(data);
    }

    const id = uuidv4();
    const doc = {
      _id: id,
      id: id,
      workflowId: data.workflowId,
      workflowSnapshot: data.workflowSnapshot || {},
      status: data.status || 'PENDING',
      currentNodeId: data.currentNodeId || null,
      startedAt: data.startedAt || new Date(),
      completedAt: null,
      duration: 0,
      inputPayload: data.inputPayload || {},
      outputPayload: data.outputPayload || {},
      error: data.error || null,
      retryCount: data.retryCount || 0,
      owner: data.owner,
      langGraphStatus: data.langGraphStatus || 'available',
      createdAt: new Date(),
      updatedAt: new Date(),
      toObject() { return { ...this }; },
      toJSON() { return { ...this }; }
    };

    memoryStore.executions.set(id, doc);
    return doc;
  }

  static async find(query = {}) {
    if (!isInMemory && mongoose.connection.readyState === 1) {
      return MongooseExecution.find(query).sort({ createdAt: -1 });
    }

    const results = [];
    for (const exec of memoryStore.executions.values()) {
      let match = true;
      if (query.owner && String(exec.owner) !== String(query.owner)) match = false;
      if (query.workflowId && String(exec.workflowId) !== String(query.workflowId)) match = false;
      if (query.status && exec.status !== query.status) match = false;
      if (match) results.push({ ...exec });
    }
    return results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  static async findById(id) {
    if (!isInMemory && mongoose.connection.readyState === 1) {
      return MongooseExecution.findById(id);
    }
    const exec = memoryStore.executions.get(id);
    return exec ? { ...exec } : null;
  }

  static async findByIdAndUpdate(id, update, options = {}) {
    if (!isInMemory && mongoose.connection.readyState === 1) {
      return MongooseExecution.findByIdAndUpdate(id, update, { new: true, ...options });
    }
    const exec = memoryStore.executions.get(id);
    if (!exec) return null;
    
    const patch = update.$set ? update.$set : update;
    const updated = { ...exec, ...patch, updatedAt: new Date() };
    if (update.$inc && update.$inc.retryCount) {
      updated.retryCount = (exec.retryCount || 0) + update.$inc.retryCount;
    }
    memoryStore.executions.set(id, updated);
    return updated;
  }

  static async countDocuments(query = {}) {
    if (!isInMemory && mongoose.connection.readyState === 1) {
      return MongooseExecution.countDocuments(query);
    }
    let count = 0;
    for (const exec of memoryStore.executions.values()) {
      let match = true;
      if (query.owner && String(exec.owner) !== String(query.owner)) match = false;
      if (query.status && exec.status !== query.status) match = false;
      if (match) count++;
    }
    return count;
  }
}

module.exports = ExecutionModelWrapper;
