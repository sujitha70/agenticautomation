const mongoose = require('mongoose');
const { memoryStore, isInMemory } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const AgentMemorySchema = new mongoose.Schema(
  {
    workflowId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workflow',
      required: true,
    },
    executionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Execution',
      required: true,
    },
    agent: {
      type: String,
      required: true,
    },
    key: {
      type: String,
      required: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    confidence: {
      type: Number,
      default: 1.0,
    },
    sharedContext: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({}),
    },
  },
  { timestamps: true }
);

const MongooseAgentMemory = mongoose.models.AgentMemory || mongoose.model('AgentMemory', AgentMemorySchema);

class AgentMemoryModelWrapper {
  static async create(data) {
    if (!isInMemory && mongoose.connection.readyState === 1) {
      return await MongooseAgentMemory.create(data);
    }

    const id = uuidv4();
    const doc = {
      _id: id,
      id: id,
      workflowId: data.workflowId,
      executionId: data.executionId,
      agent: data.agent,
      key: data.key,
      value: data.value,
      confidence: data.confidence !== undefined ? data.confidence : 1.0,
      sharedContext: data.sharedContext || {},
      createdAt: new Date(),
      updatedAt: new Date(),
      toObject() { return { ...this }; },
      toJSON() { return { ...this }; }
    };

    memoryStore.agentMemories.set(id, doc);
    return doc;
  }

  static async find(query = {}) {
    if (!isInMemory && mongoose.connection.readyState === 1) {
      return MongooseAgentMemory.find(query);
    }

    const results = [];
    for (const mem of memoryStore.agentMemories.values()) {
      let match = true;
      if (query.executionId && String(mem.executionId) !== String(query.executionId)) match = false;
      if (query.workflowId && String(mem.workflowId) !== String(query.workflowId)) match = false;
      if (query.agent && mem.agent !== query.agent) match = false;
      if (query.key && mem.key !== query.key) match = false;
      if (match) results.push({ ...mem });
    }
    return results;
  }

  static async findOne(query = {}) {
    const list = await this.find(query);
    return list.length > 0 ? list[0] : null;
  }
}

module.exports = AgentMemoryModelWrapper;
