import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        index: 'index.html',
        login: 'login.html',
        register: 'register.html',
        bookings: 'my-bookings.html',
        rooms: 'rooms.html',
        statistics: 'statistics.html',
      },
    },
  },
});
