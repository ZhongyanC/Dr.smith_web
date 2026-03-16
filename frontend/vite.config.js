import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command, mode }) => ({
  plugins: [react()],
  // 开发时用 /，生产构建时用 /static/frontend/（Django 静态路径）
  base: mode === 'development' ? '/' : '/static/frontend/',
  build: {
    outDir: '../drsmith-backend/statics/frontend',
    emptyOutDir: true,
  },
  server: {
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: false,
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes, req, res) => {
            const cookies = proxyRes.headers['set-cookie']
            if (cookies) {
              proxyRes.headers['set-cookie'] = cookies.map((c) =>
                c
                  .replace(/;\s*Secure/gi, '')
                  .replace(/;\s*Domain=[^;]+/gi, '')
              )
            }
          })
        },
      },
      '/media': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: false,
      },
      '/static': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: false,
      },
    },
  },
}))
