import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // This safely exposes the API_KEY env var to the client-side code if it exists on the build server.
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || '')
  }
});