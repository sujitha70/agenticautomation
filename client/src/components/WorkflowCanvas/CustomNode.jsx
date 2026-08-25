import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import {
  Play,
  Clock,
  Globe,
  Mail,
  Sparkles,
  FileText,
  Gauge,
  Code,
  MessageSquare,
  Send,
  Table,
  Radio,
  GitFork,
  Hourglass,
  Filter,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';

const ICON_MAP = {
  Play,
  Clock,
  Globe,
  Mail,
  Sparkles,
  FileText,
  Gauge,
  Code,
  MessageSquare,
  Send,
  Table,
  Radio,
  GitFork,
  Hourglass,
  Filter,
};

const CATEGORY_STYLES = {
  trigger: {
    border: 'border-emerald-500/40 hover:border-emerald-500/80',
    headerBg: 'bg-emerald-500/10 text-emerald-300',
    iconBg: 'bg-emerald-500/20 text-emerald-400',
    glow: 'group-hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]',
  },
  ai: {
    border: 'border-purple-500/40 hover:border-purple-500/80',
    headerBg: 'bg-purple-500/10 text-purple-300',
    iconBg: 'bg-purple-500/20 text-purple-400',
    glow: 'group-hover:shadow-[0_0_20px_rgba(168,85,247,0.2)]',
  },
  action: {
    border: 'border-blue-500/40 hover:border-blue-500/80',
    headerBg: 'bg-blue-500/10 text-blue-300',
    iconBg: 'bg-blue-500/20 text-blue-400',
    glow: 'group-hover:shadow-[0_0_20px_rgba(59,130,246,0.2)]',
  },
  logic: {
    border: 'border-amber-500/40 hover:border-amber-500/80',
    headerBg: 'bg-amber-500/10 text-amber-300',
    iconBg: 'bg-amber-500/20 text-amber-400',
    glow: 'group-hover:shadow-[0_0_20px_rgba(245,158,11,0.2)]',
  },
};

function CustomNode({ id, data, selected }) {
  const { label, description, type, category = 'action', icon, status } = data || {};
  const isTrigger = type && type.startsWith('trigger_');
  const isCondition = type === 'logic_condition';

  const styles = CATEGORY_STYLES[category] || CATEGORY_STYLES.action;
  const IconComponent = ICON_MAP[icon] || Sparkles;

  return (
    <div
      className={`group relative w-64 rounded-xl bg-[#0f1424]/95 border ${styles.border} ${
        selected ? 'ring-2 ring-indigo-500 shadow-xl shadow-indigo-500/20 scale-[1.02]' : 'shadow-lg shadow-black/40'
      } ${styles.glow} backdrop-blur-md transition-all duration-200`}
    >
      {/* Target input handle (not needed for trigger start nodes) */}
      {!isTrigger && (
        <Handle
          type="target"
          position={Position.Top}
          className="!w-3 !h-3 !bg-indigo-500 !border-2 !border-[#0f1424] -top-1.5"
        />
      )}

      {/* Header bar */}
      <div className={`px-3.5 py-2.5 rounded-t-xl ${styles.headerBg} border-b border-white/5 flex items-center justify-between`}>
        <div className="flex items-center space-x-2">
          <div className={`p-1.5 rounded-lg ${styles.iconBg}`}>
            <IconComponent className="w-3.5 h-3.5" />
          </div>
          <span className="text-[11px] font-mono font-semibold tracking-wider uppercase">
            {category}
          </span>
        </div>

        {/* Node status indicator during live runs */}
        {status === 'running' && (
          <div className="flex items-center space-x-1 text-[10px] text-blue-400 font-mono">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>RUNNING</span>
          </div>
        )}
        {status === 'completed' && (
          <div className="flex items-center space-x-1 text-[10px] text-emerald-400 font-mono">
            <CheckCircle2 className="w-3 h-3" />
            <span>OK</span>
          </div>
        )}
        {status === 'failed' && (
          <div className="flex items-center space-x-1 text-[10px] text-rose-400 font-mono">
            <AlertCircle className="w-3 h-3" />
            <span>FAIL</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3.5 space-y-1">
        <h4 className="font-semibold text-xs text-slate-100 line-clamp-1">{label || 'Workflow Step'}</h4>
        <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
          {description || 'Configured automation node'}
        </p>
      </div>

      {/* Source output handles */}
      {isCondition ? (
        <>
          <Handle
            type="source"
            position={Position.Bottom}
            id="true"
            style={{ left: '30%' }}
            className="!w-3 !h-3 !bg-emerald-500 !border-2 !border-[#0f1424] -bottom-1.5"
          />
          <Handle
            type="source"
            position={Position.Bottom}
            id="false"
            style={{ left: '70%' }}
            className="!w-3 !h-3 !bg-rose-500 !border-2 !border-[#0f1424] -bottom-1.5"
          />
        </>
      ) : (
        <Handle
          type="source"
          position={Position.Bottom}
          className="!w-3 !h-3 !bg-indigo-500 !border-2 !border-[#0f1424] -bottom-1.5"
        />
      )}
    </div>
  );
}

export default memo(CustomNode);
