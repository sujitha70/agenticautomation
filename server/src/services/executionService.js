const Execution = require('../models/Execution');
const ExecutionLog = require('../models/ExecutionLog');
const { addExecutionJob } = require('../queues/executionQueue');
const orchestrator = require('../agents/orchestrator');

class ExecutionService {
  async listExecutions(owner, filters = {}) {
    const query = { owner };
    if (filters.status) query.status = filters.status;
    if (filters.workflowId) query.workflowId = filters.workflowId;
    return await Execution.find(query);
  }

  async getExecutionById(id, owner) {
    const execution = await Execution.findById(id);
    if (!execution) {
      const err = new Error('Execution not found.');
      err.statusCode = 404;
      err.code = 'EXECUTION_NOT_FOUND';
      throw err;
    }

    if (String(execution.owner) !== String(owner)) {
      const err = new Error('Not authorized to access this execution.');
      err.statusCode = 403;
      err.code = 'FORBIDDEN';
      throw err;
    }

    return execution;
  }

  async getExecutionTimeline(id, owner) {
    await this.getExecutionById(id, owner);
    const logs = await ExecutionLog.find({ executionId: id });
    return logs;
  }

  async pauseExecution(id, owner) {
    await this.getExecutionById(id, owner);
    const success = orchestrator.pauseExecution(id);
    if (!success) {
      // If orchestrator is not holding active in-flight control, update state directly
      await Execution.findByIdAndUpdate(id, { status: 'PAUSED' });
    }
    return { success: true, status: 'PAUSED', executionId: id };
  }

  async resumeExecution(id, owner) {
    const execution = await this.getExecutionById(id, owner);
    const success = orchestrator.resumeExecution(id);
    if (!success) {
      // Re-enqueue job if suspended in queue
      await Execution.findByIdAndUpdate(id, { status: 'PENDING' });
      await addExecutionJob({
        executionId: id,
        workflowId: execution.workflowId,
        inputPayload: execution.inputPayload,
        owner,
      });
    }
    return { success: true, status: 'RESUMING', executionId: id };
  }

  async cancelExecution(id, owner) {
    await this.getExecutionById(id, owner);
    orchestrator.cancelExecution(id);
    await Execution.findByIdAndUpdate(id, { status: 'CANCELLED', completedAt: new Date() });
    return { success: true, status: 'CANCELLED', executionId: id };
  }

  async retryExecution(id, owner) {
    const execution = await this.getExecutionById(id, owner);
    
    // Clear previous logs or start fresh execution session
    const newExec = await Execution.create({
      workflowId: execution.workflowId,
      workflowSnapshot: execution.workflowSnapshot,
      status: 'PENDING',
      inputPayload: execution.inputPayload,
      owner,
      retryCount: (execution.retryCount || 0) + 1,
      langGraphStatus: orchestrator.getLangGraphStatus(),
    });

    const newExecId = newExec._id || newExec.id;

    await addExecutionJob({
      executionId: newExecId,
      workflowId: execution.workflowId,
      inputPayload: execution.inputPayload,
      owner,
    });

    return {
      executionId: newExecId,
      status: 'PENDING',
      message: 'Retry initiated successfully.'
    };
  }
}

module.exports = new ExecutionService();
