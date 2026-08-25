const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');

const config = require('./config/env');
const { connectDB } = require('./config/db');
const { initSocket } = require('./config/socket');
const { setupExecutionQueue } = require('./queues/executionQueue');
const { startWorker } = require('./queues/worker');
const errorHandler = require('./middleware/errorHandler');
const routes = require('./routes');

const app = express();
const server = http.createServer(app);

// 1. Security & Performance Middleware
app.use(helmet({
  crossOriginResourcePolicy: false,
}));
app.use(cors({
  origin: [config.CLIENT_URL, 'http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
}));
app.use(compression());
app.use(morgan(config.NODE_ENV === 'development' ? 'dev' : 'combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 2. Initialize Real-Time WebSockets
const io = initSocket(server);

// 3. API Routes
app.use('/api', routes);

// Root fallback for health check
app.get('/', (req, res) => {
  res.json({
    platform: 'Agentic AI Automation Platform (Agentflow_AI)',
    version: '1.0.0',
    status: 'ONLINE',
    docs: '/api/health',
  });
});

// 4. Centralized Error Handler
app.use(errorHandler);

// 5. Start Server Lifecycle
async function bootstrap() {
  try {
    // Connect to database (Mongo or In-Memory)
    await connectDB();

    // Setup queue & background worker
    setupExecutionQueue();
    startWorker();

    const PORT = config.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`🚀 [Server] Agentflow_AI backend listening on port ${PORT}`);
      console.log(`📡 [Realtime] Socket.IO ready on port ${PORT}`);
      console.log(`🌐 [Client URL] Configured for ${config.CLIENT_URL}`);
    });
  } catch (err) {
    console.error('❌ [Fatal] Server bootstrap failure:', err);
    process.exit(1);
  }
}

bootstrap();

module.exports = { app, server };
