import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, OperationType, handleFirestoreError } from './config';
import type { UserProfile, Conversation, Message, Subscription, PaymentRecord, DailyUsage, Plan } from '../types';

export const OWNER_EMAIL = 'rehanvipmd@gmail.com';

export const DEFAULT_PLANS: Plan[] = [
  {
    id: 'monthly',
    name: 'Monthly Pro',
    price: 99,
    currency: 'INR',
    durationMonths: 1,
    isActive: true,
    tagline: 'Ideal for quick project sprints and regular coding help.',
    features: [
      'Unlimited AI Messages',
      'Advanced Coding & Debugging AI',
      'Multi-File Coding Workspace',
      'File & Image Analysis',
      'Deep Architecture Explanations',
      'Priority Response Speeds',
    ],
  },
  {
    id: '3months',
    name: '3 Months Quarter',
    price: 249,
    currency: 'INR',
    durationMonths: 3,
    isActive: true,
    tagline: 'Best for students, bootcampers, and active developers.',
    features: [
      'Everything in Monthly',
      'Longer Conversation Memory',
      'Priority Code Refactoring',
      'Multi-language Code Conversion',
      'API & Schema Designer Access',
      'Discounted Quarterly Rate',
    ],
  },
  {
    id: '6months',
    name: '6 Months Half-Year',
    price: 449,
    currency: 'INR',
    durationMonths: 6,
    isActive: true,
    tagline: 'Great savings for consistent developers and teams.',
    features: [
      'Everything in 3 Months',
      'Max Context Window for large codebases',
      'Full-Stack Project Generation',
      'Continuous Workspace Sync',
      'Dedicated Priority Queue',
      'Enhanced Productivity Tools',
    ],
  },
  {
    id: 'yearly',
    name: 'Yearly Ultimate',
    price: 799,
    currency: 'INR',
    durationMonths: 12,
    isActive: true,
    isPopular: true,
    tagline: 'Best Value! Save over 33% on a full year of AI power.',
    features: [
      'All Premium Features Included',
      'Highest Priority AI Processing',
      'Full Multi-File Project Workspace',
      'Unlimited Attachments & Code Uploads',
      'VIP Early Access to New Model Aliases',
      'Best Value Guarantee (₹66/month equivalent)',
    ],
  },
];

// USER PROFILE MANAGEMENT
export async function syncUserProfile(user: {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}): Promise<UserProfile> {
  const userRef = doc(db, 'users', user.uid);
  try {
    const snap = await getDoc(userRef);
    const email = user.email || '';
    const isOwner = email.toLowerCase() === OWNER_EMAIL.toLowerCase();
    const now = new Date().toISOString();

    if (snap.exists()) {
      const data = snap.data() as UserProfile;
      // Check if subscription has expired
      let subStatus = data.subscriptionStatus;
      if (data.subscriptionExpiry && new Date(data.subscriptionExpiry).getTime() < Date.now()) {
        subStatus = 'expired';
      }

      const updated: Partial<UserProfile> = {
        displayName: user.displayName || data.displayName || 'Developer',
        photoURL: user.photoURL || data.photoURL || '',
        subscriptionStatus: subStatus,
        updatedAt: now,
      };

      if (isOwner && data.role !== 'owner') {
        updated.role = 'owner';
      }

      await updateDoc(userRef, updated);
      return {
        ...data,
        ...updated,
      } as UserProfile;
    } else {
      const newProfile: UserProfile = {
        uid: user.uid,
        email,
        displayName: user.displayName || 'Developer',
        photoURL: user.photoURL || '',
        role: isOwner ? 'owner' : 'user',
        planId: 'free',
        subscriptionStatus: 'free',
        createdAt: now,
        updatedAt: now,
      };
      await setDoc(userRef, newProfile);
      return newProfile;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
  }
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;
    return snap.data() as UserProfile;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${uid}`);
  }
}

// CONVERSATIONS
export async function getConversations(userId: string): Promise<Conversation[]> {
  try {
    const q = query(
      collection(db, 'conversations'),
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc'),
      limit(50)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Conversation));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'conversations');
  }
}

export async function createConversation(userId: string, title: string, model: string = 'gemini-3.8-flash'): Promise<Conversation> {
  try {
    const convId = 'conv_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const now = new Date().toISOString();
    const newConv: Conversation = {
      id: convId,
      userId,
      title: title.slice(0, 180),
      model,
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(doc(db, 'conversations', convId), newConv);
    return newConv;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'conversations');
  }
}

export async function updateConversationTitle(conversationId: string, title: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'conversations', conversationId), {
      title: title.slice(0, 180),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `conversations/${conversationId}`);
  }
}

export async function deleteConversation(conversationId: string): Promise<void> {
  try {
    // Delete conversation document
    await deleteDoc(doc(db, 'conversations', conversationId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `conversations/${conversationId}`);
  }
}

// MESSAGES
export async function getMessages(conversationId: string, userId: string): Promise<Message[]> {
  try {
    const q = query(
      collection(db, 'messages'),
      where('conversationId', '==', conversationId),
      where('userId', '==', userId),
      orderBy('createdAt', 'asc'),
      limit(100)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Message));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'messages');
  }
}

export async function saveMessage(msg: Omit<Message, 'id'>): Promise<Message> {
  const msgId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  try {
    const fullMsg: Message = {
      ...msg,
      id: msgId,
    };
    await setDoc(doc(db, 'messages', msgId), fullMsg);

    // Update conversation timestamp & preview
    try {
      await updateDoc(doc(db, 'conversations', msg.conversationId), {
        updatedAt: msg.createdAt,
        lastMessagePreview: msg.content.slice(0, 100),
      });
    } catch {
      // non-fatal
    }

    return fullMsg;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'messages');
  }
}

// DAILY USAGE & RATE LIMITING
export async function getDailyUsage(userId: string): Promise<DailyUsage> {
  const today = new Date().toISOString().slice(0, 10);
  const docRef = doc(db, 'usage', userId);
  try {
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as DailyUsage;
      if (data.date === today) {
        return data;
      }
      return {
        userId,
        date: today,
        messageCount: 0,
        lastUpdated: new Date().toISOString(),
      };
    }
    return {
      userId,
      date: today,
      messageCount: 0,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `usage/${userId}`);
  }
}

export async function incrementDailyUsage(userId: string): Promise<number> {
  const today = new Date().toISOString().slice(0, 10);
  const docRef = doc(db, 'usage', userId);
  try {
    const current = await getDailyUsage(userId);
    const newCount = (current.date === today ? current.messageCount : 0) + 1;
    await setDoc(
      docRef,
      {
        userId,
        date: today,
        messageCount: newCount,
        lastUpdated: new Date().toISOString(),
      },
      { merge: true }
    );
    return newCount;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `usage/${userId}`);
  }
}

// USER SUBSCRIPTIONS & PAYMENTS
export async function getUserSubscriptions(userId: string): Promise<Subscription[]> {
  try {
    const q = query(collection(db, 'subscriptions'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Subscription));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'subscriptions');
  }
}

export async function getUserPayments(userId: string): Promise<PaymentRecord[]> {
  try {
    const q = query(collection(db, 'payments'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as PaymentRecord));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'payments');
  }
}

// STORAGE FILE UPLOAD
export async function uploadFileToStorage(userId: string, file: File): Promise<{ url: string; name: string; size: number; type: string }> {
  const fileId = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  const storageRef = ref(storage, `users/${userId}/uploads/${fileId}`);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  return {
    url,
    name: file.name,
    size: file.size,
    type: file.type || 'text/plain',
  };
}
