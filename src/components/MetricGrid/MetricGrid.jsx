import {
  Workflow,
  CheckCircle2,
  Activity,
  Zap,
  TrendingUp,
  ShieldCheck,
} from 'lucide-react';

export default function MetricGrid({ metrics = {} }) {
  const {
    totalWorkflows = 0,
    activeWorkflows = 0,
    totalExecutions = 0,
    completedExecutions = 0,
    failedExecutions = 0,
    successRate = 100,
  } = metrics;

  const CARDS = [
    {
      title: 'Total Workflows',
      value: totalWorkflows,
      subtext: `${activeWorkflows} active on canvas`,
      icon: Workflow,
      color: 'from-blue-500/20 to-indigo-500/5',
      borderColor: 'border-blue-500/30',
      iconColor: 'text-blue-400',
    },
    {
      title: 'Total Executions',
      value: totalExecutions,
      subtext: `${completedExecutions} completed, ${failedExecutions} failed`,
      icon: Activity,
      color: 'from-purple-500/20 to-pink-500/5',
      borderColor: 'border-purple-500/30',
      iconColor: 'text-purple-400',
    },
    {
      title: 'Execution Success Rate',
      value: `${successRate}%`,
      subtext: failedExecutions === 0 ? 'Zero operational failures' : `${failedExecutions} auto-recovered / escalated`,
      icon: CheckCircle2,
      color: 'from-emerald-500/20 to-teal-500/5',
      borderColor: 'border-emerald-500/30',
      iconColor: 'text-emerald-400',
    },
    {
      title: 'Agent Orchestration Mesh',
      value: '5 Agents',
      subtext: 'Planner • Exec • Valid • Recovery • Mon',
      icon: Zap,
      color: 'from-amber-500/20 to-orange-500/5',
      borderColor: 'border-amber-500/30',
      iconColor: 'text-amber-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {CARDS.map((card, i) => {
        const Icon = card.icon;
        return (
          <div
            key={i}
            className={`p-5 rounded-2xl bg-gradient-to-br ${card.color} bg-[#0e1322]/80 border ${card.borderColor} backdrop-blur-md relative overflow-hidden group hover:scale-[1.02] transition-all`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-mono tracking-wider uppercase text-slate-400 font-medium">
                  {card.title}
                </p>
                <h3 className="text-2xl font-bold text-slate-100 mt-1 tracking-tight">
                  {card.value}
                </h3>
              </div>
              <div className={`p-2.5 rounded-xl bg-[#131929] border border-white/5 ${card.iconColor} group-hover:scale-110 transition-transform`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-center text-xs text-slate-400">
              <TrendingUp className="w-3.5 h-3.5 text-slate-500 mr-1.5" />
              <span>{card.subtext}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
