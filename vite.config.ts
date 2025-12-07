import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { copyFile, mkdir } from 'fs/promises';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function ensureManifest() {
  const outDir = path.resolve(__dirname, 'dist');
  await mkdir(outDir, { recursive: true });
  await copyFile(path.resolve(__dirname, 'manifest.json'), path.resolve(outDir, 'manifest.json'));
}

const copyManifestPlugin = () => ({
  name: 'copy-manifest-to-dist',
  apply: 'build',
  async writeBundle() {
    await ensureManifest();
  },
});

export default defineConfig({
  plugins: [react(), copyManifestPlugin()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        popup: path.resolve(__dirname, 'src/popup/index.html'),
        options: path.resolve(__dirname, 'src/options/index.html'),
        sidepanel: path.resolve(__dirname, 'src/sidepanel/index.html'),
        background: path.resolve(__dirname, 'src/background/index.ts'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          const name = chunkInfo.name;
          if (name === 'background') {
            return `${name}.js`;
          }
          return 'assets/[name].[hash].js';
        },
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash][extname]',
      },
    },
  },
});
