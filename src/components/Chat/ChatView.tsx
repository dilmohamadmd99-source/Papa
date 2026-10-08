import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Terminal, Cpu, Database, Zap } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { MessageList } from './MessageList';
import { ChatComposer } from './ChatComposer';
import { useAuth } from '../../context/AuthContext';
import {
  getConversations,
  createConversation,
  updateConversationTitle,
  deleteConversation,
  getMessages,
  saveMessage,
} from '../../firebase/db';
import { streamChatResponse } from '../../services/api';
import type { Conversation, Message, Attachment } from '../../types';
import { AVAILABLE_AI_MODELS, getAIModelById } from '../../config/models';

interface ChatViewProps {
  onOpenPricing: () => void;
  onOpenInWorkspace: (code: string, language: string) => void;
  isSidebarOpenMobile: boolean;
  setIsSidebarOpenMobile: (open: boolean) => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  onOpenPricing,
  onOpenInWorkspace,
  isSidebarOpenMobile,
  setIsSidebarOpenMobile,
}) => {
  const { user, isPremium, dailyUsage, incrementUsage, loginWithGoogle } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [selectedModel, setSelectedModel] = useState('gemini-3.8-flash');
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load user conversations on auth
  useEffect(() => {
    if (!user) {
      setConversations([]);
      setActiveConvId(null);
      setMessages([]);
      return;
    }

    const loadConvs = async () => {
      try {
        const convList = await getConversations(user.uid);
        setConversations(convList);
        if (convList.length > 0 && !activeConvId) {
          setActiveConvId(convList[0].id);
        }
      } catch (err) {
        console.error('Failed to load conversations:', err);
      }
    };

    loadConvs();
  }, [user]);

  // Load messages when active conversation changes
  useEffect(() => {
    if (!activeConvId || !user) {
      setMessages([]);
      return;
    }

    const loadMsgs = async () => {
      try {
        const msgs = await getMessages(activeConvId, user.uid);
        setMessages(msgs);
      } catch (err) {
        console.error('Failed to load messages:', err);
      }
    };

    loadMsgs();
  }, [activeConvId, user]);

  const handleNewChat = async () => {
    if (!user) {
      // Guest local chat
      setActiveConvId(null);
      setMessages([]);
      return;
    }

    try {
      const newConv = await createConversation(user.uid, 'New Conversation', selectedModel);
      setConversations((prev) => [newConv, ...prev]);
      setActiveConvId(newConv.id);
      setMessages([]);
    } catch (err) {
      console.error('Failed to create new chat:', err);
    }
  };

  const handleSelectConversation = (id: string) => {
    if (isStreaming) {
      handleStopGeneration();
    }
    setActiveConvId(id);
  };

  const handleRenameConversation = async (id: string, newTitle: string) => {
    try {
      await updateConversationTitle(id, newTitle);
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c))
      );
    } catch (err) {
      console.error('Failed to rename conversation:', err);
    }
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      await deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConvId === id) {
        const remaining = conversations.filter((c) => c.id !== id);
        if (remaining.length > 0) {
          setActiveConvId(remaining[0].id);
        } else {
          setActiveConvId(null);
          setMessages([]);
        }
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  const handleSendMessage = async (
    content: string,
    attachments: Attachment[] = [],
    modelToUse: string
  ) => {
    if (!user) {
      await loginWithGoogle();
      return;
    }

    // Check free message limit
    if (!isPremium && dailyUsage.messageCount >= 30) {
      onOpenPricing();
      return;
    }

    let targetConvId = activeConvId;

    // Create conversation if none active
    if (!targetConvId) {
      const firstLine = content.slice(0, 35) || 'New Conversation';
      const created = await createConversation(user.uid, firstLine, modelToUse);
      setConversations((prev) => [created, ...prev]);
      targetConvId = created.id;
      setActiveConvId(created.id);
    }

    const now = new Date().toISOString();
    const userMsg: Message = {
      id: 'temp_u_' + Date.now(),
      conversationId: targetConvId,
      userId: user.uid,
      role: 'user',
      content,
      attachments,
      createdAt: now,
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);

    // Save user message to Firestore
    try {
      await saveMessage({
        conversationId: targetConvId,
        userId: user.uid,
        role: 'user',
        content,
        attachments,
        createdAt: now,
      });
      await incrementUsage();
    } catch (err) {
      console.error('Failed to save user message:', err);
    }

    // Stream AI response
    setIsStreaming(true);
    setStreamingText('');

    const controller = new AbortController();
    abortControllerRef.current = controller;

    let accumulatedResponse = '';

    await streamChatResponse(
      updatedMessages.map((m) => ({
        role: m.role,
        content: m.content,
        attachments: m.attachments,
      })),
      modelToUse,
      attachments,
      {
        onChunk: (chunk: string) => {
          accumulatedResponse += chunk;
          setStreamingText(accumulatedResponse);
        },
        onError: (errorStr: string) => {
          setIsStreaming(false);
          const errMsg: Message = {
            id: 'err_' + Date.now(),
            conversationId: targetConvId!,
            userId: user.uid,
            role: 'assistant',
            content: `**Error**: ${errorStr}. Please check your connection or try again.`,
            createdAt: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, errMsg]);
        },
        onFinish: async () => {
          setIsStreaming(false);
          if (accumulatedResponse.trim() && targetConvId) {
            const assistantMsg: Message = {
              id: 'temp_a_' + Date.now(),
              conversationId: targetConvId,
              userId: user.uid,
              role: 'assistant',
              content: accumulatedResponse,
              model: modelToUse,
              createdAt: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, assistantMsg]);
            setStreamingText('');

            // Save assistant message to Firestore
            try {
              await saveMessage({
                conversationId: targetConvId,
                userId: user.uid,
                role: 'assistant',
                content: accumulatedResponse,
                model: modelToUse,
                createdAt: new Date().toISOString(),
              });
            } catch (err) {
              console.error('Failed to save assistant message:', err);
            }
          }
        },
      },
      controller.signal
    );
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
    }
  };

  const handleRegenerate = () => {
    if (messages.length === 0 || isStreaming) return;
    const lastUserIndex = [...messages].reverse().findIndex((m) => m.role === 'user');
    if (lastUserIndex === -1) return;

    const actualIndex = messages.length - 1 - lastUserIndex;
    const lastUserMsg = messages[actualIndex];
    // Remove last assistant message
    setMessages(messages.slice(0, actualIndex + 1));
    handleSendMessage(lastUserMsg.content, lastUserMsg.attachments || [], selectedModel);
  };

  const isLimitReached = !isPremium && dailyUsage.messageCount >= 30;

  return (
    <div className="flex-1 flex overflow-hidden relative">
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConvId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        onRenameConversation={handleRenameConversation}
        onDeleteConversation={handleDeleteConversation}
        onOpenPricing={onOpenPricing}
        isOpenMobile={isSidebarOpenMobile}
        onCloseMobile={() => setIsSidebarOpenMobile(false)}
      />

      <div className="flex-1 flex flex-col bg-[#030407] overflow-hidden">
        {messages.length === 0 && !isStreaming ? (
          /* Empty Chat Welcome Hero */
          <div className="flex-1 overflow-y-auto px-4 py-8 flex items-center justify-center">
            <div className="max-w-2xl w-full text-center space-y-6">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-purple-600 via-violet-600 to-rose-500 mx-auto flex items-center justify-center shadow-2xl shadow-purple-600/30">
                <Sparkles className="w-8 h-8 text-white" />
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400">REHAN AI</span>
                </h1>
                <p className="text-sm text-gray-400 mt-2 max-w-lg mx-auto">
                  Your AI assistant for advanced software engineering, algorithm optimization, documentation, and creative productivity.
                </p>
              </div>

              {/* Multi-AI Engine Selector (OpenAI, DeepSeek, Claude, Meta, Gemini) */}
              <div className="bg-[#07080f] border border-white/[0.08] rounded-2xl p-3 sm:p-4 text-left shadow-2xl">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>Choose AI Engine (OpenAI, DeepSeek, Claude, Meta, Gemini)</span>
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    ⚡ Free AI Options
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_AI_MODELS.map((modelItem) => {
                    const isSelected = selectedModel === modelItem.id;
                    return (
                      <button
                        key={modelItem.id}
                        onClick={() => setSelectedModel(modelItem.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-purple-600 text-white font-bold shadow-lg shadow-purple-900/40 ring-2 ring-purple-400'
                            : 'bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 hover:text-white border border-white/[0.06]'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${modelItem.dotColor}`} />
                        <span>{modelItem.name.split(' (')[0]}</span>
                        {modelItem.isFree ? (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                            FREE
                          </span>
                        ) : (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold">
                            PRO
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Starter Quick Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left pt-2">
                {[
                  {
                    icon: Terminal,
                    title: 'Build Full-Stack App',
                    desc: 'Create a React + Tailwind + Node.js dashboard with authentication',
                    prompt: 'Design a full-stack dashboard in React with Tailwind CSS, TypeScript, and Express backend structure with mock data.',
                  },
                  {
                    icon: Cpu,
                    title: 'Debug & Refactor Code',
                    desc: 'Paste messy code or errors to identify edge cases and optimize runtime',
                    prompt: 'Here is an asynchronous JavaScript function with potential race conditions. Please explain the bug and rewrite it cleanly:',
                  },
                  {
                    icon: Database,
                    title: 'Database & Architecture',
                    desc: 'Design PostgreSQL schemas, indexing strategies, and RESTful APIs',
                    prompt: 'Design a high-scale database schema and REST API endpoints for an e-commerce subscription service with discount coupons.',
                  },
                  {
                    icon: Zap,
                    title: 'Algorithms & Study',
                    desc: 'Explain complex algorithms, math, data structures, or system design',
                    prompt: 'Explain the Raft consensus algorithm in simple terms, with step-by-step leader election logic and diagrams.',
                  },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(item.prompt, [], selectedModel)}
                    className="p-4 rounded-2xl bg-[#080911] hover:bg-[#0e101d] border border-white/[0.08] hover:border-purple-500/40 transition-all text-left group shadow-lg"
                  >
                    <div className="flex items-center gap-2.5 text-purple-400 mb-1.5">
                      <item.icon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      <span className="font-bold text-xs text-white group-hover:text-purple-300">
                        {item.title}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 leading-relaxed">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <MessageList
            messages={messages}
            streamingText={streamingText}
            isStreaming={isStreaming}
            onRegenerate={handleRegenerate}
            onOpenInWorkspace={onOpenInWorkspace}
          />
        )}

        <ChatComposer
          onSendMessage={handleSendMessage}
          onStopGeneration={handleStopGeneration}
          isStreaming={isStreaming}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          disabled={isLimitReached}
          onOpenPricing={onOpenPricing}
        />
      </div>
    </div>
  );
};
