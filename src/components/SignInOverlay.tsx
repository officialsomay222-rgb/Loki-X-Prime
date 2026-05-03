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
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 backdrop-blur-xl overflow-hidden"
    >
      {/* Background ambient effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 -right-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px]" />
        {/* Subtle grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_10%,transparent_100%)]" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center relative w-full px-6 z-10">
        {/* Aura effect behind text */}
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <div className="w-[300px] h-[300px] bg-cyan-500/30 rounded-full blur-[100px]"></div>
        </motion.div>

        {/* LOKI X PRIME text */}
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.1, type: "spring", stiffness: 100 }}
          className="relative z-10 text-center"
        >
          <div className="inline-block relative">
            <h1 className="text-5xl sm:text-7xl font-black tracking-[0.2em] sm:tracking-[0.3em] font-montserrat text-transparent bg-clip-text bg-gradient-to-br from-white via-cyan-200 to-purple-400 drop-shadow-[0_0_30px_rgba(0,242,255,0.4)]">
              LOKI X
            </h1>
            <h1 className="text-5xl sm:text-7xl font-black tracking-[0.2em] sm:tracking-[0.3em] font-montserrat text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 drop-shadow-[0_0_25px_rgba(168,85,247,0.5)] mt-2">
              PRIME
            </h1>
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="mt-6 flex items-center justify-center gap-3 text-slate-400"
          >
            <div className="h-px w-8 bg-gradient-to-r from-transparent to-cyan-500/50" />
            <p className="text-sm tracking-[0.3em] uppercase font-semibold text-cyan-100">
              Unlock Capabilities
            </p>
            <div className="h-px w-8 bg-gradient-to-l from-transparent to-cyan-500/50" />
          </motion.div>
        </motion.div>
      </div>

      {/* Sign in button area at the bottom */}
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.3, type: "spring", stiffness: 90 }}
        className="w-full max-w-md px-6 pb-12 sm:pb-16 z-10"
      >
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/50">
          <button
            onClick={handleSignIn}
            disabled={isSigningIn}
            aria-label="Continue with Google"
            className={`w-full group relative flex items-center justify-center gap-3 bg-white text-slate-900 py-4 px-8 rounded-2xl font-bold text-lg transition-all focus-visible:ring-4 focus-visible:ring-cyan-500/50 focus-visible:outline-none ${isSigningIn ? "opacity-70 cursor-not-allowed" : "hover:bg-slate-50 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:-translate-y-0.5 active:translate-y-0"}`}
          >
            {isSigningIn ? (
              <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin"></div>
            ) : (
              <div className="bg-slate-100 p-1 rounded-full group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
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
              </div>
            )}
            {isSigningIn ? "Signing in..." : "Continue with Google"}
          </button>

          <div className="mt-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Or</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <div className="mt-6 flex flex-col gap-3 items-center">
              <button
                  onClick={() => {
                      continueAsGuest();
                      onClose();
                  }}
                  aria-label="Continue as Guest"
                  className="w-full text-slate-300 hover:text-white transition-all text-sm font-bold uppercase tracking-widest py-3.5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-white/20 focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:outline-none"
              >
                  Continue as Guest
              </button>
              <button
                  onClick={onClose}
                  aria-label="Cancel sign in"
                  className="text-slate-500 hover:text-slate-300 transition-colors text-sm font-medium mt-2 px-4 py-2 rounded-lg hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-slate-500/50 focus-visible:outline-none"
              >
                  Cancel
              </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
