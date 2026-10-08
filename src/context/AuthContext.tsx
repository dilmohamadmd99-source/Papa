import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { auth, googleProvider } from '../firebase/config';
import { syncUserProfile, getUserProfile, getDailyUsage, incrementDailyUsage, OWNER_EMAIL } from '../firebase/db';
import type { UserProfile, DailyUsage } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isOwner: boolean;
  isPremium: boolean;
  dailyUsage: DailyUsage;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  incrementUsage: () => Promise<number>;
  setProfileManually: (profile: UserProfile) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [dailyUsage, setDailyUsage] = useState<DailyUsage>({
    userId: '',
    date: new Date().toISOString().slice(0, 10),
    messageCount: 0,
    lastUpdated: new Date().toISOString(),
  });

  const loadProfile = useCallback(async (firebaseUser: User) => {
    try {
      const synched = await syncUserProfile({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
      });
      setProfile(synched);

      try {
        const usage = await getDailyUsage(firebaseUser.uid);
        if (usage) setDailyUsage(usage);
      } catch (usageErr) {
        console.warn('Could not load usage data:', usageErr);
      }
    } catch (err) {
      console.error('Error synchronizing user profile:', err);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await loadProfile(currentUser);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [loadProfile]);

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        await loadProfile(result.user);
      }
    } catch (error: any) {
      console.error('Google Sign-In failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const updated = await getUserProfile(user.uid);
      if (updated) setProfile(updated);
      try {
        const usage = await getDailyUsage(user.uid);
        if (usage) setDailyUsage(usage);
      } catch (usageErr) {
        console.warn('Could not refresh usage data:', usageErr);
      }
    }
  };

  const incrementUsage = async (): Promise<number> => {
    if (!user) return 0;
    const count = await incrementDailyUsage(user.uid);
    setDailyUsage((prev) => ({ ...prev, messageCount: count }));
    return count;
  };

  const isOwner = Boolean(
    (user?.email && user.email.toLowerCase() === OWNER_EMAIL.toLowerCase()) ||
    profile?.role === 'owner'
  );

  const isPremium = Boolean(
    profile?.subscriptionStatus === 'active' &&
    profile?.subscriptionExpiry &&
    new Date(profile.subscriptionExpiry).getTime() > Date.now()
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isOwner,
        isPremium,
        dailyUsage,
        loginWithGoogle,
        logout,
        refreshProfile,
        incrementUsage,
        setProfileManually: setProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
