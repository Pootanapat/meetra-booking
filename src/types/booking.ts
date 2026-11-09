export type BookingStatus = 'approved' | 'pending' | 'cancelled';

export interface Booking {
  id: string;
  roomName: string;
  location: string;
  date: string;       // YYYY-MM-DD
  startTime: string;  // HH:mm
  endTime: string;    // HH:mm
  status: BookingStatus;
  userEmail: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}