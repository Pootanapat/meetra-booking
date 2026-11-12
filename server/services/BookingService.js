import crypto from 'node:crypto';
import { CLOSING_MINUTES, OPENING_MINUTES } from '../config.js';
import { ApplicationError } from '../errors/ApplicationError.js';

const minutesFromTime = value => {
  if (!/^\d{2}:\d{2}$/.test(value ?? '')) return Number.NaN;
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
};

const localDate = () => {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
};

export class BookingService {
  constructor(bookingRepository, roomRepository) {
    this.bookingRepository = bookingRepository;
    this.roomRepository = roomRepository;
  }

  validate(input) {
    if (!input.roomId || !/^\d{4}-\d{2}-\d{2}$/.test(input.date ?? '')) {
      throw new ApplicationError(400, 'กรุณาระบุห้องและวันที่ให้ถูกต้อง');
    }
    if (input.date < localDate()) throw new ApplicationError(400, 'ไม่สามารถจองวันที่ย้อนหลังได้');
    const start = minutesFromTime(input.startTime);
    const end = minutesFromTime(input.endTime);
    if (!Number.isFinite(start) || !Number.isFinite(end)) {
      throw new ApplicationError(400, 'รูปแบบเวลาไม่ถูกต้อง');
    }
    if (start < OPENING_MINUTES || end > CLOSING_MINUTES) {
      throw new ApplicationError(400, 'เวลาจองต้องอยู่ระหว่าง 07:00–17:00 น.');
    }
    if (start >= end) throw new ApplicationError(400, 'เวลาเริ่มต้องน้อยกว่าเวลาสิ้นสุด');
  }

  listForUser(userId) {
    return this.bookingRepository.listForUser(userId);
  }

  async create(userId, input) {
    this.validate(input);
    if (!await this.roomRepository.exists(input.roomId)) {
      throw new ApplicationError(404, 'ไม่พบห้องประชุม');
    }
    if (await this.bookingRepository.findConflict(input)) {
      throw new ApplicationError(409, 'ช่วงเวลานี้ถูกจองแล้ว');
    }
    const booking = {
      id: input.id || `bkg-${crypto.randomUUID()}`,
      refCode: input.refCode || `KMITL-${crypto.randomInt(10000, 100000)}`,
      roomId: input.roomId,
      userId,
      date: input.date,
      startTime: input.startTime,
      endTime: input.endTime,
      purpose: String(input.purpose ?? '').trim(),
    };
    await this.bookingRepository.create(booking);
    return { id: booking.id, refCode: booking.refCode };
  }

  async update(userId, bookingId, input) {
    const existing = await this.bookingRepository.findOwnedById(bookingId, userId);
    if (!existing) throw new ApplicationError(404, 'ไม่พบรายการจอง');
    if (existing.status === 'cancelled') {
      throw new ApplicationError(409, 'ไม่สามารถแก้ไขรายการที่ยกเลิกแล้ว');
    }
    const updated = {
      roomId: existing.room_id,
      date: input.date,
      startTime: input.startTime,
      endTime: input.endTime,
      excludeId: existing.id,
    };
    this.validate(updated);
    if (await this.bookingRepository.findConflict(updated)) {
      throw new ApplicationError(409, 'ช่วงเวลานี้ถูกจองแล้ว');
    }
    await this.bookingRepository.update({
      id: existing.id,
      userId,
      date: updated.date,
      startTime: updated.startTime,
      endTime: updated.endTime,
      purpose: String(input.purpose ?? '').trim(),
    });
  }

  async cancel(userId, bookingId) {
    const result = await this.bookingRepository.cancel(bookingId, userId);
    if (result.changes === 0) throw new ApplicationError(404, 'ไม่พบรายการจอง');
  }
}

