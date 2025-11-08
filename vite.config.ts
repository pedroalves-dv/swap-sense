import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  return {
    plugins: [
      react(),
      visualizer({
        filename: 'dist/bundle-analysis.html',
        open: true,
        gzipSize: true,
        brotliSize: true,
      }),
      VitePWA({
        registerType: 'autoUpdate',
        manifest: {
          name: 'SwapSense',
          short_name: 'SwapSense',
          description: 'Global Currency Converter & Comparison Tool',
          theme_color: '#1976d2',
          background_color: '#ffffff',
          display: 'standalone',
          start_url: '/',
          icons: [
            {
              src: '/logo.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: '/logo.png',
              sizes: '512x512',
              type: 'image/png',
            },
          ],
        },
      }),
    ],
    // Base path used when deploying to GitHub Pages for a project site.
    // Updated to match the repository name `swap-sense` so assets load correctly
    // when served from: https://<username>.github.io/swap-sense/
    base: mode === 'production' ? '/swap-sense/' : '/',
  };
});
