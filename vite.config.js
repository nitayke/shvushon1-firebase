import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    // The Vercel functions in /api don't run under `vite`; use the deployed ones in development
    proxy: { '/api': { target: 'https://www.shvushon.com', changeOrigin: true } }
  }
});
