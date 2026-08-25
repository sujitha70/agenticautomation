export const PALETTE_CATEGORIES = [
  {
    id: 'triggers',
    name: 'Triggers',
    color: 'emerald',
    items: [
      {
        type: 'trigger_manual',
        label: 'Manual Run',
        description: 'Trigger automation on operator click',
        icon: 'Play',
        category: 'trigger',
        defaultConfig: {}
      },
      {
        type: 'trigger_schedule',
        label: 'Cron Scheduler',
        description: 'Run on periodic schedule or interval',
        icon: 'Clock',
        category: 'trigger',
        defaultConfig: { cron: '0 9 * * 1-5' }
      },
      {
        type: 'trigger_webhook',
        label: 'Webhook Event',
        description: 'Receive HTTP JSON payload',
        icon: 'Globe',
        category: 'trigger',
        defaultConfig: { path: '/webhook/v1' }
      },
      {
        type: 'trigger_gmail',
        label: 'Gmail Trigger',
        description: 'Triggers on incoming matching emails',
        icon: 'Mail',
        category: 'trigger',
        defaultConfig: { filter: 'is:unread' }
      },
    ]
  },
  {
    id: 'ai',
    name: 'AI & Reasoning',
    color: 'purple',
    items: [
      {
        type: 'ai_llm',
        label: 'LLM Reasoning',
        description: 'Run reasoning prompt on LLM',
        icon: 'Sparkles',
        category: 'ai',
        defaultConfig: { prompt: 'Analyze input and summarize operational task: {{input.text}}', temperature: 0.7 }
      },
      {
        type: 'ai_summarize',
        label: 'Text Summarizer',
        description: 'Extract concise executive summary',
        icon: 'FileText',
        category: 'ai',
        defaultConfig: { maxLength: 200, focus: 'key highlights' }
      },
      {
        type: 'ai_sentiment',
        label: 'Sentiment Classifier',
        description: 'Classify tone & operational urgency',
        icon: 'Gauge',
        category: 'ai',
        defaultConfig: { categories: 'Positive, Neutral, Negative / Urgent' }
      },
      {
        type: 'ai_extract',
        label: 'JSON Extractor',
        description: 'Extract typed schema from unstructured text',
        icon: 'Code',
        category: 'ai',
        defaultConfig: { schema: '{"vendor": "string", "amount": "number", "invoiceId": "string"}' }
      },
    ]
  },
  {
    id: 'actions',
    name: 'Third-Party Actions',
    color: 'blue',
    items: [
      {
        type: 'action_gmail',
        label: 'Gmail Send',
        description: 'Send automated email to recipient',
        icon: 'Mail',
        category: 'action',
        defaultConfig: { to: 'operator@agentflow.io', subject: 'Automated Alert: {{input.title}}', body: 'Hello,\n\nExecution has completed with result:\n{{input.summary}}' }
      },
      {
        type: 'action_slack',
        label: 'Slack Post',
        description: 'Post alert message to Slack channel',
        icon: 'MessageSquare',
        category: 'action',
        defaultConfig: { channel: '#general', text: '🚀 *Automated Notification*: {{input.summary}}', botName: 'Agentflow Bot' }
      },
      {
        type: 'action_discord',
        label: 'Discord Alert',
        description: 'Post message or webhook to Discord',
        icon: 'Send',
        category: 'action',
        defaultConfig: { channelId: 'general-alerts', content: '📢 **Agentflow Notification**: Task processed.' }
      },
      {
        type: 'action_sheets',
        label: 'Google Sheet Log',
        description: 'Append row to Google spreadsheet',
        icon: 'Table',
        category: 'action',
        defaultConfig: { spreadsheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms', range: 'Sheet1!A:Z', values: '["{{timestamp}}", "{{input.label}}", "{{input.status}}"]' }
      },
      {
        type: 'action_http',
        label: 'HTTP Webhook',
        description: 'Dispatch custom REST API request',
        icon: 'Radio',
        category: 'action',
        defaultConfig: { method: 'POST', url: 'https://api.example.com/webhook', headers: '{"Content-Type": "application/json"}' }
      },
    ]
  },
  {
    id: 'logic',
    name: 'Logic & Flow Control',
    color: 'amber',
    items: [
      {
        type: 'logic_condition',
        label: 'If / Else Branch',
        description: 'Evaluate condition and branch flow',
        icon: 'GitFork',
        category: 'logic',
        defaultConfig: { condition: 'sentiment === "Negative" || priority === "Urgent"' }
      },
      {
        type: 'logic_delay',
        label: 'Wait / Delay',
        description: 'Pause execution for specified seconds',
        icon: 'Hourglass',
        category: 'logic',
        defaultConfig: { seconds: 5 }
      },
      {
        type: 'logic_filter',
        label: 'Data Filter',
        description: 'Filter array or object payload',
        icon: 'Filter',
        category: 'logic',
        defaultConfig: { field: 'status', operator: 'equals', value: 'approved' }
      },
    ]
  }
];

export const SAMPLE_PROMPTS = [
  "Monitor incoming Gmail for customer support inquiries, classify sentiment, and post high-priority alerts to Slack #urgent-ops",
  "Parse PDF invoice text, extract vendor and total amount into structured JSON, and append a record to Google Sheets",
  "Daily at 9 AM, summarize overnight incident logs with AI and dispatch an executive brief to the Discord alerts channel",
  "When an error webhook is triggered, run AI diagnostics, format resolution advice, and send email to on-call engineer",
  "Triage user feedback submissions: if negative or bug report, notify Slack and log to spreadsheet; otherwise send thank you email"
];
