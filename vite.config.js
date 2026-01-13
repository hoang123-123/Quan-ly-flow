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
      '/ms-login': {
        target: 'https://login.microsoftonline.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ms-login/, ''),
        onProxyReq: (proxyReq) => {
          proxyReq.removeHeader('referer');
          // Đặt Origin trùng với Target để đánh lừa Microsoft đây là Same-origin hoặc Server call
          proxyReq.setHeader('Origin', 'https://login.microsoftonline.com');
        },
      },
      '/flow-api': {
        target: 'https://api.flow.microsoft.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/flow-api/, ''),
      },
      '/pp-api': {
        target: 'https://api.powerplatform.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/pp-api/, ''),
      },
    },
  },
})
