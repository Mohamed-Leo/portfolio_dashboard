import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import babel from '@rolldown/plugin-babel';
import { defineConfig, loadEnv } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';
import { tanstackRouter } from '@tanstack/router-plugin/vite';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const { BACKEND_URL } = loadEnv(mode, process.cwd(), 'BACKEND_');

  return {
    plugins: [
      tanstackRouter({
        target: 'react',
        autoCodeSplitting: true,
      }),
      react(),
      babel({ presets: [reactCompilerPreset()] }),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      proxy: BACKEND_URL ? {
        '/api': { target: BACKEND_URL, changeOrigin: true },
      } : undefined,
      watch: { ignored: ['**/graphify-out/**'] },
    },
  };
});
