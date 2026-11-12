import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// เปิดใช้งานฐานข้อมูล SQLite (สร้างไฟล์ kmitl_booking.db ให้อัตโนมัติ)
const db = await open({
    filename: path.join(__dirname, 'kmitl_booking.db'),
    driver: sqlite3.Database
});

// สร้างตารางและเพิ่มข้อมูลห้องประชุมเริ่มต้นอัตโนมัติ
await db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'student',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS rooms (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        capacity INTEGER NOT NULL,
        floor TEXT,
        equipment TEXT,
        location TEXT,
        image TEXT,
        description TEXT
    );

    CREATE TABLE IF NOT EXISTS bookings (
        id TEXT PRIMARY KEY,
        ref_code TEXT NOT NULL,
        room_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        booking_date TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        purpose TEXT,
        status TEXT DEFAULT 'approved',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    INSERT OR IGNORE INTO rooms (id, name, capacity, floor, equipment, location, image, description) VALUES
    ('room-101', 'ห้องประชุม 101 - อาคารเรียนรวม', 10, '1', 'ระบบ VDO Conference, Smart Board, โปรเจคเตอร์', 'ชั้น 1 อาคารเรียนรวม KMITL', 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80', 'ห้องประชุมขนาดกลาง พร้อมระบบ VDO Conference และ Smart Board'),
    ('room-lab-b', 'ห้องปฏิบัติการคอมพิวเตอร์ B', 30, '3', 'คอมพิวเตอร์ 30 เครื่อง, โปรเจคเตอร์, ระบบเสียง', 'ชั้น 3 คณะเทคโนโลยีสารสนเทศ', 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=600&q=80', 'ห้องปฏิบัติการคอมพิวเตอร์ 30 เครื่อง เหมาะสำหรับการอบรมเชิงปฏิบัติการ'),
    ('room-sem-b', 'ห้องสัมมนาใหญ่ B', 50, '2', 'เวที, ระบบเครื่องเสียง, ไมโครโฟนไร้สาย', 'ชั้น 2 อาคารหอประชุมใหญ่', 'https://images.unsplash.com/photo-1431540015161-0bf868a2d407?auto=format&fit=crop&w=600&q=80', 'ห้องสัมมนาพร้อมเวที ระบบเครื่องเสียง และไมโครโฟนไร้สายครบชุด'),
    ('room-coworking', 'Co-Working Space Zone A', 15, '1', 'ปลั๊กไฟ, Wi-Fi ความเร็วสูง, โต๊ะทำงานกลุ่ม', 'ชั้น 1 สำนักหอสมุดกลาง', 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80', 'พื้นที่ทำงานกลุ่มแบบเป็นกันเอง พร้อมปลั๊กไฟและ Wi-Fi ความเร็วสูง'),
    ('room-mac-lab', 'ห้องปฏิบัติการ Mac Lab 402', 25, '4', 'iMac 25 เครื่อง, ซอฟต์แวร์ Adobe, ระบบเสียง', 'ชั้น 4 คณะเทคโนโลยีสารสนเทศ', 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=600&q=80', 'ห้องปฏิบัติการ iMac สำหรับงานดีไซน์ ออกแบบ และตัดต่อสื่อประสม');
`);

// 1. API สมัครสมาชิก
app.post('/api/register', async (req, res) => {
    try {
        const { id, name, email, passwordHash } = req.body;
        const existing = await db.get('SELECT id FROM users WHERE email = ?', [email]);
        if (existing) {
            return res.status(400).json({ error: 'อีเมลนี้ถูกใช้งานแล้ว' });
        }
        await db.run(
            'INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)',
            [id, name, email, passwordHash]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. API เข้าสู่ระบบ
app.post('/api/login', async (req, res) => {
    try {
        const { email, passwordHash } = req.body;
        const user = await db.get(
            'SELECT id, name, email, role FROM users WHERE email = ? AND password_hash = ?',
            [email, passwordHash]
        );
        if (!user) {
            return res.status(401).json({ error: 'ไม่พบบัญชีหรือรหัสผ่านไม่ถูกต้อง' });
        }
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. API ดึงข้อมูลห้องประชุมทั้งหมด
app.get('/api/rooms', async (req, res) => {
    try {
        const rows = await db.all('SELECT * FROM rooms');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. API ดึงรายการจองทั้งหมด
app.get('/api/bookings', async (req, res) => {
    try {
        const rows = await db.all(`
            SELECT 
                b.id, b.ref_code AS refCode, b.room_id AS roomId, b.user_id AS userId,
                b.booking_date AS date,
                b.start_time AS startTime, b.end_time AS endTime,
                b.purpose, b.status,
                r.name AS roomName, r.location, r.image, r.capacity,
                u.name AS userName, u.email AS userEmail
            FROM bookings b
            JOIN rooms r ON b.room_id = r.id
            JOIN users u ON b.user_id = u.id
            ORDER BY b.created_at DESC
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. API สร้างรายการจองใหม่
app.post('/api/bookings', async (req, res) => {
    try {
        const { id, refCode, roomId, userId, date, startTime, endTime, purpose } = req.body;
        await db.run(
            `INSERT INTO bookings (id, ref_code, room_id, user_id, booking_date, start_time, end_time, purpose, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'approved')`,
            [id, refCode, roomId, userId, date, startTime, endTime, purpose]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 6. API ยกเลิกการจอง
app.patch('/api/bookings/:id/cancel', async (req, res) => {
    try {
        await db.run("UPDATE bookings SET status = 'cancelled' WHERE id = ?", [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server & SQLite Database running at http://localhost:${PORT}`);
});