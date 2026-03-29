import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lokiprimex.app',
  appName: 'Loki Prime X',
  webDir: 'dist',
  server: {
    url: 'https://loki-x-prime.vercel.app',
    cleartext: true,
    allowNavigation: ['loki-x-prime.vercel.app']
  }
};

export default config;
