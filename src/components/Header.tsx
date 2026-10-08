import React, { useState } from 'react';
import {
  Sparkles,
  Code2,
  MessageSquare,
  ShieldAlert,
  Zap,
  User as UserIcon,
  LogOut,
  Settings,
  CreditCard,
  ChevronDown,
  Menu,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  activeView: 'chat' | 'workspace' | 'admin';
  setActiveView: (view: 'chat' | 'workspace' | 'admin') => void;
  onOpenPricing: () => void;
  onOpenSettings: () => void;
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  setActiveView,
  onOpenPricing,
  onOpenSettings,
  onToggleSidebar,
}) => {
  const { user, profile, isOwner, isPremium, dailyUsage, loginWithGoogle, logout } = useAuth();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <header className="h-16 bg-[#040509]/95 backdrop-blur-xl border-b border-white/[0.08] px-4 flex items-center justify-between sticky top-0 z-40 select-none">
      {/* Brand & Mobile Toggle */}
      <div className="flex items-center gap-3">
        {activeView !== 'chat' && (
          <button
            onClick={() => setActiveView('chat')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/35 text-purple-200 border border-purple-500/30 text-xs font-bold transition-all active:scale-95 shadow-sm"
            title="Back to AI Chat"
          >
            <ArrowLeft className="w-4 h-4 text-purple-300" />
            <span>Back to Chat</span>
          </button>
        )}

        {onToggleSidebar && activeView === 'chat' && (
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors md:hidden"
            title="Toggle Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div
          onClick={() => setActiveView('chat')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 via-purple-600 to-rose-500 flex items-center justify-center shadow-lg shadow-purple-600/25 group-hover:shadow-purple-600/40 transition-all">
            <Sparkles className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-wider bg-gradient-to-r from-white via-gray-100 to-gray-400 bg-clip-text text-transparent">
                REHAN AI
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                PRO
              </span>
            </div>
            <p className="text-[10px] text-gray-400 hidden sm:block tracking-tight">
              AI Assistant for Coding & Productivity
            </p>
          </div>
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div className="hidden md:flex items-center gap-1 bg-[#07080f] p-1 rounded-xl border border-white/[0.08]">
        <button
          onClick={() => setActiveView('chat')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeView === 'chat'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          AI Chat
        </button>

        <button
          onClick={() => setActiveView('workspace')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeView === 'workspace'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          Coding Workspace
        </button>

        {isOwner && (
          <button
            onClick={() => setActiveView('admin')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeView === 'admin'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'text-rose-400 hover:text-rose-300 hover:bg-rose-500/10'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Owner Admin
          </button>
        )}
      </div>

      {/* Right User Actions & Plan Status */}
      <div className="flex items-center gap-2.5">
        {/* Subscription Badge */}
        {isPremium ? (
          <div
            onClick={onOpenPricing}
            className="cursor-pointer hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-purple-500/15 to-rose-500/10 border border-purple-500/40 text-purple-200 text-xs font-medium hover:border-purple-400 transition-all shadow-sm"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400 animate-pulse" />
            <span>
              <strong className="text-white">PREMIUM ACTIVE</strong>
              {profile?.subscriptionExpiry && (
                <span className="text-[11px] text-gray-300 ml-1.5">
                  Exp: {formatDate(profile.subscriptionExpiry)}
                </span>
              )}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="hidden lg:inline-block text-xs text-gray-400">
              Free: <strong className="text-purple-300">{dailyUsage.messageCount}/30</strong> msgs
            </span>
            <button
              onClick={onOpenPricing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-rose-600 hover:from-purple-500 hover:to-rose-500 text-white text-xs font-semibold transition-all shadow-md shadow-purple-900/30 active:scale-95"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Upgrade</span>
            </button>
          </div>
        )}

        {/* User Account / Auth */}
        {user ? (
          <div className="relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all"
            >
              {profile?.photoURL ? (
                <img
                  src={profile.photoURL}
                  alt={profile.displayName}
                  className="w-8 h-8 rounded-lg object-cover ring-2 ring-purple-500/30"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-purple-600/30 text-purple-300 flex items-center justify-center font-bold text-sm">
                  {profile?.displayName?.charAt(0) || 'U'}
                </div>
              )}
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 hidden sm:block" />
            </button>

            {/* Dropdown Menu */}
            {userDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setUserDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-64 bg-[#080912] border border-white/10 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-2.5 border-b border-white/[0.08]">
                    <p className="text-sm font-semibold text-white truncate">
                      {profile?.displayName || 'User'}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{profile?.email}</p>
                    <div className="mt-2 flex items-center gap-1.5">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {isPremium ? 'PRO MEMBER' : 'FREE TIER'}
                      </span>
                      {isOwner && (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          OWNER
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onOpenSettings();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                    >
                      <Settings className="w-4 h-4 text-gray-400" />
                      Account Settings
                    </button>

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onOpenPricing();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                    >
                      <CreditCard className="w-4 h-4 text-purple-400" />
                      Plans & Subscriptions
                    </button>

                    {isOwner && (
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          setActiveView('admin');
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors"
                      >
                        <ShieldAlert className="w-4 h-4 text-rose-400" />
                        Owner Dashboard
                      </button>
                    )}
                  </div>

                  <div className="pt-1 border-t border-white/10">
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <button
            onClick={loginWithGoogle}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold border border-white/10 transition-all active:scale-95"
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>Sign in with Google</span>
          </button>
        )}
      </div>
    </header>
  );
};
