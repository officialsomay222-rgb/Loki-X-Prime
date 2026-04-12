import { useState, useEffect } from 'react';
import { Network, ConnectionStatus } from '@capacitor/network';

export const useNetworkStatus = () => {
  const [status, setStatus] = useState<ConnectionStatus>({
    connected: navigator.onLine,
    connectionType: 'unknown'
  });

  useEffect(() => {
    // Initial check
    Network.getStatus().then((status) => {
      setStatus(status);
    }).catch(e => {
      console.warn("Network.getStatus() failed", e);
      setStatus({ connected: navigator.onLine, connectionType: 'unknown' });
    });

    // Listeners
    let handler: any;
    try {
      handler = Network.addListener('networkStatusChange', (status) => {
        setStatus(status);
      });
    } catch (e) {
      console.warn("Network.addListener() failed", e);
    }

    // Browser fallback
    const handleOnline = () => setStatus({ connected: true, connectionType: 'unknown' });
    const handleOffline = () => setStatus({ connected: false, connectionType: 'none' });
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      if (handler) handler.then((h: any) => h.remove()).catch(() => {});
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return status;
};
