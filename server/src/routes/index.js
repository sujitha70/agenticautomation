const express = require('express');
const authRoutes = require('./authRoutes');
const workflowRoutes = require('./workflowRoutes');
const executionRoutes = require('./executionRoutes');
const integrationRoutes = require('./integrationRoutes');
const notificationRoutes = require('./notificationRoutes');
const healthRoutes = require('./healthRoutes');

const router = express.Router();

router.use('/', healthRoutes);
router.use('/auth', authRoutes);
router.use('/workflows', workflowRoutes);
router.use('/executions', executionRoutes);
router.use('/integrations', integrationRoutes);
router.use('/notifications', notificationRoutes);

module.exports = router;
