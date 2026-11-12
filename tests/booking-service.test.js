import assert from 'node:assert/strict';
import test from 'node:test';
import { BookingService } from '../server/services/BookingService.js';

const validBooking = {
  roomId: 'room-101',
  date: '2099-12-31',
  startTime: '09:00',
  endTime: '10:00',
  purpose: 'ทดสอบ service',
};

test('BookingService coordinates repositories without Express or SQLite', async () => {
  let savedBooking;
  const bookingRepository = {
    findConflict: async () => null,
    create: async booking => { savedBooking = booking; },
  };
  const roomRepository = { exists: async roomId => roomId === 'room-101' };
  const service = new BookingService(bookingRepository, roomRepository);

  const result = await service.create('authenticated-user', validBooking);

  assert.equal(savedBooking.userId, 'authenticated-user');
  assert.equal(savedBooking.roomId, 'room-101');
  assert.match(result.id, /^bkg-/);
  assert.match(result.refCode, /^KMITL-/);
});

test('BookingService rejects conflicts before writing to repository', async () => {
  let createWasCalled = false;
  const bookingRepository = {
    findConflict: async () => ({ id: 'existing-booking' }),
    create: async () => { createWasCalled = true; },
  };
  const roomRepository = { exists: async () => true };
  const service = new BookingService(bookingRepository, roomRepository);

  await assert.rejects(
    () => service.create('authenticated-user', validBooking),
    error => error.statusCode === 409 && error.message === 'ช่วงเวลานี้ถูกจองแล้ว',
  );
  assert.equal(createWasCalled, false);
});
