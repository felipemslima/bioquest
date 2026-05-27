import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  publicDir: 'assets',   // assets/ served at root → player.png, tilemaps/phase1.json
  server: { port: 3000 },
  build: { outDir: 'dist', emptyOutDir: true },
});
