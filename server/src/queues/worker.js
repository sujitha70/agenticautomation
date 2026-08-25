const { Worker } = require('bullmq');
const IORedis = require('ioredis');
const config = require('../config/env');
const orchestrator = require('../agents/orchestrator');
const { getExecutionQueue } = require('./executionQueue');

let workerInstance = null;

async function processExecutionJob(job) {
  const { executionId, workflowId, inputPayload, owner } = job.data;
  console.log(`⚙️ [Worker] Starting execution job ${job.id} for execution ${executionId}`);
  return await orchestrator.runWorkflow({
    executionId,
    workflowId,
    inputPayload,
    owner,
  });
}

function startWorker() {
  const queue = getExecutionQueue();

  if (config.USE_IN_MEMORY_QUEUE || !queue || typeof queue.process === 'function') {
    // In-memory queue handler
    if (queue && typeof queue.process === 'function') {
      queue.process(async (job) => {
        return await processExecutionJob(job);
      });
      console.log('⚡ [Worker] In-memory job worker initialized and listening.');
    }
    return;
  }

  try {
    const connection = new IORedis(config.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });

    workerInstance = new Worker(
      'agentflow-executions',
      async (job) => {
        return await processExecutionJob(job);
      },
      { connection, concurrency: 5 }
    );

    workerInstance.on('completed', (job) => {
      console.log(`✅ [Worker] Job ${job.id} completed.`);
    });

    workerInstance.on('failed', (job, err) => {
      console.error(`❌ [Worker] Job ${job.id} failed: ${err.message}`);
    });

    console.log('✅ [BullMQ Worker] Distributed worker started.');
  } catch (err) {
    console.warn(`⚠️ [BullMQ Worker] Worker start error: ${err.message}. Using in-memory runner.`);
  }
}

module.exports = {
  startWorker,
};
