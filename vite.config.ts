import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { chefApi } from './server/chef-api.ts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'souschef-kitchen-proxy',
      configureServer(server) {
        server.middlewares.use('/api', chefApi())
      },
    },
    VitePWA({
      // We hand-maintain public/manifest.webmanifest + icon links in index.html.
      manifest: false,
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
        // API calls must never be served from the SPA-shell cache.
        navigateFallbackDenylist: [/^\/api/],
      },
    }),
  ],
})
