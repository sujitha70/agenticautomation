const BaseAgent = require('./baseAgent');
const { emitExecutionEvent } = require('../config/socket');
const notificationService = require('../services/notificationService');

class MonitoringAgent extends BaseAgent {
  constructor() {
    super('monitoring', 'Telemetry, Observability & Health Metrics');
  }

  async onExecutionStart({ executionId, workflowId, workflowName, owner }) {
    await this.logEvent({
      executionId,
      workflowId,
      eventType: 'EXECUTION_STARTED',
      message: `Monitoring Agent initialized session for "${workflowName}". Telemetry active.`,
      metadata: { startedAt: new Date().toISOString() }
    });

    emitExecutionEvent(executionId, 'execution:status', {
      executionId,
      status: 'RUNNING',
      startedAt: new Date().toISOString(),
    });
  }

  async onStepProgress({ executionId, workflowId, nodeId, stepIndex, totalSteps, status }) {
    emitExecutionEvent(executionId, 'execution:progress', {
      executionId,
      nodeId,
      stepIndex,
      totalSteps,
      progressPercent: Math.round(((stepIndex + 1) / totalSteps) * 100),
      status,
    });
  }

  async onExecutionComplete({ executionId, workflowId, workflowName, owner, durationMs, stepCount }) {
    await this.logEvent({
      executionId,
      workflowId,
      level: 'success',
      eventType: 'EXECUTION_COMPLETED',
      message: `Execution of "${workflowName}" completed in ${durationMs}ms (${stepCount} steps).`,
      metadata: { durationMs, stepCount, status: 'COMPLETED' }
    });

    emitExecutionEvent(executionId, 'execution:status', {
      executionId,
      status: 'COMPLETED',
      duration: durationMs,
      completedAt: new Date().toISOString(),
    });

    await notificationService.createNotification({
      owner,
      workflowId,
      executionId,
      type: 'success',
      title: 'Workflow Execution Successful',
      message: `Automation "${workflowName}" completed all ${stepCount} steps in ${durationMs}ms.`
    });
  }

  async onExecutionFailed({ executionId, workflowId, workflowName, owner, durationMs, error, category }) {
    await this.logEvent({
      executionId,
      workflowId,
      level: 'error',
      eventType: 'EXECUTION_FAILED',
      message: `Execution of "${workflowName}" failed: ${error.message || error}`,
      metadata: { durationMs, error: error.message || error, category, status: 'FAILED' }
    });

    emitExecutionEvent(executionId, 'execution:status', {
      executionId,
      status: 'FAILED',
      error: error.message || error,
      completedAt: new Date().toISOString(),
    });

    await notificationService.createNotification({
      owner,
      workflowId,
      executionId,
      type: 'failure',
      title: 'Workflow Execution Failed',
      message: `Automation "${workflowName}" encountered [${category || 'ERROR'}]: ${error.message || error}`
    });
  }

  async onExecutionPaused({ executionId, workflowId, owner }) {
    await this.logEvent({
      executionId,
      workflowId,
      level: 'warning',
      eventType: 'EXECUTION_PAUSED',
      message: 'Operator requested execution pause. Current step suspended.',
    });

    emitExecutionEvent(executionId, 'execution:status', {
      executionId,
      status: 'PAUSED'
    });
  }

  async onExecutionCancelled({ executionId, workflowId, owner }) {
    await this.logEvent({
      executionId,
      workflowId,
      level: 'warning',
      eventType: 'EXECUTION_CANCELLED',
      message: 'Operator requested execution cancellation. Process terminated.',
    });

    emitExecutionEvent(executionId, 'execution:status', {
      executionId,
      status: 'CANCELLED'
    });
  }
}

module.exports = new MonitoringAgent();
