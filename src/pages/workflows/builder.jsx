import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../components/ProtectedRoute/ProtectedRoute';
import AppShell from '../../components/AppShell/AppShell';
import PromptInputPanel from '../../components/PromptInputPanel/PromptInputPanel';
import WorkflowCanvas from '../../components/WorkflowCanvas/WorkflowCanvas';
import NodePalette from '../../components/NodePalette/NodePalette';
import NodeConfigPanel from '../../components/NodeConfigPanel/NodeConfigPanel';
import { useWorkflowStore } from '../../store/workflowStore';
import { useExecutionStore } from '../../store/executionStore';
import {
  Sparkles,
  Save,
  Play,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  Sliders,
  FileCode,
  Layers,
  Wand2,
} from 'lucide-react';

export default function WorkflowBuilderPage() {
  const router = useRouter();
  const {
    workflow,
    nodes,
    edges,
    selectedNode,
    isGenerating,
    isSaving,
    generateFromPrompt,
    saveCurrentWorkflow,
    error,
  } = useWorkflowStore();

  const { startExecution, isExecuting } = useExecutionStore();

  const [workflowTitle, setWorkflowTitle] = useState('AI Automated Workflow');
  const [workflowDesc, setWorkflowDesc] = useState('');
  const [generatorInfo, setGeneratorInfo] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showPalette, setShowPalette] = useState(false);

  const handleGenerate = async (prompt) => {
    try {
      const generated = await generateFromPrompt(prompt);
      setWorkflowTitle(generated.name || 'AI Generated Automation');
      setWorkflowDesc(generated.description || '');
      setGeneratorInfo(generated.generator);
    } catch (_) {}
  };

  const handleSave = async () => {
    try {
      const saved = await saveCurrentWorkflow(workflowTitle, workflowDesc);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      return saved;
    } catch (_) {}
  };

  const handleSaveAndExecute = async () => {
    try {
      const saved = await handleSave();
      if (saved) {
        const id = saved._id || saved.id;
        const execId = await startExecution(id);
        router.push(`/executions?id=${execId}`);
      }
    } catch (_) {}
  };

  return (
    <ProtectedRoute>
      <AppShell title="AI Workflow Builder">
        <Head>
          <title>AI Workflow Generator | Agentflow_AI</title>
        </Head>

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top AI Builder Control Toolbar */}
          <div className="h-16 bg-[#0c101c] border-b border-[#1e2638] px-4 lg:px-6 flex items-center justify-between gap-4 flex-shrink-0">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="p-2 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow">
                <Wand2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <input
                  type="text"
                  value={workflowTitle}
                  onChange={(e) => setWorkflowTitle(e.target.value)}
                  className="bg-transparent font-bold text-sm text-slate-100 focus:outline-none focus:border-b border-indigo-500 truncate max-w-xs sm:max-w-md"
                  placeholder="Workflow Name..."
                />
                <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-400">
                  <span>{nodes.length} Nodes</span>
                  <span>•</span>
                  <span>{edges.length} Connections</span>
                  {generatorInfo && (
                    <>
                      <span>•</span>
                      <span className="text-emerald-400 uppercase">Engine: {generatorInfo}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2 flex-shrink-0">
              <button
                onClick={() => setShowPalette(!showPalette)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-all flex items-center space-x-1.5 ${
                  showPalette ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300' : 'bg-[#121828] border-[#222d42] text-slate-300'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Palette</span>
              </button>

              <button
                onClick={handleSave}
                disabled={isSaving || nodes.length === 0}
                className="px-3.5 py-1.5 rounded-xl bg-[#131929] hover:bg-[#182035] border border-[#222d42] hover:border-indigo-500/40 text-xs font-medium text-slate-200 flex items-center space-x-1.5 transition-all disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 text-indigo-400" />}
                <span>{saveSuccess ? 'Saved!' : 'Save Workflow'}</span>
              </button>

              <button
                onClick={handleSaveAndExecute}
                disabled={isExecuting || nodes.length === 0}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-xs font-semibold text-white shadow-lg shadow-indigo-500/20 flex items-center space-x-1.5 transition-all disabled:opacity-50"
              >
                {isExecuting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                <span>Execute Automation</span>
              </button>
            </div>
          </div>

          {/* Prompt Input Section */}
          <div className="p-4 lg:p-6 bg-[#090d16] border-b border-[#182034] flex-shrink-0">
            <PromptInputPanel onGenerate={handleGenerate} isGenerating={isGenerating} />
          </div>

          {/* Interactive Flow Canvas Area */}
          <div className="flex-1 flex overflow-hidden relative">
            {/* Optional Collapsible Left Palette */}
            {showPalette && (
              <div className="h-full z-10">
                <NodePalette />
              </div>
            )}

            {/* Canvas Viewport */}
            <div className="flex-1 h-full relative">
              <WorkflowCanvas />
            </div>

            {/* Right Node Config Inspector */}
            {selectedNode && (
              <div className="h-full z-10">
                <NodeConfigPanel />
              </div>
            )}
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
