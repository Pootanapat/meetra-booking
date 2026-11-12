import { Booking, BookingStatus } from '../types/booking';

type StoredBooking = Omit<Partial<Booking>, 'status'> & {
  id: string | number;
  status?: string;
  roomId?: string;
  room?: string;
  start?: string;
  end?: string;
  owner?: string;
};

const storageKeys = ['kmitlBookings', 'bookings', 'my_bookings_preview_data'];

function parseBookings(key: string): StoredBooking[] {
  const raw = localStorage.getItem(key);
  if (!raw) return [];

  const value: unknown = JSON.parse(raw);
  if (!Array.isArray(value)) {
    throw new TypeError(`Expected ${key} to contain a booking list`);
  }
  return value.filter((booking): booking is StoredBooking =>
    Boolean(booking && typeof booking === 'object' && 'id' in booking),
  );
}

function normalizeBooking(booking: StoredBooking): Booking {
  const status: BookingStatus = booking.status === 'cancelled'
    || booking.status === 'ยกเลิกแล้ว'
    ? 'cancelled'
    : booking.status === 'pending'
      ? 'pending'
      : 'approved';

  return {
    ...booking,
    id: String(booking.id),
    roomName: booking.roomName || booking.room || booking.roomId || 'ห้องประชุม',
    location: booking.location || '',
    date: booking.date || '',
    startTime: booking.startTime || booking.start || '',
    endTime: booking.endTime || booking.end || '',
    status,
    userEmail: booking.userEmail || '',
  };
}

export function getBookings(): Booking[] {
  const byId = new Map<string, StoredBooking>();
  storageKeys.forEach(key => {
    parseBookings(key).forEach(booking => byId.set(String(booking.id), booking));
  });
  return Array.from(byId.values(), normalizeBooking);
}

export function saveBookings(bookings: Booking[]): void {
  const serialized = JSON.stringify(bookings);
  localStorage.setItem('my_bookings_preview_data', serialized);
  localStorage.setItem('bookings', serialized);
}
