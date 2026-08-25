const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config/env');

const NODE_CATALOG = {
  triggers: [
    { type: 'trigger_manual', label: 'Manual Trigger', icon: 'Play', category: 'trigger', config: {} },
    { type: 'trigger_schedule', label: 'Cron Scheduler', icon: 'Clock', category: 'trigger', config: { cron: '0 9 * * 1-5' } },
    { type: 'trigger_webhook', label: 'Incoming Webhook', icon: 'Globe', category: 'trigger', config: { path: '/webhook/incoming' } },
    { type: 'trigger_gmail', label: 'Gmail Incoming', icon: 'Mail', category: 'trigger', config: { filter: 'is:unread' } },
  ],
  actions: [
    { type: 'action_gmail', label: 'Send Email (Gmail)', icon: 'Mail', category: 'action', config: { to: 'operator@example.com', subject: 'Automated Notification', body: '{{input.text}}' } },
    { type: 'action_slack', label: 'Post Slack Message', icon: 'MessageSquare', category: 'action', config: { channel: '#general', text: '{{input.summary}}' } },
    { type: 'action_discord', label: 'Post Discord Alert', icon: 'Send', category: 'action', config: { channelId: 'general-alerts', content: '{{input.result}}' } },
    { type: 'action_sheets', label: 'Append Google Sheet', icon: 'Table', category: 'action', config: { spreadsheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms', range: 'Sheet1!A:Z', values: '["{{timestamp}}", "{{input.title}}", "{{input.status}}"]' } },
    { type: 'action_http', label: 'HTTP Webhook Request', icon: 'Radio', category: 'action', config: { method: 'POST', url: 'https://api.example.com/webhook', headers: '{"Content-Type": "application/json"}' } },
  ],
  ai: [
    { type: 'ai_llm', label: 'LLM Reasoning & Generation', icon: 'Sparkles', category: 'ai', config: { prompt: 'Analyze the following input and generate actionable resolution: {{input.text}}', temperature: 0.7 } },
    { type: 'ai_summarize', label: 'Text Summarizer', icon: 'FileText', category: 'ai', config: { maxLength: 200, focus: 'key action items' } },
    { type: 'ai_sentiment', label: 'Sentiment & Intent Classifier', icon: 'Gauge', category: 'ai', config: { categories: ['Positive', 'Neutral', 'Negative', 'Urgent Bug'] } },
    { type: 'ai_extract', label: 'Structured JSON Extractor', icon: 'Code', category: 'ai', config: { schema: '{"name": "string", "amount": "number", "priority": "string"}' } },
  ],
  logic: [
    { type: 'logic_condition', label: 'If / Else Branch', icon: 'GitFork', category: 'logic', config: { condition: 'sentiment === "Negative" || priority === "Urgent"' } },
    { type: 'logic_delay', label: 'Wait / Delay', icon: 'Hourglass', category: 'logic', config: { seconds: 10 } },
    { type: 'logic_filter', label: 'Data Filter & Transform', icon: 'Filter', category: 'logic', config: { field: 'status', operator: 'equals', value: 'approved' } },
  ]
};

class AiGenerationService {
  async generateWorkflowFromPrompt(prompt) {
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      throw new Error('Prompt is required for workflow generation.');
    }

    const trimmedPrompt = prompt.trim();
    let generatedGraph = null;
    let generatorUsed = 'deterministic-rules';

    // 1. Try OpenRouter if API key is present
    if (config.OPENROUTER_API_KEY) {
      try {
        generatedGraph = await this._generateWithOpenRouter(trimmedPrompt);
        generatorUsed = 'openrouter';
      } catch (err) {
        console.warn(`⚠️ [AI Generator] OpenRouter generation failed (${err.message}). Trying fallback.`);
      }
    }

    // 2. Try Gemini if OpenRouter was not used or failed
    if (!generatedGraph && config.GEMINI_API_KEY) {
      try {
        generatedGraph = await this._generateWithGemini(trimmedPrompt);
        generatorUsed = 'gemini';
      } catch (err) {
        console.warn(`⚠️ [AI Generator] Gemini generation failed (${err.message}). Falling back to rule engine.`);
      }
    }

    // 3. Fallback to deterministic rule-based builder
    if (!generatedGraph) {
      generatedGraph = this._generateDeterministic(trimmedPrompt);
      generatorUsed = 'deterministic-rules';
    }

    return {
      generator: generatorUsed,
      prompt: trimmedPrompt,
      ...generatedGraph
    };
  }

  async _generateWithOpenRouter(prompt) {
    const systemPrompt = this._getSystemPrompt();
    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: config.OPENROUTER_DEFAULT_MODEL || 'openai/gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Create an automation workflow for this prompt: "${prompt}"` }
      ],
      response_format: { type: 'json_object' }
    }, {
      headers: {
        Authorization: `Bearer ${config.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    });

    const content = response.data.choices[0].message.content;
    return this._parseAndValidateLLMJson(content);
  }

  async _generateWithGemini(prompt) {
    const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash', generationConfig: { responseMimeType: 'application/json' } });

    const systemPrompt = this._getSystemPrompt();
    const result = await model.generateContent(`${systemPrompt}\n\nCreate an automation workflow for this prompt: "${prompt}"`);
    const content = result.response.text();
    return this._parseAndValidateLLMJson(content);
  }

  _getSystemPrompt() {
    return `You are an expert AI Operations Architect. You transform natural language automation requests into executable visual workflow graphs.
Output MUST be valid JSON with this exact structure:
{
  "name": "Concise Workflow Title",
  "description": "Clear 1-2 sentence description",
  "tags": ["tag1", "tag2"],
  "triggerConfig": { "type": "manual|schedule|webhook|gmail", "config": {} },
  "nodes": [
    {
      "id": "node_1",
      "type": "trigger_manual|trigger_schedule|trigger_webhook|trigger_gmail|ai_llm|ai_summarize|ai_sentiment|ai_extract|action_gmail|action_slack|action_discord|action_sheets|action_http|logic_condition|logic_delay|logic_filter",
      "position": { "x": 250, "y": 50 },
      "data": {
        "label": "Human Friendly Step Label",
        "description": "Step purpose",
        "config": {}
      }
    }
  ],
  "edges": [
    {
      "id": "edge_1_2",
      "source": "node_1",
      "target": "node_2",
      "animated": true,
      "label": ""
    }
  ]
}

Layout nodes vertically with x=250 and y spaced by 140px (y: 50, 190, 330, 470, 610).
For branched condition nodes, branch target 1 at x=100 and target 2 at x=400.
Always start with a valid trigger node (id: "node_1").`;
  }

  _parseAndValidateLLMJson(rawJson) {
    const parsed = typeof rawJson === 'string' ? JSON.parse(rawJson) : rawJson;
    if (!parsed.nodes || !Array.isArray(parsed.nodes) || parsed.nodes.length === 0) {
      throw new Error('LLM output lacked valid nodes array');
    }
    if (!parsed.edges || !Array.isArray(parsed.edges)) {
      parsed.edges = [];
    }
    return {
      name: parsed.name || 'AI Generated Automation',
      description: parsed.description || 'Automated multi-agent workflow generated from prompt',
      tags: parsed.tags || ['ai-generated', 'automation'],
      triggerConfig: parsed.triggerConfig || { type: 'manual', config: {} },
      nodes: parsed.nodes,
      edges: parsed.edges,
    };
  }

  _generateDeterministic(prompt) {
    const lower = prompt.toLowerCase();
    const nodes = [];
    const edges = [];
    let name = 'Automated Workflow';
    let description = `Pipeline generated for: "${prompt}"`;
    const tags = ['agentic', 'automation'];

    let yPos = 50;
    const addNode = (id, type, label, description, config = {}, x = 250) => {
      nodes.push({
        id,
        type,
        position: { x, y: yPos },
        data: {
          label,
          description,
          config,
          category: type.split('_')[0]
        }
      });
      yPos += 140;
      return id;
    };

    const connect = (source, target, label = '', animated = true) => {
      edges.push({
        id: `e_${source}_${target}`,
        source,
        target,
        animated,
        label,
        style: { stroke: '#6366f1', strokeWidth: 2 }
      });
    };

    // 1. Trigger detection
    let prevNode = '';
    if (lower.includes('email') && (lower.includes('when') || lower.includes('incoming') || lower.includes('receive'))) {
      prevNode = addNode('node_1', 'trigger_gmail', 'Incoming Email Trigger', 'Listens for new incoming emails matching query', { filter: 'is:unread' });
      name = 'Email Processing & Response Automation';
      tags.push('email', 'gmail');
    } else if (lower.includes('schedule') || lower.includes('every day') || lower.includes('hourly') || lower.includes('cron')) {
      prevNode = addNode('node_1', 'trigger_schedule', 'Daily Cron Scheduler', 'Triggers automatically on defined recurring schedule', { cron: '0 9 * * 1-5' });
      name = 'Scheduled Operations Job';
      tags.push('scheduled', 'cron');
    } else if (lower.includes('webhook') || lower.includes('api trigger') || lower.includes('http trigger')) {
      prevNode = addNode('node_1', 'trigger_webhook', 'Webhook Receiver', 'Receives payload from external webhook', { path: '/webhook/v1' });
      name = 'Webhook Event Dispatcher';
      tags.push('webhook');
    } else {
      prevNode = addNode('node_1', 'trigger_manual', 'Manual Run Trigger', 'Runs on-demand when operator clicks Execute', {});
      name = 'Operations Automation Pipeline';
    }

    // 2. AI Analysis / Processing step
    if (lower.includes('sentiment') || lower.includes('classify') || lower.includes('feedback')) {
      const aiNode = addNode('node_2', 'ai_sentiment', 'Sentiment & Intent Classifier', 'Categorizes urgency and sentiment of incoming text', {
        categories: ['Positive', 'Neutral', 'Negative / Escalation', 'Feature Request']
      });
      connect(prevNode, aiNode);
      prevNode = aiNode;
      tags.push('sentiment', 'ai');
    } else if (lower.includes('summarize') || lower.includes('summary') || lower.includes('brief')) {
      const aiNode = addNode('node_2', 'ai_summarize', 'AI Text Summarizer', 'Generates executive summary of input content', {
        maxLength: 250,
        focus: 'actionable highlights'
      });
      connect(prevNode, aiNode);
      prevNode = aiNode;
      tags.push('summarizer', 'ai');
    } else if (lower.includes('extract') || lower.includes('invoice') || lower.includes('parse')) {
      const aiNode = addNode('node_2', 'ai_extract', 'JSON Data Extractor', 'Extracts structured key-value entities from raw text', {
        schema: '{"vendor": "string", "amount": "number", "invoiceId": "string", "dueDate": "string"}'
      });
      connect(prevNode, aiNode);
      prevNode = aiNode;
      tags.push('extraction', 'ai');
    } else {
      const aiNode = addNode('node_2', 'ai_llm', 'AI Operations Reasoning', 'Analyzes task context and plans automated action response', {
        prompt: 'Analyze input payload and generate structured status report: {{input.text}}',
        temperature: 0.7
      });
      connect(prevNode, aiNode);
      prevNode = aiNode;
      tags.push('reasoning', 'ai');
    }

    // 3. Conditional / Branching check if requested
    if (lower.includes('if') || lower.includes('condition') || lower.includes('urgent') || lower.includes('route')) {
      const condNode = addNode('node_3', 'logic_condition', 'Priority Condition Router', 'Evaluates if priority is high or escalation required', {
        condition: 'sentiment === "Negative" || priority === "high"'
      });
      connect(prevNode, condNode);
      prevNode = condNode;
    }

    // 4. Output Actions
    let actionCount = 0;
    if (lower.includes('slack') || (!lower.includes('discord') && !lower.includes('sheet') && !lower.includes('email'))) {
      const slackNode = addNode(`node_action_${++actionCount}`, 'action_slack', 'Post Slack Alert', 'Notifies the operations channel with results', {
        channel: '#ops-alerts',
        text: '🚀 *Automated Alert*: Step completed successfully.\n{{input.summary}}'
      });
      connect(prevNode, slackNode, 'Action');
      tags.push('slack');
    }

    if (lower.includes('discord')) {
      const discordNode = addNode(`node_action_${++actionCount}`, 'action_discord', 'Post Discord Alert', 'Broadcasts notification embed to Discord channel', {
        channelId: 'general-alerts',
        content: '📢 **Agentflow Notice**: Automation step processed.'
      });
      connect(prevNode, discordNode, 'Action');
      tags.push('discord');
    }

    if (lower.includes('sheet') || lower.includes('sheets') || lower.includes('spreadsheet') || lower.includes('log') || lower.includes('record')) {
      const sheetNode = addNode(`node_action_${++actionCount}`, 'action_sheets', 'Append to Google Sheet', 'Logs audit record and metrics to target spreadsheet', {
        spreadsheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
        range: 'Automations!A:Z',
        values: '["{{timestamp}}", "{{input.label}}", "{{input.status}}", "{{input.confidence}}"]'
      });
      connect(prevNode, sheetNode, 'Action');
      tags.push('google-sheets');
    }

    if (lower.includes('email') || lower.includes('gmail') || lower.includes('send mail')) {
      const emailNode = addNode(`node_action_${++actionCount}`, 'action_gmail', 'Send Email Notification', 'Dispatches transactional update to recipient', {
        to: 'operator@agentflow.io',
        subject: 'Automation Step Completed',
        body: 'Hello,\n\nThe automation workflow has finished processing your request.\n\nSummary:\n{{input.summary}}'
      });
      connect(prevNode, emailNode, 'Action');
      tags.push('gmail');
    }

    return {
      name,
      description,
      tags: Array.from(new Set(tags)),
      triggerConfig: { type: nodes[0].type.replace('trigger_', ''), config: nodes[0].data.config },
      nodes,
      edges,
    };
  }

  getNodeCatalog() {
    return NODE_CATALOG;
  }
}

module.exports = new AiGenerationService();
