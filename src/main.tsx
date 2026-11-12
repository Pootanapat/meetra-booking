import React from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from './context/AuthContext';
import { MyBookings } from './components/MyBookings';

const rootElement = document.getElementById('my-bookings-root');
if (!rootElement) {
  throw new Error('Missing #my-bookings-root mount element');
}

createRoot(rootElement).render(
  <React.StrictMode>
    <AuthProvider>
      <MyBookings />
    </AuthProvider>
  </React.StrictMode>,
);
