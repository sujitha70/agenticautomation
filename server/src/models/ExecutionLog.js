const mongoose = require('mongoose');
const { memoryStore, isInMemory } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const ExecutionLogSchema = new mongoose.Schema(
  {
    executionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Execution',
      required: true,
    },
    workflowId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workflow',
      required: true,
    },
    nodeId: {
      type: String,
      default: null,
    },
    agent: {
      type: String,
      enum: ['planner', 'execution', 'validation', 'recovery', 'monitoring', 'orchestrator'],
      required: true,
    },
    level: {
      type: String,
      enum: ['info', 'warning', 'error', 'success'],
      default: 'info',
    },
    eventType: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({}),
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const MongooseExecutionLog = mongoose.models.ExecutionLog || mongoose.model('ExecutionLog', ExecutionLogSchema);

class ExecutionLogModelWrapper {
  static async create(data) {
    if (!isInMemory && mongoose.connection.readyState === 1) {
      return await MongooseExecutionLog.create(data);
    }

    const id = uuidv4();
    const doc = {
      _id: id,
      id: id,
      executionId: data.executionId,
      workflowId: data.workflowId,
      nodeId: data.nodeId || null,
      agent: data.agent,
      level: data.level || 'info',
      eventType: data.eventType,
      message: data.message,
      metadata: data.metadata || {},
      timestamp: data.timestamp || new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      toObject() { return { ...this }; },
      toJSON() { return { ...this }; }
    };

    memoryStore.executionLogs.set(id, doc);
    return doc;
  }

  static async find(query = {}) {
    if (!isInMemory && mongoose.connection.readyState === 1) {
      return MongooseExecutionLog.find(query).sort({ timestamp: 1 });
    }

    const results = [];
    for (const log of memoryStore.executionLogs.values()) {
      let match = true;
      if (query.executionId && String(log.executionId) !== String(query.executionId)) match = false;
      if (query.workflowId && String(log.workflowId) !== String(query.workflowId)) match = false;
      if (query.agent && log.agent !== query.agent) match = false;
      if (query.level && log.level !== query.level) match = false;
      if (match) results.push({ ...log });
    }
    return results.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }

  static async deleteMany(query = {}) {
    if (!isInMemory && mongoose.connection.readyState === 1) {
      return MongooseExecutionLog.deleteMany(query);
    }
    let count = 0;
    for (const [id, log] of memoryStore.executionLogs.entries()) {
      let match = true;
      if (query.executionId && String(log.executionId) !== String(query.executionId)) match = false;
      if (match) {
        memoryStore.executionLogs.delete(id);
        count++;
      }
    }
    return { deletedCount: count };
  }
}

module.exports = ExecutionLogModelWrapper;
