# Security traceability matrix

Matrix นี้เชื่อม Asset, Threat/Misuse Case, Risk, Requirement, Implementation และ
Test evidence เพื่อให้ตรวจได้ว่าแต่ละ Threat ถูกจัดการจริงหรือยัง

| Threat / Misuse | Assets | Risk | Security requirements | Code/control evidence | Test/evidence | Coverage status |
|---|---|---|---|---|---|---|
| T-01 / MU-01 Brute force | A-01, A-12 | R-02 | SR-AUTH-002, SR-AUTH-004, SR-AVAIL-001, SR-LOG-001 | Generic login response; scrypt | Login success มีใน integration test; ไม่มี rate-limit test | Partial |
| T-02 / MU-02 Token theft | A-02, A-03 | R-01, R-03 | SR-SES-001/002/003, SR-WEB-001/002 | Random token/hash/expiry ใน [`server.js`](../../server.js#L107-L156) | ยังไม่มี expiry/logout/XSS test | Partial |
| T-03 / MU-03 IDOR | A-05 | R-10 | SR-AUTHZ-001 | Ownership query ใน [`server.js`](../../server.js#L214-L237) | Non-owner edit/cancel ใน [`api.integration.test.js`](../../tests/api.integration.test.js#L70-L87) | Covered |
| T-04 / MU-08 SQL injection | A-01–A-07 | R-11 | SR-DATA-001 | SQL placeholders ใน routes/repositories ปัจจุบัน | ไม่มี dedicated injection payload test | Partial |
| T-05 / MU-04 Double booking | A-05, A-12 | R-05 | SR-BOOK-001/002 | overlap query ใน [`server.js`](../../server.js#L89-L94) | Sequential conflict create/edit มี test; ไม่มี concurrency test | Partial |
| T-06 Repudiation | A-05, A-11 | R-09 | SR-LOG-001 | `created_at` มีบางตาราง | ไม่มี audit-log assertion | Not covered |
| T-07 / MU-05 Statistics disclosure | A-04, A-05 | R-06 | SR-PRIV-001 | Endpoint ลด user identity แต่ยังส่ง purpose | ไม่มี privacy contract test | Partial |
| T-08 / MU-06 Static disclosure | A-01–A-10 | R-12 | SR-DATA-002 | `express.static(dist)` และ `.gitignore` | DB/source 404 ใน [`api.integration.test.js`](../../tests/api.integration.test.js#L103-L106) | Covered |
| T-09 Transport interception | A-01–A-03 | R-13 | SR-TRANS-001 | ต้องตั้งค่าที่ Hosting | ยังไม่มี deployed HTTPS evidence | Not covered |
| T-10 / MU-07 DoS | A-12 | R-02 | SR-AUTH-004, SR-AVAIL-001 | JSON body limit 32 KB | ไม่มี load/rate-limit test | Partial |
| T-11 Storage loss | A-05, A-07, A-12 | R-04 | SR-DATA-003 | DB path อยู่ `data/` | ไม่มี redeploy persistence/restore evidence | Not covered |
| T-12 Anonymous/privilege bypass | A-04, A-05 | R-10 | SR-AUTHZ-001 | `requireAuthentication` ทุก booking route | Anonymous GET และ owner isolation มี integration test | Covered |
| T-13 / MU-02 XSS | A-02, A-04, A-05 | R-01 | SR-WEB-001/002 | `escapeHtml` ใน rooms/statistics; my-bookings ยัง gap | ไม่มี browser security test | Partial |
| T-14 Supply chain | A-08–A-10 | R-08 | SR-SUP-001/002, SR-SEC-001 | lockfile มีอยู่ | `npm audit` manual ผ่าน; CI/CD ยังไม่มี | Partial |

## Test identifiers ที่ควรเพิ่ม

| Test ID | Requirement | Test scenario | ประเภท |
|---|---|---|---|
| ST-AUTH-01 | SR-AUTH-004 | ส่ง login เกิน threshold แล้วได้ 429 | Integration |
| ST-SES-01 | SR-SES-002 | Token หมดอายุแล้วได้ 401 | Integration |
| ST-SES-02 | SR-SES-003 | Logout แล้ว token เดิมใช้ไม่ได้ | Integration |
| ST-XSS-01 | SR-WEB-001 | Purpose เป็น XSS payload แล้วไม่ execute | Browser E2E |
| ST-HEAD-01 | SR-WEB-002 | Response มี CSP และ security headers | Integration |
| ST-CON-01 | SR-BOOK-002 | POST พร้อมกันสองคำขอ สำเร็จได้เพียงหนึ่ง | Integration/concurrency |
| ST-VAL-01 | SR-VAL-001 | ปฏิเสธวันที่ไม่มีจริง เวลา `09:99` และข้อความยาวเกิน | Unit + Integration |
| ST-PRIV-01 | SR-PRIV-001 | Anonymous statistics response ไม่มี PII/purpose | Contract test |
| ST-PER-01 | SR-DATA-003 | สร้างข้อมูล → redeploy → ข้อมูลยังอยู่ | Deployment test |
| ST-CI-01 | SR-SUP-001 | PR ที่ test fail ถูก block ไม่ให้ merge | CI evidence |
| ST-CD-01 | SR-SUP-002 | main deploy เฉพาะเมื่อ CI ผ่าน | CD evidence |

## Coverage summary

| สถานะ | จำนวน Threat |
|---|---:|
| Covered | 3 |
| Partial | 8 |
| Not covered | 3 |

เป้าหมายก่อน Production คือไม่มี Threat ระดับ Critical/High ที่เป็น `Not covered`
และทุก Requirement ระดับ High ต้องมี Automated Test หรือ Deployment evidence

