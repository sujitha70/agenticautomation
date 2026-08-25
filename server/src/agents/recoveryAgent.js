const BaseAgent = require('./baseAgent');

class RecoveryAgent extends BaseAgent {
  constructor() {
    super('recovery', 'Error Classification & Auto-Healing');
  }

  async handleFailure({ executionId, workflowId, nodeId, error, attempt = 1, maxRetries = 3 }) {
    const errorMsg = error.message || String(error);
    let category = 'TRANSIENT';
    let strategy = 'retry_with_backoff';
    let backoffDelayMs = 1000 * Math.pow(2, attempt - 1);

    // 1. Classification rules
    if (errorMsg.includes('MISSING_FIELDS') || errorMsg.includes('requires')) {
      category = 'MISSING_FIELDS';
      strategy = 'escalate'; // Can't auto-retry without operator fixing input fields
    } else if (errorMsg.includes('AUTH_EXPIRED') || errorMsg.includes('INTEGRATION_NOT_CONNECTED')) {
      category = 'AUTH_EXPIRED';
      strategy = 'escalate'; // Operator needs to re-authenticate
    } else if (errorMsg.includes('429') || errorMsg.toLowerCase().includes('rate limit')) {
      category = 'RATE_LIMIT';
      strategy = 'retry_with_backoff';
      backoffDelayMs = Math.max(backoffDelayMs, 3000);
    } else if (errorMsg.includes('ETIMEDOUT') || errorMsg.includes('ECONNRESET') || errorMsg.includes('503')) {
      category = 'TRANSIENT';
      strategy = 'retry_with_backoff';
    } else {
      category = 'API_FAILURE';
      strategy = attempt < maxRetries ? 'retry_with_backoff' : 'escalate';
    }

    if (attempt >= maxRetries && strategy === 'retry_with_backoff') {
      strategy = 'escalate';
    }

    await this.logEvent({
      executionId,
      workflowId,
      nodeId,
      level: strategy === 'escalate' ? 'error' : 'warning',
      eventType: strategy === 'escalate' ? 'ESCALATION_TRIGGERED' : 'FAILURE_CLASSIFIED',
      message: `Recovery Agent classified failure as [${category}]. Strategy: ${strategy.toUpperCase()}${strategy === 'retry_with_backoff' ? ` (delay: ${backoffDelayMs}ms)` : ''}.`,
      metadata: {
        error: errorMsg,
        category,
        strategy,
        attempt,
        maxRetries,
        backoffDelayMs
      }
    });

    return {
      category,
      strategy,
      backoffDelayMs,
      canRetry: strategy === 'retry_with_backoff' && attempt < maxRetries,
    };
  }
}

module.exports = new RecoveryAgent();
