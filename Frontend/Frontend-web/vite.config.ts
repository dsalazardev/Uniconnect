import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Force React to resolve from local node_modules to prevent
      // duplicate React instances in the monorepo (Invalid hook call).
      react: path.resolve(__dirname, '../../node_modules/react'),
      'react-dom': path.resolve(__dirname, '../../node_modules/react-dom'),
      // Shared package lives outside this app dir; Vite's scan of
      // Frontend/shared/src/*.ts must resolve deps from monorepo hoisted node_modules.
      axios: path.resolve(__dirname, '../../node_modules/axios'),
      zod: path.resolve(__dirname, '../../node_modules/zod'),
      // socket.io-client's ESM entry pulls engine.io-client/build/esm; some installs
      // end up missing sibling .js files (e.g. socket.js). The official browser bundle
      // is self-contained and exports `io` (see dist/socket.io.esm.min.js).
      'socket.io-client': path.resolve(
        __dirname,
        '../../node_modules/socket.io-client/dist/socket.io.esm.min.js',
      ),
    },
  },
  optimizeDeps: {
    include: ['axios', 'zod', 'socket.io-client'],
  },
});
