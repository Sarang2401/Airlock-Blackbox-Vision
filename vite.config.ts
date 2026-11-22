import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { offlineShell } from './build/offlineShell';

export default defineConfig({
  plugins: [react(), offlineShell()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@packages': path.resolve(__dirname, './packages'),
      '@benchmark': path.resolve(__dirname, './benchmark'),
    },
  },
  server: {
    port: 3000,
    headers: {
      // Content Security Policy for App Check and local privacy boundaries
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/; style-src 'self' 'unsafe-inline'; connect-src 'self' https://content-firebaseappcheck.googleapis.com https://firebasevertexai.googleapis.com https://www.google.com/recaptcha/; frame-src https://www.google.com/recaptcha/ https://recaptcha.google.com/recaptcha/; img-src 'self' data:; font-src 'self' data:;",
    },
  },
});
