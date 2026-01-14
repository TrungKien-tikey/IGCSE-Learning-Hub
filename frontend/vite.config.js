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
      
      // Các request bắt đầu bằng /api/exams sẽ đi thẳng tới Exam Service (8085)
      '/api/exams': {
        target: 'http://localhost:8085',
        changeOrigin: true,
        secure: false,
      },
      // Các request bắt đầu bằng /api/ai sẽ đi thẳng tới AI Service (8082)
      '/api/ai': {
        target: 'http://localhost:8082',
        changeOrigin: true,
        secure: false,
      },
      // Các request bắt đầu bằng /api (như auth, users...) sẽ đi tới Auth Service (8080)
      '/api': {
        target: 'http://localhost:8080', 
        changeOrigin: true,
        secure: false,
      }
    },
  },
})