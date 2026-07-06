/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface Window {
  AndroidNative?: {
    showToast: (message: string) => void;
  };
}
