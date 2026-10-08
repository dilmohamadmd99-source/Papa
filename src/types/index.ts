export type UserRole = 'user' | 'owner';
export type SubscriptionStatus = 'free' | 'active' | 'cancelled' | 'expired';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  planId: string;
  subscriptionStatus: SubscriptionStatus;
  subscriptionStart?: string;
  subscriptionExpiry?: string;
  createdAt: string;
  updatedAt: string;
  isSuspended?: boolean;
}

export interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  textContent?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  userId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments?: Attachment[];
  model?: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  model: string;
  lastMessagePreview?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  durationMonths: number;
  features: string[];
  isActive: boolean;
  isPopular?: boolean;
  tagline?: string;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  planName: string;
  status: SubscriptionStatus;
  startDate: string;
  expiryDate: string;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  amount: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRecord {
  id: string;
  userId: string;
  userEmail?: string;
  razorpayPaymentId: string;
  razorpayOrderId: string;
  planId: string;
  planName: string;
  amount: number;
  currency: string;
  status: 'created' | 'paid' | 'failed' | 'refunded';
  createdAt: string;
  verifiedAt?: string;
}

export interface UpiPaymentSubmission {
  id: string;
  utrNumber: string;
  userId: string;
  userEmail: string;
  planId: string;
  planName: string;
  amount: number;
  durationMonths: number;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectReason?: string;
}

export interface DailyUsage {
  userId: string;
  date: string;
  messageCount: number;
  lastUpdated: string;
}

export interface AdminLog {
  id: string;
  adminEmail: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface WorkspaceFile {
  id: string;
  name: string;
  path: string;
  content: string;
  language: string;
}

export interface AdminMetrics {
  totalUsers: number;
  activePremiumUsers: number;
  freeUsers: number;
  expiredSubscriptions: number;
  todayPayments: number;
  totalPayments: number;
  totalRevenue: number;
  aiRequestsCount: number;
  recentTransactions: PaymentRecord[];
}
