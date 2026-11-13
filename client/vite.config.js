import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Sends /api calls to the Express server, so the browser sees one origin
    // and the SameSite=Strict login cookie just works in development.
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
});
