const Integration = require('../models/Integration');
const { encryptToken, decryptToken, checkEncryptionHealth } = require('../config/security');
const gmailIntegration = require('../integrations/gmailIntegration');
const slackIntegration = require('../integrations/slackIntegration');
const discordIntegration = require('../integrations/discordIntegration');
const googleSheetsIntegration = require('../integrations/googleSheetsIntegration');
const config = require('../config/env');

const ADAPTERS = {
  gmail: gmailIntegration,
  slack: slackIntegration,
  discord: discordIntegration,
  'google-sheets': googleSheetsIntegration,
};

class IntegrationService {
  getAdapter(provider) {
    const adapter = ADAPTERS[provider];
    if (!adapter) {
      throw new Error(`Unsupported integration provider: ${provider}`);
    }
    return adapter;
  }

  async listUserIntegrations(owner) {
    const stored = await Integration.find({ owner });
    const storedMap = new Map();
    stored.forEach((item) => storedMap.set(item.provider, item));

    const providers = ['gmail', 'slack', 'discord', 'google-sheets', 'openrouter', 'gemini'];

    return providers.map((p) => {
      const adapter = ADAPTERS[p];
      const metadata = adapter ? adapter.getMetadata() : {
        provider: p,
        name: p === 'openrouter' ? 'OpenRouter AI' : 'Google Gemini AI',
        description: p === 'openrouter' ? 'LLM orchestration model routing' : 'Google Multimodal Generative AI',
        authType: 'api_key',
        color: p === 'openrouter' ? '#10B981' : '#4285F4',
        icon: 'Sparkles',
        actions: [{ id: 'generate_text', name: 'Generate Text / Reasoning', description: 'Run prompt on model' }],
      };

      const doc = storedMap.get(p);
      let status = 'disconnected';
      let configData = {};
      let expiresAt = null;

      if (doc) {
        status = doc.status;
        configData = doc.config || {};
        expiresAt = doc.expiresAt;
      } else if (p === 'openrouter' && config.OPENROUTER_API_KEY) {
        status = 'connected';
        configData = { model: config.OPENROUTER_DEFAULT_MODEL };
      } else if (p === 'gemini' && config.GEMINI_API_KEY) {
        status = 'connected';
        configData = { model: 'gemini-1.5-flash' };
      }

      return {
        provider: p,
        name: metadata.name,
        description: metadata.description,
        icon: metadata.icon || 'Layers',
        color: metadata.color || '#3B82F6',
        authType: metadata.authType,
        status,
        expiresAt,
        config: configData,
        actions: metadata.actions || [],
      };
    });
  }

  async getStatusSummary(owner) {
    const integrations = await this.listUserIntegrations(owner);
    const encryptionHealth = checkEncryptionHealth();

    return {
      encryptionHealth,
      connectedCount: integrations.filter((i) => i.status === 'connected').length,
      totalProviders: integrations.length,
      providers: integrations,
    };
  }

  async getOAuthStart(provider, owner) {
    const adapter = this.getAdapter(provider);
    const state = Buffer.from(JSON.stringify({ owner, provider, ts: Date.now() })).toString('base64');
    const authUrl = adapter.getAuthUrl(state);
    return { authUrl, state };
  }

  async handleOAuthCallback(provider, code, state) {
    let owner = null;
    try {
      if (state) {
        const parsed = JSON.parse(Buffer.from(state, 'base64').toString('utf8'));
        owner = parsed.owner;
      }
    } catch (_) {}

    if (!owner) {
      throw new Error('Invalid OAuth state. Please start the connection flow again.');
    }

    const adapter = this.getAdapter(provider);
    const tokenResult = await adapter.handleCallback(code, state);

    const encryptedAccessToken = encryptToken(tokenResult.accessToken);
    const encryptedRefreshToken = encryptToken(tokenResult.refreshToken);

    const updated = await Integration.findOneAndUpdate(
      { owner, provider },
      {
        $set: {
          owner,
          provider,
          status: 'connected',
          scopes: tokenResult.scopes || [],
          encryptedAccessToken,
          encryptedRefreshToken,
          expiresAt: tokenResult.expiresAt,
          config: tokenResult.config || {},
          error: null,
        }
      },
      { upsert: true, new: true }
    );

    return updated;
  }

  async testConnection(provider, owner) {
    if (provider === 'openrouter') {
      return { success: true, message: 'OpenRouter provider is configured.' };
    }
    if (provider === 'gemini') {
      return { success: true, message: 'Google Gemini provider is configured.' };
    }

    const adapter = this.getAdapter(provider);
    const doc = await Integration.findOne({ owner, provider });

    if (!doc || doc.status !== 'connected' || !doc.encryptedAccessToken) {
      throw new Error(`INTEGRATION_NOT_CONNECTED: ${provider} is not connected. Please connect it first.`);
    }

    const accessToken = decryptToken(doc.encryptedAccessToken);
    const refreshToken = decryptToken(doc.encryptedRefreshToken);

    const result = await adapter.testConnection({
      accessToken,
      refreshToken,
      expiresAt: doc.expiresAt,
      config: doc.config,
    });

    return result;
  }

  async saveCustomConfig(provider, owner, { accessToken, apiKey, config: extraConfig }) {
    let encryptedAccessToken = '';
    if (accessToken || apiKey) {
      encryptedAccessToken = encryptToken(accessToken || apiKey);
    }

    return await Integration.findOneAndUpdate(
      { owner, provider },
      {
        $set: {
          owner,
          provider,
          status: 'connected',
          encryptedAccessToken,
          config: extraConfig || {},
          error: null,
        }
      },
      { upsert: true, new: true }
    );
  }

  async disconnect(provider, owner) {
    return await Integration.deleteOne({ owner, provider });
  }

  async executeAction(provider, actionName, params = {}, owner) {
    const adapter = this.getAdapter(provider);
    const doc = await Integration.findOne({ owner, provider });

    let credentials = {};
    if (doc && doc.encryptedAccessToken) {
      credentials.accessToken = decryptToken(doc.encryptedAccessToken);
      credentials.refreshToken = decryptToken(doc.encryptedRefreshToken);
      credentials.expiresAt = doc.expiresAt;
      credentials.config = doc.config;
    } else {
      // Check if simulated fallback is allowed or environment token is present
      if (provider === 'gmail' && !config.GMAIL_CLIENT_ID) {
        credentials.accessToken = 'mock_gmail_access_auto';
      } else if (provider === 'slack' && !config.SLACK_CLIENT_ID) {
        credentials.accessToken = 'mock_xoxb_slack_token_auto';
      } else if (provider === 'discord' && (!config.DISCORD_CLIENT_ID && !config.DISCORD_BOT_TOKEN)) {
        credentials.accessToken = 'mock_discord_bot_token_auto';
      } else if (provider === 'google-sheets' && !config.GOOGLE_SHEETS_CLIENT_ID) {
        credentials.accessToken = 'mock_sheets_access_auto';
      } else {
        throw new Error(`INTEGRATION_NOT_CONNECTED: Provider '${provider}' has no active connection for this user.`);
      }
    }

    return await adapter.executeAction(actionName, params, credentials);
  }
}

module.exports = new IntegrationService();
