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

      // Các request bắt đầu bằng /api/v1/auth sẽ đi tới Auth Service (port 8080)
      '/api/v1/auth': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
      // Các request bắt đầu bằng /api/users sẽ đi tới User Service (port 8083)
      '/api/users': {
        target: 'http://localhost:8083',

        changeOrigin: true,
        secure: false,
      },
    },
  },
})