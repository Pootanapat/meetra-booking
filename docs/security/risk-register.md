# Security Risk Register

คะแนนความเสี่ยงใช้ `Likelihood × Impact` โดย 1–4 = Low, 5–9 = Medium,
10–16 = High และ 17–25 = Critical

| ID | ความเสี่ยง | L | I | Score | มาตรการที่ทำในโค้ด | สถานะ / Residual risk |
|---|---|---:|---:|---:|---|---|
| R-01 | Stored XSS จาก Purpose | 4 | 5 | 20 | Encode ค่า Dynamic ก่อนใส่ `innerHTML`, จำกัด Purpose 500 ตัว, CSP | Mitigated; CSP ยังต้องใช้ `unsafe-inline` จนกว่าจะย้าย Inline scripts |
| R-02 | Token ใน Web Storage ถูกขโมย | 3 | 5 | 15 | Token ย้ายเป็น `HttpOnly`, `SameSite=Strict`, `Secure` cookie ใน Production | Mitigated; ต้อง Deploy ผ่าน HTTPS |
| R-03 | Brute-force Login | 4 | 4 | 16 | จำกัด 5 ครั้งต่อ IP+Email ภายใน 15 นาที | Mitigated สำหรับ Single instance; Production หลาย instance ควรใช้ Redis |
| R-04 | ไม่มี Security headers | 3 | 4 | 12 | CSP, HSTS Production, nosniff, DENY frame, Referrer/Permissions policy | Mitigated; ลด `unsafe-inline` เป็นงาน Refactor ถัดไป |
| R-05 | Tailwind CDN / Supply chain | 2 | 4 | 8 | Build Tailwind v4 ภายใน Vite และล็อก Version ใน lockfile | Mitigated |
| R-06 | Session ไม่ถูก Revoke เมื่อ Logout | 3 | 3 | 9 | `POST /api/logout` ลบ Token hash ใน SQLite และล้าง Cookie | Mitigated |
| R-07 | Statistics เปิดเผย Purpose | 3 | 3 | 9 | Endpoint ต้อง Authentication และ Query ไม่ส่ง Purpose | Mitigated |
| R-08 | วันที่/เวลาไม่ถูกต้อง | 3 | 3 | 9 | ตรวจ Calendar date จริง, เวลา `HH:MM`, นาที 00–59 และความยาวข้อความ | Mitigated |
| R-09 | Double booking จาก Race condition | 3 | 4 | 12 | Serialize write และใช้ `BEGIN IMMEDIATE` ครอบ Conflict check + write | Mitigated; Multi-service ต้องใช้ DB กลางที่รองรับ Transaction |
| R-10 | SQLite สูญหาย | 3 | 5 | 15 | Railway Volume, Online backup script, guarded restore และ Restore drill | Reduced; ต้องตั้ง Schedule/Offsite retention ใน Hosting จริง |

## Risk acceptance

ความเสี่ยง High/Critical ที่ยัง Open ต้องมีผู้อนุมัติ เหตุผล วันหมดอายุ
Compensating control และ Issue/PR ติดตาม ห้ามผู้พัฒนาคนเดียวเปลี่ยนเป็น Accepted
