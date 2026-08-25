/**
 * Base abstract class for all third-party tool integrations
 */
class BaseIntegration {
  constructor(providerName, options = {}) {
    if (this.constructor === BaseIntegration) {
      throw new Error('BaseIntegration cannot be instantiated directly.');
    }
    this.provider = providerName;
    this.options = options;
  }

  getMetadata() {
    return {
      provider: this.provider,
      name: this.provider.toUpperCase(),
      description: 'Third-party integration provider',
      authType: 'oauth2',
      actions: [],
      triggers: [],
    };
  }

  getScopes() {
    return [];
  }

  getAuthUrl(state) {
    throw new Error(`getAuthUrl not implemented for ${this.provider}`);
  }

  async handleCallback(code, state) {
    throw new Error(`handleCallback not implemented for ${this.provider}`);
  }

  async testConnection(credentials) {
    throw new Error(`testConnection not implemented for ${this.provider}`);
  }

  async executeAction(actionName, params, credentials) {
    throw new Error(`executeAction not implemented for ${this.provider}`);
  }

  validateCredentials(credentials) {
    if (!credentials || (!credentials.accessToken && !credentials.apiKey && !credentials.botToken)) {
      throw new Error(`INTEGRATION_NOT_CONNECTED: No valid credentials found for provider ${this.provider}. Please connect the integration first.`);
    }
    if (credentials.expiresAt && new Date(credentials.expiresAt) < new Date()) {
      throw new Error(`AUTH_EXPIRED: Access token for ${this.provider} has expired. Please re-authenticate.`);
    }
    return true;
  }
}

module.exports = BaseIntegration;
