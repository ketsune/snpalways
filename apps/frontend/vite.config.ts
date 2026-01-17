import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  root: fileURLToPath(new URL('./', import.meta.url)),
  plugins: [
    vue(),
    vueJsx(),
    tailwindcss(),
    mode === 'development' && vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    proxy: {
      // All requests starting with '/api' go to the Elysia server
      '/api': {
        target: 'http://localhost:3000', // Your Elysia port
        changeOrigin: true,
        secure: false,
      },
    },
  },
}))
