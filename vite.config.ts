import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  preview: {
    host: true, // Listens on 0.0.0.0
    allowedHosts: [
      'photobooth-kntf.onrender.com', // Explicit domain
      // Or use: true (to allow all incoming hosts)
    ],
  },
});