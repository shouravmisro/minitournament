import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Relative base './' works universally on GitHub Pages, Vercel, Netlify, Cloudflare Pages, etc.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './',
})
