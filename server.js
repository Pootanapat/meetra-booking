import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_DATABASE_FILE = path.join(__dirname, 'data', 'kmitl_booking.db');
const DEFAULT_STATIC_DIRECTORY = path.join(__dirname, 'dist');
const SESSION_LIFETIME_MS = 24 * 60 * 60 * 1000;
const OPENING_MINUTES = 7 * 60;
const CLOSING_MINUTES = 17 * 60;

const ROOM_SEED = [
  ['room-101', 'ห้องประชุม 101 - อาคารเรียนรวม', 10, '1', 'ระบบ VDO Conference, Smart Board, โปรเจกเตอร์', 'ชั้น 1 อาคารเรียนรวม KMITL', '', 'ห้องประชุมขนาดกลาง พร้อมระบบ VDO Conference และ Smart Board'],
  ['room-lab-b', 'ห้องปฏิบัติการคอมพิวเตอร์ B', 30, '3', 'คอมพิวเตอร์ 30 เครื่อง, โปรเจกเตอร์, ระบบเสียง', 'ชั้น 3 คณะเทคโนโลยีสารสนเทศ', '', 'ห้องปฏิบัติการคอมพิวเตอร์ เหมาะสำหรับการอบรมเชิงปฏิบัติการ'],
  ['room-sem-b', 'ห้องสัมมนาใหญ่ B', 50, '2', 'เวที, ระบบเครื่องเสียง, ไมโครโฟนไร้สาย', 'ชั้น 2 อาคารหอประชุมใหญ่', '', 'ห้องสัมมนาพร้อมเวทีและระบบเสียง'],
  ['room-coworking', 'Co-Working Space Zone A', 15, '1', 'ปลั๊กไฟ, Wi-Fi ความเร็วสูง, โต๊ะทำงานกลุ่ม', 'ชั้น 1 สำนักหอสมุดกลาง', '', 'พื้นที่ทำงานกลุ่มแบบเป็นกันเอง'],
  ['room-mac-lab', 'ห้องปฏิบัติการ Mac Lab 402', 25, '4', 'iMac 25 เครื่อง, Adobe, ระบบเสียง', 'ชั้น 4 คณะเทคโนโลยีสารสนเทศ', '', 'ห้องปฏิบัติการ iMac สำหรับงานดีไซน์'],
];

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

const hashToken = token => crypto.createHash('sha256').update(token).digest('hex');
const hashPassword = (password, salt) => new Promise((resolve, reject) => {
  crypto.scrypt(password, salt, 64, (error, key) => {
    if (error) reject(error);
    else resolve(key.toString('hex'));
  });
});

async function initializeDatabase(database) {
  await database.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL, password_salt TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'student', created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, capacity INTEGER NOT NULL, floor TEXT,
      equipment TEXT, location TEXT, image TEXT, description TEXT
    );
    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY, ref_code TEXT NOT NULL, room_id TEXT NOT NULL, user_id TEXT NOT NULL,
      booking_date TEXT NOT NULL, start_time TEXT NOT NULL, end_time TEXT NOT NULL,
      purpose TEXT, status TEXT NOT NULL DEFAULT 'approved', created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (room_id) REFERENCES rooms(id), FOREIGN KEY (user_id) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL, expires_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);
  const insertRoom = await database.prepare(`INSERT OR IGNORE INTO rooms
    (id, name, capacity, floor, equipment, location, image, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
  try {
    for (const room of ROOM_SEED) await insertRoom.run(...room);
  } finally {
    await insertRoom.finalize();
  }
}

const validateBookingInput = ({ roomId, date, startTime, endTime }) => {
  if (!roomId || !/^\d{4}-\d{2}-\d{2}$/.test(date ?? '')) return 'กรุณาระบุห้องและวันที่ให้ถูกต้อง';
  if (date < localDate()) return 'ไม่สามารถจองวันที่ย้อนหลังได้';
  const start = minutesFromTime(startTime);
  const end = minutesFromTime(endTime);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 'รูปแบบเวลาไม่ถูกต้อง';
  if (start < OPENING_MINUTES || end > CLOSING_MINUTES) return 'เวลาจองต้องอยู่ระหว่าง 07:00–17:00 น.';
  if (start >= end) return 'เวลาเริ่มต้องน้อยกว่าเวลาสิ้นสุด';
  return null;
};

const findConflict = (database, { roomId, date, startTime, endTime, excludeId = null }) => database.get(`
  SELECT id FROM bookings
  WHERE room_id = ? AND booking_date = ? AND status != 'cancelled'
    AND start_time < ? AND end_time > ? AND (? IS NULL OR id != ?)
  LIMIT 1
`, [roomId, date, endTime, startTime, excludeId, excludeId]);

export async function createApplication({
  databaseFilename = process.env.DATABASE_FILE || DEFAULT_DATABASE_FILE,
  staticDirectory = DEFAULT_STATIC_DIRECTORY,
} = {}) {
  if (databaseFilename !== ':memory:') await fs.mkdir(path.dirname(databaseFilename), { recursive: true });
  const database = await open({ filename: databaseFilename, driver: sqlite3.Database });
  await initializeDatabase(database);
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '32kb' }));

  const requireAuthentication = async (request, response, next) => {
    try {
      const authorization = request.get('authorization') ?? '';
      const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
      if (!token) return response.status(401).json({ error: 'กรุณาเข้าสู่ระบบ' });
      const session = await database.get(`SELECT u.id, u.name, u.email, u.role
        FROM sessions s JOIN users u ON u.id = s.user_id
        WHERE s.token_hash = ? AND s.expires_at > ?`, [hashToken(token), Date.now()]);
      if (!session) return response.status(401).json({ error: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่' });
      request.user = session;
      return next();
    } catch (error) {
      return next(error);
    }
  };

  app.post('/api/register', async (request, response, next) => {
    try {
      const name = String(request.body.name ?? '').trim();
      const email = String(request.body.email ?? '').trim().toLowerCase();
      const password = String(request.body.password ?? '');
      if (!name || !/^\S+@\S+\.\S+$/.test(email) || password.length < 6) {
        return response.status(400).json({ error: 'กรุณากรอกชื่อ อีเมล และรหัสผ่านอย่างน้อย 6 ตัวอักษร' });
      }
      if (await database.get('SELECT id FROM users WHERE email = ?', [email])) {
        return response.status(409).json({ error: 'อีเมลนี้ถูกใช้งานแล้ว' });
      }
      const salt = crypto.randomBytes(16).toString('hex');
      const passwordHash = await hashPassword(password, salt);
      await database.run('INSERT INTO users (id, name, email, password_hash, password_salt) VALUES (?, ?, ?, ?, ?)',
        [crypto.randomUUID(), name, email, passwordHash, salt]);
      return response.status(201).json({ success: true });
    } catch (error) {
      return next(error);
    }
  });

  app.post('/api/login', async (request, response, next) => {
    try {
      const email = String(request.body.email ?? '').trim().toLowerCase();
      const password = String(request.body.password ?? '');
      const account = await database.get('SELECT * FROM users WHERE email = ?', [email]);
      if (!account || await hashPassword(password, account.password_salt) !== account.password_hash) {
        return response.status(401).json({ error: 'ไม่พบบัญชีหรือรหัสผ่านไม่ถูกต้อง' });
      }
      const token = crypto.randomBytes(32).toString('base64url');
      await database.run('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)',
        [hashToken(token), account.id, Date.now() + SESSION_LIFETIME_MS]);
      return response.json({ success: true, token,
        user: { id: account.id, name: account.name, email: account.email, role: account.role } });
    } catch (error) {
      return next(error);
    }
  });

  app.get('/api/rooms', async (_request, response, next) => {
    try { return response.json(await database.all('SELECT * FROM rooms ORDER BY id')); }
    catch (error) { return next(error); }
  });

  app.get('/api/availability', async (_request, response, next) => {
    try {
      return response.json(await database.all(`SELECT id, room_id AS roomId, booking_date AS date,
        start_time AS startTime, end_time AS endTime, status FROM bookings WHERE status != 'cancelled'`));
    } catch (error) { return next(error); }
  });

  app.get('/api/statistics', async (_request, response, next) => {
    try {
      const rooms = await database.all('SELECT id, name FROM rooms ORDER BY id');
      const bookings = await database.all(`SELECT b.id, b.room_id AS roomId, b.booking_date AS date,
        b.start_time AS startTime, b.end_time AS endTime, b.purpose, b.status, r.name AS roomName
        FROM bookings b JOIN rooms r ON r.id = b.room_id ORDER BY b.created_at DESC`);
      return response.json({ rooms, bookings });
    } catch (error) { return next(error); }
  });

  app.get('/api/bookings', requireAuthentication, async (request, response, next) => {
    try {
      return response.json(await database.all(`SELECT b.id, b.ref_code AS refCode, b.room_id AS roomId,
        b.user_id AS userId, b.booking_date AS date, b.start_time AS startTime, b.end_time AS endTime,
        b.purpose, b.status, r.name AS roomName, r.location, r.image, r.capacity,
        u.name AS userName, u.email AS userEmail FROM bookings b
        JOIN rooms r ON b.room_id = r.id JOIN users u ON b.user_id = u.id
        WHERE b.user_id = ? ORDER BY b.created_at DESC`, [request.user.id]));
    } catch (error) { return next(error); }
  });

  app.post('/api/bookings', requireAuthentication, async (request, response, next) => {
    try {
      const booking = request.body;
      const validationError = validateBookingInput(booking);
      if (validationError) return response.status(400).json({ error: validationError });
      if (!await database.get('SELECT id FROM rooms WHERE id = ?', [booking.roomId])) {
        return response.status(404).json({ error: 'ไม่พบห้องประชุม' });
      }
      if (await findConflict(database, booking)) return response.status(409).json({ error: 'ช่วงเวลานี้ถูกจองแล้ว' });
      const id = booking.id || `bkg-${crypto.randomUUID()}`;
      const refCode = booking.refCode || `KMITL-${crypto.randomInt(10000, 100000)}`;
      await database.run(`INSERT INTO bookings
        (id, ref_code, room_id, user_id, booking_date, start_time, end_time, purpose)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, refCode, booking.roomId, request.user.id, booking.date, booking.startTime, booking.endTime, String(booking.purpose ?? '').trim()]);
      return response.status(201).json({ success: true, id, refCode });
    } catch (error) { return next(error); }
  });

  app.put('/api/bookings/:id', requireAuthentication, async (request, response, next) => {
    try {
      const existing = await database.get('SELECT * FROM bookings WHERE id = ? AND user_id = ?',
        [request.params.id, request.user.id]);
      if (!existing) return response.status(404).json({ error: 'ไม่พบรายการจอง' });
      if (existing.status === 'cancelled') return response.status(409).json({ error: 'ไม่สามารถแก้ไขรายการที่ยกเลิกแล้ว' });
      const updated = { roomId: existing.room_id, date: request.body.date,
        startTime: request.body.startTime, endTime: request.body.endTime, excludeId: existing.id };
      const validationError = validateBookingInput(updated);
      if (validationError) return response.status(400).json({ error: validationError });
      if (await findConflict(database, updated)) return response.status(409).json({ error: 'ช่วงเวลานี้ถูกจองแล้ว' });
      await database.run(`UPDATE bookings SET booking_date = ?, start_time = ?, end_time = ?, purpose = ?
        WHERE id = ? AND user_id = ?`,
      [updated.date, updated.startTime, updated.endTime, String(request.body.purpose ?? '').trim(), existing.id, request.user.id]);
      return response.json({ success: true });
    } catch (error) { return next(error); }
  });

  app.patch('/api/bookings/:id/cancel', requireAuthentication, async (request, response, next) => {
    try {
      const result = await database.run(`UPDATE bookings SET status = 'cancelled'
        WHERE id = ? AND user_id = ? AND status != 'cancelled'`, [request.params.id, request.user.id]);
      if (result.changes === 0) return response.status(404).json({ error: 'ไม่พบรายการจอง' });
      return response.json({ success: true });
    } catch (error) { return next(error); }
  });

  app.use((error, _request, response, _next) => {
    console.error(error);
    response.status(500).json({ error: 'เกิดข้อผิดพลาดภายในระบบ' });
  });

  if (staticDirectory) app.use(express.static(staticDirectory, { dotfiles: 'deny', index: 'index.html' }));
  return { app, database, close: () => database.close() };
}

export async function startServer(options = {}) {
  const port = Number(options.port ?? process.env.PORT ?? 3000);
  const application = await createApplication(options);
  const server = application.app.listen(port, () => console.log(`Meetra Booking running at http://localhost:${port}`));
  return { ...application, server };
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  startServer().catch(error => { console.error(error); process.exitCode = 1; });
}
