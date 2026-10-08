import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Check,
  Zap,
  Sparkles,
  ShieldCheck,
  Loader2,
  ArrowLeft,
  CreditCard,
  QrCode,
  Smartphone,
  Copy,
  AlertTriangle,
  Clock,
  ExternalLink,
  Maximize2,
  Phone,
  CheckCircle2,
  Download,
  Share2,
  ChevronRight,
  Upload,
  Image as ImageIcon,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import { useAuth } from '../../context/AuthContext';
import { auth } from '../../firebase/config';
import { createPaymentOrder, verifyPayment, submitUpiPayment, getUserSubscriptionStatus } from '../../services/api';
import { DEFAULT_PLANS } from '../../firebase/db';
import type { Plan } from '../../types';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Replicates the user profile photo (young man in yellow jacket) from PhonePe screenshot
const DilMohamadAvatar: React.FC<{ size?: string; className?: string }> = ({
  size = 'w-13 h-13',
  className = '',
}) => (
  <div
    className={`relative ${size} rounded-full overflow-hidden ring-2 ring-purple-400/60 shadow-lg flex-shrink-0 bg-gradient-to-b from-amber-200 to-amber-400 select-none ${className}`}
  >
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <defs>
        <radialGradient id="avatarGlow" cx="50%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="70%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="50" fill="url(#avatarGlow)" />

      {/* Yellow Jacket / Hoodie Body */}
      <path d="M8 98 C12 72 26 63 50 63 C74 63 88 72 92 98 Z" fill="#eab308" />
      {/* Jacket Collar & Zipper Details */}
      <path d="M34 64 L50 78 L66 64 L59 60 L50 68 L41 60 Z" fill="#ca8a04" />
      <path d="M50 78 L50 98" stroke="#a16207" strokeWidth="2.5" strokeLinecap="round" />
      {/* Inner T-shirt */}
      <path d="M42 62 C42 69 58 69 58 62 Z" fill="#0f172a" />

      {/* Neck */}
      <path d="M43 49 L43 62 C43 66 57 66 57 62 L57 49 Z" fill="#fed7aa" />

      {/* Face */}
      <ellipse cx="50" cy="42" rx="17" ry="19.5" fill="#fde68a" />

      {/* Ears */}
      <ellipse cx="32.5" cy="43" rx="3.5" ry="5.5" fill="#fcd34d" />
      <ellipse cx="67.5" cy="43" rx="3.5" ry="5.5" fill="#fcd34d" />

      {/* Eyebrows & Eyes */}
      <path d="M39 34.5 Q44 32.5 46 34.5" stroke="#1f2937" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <path d="M54 34.5 Q56 32.5 61 34.5" stroke="#1f2937" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <ellipse cx="43" cy="40" rx="2.2" ry="2.4" fill="#18181b" />
      <ellipse cx="57" cy="40" rx="2.2" ry="2.4" fill="#18181b" />
      <circle cx="43.8" cy="39.2" r="0.8" fill="#ffffff" />
      <circle cx="57.8" cy="39.2" r="0.8" fill="#ffffff" />

      {/* Nose */}
      <path d="M50 39 L49 46.5 L52.5 46.5" stroke="#b45309" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />

      {/* Gentle Smile */}
      <path d="M44.5 51.5 Q50 55.5 55.5 51.5" stroke="#92400e" strokeWidth="2" strokeLinecap="round" fill="none" />

      {/* Dark Styled Hair */}
      <path d="M29 37 C27 26 34 16 50 16 C66 16 73 26 71 37 C67 28 62 24 50 24 C38 24 33 28 29 37 Z" fill="#09090b" />
      <path d="M32 34 C32 23 40 17 50 17 C60 17 68 23 68 34 C65 25 58 20 50 20 C42 20 35 25 32 34 Z" fill="#18181b" />
      <path d="M38 20 Q46 14 54 20 Q61 15 64 22" stroke="#09090b" strokeWidth="3.2" strokeLinecap="round" fill="none" />
    </svg>
  </div>
);

export const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose }) => {
  const { user, profile, isPremium, loginWithGoogle, refreshProfile, setProfileManually } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<Plan>(DEFAULT_PLANS[3]); // Default to yearly best value
  const [loading, setLoading] = useState(false);
  const [submittingUtr, setSubmittingUtr] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedSecondaryUpi, setCopiedSecondaryUpi] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [activeUpiTab, setActiveUpiTab] = useState<'phonepe' | 'secondary'>('phonepe');
  const [qrMode, setQrMode] = useState<'static' | 'dynamic'>('static');
  const [showQrZoom, setShowQrZoom] = useState(false);
  const [utrInput, setUtrInput] = useState('');
  const [utrError, setUtrError] = useState<string | null>(null);
  const [customQrImage, setCustomQrImage] = useState<string | null>(() => {
    try {
      return localStorage.getItem('rehanai_original_qr_image') || null;
    } catch {
      return null;
    }
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const zoomFileInputRef = useRef<HTMLInputElement>(null);

  // Load original QR screenshot from backend on open
  useEffect(() => {
    if (!isOpen) return;
    fetch('/api/payments/qr-image')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.qrImage) {
          setCustomQrImage(data.qrImage);
          try {
            localStorage.setItem('rehanai_original_qr_image', data.qrImage);
          } catch {}
        }
      })
      .catch(() => {});
  }, [isOpen]);

  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        setCustomQrImage(base64);
        try {
          localStorage.setItem('rehanai_original_qr_image', base64);
        } catch {}
        fetch('/api/payments/qr-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ qrImage: base64 }),
        }).catch(console.error);
      }
    };
    reader.readAsDataURL(file);
  };
  const [submittedUtrInfo, setSubmittedUtrInfo] = useState<{
    utr: string;
    planName: string;
    amount: number;
    submittedAt: string;
  } | null>(null);

  // In-app interactive payment dialog
  const [checkoutDialog, setCheckoutDialog] = useState<{
    isOpen: boolean;
    plan: Plan;
    orderData: any;
    selectedMethod: 'upi' | 'razorpay';
  } | null>(null);

  // Check if user has active subscription or pending submissions from backend
  useEffect(() => {
    if (!isOpen) return;
    const activeUid = user?.uid || auth.currentUser?.uid;
    if (activeUid) {
      getUserSubscriptionStatus(activeUid).then((data) => {
        if (data.subscription && data.subscription.status === 'active') {
          if (profile) {
            setProfileManually({
              ...profile,
              subscriptionStatus: 'active',
              planId: data.subscription.planId,
              subscriptionStart: data.subscription.subscriptionStart,
              subscriptionExpiry: data.subscription.subscriptionExpiry,
            });
          }
        }
        if (data.pendingUpi && data.pendingUpi.length > 0) {
          const latest = data.pendingUpi[0];
          if (latest.status === 'pending') {
            setSubmittedUtrInfo({
              utr: latest.utrNumber,
              planName: latest.planName,
              amount: latest.amount,
              submittedAt: latest.submittedAt,
            });
          }
        }
      }).catch(() => {});
    }
  }, [isOpen, user, profile, setProfileManually]);

  if (!isOpen) return null;

  const handleCheckout = async (plan: Plan) => {
    let activeUser = user || auth.currentUser;
    if (!activeUser) {
      try {
        await loginWithGoogle();
        activeUser = auth.currentUser;
      } catch {
        // Continue to checkout dialog
      }
    }

    const userIdToUse = activeUser?.uid || 'user_' + Date.now();
    const userEmailToUse = activeUser?.email || 'rehanvipmd@gmail.com';

    setLoading(true);
    setUtrError(null);
    try {
      // 1. Create order on backend
      const orderData = await createPaymentOrder(
        plan.id,
        plan.name,
        plan.price,
        userIdToUse,
        userEmailToUse
      );

      // If live keys exist and order was created with Razorpay API:
      if (orderData.isRealRazorpay) {
        const loadRazorpay = (): Promise<boolean> => {
          return new Promise((resolve) => {
            if ((window as any).Razorpay) {
              resolve(true);
              return;
            }
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
          });
        };

        const isLoaded = await loadRazorpay();

        if (isLoaded && (window as any).Razorpay) {
          try {
            const options = {
              key: orderData.keyId,
              amount: orderData.amount,
              currency: orderData.currency || 'INR',
              name: 'REHAN AI',
              description: `${plan.name} Subscription`,
              order_id: orderData.orderId,
              prefill: {
                name: user?.displayName || auth.currentUser?.displayName || 'Developer',
                email: user?.email || auth.currentUser?.email || '',
              },
              theme: {
                color: '#8b5cf6',
              },
              handler: async (response: any) => {
                if (!response.razorpay_signature || !response.razorpay_payment_id) {
                  alert('Payment verification failed: Missing official signature.');
                  return;
                }
                await handlePaymentVerification(
                  response.razorpay_order_id || orderData.orderId,
                  response.razorpay_payment_id,
                  response.razorpay_signature,
                  plan
                );
              },
              modal: {
                ondismiss: () => {
                  setLoading(false);
                },
              },
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.on('payment.failed', () => {
              setCheckoutDialog({
                isOpen: true,
                plan,
                orderData,
                selectedMethod: 'upi',
              });
            });
            rzp.open();
            return;
          } catch (e) {
            console.warn('Razorpay SDK modal error, switching to direct UPI:', e);
          }
        }
      }

      // Default to Direct UPI & QR Gateway:
      setCheckoutDialog({
        isOpen: true,
        plan,
        orderData,
        selectedMethod: 'upi',
      });
    } catch (err: any) {
      alert(`Payment order error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentVerification = async (
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
    plan: Plan
  ) => {
    try {
      const activeUid = user?.uid || auth.currentUser?.uid || 'user_' + Date.now();
      const verifyRes = await verifyPayment({
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        planId: plan.id,
        userId: activeUid,
        amount: plan.price,
        durationMonths: plan.durationMonths,
      });

      if (verifyRes.success) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });

        if (profile) {
          setProfileManually({
            ...profile,
            subscriptionStatus: 'active',
            planId: plan.id,
            subscriptionStart: verifyRes.subscriptionStart,
            subscriptionExpiry: verifyRes.subscriptionExpiry,
          });
        }
        await refreshProfile();
        setCheckoutDialog(null);
        setSuccessMessage(`Congratulations! Your ${plan.name} is now ACTIVE!`);
        setTimeout(() => {
          setSuccessMessage(null);
          onClose();
        }, 3000);
      }
    } catch (err: any) {
      alert(`Payment verification failed: ${err.message}`);
    }
  };

  // Submit UPI UTR for Owner / Admin verification
  const handleSubmitUpiUtr = async (planOverride?: Plan) => {
    const targetPlan = planOverride || checkoutDialog?.plan || selectedPlan;
    if (!targetPlan) return;
    const cleanUtr = utrInput.trim();

    if (!cleanUtr) {
      setUtrError('कृपया 12-अंकीय UPI UTR / Transaction Reference Number दर्ज करें।');
      return;
    }

    if (!/^[a-zA-Z0-9]{10,24}$/.test(cleanUtr)) {
      setUtrError('अमान्य UTR नंबर। PhonePe / Google Pay / Paytm ऐप में दिए गए 12-अंकीय UTR नंबर को दर्ज करें।');
      return;
    }

    setSubmittingUtr(true);
    setUtrError(null);

    try {
      const activeUid = user?.uid || auth.currentUser?.uid || 'user_' + Date.now();
      const activeEmail = user?.email || auth.currentUser?.email || 'rehanvipmd@gmail.com';

      const res = await submitUpiPayment({
        utrNumber: cleanUtr,
        planId: targetPlan.id,
        planName: targetPlan.name,
        amount: targetPlan.price,
        durationMonths: targetPlan.durationMonths,
        userId: activeUid,
        userEmail: activeEmail,
      });

      if (res.success) {
        setSubmittedUtrInfo({
          utr: cleanUtr,
          planName: targetPlan.name,
          amount: targetPlan.price,
          submittedAt: new Date().toISOString(),
        });
        setUtrInput('');
      }
    } catch (err: any) {
      setUtrError(err.message || 'UTR सबमिट करने में विफल। कृपया पुनः प्रयास करें।');
    } finally {
      setSubmittingUtr(false);
    }
  };

  // Download PhonePe QR Code as PNG image
  const handleDownloadQr = () => {
    try {
      const svg = document.getElementById('phonepe-qr-svg');
      if (!svg) {
        setShowQrZoom(true);
        return;
      }
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        canvas.width = 440;
        canvas.height = 440;
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, 440, 440);
          ctx.drawImage(img, 20, 20, 400, 400);
          const pngFile = canvas.toDataURL('image/png');
          const downloadLink = document.createElement('a');
          downloadLink.download = 'PhonePe_QR_Dil_Mohamad.png';
          downloadLink.href = pngFile;
          downloadLink.click();
        }
      };
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    } catch (e) {
      console.error('Download QR failed', e);
      setShowQrZoom(true);
    }
  };

  // Share PhonePe QR Code or copy link
  const handleShareQr = async () => {
    const upiLink =
      qrMode === 'static'
        ? `upi://pay?pa=6206800093@ybl&pn=Dil%20Mohamad&cu=INR`
        : `upi://pay?pa=6206800093@ybl&pn=Dil%20Mohamad&am=${selectedPlan.price}&cu=INR&tn=REHAN%20AI%20${encodeURIComponent(
            selectedPlan.name
          )}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'PhonePe QR - Dil Mohamad',
          text: `Pay ₹${selectedPlan.price} to Dil Mohamad using PhonePe UPI ID: 6206800093@ybl`,
          url: upiLink,
        });
        return;
      } catch {}
    }
    navigator.clipboard.writeText(upiLink);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in"
    >
      <div className="relative w-full max-w-4xl bg-[#04050a] border border-white/[0.09] rounded-3xl p-5 sm:p-8 shadow-2xl text-white my-6 sm:my-8">
        {/* Prominent Top Navigation Bar with Clear Back Button */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/[0.08] bg-[#04050a] sticky top-0 z-20">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-extrabold transition-all active:scale-95 shadow-lg shadow-purple-900/50 cursor-pointer border border-purple-400/40"
            title="Back to AI Chat"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-white animate-pulse" />
            <span>← Back to AI Chat (वापस जाएं)</span>
          </button>

          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-gray-200 hover:text-white transition-colors text-xs font-bold cursor-pointer border border-white/10"
            title="Close modal"
          >
            <span>Close (बंद करें)</span>
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Header */}
        <div className="text-center max-w-xl mx-auto space-y-2 mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>UPGRADE YOUR SUPERPOWERS</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Unlock Full Potential with <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-rose-400">REHAN AI Pro</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-400">
            Enjoy unlimited queries, advanced multi-file coding workspace, and maximum context memory.
          </p>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-center font-bold text-sm animate-pulse">
            ✓ {successMessage}
          </div>
        )}

        {/* Plan Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {DEFAULT_PLANS.map((plan) => {
            const isSelected = selectedPlan.id === plan.id;
            const isYearly = plan.id === 'yearly';

            return (
              <div
                key={plan.id}
                onClick={() => setSelectedPlan(plan)}
                className={`relative rounded-2xl p-5 border cursor-pointer transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-gradient-to-b from-purple-950/60 to-[#0c0d18] border-purple-500 shadow-xl shadow-purple-900/30 scale-102 ring-2 ring-purple-500/50'
                    : 'bg-[#070812] border-white/[0.08] hover:border-white/20'
                }`}
              >
                {isYearly && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-rose-500 to-amber-500 text-black text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full shadow-lg">
                    BEST VALUE (33% OFF)
                  </span>
                )}

                <div>
                  <h3 className="font-bold text-sm text-gray-200">{plan.name}</h3>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-2xl sm:text-3xl font-black text-white">
                      ₹{plan.price}
                    </span>
                    <span className="text-xs text-gray-400">/{plan.durationMonths} mo</span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-2 min-h-8">{plan.tagline}</p>

                  <div className="my-4 border-t border-white/10" />

                  <ul className="space-y-2 text-[11px] text-gray-300">
                    {plan.features.slice(0, 4).map((f, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-purple-400 flex-shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCheckout(plan);
                  }}
                  disabled={loading || (isPremium && profile?.planId === plan.id)}
                  className={`w-full mt-4 py-2 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                    isPremium && profile?.planId === plan.id
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30 cursor-default'
                      : isSelected
                      ? 'bg-gradient-to-r from-purple-600 to-rose-600 hover:from-purple-500 hover:to-rose-500 text-white shadow-lg shadow-purple-900/40 active:scale-95'
                      : 'bg-white/10 hover:bg-white/15 text-white'
                  }`}
                >
                  {loading && selectedPlan.id === plan.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isPremium && profile?.planId === plan.id ? (
                    'Current Plan'
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5 fill-current" />
                      <span>⚡ Pay ₹{plan.price} (PhonePe QR)</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* ========================================================================= */}
        {/* AUTHENTIC PHONEPE APP QR CODE CARD (As provided in IMG_20261008_234301.jpg) */}
        {/* ========================================================================= */}
        <div className="mb-8 rounded-3xl border-2 border-purple-500/40 overflow-hidden shadow-2xl bg-[#090514] relative">
          {/* Official PhonePe Screen Header: Avatar + Dil Mohamad + Receiving money status + Manage */}
          <div className="bg-gradient-to-r from-[#5f259f] via-[#6d27b9] to-[#4e1887] px-5 py-3.5 text-white flex items-center justify-between gap-3 shadow-lg border-b border-purple-400/30">
            <div className="flex items-center gap-3">
              {/* Profile Photo: Young man in yellow jacket from screenshot */}
              <DilMohamadAvatar size="w-12 h-12" />
              <div>
                <h3 className="text-base sm:text-lg font-black tracking-wide text-white leading-tight">
                  Dil Mohamad
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-emerald-300 font-semibold mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400/20" />
                  <span>Receiving money on PhonePe</span>
                </div>
              </div>
            </div>

            {/* Manage Link (PhonePe purple) */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowQrZoom(true)}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-purple-200 hover:text-white text-xs sm:text-sm font-bold transition-colors cursor-pointer"
              >
                Manage
              </button>
            </div>
          </div>

          {/* Standee Body */}
          <div className="p-5 sm:p-7 flex flex-col lg:flex-row items-center gap-6 sm:gap-8">
            {/* The Real PhonePe White QR Card (Exact screenshot replication) */}
            <div className="w-full lg:w-auto flex flex-col items-center flex-shrink-0">
              <div className="relative p-5 bg-white rounded-3xl shadow-2xl border-4 border-purple-600/30 flex flex-col items-center w-full max-w-[310px]">
                {/* Top of Card: PhonePe Black Squircle on left, Bank of Baroda on right */}
                <div className="w-full flex items-center justify-between gap-2 pb-2 border-b border-gray-100">
                  {/* PhonePe "पे" Icon */}
                  <div className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center font-black text-sm shadow-md select-none">
                    पे
                  </div>

                  {/* Bank of Baroda Logo & chevron */}
                  <div className="flex items-center gap-1.5 bg-orange-50 px-2 py-1 rounded-xl border border-orange-200/70 shadow-xs">
                    <div className="w-5 h-5 rounded-md bg-[#f26522] text-white flex items-center justify-center font-black text-[10px] select-none shadow-xs">
                      B
                    </div>
                    <span className="text-xs font-black text-gray-800 tracking-tight">Bank of Baroda</span>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                  </div>
                </div>

                {/* The Exact Scannable QR Code */}
                <div className="relative my-2.5 p-1 bg-white rounded-xl min-h-[200px] flex items-center justify-center">
                  {customQrImage ? (
                    <div className="flex flex-col items-center">
                      <img
                        src={customQrImage}
                        alt="Original PhonePe QR Code"
                        className="max-h-[230px] max-w-full object-contain rounded-lg select-none"
                      />
                      <span className="mt-1 text-[9px] text-emerald-600 font-extrabold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        <span>Original QR Image (No Edit)</span>
                      </span>
                    </div>
                  ) : (
                    <QRCodeSVG
                      id="phonepe-qr-svg"
                      value={
                        activeUpiTab === 'phonepe'
                          ? 'upi://pay?pa=6206800093@ybl&pn=Dil%20Mohamad&cu=INR'
                          : 'upi://pay?pa=dilmhamadmiya2378@upi&pn=Dil%20Mohamad&cu=INR'
                      }
                      size={196}
                      level="H"
                      includeMargin={false}
                      imageSettings={{
                        src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="%235f259f"/><text x="50" y="65" font-size="44" font-weight="900" text-anchor="middle" fill="white" font-family="sans-serif">पे</text></svg>',
                        height: 38,
                        width: 38,
                        excavate: true,
                      }}
                    />
                  )}
                </div>

                {/* UPI ID directly below QR */}
                <div className="w-full flex items-center justify-center gap-1.5 py-1 text-xs font-bold text-gray-800 border-t border-gray-100">
                  <span className="font-mono text-gray-900 select-all font-black text-xs">
                    {activeUpiTab === 'phonepe' ? '6206800093@ybl' : 'dilmhamadmiya2378@upi'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        activeUpiTab === 'phonepe' ? '6206800093@ybl' : 'dilmhamadmiya2378@upi'
                      );
                      setCopiedUpi(true);
                      setTimeout(() => setCopiedUpi(false), 2000);
                    }}
                    className="p-1 rounded-md hover:bg-gray-100 text-gray-500 hover:text-purple-700 transition-colors cursor-pointer"
                    title="Copy UPI ID"
                  >
                    {copiedUpi ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* Carousel Indicator Dots (● ○ ○) */}
                <div className="mt-1 flex items-center justify-center gap-1.5 py-0.5">
                  <button
                    type="button"
                    onClick={() => setActiveUpiTab('phonepe')}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      activeUpiTab === 'phonepe' ? 'w-5 bg-[#5f259f]' : 'w-2 bg-gray-300 hover:bg-gray-400'
                    }`}
                    title="Primary PhonePe QR (@ybl)"
                  />
                  <button
                    type="button"
                    onClick={() => setActiveUpiTab('secondary')}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      activeUpiTab === 'secondary' ? 'w-5 bg-[#5f259f]' : 'w-2 bg-gray-300 hover:bg-gray-400'
                    }`}
                    title="Secondary Merchant QR (@upi)"
                  />
                  <span className="w-2 h-2 rounded-full bg-gray-300" />
                </div>

                {/* Card Bottom: Scan & Pay using any UPI app + UPI Logos */}
                <div className="mt-2 pt-2 border-t border-gray-100 text-center w-full">
                  <div className="text-[10px] text-gray-500 font-semibold">
                    Scan and pay using any UPI app
                  </div>
                  <div className="mt-1.5 flex items-center justify-center gap-1.5 sm:gap-2">
                    <span className="text-[9px] font-black text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-200">
                      BHIM
                    </span>
                    <span className="text-[9px] font-bold text-gray-800 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-200">
                      <span className="text-blue-500 font-black">G</span>Pay
                    </span>
                    <span className="text-[9px] font-black text-[#00b9f5] bg-cyan-50 px-1.5 py-0.5 rounded border border-cyan-200">
                      Paytm
                    </span>
                    <span className="text-[9px] font-black text-[#5f259f] bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                      PhonePe
                    </span>
                    <span className="text-[9px] font-black text-gray-900 bg-gray-100 px-1.5 py-0.5 rounded">
                      UPI
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons Below Card (DOWNLOAD QR, SHARE QR, COPY UPI ID) */}
              <div className="mt-3 flex items-center justify-between gap-1.5 w-full max-w-[310px]">
                <button
                  type="button"
                  onClick={handleDownloadQr}
                  className="flex-1 py-1.5 px-2 rounded-xl bg-purple-900/40 hover:bg-purple-800/60 text-purple-200 hover:text-white text-[11px] font-extrabold flex items-center justify-center gap-1 border border-purple-500/30 transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
                <button
                  type="button"
                  onClick={handleShareQr}
                  className="flex-1 py-1.5 px-2 rounded-xl bg-purple-900/40 hover:bg-purple-800/60 text-purple-200 hover:text-white text-[11px] font-extrabold flex items-center justify-center gap-1 border border-purple-500/30 transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText('6206800093@ybl');
                    setCopiedUpi(true);
                    setTimeout(() => setCopiedUpi(false), 2000);
                  }}
                  className="flex-1 py-1.5 px-2 rounded-xl bg-purple-900/40 hover:bg-purple-800/60 text-purple-200 hover:text-white text-[11px] font-extrabold flex items-center justify-center gap-1 border border-purple-500/30 transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedUpi ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* Fullscreen Zoom button */}
              <button
                type="button"
                onClick={() => setShowQrZoom(true)}
                className="mt-2 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/70 hover:bg-purple-900/80 text-purple-300 hover:text-white text-[11px] font-bold transition-colors cursor-pointer w-full max-w-[310px] border border-purple-500/30"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>बड़ा ओरिजिनल QR कोड देखें (Fullscreen Zoom)</span>
              </button>

              {/* Upload Original QR Screenshot Button */}
              <div className="mt-2.5 w-full max-w-[310px]">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-md shadow-purple-900/40 transition-all cursor-pointer active:scale-95 border border-purple-400/50"
                  title="Upload original unedited QR screenshot (IMG_20261008_234301.jpg)"
                >
                  <Upload className="w-4 h-4" />
                  <span>{customQrImage ? 'ओरिजिनल QR फोटो बदलें (IMG)' : 'ओरिजिनल QR फोटो अपलोड करें (बिना एडिट)'}</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleQrUpload}
                  className="hidden"
                />
                {customQrImage && (
                  <div className="flex items-center justify-between mt-1.5 text-[10px] px-1">
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      <span>ओरिजिनल फोटो एक्टिव है</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomQrImage(null);
                        try {
                          localStorage.removeItem('rehanai_original_qr_image');
                        } catch {}
                        fetch('/api/payments/qr-image', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ qrImage: '' }),
                        }).catch(() => {});
                      }}
                      className="text-rose-400 hover:text-rose-300 underline cursor-pointer"
                    >
                      डिफ़ॉल्ट QR पर रीसेट करें
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Handles, App Launchers, and 12-Digit UTR Submission Form */}
            <div className="flex-1 w-full space-y-4">
              {/* Merchant Handles Card */}
              <div className="p-4 rounded-2xl bg-black/50 border border-white/10 space-y-2.5 text-xs">
                {/* PhonePe Registered Mobile */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 flex items-center gap-1.5 text-xs">
                    <Phone className="w-3.5 h-3.5 text-purple-400" />
                    <span>PhonePe Mobile:</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white text-sm select-all">
                      +91 6206800093
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText('6206800093');
                        setCopiedPhone(true);
                        setTimeout(() => setCopiedPhone(false), 2000);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 text-xs font-bold cursor-pointer"
                    >
                      {copiedPhone ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>

                {/* Primary PhonePe UPI ID */}
                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <span className="text-gray-400 text-xs">PhonePe UPI ID:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-purple-300 text-sm select-all">
                      6206800093@ybl
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText('6206800093@ybl');
                        setCopiedUpi(true);
                        setTimeout(() => setCopiedUpi(false), 2000);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 text-xs font-bold cursor-pointer"
                    >
                      {copiedUpi ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>

                {/* Secondary Merchant UPI ID */}
                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <span className="text-gray-400 text-xs">Secondary UPI ID:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-gray-300 text-xs select-all">
                      dilmhamadmiya2378@upi
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText('dilmhamadmiya2378@upi');
                        setCopiedSecondaryUpi(true);
                        setTimeout(() => setCopiedSecondaryUpi(false), 2000);
                      }}
                      className="px-2 py-0.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300 text-xs font-semibold cursor-pointer"
                    >
                      {copiedSecondaryUpi ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>

              {/* 1-Tap Mobile Payment Launchers */}
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={`phonepe://pay?pa=6206800093@ybl&pn=Dil%20Mohamad&am=${selectedPlan.price}&cu=INR`}
                  className="py-2.5 px-3 rounded-xl bg-[#5f259f] hover:bg-[#6f2db8] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer text-center"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Pay in PhonePe App</span>
                </a>
                <a
                  href={`upi://pay?pa=6206800093@ybl&pn=Dil%20Mohamad&am=${selectedPlan.price}&cu=INR`}
                  className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:opacity-95 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer text-center"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open Any UPI App</span>
                </a>
              </div>

              {/* Direct UTR Verification Form */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-purple-950/40 to-black/80 border border-purple-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <h4 className="text-xs sm:text-sm font-extrabold text-white">
                      Instant Pro Activation (तुरंत एक्टिवेट करें)
                    </h4>
                  </div>
                  <span className="text-[11px] text-purple-300 font-bold">
                    Plan: {selectedPlan.name} (₹{selectedPlan.price})
                  </span>
                </div>

                <p className="text-[11px] text-gray-300 leading-relaxed">
                  QR कोड स्कैन करके <strong>₹{selectedPlan.price}</strong> का भुगतान करें, फिर PhonePe / Google Pay / Paytm से मिला <strong>12-अंकीय UTR नंबर</strong> यहाँ दर्ज करें:
                </p>

                {submittedUtrInfo ? (
                  <div className="p-3 bg-emerald-950/60 rounded-xl border border-emerald-500/40 text-xs space-y-1">
                    <div className="text-emerald-300 font-bold flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>UTR सफलतापूर्वक सबमिट हो गया!</span>
                    </div>
                    <div className="text-gray-300 font-mono text-[11px]">
                      UTR: <span className="text-emerald-400 font-bold">{submittedUtrInfo.utr}</span> ({submittedUtrInfo.planName})
                    </div>
                    <div className="text-[10px] text-gray-400">
                      Dil Mohamad बैंक में कन्फर्म करते ही आपकी Pro मेंबरशिप चालू हो जाएगी।
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={utrInput}
                        onChange={(e) => setUtrInput(e.target.value.replace(/\s+/g, ''))}
                        placeholder="उदा. 428919018274 (12-Digit UTR)"
                        maxLength={24}
                        className="flex-1 px-3.5 py-2.5 rounded-xl bg-black/70 border border-purple-400/40 text-white placeholder-gray-500 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleSubmitUpiUtr(selectedPlan)}
                        disabled={submittingUtr || !utrInput.trim()}
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-lg shadow-emerald-900/30 flex-shrink-0"
                      >
                        {submittingUtr ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Zap className="w-3.5 h-3.5 fill-current" />
                            <span>Activate Pro</span>
                          </>
                        )}
                      </button>
                    </div>

                    {utrError && (
                      <div className="text-[11px] text-rose-400 font-medium flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{utrError}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Back Button & Security Footer */}
        <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-400 gap-3">
          <button
            onClick={onClose}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 font-bold text-xs transition-all active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-purple-300" />
            <span>← Back to AI Chat (वापस जाएं)</span>
          </button>

          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Secured with Razorpay 256-bit SSL encrypted checkout</span>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <span>UPI • Google Pay • Cards • NetBanking</span>
            <span>Instant Activation</span>
          </div>
        </div>
        {/* Interactive Razorpay / UPI Payment Simulator & Gateway Dialog */}
        {checkoutDialog?.isOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
            <div className="relative w-full max-w-lg bg-[#05060d] border border-purple-500/40 rounded-3xl p-6 shadow-2xl text-white">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#5f259f] text-white flex items-center justify-center font-black text-base shadow-md ring-1 ring-purple-300/40">
                    पे
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                      <span>PhonePe & UPI Secure Checkout</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    </h3>
                    <p className="text-[11px] text-purple-300">Merchant: {checkoutDialog.orderData?.merchantName || 'Dil Mohamad'} (+91 6206800093)</p>
                  </div>
                </div>

                <button
                  onClick={() => setCheckoutDialog(null)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer"
                  title="Close payment window"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Amount & Plan Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/60 to-[#030408] border border-purple-500/30 mb-5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-semibold">Paying For</span>
                  <div className="text-base font-extrabold text-white">{checkoutDialog.plan.name}</div>
                  <div className="text-[11px] text-purple-300 font-mono mt-0.5">Order ID: {checkoutDialog.orderData?.orderId}</div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-gray-400 uppercase font-semibold">Amount</span>
                  <div className="text-2xl font-black text-emerald-400">₹{checkoutDialog.plan.price}</div>
                </div>
              </div>

              {/* Payment Methods Tabs */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setCheckoutDialog({ ...checkoutDialog, selectedMethod: 'upi' })}
                  className={`p-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    checkoutDialog.selectedMethod === 'upi'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Direct UPI & QR Code</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCheckoutDialog({ ...checkoutDialog, selectedMethod: 'razorpay' })}
                  className={`p-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    checkoutDialog.selectedMethod === 'razorpay'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Razorpay Gateway</span>
                </button>
              </div>

              {/* Method 1: Direct UPI & UTR Verification */}
              {checkoutDialog.selectedMethod === 'upi' && (
                <div className="space-y-4">
                  {submittedUtrInfo ? (
                    <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 space-y-3">
                      <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                        <Clock className="w-5 h-5 text-emerald-400 animate-spin" />
                        <span>सत्यापन प्रक्रियाधीन (Verification in Progress)</span>
                      </div>
                      <p className="text-xs text-gray-300 leading-relaxed">
                        आपके द्वारा सबमिट किया गया UTR नंबर प्राप्त हो चुका है। Rehan Bhai / Dil Mohamad बैंक खाते में भुगतान की पुष्टि करने के बाद आपकी Pro सदस्यता सक्रिय कर देंगे।
                      </p>
                      <div className="p-2.5 bg-black/60 rounded-xl border border-white/10 font-mono text-xs space-y-1">
                        <div className="text-gray-400 text-[10px]">Submitted UTR:</div>
                        <div className="text-emerald-400 font-bold">{submittedUtrInfo.utr}</div>
                        <div className="text-gray-400 text-[10px] mt-1">Plan: {submittedUtrInfo.planName} (₹{submittedUtrInfo.amount})</div>
                      </div>
                      <div className="text-[11px] text-amber-300 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>सत्यापन में आमतौर पर 10-30 मिनट लगते हैं।</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Authentic PhonePe UPI QR & VPA Payment Card */}
                      <div className="rounded-2xl border border-purple-500/30 overflow-hidden shadow-2xl bg-gradient-to-b from-[#180c29] to-[#05060b]">
                        {/* PhonePe Header Branding Strip */}
                        <div className="bg-gradient-to-r from-[#5f259f] to-[#491680] px-4 py-3 flex items-center justify-between text-white shadow-md">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center font-black text-[#5f259f] text-lg shadow-md ring-2 ring-purple-300/40 select-none">
                              पे
                            </div>
                            <div>
                              <div className="text-sm font-black tracking-wide flex items-center gap-2">
                                <span>PhonePe</span>
                                <span className="text-[10px] px-1.5 py-0.5 bg-white/20 rounded font-semibold uppercase tracking-wider">
                                  Accepted Here
                                </span>
                              </div>
                              <div className="text-[10px] text-purple-200">
                                PhonePe • GPay • Paytm • BHIM • Cred
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-[9px] uppercase tracking-wider text-purple-200 block">
                              Payee Name
                            </span>
                            <span className="text-xs font-black text-white flex items-center gap-1 justify-end">
                              <span>Dil Mohamad</span>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                            </span>
                            <span className="text-[10px] font-mono text-purple-200 block">
                              +91 6206800093
                            </span>
                          </div>
                        </div>

                        {/* QR Code and Payment Handles */}
                        <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-4">
                          {/* QR Code Presentation Box */}
                          <div className="p-3 bg-white rounded-2xl shadow-2xl flex flex-col items-center flex-shrink-0 border-2 border-purple-200">
                            <div className="relative">
                              <QRCodeSVG
                                value={
                                  qrMode === 'static'
                                    ? `upi://pay?pa=${
                                        activeUpiTab === 'phonepe' ? '6206800093@ybl' : 'dilmhamadmiya2378@upi'
                                      }&pn=Dil%20Mohamad&cu=INR`
                                    : `upi://pay?pa=${
                                        activeUpiTab === 'phonepe' ? '6206800093@ybl' : 'dilmhamadmiya2378@upi'
                                      }&pn=Dil%20Mohamad&am=${checkoutDialog.plan.price}&cu=INR&tn=REHAN%20AI%20${encodeURIComponent(
                                        checkoutDialog.plan.name
                                      )}`
                                }
                                size={154}
                                level="H"
                                includeMargin={false}
                                imageSettings={{
                                  src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="%235f259f"/><text x="50" y="65" font-size="44" font-weight="900" text-anchor="middle" fill="white" font-family="sans-serif">पे</text></svg>',
                                  height: 32,
                                  width: 32,
                                  excavate: true,
                                }}
                              />
                            </div>

                            <div className="mt-2 text-center">
                              <div className="text-[11px] font-black text-gray-900">
                                ₹{checkoutDialog.plan.price} ({checkoutDialog.plan.name})
                              </div>
                              <button
                                type="button"
                                onClick={() => setShowQrZoom(true)}
                                className="mt-1 flex items-center justify-center gap-1 text-[10px] font-bold text-[#5f259f] hover:text-purple-900 cursor-pointer transition-colors"
                              >
                                <Maximize2 className="w-3 h-3" />
                                <span>बड़ा QR कोड देखें (Zoom)</span>
                              </button>
                            </div>
                          </div>

                          {/* UPI ID Switcher & Quick Copy */}
                          <div className="flex-1 space-y-3 w-full">
                            {/* UPI Mode Selector */}
                            <div className="flex rounded-xl bg-black/40 p-1 border border-white/10 gap-1">
                              <button
                                type="button"
                                onClick={() => setActiveUpiTab('phonepe')}
                                className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                  activeUpiTab === 'phonepe'
                                    ? 'bg-[#5f259f] text-white shadow'
                                    : 'text-gray-400 hover:text-white'
                                }`}
                              >
                                <span>PhonePe QR (@ybl)</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setActiveUpiTab('secondary')}
                                className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                  activeUpiTab === 'secondary'
                                    ? 'bg-purple-600 text-white shadow'
                                    : 'text-gray-400 hover:text-white'
                                }`}
                              >
                                <span>Merchant UPI (@upi)</span>
                              </button>
                            </div>

                            {/* Info & Copy Box */}
                            <div className="p-3 rounded-xl bg-black/60 border border-white/10 space-y-2 text-xs">
                              {/* PhonePe Mobile */}
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] text-gray-400 flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-purple-400" />
                                  <span>PhonePe No:</span>
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono font-bold text-white select-all">
                                    +91 6206800093
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText('6206800093');
                                      setCopiedPhone(true);
                                      setTimeout(() => setCopiedPhone(false), 2000);
                                    }}
                                    className="px-2 py-0.5 rounded bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 text-[10px] font-bold cursor-pointer"
                                  >
                                    {copiedPhone ? 'Copied!' : 'Copy'}
                                  </button>
                                </div>
                              </div>

                              {/* Primary UPI Handle */}
                              <div className="flex items-center justify-between pt-1.5 border-t border-white/5">
                                <span className="text-[11px] text-gray-400">PhonePe UPI ID:</span>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono font-bold text-purple-300 select-all">
                                    6206800093@ybl
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText('6206800093@ybl');
                                      setCopiedUpi(true);
                                      setTimeout(() => setCopiedUpi(false), 2000);
                                    }}
                                    className="px-2 py-0.5 rounded bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 text-[10px] font-bold cursor-pointer"
                                  >
                                    {copiedUpi ? 'Copied!' : 'Copy'}
                                  </button>
                                </div>
                              </div>

                              {/* Alternate UPI Handle */}
                              <div className="flex items-center justify-between pt-1.5 border-t border-white/5">
                                <span className="text-[11px] text-gray-400">Merchant VPA:</span>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono text-gray-300 text-[11px] select-all">
                                    dilmhamadmiya2378@upi
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText('dilmhamadmiya2378@upi');
                                      setCopiedSecondaryUpi(true);
                                      setTimeout(() => setCopiedSecondaryUpi(false), 2000);
                                    }}
                                    className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-gray-200 text-[10px] font-semibold cursor-pointer"
                                  >
                                    {copiedSecondaryUpi ? 'Copied!' : 'Copy'}
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Direct App Launch Links */}
                            <div className="space-y-1">
                              <span className="text-[10px] text-gray-400 block font-semibold">
                                डायरेक्ट UPI ऐप में खोलें (Direct 1-Tap Pay):
                              </span>
                              <div className="grid grid-cols-2 gap-2">
                                <a
                                  href={`phonepe://pay?pa=6206800093@ybl&pn=Dil+Mohamad&am=${checkoutDialog.plan.price}&cu=INR`}
                                  className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-[#5f259f] hover:bg-[#6e2bb8] text-white text-[11px] font-bold shadow-md transition-all active:scale-95 text-center"
                                >
                                  <Smartphone className="w-3.5 h-3.5" />
                                  <span>PhonePe App</span>
                                </a>
                                <a
                                  href={`upi://pay?pa=6206800093@ybl&pn=Dil+Mohamad&am=${checkoutDialog.plan.price}&cu=INR`}
                                  className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white text-[11px] font-bold shadow-md transition-all active:scale-95 text-center"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                  <span>Other UPI App</span>
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Supported Apps Strip */}
                        <div className="px-4 py-2 bg-black/40 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-400">
                          <span>PhonePe, Google Pay, Paytm, BHIM या किसी भी UPI ऐप से स्कैन करें</span>
                          <span className="text-emerald-400 font-bold">100% Verified Merchant</span>
                        </div>
                      </div>

                      {/* UTR Input Section */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-300 block">
                          12-अंकीय UPI UTR / Transaction Reference ID दर्ज करें:
                        </label>
                        <input
                          type="text"
                          value={utrInput}
                          onChange={(e) => {
                            setUtrInput(e.target.value.replace(/[^a-zA-Z0-9]/g, ''));
                            setUtrError(null);
                          }}
                          placeholder="उदा. 428910293847 (12 Digits)"
                          maxLength={22}
                          className="w-full bg-black/60 border border-purple-500/40 rounded-xl p-3 text-sm font-mono text-purple-200 placeholder-gray-500 focus:outline-none focus:border-purple-400"
                        />
                        {utrError && (
                          <div className="text-[11px] text-rose-400 flex items-center gap-1 mt-1 font-semibold">
                            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>{utrError}</span>
                          </div>
                        )}
                        <p className="text-[10px] text-gray-400">
                          पेमेंट के बाद UPI ऐप की हिस्ट्री में आपको 12 अंकों का <strong>UTR / UPI Ref No</strong> मिलेगा।
                        </p>
                      </div>

                      {/* Anti-Fraud Disclaimer */}
                      <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/30 text-[11px] text-rose-300 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                        <span>
                          <strong>फेक पेमेंट रोकथाम (Anti-Fraud Policy):</strong> बिना वास्तविक भुगतान के फर्जी UTR दर्ज करने पर आपका अकाउंट तुरंत ब्लॉक कर दिया जाएगा। बैंक खाते में राशि की पुष्टि होने पर ही योजना सक्रिय की जाती है।
                        </span>
                      </div>

                      {/* Submit UTR Button */}
                      <button
                        type="button"
                        onClick={() => handleSubmitUpiUtr()}
                        disabled={submittingUtr || !utrInput.trim()}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-rose-600 hover:from-purple-500 hover:to-rose-500 disabled:opacity-50 text-white font-black text-sm shadow-xl shadow-purple-900/40 transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {submittingUtr ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>सबमिट हो रहा है...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            <span>सत्यापन के लिए UTR भेजें (Submit UTR)</span>
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Method 2: Razorpay Gateway */}
              {checkoutDialog.selectedMethod === 'razorpay' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/20 text-xs text-purple-200">
                    <p className="font-semibold text-white mb-1">Razorpay Official Gateway Checkout</p>
                    <p className="text-[11px] text-gray-300">
                      Debit Cards, Credit Cards, NetBanking, Wallets और आधिकारिक Razorpay गेटवे से सुरक्षित भुगतान करें। केवल वास्तविक पुष्टि के बाद ही प्रीमियम सक्रिय होगा।
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setCheckoutDialog(null);
                      handleCheckout(checkoutDialog.plan);
                    }}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm shadow-xl shadow-blue-900/40 transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Launch Razorpay Gateway (₹{checkoutDialog.plan.price})</span>
                  </button>
                </div>
              )}

              {/* Back to Plans Button */}
              <button
                type="button"
                onClick={() => setCheckoutDialog(null)}
                className="w-full mt-3 py-2 text-xs text-gray-400 hover:text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>← Back to Plans (रद्द करें / वापस जाएं)</span>
              </button>
            </div>
          </div>
        )}

        {/* Fullscreen High-Resolution QR Zoom Modal */}
        {showQrZoom && (() => {
          const zoomPlan = checkoutDialog?.plan || selectedPlan;
          return (
            <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
              <div className="relative w-full max-w-sm bg-[#0e071c] border-2 border-purple-500/50 rounded-3xl p-5 sm:p-6 shadow-2xl text-center space-y-3.5">
                <button
                  onClick={() => setShowQrZoom(false)}
                  className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer z-10"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Profile Header (From user screenshot) */}
                <div className="flex items-center gap-3 text-left pb-2 border-b border-white/10 pr-8">
                  <DilMohamadAvatar size="w-12 h-12" />
                  <div>
                    <h4 className="text-base font-black text-white leading-tight">Dil Mohamad</h4>
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5 fill-emerald-400/20" />
                      <span>Receiving money on PhonePe</span>
                    </div>
                  </div>
                </div>

                {/* The White PhonePe Card */}
                <div className="p-4 bg-white rounded-3xl shadow-2xl mx-auto border-4 border-purple-300 w-full text-center flex flex-col items-center">
                  {/* Card Top: Black "पे" + Bank of Baroda */}
                  <div className="w-full flex items-center justify-between pb-2 border-b border-gray-100">
                    <div className="w-7 h-7 rounded-lg bg-black text-white flex items-center justify-center font-black text-xs select-none">
                      पे
                    </div>
                    <div className="flex items-center gap-1 bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-200">
                      <div className="w-4 h-4 rounded bg-[#f26522] text-white flex items-center justify-center font-black text-[9px]">
                        B
                      </div>
                      <span className="text-[11px] font-black text-gray-800">Bank of Baroda</span>
                      <ChevronRight className="w-3 h-3 text-gray-400" />
                    </div>
                  </div>

                  {/* QR Code / Original Image */}
                  <div className="my-2 p-1 bg-white rounded-2xl flex items-center justify-center">
                    {customQrImage ? (
                      <div className="flex flex-col items-center">
                        <img
                          src={customQrImage}
                          alt="Original PhonePe QR Code"
                          className="max-h-[320px] max-w-full object-contain rounded-xl select-none"
                        />
                        <span className="mt-1 text-[9px] text-emerald-600 font-extrabold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          <span>Original PhonePe Screenshot (No edits)</span>
                        </span>
                      </div>
                    ) : (
                      <QRCodeSVG
                        id="phonepe-zoom-qr-svg"
                        value="upi://pay?pa=6206800093@ybl&pn=Dil%20Mohamad&cu=INR"
                        size={210}
                        level="H"
                        includeMargin={false}
                        imageSettings={{
                          src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="%235f259f"/><text x="50" y="65" font-size="44" font-weight="900" text-anchor="middle" fill="white" font-family="sans-serif">पे</text></svg>',
                          height: 40,
                          width: 40,
                          excavate: true,
                        }}
                      />
                    )}
                  </div>

                  {/* UPI ID */}
                  <div className="text-xs font-mono font-black text-gray-900 border-t border-gray-100 pt-1 w-full flex items-center justify-center gap-1.5">
                    <span>6206800093@ybl</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText('6206800093@ybl');
                        setCopiedUpi(true);
                        setTimeout(() => setCopiedUpi(false), 2000);
                      }}
                      className="text-gray-500 hover:text-purple-700"
                    >
                      {copiedUpi ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>

                  {/* Carousel Dots */}
                  <div className="flex items-center justify-center gap-1.5 mt-1">
                    <span className="w-4 h-1.5 rounded-full bg-[#5f259f]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                  </div>

                  {/* UPI strip */}
                  <div className="text-[10px] text-gray-500 font-medium mt-1.5 pt-1.5 border-t border-gray-100">
                    Scan and pay using any UPI app
                  </div>
                </div>

                {/* 3 PhonePe Actions: Download, Share, Copy */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadQr}
                    className="flex-1 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleShareQr}
                    className="flex-1 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText('6206800093@ybl');
                      setCopiedUpi(true);
                      setTimeout(() => setCopiedUpi(false), 2000);
                    }}
                    className="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedUpi ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                {/* Upload Original Screenshot */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => zoomFileInputRef.current?.click()}
                    className="w-full py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all active:scale-95 border border-purple-400/40"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{customQrImage ? 'ओरिजिनल फोटो बदलें (IMG)' : 'ओरिजिनल फोटो अपलोड करें (IMG_20261008_234301.jpg)'}</span>
                  </button>
                  <input
                    ref={zoomFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleQrUpload}
                    className="hidden"
                  />
                </div>

                {/* 1-Tap PhonePe Launcher */}
                <div className="flex gap-2 pt-1">
                  <a
                    href={`phonepe://pay?pa=6206800093@ybl&pn=Dil%20Mohamad&am=${zoomPlan.price}&cu=INR`}
                    className="flex-1 py-2.5 rounded-xl bg-[#5f259f] hover:bg-[#6f2db8] text-white text-xs font-bold transition-colors shadow-md flex items-center justify-center gap-1.5"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Open PhonePe App</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => setShowQrZoom(false)}
                    className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold cursor-pointer transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};
