const { initQueue, getQueue } = require('../config/queue');

let queueInstance = null;

function setupExecutionQueue() {
  const { queue } = initQueue('agentflow-executions');
  queueInstance = queue;
  return queueInstance;
}

async function addExecutionJob({ executionId, workflowId, inputPayload, owner }) {
  if (!queueInstance) {
    setupExecutionQueue();
  }

  const job = await queueInstance.add(
    'execute-workflow',
    {
      executionId,
      workflowId,
      inputPayload,
      owner,
    },
    {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1500,
      },
      removeOnComplete: true,
    }
  );

  return job;
}

module.exports = {
  setupExecutionQueue,
  addExecutionJob,
  getExecutionQueue: () => queueInstance || getQueue(),
};
