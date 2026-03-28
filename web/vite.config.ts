import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages project sites are served from /repo-name/; CI sets BASE_PATH.
// Local dev uses "/" (default).
const base = process.env.BASE_PATH?.trim() || '/'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: base.endsWith('/') ? base : `${base}/`,
})
