import { useState, useEffect } from 'react';
import { useWorkflowStore } from '../../store/workflowStore';
import {
  X,
  Trash2,
  Sliders,
  Sparkles,
  Info,
  Layers,
  Code,
  FileText,
  Key,
} from 'lucide-react';

export default function NodeConfigPanel() {
  const {
    selectedNode,
    setSelectedNode,
    updateSelectedNodeConfig,
    updateSelectedNodeLabel,
    deleteNode,
  } = useWorkflowStore();

  if (!selectedNode) return null;

  const { id, type, data = {} } = selectedNode;
  const config = data.config || {};
  const label = data.label || '';
  const category = data.category || 'action';

  const insertVariable = (fieldKey, variableName) => {
    const currentVal = config[fieldKey] || '';
    updateSelectedNodeConfig(fieldKey, `${currentVal} {{${variableName}}}`);
  };

  return (
    <div className="w-80 h-full bg-[#0c101c] border-l border-[#1e2638] flex flex-col shadow-2xl z-20 animate-in slide-in-from-right duration-200">
      {/* Panel Header */}
      <div className="p-4 border-b border-[#1e2638] flex items-center justify-between bg-[#101626]">
        <div className="flex items-center space-x-2">
          <Sliders className="w-4 h-4 text-indigo-400" />
          <h3 className="text-xs font-mono uppercase tracking-wider text-slate-200 font-semibold">
            Node Configuration
          </h3>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => deleteNode(id)}
            className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
            title="Delete Node"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setSelectedNode(null)}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-surface-100 transition-colors"
            title="Close Panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Configuration Form Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* Node ID & Type Pill */}
        <div className="p-2.5 rounded-xl bg-[#131929] border border-[#1e273c] space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>NODE ID</span>
            <span className="text-indigo-300 font-semibold">{id}</span>
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>TYPE</span>
            <span className="text-slate-200 uppercase">{type}</span>
          </div>
        </div>

        {/* Step Label */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium text-slate-300">Step Label</label>
          <input
            type="text"
            value={label}
            onChange={(e) => updateSelectedNodeLabel(e.target.value)}
            className="w-full bg-[#131929] border border-[#222d42] rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
            placeholder="Step Name"
          />
        </div>

        {/* Dynamic Fields for Node Types */}

        {/* --- GMAIL ACTION --- */}
        {type === 'action_gmail' && (
          <>
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-slate-300">Recipient Email (To)</label>
              <input
                type="text"
                value={config.to || ''}
                onChange={(e) => updateSelectedNodeConfig('to', e.target.value)}
                className="w-full bg-[#131929] border border-[#222d42] rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                placeholder="operator@company.com"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-slate-300">Email Subject</label>
              <input
                type="text"
                value={config.subject || ''}
                onChange={(e) => updateSelectedNodeConfig('subject', e.target.value)}
                className="w-full bg-[#131929] border border-[#222d42] rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                placeholder="Automated Alert: {{input.title}}"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-medium text-slate-300">Email Body</label>
                <button
                  type="button"
                  onClick={() => insertVariable('body', 'input.summary')}
                  className="text-[10px] text-indigo-400 hover:text-indigo-300 font-mono"
                >
                  + insert summary
                </button>
              </div>
              <textarea
                rows={4}
                value={config.body || ''}
                onChange={(e) => updateSelectedNodeConfig('body', e.target.value)}
                className="w-full bg-[#131929] border border-[#222d42] rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
                placeholder="Hello,\n\nExecution finished: {{input.summary}}"
              />
            </div>
          </>
        )}

        {/* --- SLACK ACTION --- */}
        {type === 'action_slack' && (
          <>
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-slate-300">Channel / ID</label>
              <input
                type="text"
                value={config.channel || ''}
                onChange={(e) => updateSelectedNodeConfig('channel', e.target.value)}
                className="w-full bg-[#131929] border border-[#222d42] rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                placeholder="#general or C01234567"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-medium text-slate-300">Message Markdown</label>
                <button
                  type="button"
                  onClick={() => insertVariable('text', 'input.summary')}
                  className="text-[10px] text-indigo-400 hover:text-indigo-300 font-mono"
                >
                  + summary
                </button>
              </div>
              <textarea
                rows={4}
                value={config.text || ''}
                onChange={(e) => updateSelectedNodeConfig('text', e.target.value)}
                className="w-full bg-[#131929] border border-[#222d42] rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
                placeholder="🚀 *Alert*: {{input.summary}}"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-slate-300">Bot Nickname</label>
              <input
                type="text"
                value={config.botName || ''}
                onChange={(e) => updateSelectedNodeConfig('botName', e.target.value)}
                className="w-full bg-[#131929] border border-[#222d42] rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                placeholder="Agentflow Bot"
              />
            </div>
          </>
        )}

        {/* --- DISCORD ACTION --- */}
        {type === 'action_discord' && (
          <>
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-slate-300">Channel ID or Webhook URL</label>
              <input
                type="text"
                value={config.channelId || ''}
                onChange={(e) => updateSelectedNodeConfig('channelId', e.target.value)}
                className="w-full bg-[#131929] border border-[#222d42] rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
                placeholder="general-alerts or https://discord.com/api/webhooks/..."
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-slate-300">Message Content</label>
              <textarea
                rows={4}
                value={config.content || ''}
                onChange={(e) => updateSelectedNodeConfig('content', e.target.value)}
                className="w-full bg-[#131929] border border-[#222d42] rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
                placeholder="📢 **Agentflow Notice**: Task completed."
              />
            </div>
          </>
        )}

        {/* --- GOOGLE SHEETS ACTION --- */}
        {type === 'action_sheets' && (
          <>
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-slate-300">Spreadsheet ID</label>
              <input
                type="text"
                value={config.spreadsheetId || ''}
                onChange={(e) => updateSelectedNodeConfig('spreadsheetId', e.target.value)}
                className="w-full bg-[#131929] border border-[#222d42] rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
                placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-slate-300">Range / Sheet Tab</label>
              <input
                type="text"
                value={config.range || ''}
                onChange={(e) => updateSelectedNodeConfig('range', e.target.value)}
                className="w-full bg-[#131929] border border-[#222d42] rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                placeholder="Sheet1!A:Z"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-slate-300">Row Values (JSON Array)</label>
              <textarea
                rows={3}
                value={config.values || ''}
                onChange={(e) => updateSelectedNodeConfig('values', e.target.value)}
                className="w-full bg-[#131929] border border-[#222d42] rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
                placeholder='["{{timestamp}}", "{{input.title}}", "Completed"]'
              />
            </div>
          </>
        )}

        {/* --- AI LLM NODE --- */}
        {type === 'ai_llm' && (
          <>
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-slate-300">Reasoning Prompt Template</label>
              <textarea
                rows={5}
                value={config.prompt || ''}
                onChange={(e) => updateSelectedNodeConfig('prompt', e.target.value)}
                className="w-full bg-[#131929] border border-[#222d42] rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
                placeholder="Analyze the following and propose resolution: {{input.text}}"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-300 font-medium">Temperature</span>
                <span className="text-indigo-400 font-mono">{config.temperature ?? 0.7}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={config.temperature ?? 0.7}
                onChange={(e) => updateSelectedNodeConfig('temperature', parseFloat(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </div>
          </>
        )}

        {/* --- AI SENTIMENT / CLASSIFIER --- */}
        {type === 'ai_sentiment' && (
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-slate-300">Target Categories (CSV)</label>
            <input
              type="text"
              value={config.categories || ''}
              onChange={(e) => updateSelectedNodeConfig('categories', e.target.value)}
              className="w-full bg-[#131929] border border-[#222d42] rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
              placeholder="Positive, Neutral, Negative / Urgent, Billing Inquiry"
            />
          </div>
        )}

        {/* --- AI EXTRACT --- */}
        {type === 'ai_extract' && (
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-slate-300">Target JSON Schema</label>
            <textarea
              rows={4}
              value={config.schema || ''}
              onChange={(e) => updateSelectedNodeConfig('schema', e.target.value)}
              className="w-full bg-[#131929] border border-[#222d42] rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
              placeholder='{"name": "string", "amount": "number"}'
            />
          </div>
        )}

        {/* --- LOGIC CONDITION --- */}
        {type === 'logic_condition' && (
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-slate-300">Condition Expression (JS)</label>
            <input
              type="text"
              value={config.condition || ''}
              onChange={(e) => updateSelectedNodeConfig('condition', e.target.value)}
              className="w-full bg-[#131929] border border-[#222d42] rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
              placeholder='sentiment === "Negative" || priority === "Urgent"'
            />
            <p className="text-[10px] text-slate-400 leading-tight">
              True path triggers top branch (emerald handle), False path triggers bottom branch (rose handle).
            </p>
          </div>
        )}

        {/* --- LOGIC DELAY --- */}
        {type === 'logic_delay' && (
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-slate-300">Delay Duration (Seconds)</label>
            <input
              type="number"
              min="1"
              max="60"
              value={config.seconds ?? 5}
              onChange={(e) => updateSelectedNodeConfig('seconds', parseInt(e.target.value, 10))}
              className="w-full bg-[#131929] border border-[#222d42] rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>
        )}

        {/* Variable Context Helper Box */}
        <div className="p-3 rounded-xl bg-[#111726] border border-[#1e273a] space-y-2">
          <div className="flex items-center space-x-1.5 text-slate-300 font-medium text-[11px]">
            <Info className="w-3.5 h-3.5 text-indigo-400" />
            <span>Interpolation Variables</span>
          </div>
          <div className="flex flex-wrap gap-1.5 font-mono text-[10px]">
            <span className="px-1.5 py-0.5 rounded bg-[#182035] text-indigo-300 border border-indigo-500/20">{`{{timestamp}}`}</span>
            <span className="px-1.5 py-0.5 rounded bg-[#182035] text-indigo-300 border border-indigo-500/20">{`{{input.text}}`}</span>
            <span className="px-1.5 py-0.5 rounded bg-[#182035] text-indigo-300 border border-indigo-500/20">{`{{input.summary}}`}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
