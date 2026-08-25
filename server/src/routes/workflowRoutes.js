const express = require('express');
const { body, param } = require('express-validator');
const workflowController = require('../controllers/workflowController');
const { protect } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validationMiddleware');

const router = express.Router();

router.use(protect);

router.get('/dashboard', workflowController.getDashboardMetrics);
router.get('/catalog', workflowController.getNodeCatalog);

router.post(
  '/generate',
  [
    body('prompt').trim().notEmpty().withMessage('Prompt cannot be empty for workflow generation'),
    validateRequest,
  ],
  workflowController.generateWorkflow
);

router.get('/', workflowController.listWorkflows);

router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Workflow name is required'),
    validateRequest,
  ],
  workflowController.createWorkflow
);

router.get('/:id', workflowController.getWorkflowById);

router.put(
  '/:id',
  [
    body('name').optional().trim().notEmpty().withMessage('Workflow name cannot be empty'),
    validateRequest,
  ],
  workflowController.updateWorkflow
);

router.post('/:id/duplicate', workflowController.duplicateWorkflow);

router.post('/:id/execute', workflowController.executeWorkflow);

router.delete('/:id', workflowController.deleteWorkflow);

module.exports = router;
