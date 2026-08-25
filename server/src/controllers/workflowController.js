const workflowService = require('../services/workflowService');
const aiGenerationService = require('../services/aiGenerationService');

const getDashboardMetrics = async (req, res, next) => {
  try {
    const data = await workflowService.getDashboardMetrics(req.user.id);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};

const listWorkflows = async (req, res, next) => {
  try {
    const workflows = await workflowService.listWorkflows(req.user.id, req.query);
    res.status(200).json({
      success: true,
      count: workflows.length,
      workflows,
    });
  } catch (err) {
    next(err);
  }
};

const createWorkflow = async (req, res, next) => {
  try {
    const workflow = await workflowService.createWorkflow(req.body, req.user.id);
    res.status(201).json({
      success: true,
      message: 'Workflow created successfully.',
      workflow,
    });
  } catch (err) {
    next(err);
  }
};

const generateWorkflow = async (req, res, next) => {
  try {
    const { prompt } = req.body;
    const generated = await aiGenerationService.generateWorkflowFromPrompt(prompt);
    res.status(200).json({
      success: true,
      message: 'Workflow generated successfully by AI engine.',
      workflow: generated,
    });
  } catch (err) {
    next(err);
  }
};

const getNodeCatalog = async (req, res, next) => {
  try {
    const catalog = aiGenerationService.getNodeCatalog();
    res.status(200).json({
      success: true,
      catalog,
    });
  } catch (err) {
    next(err);
  }
};

const getWorkflowById = async (req, res, next) => {
  try {
    const workflow = await workflowService.getWorkflowById(req.params.id, req.user.id);
    res.status(200).json({
      success: true,
      workflow,
    });
  } catch (err) {
    next(err);
  }
};

const updateWorkflow = async (req, res, next) => {
  try {
    const workflow = await workflowService.updateWorkflow(req.params.id, req.body, req.user.id);
    res.status(200).json({
      success: true,
      message: 'Workflow updated successfully.',
      workflow,
    });
  } catch (err) {
    next(err);
  }
};

const duplicateWorkflow = async (req, res, next) => {
  try {
    const workflow = await workflowService.duplicateWorkflow(req.params.id, req.user.id);
    res.status(201).json({
      success: true,
      message: 'Workflow duplicated successfully.',
      workflow,
    });
  } catch (err) {
    next(err);
  }
};

const deleteWorkflow = async (req, res, next) => {
  try {
    await workflowService.deleteWorkflow(req.params.id, req.user.id);
    res.status(200).json({
      success: true,
      message: 'Workflow deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
};

const executeWorkflow = async (req, res, next) => {
  try {
    const result = await workflowService.executeWorkflow(
      req.params.id,
      req.body.inputPayload || {},
      req.user.id
    );
    res.status(202).json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDashboardMetrics,
  listWorkflows,
  createWorkflow,
  generateWorkflow,
  getNodeCatalog,
  getWorkflowById,
  updateWorkflow,
  duplicateWorkflow,
  deleteWorkflow,
  executeWorkflow,
};
