import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ command }) => {
  return {
    plugins: [react(), tailwindcss()],
    // If you are in 'build' mode, use the repo name. 
    // If you are in 'serve' mode (npm run dev), use '/'
    base: command === 'build' ? '/Insta-admin-new/' : '/',
  }
})