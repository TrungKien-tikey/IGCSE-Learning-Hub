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
      // PAYMENT SERVICE (Phải đặt TRƯỚC /api để match trước)
      // =================================================================
      '/api/payment': {
        target: 'http://127.0.0.1:8084',
        changeOrigin: true,
        secure: false,
      },
      '/api/admin/statistics': {
        target: 'http://127.0.0.1:8084',
        changeOrigin: true,
        secure: false,
      },
      // =================================================================
      // CẤU HÌNH GATEWAY CHUẨN (Tất cả đi qua Kong Port 8000)
      // =================================================================
      // Mọi request bắt đầu bằng /api (gồm cả /auth, /users...) 
      // sẽ được chuyển hướng sang Kong Gateway.
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      // ===================================
      // MONITORING PROXY (Actuator bypasses Kong for direct speed)
      // ===================================
      '/health/auth': { target: 'http://127.0.0.1:8080', changeOrigin: true, secure: false, rewrite: (path) => path.replace(/^\/health\/auth/, '/actuator/health') },
      '/health/user': { target: 'http://127.0.0.1:8083', changeOrigin: true, secure: false, rewrite: (path) => path.replace(/^\/health\/user/, '/actuator/health') },
      '/health/ai': { target: 'http://127.0.0.1:8082', changeOrigin: true, secure: false, rewrite: (path) => path.replace(/^\/health\/ai/, '/actuator/health') },
      '/health/course': { target: 'http://127.0.0.1:8079', changeOrigin: true, secure: false, rewrite: (path) => path.replace(/^\/health\/course/, '/actuator/health') },
      '/health/exam': { target: 'http://127.0.0.1:8085', changeOrigin: true, secure: false, rewrite: (path) => path.replace(/^\/health\/exam/, '/actuator/health') },
      '/health/communication': { target: 'http://127.0.0.1:8089', changeOrigin: true, secure: false, rewrite: (path) => path.replace(/^\/health\/communication/, '/actuator/health') },
      '/health/payment': { target: 'http://127.0.0.1:8084', changeOrigin: true, secure: false, rewrite: (path) => path.replace(/^\/health\/payment/, '/actuator/health') },
    },
  },
})