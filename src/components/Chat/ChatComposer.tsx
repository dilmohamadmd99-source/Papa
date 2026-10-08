import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Square,
  Paperclip,
  Image as ImageIcon,
  X,
  FileCode,
  FileText,
  ChevronDown,
  Sparkles,
  Zap,
  Search,
} from 'lucide-react';
import type { Attachment } from '../../types';
import { AVAILABLE_AI_MODELS, getAIModelById } from '../../config/models';

interface ChatComposerProps {
  onSendMessage: (content: string, attachments: Attachment[], model: string) => void;
  onStopGeneration: () => void;
  isStreaming: boolean;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  disabled?: boolean;
  onOpenPricing?: () => void;
}

export const ChatComposer: React.FC<ChatComposerProps> = ({
  onSendMessage,
  onStopGeneration,
  isStreaming,
  selectedModel,
  setSelectedModel,
  disabled,
  onOpenPricing,
}) => {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [modelFilter, setModelFilter] = useState<'all' | 'free' | 'openai' | 'deepseek' | 'claude'>('all');
  const [searchModelQuery, setSearchModelQuery] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeModel = getAIModelById(selectedModel);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (isStreaming) {
      onStopGeneration();
      return;
    }
    if ((!input.trim() && attachments.length === 0) || disabled) return;

    onSendMessage(input.trim(), attachments, selectedModel);
    setInput('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      const isImg = file.type.startsWith('image/');
      const isText = file.type.startsWith('text/') || /\.(json|ts|js|py|html|css|md|sql|sh)$/i.test(file.name);

      if (isImg) {
        reader.onload = () => {
          setAttachments((prev) => [
            ...prev,
            {
              id: 'att_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
              name: file.name,
              size: file.size,
              type: file.type,
              dataUrl: reader.result as string,
            },
          ]);
        };
        reader.readAsDataURL(file);
      } else if (isText) {
        reader.onload = () => {
          setAttachments((prev) => [
            ...prev,
            {
              id: 'att_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
              name: file.name,
              size: file.size,
              type: file.type || 'text/plain',
              textContent: reader.result as string,
            },
          ]);
        };
        reader.readAsText(file);
      } else {
        // Fallback generic
        setAttachments((prev) => [
          ...prev,
          {
            id: 'att_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
            name: file.name,
            size: file.size,
            type: file.type || 'application/octet-stream',
          },
        ]);
      }
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const filteredModels = AVAILABLE_AI_MODELS.filter((m) => {
    if (modelFilter === 'free') return m.isFree;
    if (modelFilter === 'openai') return m.provider === 'OpenAI';
    if (modelFilter === 'deepseek') return m.provider === 'DeepSeek';
    if (modelFilter === 'claude') return m.provider === 'Anthropic' || m.provider === 'Meta' || m.provider === 'Mistral';
    return true;
  });

  return (
    <div className="p-4 bg-[#0c0d14]/95 border-t border-white/10 backdrop-blur-md">
      <div className="max-w-4xl mx-auto">
        {/* Attachment chips */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2 p-2 rounded-xl bg-[#141724] border border-white/10">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-black/60 border border-purple-500/30 text-xs text-gray-200"
              >
                {att.type.startsWith('image/') ? (
                  <ImageIcon className="w-3.5 h-3.5 text-pink-400" />
                ) : (
                  <FileCode className="w-3.5 h-3.5 text-blue-400" />
                )}
                <span className="truncate max-w-[140px] font-mono text-[11px]">{att.name}</span>
                <button
                  type="button"
                  onClick={() => removeAttachment(att.id)}
                  className="p-0.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input box */}
        <div className="relative rounded-2xl bg-[#141624] border border-white/15 focus-within:border-purple-500/60 focus-within:ring-2 focus-within:ring-purple-500/20 shadow-2xl transition-all">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              disabled
                ? 'Daily limit reached. Please upgrade to continue chatting.'
                : `Ask REHAN AI (${activeModel.name.split(' (')[0]}) anything (e.g. "Build a React component", "Write full Python code")...`
            }
            disabled={disabled}
            className="w-full bg-transparent text-gray-100 placeholder-gray-500 text-sm px-4 pt-3.5 pb-12 focus:outline-none resize-none max-h-44 scrollbar-thin"
          />

          {/* Action toolbar inside input card */}
          <div className="absolute left-3 bottom-2.5 right-3 flex items-center justify-between">
            {/* Left Tools */}
            <div className="flex items-center gap-1.5">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
                accept="image/*,.js,.jsx,.ts,.tsx,.py,.html,.css,.json,.md,.sql,.sh,.txt"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
                className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                title="Attach code file, image, or document"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              {/* Multi-AI Model Selector */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-gray-200 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors shadow-sm cursor-pointer"
                  title="Choose AI Model (OpenAI, DeepSeek, Claude, Llama, Gemini)"
                >
                  <span className={`w-2 h-2 rounded-full ${activeModel.dotColor}`} />
                  <span className="text-[11px] font-bold font-mono">
                    {activeModel.name.split(' (')[0]}
                  </span>
                  {activeModel.isFree && (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                      FREE
                    </span>
                  )}
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                </button>

                {modelDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setModelDropdownOpen(false)}
                    />
                    <div className="absolute left-0 bottom-full mb-2 w-80 sm:w-96 bg-[#141626] border border-purple-500/30 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 backdrop-blur-xl">
                      {/* Dropdown Header */}
                      <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2">
                        <div className="flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-purple-400" />
                          <span className="text-xs font-extrabold text-white">Choose AI Engine</span>
                        </div>
                        <span className="text-[10px] text-gray-400 font-mono">11 Models Available</span>
                      </div>

                      {/* Filter tabs */}
                      <div className="flex items-center gap-1 mb-2 overflow-x-auto pb-1 scrollbar-none text-[10px] font-semibold">
                        {[
                          { id: 'all', label: 'All Models' },
                          { id: 'free', label: '⚡ Free AI' },
                          { id: 'openai', label: 'OpenAI' },
                          { id: 'deepseek', label: 'DeepSeek' },
                          { id: 'claude', label: 'Claude & Meta' },
                        ].map((tab) => (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setModelFilter(tab.id as any)}
                            className={`px-2 py-1 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                              modelFilter === tab.id
                                ? 'bg-purple-600 text-white font-bold'
                                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                            }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>

                      {/* Models List */}
                      <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-white/15">
                        {filteredModels.map((m) => {
                          const isSelected = selectedModel === m.id;
                          return (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => {
                                setSelectedModel(m.id);
                                setModelDropdownOpen(false);
                              }}
                              className={`w-full text-left p-2.5 rounded-xl text-xs flex flex-col transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-purple-600/25 border border-purple-500/50 shadow-md'
                                  : 'hover:bg-white/5 border border-transparent'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-1.5">
                                  <span className={`w-2 h-2 rounded-full ${m.dotColor}`} />
                                  <span className="font-bold text-white text-[12px]">{m.name}</span>
                                </div>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold border ${m.badgeColor}`}>
                                  {m.badge}
                                </span>
                              </div>
                              <p className="text-[11px] text-gray-400 leading-snug line-clamp-2">
                                {m.description}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Right: Send or Stop */}
            <div className="flex items-center gap-2">
              {disabled ? (
                <button
                  type="button"
                  onClick={onOpenPricing}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-rose-600 text-white text-xs font-semibold shadow-md hover:opacity-90 transition-all"
                >
                  Upgrade to send
                </button>
              ) : isStreaming ? (
                <button
                  type="button"
                  onClick={onStopGeneration}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-semibold shadow-md shadow-rose-900/30 transition-all active:scale-95"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Stop</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!input.trim() && attachments.length === 0}
                  className="p-2.5 rounded-xl bg-gradient-to-tr from-purple-600 to-rose-600 hover:from-purple-500 hover:to-rose-500 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-md shadow-purple-900/40 transition-all active:scale-95"
                >
                  <Send className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        <p className="text-[11px] text-gray-500 text-center mt-2">
          REHAN AI can assist with coding, debugging, learning, and writing. Review sensitive code before production deployment.
        </p>
      </div>
    </div>
  );
};
