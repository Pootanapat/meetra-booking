import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const pages = [
  'index.html',
  'login.html',
  'register.html',
  'my-bookings.html',
  'rooms.html',
  'statistics.html',
];

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: pages.map(page => resolve(process.cwd(), page)),
    },
  },
});
