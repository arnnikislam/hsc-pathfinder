import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Don't let vite-plugin-pwa intercept our custom SW
      injectRegister: false,
      includeAssets: ['favicon.ico', 'logo.svg', 'og-image.png'],
      manifest: {
        name: 'HSC PathFinder',
        short_name: 'PathFinder',
        description: 'HSC 2026 Study Tracker — তোমার লক্ষ্য, তোমার পথ',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          { src:'icons/icon-192x192.png', sizes:'192x192', type:'image/png', purpose:'any maskable' },
          { src:'icons/icon-512x512.png', sizes:'512x512', type:'image/png', purpose:'any maskable' },
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Don't cache our custom SW
        globIgnores: ['sw-custom.js'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60*60*24*365 }
            }
          }
        ]
      }
    })
  ]
})
