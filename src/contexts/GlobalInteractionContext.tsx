import React, { createContext, useContext, useEffect, useState } from 'react';
import useSound from 'use-sound';

// Using reliable public CDNs for UI sounds
const SOUNDS = {
  click: 'https://cdn.freesound.org/previews/256/256113_3263906-lq.mp3', // Cyber-Click
  hum: 'https://cdn.freesound.org/previews/154/154173_2703579-lq.mp3',   // Power-On Hum
  chirp: 'https://cdn.freesound.org/previews/320/320181_527080-lq.mp3',  // Listening Chirp
  blip: 'https://cdn.freesound.org/previews/342/342200_5260872-lq.mp3',  // Data Processed Blip
  notification: 'https://cdn.freesound.org/previews/235/235911_2398403-lq.mp3', // Tech Notification
};

interface GlobalInteractionContextType {
  playChirp: () => void;
  playBlip: () => void;
  playNotification: () => void;
}

const GlobalInteractionContext = createContext<GlobalInteractionContextType | null>(null);

export const useGlobalInteraction = () => {
  const context = useContext(GlobalInteractionContext);
  if (!context) {
    throw new Error('useGlobalInteraction must be used within a GlobalInteractionProvider');
  }
  return context;
};

export const GlobalInteractionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasInteracted, setHasInteracted] = useState(false);

  // Initialize sounds
  const [playClick] = useSound(SOUNDS.click, { volume: 0.5 });
  const [playHum] = useSound(SOUNDS.hum, { volume: 0.3 });
  const [playChirp] = useSound(SOUNDS.chirp, { volume: 0.6 });
  const [playBlip] = useSound(SOUNDS.blip, { volume: 0.6 });
  const [playNotification] = useSound(SOUNDS.notification, { volume: 0.5 });

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      // 2. The "System Wake-up" (Entry Logic)
      if (!hasInteracted) {
        playHum();
        setHasInteracted(true);
      }

      // 1. The Invisible Sound Layer (Global Event Listener)
      const target = e.target as HTMLElement;
      const isClickable = 
        target.closest('button') || 
        target.closest('input') || 
        target.closest('a') || 
        target.closest('[role="button"]') || 
        target.closest('.menu-item');
      
      if (isClickable) {
        playClick();
      }
    };

    // Use capture phase to ensure it fires before React event handlers stop propagation
    window.addEventListener('click', handleGlobalClick, true);
    return () => window.removeEventListener('click', handleGlobalClick, true);
  }, [hasInteracted, playClick, playHum]);

  return (
    <GlobalInteractionContext.Provider value={{ playChirp, playBlip, playNotification }}>
      {children}
    </GlobalInteractionContext.Provider>
  );
};
