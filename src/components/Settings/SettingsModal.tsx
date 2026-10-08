import React, { useState } from 'react';
import { X, User, Zap, Sliders, LogOut, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPricing: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onOpenPricing,
}) => {
  const { user, profile, isPremium, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'subscription' | 'ai'>('profile');

  if (!isOpen) return null;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-xl bg-[#121420] border border-white/15 rounded-3xl p-6 shadow-2xl text-white">
        {/* Top Buttons: Back to Chat and Close */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors text-xs font-semibold"
            title="Back to AI Chat"
          >
            <ArrowLeft className="w-4 h-4 text-purple-400" />
            <span>Back to Chat</span>
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            title="Close Settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <h2 className="text-xl font-bold mb-4">Account Settings</h2>

        {/* Tab buttons */}
        <div className="flex gap-2 border-b border-white/10 pb-3 mb-5">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'profile'
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            Profile
          </button>
          <button
            onClick={() => setActiveTab('subscription')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'subscription'
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            Subscription
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'ai'
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            AI Preferences
          </button>
        </div>

        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
              {profile?.photoURL ? (
                <img
                  src={profile.photoURL}
                  alt={profile.displayName}
                  className="w-14 h-14 rounded-2xl object-cover ring-2 ring-purple-500/40"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-purple-600/40 text-purple-200 flex items-center justify-center font-bold text-xl">
                  {profile?.displayName?.charAt(0) || 'U'}
                </div>
              )}
              <div>
                <h3 className="font-bold text-base text-white">{profile?.displayName || 'User'}</h3>
                <p className="text-xs text-gray-400">{profile?.email}</p>
                <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Role: {profile?.role || 'user'}
                </span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-gray-400 block mb-1">User Identification (UID)</label>
                <div className="p-2.5 rounded-xl bg-black/60 font-mono text-[11px] text-gray-300 border border-white/10 select-all">
                  {user?.uid || 'Not authenticated'}
                </div>
              </div>
              <div>
                <label className="text-gray-400 block mb-1">Account Created</label>
                <div className="p-2.5 rounded-xl bg-black/60 font-mono text-[11px] text-gray-300 border border-white/10">
                  {formatDate(profile?.createdAt)}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 flex justify-between items-center">
              <span className="text-xs text-gray-400">Google Authentication Active</span>
              <button
                onClick={() => {
                  logout();
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}

        {/* SUBSCRIPTION TAB */}
        {activeTab === 'subscription' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-900/30 to-rose-900/20 border border-purple-500/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-400">Current Status</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    isPremium
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-purple-500/20 text-purple-300'
                  }`}
                >
                  {isPremium ? 'PRO ACTIVE' : 'FREE PLAN'}
                </span>
              </div>
              <h3 className="text-lg font-black text-white capitalize">
                {profile?.planId || 'free'} Tier
              </h3>
              {profile?.subscriptionExpiry && (
                <p className="text-xs text-purple-300 mt-1">
                  Expiry Date: <strong>{formatDate(profile.subscriptionExpiry)}</strong>
                </p>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-xs text-gray-300 space-y-2">
              <h4 className="font-bold text-white">Tier Entitlements:</h4>
              <ul className="list-disc ml-4 space-y-1 text-gray-400">
                {isPremium ? (
                  <>
                    <li>Unlimited daily AI messages & queries</li>
                    <li>Full Multi-File Coding Workspace & AI Copilot</li>
                    <li>Priority response processing</li>
                    <li>Extended context memory</li>
                  </>
                ) : (
                  <>
                    <li>30 AI queries per day</li>
                    <li>Basic coding and writing features</li>
                    <li>Standard response speed</li>
                  </>
                )}
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/10 transition-all flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4 text-purple-400" />
                <span>← Back to Chat (वापस जाएं)</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  onOpenPricing();
                }}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-rose-600 hover:from-purple-500 hover:to-rose-500 text-white font-bold text-xs shadow-lg transition-all"
              >
                {isPremium ? 'Manage / Renew Plan' : 'Upgrade to REHAN AI Pro'}
              </button>
            </div>
          </div>
        )}

        {/* AI PREFERENCES TAB */}
        {activeTab === 'ai' && (
          <div className="space-y-4 text-xs">
            <div>
              <label className="text-gray-300 font-semibold block mb-1">
                Default AI Model
              </label>
              <select className="w-full bg-[#161828] border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none">
                <option value="gemini-3.8-flash">Gemini 3.8 Flash (Fastest)</option>
                <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (Deep Coding)</option>
              </select>
            </div>

            <div>
              <label className="text-gray-300 font-semibold block mb-1">
                Code Output Style
              </label>
              <select className="w-full bg-[#161828] border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none">
                <option>Detailed with explanations and comments</option>
                <option>Compact, code-only output</option>
                <option>Step-by-step walkthrough</option>
              </select>
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  alert('Preferences saved successfully!');
                  onClose();
                }}
                className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-500 font-bold text-white transition-colors"
              >
                Save Preferences
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
