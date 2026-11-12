# Meetra Booking

ระบบจองห้องประชุม KMITL สร้างด้วย HTML/JavaScript, Vite, Node.js, Express และ SQLite

## ติดตั้งและรัน

```bash
npm install
npm run build
npm start
```

เปิด `http://localhost:3000` ฐานข้อมูลจะถูกสร้างอัตโนมัติที่ `data/kmitl_booking.db`

## คำสั่ง

- `npm run dev` — build และเปิดเซิร์ฟเวอร์
- `npm run dev:frontend` — Vite dev server (เปิด `npm start` แยกเพื่อใช้ API)
- `npm run build` — สร้าง production files ใน `dist/`
- `npm start` — เปิด API และเว็บจาก `dist/`
- `npm test` — รัน API integration tests
- `npm run check` — build และ test ทั้งหมด

## สถาปัตยกรรม

- `server.js` — Composition Root สำหรับประกอบ Dependency
- `server/controllers/` — HTTP request/response handlers
- `server/services/` — Authentication, validation, ownership และ business rules
- `server/repositories/` — การเข้าถึงข้อมูล SQLite
- `public/js/common.js` — session และ API helper ฝั่ง browser
- `public/js/booking/BookingApiClient.js` — API gateway ของหน้าจอง
- `public/js/booking/BookingPolicy.js` — กฎสถานะห้องและตรวจเวลาชนแบบ Pure JavaScript
- `public/js/booking/BookingPageController.js` — Event และ UI orchestration
- `index.html` — ค้นหาและจองห้อง
- `my-bookings.html` — แก้ไขและยกเลิกการจองของผู้ใช้
- `rooms.html` — ดึงข้อมูลห้องจาก API
- `statistics.html` — สถิติจาก SQLite

Room ID และ Room data มีแหล่งหลักเพียงจุดเดียวคือ SQLite ผ่าน `/api/rooms`

ดู [Class Diagram และการประยุกต์ใช้ SOLID](docs/architecture/class-diagram.md)

## ความปลอดภัย

- Password ถูก hash ด้วย `scrypt` และ salt แยกรายผู้ใช้
- API แก้ไข/ยกเลิกตรวจเจ้าของรายการ
- ไฟล์ฐานข้อมูลไม่ถูก commit และไม่ถูก serve เป็น static file

เอกสาร Threat Model, DFD, Misuse Case, Asset List, Security Requirements,
Risk Register และ Traceability Matrix อยู่ที่
[`docs/security/README.md`](docs/security/README.md)
