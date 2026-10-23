import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// La URL de la API se define una sola vez: VITE_API_URL (ver ../docs/INTEGRACION-FRONTEND.md).
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
});
