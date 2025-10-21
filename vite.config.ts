import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

// https://vitejs.dev/config/
export default defineConfig({
  // 1. Add this line
  base: '/fractal-edu/',

  plugins: [react()],
  build: {
    rollupOptions: {
      // 2. Correct this line
      input: 'index.html'
    }
  },
    resolve: {
      alias: {
        '@': path.resolve(path.dirname(fileURLToPath(import.meta.url)), './src'),
      }
    }
  })
