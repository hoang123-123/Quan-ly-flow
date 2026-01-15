import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/Quan-ly-flow/',
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/flow-api': {
        target: 'https://api.flow.microsoft.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/flow-api/, ''),
      },
    },
  },
})
