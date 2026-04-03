import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import glsl from 'vite-plugin-glsl';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';
export default defineConfig({
  plugins: [react(), glsl(), wasm(), topLevelAwait()],
  define: {
    global: 'globalThis',
  },
  build: {
    sourcemap: 'hidden',
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks: {
          'three-vendor': ['three', 'three-stdlib'],
          'react-vendor': ['react', 'react-dom'],
          'firebase-vendor': [
            'firebase/app',
            'firebase/auth',
            'firebase/firestore',
          ],
        },
      },
    },
  },
  optimizeDeps: {
    exclude: ['three-stdlib'],
    include: ['draft-js'],
  },
});
