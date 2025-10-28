import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'
import path from 'path'
import { fileURLToPath } from 'url'
import manifest from './manifest'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  plugins: [react(), crx({ manifest })],
  build: {
    sourcemap: true,
    rollupOptions: {
      input: {
        popup: path.resolve(__dirname, 'src/popup/index.html'),
        options: path.resolve(__dirname, 'src/options/index.html'),
      },
    },
  },
})
