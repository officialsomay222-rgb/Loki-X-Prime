import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
        manifest: {
          name: 'Loki Prime X',
          short_name: 'Loki X',
          description: 'Advanced AI Chat Interface - Awakened Intelligence',
          theme_color: '#08080c',
          background_color: '#08080c',
          display: 'standalone',
          display_override: ['window-controls-overlay', 'standalone', 'minimal-ui'],
          orientation: 'portrait',
          start_url: '/',
          id: '/',
          categories: ['productivity', 'utilities', 'lifestyle', 'education'],
          dir: 'ltr',
          lang: 'en-US',
          prefer_related_applications: false,
          handle_links: 'auto',
          launch_handler: {
            client_mode: ['navigate-existing', 'auto']
          },
          icons: [
            {
              src: 'https://i.ibb.co/5XjVRg3S/Picsart-26-03-07-20-42-18-789.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any maskable'
            },
            {
              src: 'https://i.ibb.co/5XjVRg3S/Picsart-26-03-07-20-42-18-789.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            },
            {
              src: 'https://i.ibb.co/5XjVRg3S/Picsart-26-03-07-20-42-18-789.png',
              sizes: '1024x1024',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ],
          screenshots: [
            {
              src: 'https://i.ibb.co/5XjVRg3S/Picsart-26-03-07-20-42-18-789.png',
              sizes: '1024x1024',
              type: 'image/png',
              form_factor: 'wide',
              label: 'Loki Prime X Interface'
            },
            {
              src: 'https://i.ibb.co/5XjVRg3S/Picsart-26-03-07-20-42-18-789.png',
              sizes: '1024x1024',
              type: 'image/png',
              form_factor: 'narrow',
              label: 'Loki Prime X Mobile'
            }
          ],
          protocol_handlers: [
            {
              protocol: 'web+loki',
              url: '/?command=%s'
            }
          ],
          share_target: {
            action: '/?share=true',
            method: 'GET',
            params: {
              title: 'title',
              text: 'text',
              url: 'url'
            }
          }
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,woff2,json}'],
          navigateFallback: '/index.html',
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          sourcemap: false,
          maximumFileSizeToCacheInBytes: 5000000,
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/i\.ibb\.co\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'external-images',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'google-fonts-stylesheets',
              }
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-webfonts',
                expiration: {
                  maxEntries: 30,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ]
        },
        devOptions: {
          enabled: process.env.DISABLE_HMR !== 'true',
          type: 'module',
          navigateFallback: 'index.html',
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || ''),
      'process.env.GOOGLE_AI_KEY': JSON.stringify(env.GOOGLE_AI_KEY || process.env.GOOGLE_AI_KEY || ''),
      'process.env.GROQ_API_KEY': JSON.stringify(env.GROQ_API_KEY || process.env.GROQ_API_KEY || ''),
      'process.env.HF_TOKEN': JSON.stringify(env.HF_TOKEN || process.env.HF_TOKEN || ''),
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      host: '0.0.0.0',
      allowedHosts: true,
      hmr: process.env.DISABLE_HMR === 'true' ? false : {
        overlay: false,
      },
    },
  };
});
