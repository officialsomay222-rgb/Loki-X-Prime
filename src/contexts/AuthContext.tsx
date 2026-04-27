import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Capacitor } from '@capacitor/core';

export interface AuthState {
  isLoggedIn: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  user: User | null;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthLoaded, setIsAuthLoaded] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setIsLoggedIn(true);
        setUser(currentUser);
      } else {
        setIsLoggedIn(false);
        setUser(null);
      }
      setIsAuthLoaded(true);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    try {
      const provider = new GoogleAuthProvider();

      if (Capacitor.isNativePlatform()) {
        // Native Google Auth requires a dedicated Capacitor plugin!
        // Standard Firebase web auth will not work here.
        console.error("Native Google Auth requires a Capacitor plugin. Cannot use web popup.");
        throw new Error("Native auth not implemented yet.");
      } else {
        // Use Popup for the web browser, it's way more reliable than Redirect
        await signInWithPopup(auth, provider);
      }
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  if (!isAuthLoaded) {
    return null; // Or a loading spinner, but we want it to be fast.
  }

  return (
    <AuthContext.Provider value={{ isLoggedIn, signIn, signOut, user }}>
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
