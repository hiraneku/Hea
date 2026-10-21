import { defineConfig } from 'vite';

export default defineConfig({
  // Relative asset URLs work at both / and GitHub Pages project paths such as /Hea/.
  base: './',
  server: { host: '0.0.0.0', allowedHosts: ['.e2b.app', 'localhost'], port: 5173 },
  preview: { host: '0.0.0.0', allowedHosts: ['.e2b.app', 'localhost'], port: 4173 },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 750,
    rollupOptions: {
      input: { game: 'index.html', preview: 'preview/index.html', house: 'house/index.html' },
      output: { manualChunks: { three: ['three'] } },
    },
  },
});
