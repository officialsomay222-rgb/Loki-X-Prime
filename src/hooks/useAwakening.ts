import React, { useState, useCallback } from 'react';

export interface AwakeningState {
  id: number;
  phase: string;
  startX: number;
  startY: number;
  width: number;
  height: number;
  isDeactivating?: boolean;
}

export function useAwakening(isAwakened: boolean, setIsAwakened: (value: boolean) => void) {
  const [awakening, setAwakening] = useState<AwakeningState | null>(null);

  const triggerAwakening = useCallback((e: React.MouseEvent) => {
    if (awakening) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const startX = rect.left;
    const startY = rect.top;

    setAwakening({ id: Date.now(), phase: 'moving-in', startX, startY, width: rect.width, height: rect.height, isDeactivating: isAwakened });

    setTimeout(() => {
      if (isAwakened) {
           // Deactivating
           setAwakening(prev => prev ? { ...prev, phase: 'shockwave' } : null);
           setTimeout(() => {
              setIsAwakened(false);
              setAwakening(prev => prev ? { ...prev, phase: 'moving-out' } : null);
           }, 2500);
           setTimeout(() => {
              setAwakening(null);
           }, 4000);
        } else {
           // Activating - Skip prompt, go straight to shockwave
           setAwakening(prev => prev ? { ...prev, phase: 'shockwave' } : null);
           setTimeout(() => {
             setIsAwakened(true);
             setAwakening(prev => prev ? { ...prev, phase: 'moving-out' } : null);
           }, 2500);
           setTimeout(() => {
             setAwakening(null);
           }, 4000);
        }
    }, 1500);
  }, [awakening, isAwakened, setIsAwakened]);

  const handleAwakeningResponse = useCallback((ready: boolean) => {
    if (!awakening) return;

    if (ready) {
      setAwakening(prev => prev ? { ...prev, phase: 'shockwave' } : null);
      setTimeout(() => {
        setIsAwakened(true);
        setAwakening(prev => prev ? { ...prev, phase: 'moving-out' } : null);
      }, 2500);
      setTimeout(() => {
        setAwakening(null);
      }, 4000);
    } else {
      setAwakening(prev => prev ? { ...prev, phase: 'moving-out' } : null);
      setTimeout(() => {
        setAwakening(null);
      }, 1500);
    }
  }, [awakening, setIsAwakened]);

  return {
    awakening,
    triggerAwakening,
    handleAwakeningResponse
  };
}
