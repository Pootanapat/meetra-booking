const OPENING_MINUTES = 7 * 60;
const CLOSING_MINUTES = 17 * 60;

export class BookingPolicy {
  minutesToTime(minutes) {
    return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
  }

  timeToMinutes(time) {
    if (!time) return 0;
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  activeBookings(bookings) {
    const uniqueBookings = new Map();
    for (const booking of bookings) {
      if (booking && booking.status !== 'cancelled' && booking.status !== 'ยกเลิกแล้ว') {
        uniqueBookings.set(booking.id, booking);
      }
    }
    return [...uniqueBookings.values()];
  }

  getRoomStatus({ roomId, roomName, date, bookings }) {
    const roomBookings = this.activeBookings(bookings).filter(booking =>
      (booking.roomId === roomId || booking.roomName === roomName) && booking.date === date
    );
    const isFullDay = roomBookings.some(booking =>
      this.timeToMinutes(booking.startTime || booking.start) <= OPENING_MINUTES &&
      this.timeToMinutes(booking.endTime || booking.end) >= CLOSING_MINUTES
    );
    if (isFullDay) {
      return { status: 'booked', statusText: 'ถูกจองแล้ว', count: roomBookings.length, isFullDay: true };
    }
    if (roomBookings.length > 0) {
      return {
        status: 'partial',
        statusText: `จองแล้ว ${roomBookings.length} ช่วงเวลา`,
        count: roomBookings.length,
        isFullDay: false,
      };
    }
    return { status: 'available', statusText: 'ว่าง', count: 0, isFullDay: false };
  }

  checkConflict({ roomId, roomName, date, startTime, endTime, bookings }) {
    const newStart = this.timeToMinutes(startTime);
    const newEnd = this.timeToMinutes(endTime);
    if (newStart < OPENING_MINUTES || newEnd > CLOSING_MINUTES) {
      return {
        hasConflict: true,
        message: 'เปิดให้บริการเฉพาะช่วงเวลา 07:00 - 17:00 น. เท่านั้น กรุณาเลือกเวลาใหม่',
      };
    }
    if (newStart >= newEnd) {
      return { hasConflict: true, message: 'เวลาเริ่มต้นต้องน้อยกว่าเวลาสิ้นสุด' };
    }
    for (const booking of this.activeBookings(bookings)) {
      const sameRoom = booking.roomId === roomId || booking.roomName === roomName;
      if (sameRoom && booking.date === date) {
        const bookedStart = this.timeToMinutes(booking.startTime || booking.start);
        const bookedEnd = this.timeToMinutes(booking.endTime || booking.end);
        if (Math.max(newStart, bookedStart) < Math.min(newEnd, bookedEnd)) {
          return {
            hasConflict: true,
            message: `ถูกจองแล้ว ในช่วงเวลา ${booking.startTime || booking.start} - ${booking.endTime || booking.end} น. กรุณาเลือกช่วงเวลาอื่น`,
          };
        }
      }
    }
    return { hasConflict: false, message: '' };
  }

  buildTimeline({ roomId, roomName, date, bookings, now = new Date(), intervalMinutes = 30 }) {
    const today = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
    ].join('-');
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const activeBookings = this.activeBookings(bookings).filter(booking =>
      (booking.roomId === roomId || booking.roomName === roomName) && booking.date === date
    );
    const slots = [];
    for (let start = OPENING_MINUTES; start < CLOSING_MINUTES; start += intervalMinutes) {
      const end = Math.min(start + intervalMinutes, CLOSING_MINUTES);
      const isPast = date < today || (date === today && end <= currentMinutes);
      const isBooked = activeBookings.some(booking => {
        const bookedStart = this.timeToMinutes(booking.startTime || booking.start);
        const bookedEnd = this.timeToMinutes(booking.endTime || booking.end);
        return Math.max(start, bookedStart) < Math.min(end, bookedEnd);
      });
      slots.push({
        startTime: this.minutesToTime(start),
        endTime: this.minutesToTime(end),
        status: isPast ? 'past' : isBooked ? 'booked' : 'available',
      });
    }
    return slots;
  }
}

