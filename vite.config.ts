import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import electronRenderer from 'vite-plugin-electron-renderer'
import path from 'path'
import fs from 'fs'

export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        entry: 'electron/main.ts',
        vite: {
          build: {
            outDir: 'dist-electron',
            rollupOptions: {
              external: ['electron', 'electron-store', 'googleapis']
            }
          },
          plugins: [
            {
              name: 'copy-preload',
              closeBundle() {
                fs.copyFileSync('electron/preload-source.cjs', 'dist-electron/preload.cjs')
                console.log('Copied preload-source.cjs to dist-electron/preload.cjs')
              }
            }
          ]
        }
      }
    ]),
    electronRenderer()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    outDir: 'dist'
  }
})
