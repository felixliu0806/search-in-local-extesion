import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    rollupOptions: {
      input: {
        content: path.resolve(__dirname, 'src/content/index.ts'),
      },
      output: {
        format: 'iife',
        inlineDynamicImports: true,
        entryFileNames: 'content.js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[hash][extname]',
      },
    },
  },
});
