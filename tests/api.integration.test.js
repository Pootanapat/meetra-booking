import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createApplication } from '../server.js';

let application;
let server;
let baseUrl;

const request = async (path, { cookie, body, ...options } = {}) => {
  const headers = new Headers(options.headers || {});
  if (cookie) headers.set('Cookie', cookie);
  if (body !== undefined) headers.set('Content-Type', 'application/json');
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  return { response, data: text ? JSON.parse(text) : null };
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
  const cookie = login.response.headers.get('set-cookie')?.split(';')[0];
  assert.match(cookie, /^meetra_session=/);
  assert.match(login.response.headers.get('set-cookie'), /HttpOnly/i);
  assert.match(login.response.headers.get('set-cookie'), /SameSite=Strict/i);
  return { user: login.data.user, cookie };
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
  const created = await request('/api/bookings', {
    method: 'POST', cookie: first.cookie, body: booking,
  });
  assert.equal(created.response.status, 201);
  assert.notEqual(created.data.id, booking.id);
  const createdBookingPath = `/api/bookings/${created.data.id}`;
  assert.equal((await request('/api/bookings', {
    method: 'POST', cookie: second.cookie,
    body: { ...booking, id: 'booking-conflict', refCode: 'KMITL-10002', startTime: '09:30', endTime: '10:30' },
  })).response.status, 409);
  assert.equal((await request('/api/bookings', {
    method: 'POST', cookie: first.cookie,
    body: { ...booking, id: 'booking-two', refCode: 'KMITL-10003', startTime: '11:00', endTime: '12:00' },
  })).response.status, 201);

  const firstBookings = await request('/api/bookings', { cookie: first.cookie });
  assert.equal(firstBookings.data.length, 2);
  assert.ok(firstBookings.data.every(item => item.userId === first.user.id));
  assert.deepEqual((await request('/api/bookings', { cookie: second.cookie })).data, []);

  const update = { date: '2099-12-31', startTime: '10:00', endTime: '11:00', purpose: 'แก้ไขแล้ว' };
  assert.equal((await request(createdBookingPath, {
    method: 'PUT', cookie: second.cookie, body: update,
  })).response.status, 404);
  assert.equal((await request(createdBookingPath, {
    method: 'PUT', cookie: first.cookie,
    body: { ...update, startTime: '10:30', endTime: '11:30' },
  })).response.status, 409);
  assert.equal((await request(createdBookingPath, {
    method: 'PUT', cookie: first.cookie, body: update,
  })).response.status, 200);
  assert.equal((await request(`${createdBookingPath}/cancel`, {
    method: 'PATCH', cookie: second.cookie,
  })).response.status, 404);
  assert.equal((await request(`${createdBookingPath}/cancel`, {
    method: 'PATCH', cookie: first.cookie,
  })).response.status, 200);
});

test('validation rejects past, outside-hours, and invalid time ranges', async () => {
  const session = await registerAndLogin('ผู้ทดสอบ', 'validation@example.com');
  const baseBooking = { roomId: 'room-101', date: '2099-12-31', startTime: '09:00', endTime: '10:00' };
  assert.equal((await request('/api/bookings', {
    method: 'POST', cookie: session.cookie, body: { ...baseBooking, startTime: '10:00', endTime: '09:00' },
  })).response.status, 400);
  assert.equal((await request('/api/bookings', {
    method: 'POST', cookie: session.cookie, body: { ...baseBooking, startTime: '06:30' },
  })).response.status, 400);
  assert.equal((await request('/api/bookings', {
    method: 'POST', cookie: session.cookie, body: { ...baseBooking, date: '2020-01-01' },
  })).response.status, 400);
  assert.equal((await request('/api/bookings', {
    method: 'POST', cookie: session.cookie, body: { ...baseBooking, date: '2099-02-30' },
  })).response.status, 400);
  assert.equal((await request('/api/bookings', {
    method: 'POST', cookie: session.cookie, body: { ...baseBooking, startTime: '09:99' },
  })).response.status, 400);
  assert.equal((await request('/api/bookings', {
    method: 'POST', cookie: session.cookie, body: { ...baseBooking, purpose: 'x'.repeat(501) },
  })).response.status, 400);
});

test('statistics require authentication and exclude private purpose text', async () => {
  assert.equal((await request('/api/statistics')).response.status, 401);
  const session = await registerAndLogin('ผู้ดูสถิติ', 'statistics@example.com');
  const statistics = await request('/api/statistics', { cookie: session.cookie });
  assert.equal(statistics.response.status, 200);
  assert.ok(statistics.data.bookings.every(booking => !Object.hasOwn(booking, 'purpose')));
});

test('logout revokes the server session', async () => {
  const session = await registerAndLogin('ผู้ทดสอบออกจากระบบ', 'logout@example.com');
  assert.equal((await request('/api/bookings', { cookie: session.cookie })).response.status, 200);
  assert.equal((await request('/api/logout', {
    method: 'POST', cookie: session.cookie,
  })).response.status, 204);
  assert.equal((await request('/api/bookings', { cookie: session.cookie })).response.status, 401);
});

test('login rate limiter blocks repeated failures', async () => {
  const login = () => request('/api/login', {
    method: 'POST', body: { email: 'brute-force@example.com', password: 'wrong-password' },
  });
  for (let attempt = 0; attempt < 5; attempt += 1) {
    assert.equal((await login()).response.status, 401);
  }
  assert.equal((await login()).response.status, 429);
});

test('concurrent requests cannot double-book the same room and time', async () => {
  const session = await registerAndLogin('ผู้ทดสอบพร้อมกัน', 'concurrent@example.com');
  const booking = {
    roomId: 'room-lab-b', date: '2099-12-30', startTime: '13:00', endTime: '14:00', purpose: 'race test',
  };
  const results = await Promise.all([
    request('/api/bookings', { method: 'POST', cookie: session.cookie, body: booking }),
    request('/api/bookings', { method: 'POST', cookie: session.cookie, body: booking }),
  ]);
  assert.deepEqual(results.map(result => result.response.status).sort(), [201, 409]);
});

test('database and source files are not exposed as static assets', async () => {
  const health = await request('/api/health');
  assert.equal(health.response.status, 200);
  assert.deepEqual(health.data, { status: 'ok' });
  assert.match(health.response.headers.get('content-security-policy'), /default-src 'self'/);
  assert.equal(health.response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal((await fetch(`${baseUrl}/kmitl_booking.db`)).status, 404);
  assert.equal((await fetch(`${baseUrl}/server.js`)).status, 404);
});

test('production mode enables HSTS and Secure session cookies', async () => {
  const productionApplication = await createApplication({
    databaseFilename: ':memory:', staticDirectory: null, production: true,
  });
  const productionServer = productionApplication.app.listen(0);
  await new Promise(resolve => productionServer.once('listening', resolve));
  const productionUrl = `http://127.0.0.1:${productionServer.address().port}`;
  try {
    const registerResponse = await fetch(`${productionUrl}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Production User', email: 'production@example.com', password: 'secure-password' }),
    });
    assert.equal(registerResponse.status, 201);
    assert.match(registerResponse.headers.get('strict-transport-security'), /max-age=31536000/);

    const loginResponse = await fetch(`${productionUrl}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'production@example.com', password: 'secure-password' }),
    });
    assert.equal(loginResponse.status, 200);
    assert.match(loginResponse.headers.get('set-cookie'), /Secure/i);
  } finally {
    await new Promise((resolve, reject) => productionServer.close(error => error ? reject(error) : resolve()));
    await productionApplication.close();
  }
});
