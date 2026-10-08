import React, { useState } from 'react';
import {
  FileCode,
  FilePlus,
  Trash2,
  Play,
  Download,
  Copy,
  Check,
  Sparkles,
  Bot,
  RefreshCw,
  Bug,
  BookOpen,
  ArrowRight,
  Code2,
  ArrowLeft,
} from 'lucide-react';
import { askWorkspaceAI } from '../../services/api';
import type { WorkspaceFile } from '../../types';

interface WorkspaceViewProps {
  onBackToChat?: () => void;
}

const INITIAL_PROJECT_FILES: WorkspaceFile[] = [
  {
    id: 'f1',
    name: 'App.tsx',
    path: '/src/App.tsx',
    language: 'typescript',
    content: `import React, { useState } from 'react';

export function Dashboard() {
  const [metrics, setMetrics] = useState({ users: 1240, revenue: 48900 });

  return (
    <div className="p-6 bg-slate-900 text-white rounded-xl">
      <h1 className="text-xl font-bold">REHAN AI Analytics</h1>
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="p-4 bg-slate-800 rounded-lg">Users: {metrics.users}</div>
        <div className="p-4 bg-slate-800 rounded-lg">Revenue: ₹{metrics.revenue}</div>
      </div>
    </div>
  );
}`,
  },
  {
    id: 'f2',
    name: 'server.py',
    path: '/server.py',
    language: 'python',
    content: `from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn

app = FastAPI(title="REHAN AI Fast Microservice")

class QueryRequest(BaseModel):
    query: str
    max_tokens: int = 500

@app.post("/analyze")
async def analyze_data(req: QueryRequest):
    if not req.query:
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    return {"status": "success", "result": f"Processed: {req.query}"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
`,
  },
  {
    id: 'f3',
    name: 'schema.sql',
    path: '/db/schema.sql',
    language: 'sql',
    content: `-- PostgreSQL Database Architecture
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan_id VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_subscriptions_user_status ON subscriptions(user_id, status);
`,
  },
];

export const WorkspaceView: React.FC<WorkspaceViewProps> = ({ onBackToChat }) => {
  const [files, setFiles] = useState<WorkspaceFile[]>(INITIAL_PROJECT_FILES);
  const [activeFileId, setActiveFileId] = useState<string>(INITIAL_PROJECT_FILES[0].id);
  const [copied, setCopied] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiOutput, setAiOutput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [activeAction, setActiveAction] = useState<string>('explain');

  const activeFile = files.find((f) => f.id === activeFileId) || files[0];

  const handleContentChange = (newContent: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === activeFile.id ? { ...f, content: newContent } : f))
    );
  };

  const handleAddNewFile = () => {
    const filename = prompt('Enter new filename (e.g. index.ts, utils.py, styles.css):');
    if (!filename) return;

    let lang = 'javascript';
    if (filename.endsWith('.ts') || filename.endsWith('.tsx')) lang = 'typescript';
    if (filename.endsWith('.py')) lang = 'python';
    if (filename.endsWith('.sql')) lang = 'sql';
    if (filename.endsWith('.html')) lang = 'html';
    if (filename.endsWith('.css')) lang = 'css';
    if (filename.endsWith('.json')) lang = 'json';

    const newFile: WorkspaceFile = {
      id: 'f_' + Date.now(),
      name: filename,
      path: `/${filename}`,
      language: lang,
      content: `// ${filename} created with REHAN AI Workspace\n`,
    };

    setFiles((prev) => [...prev, newFile]);
    setActiveFileId(newFile.id);
  };

  const handleDeleteFile = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (files.length <= 1) {
      alert('You must have at least one file in the workspace.');
      return;
    }
    if (confirm('Delete this file?')) {
      const filtered = files.filter((f) => f.id !== id);
      setFiles(filtered);
      if (activeFileId === id) {
        setActiveFileId(filtered[0].id);
      }
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(activeFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadAll = () => {
    const combined = files
      .map((f) => `// ================================\n// FILE: ${f.name}\n// ================================\n${f.content}`)
      .join('\n\n\n');

    const blob = new Blob([combined], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rehan-ai-project-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleRunAIAction = async (action: 'generate' | 'explain' | 'debug' | 'refactor' | 'tests' | 'docs') => {
    if (!activeFile) return;
    setIsAiLoading(true);
    setActiveAction(action);
    setAiOutput('');

    try {
      const res = await askWorkspaceAI(action, activeFile, aiPrompt, files);
      setAiOutput(res);
    } catch (err: any) {
      setAiOutput(`AI Error: ${err.message || 'Operation failed'}`);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleApplyAiChanges = () => {
    // Extract code block if AI returned markdown ```...```
    const match = aiOutput.match(/```[a-zA-Z0-9_\-#+.]*\n([\s\S]*?)```/);
    const codeToApply = match ? match[1] : aiOutput;

    if (codeToApply && confirm(`Apply AI changes directly to ${activeFile.name}?`)) {
      handleContentChange(codeToApply);
    }
  };

  const lines = activeFile.content.split('\n');

  return (
    <div className="flex-1 flex flex-col md:flex-row bg-[#0a0b10] overflow-hidden">
      {/* 1. File Explorer Sidebar */}
      <div className="w-full md:w-60 bg-[#0e1017] border-b md:border-b-0 md:border-r border-white/10 flex flex-col flex-shrink-0">
        <div className="p-3 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-200">
            <Code2 className="w-4 h-4 text-purple-400" />
            <span>Files Explorer</span>
          </div>
          <button
            onClick={handleAddNewFile}
            className="p-1 rounded-lg bg-white/5 hover:bg-purple-600/30 text-gray-400 hover:text-white transition-colors"
            title="Create new file"
          >
            <FilePlus className="w-4 h-4" />
          </button>
        </div>

        <div className="p-2 space-y-1 overflow-y-auto flex-1 max-h-40 md:max-h-none scrollbar-thin">
          {files.map((file) => {
            const isActive = file.id === activeFile.id;
            return (
              <div
                key={file.id}
                onClick={() => setActiveFileId(file.id)}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-colors ${
                  isActive
                    ? 'bg-purple-950/40 text-purple-200 border border-purple-500/30 font-medium'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <FileCode className={`w-3.5 h-3.5 ${isActive ? 'text-purple-400' : 'text-gray-500'}`} />
                  <span className="truncate">{file.name}</span>
                </div>
                {files.length > 1 && (
                  <button
                    onClick={(e) => handleDeleteFile(file.id, e)}
                    className="p-1 text-gray-500 hover:text-rose-400 rounded transition-colors"
                    title="Delete file"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="p-3 border-t border-white/10 bg-[#0c0d14]">
          <button
            onClick={handleDownloadAll}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-300 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-purple-400" />
            <span>Export Project</span>
          </button>
        </div>
      </div>

      {/* 2. Main Code Editor */}
      <div className="flex-1 flex flex-col min-w-0 border-b md:border-b-0 md:border-r border-white/10 bg-[#0d0e15]">
        {/* Editor Tab Bar */}
        <div className="h-10 bg-[#12141e] border-b border-white/10 flex items-center justify-between px-3">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
            {onBackToChat && (
              <button
                onClick={onBackToChat}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-600/20 hover:bg-purple-600/35 text-purple-200 border border-purple-500/30 text-xs font-bold transition-all active:scale-95 mr-1"
                title="Back to AI Chat"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-purple-300" />
                <span>Back to Chat</span>
              </button>
            )}
            <span className="text-xs font-mono font-bold text-white bg-purple-950/50 px-2.5 py-1 rounded-md border border-purple-500/30">
              {activeFile.name}
            </span>
            <span className="text-[11px] text-gray-500 uppercase">{activeFile.language}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Code Content Area with Line Numbers */}
        <div className="flex-1 flex overflow-hidden font-mono text-xs">
          {/* Line Numbers */}
          <div className="w-12 bg-[#0c0d13] text-gray-600 select-none text-right pr-3 pt-3 font-mono leading-6 border-r border-white/5">
            {lines.map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>

          {/* Editable Textarea */}
          <textarea
            value={activeFile.content}
            onChange={(e) => handleContentChange(e.target.value)}
            spellCheck={false}
            className="flex-1 bg-transparent text-gray-200 p-3 font-mono leading-6 resize-none focus:outline-none overflow-y-auto scrollbar-thin scrollbar-thumb-white/10"
          />
        </div>
      </div>

      {/* 3. AI Coding Assistant Sidebar */}
      <div className="w-full md:w-96 bg-[#10121c] flex flex-col flex-shrink-0">
        <div className="p-3 border-b border-white/10 flex items-center justify-between bg-[#141624]">
          <div className="flex items-center gap-2 text-xs font-bold text-purple-300">
            <Bot className="w-4 h-4 text-purple-400" />
            <span>AI Code Copilot</span>
          </div>
          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">
            Active
          </span>
        </div>

        {/* Quick AI Action Buttons */}
        <div className="p-3 border-b border-white/10 space-y-2">
          <div className="grid grid-cols-3 gap-1.5 text-[11px]">
            <button
              onClick={() => handleRunAIAction('explain')}
              disabled={isAiLoading}
              className="py-1.5 px-2 rounded-lg bg-white/5 hover:bg-purple-600/20 text-gray-300 hover:text-white border border-white/5 flex items-center justify-center gap-1 transition-colors"
            >
              <BookOpen className="w-3 h-3 text-blue-400" />
              <span>Explain</span>
            </button>
            <button
              onClick={() => handleRunAIAction('debug')}
              disabled={isAiLoading}
              className="py-1.5 px-2 rounded-lg bg-white/5 hover:bg-purple-600/20 text-gray-300 hover:text-white border border-white/5 flex items-center justify-center gap-1 transition-colors"
            >
              <Bug className="w-3 h-3 text-rose-400" />
              <span>Fix Bugs</span>
            </button>
            <button
              onClick={() => handleRunAIAction('refactor')}
              disabled={isAiLoading}
              className="py-1.5 px-2 rounded-lg bg-white/5 hover:bg-purple-600/20 text-gray-300 hover:text-white border border-white/5 flex items-center justify-center gap-1 transition-colors"
            >
              <RefreshCw className="w-3 h-3 text-emerald-400" />
              <span>Refactor</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            <button
              onClick={() => handleRunAIAction('tests')}
              disabled={isAiLoading}
              className="py-1.5 px-2 rounded-lg bg-white/5 hover:bg-purple-600/20 text-gray-300 hover:text-white border border-white/5 flex items-center justify-center gap-1 transition-colors"
            >
              <span>Generate Tests</span>
            </button>
            <button
              onClick={() => handleRunAIAction('docs')}
              disabled={isAiLoading}
              className="py-1.5 px-2 rounded-lg bg-white/5 hover:bg-purple-600/20 text-gray-300 hover:text-white border border-white/5 flex items-center justify-center gap-1 transition-colors"
            >
              <span>Generate Docs</span>
            </button>
          </div>

          {/* Custom Prompt Input */}
          <div className="relative mt-2">
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Custom instructions (e.g. 'Add dark mode toggle')..."
              onKeyDown={(e) => e.key === 'Enter' && handleRunAIAction('generate')}
              className="w-full bg-[#181a28] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 pr-9 focus:outline-none focus:border-purple-500/50"
            />
            <button
              onClick={() => handleRunAIAction('generate')}
              disabled={isAiLoading || !aiPrompt.trim()}
              className="absolute right-2 top-2 p-1 text-purple-400 hover:text-purple-300 disabled:opacity-40"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* AI Output Stream / Display */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3 font-mono text-xs text-gray-300 scrollbar-thin">
          {isAiLoading ? (
            <div className="flex flex-col items-center justify-center h-48 space-y-3 text-purple-400">
              <Sparkles className="w-6 h-6 animate-spin" />
              <p className="text-xs font-semibold text-gray-300">
                REHAN AI analyzing {activeFile.name}...
              </p>
            </div>
          ) : aiOutput ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="text-[11px] text-gray-400 uppercase font-bold">
                  AI Solution ({activeAction})
                </span>
                <button
                  onClick={handleApplyAiChanges}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold"
                >
                  <Check className="w-3 h-3" />
                  <span>Apply to File</span>
                </button>
              </div>
              <div className="whitespace-pre-wrap leading-relaxed text-gray-200 bg-[#161824] p-3 rounded-xl border border-white/5">
                {aiOutput}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500 space-y-2">
              <Bot className="w-8 h-8 mx-auto text-gray-600" />
              <p className="text-xs">
                Select an action above to have REHAN AI analyze, debug, or rewrite{' '}
                <strong className="text-purple-300">{activeFile.name}</strong>.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
