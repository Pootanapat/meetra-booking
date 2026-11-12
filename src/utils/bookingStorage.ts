import { ROOMS } from '../data/rooms';
import type { Booking, BookingStatus } from '../types/booking';

export const BOOKING_STORAGE_KEY = 'kmitlBookings';

export interface LoadedBookings {
  bookings: Booking[];
  error: string | null;
}

type StoredBooking = Omit<Partial<Booking>, 'status' | 'roomId'> & {
  id?: string | number;
  roomId?: string | number;
  start?: string;
  end?: string;
  status?: string;
};

function normalizeBooking(value: unknown, index: number): Booking {
  if (!value || typeof value !== 'object') {
    throw new Error(`รายการจองลำดับ ${index + 1} มีรูปแบบไม่ถูกต้อง`);
  }
  const item = value as StoredBooking;
  const roomId = typeof item.roomId === 'string' || typeof item.roomId === 'number'
    ? String(item.roomId)
    : '';
  const date = typeof item.date === 'string' ? item.date : '';
  const startTime = typeof item.startTime === 'string' ? item.startTime : item.start;
  const endTime = typeof item.endTime === 'string' ? item.endTime : item.end;
  const room = ROOMS.find(candidate => candidate.id === roomId);
  const status = item.status || 'approved';
  const validStatuses: BookingStatus[] = [
    'approved',
    'pending',
    'cancelled',
    'ยืนยันแล้ว',
    'ยกเลิกแล้ว',
  ];

  if (!roomId || !date || !startTime || !endTime || !validStatuses.includes(status as BookingStatus)) {
    throw new Error(`รายการจองลำดับ ${index + 1} ขาดข้อมูลห้อง วันที่ เวลา หรือสถานะ`);
  }

  return {
    id: typeof item.id === 'string' || typeof item.id === 'number'
      ? item.id
      : `legacy-${index}`,
    roomId,
    roomName: item.roomName || room?.name || `ห้อง ${roomId}`,
    location: item.location || room?.building || '',
    date,
    startTime,
    endTime,
    start: startTime,
    end: endTime,
    status: status as BookingStatus,
    userEmail: item.userEmail || '',
    owner: item.owner,
  };
}

export function loadBookings(): LoadedBookings {
  try {
    const raw = localStorage.getItem(BOOKING_STORAGE_KEY);
    if (raw === null) return { bookings: [], error: null };
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) {
      throw new Error('ข้อมูลรายการจองต้องเป็นรายการ array');
    }
    return { bookings: value.map(normalizeBooking), error: null };
  } catch (error) {
    return {
      bookings: [],
      error: error instanceof Error ? error.message : 'อ่านข้อมูลการจองไม่สำเร็จ',
    };
  }
}
