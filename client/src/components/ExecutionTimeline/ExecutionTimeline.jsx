import { useState, useRef, useEffect } from 'react';
import AgentBadge from './AgentBadge';
import { formatDate } from '../../lib/utils';
import {
  ChevronDown,
  ChevronRight,
  Terminal,
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
} from 'lucide-react';

export default function ExecutionTimeline({ logs = [], isLive = false }) {
  const [expandedLogs, setExpandedLogs] = useState({});
  const bottomRef = useRef(null);

  useEffect(() => {
    if (isLive && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs.length, isLive]);

  const toggleExpand = (idx) => {
    setExpandedLogs((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const getLevelPill = (level) => {
    switch (level) {
      case 'success':
        return <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">SUCCESS</span>;
      case 'error':
        return <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/20">ERROR</span>;
      case 'warning':
        return <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/20">WARN</span>;
      default:
        return <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-400 border border-sky-500/20">INFO</span>;
    }
  };

  if (logs.length === 0) {
    return (
      <div className="p-8 text-center space-y-2">
        <Terminal className="w-8 h-8 text-slate-400 mx-auto" />
        <p className="text-xs text-slate-400 font-mono">NO TIMELINE EVENTS RECORDED</p>
        <p className="text-[11px] text-slate-400">Trigger workflow execution to observe multi-agent orchestration events.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 font-sans text-xs">
      {logs.map((log, idx) => {
        const isExpanded = expandedLogs[idx];
        const hasMetadata = log.metadata && Object.keys(log.metadata).length > 0;

        return (
          <div
            key={log.id || log._id || idx}
            className="group relative pl-6 pb-2 border-l-2 border-[#1e273c] hover:border-indigo-500/60 transition-colors"
          >
            {/* Timeline bullet */}
            <div className="absolute -left-[7px] top-1 w-3 h-3 rounded-full bg-[#111728] border-2 border-indigo-500 group-hover:scale-125 transition-transform" />

            <div className="p-3 rounded-xl bg-[#101626] border border-[#1e273c] group-hover:border-[#2b3752] transition-colors space-y-2">
              {/* Event Header */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <AgentBadge agent={log.agent} />
                  {getLevelPill(log.level)}
                  <span className="font-mono text-[10px] text-slate-400">
                    {log.eventType}
                  </span>
                </div>
                <div className="flex items-center space-x-1 text-[10px] font-mono text-slate-400">
                  <Clock className="w-3 h-3" />
                  <span>{formatDate(log.timestamp || log.createdAt)}</span>
                </div>
              </div>

              {/* Message */}
              <p className="text-slate-200 text-xs leading-relaxed font-medium">
                {log.message}
              </p>

              {/* Collapsible Metadata Payload */}
              {hasMetadata && (
                <div className="pt-1">
                  <button
                    onClick={() => toggleExpand(idx)}
                    className="flex items-center space-x-1 text-[10px] font-mono text-indigo-400 hover:text-indigo-300"
                  >
                    {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    <span>{isExpanded ? 'Hide Payload' : 'View Payload Details'}</span>
                  </button>

                  {isExpanded && (
                    <pre className="mt-2 p-2.5 rounded-lg bg-[#0a0d16] border border-[#1b2338] text-[11px] font-mono text-slate-300 overflow-x-auto max-h-48">
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
