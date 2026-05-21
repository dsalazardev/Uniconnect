import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

/**
 * Resuelve una dependencia probando primero el monorepo root
 * (para desarrollo local con hoisting) y luego el node_modules
 * local del proyecto (para CI/CD como Amplify).
 */
function resolveDep(pkgName: string, subPath = ''): string {
  const monorepoRoot = path.resolve(__dirname, '../../node_modules');
  const localNodeModules = path.resolve(__dirname, 'node_modules');

  const candidates = [
    path.join(monorepoRoot, pkgName, subPath),
    path.join(localNodeModules, pkgName, subPath),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  // Fallback: deja que Vite resuelva normalmente. En CI/CD las deps
  // transitivas de file: packages se instalan en el node_modules local.
  return subPath ? path.join(pkgName, subPath) : pkgName;
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Force React to resolve from local node_modules to prevent
      // duplicate React instances in the monorepo (Invalid hook call).
      // En CI/CD fallback a resolución estándar si no existe en monorepo root.
      react: resolveDep('react'),
      'react-dom': resolveDep('react-dom'),
      // Shared package lives outside this app dir; Vite's scan of
      // Frontend/shared/src/*.ts must resolve deps from monorepo hoisted node_modules.
      axios: resolveDep('axios'),
      zod: resolveDep('zod'),
      // socket.io-client's ESM entry pulls engine.io-client/build/esm; some installs
      // end up missing sibling .js files (e.g. socket.js). The official browser bundle
      // is self-contained and exports `io` (see dist/socket.io.esm.min.js).
      'socket.io-client': resolveDep(
        'socket.io-client',
        'dist/socket.io.esm.min.js',
      ),
    },
  },
  optimizeDeps: {
    include: ['axios', 'zod', 'socket.io-client'],
  },
});
