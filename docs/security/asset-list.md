# Asset list

## ระดับการจัดชั้นข้อมูล

| ระดับ | ความหมาย | ตัวอย่าง |
|---|---|---|
| Restricted | รั่วไหลแล้วอาจนำไปยึดบัญชีหรือเข้าถึงระบบ | Password hash, salt, session token/hash |
| Confidential | ข้อมูลส่วนบุคคลหรือข้อมูลกิจกรรมภายใน | ชื่อ, email, booking purpose |
| Internal | ข้อมูลที่ใช้ดำเนินงานแต่ไม่ควรให้แก้โดยไม่ได้รับอนุญาต | Booking, audit/deploy logs |
| Public | เปิดเผยได้ตามวัตถุประสงค์ระบบ | ชื่อห้อง, ความจุ, ช่วงเวลาว่างแบบไม่ระบุตัวตน |

## Assets

| Asset ID | Asset | Classification | CIA priority | ที่จัดเก็บ/ประมวลผล | Owner | Threats หลัก |
|---|---|---|---|---|---|---|
| A-01 | Password hash และ salt | Restricted | C: High, I: High, A: Medium | SQLite `users` | Backend lead | T-01, T-04, T-08 |
| A-02 | Session token ใน Browser | Restricted | C: High, I: High, A: Medium | `localStorage` | Frontend/Auth | T-02, T-13 |
| A-03 | Session token hash/expiry | Restricted | C: High, I: High, A: Medium | SQLite `sessions` | Backend lead | T-02, T-04, T-08 |
| A-04 | User identity: name/email/role | Confidential | C: High, I: High, A: Medium | SQLite `users` | Project owner | T-04, T-07, T-08 |
| A-05 | Booking record และ purpose | Confidential | C: Medium, I: High, A: High | SQLite `bookings` | Booking owner | T-03, T-05, T-06, T-07 |
| A-06 | Room master data | Public/Internal | C: Low, I: High, A: High | SQLite `rooms` | Data manager | T-04, T-11 |
| A-07 | SQLite database file | Restricted | C: High, I: High, A: High | `data/kmitl_booking.db` / Volume | DevOps | T-08, T-11 |
| A-08 | Source code และ Git history | Internal | C: Medium, I: High, A: Medium | GitHub | Team lead | T-08, T-14 |
| A-09 | CI/CD configuration และ secrets | Restricted | C: High, I: High, A: High | GitHub/Railway | DevOps | T-14 |
| A-10 | Build artifact `dist/` | Public | C: Low, I: High, A: High | Hosting service | DevOps | T-08, T-14 |
| A-11 | Security/audit logs | Confidential | C: Medium, I: High, A: Medium | Hosting/GitHub | QA/DevOps | T-06, T-10 |
| A-12 | Service availability และชื่อเสียงทีม | Business critical | C: N/A, I: Medium, A: High | ทั้งระบบ | Project manager | T-05, T-10, T-11, T-14 |

## Data retention baseline

| ข้อมูล | ข้อเสนอการเก็บรักษา | วิธีทำลาย/หมดอายุ |
|---|---|---|
| Session | 24 ชั่วโมงตามระบบปัจจุบัน | ลบเมื่อ Logout/หมดอายุ และทำ cleanup เป็นระยะ |
| Active booking | ตามระยะเวลาที่โครงการต้องใช้ | กำหนด retention ก่อนใช้งานจริง |
| Cancelled booking | เก็บเพื่อ audit ตามเวลาที่กำหนด | ลบหรือ anonymize เมื่อครบกำหนด |
| Application logs | 30–90 วันสำหรับงานสาธิต | Rotate และลบอัตโนมัติ |
| Backup | อย่างน้อย 7 วันสำหรับงานสาธิต | Encryption และ automatic expiry |

> ระยะเวลาในตารางเป็น Baseline ที่ต้องได้รับการอนุมัติจาก Project Manager ก่อนใช้จริง

