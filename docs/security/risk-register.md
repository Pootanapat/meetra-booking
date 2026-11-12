# Security risk register

## วิธีให้คะแนน

- Likelihood: 1 Rare, 2 Unlikely, 3 Possible, 4 Likely, 5 Almost certain
- Impact: 1 Insignificant, 2 Minor, 3 Moderate, 4 Major, 5 Severe
- Risk score: `Likelihood × Impact`
- ระดับ: 1–4 Low, 5–9 Medium, 10–16 High, 17–25 Critical

## Register

| Risk ID | Threat | Asset | L | I | Score | ระดับ | Control ปัจจุบัน | Residual risk / งานถัดไป | Owner | สถานะ |
|---|---|---|---:|---:|---:|---|---|---|---|---|
| R-01 | Stored/DOM XSS ขโมย Session | A-02, A-04, A-05 | 4 | 5 | 20 | Critical | Encode Dynamic output, จำกัด Purpose 500 ตัว, CSP | ย้าย Inline scripts เพื่อตัด `unsafe-inline`; `SR-WEB-001/002` | Frontend | Mitigated |
| R-02 | Brute force และ scrypt resource exhaustion | A-01, A-12 | 4 | 4 | 16 | High | Generic error, จำกัด 5 ครั้งต่อ IP+Email ใน 15 นาที | หลาย Server instance ควรใช้ Redis; `SR-AUTH-004`, `SR-AVAIL-001` | Backend | Mitigated |
| R-03 | Token ใน Web Storage ถูกขโมย | A-02, A-03 | 3 | 5 | 15 | High | HttpOnly, SameSite=Strict และ Secure cookie ใน Production | ต้อง Deploy ผ่าน HTTPS; `SR-SES-003`, `SR-WEB-001` | Auth lead | Mitigated |
| R-04 | SQLite สูญหายหลัง Redeploy/เครื่องเสีย | A-05, A-07, A-12 | 3 | 5 | 15 | High | Railway Volume, Online backup, guarded restore และ Restore plan | ตั้ง Schedule และ Offsite retention; `SR-DATA-003` | DevOps | Reduced |
| R-05 | Concurrent requests สร้าง Double booking | A-05, A-12 | 3 | 4 | 12 | High | Serialized writes และ `BEGIN IMMEDIATE` ครอบ Check+Write | หลาย Service instance ควรใช้ DB กลาง; `SR-BOOK-002` | Backend | Mitigated |
| R-06 | Statistics เปิดข้อมูลเกินจำเป็น | A-04, A-05 | 3 | 3 | 9 | Medium | Require authentication และไม่ส่ง Purpose | รักษา Privacy regression test; `SR-PRIV-001` | Backend | Mitigated |
| R-07 | วันที่/เวลา/ข้อความผิดรูปแบบเข้า DB | A-05, A-06 | 3 | 3 | 9 | Medium | Strict calendar/time parser, business hours, length limits | เพิ่ม Schema validation หาก API โตขึ้น; `SR-VAL-001` | Backend | Mitigated |
| R-08 | Dependency/CDN หรือ Build chain ถูกโจมตี | A-08, A-09, A-10 | 2 | 4 | 8 | Medium | Local Tailwind build, lockfile, CI audit | เปิด Dependabot และ Protected main; `SR-SUP-001/002` | DevOps | Reduced |
| R-09 | ไม่มี Audit trail ทำให้ปฏิเสธการกระทำได้ | A-05, A-11 | 3 | 3 | 9 | Medium | มี `created_at` บางส่วน | เพิ่ม Structured security log; `SR-LOG-001` | Backend/QA | Open |
| R-10 | IDOR แก้หรือยกเลิกรายการผู้อื่น | A-05 | 2 | 5 | 10 | High | Auth + ownership query + tests | รักษา Regression tests; `SR-AUTHZ-001` | Backend | Mitigated |
| R-11 | SQL injection | A-01–A-07 | 1 | 5 | 5 | Medium | Parameterized SQL | Code review/security tests; `SR-DATA-001` | Backend | Mitigated |
| R-12 | DB/source ถูก Serve เป็น Static | A-01–A-10 | 1 | 5 | 5 | Medium | Serve `dist` เท่านั้น + tests | รักษา CI regression; `SR-DATA-002` | DevOps | Mitigated |
| R-13 | Credential/Token ถูกดักระหว่างส่ง | A-01–A-03 | 3 | 5 | 15 | High | Secure cookie และ HSTS ใน Production | Hosting ต้องบังคับ HTTPS; `SR-TRANS-001` | DevOps | Reduced |
| R-14 | Session ไม่ถูก Cleanup/Revoke | A-02, A-03 | 3 | 3 | 9 | Medium | Expiry check และ Logout API ลบ Token hash | เพิ่ม Cleanup job สำหรับ Session หมดอายุ; `SR-SES-002/003` | Backend | Mitigated |

## ลำดับงานคงเหลือ

1. ก่อน Deploy: บังคับ HTTPS, ตั้ง Backup schedule และเก็บ Backup นอก Volume หลัก
2. ก่อน Scale หลาย Instance: ย้าย Rate limit ไป Redis และใช้ฐานข้อมูลกลาง
3. Refactor ถัดไป: ย้าย Inline scripts/styles เพื่อเอา `unsafe-inline` ออกจาก CSP
4. เพิ่ม Structured security logging และ Session cleanup job

## Risk acceptance

Risk ระดับ High/Critical ที่ยัง Open ห้ามผู้พัฒนาคนเดียวเปลี่ยนเป็น Accepted ต้องระบุ
ผู้อนุมัติ เหตุผล วันหมดอายุ Compensating control และ Issue/PR ติดตาม
