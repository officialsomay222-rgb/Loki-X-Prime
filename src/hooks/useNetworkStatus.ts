import { useState, useEffect } from 'react';

export const useNetworkStatus = () => {
  const [status, setStatus] = useState<{connected: boolean, connectionType: string}>({
    connected: navigator.onLine,
    connectionType: 'unknown'
  });

  useEffect(() => {
    const handleOnline = () => setStatus({ connected: true, connectionType: 'unknown' });
    const handleOffline = () => setStatus({ connected: false, connectionType: 'none' });

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return status;
};
