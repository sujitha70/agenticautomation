const plannerAgent = require('./plannerAgent');
const executionAgent = require('./executionAgent');
const validationAgent = require('./validationAgent');
const recoveryAgent = require('./recoveryAgent');
const monitoringAgent = require('./monitoringAgent');
const Execution = require('../models/Execution');
const Workflow = require('../models/Workflow');

// Active execution controllers for pause / cancel signaling
const activeExecutionControls = new Map();

class Orchestrator {
  constructor() {
    this.langGraphStatus = 'available';
  }

  getLangGraphStatus() {
    return this.langGraphStatus;
  }

  async runWorkflow({ executionId, workflowId, inputPayload = {}, owner }) {
    const startTime = Date.now();
    const execution = await Execution.findById(executionId);
    if (!execution) throw new Error(`Execution ${executionId} not found.`);

    const workflow = await Workflow.findById(workflowId);
    const workflowSnapshot = execution.workflowSnapshot || (workflow ? { nodes: workflow.nodes, edges: workflow.edges } : {});
    const workflowName = workflow ? workflow.name : 'Automated Workflow';

    const control = {
      isPaused: false,
      isCancelled: false,
      pausePromise: null,
      resolvePause: null,
    };
    activeExecutionControls.set(executionId, control);

    try {
      // 1. Mark status RUNNING
      await Execution.findByIdAndUpdate(executionId, {
        status: 'RUNNING',
        startedAt: new Date(),
      });

      await monitoringAgent.onExecutionStart({
        executionId,
        workflowId,
        workflowName,
        owner,
      });

      // 2. Planner Agent resolves topology & sequence
      const plan = await plannerAgent.planExecution({
        executionId,
        workflowId,
        workflowSnapshot,
        inputPayload,
      });

      const { executionOrder = [], nodeMap = {} } = plan;
      const stepOutputs = {};
      const context = {
        inputPayload,
        stepOutputs,
        executionId,
        workflowId,
      };

      // 3. Execution Agent iteratively executes planned sequence
      for (let i = 0; i < executionOrder.length; i++) {
        const nodeId = executionOrder[i];
        const node = nodeMap[nodeId] || { id: nodeId, type: 'action_generic', data: {} };

        // Check for cancellation
        if (control.isCancelled) {
          await monitoringAgent.onExecutionCancelled({ executionId, workflowId, owner });
          await Execution.findByIdAndUpdate(executionId, {
            status: 'CANCELLED',
            completedAt: new Date(),
            duration: Date.now() - startTime,
          });
          activeExecutionControls.delete(executionId);
          return { status: 'CANCELLED' };
        }

        // Check for pause
        if (control.isPaused) {
          await monitoringAgent.onExecutionPaused({ executionId, workflowId, owner });
          await Execution.findByIdAndUpdate(executionId, {
            status: 'PAUSED',
            currentNodeId: nodeId,
          });

          // Wait for resume signal
          await new Promise((resolve) => {
            control.resolvePause = resolve;
          });

          // Resume logging
          await monitoringAgent.logEvent({
            executionId,
            workflowId,
            level: 'info',
            eventType: 'EXECUTION_RESUMED',
            message: `Operator resumed execution. Continuing at step "${node.data?.label || nodeId}".`,
          });
          await Execution.findByIdAndUpdate(executionId, { status: 'RUNNING' });
        }

        await Execution.findByIdAndUpdate(executionId, { currentNodeId: nodeId });
        await monitoringAgent.onStepProgress({
          executionId,
          workflowId,
          nodeId,
          stepIndex: i,
          totalSteps: executionOrder.length,
          status: 'running',
        });

        // Execute step with retry/recovery support
        let stepCompleted = false;
        let attempt = 1;
        const maxRetries = 3;
        let stepOutput = null;

        while (!stepCompleted && attempt <= maxRetries) {
          try {
            // Execution Agent runs node
            stepOutput = await executionAgent.executeNode({
              executionId,
              workflowId,
              node,
              context,
              owner,
            });

            // Validation Agent verifies output
            await validationAgent.validateNodeOutput({
              executionId,
              workflowId,
              node,
              output: stepOutput,
            });

            stepCompleted = true;
            stepOutputs[nodeId] = stepOutput;
            context.lastOutput = stepOutput;
          } catch (err) {
            // Recovery Agent classifies error & determines strategy
            const recovery = await recoveryAgent.handleFailure({
              executionId,
              workflowId,
              nodeId,
              error: err,
              attempt,
              maxRetries,
            });

            if (recovery.canRetry) {
              attempt++;
              await Execution.findByIdAndUpdate(executionId, {
                status: 'RETRYING',
                $inc: { retryCount: 1 },
              });
              await new Promise((r) => setTimeout(r, recovery.backoffDelayMs));
            } else {
              // Escalation - mark execution FAILED
              const durationMs = Date.now() - startTime;
              await Execution.findByIdAndUpdate(executionId, {
                status: 'FAILED',
                error: { message: err.message, category: recovery.category },
                completedAt: new Date(),
                duration: durationMs,
              });

              await monitoringAgent.onExecutionFailed({
                executionId,
                workflowId,
                workflowName,
                owner,
                durationMs,
                error: err,
                category: recovery.category,
              });

              activeExecutionControls.delete(executionId);
              return { status: 'FAILED', error: err.message, category: recovery.category };
            }
          }
        }
      }

      // 4. All steps completed successfully
      const durationMs = Date.now() - startTime;
      await Execution.findByIdAndUpdate(executionId, {
        status: 'COMPLETED',
        completedAt: new Date(),
        duration: durationMs,
        outputPayload: stepOutputs,
      });

      // Update Workflow last execution stats
      await Workflow.findByIdAndUpdate(workflowId, {
        lastExecutionAt: new Date(),
        $push: { executionHistory: executionId },
      });

      await monitoringAgent.onExecutionComplete({
        executionId,
        workflowId,
        workflowName,
        owner,
        durationMs,
        stepCount: executionOrder.length,
      });

      activeExecutionControls.delete(executionId);
      return {
        status: 'COMPLETED',
        durationMs,
        stepOutputs,
      };
    } catch (fatalError) {
      const durationMs = Date.now() - startTime;
      await Execution.findByIdAndUpdate(executionId, {
        status: 'FAILED',
        error: { message: fatalError.message },
        completedAt: new Date(),
        duration: durationMs,
      });

      await monitoringAgent.onExecutionFailed({
        executionId,
        workflowId,
        workflowName,
        owner,
        durationMs,
        error: fatalError,
        category: 'FATAL_ORCHESTRATION_ERROR',
      });

      activeExecutionControls.delete(executionId);
      return { status: 'FAILED', error: fatalError.message };
    }
  }

  pauseExecution(executionId) {
    const control = activeExecutionControls.get(executionId);
    if (control) {
      control.isPaused = true;
      return true;
    }
    return false;
  }

  resumeExecution(executionId) {
    const control = activeExecutionControls.get(executionId);
    if (control && control.isPaused) {
      control.isPaused = false;
      if (control.resolvePause) {
        control.resolvePause();
        control.resolvePause = null;
      }
      return true;
    }
    return false;
  }

  cancelExecution(executionId) {
    const control = activeExecutionControls.get(executionId);
    if (control) {
      control.isCancelled = true;
      if (control.resolvePause) {
        control.resolvePause();
      }
      return true;
    }
    return false;
  }
}

module.exports = new Orchestrator();
