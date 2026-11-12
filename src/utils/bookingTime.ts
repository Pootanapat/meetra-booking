import type { Booking, RoomId } from '../types/booking';

export type SlotStatus = 'available' | 'booked' | 'past';

export interface BookingTimeRange {
  roomId: RoomId;
  date: string;
  startTime: string;
  endTime: string;
}

const OPENING_MINUTES = 7 * 60;
const CLOSING_MINUTES = 17 * 60;

export function timeToMinutes(value: string): number | null {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

export function localDateISO(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function isValidDateISO(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;

  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return date.getFullYear() === Number(match[1])
    && date.getMonth() === Number(match[2]) - 1
    && date.getDate() === Number(match[3]);
}

export function isCancelledBooking(booking: Booking): boolean {
  return booking.status === 'cancelled' || booking.status === 'ยกเลิกแล้ว';
}

export function findTimeConflict(
  range: BookingTimeRange,
  bookings: Booking[],
  ignoredBookingId?: Booking['id'],
): Booking | null {
  const start = timeToMinutes(range.startTime);
  const end = timeToMinutes(range.endTime);
  if (start === null || end === null || start >= end) return null;

  return bookings.find(booking => {
    if (
      booking.roomId !== range.roomId
      || booking.date !== range.date
      || isCancelledBooking(booking)
      || (ignoredBookingId !== undefined && String(booking.id) === String(ignoredBookingId))
    ) {
      return false;
    }

    const bookingStart = timeToMinutes(booking.startTime);
    const bookingEnd = timeToMinutes(booking.endTime);
    if (bookingStart === null || bookingEnd === null || bookingStart >= bookingEnd) {
      return true;
    }
    return start < bookingEnd && bookingStart < end;
  }) ?? null;
}

export function validateBookingTime(
  range: BookingTimeRange,
  bookings: Booking[],
  now: Date = new Date(),
  ignoredBookingId?: Booking['id'],
): string | null {
  if (!range.roomId) return 'กรุณาเลือกห้องประชุม';
  if (!isValidDateISO(range.date)) return 'กรุณาเลือกวันที่ให้ถูกต้อง';
  if (range.date < localDateISO(now)) return 'ไม่สามารถเลือกวันที่ผ่านมาแล้วได้';

  const start = timeToMinutes(range.startTime);
  const end = timeToMinutes(range.endTime);
  if (start === null || end === null || start >= end) {
    return 'เวลาเริ่มต้นต้องน้อยกว่าเวลาสิ้นสุด';
  }
  if (start < OPENING_MINUTES || end > CLOSING_MINUTES) {
    return 'เวลาให้บริการคือ 07:00–17:00 น.';
  }
  if (range.date === localDateISO(now) && start <= now.getHours() * 60 + now.getMinutes()) {
    return 'ไม่สามารถเลือกช่วงเวลาที่ผ่านไปแล้วได้';
  }

  const conflict = findTimeConflict(range, bookings, ignoredBookingId);
  if (!conflict) return null;

  const conflictStart = timeToMinutes(conflict.startTime);
  const conflictEnd = timeToMinutes(conflict.endTime);
  if (conflictStart === null || conflictEnd === null || conflictStart >= conflictEnd) {
    return 'ข้อมูลเวลาของรายการจองเดิมไม่ถูกต้อง กรุณาตรวจสอบรายการจอง';
  }
  return `ช่วงเวลานี้ชนกับรายการจองอื่น (${conflict.startTime}–${conflict.endTime})`;
}

export function getSlotStatus(
  range: BookingTimeRange,
  bookings: Booking[],
  now: Date = new Date(),
): SlotStatus {
  const start = timeToMinutes(range.startTime);
  if (
    start === null
    || range.date < localDateISO(now)
    || (range.date === localDateISO(now) && start <= now.getHours() * 60 + now.getMinutes())
  ) {
    return 'past';
  }
  return findTimeConflict(range, bookings) ? 'booked' : 'available';
}
