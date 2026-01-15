import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'global': 'window',
  },
  server: {
    proxy: {
      // =================================================================
      // CẤU HÌNH GATEWAY CHUẨN (Tất cả đi qua Kong Port 8000)
      // =================================================================
      // Mọi request bắt đầu bằng /api (gồm cả /auth, /users...) 
      // sẽ được chuyển hướng sang Kong Gateway.
      '/api': {
        target: 'http://localhost:8000', 
        changeOrigin: true,
        secure: false,
      }
    },
  },
})