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
      
      // Chuyển toàn bộ các request /api qua Kong Gateway
      // Kong sẽ dựa vào Path (ví dụ /api/ai, /api/exams) để định tuyến vào đúng Service
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})