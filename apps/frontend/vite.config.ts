import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(async ({ mode }) => {
  const plugins = [
    vue(),
    vueJsx(),
    tailwindcss(),
  ]

  if (mode === 'development') {
    try {
      // @ts-ignore
      const { default: vueDevTools } = await import('vite-plugin-vue-devtools')
      if (vueDevTools) {
        // @ts-ignore
        plugins.push(vueDevTools())
      }
    } catch (e) {
      console.warn('Failed to load vue-devtools', e)
    }
  }

  return {
    root: fileURLToPath(new URL('./', import.meta.url)),
    plugins,
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
  }
})
