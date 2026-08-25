import { useState } from 'react';
import { PALETTE_CATEGORIES } from '../../lib/constants';
import { useWorkflowStore } from '../../store/workflowStore';
import {
  Search,
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
  Plus,
  GripVertical,
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

export default function NodePalette() {
  const [search, setSearch] = useState('');
  const { addNodeFromPalette, nodes } = useWorkflowStore();

  const onDragStart = (event, item) => {
    event.dataTransfer.setData('application/agentflow-node', JSON.stringify(item));
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleQuickAdd = (item) => {
    // Calculate intelligent default position below last node
    const lastNode = nodes[nodes.length - 1];
    const y = lastNode ? lastNode.position.y + 140 : 100;
    const x = lastNode ? lastNode.position.x : 250;
    addNodeFromPalette(item, { x, y });
  };

  return (
    <div className="w-64 h-full bg-[#0c101c] border-r border-[#1e2638] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-3.5 border-b border-[#1e2638] space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
            Node Palette
          </span>
          <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
            Drag to Canvas
          </span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Search nodes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#131929] border border-[#222d42] rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* Palette Categories List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {PALETTE_CATEGORIES.map((cat) => {
          const filteredItems = cat.items.filter(
            (item) =>
              item.label.toLowerCase().includes(search.toLowerCase()) ||
              item.description.toLowerCase().includes(search.toLowerCase())
          );

          if (filteredItems.length === 0) return null;

          return (
            <div key={cat.id} className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-1">
                <span>{cat.name}</span>
                <span className="text-[10px] text-slate-400">{filteredItems.length}</span>
              </div>

              <div className="space-y-1.5">
                {filteredItems.map((item) => {
                  const Icon = ICON_MAP[item.icon] || Sparkles;
                  return (
                    <div
                      key={item.type}
                      draggable
                      onDragStart={(e) => onDragStart(e, item)}
                      onClick={() => handleQuickAdd(item)}
                      className="group p-2.5 rounded-xl bg-[#111728] hover:bg-[#161e33] border border-[#1e273c] hover:border-indigo-500/40 cursor-grab active:cursor-grabbing transition-all flex items-center justify-between shadow-sm"
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <div className="p-1.5 rounded-lg bg-[#182035] group-hover:bg-indigo-500/20 text-indigo-400 transition-colors flex-shrink-0">
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <h5 className="text-xs font-medium text-slate-200 group-hover:text-white truncate">
                            {item.label}
                          </h5>
                          <p className="text-[10px] text-slate-400 truncate leading-tight">
                            {item.description}
                          </p>
                        </div>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1">
                        <button
                          title="Add to canvas"
                          className="p-1 rounded bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/40"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <GripVertical className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
