const BaseIntegration = require('./baseIntegration');
const axios = require('axios');
const config = require('../config/env');

class DiscordIntegration extends BaseIntegration {
  constructor() {
    super('discord');
  }

  getMetadata() {
    return {
      provider: 'discord',
      name: 'Discord',
      description: 'Post bot messages, rich embeds, and channel notifications to Discord guilds',
      authType: 'oauth2',
      icon: 'MessageSquare',
      color: '#5865F2',
      actions: [
        {
          id: 'post_message',
          name: 'Post Channel Message',
          description: 'Send a message or embed to a Discord channel',
          inputs: [
            { name: 'channelId', label: 'Channel ID / Webhook URL', type: 'string', required: true, placeholder: '123456789012345678 or https://discord.com/api/webhooks/...' },
            { name: 'content', label: 'Message Content', type: 'textarea', required: true, placeholder: '📢 **System Notification**: Pipeline deployed' },
            { name: 'username', label: 'Bot Nickname', type: 'string', required: false, placeholder: 'Agentflow Bot' },
          ]
        },
        {
          id: 'post_embed',
          name: 'Post Rich Embed',
          description: 'Send a stylized Discord embed card with color and fields',
          inputs: [
            { name: 'channelId', label: 'Channel ID / Webhook URL', type: 'string', required: true },
            { name: 'title', label: 'Embed Title', type: 'string', required: true },
            { name: 'description', label: 'Embed Description', type: 'textarea', required: true },
            { name: 'color', label: 'Hex Color', type: 'string', default: '#5865F2' }
          ]
        }
      ],
      triggers: [
        { id: 'guild_message', name: 'New Message in Guild', description: 'Triggers on incoming messages' }
      ]
    };
  }

  getScopes() {
    return ['bot', 'identify', 'guilds'];
  }

  getAuthUrl(state) {
    if (!config.DISCORD_CLIENT_ID) {
      return `${config.DISCORD_REDIRECT_URI}?mock=true&state=${state}&code=mock_discord_code_${Date.now()}`;
    }
    const rootUrl = 'https://discord.com/api/oauth2/authorize';
    const params = new URLSearchParams({
      client_id: config.DISCORD_CLIENT_ID,
      permissions: '2048', // send messages
      scope: 'bot identify',
      redirect_uri: config.DISCORD_REDIRECT_URI,
      response_type: 'code',
      state: state || '',
    });
    return `${rootUrl}?${params.toString()}`;
  }

  async handleCallback(code, state) {
    if (code.startsWith('mock_discord_code_')) {
      return {
        accessToken: `mock_discord_bot_token_${Date.now()}`,
        refreshToken: `mock_discord_refresh_${Date.now()}`,
        expiresAt: new Date(Date.now() + 3600 * 1000 * 24 * 90),
        scopes: this.getScopes(),
        config: { guildName: 'Agentflow Server', guildId: '9876543210', channelId: 'general-alerts' }
      };
    }

    const params = new URLSearchParams({
      client_id: config.DISCORD_CLIENT_ID,
      client_secret: config.DISCORD_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
      redirect_uri: config.DISCORD_REDIRECT_URI,
    });

    const response = await axios.post('https://discord.com/api/oauth2/token', params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const data = response.data;
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
      scopes: data.scope ? data.scope.split(' ') : this.getScopes(),
      config: {
        guildId: data.guild ? data.guild.id : '',
        guildName: data.guild ? data.guild.name : 'Discord Server',
      }
    };
  }

  async testConnection(credentials) {
    this.validateCredentials(credentials);
    if (credentials.accessToken.startsWith('mock_')) {
      return { success: true, message: 'Discord simulated bot connection is ready.' };
    }
    try {
      const res = await axios.get('https://discord.com/api/v10/users/@me', {
        headers: { Authorization: `Bot ${config.DISCORD_BOT_TOKEN || credentials.accessToken}` }
      });
      return { success: true, botUser: res.data };
    } catch (err) {
      throw new Error(`Discord test connection failed: ${err.message}`);
    }
  }

  async executeAction(actionName, params = {}, credentials = {}) {
    this.validateCredentials(credentials);

    if (actionName === 'post_message') {
      const { channelId, content, username } = params;
      if (!channelId || !content) {
        throw new Error('MISSING_FIELDS: Discord post_message requires "channelId" and "content" fields.');
      }

      if (channelId.startsWith('http://') || channelId.startsWith('https://')) {
        // Post via Discord Webhook URL
        const webhookRes = await axios.post(channelId, {
          content,
          username: username || 'Agentflow AI Bot',
        });
        return { delivered: true, method: 'webhook', status: webhookRes.status };
      }

      if (credentials.accessToken.startsWith('mock_')) {
        return {
          delivered: true,
          channelId,
          messageId: `discord_msg_${Date.now()}`,
          content,
          username: username || 'Agentflow AI Bot',
          timestamp: new Date().toISOString(),
          provider: 'discord (simulated)'
        };
      }

      const botToken = config.DISCORD_BOT_TOKEN || credentials.accessToken;
      const res = await axios.post(`https://discord.com/api/v10/channels/${channelId}/messages`, {
        content,
      }, {
        headers: { Authorization: `Bot ${botToken}`, 'Content-Type': 'application/json' }
      });

      return {
        delivered: true,
        messageId: res.data.id,
        channelId: res.data.channel_id,
        content: res.data.content,
        timestamp: res.data.timestamp
      };
    }

    throw new Error(`Unsupported action ${actionName} for provider discord`);
  }
}

module.exports = new DiscordIntegration();
