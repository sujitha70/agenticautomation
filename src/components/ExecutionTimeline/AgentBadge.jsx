import {
  Compass,
  Zap,
  CheckCircle2,
  LifeBuoy,
  Activity,
  Layers,
} from 'lucide-react';

const AGENT_CONFIGS = {
  planner: {
    label: 'Planner',
    icon: Compass,
    bg: 'bg-sky-500/15',
    text: 'text-sky-400',
    border: 'border-sky-500/30',
  },
  execution: {
    label: 'Execution',
    icon: Zap,
    bg: 'bg-purple-500/15',
    text: 'text-purple-400',
    border: 'border-purple-500/30',
  },
  validation: {
    label: 'Validation',
    icon: CheckCircle2,
    bg: 'bg-amber-500/15',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
  },
  recovery: {
    label: 'Recovery',
    icon: LifeBuoy,
    bg: 'bg-rose-500/15',
    text: 'text-rose-400',
    border: 'border-rose-500/30',
  },
  monitoring: {
    label: 'Monitoring',
    icon: Activity,
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
  },
  orchestrator: {
    label: 'Orchestrator',
    icon: Layers,
    bg: 'bg-indigo-500/15',
    text: 'text-indigo-400',
    border: 'border-indigo-500/30',
  },
};

export default function AgentBadge({ agent }) {
  const normalized = agent?.toLowerCase() || 'orchestrator';
  const cfg = AGENT_CONFIGS[normalized] || AGENT_CONFIGS.orchestrator;
  const Icon = cfg.icon;

  return (
    <span
      className={`inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-md text-[10px] font-mono font-medium ${cfg.bg} ${cfg.text} border ${cfg.border}`}
    >
      <Icon className="w-3 h-3" />
      <span>{cfg.label}</span>
    </span>
  );
}
