const AgentMemory = require('../models/AgentMemory');

class MemoryService {
  async saveMemory({ workflowId, executionId, agent, key, value, confidence = 1.0, sharedContext = {} }) {
    return await AgentMemory.create({
      workflowId,
      executionId,
      agent,
      key,
      value,
      confidence,
      sharedContext,
    });
  }

  async getExecutionMemory(executionId) {
    return await AgentMemory.find({ executionId });
  }

  async getMemoryByKey(executionId, key) {
    return await AgentMemory.findOne({ executionId, key });
  }
}

module.exports = new MemoryService();
