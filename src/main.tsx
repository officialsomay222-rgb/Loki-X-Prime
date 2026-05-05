import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { SettingsProvider } from './contexts/SettingsContext';
import { ChatProvider } from './contexts/ChatContext';
import { GlobalInteractionProvider } from './contexts/GlobalInteractionContext';
import { AuthProvider } from './contexts/AuthContext';
import { registerSW } from 'virtual:pwa-register';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { applyDevicePerformanceClass } from './utils/performance';
import { Capacitor } from '@capacitor/core';
import './lib/firebase';

// Apply performance class early in the lifecycle
applyDevicePerformanceClass();

// Enable VirtualKeyboard API for smooth keyboard transitions
if ('virtualKeyboard' in navigator) {
  (navigator as any).virtualKeyboard.overlaysContent = true;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

try {
  const updateSW = registerSW({
    onNeedRefresh() {
      updateSW(true);
    },
    onOfflineReady() {
    },
  });
} catch (e) {
  console.warn('PWA service worker registration failed (expected in some iframe environments):', e);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <SettingsProvider>
            <GlobalInteractionProvider>
              <ChatProvider>
                <App />
                <Toaster theme="dark" position="top-center" />
              </ChatProvider>
            </GlobalInteractionProvider>
          </SettingsProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
);
