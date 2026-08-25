const integrationService = require('../services/integrationService');
const config = require('../config/env');

const listIntegrations = async (req, res, next) => {
  try {
    const integrations = await integrationService.listUserIntegrations(req.user.id);
    res.status(200).json({
      success: true,
      count: integrations.length,
      integrations,
    });
  } catch (err) {
    next(err);
  }
};

const getStatusSummary = async (req, res, next) => {
  try {
    const summary = await integrationService.getStatusSummary(req.user.id);
    res.status(200).json({
      success: true,
      summary,
    });
  } catch (err) {
    next(err);
  }
};

const getOAuthStart = async (req, res, next) => {
  try {
    const { provider } = req.params;
    const { authUrl, state } = await integrationService.getOAuthStart(provider, req.user.id);
    res.status(200).json({
      success: true,
      provider,
      authUrl,
      state,
    });
  } catch (err) {
    next(err);
  }
};

const handleOAuthCallback = async (req, res, next) => {
  try {
    const { provider } = req.params;
    const { code, state, error } = req.query;

    if (error) {
      return res.redirect(`${config.CLIENT_URL}/integrations?error=${encodeURIComponent(error)}`);
    }

    if (!code) {
      return res.redirect(`${config.CLIENT_URL}/integrations?error=missing_code`);
    }

    await integrationService.handleOAuthCallback(provider, code, state);

    // Redirect to client integrations page with success parameter
    res.redirect(`${config.CLIENT_URL}/integrations?connected=${provider}`);
  } catch (err) {
    res.redirect(`${config.CLIENT_URL}/integrations?error=${encodeURIComponent(err.message)}`);
  }
};

const getOAuthError = async (req, res) => {
  res.status(400).json({
    success: false,
    code: 'OAUTH_FAILED',
    message: 'OAuth authorization could not be completed. Please verify API credentials and retry.',
  });
};

const saveCustomConfig = async (req, res, next) => {
  try {
    const { provider, accessToken, apiKey, config: extraConfig } = req.body;
    const integration = await integrationService.saveCustomConfig(provider, req.user.id, {
      accessToken,
      apiKey,
      config: extraConfig,
    });
    res.status(200).json({
      success: true,
      message: `${provider} integration configuration saved.`,
      integration,
    });
  } catch (err) {
    next(err);
  }
};

const testConnection = async (req, res, next) => {
  try {
    const { provider } = req.params;
    const result = await integrationService.testConnection(provider, req.user.id);
    res.status(200).json({
      success: true,
      message: `Connection test for ${provider} succeeded.`,
      result,
    });
  } catch (err) {
    next(err);
  }
};

const disconnect = async (req, res, next) => {
  try {
    const { provider } = req.params;
    await integrationService.disconnect(provider, req.user.id);
    res.status(200).json({
      success: true,
      message: `${provider} disconnected successfully.`,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listIntegrations,
  getStatusSummary,
  getOAuthStart,
  handleOAuthCallback,
  getOAuthError,
  saveCustomConfig,
  testConnection,
  disconnect,
};
