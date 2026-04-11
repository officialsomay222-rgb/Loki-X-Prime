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
    });

    // Listeners
    const handler = Network.addListener('networkStatusChange', (status) => {
      setStatus(status);
    });

    return () => {
      handler.then(h => h.remove());
    };
  }, []);

  return status;
};
