const BaseAgent = require('./baseAgent');

class ValidationAgent extends BaseAgent {
  constructor() {
    super('validation', 'Data Integrity & Output Verification');
  }

  async validateNodeOutput({ executionId, workflowId, node, output }) {
    const { id, type, data = {} } = node;
    const label = data.label || id;

    if (output === undefined || output === null) {
      const errorMsg = `VALIDATION_FAILED: Step "${label}" returned null or undefined output.`;
      await this.logEvent({
        executionId,
        workflowId,
        nodeId: id,
        level: 'error',
        eventType: 'VALIDATION_FAILED',
        message: errorMsg,
        metadata: { nodeType: type }
      });
      throw new Error(errorMsg);
    }

    // Provider-specific validation rules
    let issues = [];

    if (type === 'action_gmail' && !output.delivered && !output.messageId) {
      issues.push('Email delivery could not be verified by recipient provider.');
    }

    if (type === 'action_slack' && !output.delivered && !output.ts) {
      issues.push('Slack post response missing delivery timestamp.');
    }

    if (type === 'action_discord' && !output.delivered && !output.messageId) {
      issues.push('Discord message dispatch verification unconfirmed.');
    }

    if (type === 'action_sheets' && !output.appended) {
      issues.push('Spreadsheet row append confirmation not received.');
    }

    if (issues.length > 0) {
      await this.logEvent({
        executionId,
        workflowId,
        nodeId: id,
        level: 'warning',
        eventType: 'VALIDATION_WARNING',
        message: `Validation Agent noted warnings on "${label}": ${issues.join('; ')}`,
        metadata: { issues, output }
      });
    } else {
      await this.logEvent({
        executionId,
        workflowId,
        nodeId: id,
        level: 'success',
        eventType: 'VALIDATION_PASSED',
        message: `Validation Agent confirmed output integrity for "${label}".`,
        metadata: { fieldsValidated: Object.keys(output).length }
      });
    }

    return { valid: issues.length === 0, issues };
  }
}

module.exports = new ValidationAgent();
