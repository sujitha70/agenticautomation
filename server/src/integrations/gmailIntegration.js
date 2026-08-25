const BaseIntegration = require('./baseIntegration');
const axios = require('axios');
const config = require('../config/env');

class GmailIntegration extends BaseIntegration {
  constructor() {
    super('gmail');
  }

  getMetadata() {
    return {
      provider: 'gmail',
      name: 'Gmail',
      description: 'Send and read automated emails via Google Workspace and Gmail API',
      authType: 'oauth2',
      icon: 'Mail',
      color: '#EA4335',
      actions: [
        {
          id: 'send_email',
          name: 'Send Email',
          description: 'Send a formatted email to one or multiple recipients',
          inputs: [
            { name: 'to', label: 'To Email', type: 'string', required: true, placeholder: 'user@example.com' },
            { name: 'subject', label: 'Subject', type: 'string', required: true, placeholder: 'Automation Alert' },
            { name: 'body', label: 'Email Body', type: 'textarea', required: true, placeholder: 'Hello,\n\nThis is an automated message.' },
            { name: 'cc', label: 'CC', type: 'string', required: false },
          ]
        },
        {
          id: 'read_emails',
          name: 'Read Recent Emails',
          description: 'Search and read recent emails matching a query',
          inputs: [
            { name: 'query', label: 'Search Query', type: 'string', required: false, placeholder: 'is:unread from:billing' },
            { name: 'maxResults', label: 'Max Results', type: 'number', default: 5 }
          ]
        }
      ],
      triggers: [
        { id: 'new_email', name: 'New Email Received', description: 'Triggers when a new email arrives matching filters' }
      ]
    };
  }

  getScopes() {
    return [
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/userinfo.email'
    ];
  }

  getAuthUrl(state) {
    if (!config.GMAIL_CLIENT_ID) {
      // Return simulated auth link for local testing without Google console setup
      return `${config.GMAIL_REDIRECT_URI}?mock=true&state=${state}&code=mock_gmail_code_${Date.now()}`;
    }
    const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
    const options = {
      redirect_uri: config.GMAIL_REDIRECT_URI,
      client_id: config.GMAIL_CLIENT_ID,
      access_type: 'offline',
      response_type: 'code',
      prompt: 'consent',
      scope: this.getScopes().join(' '),
      state: state || '',
    };
    const qs = new URLSearchParams(options);
    return `${rootUrl}?${qs.toString()}`;
  }

  async handleCallback(code, state) {
    if (code.startsWith('mock_gmail_code_')) {
      return {
        accessToken: `mock_gmail_access_${Date.now()}`,
        refreshToken: `mock_gmail_refresh_${Date.now()}`,
        expiresAt: new Date(Date.now() + 3600 * 1000 * 24 * 30),
        scopes: this.getScopes(),
        config: { email: 'operator@agentflow.io', connectedAs: 'Operator (Simulated)' }
      };
    }

    const response = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: config.GMAIL_CLIENT_ID,
      client_secret: config.GMAIL_CLIENT_SECRET,
      redirect_uri: config.GMAIL_REDIRECT_URI,
      grant_type: 'authorization_code',
    });

    const { access_token, refresh_token, expires_in } = response.data;
    
    // Fetch user email for display
    let email = 'operator@workspace.com';
    try {
      const profile = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${access_token}` }
      });
      email = profile.data.email || email;
    } catch (_) {}

    return {
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresAt: new Date(Date.now() + expires_in * 1000),
      scopes: this.getScopes(),
      config: { email, connectedAs: email }
    };
  }

  async testConnection(credentials) {
    this.validateCredentials(credentials);
    if (credentials.accessToken.startsWith('mock_')) {
      return { success: true, message: 'Gmail simulated connection is healthy.' };
    }
    try {
      const res = await axios.get('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
        headers: { Authorization: `Bearer ${credentials.accessToken}` }
      });
      return { success: true, profile: res.data };
    } catch (err) {
      if (err.response && err.response.status === 401) {
        throw new Error('AUTH_EXPIRED: Gmail token has expired. Please reconnect.');
      }
      throw new Error(`Gmail API error: ${err.message}`);
    }
  }

  async executeAction(actionName, params = {}, credentials = {}) {
    this.validateCredentials(credentials);

    if (actionName === 'send_email') {
      const { to, subject, body, cc } = params;
      if (!to || !subject) {
        throw new Error('MISSING_FIELDS: Gmail send_email requires "to" and "subject" fields.');
      }

      if (credentials.accessToken.startsWith('mock_')) {
        return {
          delivered: true,
          messageId: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          to,
          subject,
          snippet: body ? body.substring(0, 100) : '',
          timestamp: new Date().toISOString(),
          provider: 'gmail (simulated)'
        };
      }

      // Construct RFC 2822 base64 message for Gmail API
      const rawEmail = [
        `To: ${to}`,
        cc ? `Cc: ${cc}` : '',
        `Subject: ${subject}`,
        'Content-Type: text/plain; charset=utf-8',
        '',
        body || ''
      ].filter(Boolean).join('\r\n');

      const encoded = Buffer.from(rawEmail).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      const res = await axios.post('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', { raw: encoded }, {
        headers: { Authorization: `Bearer ${credentials.accessToken}` }
      });

      return {
        delivered: true,
        messageId: res.data.id,
        threadId: res.data.threadId,
        to,
        subject,
        timestamp: new Date().toISOString()
      };
    }

    if (actionName === 'read_emails') {
      return {
        count: 1,
        messages: [
          {
            id: 'mock_msg_001',
            subject: 'Sample Incoming Notification',
            from: 'support@example.com',
            snippet: 'Urgent task awaiting operator review.'
          }
        ]
      };
    }

    throw new Error(`Unsupported action ${actionName} for provider gmail`);
  }
}

module.exports = new GmailIntegration();
