import assert from 'node:assert/strict';
import test from 'node:test';
import { BookingPolicy } from '../public/js/booking/BookingPolicy.js';
import { BookingApiClient } from '../public/js/booking/BookingApiClient.js';
import { RoomFilterPolicy } from '../public/js/booking/RoomFilterPolicy.js';

test('BookingPolicy detects overlap and allows adjacent time slots', () => {
  const policy = new BookingPolicy();
  const bookings = [{
    id: 'existing', roomId: 'room-101', date: '2099-12-31',
    startTime: '09:00', endTime: '10:00', status: 'approved',
  }];

  assert.equal(policy.checkConflict({
    roomId: 'room-101', date: '2099-12-31', startTime: '09:30', endTime: '10:30', bookings,
  }).hasConflict, true);
  assert.equal(policy.checkConflict({
    roomId: 'room-101', date: '2099-12-31', startTime: '10:00', endTime: '11:00', bookings,
  }).hasConflict, false);
});

test('BookingPolicy reports room availability without DOM dependencies', () => {
  const policy = new BookingPolicy();
  const status = policy.getRoomStatus({
    roomId: 'room-101',
    date: '2099-12-31',
    bookings: [{
      id: 'full-day', roomId: 'room-101', date: '2099-12-31',
      startTime: '07:00', endTime: '17:00', status: 'approved',
    }],
  });
  assert.equal(status.status, 'booked');
  assert.equal(status.isFullDay, true);
});

test('BookingApiClient uses injected fetch dependencies', async () => {
  const calls = [];
  const fakeFetch = async (url, options) => {
    calls.push({ url, options });
    return { ok: true, json: async () => [{ id: 'room-101' }] };
  };
  const client = new BookingApiClient({ publicFetch: fakeFetch, authenticatedFetch: fakeFetch });

  const { data } = await client.listRooms();

  assert.deepEqual(data, [{ id: 'room-101' }]);
  assert.equal(calls[0].url, '/api/rooms');
});

test('BookingPolicy marks past and booked timeline slots', () => {
  const slots = new BookingPolicy().buildTimeline({
    roomId: 'room-101',
    date: '2099-12-31',
    now: new Date('2099-12-31T08:15:00'),
    bookings: [{
      id: 'existing', roomId: 'room-101', date: '2099-12-31',
      startTime: '09:00', endTime: '10:00', status: 'approved',
    }],
  });

  assert.equal(slots.find(slot => slot.startTime === '07:00').status, 'past');
  assert.equal(slots.find(slot => slot.startTime === '09:00').status, 'booked');
  assert.equal(slots.find(slot => slot.startTime === '10:00').status, 'available');
});

test('RoomFilterPolicy combines capacity, equipment, building, and query filters', () => {
  const policy = new RoomFilterPolicy();
  const rooms = [
    { name: 'ห้อง A', capacity: 10, location: 'ชั้น 1 อาคารเรียนรวม', equipment: 'โปรเจกเตอร์, Wi-Fi', description: '' },
    { name: 'ห้อง B', capacity: 30, location: 'ชั้น 2 อาคารหอประชุม', equipment: 'ไมโครโฟน', description: '' },
  ];

  assert.deepEqual(policy.filter(rooms, {
    query: 'ห้อง', capacity: 'small', equipment: 'Wi-Fi', building: 'อาคารเรียนรวม',
  }), [rooms[0]]);
  assert.deepEqual(
    new Set(policy.getEquipmentOptions(rooms)),
    new Set(['Wi-Fi', 'โปรเจกเตอร์', 'ไมโครโฟน']),
  );
});

