const mongoose = require('mongoose');
const config = require('./env');

let isConnected = false;
let isInMemory = false;

// Global in-memory storage container when Mongo is not running
const memoryStore = {
  users: new Map(),
  workflows: new Map(),
  executions: new Map(),
  executionLogs: new Map(),
  integrations: new Map(),
  notifications: new Map(),
  agentMemories: new Map(),
};

async function connectDB() {
  if (config.USE_IN_MEMORY_DB) {
    console.log('⚡ [DB] Configured for in-memory database storage.');
    isInMemory = true;
    isConnected = true;
    return { isInMemory: true };
  }

  try {
    const conn = await mongoose.connect(config.MONGODB_URI, {
      serverSelectionTimeoutMS: 2000,
    });
    isConnected = true;
    isInMemory = false;
    console.log(`✅ [MongoDB] Connected to ${conn.connection.host}/${conn.connection.name}`);
    return { isInMemory: false, connection: conn };
  } catch (err) {
    console.warn(`⚠️ [MongoDB] Connection failed (${err.message}). Falling back to robust in-memory database store.`);
    isInMemory = true;
    isConnected = true;
    return { isInMemory: true };
  }
}

function getDatabaseStatus() {
  return {
    connected: isConnected,
    type: isInMemory ? 'in-memory' : 'mongodb',
    uri: isInMemory ? 'memory://agentflow_ai' : config.MONGODB_URI,
    stats: {
      users: memoryStore.users.size,
      workflows: memoryStore.workflows.size,
      executions: memoryStore.executions.size,
      executionLogs: memoryStore.executionLogs.size,
      integrations: memoryStore.integrations.size,
      notifications: memoryStore.notifications.size,
      agentMemories: memoryStore.agentMemories.size,
    }
  };
}

module.exports = {
  connectDB,
  getDatabaseStatus,
  memoryStore,
  get isInMemory() {
    return isInMemory;
  },
  get isConnected() {
    return isConnected;
  }
};
