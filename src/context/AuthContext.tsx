import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, googleProvider, signInWithPopup, fbSignOut } from '../lib/firebase';

interface AuthContextType {
  user: User | { uid: string; email: string; displayName: string; photoURL: string | null } | null;
  loading: boolean;
  isDemoMode: boolean;
  signInWithGoogle: () => Promise<void>;
  enableDemoMode: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const DEMO_USER = {
  uid: 'demo_user_123',
  email: 'pengguna.demo@dompetku.id',
  displayName: 'Pengguna Demo',
  photoURL: null,
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | typeof DEMO_USER | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    // Check if demo mode was active
    const savedDemo = localStorage.getItem('dompetku_demo_mode') === 'true';

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setIsDemoMode(false);
        localStorage.removeItem('dompetku_demo_mode');
      } else if (savedDemo) {
        setUser(DEMO_USER);
        setIsDemoMode(true);
      } else {
        setUser(null);
        setIsDemoMode(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      await signInWithPopup(auth, googleProvider);
      setIsDemoMode(false);
      localStorage.removeItem('dompetku_demo_mode');
    } catch (error) {
      console.error('Google Sign In Error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const enableDemoMode = () => {
    setUser(DEMO_USER);
    setIsDemoMode(true);
    localStorage.setItem('dompetku_demo_mode', 'true');
  };

  const signOut = async () => {
    try {
      if (isDemoMode) {
        localStorage.removeItem('dompetku_demo_mode');
        setUser(null);
        setIsDemoMode(false);
      } else {
        await fbSignOut(auth);
      }
    } catch (error) {
      console.error('Sign Out Error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isDemoMode,
        signInWithGoogle,
        enableDemoMode,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
