import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Sparkles, Rocket, AppWindow } from 'lucide-react';

interface AppsModalProps {
  isOpen: boolean;
  onClose: () => void;
  commanderName: string;
}

export const AppsModal: React.FC<AppsModalProps> = ({ isOpen, onClose, commanderName }) => {
  const apps = [
    {
      name: "Commerce Prime",
      description: "A premium e-commerce experience with advanced features.",
      link: "https://commerce-prime.vercel.app/",
      icon: <Rocket className="w-6 h-6 text-cyan-500" />,
      color: "from-cyan-500 to-blue-600"
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 sm:p-8"
          style={{ paddingTop: 'clamp(24px, env(safe-area-inset-top, 0px), 48px)', paddingBottom: 'clamp(0px, env(safe-area-inset-bottom, 0px), 32px)' }}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            className="relative w-full max-w-4xl h-full max-h-[85vh] bg-[#0a0a0c] border border-white/10 rounded-[2rem] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              aria-label="Close Apps Menu"
              title="Close Apps Menu"
              className="absolute top-6 right-6 p-3 rounded-full bg-white/5 hover:bg-white/10 text-white transition-all z-10 group"
            >
              <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
            </button>

            {/* Content Container */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-8 sm:p-12 transform-gpu" style={{ WebkitOverflowScrolling: 'touch', transform: 'translateZ(0)', willChange: 'transform' }}>
              <div className="flex flex-col items-center text-center space-y-8">
                {/* Krishna Avtaar Image */}
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="relative"
                >
                  <div className="absolute -inset-4 bg-cyan-500/20 blur-2xl rounded-full animate-pulse" />
                  <img
                    src="/Picsart_26-02-28_11-29-26-443.jpg"
                    alt="Krishna Avtaar"
                    className="w-32 h-32 sm:w-40 sm:h-40 rounded-full object-cover border-4 border-cyan-500/50 shadow-[0_0_30px_rgba(0,242,255,0.3)] relative z-1"
                  />
                </motion.div>

                {/* Stylish Animated Name */}
                <div className="space-y-2">
                  <motion.h2
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-3xl sm:text-5xl font-black tracking-tighter"
                  >
                    <span className="bg-gradient-to-r from-white via-cyan-400 to-blue-500 bg-clip-text text-transparent animate-gradient-x">
                      Somay a.k.a. Owner
                    </span>
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-cyan-500/80 font-mono text-sm tracking-[0.3em] uppercase"
                  >
                    Digital Architect & Visionary
                  </motion.p>
                </div>

                {/* Greeting Message */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="max-w-2xl"
                >
                  <p className="text-slate-400 text-lg leading-relaxed">
                    Namaste! Welcome to my digital ecosystem. I'm passionate about building 
                    cutting-edge experiences that push the boundaries of what's possible. 
                    Explore our latest creations below.
                  </p>
                </motion.div>

                {/* Apps Section */}
                <div className="w-full pt-8 space-y-6">
                  <h3 className="text-xl font-bold text-white flex items-center justify-center gap-3">
                    <Sparkles className="w-5 h-5 text-yellow-500" />
                    Try Our Another Apps
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {apps.map((app, index) => (
                      <motion.a
                        key={index}
                        href={app.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7 + index * 0.1 }}
                        className="group relative p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all hover:scale-[1.02] hover:shadow-[0_10px_30px_rgba(0,0,0,0.3)]"
                      >
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-xl bg-gradient-to-br ${app.color} bg-opacity-20`}>
                            {app.icon}
                          </div>
                          <div className="flex-1 text-left">
                            <h4 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors">
                              {app.name}
                            </h4>
                            <p className="text-slate-500 text-sm mt-1">
                              {app.description}
                            </p>
                          </div>
                          <ExternalLink className="w-5 h-5 text-slate-600 group-hover:text-white transition-colors" />
                        </div>
                      </motion.a>
                    ))}

                    {/* Coming Soon Card */}
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 }}
                      className="p-6 bg-white/5 border border-dashed border-white/20 rounded-2xl flex flex-col items-center justify-center text-center space-y-2 opacity-60"
                    >
                      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                        <AppWindow className="w-6 h-6 text-slate-500" />
                      </div>
                      <h4 className="text-lg font-bold text-slate-400">More Apps Coming Soon</h4>
                      <p className="text-slate-600 text-xs uppercase tracking-widest">Under Development</p>
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/5 text-center">
              <p className="text-slate-600 text-xs font-medium tracking-widest uppercase">
                Built with passion by Somay • 2026
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
