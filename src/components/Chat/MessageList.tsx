import React, { useEffect, useRef } from 'react';
import {
  Sparkles,
  User,
  Copy,
  Check,
  RotateCw,
  FileText,
  FileCode,
  Image as ImageIcon,
} from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';
import type { Message } from '../../types';
import { getAIModelById } from '../../config/models';

interface MessageListProps {
  messages: Message[];
  streamingText: string;
  isStreaming: boolean;
  onRegenerate: () => void;
  onOpenInWorkspace?: (code: string, language: string) => void;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  streamingText,
  isStreaming,
  onRegenerate,
  onOpenInWorkspace,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8 space-y-6 scrollbar-thin scrollbar-thumb-white/10">
      {messages.map((message, index) => {
        const isUser = message.role === 'user';
        const isLastAssistant = !isUser && index === messages.length - 1;

        return (
          <div
            key={message.id || index}
            className={`flex gap-3 md:gap-4 max-w-4xl mx-auto ${
              isUser ? 'justify-end' : 'justify-start'
            }`}
          >
            {/* Assistant Avatar */}
            {!isUser && (
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-rose-600 flex-shrink-0 flex items-center justify-center shadow-md shadow-purple-600/20 mt-1">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            )}

            {/* Message Bubble */}
            <div
              className={`group relative rounded-2xl p-4 md:p-5 max-w-[85%] md:max-w-[78%] transition-all ${
                isUser
                  ? 'bg-gradient-to-r from-purple-700 to-indigo-700 text-white shadow-lg shadow-purple-900/20'
                  : 'bg-[#131520] border border-white/10 shadow-xl'
              }`}
            >
              {/* Attachments (if any) */}
              {message.attachments && message.attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3 pb-2 border-b border-white/10">
                  {message.attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/40 border border-white/10 text-xs text-gray-200"
                    >
                      {att.type.startsWith('image/') ? (
                        <ImageIcon className="w-3.5 h-3.5 text-pink-400" />
                      ) : att.name.endsWith('.ts') || att.name.endsWith('.js') || att.name.endsWith('.py') ? (
                        <FileCode className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <FileText className="w-3.5 h-3.5 text-blue-400" />
                      )}
                      <span className="truncate max-w-[150px] font-mono text-[11px]">{att.name}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Message Content */}
              {isUser ? (
                <div className="text-sm text-gray-100 whitespace-pre-wrap leading-relaxed">
                  {message.content}
                </div>
              ) : (
                <div className="text-sm leading-relaxed">
                  <MarkdownRenderer content={message.content} onOpenInWorkspace={onOpenInWorkspace} />
                </div>
              )}

              {/* Assistant Message Actions */}
              {!isUser && (
                <div className="flex items-center gap-2 mt-3 pt-2 border-t border-white/5 text-gray-400 opacity-90 transition-opacity">
                  <button
                    onClick={() => handleCopyMessage(message.id, message.content)}
                    className="flex items-center gap-1 text-[11px] hover:text-white px-2 py-1 rounded hover:bg-white/5 transition-colors"
                    title="Copy full response"
                  >
                    {copiedId === message.id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>

                  {isLastAssistant && !isStreaming && (
                    <button
                      onClick={onRegenerate}
                      className="flex items-center gap-1 text-[11px] hover:text-white px-2 py-1 rounded hover:bg-white/5 transition-colors"
                      title="Regenerate this response"
                    >
                      <RotateCw className="w-3 h-3 text-purple-400" />
                      <span>Regenerate</span>
                    </button>
                  )}

                  {(() => {
                    const modelInfo = getAIModelById(message.model || 'gemini-3.8-flash');
                    return (
                      <span className="text-[10px] text-gray-400 ml-auto font-mono flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/5 border border-white/5">
                        <span className={`w-1.5 h-1.5 rounded-full ${modelInfo.dotColor}`} />
                        <span className="font-semibold text-gray-300">{modelInfo.name.split(' (')[0]}</span>
                        {modelInfo.isFree && (
                          <span className="text-[8px] px-1 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                            FREE
                          </span>
                        )}
                      </span>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* User Avatar */}
            {isUser && (
              <div className="w-8 h-8 rounded-xl bg-purple-900/60 border border-purple-500/30 flex-shrink-0 flex items-center justify-center mt-1 text-purple-200">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        );
      })}

      {/* Streaming In-Progress Bubble */}
      {isStreaming && (
        <div className="flex gap-3 md:gap-4 max-w-4xl mx-auto justify-start">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-rose-600 flex-shrink-0 flex items-center justify-center shadow-md shadow-purple-600/20 mt-1">
            <Sparkles className="w-4 h-4 text-white animate-spin" />
          </div>

          <div className="rounded-2xl p-4 md:p-5 max-w-[85%] md:max-w-[78%] bg-[#131520] border border-white/10 shadow-xl">
            {streamingText ? (
              <div className="text-sm leading-relaxed">
                <MarkdownRenderer content={streamingText} onOpenInWorkspace={onOpenInWorkspace} />
                <span className="inline-block w-2 h-4 bg-purple-400 ml-1 animate-pulse" />
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-purple-300">
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                <span>REHAN AI is thinking and coding...</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
};
