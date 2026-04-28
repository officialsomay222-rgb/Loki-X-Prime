import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { GoogleAuthProvider, signInWithRedirect, getRedirectResult, signOut as firebaseSignOut, onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Capacitor } from '@capacitor/core';

export interface AuthState {
  isLoggedIn: boolean;
  isGuest: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  continueAsGuest: () => void;
  user: User | null;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isGuest, setIsGuest] = useState(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('loki_isGuest') === 'true' : false;
  });
  const [isAuthLoaded, setIsAuthLoaded] = useState(false);
  const [user, setUser] = useState<User | null>(null);


  useEffect(() => {
    // Handle redirect result
    getRedirectResult(auth)
      .then((result) => {
        // Result is handled by onAuthStateChanged if successful
      })
      .catch((error) => {
        console.error('Error with redirect sign-in:', error);
      });
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setIsLoggedIn(true);
        setUser(currentUser);
        setIsGuest(false);
        localStorage.removeItem('loki_isGuest');
      } else {
        setIsLoggedIn(false);
        setUser(null);
      }
      setIsAuthLoaded(true);
    });

    return () => unsubscribe();
  }, []);

  const continueAsGuest = () => {
    setIsGuest(true);
    localStorage.setItem('loki_isGuest', 'true');
  };

  const signIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      // Use redirect for both web and mobile
      await signInWithRedirect(auth, provider);
    } catch (error) {
      console.error('Error initiating redirect sign-in:', error);
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
    <AuthContext.Provider value={{ isLoggedIn, isGuest, signIn, signOut, continueAsGuest, user }}>
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
