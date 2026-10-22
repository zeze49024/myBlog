import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  root: 'ui-design',
  base: './',
  plugins: [tailwindcss()],
  build: { outDir: '../dist', emptyOutDir: true },
});
