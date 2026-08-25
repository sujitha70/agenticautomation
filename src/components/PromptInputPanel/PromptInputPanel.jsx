import { useState } from 'react';
import { SAMPLE_PROMPTS } from '../../lib/constants';
import { Sparkles, ArrowRight, Loader2, Wand2, Lightbulb } from 'lucide-react';

export default function PromptInputPanel({ onGenerate, isGenerating }) {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;
    onGenerate(prompt.trim());
  };

  const handleSelectSample = (sample) => {
    setPrompt(sample);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {/* Main Prompt Form */}
      <form onSubmit={handleSubmit} className="relative group">
        <div className="p-1 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-xl shadow-indigo-500/10 group-hover:shadow-indigo-500/25 transition-all">
          <div className="bg-[#0e1322] rounded-[14px] p-2 sm:p-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="p-2 text-indigo-400 hidden sm:block">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>

            <textarea
              rows={2}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your automation in plain English (e.g. 'When a new email arrives, summarize with AI, post to Slack, and log in Google Sheets')..."
              className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-400 focus:outline-none resize-none p-1 font-sans leading-relaxed"
              disabled={isGenerating}
            />

            <button
              type="submit"
              disabled={!prompt.trim() || isGenerating}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-xs text-white shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all flex-shrink-0"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Graph...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  <span>Generate Workflow</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Suggested Prompt Chips */}
      <div className="space-y-2">
        <div className="flex items-center space-x-1.5 text-xs text-slate-400 px-1">
          <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
          <span>Quick Inspiration Templates:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_PROMPTS.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectSample(sample)}
              className="px-3 py-1.5 rounded-lg bg-[#111728] hover:bg-[#161e33] border border-[#1e273c] hover:border-indigo-500/40 text-[11px] text-slate-300 hover:text-white text-left transition-all line-clamp-1"
            >
              {sample}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
