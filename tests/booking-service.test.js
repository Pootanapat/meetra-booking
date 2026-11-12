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
    createIfAvailable: async booking => { savedBooking = booking; return true; },
  };
  const roomRepository = { exists: async roomId => roomId === 'room-101' };
  const service = new BookingService(bookingRepository, roomRepository);

  const result = await service.create('authenticated-user', validBooking);

  assert.equal(savedBooking.userId, 'authenticated-user');
  assert.equal(savedBooking.roomId, 'room-101');
  assert.match(result.id, /^bkg-/);
  assert.match(result.refCode, /^KMITL-/);
});

test('BookingService maps an atomic repository conflict to HTTP 409', async () => {
  let atomicCreateWasCalled = false;
  const bookingRepository = {
    createIfAvailable: async () => { atomicCreateWasCalled = true; return false; },
  };
  const roomRepository = { exists: async () => true };
  const service = new BookingService(bookingRepository, roomRepository);

  await assert.rejects(
    () => service.create('authenticated-user', validBooking),
    error => error.statusCode === 409 && error.message === 'ช่วงเวลานี้ถูกจองแล้ว',
  );
  assert.equal(atomicCreateWasCalled, true);
});
