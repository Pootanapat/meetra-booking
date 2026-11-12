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

## ฟีเจอร์หลัก

- ค้นหาและกรองห้องแบบ Real-time ตามความจุ อุปกรณ์ และอาคาร
- เลือกช่วงเวลาจองจาก Timeline ครั้งละ 30 นาที พร้อมสถานะว่าง จองแล้ว และเวลาที่ผ่านไปแล้ว
- สร้าง แก้ไข และยกเลิกการจอง โดย Server ตรวจเวลาชนและเจ้าของรายการ
- Export รายการจองเป็นไฟล์ `.ics` สำหรับ Google Calendar และ Outlook
- ดูสถิติและข้อมูลห้องจาก API/SQLite แหล่งเดียว

## CI/CD และ Deploy

- GitHub Actions รัน clean install, build, tests และ dependency audit ทุก PR/main
- `Dockerfile` ใช้สำหรับสร้าง Production image แบบทำซ้ำได้
- Railway ใช้ `/api/health` เป็น Healthcheck และต้อง mount Volume ที่ `/app/data`
- ขั้นตอนติดตั้งและหลักฐานอยู่ใน [`docs/deployment.md`](docs/deployment.md)

## สถาปัตยกรรม

- `server.js` — Composition Root สำหรับประกอบ Dependency
- `server/controllers/` — HTTP request/response handlers
- `server/services/` — Authentication, validation, ownership และ business rules
- `server/repositories/` — การเข้าถึงข้อมูล SQLite
- `public/js/common.js` — session และ API helper ฝั่ง browser
- `public/js/booking/BookingApiClient.js` — API gateway ของหน้าจอง
- `public/js/booking/BookingPolicy.js` — กฎสถานะห้องและตรวจเวลาชนแบบ Pure JavaScript
- `public/js/booking/RoomFilterPolicy.js` — กฎกรองห้องและสร้างตัวเลือกอุปกรณ์/อาคาร
- `public/js/booking/BookingPageController.js` — Event และ UI orchestration
- `public/js/calendar/IcsExporter.js` — สร้างและดาวน์โหลดไฟล์ปฏิทิน `.ics`
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
