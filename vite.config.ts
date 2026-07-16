import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
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
  ],
})
