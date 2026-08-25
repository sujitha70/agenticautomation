const executionService = require('../services/executionService');

const listExecutions = async (req, res, next) => {
  try {
    const executions = await executionService.listExecutions(req.user.id, req.query);
    res.status(200).json({
      success: true,
      count: executions.length,
      executions,
    });
  } catch (err) {
    next(err);
  }
};

const getExecutionById = async (req, res, next) => {
  try {
    const execution = await executionService.getExecutionById(req.params.id, req.user.id);
    res.status(200).json({
      success: true,
      execution,
    });
  } catch (err) {
    next(err);
  }
};

const getExecutionTimeline = async (req, res, next) => {
  try {
    const timeline = await executionService.getExecutionTimeline(req.params.id, req.user.id);
    res.status(200).json({
      success: true,
      count: timeline.length,
      timeline,
    });
  } catch (err) {
    next(err);
  }
};

const pauseExecution = async (req, res, next) => {
  try {
    const result = await executionService.pauseExecution(req.params.id, req.user.id);
    res.status(200).json({
      success: true,
      message: 'Execution pause signal dispatched.',
      ...result,
    });
  } catch (err) {
    next(err);
  }
};

const resumeExecution = async (req, res, next) => {
  try {
    const result = await executionService.resumeExecution(req.params.id, req.user.id);
    res.status(200).json({
      success: true,
      message: 'Execution resume signal dispatched.',
      ...result,
    });
  } catch (err) {
    next(err);
  }
};

const cancelExecution = async (req, res, next) => {
  try {
    const result = await executionService.cancelExecution(req.params.id, req.user.id);
    res.status(200).json({
      success: true,
      message: 'Execution cancelled.',
      ...result,
    });
  } catch (err) {
    next(err);
  }
};

const retryExecution = async (req, res, next) => {
  try {
    const result = await executionService.retryExecution(req.params.id, req.user.id);
    res.status(202).json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listExecutions,
  getExecutionById,
  getExecutionTimeline,
  pauseExecution,
  resumeExecution,
  cancelExecution,
  retryExecution,
};
