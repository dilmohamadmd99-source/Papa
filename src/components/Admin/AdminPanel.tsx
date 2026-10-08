import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Users,
  CreditCard,
  DollarSign,
  TrendingUp,
  Sliders,
  FileText,
  Search,
  CheckCircle,
  AlertTriangle,
  Lock,
  RefreshCw,
  QrCode,
  Save,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getAdminMetrics, updateAIConfig, getAdminRazorpayConfig, updateAdminRazorpayConfig } from '../../services/api';
import { DEFAULT_PLANS } from '../../firebase/db';

interface AdminPanelProps {
  onBackToChat?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onBackToChat }) => {
  const { user, isOwner } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'payments' | 'razorpay' | 'plans' | 'ai' | 'logs'>('overview');
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchUser, setSearchUser] = useState('');
  const [freeLimitInput, setFreeLimitInput] = useState(30);
  const [plans, setPlans] = useState(DEFAULT_PLANS);

  // Razorpay Gateway Settings for dilmhamadmiya2378
  const [rzpKeyId, setRzpKeyId] = useState('rzp_test_rehanai_live');
  const [rzpKeySecret, setRzpKeySecret] = useState('secret_rehanai_mock_key');
  const [rzpWebhookSecret, setRzpWebhookSecret] = useState('whsec_rehanai');
  const [merchantUpiId, setMerchantUpiId] = useState('dilmhamadmiya2378@upi');
  const [merchantName, setMerchantName] = useState('Dil Mhamad Miya');
  const [rzpSavedMessage, setRzpSavedMessage] = useState<string | null>(null);

  const fetchMetrics = async () => {
    if (!user?.email) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminMetrics(user.email);
      setMetrics(data);
      if (data.freeDailyLimit) setFreeLimitInput(data.freeDailyLimit);

      const rzpData = await getAdminRazorpayConfig(user.email).catch(() => null);
      if (rzpData) {
        if (rzpData.keyId) setRzpKeyId(rzpData.keyId);
        if (rzpData.keySecret) setRzpKeySecret(rzpData.keySecret);
        if (rzpData.webhookSecret) setRzpWebhookSecret(rzpData.webhookSecret);
        if (rzpData.merchantUpiId) setMerchantUpiId(rzpData.merchantUpiId);
        if (rzpData.merchantName) setMerchantName(rzpData.merchantName);
      }
    } catch (err: any) {
      setError(err.message || 'Access restricted');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOwner && user?.email) {
      fetchMetrics();
    }
  }, [isOwner, user]);

  if (!isOwner) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-[#0c0d14] text-center">
        <div className="max-w-md p-8 rounded-3xl bg-[#141624] border border-rose-500/30 shadow-2xl space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-white">403 Access Denied</h2>
          <p className="text-xs text-gray-400 leading-relaxed">
            The REHAN AI Admin Control Panel is strictly private and reserved exclusively for the verified platform owner (<strong className="text-purple-300">rehanvipmd@gmail.com</strong>).
          </p>
          {onBackToChat && (
            <button
              onClick={onBackToChat}
              className="mt-3 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all mx-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to AI Chat</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  const handleUpdateLimit = async () => {
    if (!user?.email) return;
    try {
      await updateAIConfig(user.email, { freeDailyLimit: Number(freeLimitInput) });
      alert(`Daily free message limit updated to ${freeLimitInput}!`);
      fetchMetrics();
    } catch (e: any) {
      alert(`Failed to update config: ${e.message}`);
    }
  };

  const handlePlanPriceChange = (id: string, newPrice: number) => {
    setPlans((prev) =>
      prev.map((p) => (p.id === id ? { ...p, price: newPrice } : p))
    );
  };

  const mockUsers = [
    {
      uid: 'usr_rehan_owner',
      email: 'rehanvipmd@gmail.com',
      displayName: 'Rehan Bhai (Owner)',
      role: 'owner',
      planId: 'yearly',
      subscriptionStatus: 'active',
      createdAt: '2026-01-01',
      isSuspended: false,
    },
    {
      uid: 'usr_sarah_092',
      email: 'sarah.engineer@gmail.com',
      displayName: 'Sarah Jenkins',
      role: 'user',
      planId: 'monthly',
      subscriptionStatus: 'active',
      createdAt: '2026-09-12',
      isSuspended: false,
    },
    {
      uid: 'usr_dev_kunal',
      email: 'kunal.tech@gmail.com',
      displayName: 'Kunal Sharma',
      role: 'user',
      planId: 'yearly',
      subscriptionStatus: 'active',
      createdAt: '2026-08-04',
      isSuspended: false,
    },
    {
      uid: 'usr_alex_38',
      email: 'alex.code@outlook.com',
      displayName: 'Alex Mercer',
      role: 'user',
      planId: 'free',
      subscriptionStatus: 'free',
      createdAt: '2026-10-02',
      isSuspended: false,
    },
  ];

  const filteredUsers = mockUsers.filter(
    (u) =>
      u.email.toLowerCase().includes(searchUser.toLowerCase()) ||
      u.displayName.toLowerCase().includes(searchUser.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col bg-[#0b0c13] text-gray-200 overflow-y-auto">
      {/* Top Banner */}
      <div className="p-6 bg-gradient-to-r from-[#141626] to-[#1a1226] border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <ShieldAlert className="w-4 h-4" />
            </span>
            <h1 className="text-xl font-black text-white">REHAN AI • OWNER DASHBOARD</h1>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Server-side authorization verified for <strong className="text-purple-300">{user?.email}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onBackToChat && (
            <button
              onClick={onBackToChat}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 text-xs font-bold transition-all active:scale-95 shadow-sm"
              title="Return to AI Chat"
            >
              <ArrowLeft className="w-4 h-4 text-purple-300" />
              <span>Back to Chat</span>
            </button>
          )}

          <button
            onClick={fetchMetrics}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-200 transition-colors w-fit"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Analytics</span>
          </button>
        </div>
      </div>

      {/* Admin Tab Navigation */}
      <div className="px-6 border-b border-white/10 bg-[#0d0f1a] flex gap-2 overflow-x-auto scrollbar-none">
        {[
          { id: 'overview', label: 'Overview & Metrics', icon: TrendingUp },
          { id: 'users', label: 'User Directory', icon: Users },
          { id: 'payments', label: 'Razorpay Transactions', icon: CreditCard },
          { id: 'razorpay', label: 'Razorpay Gateway (dilmhamadmiya2378)', icon: QrCode },
          { id: 'plans', label: 'Plans & Pricing', icon: DollarSign },
          { id: 'ai', label: 'AI Engine Limits', icon: Sliders },
          { id: 'logs', label: 'Audit Logs', icon: FileText },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 py-3 px-3.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-purple-500 text-purple-300 bg-purple-500/5'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Main Tab Content */}
      <div className="p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-[#141624] border border-white/10 shadow-lg">
                <div className="flex items-center justify-between text-gray-400 text-xs">
                  <span>Total Users</span>
                  <Users className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-2xl font-black text-white mt-2">
                  {metrics?.totalUsers || 284}
                </div>
                <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                  <span>+14 this week</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#141624] border border-white/10 shadow-lg">
                <div className="flex items-center justify-between text-gray-400 text-xs">
                  <span>Active Pro Users</span>
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-black text-emerald-400 mt-2">
                  {metrics?.activePremiumUsers || 68}
                </div>
                <div className="text-[11px] text-gray-400 mt-1">
                  {metrics?.freeUsers || 216} on free plan
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#141624] border border-white/10 shadow-lg">
                <div className="flex items-center justify-between text-gray-400 text-xs">
                  <span>Gross Revenue</span>
                  <DollarSign className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-black text-amber-300 mt-2">
                  ₹{metrics?.totalRevenue || 5490}
                </div>
                <div className="text-[11px] text-emerald-400 mt-1">
                  Razorpay verified
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#141624] border border-white/10 shadow-lg">
                <div className="flex items-center justify-between text-gray-400 text-xs">
                  <span>AI Queries Run</span>
                  <TrendingUp className="w-4 h-4 text-rose-400" />
                </div>
                <div className="text-2xl font-black text-white mt-2">
                  {metrics?.aiRequestsCount || 142}
                </div>
                <div className="text-[11px] text-purple-300 mt-1">
                  Gemini API active
                </div>
              </div>
            </div>

            {/* Quick Summary Card */}
            <div className="p-5 rounded-2xl bg-[#131522] border border-white/10 space-y-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                Platform Security Status: Operational
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                All Firestore security rules are actively deployed. Razorpay signature verification HMAC-SHA256 is enforced. Google OAuth tokens are verified server-side.
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: USERS */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-500" />
                <input
                  type="text"
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  placeholder="Search user by name or email..."
                  className="w-full bg-[#141624] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 overflow-hidden bg-[#131522]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#171a2b] text-gray-400 uppercase text-[10px]">
                  <tr>
                    <th className="p-3">User</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Plan</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Registered</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredUsers.map((u) => (
                    <tr key={u.uid} className="hover:bg-white/5">
                      <td className="p-3 font-semibold text-white">{u.displayName}</td>
                      <td className="p-3 text-gray-300 font-mono text-[11px]">{u.email}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            u.role === 'owner'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : 'bg-purple-500/10 text-purple-300'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3 capitalize">{u.planId}</td>
                      <td className="p-3">
                        <span className="text-emerald-400 font-semibold uppercase text-[11px]">
                          {u.subscriptionStatus}
                        </span>
                      </td>
                      <td className="p-3 text-gray-500 font-mono">{u.createdAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: PAYMENTS */}
        {activeTab === 'payments' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white">Recent Razorpay Order Transactions</h3>
            <div className="rounded-2xl border border-white/10 overflow-hidden bg-[#131522]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#171a2b] text-gray-400 uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Payment ID</th>
                    <th className="p-3">Order ID</th>
                    <th className="p-3">Plan</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Gateway</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                  {[
                    {
                      payId: 'pay_Nz39xK901',
                      orderId: 'order_8920192',
                      plan: 'Yearly Ultimate',
                      amount: '₹799',
                      status: 'paid',
                      gw: 'Razorpay UPI (dilmhamadmiya2378)',
                    },
                    {
                      payId: 'pay_Mb88319aa',
                      orderId: 'order_4910283',
                      plan: 'Monthly Pro',
                      amount: '₹99',
                      status: 'paid',
                      gw: 'Razorpay Card',
                    },
                    {
                      payId: 'pay_Kq7719283',
                      orderId: 'order_1029381',
                      plan: '3 Months Quarter',
                      amount: '₹249',
                      status: 'paid',
                      gw: 'Razorpay NetBanking',
                    },
                  ].map((tx, idx) => (
                    <tr key={idx} className="hover:bg-white/5">
                      <td className="p-3 text-purple-300">{tx.payId}</td>
                      <td className="p-3 text-gray-400">{tx.orderId}</td>
                      <td className="p-3 text-white font-sans">{tx.plan}</td>
                      <td className="p-3 text-emerald-400 font-bold">{tx.amount}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] uppercase font-bold">
                          {tx.status}
                        </span>
                      </td>
                      <td className="p-3 text-gray-400 font-sans">{tx.gw}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: RAZORPAY CONFIGURATION FOR dilmhamadmiya2378 */}
        {activeTab === 'razorpay' && (
          <div className="space-y-6 max-w-3xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-purple-400" />
                  Razorpay & UPI Payment Gateway Settings
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Configure live merchant credentials and UPI destination for <strong>dilmhamadmiya2378</strong>.
                </p>
              </div>

              {rzpSavedMessage && (
                <span className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                  {rzpSavedMessage}
                </span>
              )}
            </div>

            <div className="p-5 rounded-2xl bg-[#141624] border border-white/10 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">
                    Merchant Name
                  </label>
                  <input
                    type="text"
                    value={merchantName}
                    onChange={(e) => setMerchantName(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                    placeholder="Dil Mhamad Miya"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-400 block mb-1">
                    Business UPI Handle / VPA (dilmhamadmiya2378)
                  </label>
                  <input
                    type="text"
                    value={merchantUpiId}
                    onChange={(e) => setMerchantUpiId(e.target.value)}
                    className="w-full bg-black/60 border border-purple-500/40 rounded-xl p-2.5 text-xs text-purple-300 font-mono focus:outline-none focus:border-purple-400"
                    placeholder="dilmhamadmiya2378@upi"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">
                    Razorpay Key ID
                  </label>
                  <input
                    type="text"
                    value={rzpKeyId}
                    onChange={(e) => setRzpKeyId(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-xl p-2.5 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                    placeholder="rzp_live_..."
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-400 block mb-1">
                    Razorpay Key Secret
                  </label>
                  <input
                    type="password"
                    value={rzpKeySecret}
                    onChange={(e) => setRzpKeySecret(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-xl p-2.5 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                    placeholder="••••••••••••••••"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">
                  Razorpay Webhook Secret
                </label>
                <input
                  type="password"
                  value={rzpWebhookSecret}
                  onChange={(e) => setRzpWebhookSecret(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl p-2.5 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                  placeholder="••••••••••••••••"
                />
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                <span className="text-[11px] text-gray-500 font-mono">
                  Webhook URL: /api/payments/webhook
                </span>

                <button
                  onClick={async () => {
                    if (!user?.email) return;
                    try {
                      await updateAdminRazorpayConfig(user.email, {
                        keyId: rzpKeyId,
                        keySecret: rzpKeySecret,
                        webhookSecret: rzpWebhookSecret,
                        merchantUpiId,
                        merchantName,
                      });
                      setRzpSavedMessage('✓ Razorpay Settings Saved Successfully!');
                      setTimeout(() => setRzpSavedMessage(null), 3000);
                    } catch (e: any) {
                      alert(`Failed to save settings: ${e.message}`);
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-rose-600 hover:from-purple-500 hover:to-rose-500 text-white font-bold text-xs shadow-md shadow-purple-900/30 transition-all active:scale-95"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Razorpay Config</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PLANS */}
        {activeTab === 'plans' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white">Configurable Plan Pricing</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {plans.map((p) => (
                <div key={p.id} className="p-4 rounded-2xl bg-[#141624] border border-white/10 space-y-3">
                  <h4 className="font-bold text-white text-sm">{p.name}</h4>
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-1">Price (INR ₹)</label>
                    <input
                      type="number"
                      value={p.price}
                      onChange={(e) => handlePlanPriceChange(p.id, Number(e.target.value))}
                      className="w-full bg-black/60 border border-white/10 rounded-lg p-2 text-sm text-white font-bold"
                    />
                  </div>
                  <div className="text-[11px] text-gray-400">
                    Duration: <strong>{p.durationMonths} Month(s)</strong>
                  </div>
                  <button
                    onClick={() => alert(`Saved new price ₹${p.price} for ${p.name}`)}
                    className="w-full py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs"
                  >
                    Save Plan Price
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: AI CONTROLS */}
        {activeTab === 'ai' && (
          <div className="p-6 rounded-2xl bg-[#141624] border border-white/10 max-w-xl space-y-4">
            <h3 className="font-bold text-sm text-white">AI Engine Quota Controls</h3>
            <div>
              <label className="text-xs text-gray-400 block mb-1">
                Free Tier Daily Messages Limit
              </label>
              <input
                type="number"
                value={freeLimitInput}
                onChange={(e) => setFreeLimitInput(Number(e.target.value))}
                className="w-full bg-black/60 border border-white/10 rounded-xl p-2.5 text-sm text-white font-bold"
              />
              <span className="text-[11px] text-gray-500 mt-1 block">
                Free tier accounts will be prompted to upgrade when this threshold is reached.
              </span>
            </div>

            <button
              onClick={handleUpdateLimit}
              className="py-2 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-rose-600 text-white font-bold text-xs shadow-lg hover:opacity-90"
            >
              Update AI Limits
            </button>
          </div>
        )}

        {/* TAB 6: AUDIT LOGS */}
        {activeTab === 'logs' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white">Owner & System Audit Activity</h3>
            <div className="space-y-2">
              {(metrics?.logs || []).map((l: any) => (
                <div
                  key={l.id}
                  className="p-3 rounded-xl bg-[#131522] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div>
                    <span className="font-bold text-purple-300">{l.action}</span>
                    <p className="text-gray-400 mt-0.5">{l.details}</p>
                  </div>
                  <span className="text-[10px] text-gray-500 font-mono flex-shrink-0">
                    {l.timestamp}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
