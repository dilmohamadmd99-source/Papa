import React, { useState, useMemo } from 'react';
import { Check, Copy, Code2, ExternalLink } from 'lucide-react';
import Prism from 'prismjs';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';

interface CodeBlockProps {
  language: string;
  code: string;
  onOpenInWorkspace?: (code: string, language: string) => void;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ language, code, onOpenInWorkspace }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = code.trim().split('\n');

  const highlightedHtml = useMemo(() => {
    let lang = (language || '').toLowerCase().trim();
    if (!lang || lang === 'code' || lang === 'text' || lang === 'txt') lang = 'javascript';
    if (lang === 'js') lang = 'javascript';
    if (lang === 'ts') lang = 'typescript';
    if (lang === 'py') lang = 'python';
    if (lang === 'html' || lang === 'xml' || lang === 'svg') lang = 'markup';
    if (lang === 'sh' || lang === 'shell' || lang === 'zsh') lang = 'bash';
    if (lang === 'react') lang = 'tsx';
    if (lang === 'c++') lang = 'cpp';
    if (lang === 'c#' || lang === 'cs') lang = 'csharp';
    if (lang === 'node') lang = 'javascript';

    const grammar = Prism.languages[lang] || Prism.languages.javascript || Prism.languages.markup;
    const effectiveLang = lang in Prism.languages ? lang : 'javascript';
    try {
      return Prism.highlight(code, grammar, effectiveLang);
    } catch {
      return code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
  }, [code, language]);

  return (
    <div className="my-3.5 rounded-2xl overflow-hidden border border-white/[0.10] bg-[#030407] shadow-2xl text-xs font-mono">
      {/* Code Header Bar */}
      <div className="bg-[#070810] px-4 py-2.5 flex items-center justify-between border-b border-white/[0.08] select-none">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-purple-400" />
          <span className="text-[11px] font-bold text-purple-200 uppercase tracking-wider font-mono">
            {language || 'code'}
          </span>
          <span className="text-[10px] text-gray-500 font-mono">({lines.length} lines)</span>
        </div>

        <div className="flex items-center gap-1.5">
          {onOpenInWorkspace && (
            <button
              onClick={() => onOpenInWorkspace(code, language)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 hover:text-white border border-purple-500/20 transition-colors text-[11px] font-semibold cursor-pointer"
              title="Open in Coding Workspace"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Workspace</span>
            </button>
          )}

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition-colors text-[11px] font-semibold cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Content with Authentic VS Code Original Syntax Highlighting */}
      <div className="flex overflow-x-auto p-4 text-[13px] leading-6 font-mono scrollbar-thin scrollbar-thumb-white/15">
        {/* Line Numbers */}
        <div className="select-none text-gray-600 text-right pr-4 border-r border-white/10 font-mono text-[12px] leading-6 flex-shrink-0">
          {lines.map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        {/* Highlighted Code */}
        <pre className="m-0 pl-4 overflow-visible font-mono text-[13px] leading-6 flex-1 text-[#e6edf3]">
          <code
            className={`language-${language || 'javascript'}`}
            dangerouslySetInnerHTML={{ __html: highlightedHtml }}
          />
        </pre>
      </div>
    </div>
  );
};
