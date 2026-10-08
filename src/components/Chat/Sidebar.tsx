import React, { useState } from 'react';
import {
  Plus,
  Search,
  MessageSquare,
  Edit2,
  Trash2,
  Check,
  X,
  Zap,
  ArrowLeft,
} from 'lucide-react';
import type { Conversation } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onDeleteConversation: (id: string) => void;
  onOpenPricing: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onRenameConversation,
  onDeleteConversation,
  onOpenPricing,
  isOpenMobile,
  onCloseMobile,
}) => {
  const { isPremium, dailyUsage } = useAuth();
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const filtered = conversations.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  const startRename = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const saveRename = (id: string, e?: React.MouseEvent | React.FormEvent) => {
    e?.stopPropagation();
    e?.preventDefault?.();
    if (editTitle.trim()) {
      onRenameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Delete this chat permanently?')) {
      onDeleteConversation(id);
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-30 md:hidden"
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 w-72 bg-[#05060b] border-r border-white/[0.07] flex flex-col z-35 transition-transform duration-300 md:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top: New Chat Button & Mobile Back Button */}
        <div className="p-3.5 space-y-2.5 border-b border-white/5">
          <div className="flex items-center justify-between md:hidden pb-1">
            <button
              onClick={onCloseMobile}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-200 text-xs font-bold transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-purple-400" />
              <span>Back to Chat</span>
            </button>
            <button
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => {
              onNewChat();
              onCloseMobile();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-900/30 transition-all active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
          </button>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search chat history..."
              className="w-full bg-[#080911] border border-white/[0.08] rounded-xl pl-8 pr-3 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-white/10">
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-xs text-gray-500">
              {search ? 'No matching conversations' : 'No previous chats yet.'}
            </div>
          ) : (
            filtered.map((conv) => {
              const isActive = conv.id === activeConversationId;
              const isEditing = conv.id === editingId;

              return (
                <div
                  key={conv.id}
                  onClick={() => {
                    onSelectConversation(conv.id);
                    onCloseMobile();
                  }}
                  className={`group relative flex items-center justify-between p-2.5 rounded-xl text-xs cursor-pointer transition-all ${
                    isActive
                      ? 'bg-[#0d0e1b] text-purple-200 border border-purple-500/40 shadow-sm'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.04] border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden flex-1">
                    <MessageSquare
                      className={`w-3.5 h-3.5 flex-shrink-0 ${
                        isActive ? 'text-purple-400' : 'text-gray-500'
                      }`}
                    />

                    {isEditing ? (
                      <form
                        onSubmit={(e) => saveRename(conv.id, e)}
                        className="flex items-center gap-1 flex-1 mr-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="text"
                          autoFocus
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="bg-black/80 text-white px-2 py-0.5 rounded text-xs w-full border border-purple-500/60 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={(e) => saveRename(conv.id, e)}
                          className="p-1 hover:text-emerald-400 text-gray-400"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingId(null);
                          }}
                          className="p-1 hover:text-rose-400 text-gray-400"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </form>
                    ) : (
                      <span className="truncate font-medium">{conv.title}</span>
                    )}
                  </div>

                  {/* Actions on hover */}
                  {!isEditing && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                      <button
                        onClick={(e) => startRename(conv, e)}
                        className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white"
                        title="Rename"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(conv.id, e)}
                        className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-rose-400"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer: Plan status card */}
        <div className="p-3 border-t border-white/[0.08] bg-[#04050a]">
          {!isPremium ? (
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-900/30 to-indigo-900/20 border border-purple-500/30 text-xs">
              <div className="flex items-center justify-between font-semibold text-purple-200">
                <span className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  Free Plan
                </span>
                <span className="text-[11px] text-gray-400">
                  {dailyUsage.messageCount}/30 msgs
                </span>
              </div>
              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden my-2">
                <div
                  className="bg-purple-500 h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min((dailyUsage.messageCount / 30) * 100, 100)}%`,
                  }}
                />
              </div>
              <button
                onClick={onOpenPricing}
                className="w-full mt-1 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-[11px] transition-colors"
              >
                Upgrade to Unlimited
              </button>
            </div>
          ) : (
            <div className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500/10 to-purple-500/10 border border-purple-500/30 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span className="font-bold text-white">REHAN AI Pro</span>
              </div>
              <span className="text-[10px] text-purple-300 font-medium">Unlimited</span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
