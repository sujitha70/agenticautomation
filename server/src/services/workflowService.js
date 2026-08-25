const Workflow = require('../models/Workflow');
const Execution = require('../models/Execution');
const ExecutionLog = require('../models/ExecutionLog');
const { addExecutionJob } = require('../queues/executionQueue');
const orchestrator = require('../agents/orchestrator');

class WorkflowService {
  async getDashboardMetrics(owner) {
    const totalWorkflows = await Workflow.countDocuments({ owner });
    const activeWorkflows = await Workflow.countDocuments({ owner, status: 'active' });
    const totalExecutions = await Execution.countDocuments({ owner });
    const completedExecutions = await Execution.countDocuments({ owner, status: 'COMPLETED' });
    const failedExecutions = await Execution.countDocuments({ owner, status: 'FAILED' });

    const successRate = totalExecutions > 0 ? Math.round((completedExecutions / totalExecutions) * 100) : 100;

    const recentWorkflows = (await Workflow.find({ owner })).slice(0, 5);
    const recentExecutions = (await Execution.find({ owner })).slice(0, 8);
    const recentLogs = (await ExecutionLog.find({})).slice(-10).reverse();

    return {
      metrics: {
        totalWorkflows,
        activeWorkflows,
        totalExecutions,
        completedExecutions,
        failedExecutions,
        successRate,
      },
      recentWorkflows,
      recentExecutions,
      recentActivity: recentLogs,
      orchestratorStatus: {
        langGraph: orchestrator.getLangGraphStatus(),
        activeAgents: ['planner', 'execution', 'validation', 'recovery', 'monitoring'],
      }
    };
  }

  async listWorkflows(owner, filters = {}) {
    const query = { owner };
    if (filters.status) query.status = filters.status;
    return await Workflow.find(query);
  }

  async createWorkflow(data, owner) {
    if (!data.name || !data.name.trim()) {
      throw new Error('Workflow name is required.');
    }

    const workflow = await Workflow.create({
      name: data.name.trim(),
      description: data.description || '',
      owner,
      status: data.status || 'active',
      triggerConfig: data.triggerConfig || { type: 'manual', config: {} },
      nodes: data.nodes || [],
      edges: data.edges || [],
      tags: data.tags || ['automation'],
      version: 1,
    });

    return workflow;
  }

  async getWorkflowById(id, owner) {
    const wf = await Workflow.findById(id);
    if (!wf) {
      const err = new Error('Workflow not found.');
      err.statusCode = 404;
      err.code = 'WORKFLOW_NOT_FOUND';
      throw err;
    }

    if (String(wf.owner) !== String(owner)) {
      const err = new Error('Not authorized to access this workflow.');
      err.statusCode = 403;
      err.code = 'FORBIDDEN';
      throw err;
    }

    return wf;
  }

  async updateWorkflow(id, updateData, owner) {
    await this.getWorkflowById(id, owner);

    const updatePayload = {
      $set: {
        name: updateData.name,
        description: updateData.description,
        status: updateData.status,
        triggerConfig: updateData.triggerConfig,
        nodes: updateData.nodes,
        edges: updateData.edges,
        tags: updateData.tags,
      },
      $inc: { version: 1 }
    };

    return await Workflow.findByIdAndUpdate(id, updatePayload);
  }

  async duplicateWorkflow(id, owner) {
    const original = await this.getWorkflowById(id, owner);

    const cloneData = {
      name: `${original.name} (Copy)`,
      description: original.description,
      owner,
      status: 'active',
      triggerConfig: original.triggerConfig,
      nodes: original.nodes,
      edges: original.edges,
      tags: [...(original.tags || []), 'cloned'],
      version: 1,
    };

    return await Workflow.create(cloneData);
  }

  async deleteWorkflow(id, owner) {
    await this.getWorkflowById(id, owner);
    return await Workflow.findByIdAndDelete(id);
  }

  async executeWorkflow(id, inputPayload = {}, owner) {
    const wf = await this.getWorkflowById(id, owner);

    if (!wf.nodes || wf.nodes.length === 0) {
      throw new Error('Cannot execute empty workflow. Please add at least one node to canvas.');
    }

    const execution = await Execution.create({
      workflowId: wf._id || wf.id,
      workflowSnapshot: {
        name: wf.name,
        nodes: wf.nodes,
        edges: wf.edges,
        triggerConfig: wf.triggerConfig,
      },
      status: 'PENDING',
      inputPayload,
      owner,
      langGraphStatus: orchestrator.getLangGraphStatus(),
    });

    const executionId = execution._id || execution.id;

    // Queue for execution
    await addExecutionJob({
      executionId,
      workflowId: wf._id || wf.id,
      inputPayload,
      owner,
    });

    return {
      executionId,
      status: 'PENDING',
      workflowId: wf._id || wf.id,
      message: 'Workflow execution queued into multi-agent orchestrator chain.'
    };
  }
}

module.exports = new WorkflowService();
