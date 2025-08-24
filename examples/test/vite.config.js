import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PKG_ROOT = resolve(__dirname, '../../packages');

export default defineConfig({
  root: '.',
  server: {
    port: 3000,
    open: true,
    fs: {
      allow: [
        PKG_ROOT,
        resolve(__dirname, '../..'),
        resolve(__dirname, '..'),
        __dirname,
      ],
    },
  },
  resolve: {
    alias: {
      // '@hawk-tracker/core': resolve(PKG_ROOT, 'core/src/index.ts'),
      // '@hawk-tracker/plugin-error': resolve(
      //   PKG_ROOT,
      //   'plugin-error/src/index.ts',
      // ),
      // '@hawk-tracker/plugin-behavior': resolve(
      //   PKG_ROOT,
      //   'plugin-behavior/src/index.ts',
      // ),
      // '@hawk-tracker/plugin-rrweb': resolve(
      //   PKG_ROOT,
      //   'plugin-rrweb/src/index.ts',
      // ),
      '@hawk-tracker/core': resolve(__dirname, '../../packages/core/src/index.ts'),
      '@hawk-tracker/plugin-error': resolve(__dirname, '../../packages/plugin-error/src/index.ts'),
      '@hawk-tracker/plugin-behavior': resolve(__dirname, '../../packages/plugin-behavior/src/index.ts'),
    },
  },
  optimizeDeps: {
    include: [
      '@hawk-tracker/core',
      '@hawk-tracker/plugin-error', 
      '@hawk-tracker/plugin-behavior'
    ],
  },
});
