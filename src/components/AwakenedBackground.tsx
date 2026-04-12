import React, { memo } from 'react';

import { Theme } from '../contexts/SettingsContext';

interface AwakenedBackgroundProps {
  isAwakened: boolean;
  bgStyle: 'nebula' | 'cyber-grid' | 'default';
  theme: Theme;
}

export const AwakenedBackground = memo(({ isAwakened, bgStyle, theme }: AwakenedBackgroundProps) => {
  return (
    <div className="fixed inset-0 z-0 edge-to-edge-bg overflow-hidden pointer-events-none select-none">
      {/* Base Background Layer */}
      <div className={`absolute inset-0 transition-colors duration-700 ${
        isAwakened 
          ? (theme === 'dark' ? 'bg-[#050508]' : 'bg-white')
          : (theme === 'dark' ? 'bg-[#08080c]' : 'bg-slate-50')
      }`} />

      {/* Awakened Mode Effects */}
      {isAwakened && (
        <>
          {/* Cosmic Aura */}
          <div className="absolute inset-[-50px] opacity-80 mix-blend-screen animate-[cosmic-aura-pulse_4s_ease-in-out_infinite_alternate] awakened-bg-aura" />
          
          {/* Nebula Effect */}
          <div className="absolute inset-0 opacity-100 awakened-bg-nebula" style={{ backgroundSize: '100% 100%' }} />
        </>
      )}

      {/* Standard Mode Effects */}
      {!isAwakened && (
        <>
          {bgStyle === 'nebula' && (
            <div className="absolute inset-0 bg-nebula opacity-100" />
          )}
          {bgStyle === 'cyber-grid' && (
            <div className="absolute inset-0 bg-cyber-grid opacity-100" />
          )}
        </>
      )}
    </div>
  );
});
