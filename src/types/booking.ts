export type RoomId = string;

export interface Room {
  id: RoomId;
  name: string;
  capacity: number;
  building: string;
  floor: number;
  equipment: string[];
  icon: string;
}

export type BookingStatus =
  | 'approved'
  | 'pending'
  | 'cancelled'
  | 'ยืนยันแล้ว'
  | 'ยกเลิกแล้ว';

export interface Booking {
  id: string | number;
  roomId: RoomId;
  roomName: string;
  location: string;
  date: string;
  startTime: string;
  endTime: string;
  start?: string;
  end?: string;
  status: BookingStatus;
  userEmail: string;
  owner?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}