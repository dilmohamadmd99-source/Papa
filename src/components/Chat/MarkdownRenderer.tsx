import React from 'react';
import { CodeBlock } from './CodeBlock';

interface MarkdownRendererProps {
  content: string;
  onOpenInWorkspace?: (code: string, language: string) => void;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, onOpenInWorkspace }) => {
  // Split content by code blocks, supporting both closed blocks and real-time streaming unclosed blocks
  const parts: React.ReactNode[] = [];
  const codeBlockRegex = /```([a-zA-Z0-9_\-#+.]*)[\r\n]([\s\S]*?)(?:```|$)/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    const textBefore = content.substring(lastIndex, match.index);
    if (textBefore) {
      parts.push(
        <div key={`text-${lastIndex}`} className="space-y-2">
          {renderFormattedText(textBefore)}
        </div>
      );
    }

    const language = match[1]?.trim() || 'code';
    const code = match[2];
    parts.push(
      <CodeBlock
        key={`code-${match.index}`}
        language={language}
        code={code}
        onOpenInWorkspace={onOpenInWorkspace}
      />
    );

    lastIndex = match.index + match[0].length;
    // If the matched block did not close with ```, it reached the end of stream
    if (!match[0].endsWith('```')) {
      break;
    }
  }

  const remainingText = content.substring(lastIndex);
  if (remainingText) {
    parts.push(
      <div key={`text-${lastIndex}`} className="space-y-2">
        {renderFormattedText(remainingText)}
      </div>
    );
  }

  return <div className="text-gray-200 leading-relaxed space-y-3">{parts}</div>;
};

function renderFormattedText(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Headers
    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={i} className="text-base font-bold text-white mt-3 mb-1 text-purple-300">
          {formatInline(line.substring(4))}
        </h3>
      );
    } else if (line.startsWith('## ')) {
      elements.push(
        <h2 key={i} className="text-lg font-bold text-white mt-4 mb-2 border-b border-white/10 pb-1">
          {formatInline(line.substring(3))}
        </h2>
      );
    } else if (line.startsWith('# ')) {
      elements.push(
        <h1 key={i} className="text-xl font-extrabold text-white mt-5 mb-2">
          {formatInline(line.substring(2))}
        </h1>
      );
    } else if (line.startsWith('> ')) {
      // Blockquote
      elements.push(
        <blockquote key={i} className="border-l-4 border-purple-500/60 pl-3 py-1 my-2 bg-purple-950/20 text-gray-300 italic text-sm rounded-r">
          {formatInline(line.substring(2))}
        </blockquote>
      );
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      // Unordered list item
      elements.push(
        <li key={i} className="list-disc ml-5 my-0.5 text-sm text-gray-300">
          {formatInline(line.substring(2))}
        </li>
      );
    } else if (/^\d+\.\s/.test(line)) {
      // Ordered list item
      const numMatch = line.match(/^(\d+\.)\s(.*)$/);
      elements.push(
        <li key={i} className="list-decimal ml-5 my-0.5 text-sm text-gray-300">
          {formatInline(numMatch ? numMatch[2] : line)}
        </li>
      );
    } else if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      // Basic table row
      const cells = line.split('|').filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
      const isHeaderDivider = cells.every((c) => c.trim().match(/^:?-+:?$/));

      if (!isHeaderDivider) {
        elements.push(
          <div key={i} className="grid grid-flow-col auto-cols-fr gap-2 bg-[#12141f] border border-white/10 p-2 text-xs rounded my-1">
            {cells.map((cell, cIdx) => (
              <div key={cIdx} className="px-1 text-gray-300 font-medium">
                {formatInline(cell.trim())}
              </div>
            ))}
          </div>
        );
      }
    } else if (line.trim() === '') {
      elements.push(<div key={i} className="h-1" />);
    } else {
      elements.push(
        <p key={i} className="text-sm leading-relaxed text-gray-300">
          {formatInline(line)}
        </p>
      );
    }
  }

  return elements;
}

function formatInline(str: string): React.ReactNode {
  // Inline code `...`
  const parts: React.ReactNode[] = [];
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIdx = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(str)) !== null) {
    if (match.index > lastIdx) {
      parts.push(str.substring(lastIdx, match.index));
    }
    const token = match[0];
    if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code
          key={match.index}
          className="px-1.5 py-0.5 rounded bg-purple-950/40 text-purple-300 font-mono text-[12px] border border-purple-500/20"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={match.index} className="font-semibold text-white">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(
        <em key={match.index} className="italic text-gray-300">
          {token.slice(1, -1)}
        </em>
      );
    }
    lastIdx = match.index + token.length;
  }

  if (lastIdx < str.length) {
    parts.push(str.substring(lastIdx));
  }

  return parts.length > 0 ? parts : str;
}
