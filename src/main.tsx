import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { SettingsProvider } from './contexts/SettingsContext';
import { ChatProvider } from './contexts/ChatContext';
import { registerSW } from 'virtual:pwa-register';

const updateSW = registerSW({
  onNeedRefresh() {
    console.log('New content available. Reloading...');
    updateSW(true);
  },
  onOfflineReady() {
    console.log('App is ready to work offline');
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <SettingsProvider>
        <ChatProvider>
          <App />
        </ChatProvider>
      </SettingsProvider>
    </ErrorBoundary>
  </StrictMode>,
);
