import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface AuthState {
  isLoggedIn: boolean;
  signIn: () => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthLoaded, setIsAuthLoaded] = useState(false);

  useEffect(() => {
    const storedAuth = localStorage.getItem('loki_isLoggedIn');
    if (storedAuth === 'true') {
      setIsLoggedIn(true);
    }
    setIsAuthLoaded(true);
  }, []);

  const signIn = () => {
    localStorage.setItem('loki_isLoggedIn', 'true');
    setIsLoggedIn(true);
  };

  const signOut = () => {
    localStorage.removeItem('loki_isLoggedIn');
    setIsLoggedIn(false);
  };

  if (!isAuthLoaded) {
    return null; // Or a loading spinner, but we want it to be fast.
  }

  return (
    <AuthContext.Provider value={{ isLoggedIn, signIn, signOut }}>
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
