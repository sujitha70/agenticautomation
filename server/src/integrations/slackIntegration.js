const BaseIntegration = require('./baseIntegration');
const axios = require('axios');
const config = require('../config/env');

class SlackIntegration extends BaseIntegration {
  constructor() {
    super('slack');
  }

  getMetadata() {
    return {
      provider: 'slack',
      name: 'Slack',
      description: 'Post automated channel alerts, direct messages and block kits in Slack workspaces',
      authType: 'oauth2',
      icon: 'Slack',
      color: '#4A154B',
      actions: [
        {
          id: 'post_message',
          name: 'Post Channel Message',
          description: 'Post a text or markdown message to a designated channel',
          inputs: [
            { name: 'channel', label: 'Channel ID / Name', type: 'string', required: true, placeholder: '#general or C12345678' },
            { name: 'text', label: 'Message Text', type: 'textarea', required: true, placeholder: '🚀 Alert: Execution finished successfully' },
            { name: 'botName', label: 'Bot Username', type: 'string', required: false, placeholder: 'Agentflow Bot' },
          ]
        },
        {
          id: 'post_blocks',
          name: 'Post Interactive Block Kit',
          description: 'Send rich JSON block layout to a channel',
          inputs: [
            { name: 'channel', label: 'Channel ID', type: 'string', required: true },
            { name: 'blocks', label: 'Blocks JSON', type: 'textarea', required: true, placeholder: '[\n  {"type": "section", "text": {"type": "mrkdwn", "text": "*Task Complete*"}}\n]' }
          ]
        }
      ],
      triggers: [
        { id: 'channel_message', name: 'New Message in Channel', description: 'Triggers when a message is posted in a channel' }
      ]
    };
  }

  getScopes() {
    return [
      'chat:write',
      'chat:write.public',
      'channels:read',
      'users:read'
    ];
  }

  getAuthUrl(state) {
    if (!config.SLACK_CLIENT_ID) {
      return `${config.SLACK_REDIRECT_URI}?mock=true&state=${state}&code=mock_slack_code_${Date.now()}`;
    }
    const rootUrl = 'https://slack.com/oauth/v2/authorize';
    const params = new URLSearchParams({
      client_id: config.SLACK_CLIENT_ID,
      scope: this.getScopes().join(','),
      redirect_uri: config.SLACK_REDIRECT_URI,
      state: state || '',
    });
    return `${rootUrl}?${params.toString()}`;
  }

  async handleCallback(code, state) {
    if (code.startsWith('mock_slack_code_')) {
      return {
        accessToken: `mock_xoxb_slack_token_${Date.now()}`,
        refreshToken: `mock_slack_refresh_${Date.now()}`,
        expiresAt: new Date(Date.now() + 3600 * 1000 * 24 * 60),
        scopes: this.getScopes(),
        config: { teamName: 'Agentic Ops HQ', teamId: 'T00000001', channel: '#general' }
      };
    }

    const response = await axios.post('https://slack.com/api/oauth.v2.access', null, {
      params: {
        code,
        client_id: config.SLACK_CLIENT_ID,
        client_secret: config.SLACK_CLIENT_SECRET,
        redirect_uri: config.SLACK_REDIRECT_URI,
      }
    });

    if (!response.data.ok) {
      throw new Error(`Slack OAuth error: ${response.data.error || 'Failed to exchange token'}`);
    }

    const data = response.data;
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || '',
      expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : null,
      scopes: this.getScopes(),
      config: {
        teamName: data.team ? data.team.name : 'Slack Team',
        teamId: data.team ? data.team.id : '',
        botUserId: data.bot_user_id || '',
      }
    };
  }

  async testConnection(credentials) {
    this.validateCredentials(credentials);
    if (credentials.accessToken.startsWith('mock_')) {
      return { success: true, message: 'Slack simulated workspace connection is active.' };
    }
    try {
      const res = await axios.post('https://slack.com/api/auth.test', null, {
        headers: { Authorization: `Bearer ${credentials.accessToken}` }
      });
      if (!res.data.ok) {
        throw new Error(`Slack auth test failed: ${res.data.error}`);
      }
      return { success: true, details: res.data };
    } catch (err) {
      throw new Error(`Slack connection error: ${err.message}`);
    }
  }

  async executeAction(actionName, params = {}, credentials = {}) {
    this.validateCredentials(credentials);

    if (actionName === 'post_message') {
      const { channel, text, botName } = params;
      if (!channel || !text) {
        throw new Error('MISSING_FIELDS: Slack post_message requires "channel" and "text" fields.');
      }

      if (credentials.accessToken.startsWith('mock_')) {
        return {
          delivered: true,
          channel: channel.startsWith('#') ? channel : `#${channel}`,
          ts: `${Date.now() / 1000}`,
          message: text,
          bot: botName || 'Agentflow AI Bot',
          timestamp: new Date().toISOString(),
          provider: 'slack (simulated)'
        };
      }

      const res = await axios.post('https://slack.com/api/chat.postMessage', {
        channel,
        text,
        username: botName || 'Agentflow AI Bot',
      }, {
        headers: {
          Authorization: `Bearer ${credentials.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!res.data.ok) {
        if (res.data.error === 'invalid_auth' || res.data.error === 'token_expired') {
          throw new Error('AUTH_EXPIRED: Slack authorization token has expired or is invalid.');
        }
        throw new Error(`Slack API error: ${res.data.error}`);
      }

      return {
        delivered: true,
        channel: res.data.channel,
        ts: res.data.ts,
        message: res.data.message ? res.data.message.text : text,
        timestamp: new Date().toISOString()
      };
    }

    throw new Error(`Unsupported action ${actionName} for provider slack`);
  }
}

module.exports = new SlackIntegration();
