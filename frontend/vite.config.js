import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080', // Chuyển hướng các request /api sang Backend 8080
        changeOrigin: true,
        secure: false,
      },
    },
  },
})