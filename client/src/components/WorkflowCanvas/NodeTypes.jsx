import CustomNode from './CustomNode';

export const nodeTypes = {
  trigger_manual: CustomNode,
  trigger_schedule: CustomNode,
  trigger_webhook: CustomNode,
  trigger_gmail: CustomNode,
  ai_llm: CustomNode,
  ai_summarize: CustomNode,
  ai_sentiment: CustomNode,
  ai_extract: CustomNode,
  action_gmail: CustomNode,
  action_slack: CustomNode,
  action_discord: CustomNode,
  action_sheets: CustomNode,
  action_http: CustomNode,
  logic_condition: CustomNode,
  logic_delay: CustomNode,
  logic_filter: CustomNode,
  default: CustomNode,
};
