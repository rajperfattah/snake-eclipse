import { defineConfig } from 'vite';

export default defineConfig({
  // Relative base path ensures GitHub Pages serves assets correctly under any repo name
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
});
