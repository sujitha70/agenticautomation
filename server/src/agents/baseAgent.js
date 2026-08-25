const ExecutionLog = require('../models/ExecutionLog');
const { emitAgentTimeline } = require('../config/socket');
const memoryService = require('../services/memoryService');

class BaseAgent {
  constructor(name, role) {
    this.name = name;
    this.role = role;
  }

  async logEvent({ executionId, workflowId, nodeId = null, level = 'info', eventType, message, metadata = {} }) {
    const logDoc = await ExecutionLog.create({
      executionId,
      workflowId,
      nodeId,
      agent: this.name,
      level,
      eventType,
      message,
      metadata,
      timestamp: new Date(),
    });

    // Stream live to Socket.IO clients subscribed to this execution
    emitAgentTimeline(executionId, {
      id: logDoc._id || logDoc.id,
      executionId,
      workflowId,
      nodeId,
      agent: this.name,
      level,
      eventType,
      message,
      metadata,
      timestamp: logDoc.timestamp,
    });

    return logDoc;
  }

  async remember(executionId, workflowId, key, value, confidence = 1.0, sharedContext = {}) {
    return await memoryService.saveMemory({
      workflowId,
      executionId,
      agent: this.name,
      key,
      value,
      confidence,
      sharedContext,
    });
  }
}

module.exports = BaseAgent;
