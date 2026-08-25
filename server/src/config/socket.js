const { Server } = require('socket.io');
const config = require('./env');

let io = null;

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => callback(null, true),
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true,
    },
    pingTimeout: 60000,
  });

  io.on('connection', (socket) => {
    // console.log(`🔌 [Socket.IO] Client connected: ${socket.id}`);

    // Join room for specific execution stream
    socket.on('join:execution', (executionId) => {
      if (executionId) {
        socket.join(`execution:${executionId}`);
        // console.log(`Client ${socket.id} joined room execution:${executionId}`);
      }
    });

    socket.on('leave:execution', (executionId) => {
      if (executionId) {
        socket.leave(`execution:${executionId}`);
      }
    });

    // Join room for user personal notifications & status
    socket.on('join:user', (userId) => {
      if (userId) {
        socket.join(`user:${userId}`);
        // console.log(`Client ${socket.id} joined room user:${userId}`);
      }
    });

    socket.on('disconnect', () => {
      // console.log(`🔌 [Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

function getIO() {
  return io;
}

function emitExecutionEvent(executionId, eventName, data) {
  if (io) {
    io.to(`execution:${executionId}`).emit(eventName, data);
    // Also broadcast to general execution channel for dashboard monitors
    io.emit(`global:execution:${eventName}`, { executionId, ...data });
  }
}

function emitAgentTimeline(executionId, timelineLog) {
  if (io) {
    io.to(`execution:${executionId}`).emit('agent:timeline', timelineLog);
    io.emit('agent:timeline:global', { executionId, ...timelineLog });
  }
}

function emitUserEvent(userId, eventName, data) {
  if (io) {
    io.to(`user:${userId}`).emit(eventName, data);
  }
}

function broadcastEvent(eventName, data) {
  if (io) {
    io.emit(eventName, data);
  }
}

module.exports = {
  initSocket,
  getIO,
  emitExecutionEvent,
  emitAgentTimeline,
  emitUserEvent,
  broadcastEvent,
};
