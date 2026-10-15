import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' makes the build work from any sub-path (GitHub Pages project sites,
// Cloudflare Pages, Netlify, a plain folder...). No client-side routing is used.
export default defineConfig({
  base: './',
  plugins: [react()],
  define: { __BUILD_TIME__: JSON.stringify(new Date().toISOString()) },
})
