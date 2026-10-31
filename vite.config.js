import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Change 'mini-tournament' to match your GitHub repo name
// e.g. if repo is github.com/shourav/my-tourney → base: '/my-tourney/'
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/minitournament/',
})
