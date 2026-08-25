const { Queue, Worker } = require('bullmq');
const IORedis = require('ioredis');
const config = require('./env');
const EventEmitter = require('events');

class InMemoryJobQueue extends EventEmitter {
  constructor(name) {
    super();
    this.name = name;
    this.jobs = new Map();
    this.activeJobs = new Set();
    this.isPaused = false;
    this.processor = null;
  }

  async add(name, data, opts = {}) {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const job = {
      id: jobId,
      name,
      data,
      opts,
      status: 'waiting',
      attemptsMade: 0,
      maxAttempts: opts.attempts || 3,
      backoff: opts.backoff || { type: 'exponential', delay: 1000 },
      createdAt: new Date(),
    };

    this.jobs.set(jobId, job);
    
    // Process async
    if (!this.isPaused) {
      setImmediate(() => this._processNext(jobId));
    }
    
    return job;
  }

  process(processorFn) {
    this.processor = processorFn;
  }

  async _processNext(jobId) {
    const job = this.jobs.get(jobId);
    if (!job || this.isPaused || this.activeJobs.has(jobId)) return;

    if (!this.processor) {
      setTimeout(() => this._processNext(jobId), 200);
      return;
    }

    this.activeJobs.add(jobId);
    job.status = 'active';

    try {
      await this.processor(job);
      job.status = 'completed';
      this.activeJobs.delete(jobId);
      this.emit('completed', job);
    } catch (err) {
      job.attemptsMade++;
      if (job.attemptsMade < job.maxAttempts) {
        job.status = 'retrying';
        this.activeJobs.delete(jobId);
        const delay = (job.backoff.delay || 1000) * Math.pow(2, job.attemptsMade - 1);
        setTimeout(() => this._processNext(jobId), delay);
      } else {
        job.status = 'failed';
        job.failedReason = err.message;
        this.activeJobs.delete(jobId);
        this.emit('failed', job, err);
      }
    }
  }

  pause() {
    this.isPaused = true;
  }

  resume() {
    this.isPaused = false;
    for (const [id, job] of this.jobs) {
      if (job.status === 'waiting' || job.status === 'retrying') {
        this._processNext(id);
      }
    }
  }

  async getJob(jobId) {
    return this.jobs.get(jobId) || null;
  }
}

let redisClient = null;
let bullQueue = null;
let inMemoryQueue = null;
let isUsingRedis = false;

function initQueue(queueName = 'agentflow-executions') {
  if (config.USE_IN_MEMORY_QUEUE) {
    console.log(`⚡ [Queue] Using in-memory asynchronous job queue (${queueName})`);
    inMemoryQueue = new InMemoryJobQueue(queueName);
    return { isUsingRedis: false, queue: inMemoryQueue };
  }

  try {
    redisClient = new IORedis(config.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      retryStrategy: () => null, // don't hang if redis is absent
    });

    redisClient.on('error', (err) => {
      if (!isUsingRedis) {
        console.warn(`⚠️ [Redis] Redis unavailable (${err.message}). Using in-memory queue fallback.`);
        inMemoryQueue = new InMemoryJobQueue(queueName);
      }
    });

    bullQueue = new Queue(queueName, { connection: redisClient });
    isUsingRedis = true;
    console.log(`✅ [BullMQ] Initialized queue: ${queueName} with Redis.`);
    return { isUsingRedis: true, queue: bullQueue };
  } catch (err) {
    console.warn(`⚠️ [Queue] Redis initialization failed. Using in-memory queue.`);
    inMemoryQueue = new InMemoryJobQueue(queueName);
    return { isUsingRedis: false, queue: inMemoryQueue };
  }
}

function getQueue() {
  return isUsingRedis && bullQueue ? bullQueue : inMemoryQueue;
}

module.exports = {
  initQueue,
  getQueue,
  InMemoryJobQueue,
  isUsingRedis: () => isUsingRedis,
};
