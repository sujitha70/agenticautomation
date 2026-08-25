const mongoose = require('mongoose');
const { memoryStore, isInMemory } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const WorkflowSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a workflow name'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'paused', 'archived'],
      default: 'active',
    },
    triggerConfig: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({ type: 'manual', config: {} }),
    },
    nodes: {
      type: Array,
      default: [],
    },
    edges: {
      type: Array,
      default: [],
    },
    version: {
      type: Number,
      default: 1,
    },
    tags: {
      type: [String],
      default: ['automation'],
    },
    executionHistory: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Execution',
      },
    ],
    lastExecutionAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const MongooseWorkflow = mongoose.models.Workflow || mongoose.model('Workflow', WorkflowSchema);

class WorkflowModelWrapper {
  static async create(data) {
    if (!isInMemory && mongoose.connection.readyState === 1) {
      return await MongooseWorkflow.create(data);
    }

    const id = uuidv4();
    const doc = {
      _id: id,
      id: id,
      name: data.name,
      description: data.description || '',
      owner: data.owner,
      status: data.status || 'active',
      triggerConfig: data.triggerConfig || { type: 'manual', config: {} },
      nodes: data.nodes || [],
      edges: data.edges || [],
      version: data.version || 1,
      tags: data.tags || ['automation'],
      executionHistory: [],
      lastExecutionAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      toObject() { return { ...this }; },
      toJSON() { return { ...this }; }
    };

    memoryStore.workflows.set(id, doc);
    return doc;
  }

  static async find(query = {}) {
    if (!isInMemory && mongoose.connection.readyState === 1) {
      return MongooseWorkflow.find(query).sort({ updatedAt: -1 });
    }

    const results = [];
    for (const wf of memoryStore.workflows.values()) {
      let match = true;
      if (query.owner && String(wf.owner) !== String(query.owner)) match = false;
      if (query.status && wf.status !== query.status) match = false;
      if (match) results.push({ ...wf });
    }
    return results.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }

  static async findById(id) {
    if (!isInMemory && mongoose.connection.readyState === 1) {
      return MongooseWorkflow.findById(id);
    }
    const wf = memoryStore.workflows.get(id);
    return wf ? { ...wf } : null;
  }

  static async findByIdAndUpdate(id, update, options = {}) {
    if (!isInMemory && mongoose.connection.readyState === 1) {
      return MongooseWorkflow.findByIdAndUpdate(id, update, { new: true, ...options });
    }
    const wf = memoryStore.workflows.get(id);
    if (!wf) return null;
    
    const patch = update.$set ? update.$set : update;
    const updated = { ...wf, ...patch, updatedAt: new Date() };
    if (update.$inc && update.$inc.version) {
      updated.version = (wf.version || 1) + update.$inc.version;
    }
    if (update.$push && update.$push.executionHistory) {
      updated.executionHistory = [...(wf.executionHistory || []), update.$push.executionHistory];
    }
    memoryStore.workflows.set(id, updated);
    return updated;
  }

  static async findByIdAndDelete(id) {
    if (!isInMemory && mongoose.connection.readyState === 1) {
      return MongooseWorkflow.findByIdAndDelete(id);
    }
    const existing = memoryStore.workflows.get(id);
    memoryStore.workflows.delete(id);
    return existing;
  }

  static async countDocuments(query = {}) {
    if (!isInMemory && mongoose.connection.readyState === 1) {
      return MongooseWorkflow.countDocuments(query);
    }
    let count = 0;
    for (const wf of memoryStore.workflows.values()) {
      let match = true;
      if (query.owner && String(wf.owner) !== String(query.owner)) match = false;
      if (query.status && wf.status !== query.status) match = false;
      if (match) count++;
    }
    return count;
  }
}

module.exports = WorkflowModelWrapper;
