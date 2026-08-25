const express = require('express');
const { body } = require('express-validator');
const integrationController = require('../controllers/integrationController');
const { protect } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validationMiddleware');

const router = express.Router();

// OAuth callback and errors (can be called by OAuth redirect before Bearer header)
router.get('/oauth/error', integrationController.getOAuthError);
router.get('/oauth/:provider/callback', integrationController.handleOAuthCallback);

// Protected routes
router.use(protect);

router.get('/', integrationController.listIntegrations);
router.get('/status', integrationController.getStatusSummary);
router.get('/oauth/:provider/start', integrationController.getOAuthStart);

router.post(
  '/',
  [
    body('provider').isIn(['gmail', 'slack', 'discord', 'google-sheets', 'openrouter', 'gemini']).withMessage('Invalid provider'),
    validateRequest,
  ],
  integrationController.saveCustomConfig
);

router.post('/:provider/test', integrationController.testConnection);
router.delete('/:provider', integrationController.disconnect);

module.exports = router;
