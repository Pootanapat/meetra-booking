import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createApplication } from '../server.js';

let application;
let server;
let baseUrl;

const request = async (path, { token, body, ...options } = {}) => {
  const headers = new Headers(options.headers || {});
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (body !== undefined) headers.set('Content-Type', 'application/json');
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { response, data: await response.json() };
};

const registerAndLogin = async (name, email) => {
  const registration = await request('/api/register', {
    method: 'POST', body: { name, email, password: 'secure-password' },
  });
  assert.equal(registration.response.status, 201);
  const login = await request('/api/login', {
    method: 'POST', body: { email, password: 'secure-password' },
  });
  assert.equal(login.response.status, 200);
  return login.data;
};

before(async () => {
  application = await createApplication({ databaseFilename: ':memory:', staticDirectory: null });
  server = application.app.listen(0);
  await new Promise(resolve => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  await application.close();
});

test('booking API enforces authentication, conflicts, ownership, edit, and cancel', async () => {
  assert.equal((await request('/api/bookings')).response.status, 401);
  const first = await registerAndLogin('ผู้ใช้คนที่หนึ่ง', 'first@example.com');
  const second = await registerAndLogin('ผู้ใช้คนที่สอง', 'second@example.com');
  const booking = {
    id: 'booking-one', refCode: 'KMITL-10001', roomId: 'room-101', userId: second.user.id,
    date: '2099-12-31', startTime: '09:00', endTime: '10:00', purpose: 'ทดสอบระบบ',
  };
  assert.equal((await request('/api/bookings', {
    method: 'POST', token: first.token, body: booking,
  })).response.status, 201);
  assert.equal((await request('/api/bookings', {
    method: 'POST', token: second.token,
    body: { ...booking, id: 'booking-conflict', refCode: 'KMITL-10002', startTime: '09:30', endTime: '10:30' },
  })).response.status, 409);
  assert.equal((await request('/api/bookings', {
    method: 'POST', token: first.token,
    body: { ...booking, id: 'booking-two', refCode: 'KMITL-10003', startTime: '11:00', endTime: '12:00' },
  })).response.status, 201);

  const firstBookings = await request('/api/bookings', { token: first.token });
  assert.equal(firstBookings.data.length, 2);
  assert.ok(firstBookings.data.every(item => item.userId === first.user.id));
  assert.deepEqual((await request('/api/bookings', { token: second.token })).data, []);

  const update = { date: '2099-12-31', startTime: '10:00', endTime: '11:00', purpose: 'แก้ไขแล้ว' };
  assert.equal((await request('/api/bookings/booking-one', {
    method: 'PUT', token: second.token, body: update,
  })).response.status, 404);
  assert.equal((await request('/api/bookings/booking-one', {
    method: 'PUT', token: first.token,
    body: { ...update, startTime: '10:30', endTime: '11:30' },
  })).response.status, 409);
  assert.equal((await request('/api/bookings/booking-one', {
    method: 'PUT', token: first.token, body: update,
  })).response.status, 200);
  assert.equal((await request('/api/bookings/booking-one/cancel', {
    method: 'PATCH', token: second.token,
  })).response.status, 404);
  assert.equal((await request('/api/bookings/booking-one/cancel', {
    method: 'PATCH', token: first.token,
  })).response.status, 200);
});

test('validation rejects past, outside-hours, and invalid time ranges', async () => {
  const session = await registerAndLogin('ผู้ทดสอบ', 'validation@example.com');
  const baseBooking = { roomId: 'room-101', date: '2099-12-31', startTime: '09:00', endTime: '10:00' };
  assert.equal((await request('/api/bookings', {
    method: 'POST', token: session.token, body: { ...baseBooking, startTime: '10:00', endTime: '09:00' },
  })).response.status, 400);
  assert.equal((await request('/api/bookings', {
    method: 'POST', token: session.token, body: { ...baseBooking, startTime: '06:30' },
  })).response.status, 400);
  assert.equal((await request('/api/bookings', {
    method: 'POST', token: session.token, body: { ...baseBooking, date: '2020-01-01' },
  })).response.status, 400);
});

test('database and source files are not exposed as static assets', async () => {
  const health = await request('/api/health');
  assert.equal(health.response.status, 200);
  assert.deepEqual(health.data, { status: 'ok' });
  assert.equal((await fetch(`${baseUrl}/kmitl_booking.db`)).status, 404);
  assert.equal((await fetch(`${baseUrl}/server.js`)).status, 404);
});
