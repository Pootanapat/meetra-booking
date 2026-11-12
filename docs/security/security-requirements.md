# Security requirements

## สถานะ

- **Implemented** — มีในโค้ดและมีหลักฐานตรวจสอบ
- **Partial** — มีบางส่วนแต่ยังไม่ครบ Acceptance Criteria
- **Planned** — ยังไม่มีในโค้ดปัจจุบัน

## Authentication และ Session

| Requirement ID | Requirement | Acceptance criteria | สถานะ |
|---|---|---|---|
| SR-AUTH-001 | ระบบต้อง hash password ฝั่ง Server ด้วย password KDF และ salt แยกรายผู้ใช้ | DB ไม่มี plaintext password; login ที่ถูก/ผิดผ่าน test | Implemented |
| SR-AUTH-002 | Login error ต้องไม่เปิดเผยว่า email มีอยู่หรือไม่ | email ผิดและ password ผิดตอบข้อความรูปแบบเดียวกัน | Implemented |
| SR-AUTH-003 | Password ต้องมีความยาวขั้นต่ำและมีนโยบายที่สอดคล้องความเสี่ยง | Server ปฏิเสธ password ต่ำกว่าเกณฑ์; เพิ่ม test boundary | Partial |
| SR-AUTH-004 | Login/Register ต้องมี rate limit ป้องกัน brute force และ resource exhaustion | เกิน threshold ได้ 429; มี test และ log | Planned |
| SR-SES-001 | Session token ต้องสร้างจาก CSPRNG และ Server เก็บเฉพาะ hash | token มี entropy เพียงพอ; DB ไม่เก็บ bearer token | Implemented |
| SR-SES-002 | Session ต้องมีวันหมดอายุและถูกปฏิเสธหลังหมดอายุ | expired token ได้ 401; มี automated test | Partial |
| SR-SES-003 | Logout ต้อง revoke Session ฝั่ง Server และ Client | logout token เดิมใช้ไม่ได้ทันที; มี test | Planned |

## Authorization และ Booking integrity

| Requirement ID | Requirement | Acceptance criteria | สถานะ |
|---|---|---|---|
| SR-AUTHZ-001 | Protected Booking API ต้องตรวจ Authentication และ Ownership ทุกครั้ง | anonymous ได้ 401; non-owner ไม่อ่าน/แก้/ยกเลิกได้ | Implemented |
| SR-BOOK-001 | Server ต้องตรวจวันที่ เวลา ชั่วโมงเปิดทำการ ห้อง และ conflict | invalid input ได้ 400/404; overlap ได้ 409 | Implemented |
| SR-BOOK-002 | การตรวจ conflict และ INSERT/UPDATE ต้อง atomic | concurrent requests สร้าง active overlap ไม่ได้ | Planned |
| SR-VAL-001 | วันที่/เวลาต้องเป็นค่าปฏิทินจริงและ field ต้องมี length limit | ปฏิเสธ `2026-99-99`, `09:99`, purpose/name ยาวเกิน | Planned |

## Data และ Privacy

| Requirement ID | Requirement | Acceptance criteria | สถานะ |
|---|---|---|---|
| SR-DATA-001 | Query ที่มี untrusted input ต้องใช้ parameterized SQL | Code review ไม่พบ string concatenation ใน SQL input | Implemented |
| SR-DATA-002 | Static server ต้องไม่เปิด DB, source, config หรือ dotfiles | `/server.js`, `/*.db`, `/.git/*` ได้ 404; regression test ผ่าน | Implemented |
| SR-DATA-003 | Production DB ต้องใช้ persistent storage, backup และ restore procedure | ข้อมูลยังอยู่หลัง redeploy; restore drill สำเร็จ | Planned |
| SR-PRIV-001 | Public API ต้องใช้ data minimization และไม่ส่ง PII/purpose ที่ไม่จำเป็น | Anonymous response ไม่มี name, email, purpose หรือ token | Partial |
| SR-TRANS-001 | Production ต้องบังคับ HTTPS และ HSTS | HTTP redirect ไป HTTPS; response มี HSTS | Planned |

## Browser และ Application hardening

| Requirement ID | Requirement | Acceptance criteria | สถานะ |
|---|---|---|---|
| SR-WEB-001 | ข้อมูลที่ควบคุมโดยผู้ใช้ต้อง output encode ตาม context หรือใช้ safe DOM API | XSS payload แสดงเป็นข้อความและไม่ execute | Partial |
| SR-WEB-002 | Response ต้องมี security headers และ CSP ที่จำกัด script source | มี CSP, nosniff, frame protection, referrer policy | Planned |
| SR-AVAIL-001 | API ต้องมี rate limit, request-size limit และ health monitoring | abuse ได้ 429; normal health check ผ่าน | Partial |
| SR-ERR-001 | Production error ต้องไม่เปิด stack trace/SQL/internal path | 500 response เป็นข้อความทั่วไป; detail อยู่ใน protected log | Implemented |

## Operations และ Supply chain

| Requirement ID | Requirement | Acceptance criteria | สถานะ |
|---|---|---|---|
| SR-SUP-001 | ทุก PR/Push main ต้องรัน clean install, build, tests และ dependency audit | GitHub Actions เป็น required check และผ่านก่อน merge | Planned |
| SR-SUP-002 | Deployment ต้องเกิดจาก main หลัง CI ผ่านและมี rollback evidence | Failed CI ไม่ deploy; deploy history/URL ตรวจสอบได้ | Planned |
| SR-LOG-001 | ระบบต้องบันทึก security-relevant events โดยไม่บันทึก password/token | login failure, booking mutation, rate limit มี actor/time/result | Planned |
| SR-SEC-001 | Secret ต้องอยู่ใน Hosting/GitHub secret store ไม่อยู่ใน repository | secret scan และ code review ไม่พบ credential | Partial |

## Definition of done ด้าน Security

Feature ที่แตะ Authentication, Session, Booking หรือ Data flow จะถือว่าเสร็จเมื่อ:

1. Threat model และ Traceability Matrix ได้รับการอัปเดต
2. มี Positive และ Negative automated tests
3. CI ผ่าน build, tests และ dependency audit
4. Reviewer อย่างน้อยหนึ่งคนตรวจ Authorization และ Input/Output handling
5. ไม่มี Risk ระดับ Critical ที่ยัง Open โดยไม่มีผู้อนุมัติรับความเสี่ยง

