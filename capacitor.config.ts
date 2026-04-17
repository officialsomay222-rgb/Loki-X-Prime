import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lokiprimex.app',
  appName: 'Loki Prime X',
  webDir: 'dist',
  server: {
    url: 'https://loki-x-prime.vercel.app',
    allowNavigation: ['loki-x-prime.vercel.app']
  },
  plugins: {
    Keyboard: {
      resize: 'body' as any,
    },
    StatusBar: {
      overlaysWebView: true,
    },
    NavigationBar: {
      transparent: true,
    }
  }
};

export default config;
