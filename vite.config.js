import { defineConfig } from 'vite'

export default defineConfig({
    base: './', // відносні шляхи: працює на Vercel, Netlify і GitHub Pages
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        chunkSizeWarningLimit: 1200
    }
})
