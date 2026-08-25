import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../components/ProtectedRoute/ProtectedRoute';
import AppShell from '../../components/AppShell/AppShell';
import WorkflowCanvas from '../../components/WorkflowCanvas/WorkflowCanvas';
import NodePalette from '../../components/NodePalette/NodePalette';
import NodeConfigPanel from '../../components/NodeConfigPanel/NodeConfigPanel';
import ExecutionTimeline from '../../components/ExecutionTimeline/ExecutionTimeline';
import { useWorkflowStore } from '../../store/workflowStore';
import { useExecutionStore } from '../../store/executionStore';
import api from '../../lib/api';
import {
  Save,
  Play,
  Copy,
  Trash2,
  Activity,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Layers,
  ArrowLeft,
  X,
  Sliders,
} from 'lucide-react';

export default function WorkflowEditorPage() {
  const router = useRouter();
  const { id } = router.query;

  const {
    workflow,
    nodes,
    edges,
    selectedNode,
    loadWorkflow,
    saveCurrentWorkflow,
    isSaving,
    error: workflowError,
  } = useWorkflowStore();

  const {
    startExecution,
    activeExecution,
    timelineLogs,
    isExecuting,
    pauseExecution,
    resumeExecution,
    cancelExecution,
  } = useExecutionStore();

  const [workflowName, setWorkflowName] = useState('');
  const [workflowDesc, setWorkflowDesc] = useState('');
  const [workflowStatus, setWorkflowStatus] = useState('active');
  const [showTimelineDrawer, setShowTimelineDrawer] = useState(false);
  const [saveToast, setSaveToast] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);

  useEffect(() => {
    if (id) {
      loadWorkflow(id).then((wf) => {
        if (wf) {
          setWorkflowName(wf.name);
          setWorkflowDesc(wf.description || '');
          setWorkflowStatus(wf.status || 'active');
        }
      }).catch(() => {});
    }
  }, [id, loadWorkflow]);

  const handleSave = async () => {
    try {
      await saveCurrentWorkflow(workflowName, workflowDesc, workflowStatus);
      setSaveToast(true);
      setTimeout(() => setSaveToast(false), 2500);
    } catch (_) {}
  };

  const handleDuplicate = async () => {
    try {
      const res = await api.post(`/workflows/${id}/duplicate`);
      const newWf = res.data.workflow;
      router.push(`/workflows/${newWf._id || newWf.id}`);
    } catch (_) {}
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this workflow?')) {
      try {
        await api.delete(`/workflows/${id}`);
        router.push('/dashboard');
      } catch (_) {}
    }
  };

  const handleExecute = async () => {
    // Basic pre-flight graph validation
    const errors = [];
    if (nodes.length === 0) {
      errors.push('Workflow has no nodes on canvas.');
    }
    const hasTrigger = nodes.some((n) => n.type && n.type.startsWith('trigger_'));
    if (!hasTrigger) {
      errors.push('Workflow must have at least one trigger node.');
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      setTimeout(() => setValidationErrors([]), 4000);
      return;
    }

    // Save first then execute
    await handleSave();
    try {
      const execId = await startExecution(id);
      setShowTimelineDrawer(true);
    } catch (_) {}
  };

  return (
    <ProtectedRoute>
      <AppShell title={workflowName || 'Workflow Canvas'}>
        <Head>
          <title>{workflowName || 'Workflow Editor'} | Agentflow_AI</title>
        </Head>

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Canvas Editor Toolbar */}
          <div className="h-16 bg-[#0c101c] border-b border-[#1e2638] px-4 lg:px-6 flex items-center justify-between gap-4 flex-shrink-0">
            {/* Title & Metadata */}
            <div className="flex items-center space-x-3 min-w-0">
              <a
                href="/dashboard"
                className="p-2 text-slate-400 hover:text-white hover:bg-surface-100 rounded-lg transition-colors"
                title="Back to Dashboard"
              >
                <ArrowLeft className="w-4 h-4" />
              </a>

              <div className="min-w-0">
                <input
                  type="text"
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                  className="bg-transparent font-bold text-sm text-slate-100 focus:outline-none focus:border-b border-indigo-500 truncate max-w-xs sm:max-w-md"
                  placeholder="Workflow Name"
                />
                <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-400">
                  <span>v{workflow?.version || 1}</span>
                  <span>•</span>
                  <span>{nodes.length} Nodes</span>
                  <span>•</span>
                  <span>{edges.length} Edges</span>
                  <span>•</span>
                  <select
                    value={workflowStatus}
                    onChange={(e) => setWorkflowStatus(e.target.value)}
                    className="bg-[#131929] border border-[#222d42] rounded px-1.5 py-0.5 text-slate-300 text-[10px] font-mono focus:outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="paused">Paused</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Toolbar Buttons */}
            <div className="flex items-center space-x-2 flex-shrink-0">
              <button
                onClick={handleDuplicate}
                className="p-2 rounded-xl bg-[#121828] hover:bg-[#182035] border border-[#222d42] text-slate-300 hover:text-white text-xs transition-all"
                title="Duplicate Workflow"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={handleDelete}
                className="p-2 rounded-xl bg-[#121828] hover:bg-rose-500/20 border border-[#222d42] hover:border-rose-500/40 text-slate-300 hover:text-rose-400 text-xs transition-all"
                title="Delete Workflow"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-3.5 py-1.5 rounded-xl bg-[#131929] hover:bg-[#182035] border border-[#222d42] hover:border-indigo-500/40 text-xs font-medium text-slate-200 flex items-center space-x-1.5 transition-all"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 text-indigo-400" />}
                <span>{saveToast ? 'Saved!' : 'Save'}</span>
              </button>

              <button
                onClick={() => setShowTimelineDrawer(!showTimelineDrawer)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-all flex items-center space-x-1.5 ${
                  showTimelineDrawer ? 'bg-purple-600/20 border-purple-500 text-purple-300' : 'bg-[#121828] border-[#222d42] text-slate-300'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Live Logs</span>
              </button>

              <button
                onClick={handleExecute}
                disabled={isExecuting}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-xs font-semibold text-white shadow-lg shadow-indigo-500/20 flex items-center space-x-1.5 transition-all disabled:opacity-50"
              >
                {isExecuting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                <span>Run Agent Chain</span>
              </button>
            </div>
          </div>

          {/* Preflight Validation Warning Banner */}
          {validationErrors.length > 0 && (
            <div className="p-3 bg-amber-500/10 border-b border-amber-500/30 flex items-center justify-between px-6 text-xs text-amber-300">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>{validationErrors.join(' • ')}</span>
              </div>
            </div>
          )}

          {/* Tri-Pane Editor Layout: [Palette | Canvas | Config Panel] */}
          <div className="flex-1 flex overflow-hidden relative">
            {/* Left: Node Palette */}
            <NodePalette />

            {/* Center: React Flow Canvas */}
            <div className="flex-1 h-full relative">
              <WorkflowCanvas />
            </div>

            {/* Right: Selected Node Config Panel */}
            {selectedNode && <NodeConfigPanel />}

            {/* Sliding Execution Timeline Drawer */}
            {showTimelineDrawer && (
              <div className="absolute right-0 top-0 bottom-0 w-96 bg-[#0c101c] border-l border-[#1e2638] shadow-2xl z-30 flex flex-col animate-in slide-in-from-right duration-200">
                <div className="p-4 border-b border-[#1e2638] flex items-center justify-between bg-[#111728]">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-purple-400" />
                    <h3 className="font-semibold text-xs text-slate-100 uppercase tracking-wider">
                      Live Multi-Agent Stream
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowTimelineDrawer(false)}
                    className="p-1 text-slate-400 hover:text-white rounded hover:bg-surface-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                  <ExecutionTimeline logs={timelineLogs} isLive={true} />
                </div>
              </div>
            )}
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
