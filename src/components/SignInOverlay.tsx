import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

interface SignInOverlayProps {
  onClose: () => void;
}

export const SignInOverlay: React.FC<SignInOverlayProps> = ({ onClose }) => {
  const { signIn, continueAsGuest } = useAuth();
  const [isSigningIn, setIsSigningIn] = React.useState(false);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    try {
      await signIn();
      onClose();
    } catch (error) {
      console.error("Sign in failed", error);
      // Let the user try again
      setIsSigningIn(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 backdrop-blur-xl"
    >
      <div className="flex-1 flex flex-col items-center justify-center relative w-full px-6">
        {/* Aura effect behind text */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[300px] h-[300px] bg-cyan-500/20 rounded-full blur-[100px] animate-pulse"></div>
        </div>

        {/* LOKI X PRIME text with aura */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative z-10 text-center"
        >
          <h1 className="text-4xl sm:text-6xl font-black tracking-[0.2em] sm:tracking-[0.3em] font-montserrat text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 drop-shadow-[0_0_25px_rgba(0,242,255,0.5)]">
            LOKI X PRIME
          </h1>
          <p className="mt-4 text-slate-400 text-sm tracking-widest uppercase">
            Sign in to unlock all capabilities
          </p>
        </motion.div>
      </div>

      {/* Sign in button area at the bottom */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="w-full max-w-md px-6 pb-12 sm:pb-16"
      >
        <button
          onClick={handleSignIn}
          disabled={isSigningIn}
          className={`w-full group relative flex items-center justify-center gap-3 bg-white text-slate-900 py-4 px-8 rounded-2xl font-bold text-lg transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] ${isSigningIn ? "opacity-70 cursor-not-allowed" : "hover:bg-slate-50 hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:scale-[1.02] active:scale-[0.98]"}`}
        >
          {isSigningIn ? (
            <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin"></div>
          ) : (
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
          )}
          {isSigningIn ? "Signing in..." : "Sign in with Google"}
        </button>

        <div className="mt-6 flex flex-col gap-4 items-center">
            <button
                onClick={() => {
                    continueAsGuest();
                    onClose();
                }}
                className="w-full text-slate-300 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest py-3 border border-white/10 rounded-xl hover:bg-white/5"
            >
                Continue as Guest
            </button>
            <button
                onClick={onClose}
                className="text-slate-400 hover:text-white transition-colors text-sm font-medium"
            >
                Cancel
            </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
