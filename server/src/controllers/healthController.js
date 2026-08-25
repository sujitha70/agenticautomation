const { getDatabaseStatus } = require('../config/db');
const { checkEncryptionHealth } = require('../config/security');
const orchestrator = require('../agents/orchestrator');
const config = require('../config/env');

const getHealth = (req, res) => {
  const dbStatus = getDatabaseStatus();
  const encryption = checkEncryptionHealth();

  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    environment: config.NODE_ENV,
    services: {
      database: dbStatus,
      encryption,
      orchestrator: {
        langGraph: orchestrator.getLangGraphStatus(),
        chain: ['planner', 'execution', 'validation', 'recovery', 'monitoring'],
      },
      aiProviders: {
        openRouterConfigured: Boolean(config.OPENROUTER_API_KEY),
        geminiConfigured: Boolean(config.GEMINI_API_KEY),
        deterministicFallback: 'active',
      },
      integrations: {
        gmailOAuth: Boolean(config.GMAIL_CLIENT_ID),
        slackOAuth: Boolean(config.SLACK_CLIENT_ID),
        discordOAuth: Boolean(config.DISCORD_CLIENT_ID || config.DISCORD_BOT_TOKEN),
        sheetsOAuth: Boolean(config.GOOGLE_SHEETS_CLIENT_ID),
      }
    }
  });
};

module.exports = {
  getHealth,
};
