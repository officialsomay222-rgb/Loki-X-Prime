import React, { memo } from 'react';

interface AwakenedBackgroundProps {
  isAwakened: boolean;
  bgStyle: 'nebula' | 'cyber-grid' | 'default';
  theme: 'dark' | 'light';
}

export const AwakenedBackground = memo(({ isAwakened, bgStyle, theme }: AwakenedBackgroundProps) => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none will-change-transform">
      {/* Base Background Layer */}
      <div className={`absolute inset-0 transition-colors duration-700 ${
        isAwakened 
          ? 'bg-[#050508]' 
          : theme === 'dark' ? 'bg-[#08080c]' : 'bg-slate-50'
      }`} />

      {/* Awakened Mode Effects */}
      {isAwakened && (
        <>
          {/* Cosmic Aura */}
          <div className="absolute inset-[-50px] opacity-80 mix-blend-screen animate-[cosmic-aura-pulse_4s_ease-in-out_infinite_alternate] will-change-opacity"
               style={{ background: 'radial-gradient(circle at 50% 50%, transparent 40%, rgba(0, 242, 255, 0.1) 70%, rgba(189, 0, 255, 0.05) 100%)' }} />
          
          {/* Nebula Effect */}
          <div className="absolute inset-0 opacity-100"
               style={{ 
                 background: `
                   radial-gradient(circle at 50% 50%, rgba(0, 242, 255, 0.08), transparent 70%),
                   radial-gradient(circle at 100% 100%, rgba(189, 0, 255, 0.05), transparent 50%),
                   linear-gradient(to bottom, #050508, #0a0a12)
                 `,
                 backgroundSize: '100% 100%'
               }} />
        </>
      )}

      {/* Standard Mode Effects */}
      {!isAwakened && (
        <>
          {bgStyle === 'nebula' && (
            <div className="absolute inset-0 bg-nebula opacity-100 will-change-transform" />
          )}
          {bgStyle === 'cyber-grid' && (
            <div className="absolute inset-0 bg-cyber-grid opacity-100 will-change-transform" />
          )}
        </>
      )}
    </div>
  );
});
