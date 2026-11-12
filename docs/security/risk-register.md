# Security risk register

## วิธีให้คะแนน

- Likelihood: 1 Rare, 2 Unlikely, 3 Possible, 4 Likely, 5 Almost certain
- Impact: 1 Insignificant, 2 Minor, 3 Moderate, 4 Major, 5 Severe
- Risk score: `Likelihood × Impact`
- ระดับ: 1–4 Low, 5–9 Medium, 10–16 High, 17–25 Critical

## Register

| Risk ID | Threat | Asset | L | I | Score | ระดับ | Control ปัจจุบัน | Treatment / Requirement | Owner | สถานะ |
|---|---|---|---:|---:|---:|---|---|---|---|---|
| R-01 | Stored/DOM XSS ขโมย token | A-02, A-04, A-05 | 4 | 5 | 20 | Critical | Escape บางหน้า | ใช้ safe DOM/output encoding, CSP; `SR-WEB-001/002` | Frontend | Open |
| R-02 | Brute force และ scrypt resource exhaustion | A-01, A-12 | 4 | 4 | 16 | High | Generic login error, scrypt | Rate limit, logging; `SR-AUTH-004`, `SR-AVAIL-001` | Backend | Open |
| R-03 | Token ใน localStorage ถูกขโมย | A-02, A-03 | 3 | 5 | 15 | High | Random token, hash, expiry | ปิด XSS, revoke logout, พิจารณา HttpOnly cookie; `SR-SES-003`, `SR-WEB-001` | Auth lead | Open |
| R-04 | SQLite สูญหายหลัง redeploy/เครื่องเสีย | A-05, A-07, A-12 | 3 | 5 | 15 | High | เก็บใน `data/` | Persistent volume, backup/restore drill; `SR-DATA-003` | DevOps | Open |
| R-05 | Concurrent requests สร้าง double booking | A-05, A-12 | 3 | 4 | 12 | High | ตรวจ overlap ก่อนเขียน | Transaction/locking และ concurrency test; `SR-BOOK-002` | Backend | Open |
| R-06 | Public statistics เปิดข้อมูลเกินจำเป็น | A-04, A-05 | 3 | 3 | 9 | Medium | ไม่ส่ง user identity ใน endpoint | ตัด purpose/field ไม่ใช้หรือ require auth; `SR-PRIV-001` | Product/Backend | Open |
| R-07 | วันที่/เวลา/ข้อความผิดรูปแบบเข้า DB | A-05, A-06 | 3 | 3 | 9 | Medium | Regex และ business-hour checks | strict parser/schema/length limits; `SR-VAL-001` | Backend | Open |
| R-08 | Dependency หรือ build chain ถูกโจมตี | A-08, A-09, A-10 | 2 | 4 | 8 | Medium | lockfile; audit ณ วันที่ประเมินผ่าน | CI audit, Dependabot, protected main; `SR-SUP-001/002` | DevOps | Open |
| R-09 | ไม่มี Audit trail ทำให้ปฏิเสธการกระทำได้ | A-05, A-11 | 3 | 3 | 9 | Medium | มี created_at บางส่วน | structured security log; `SR-LOG-001` | Backend/QA | Open |
| R-10 | IDOR แก้หรือยกเลิกรายการผู้อื่น | A-05 | 2 | 5 | 10 | High | Auth + ownership query + tests | รักษา regression tests; `SR-AUTHZ-001` | Backend | Mitigated |
| R-11 | SQL injection | A-01–A-07 | 1 | 5 | 5 | Medium | Parameterized SQL | Code review/security tests; `SR-DATA-001` | Backend | Mitigated |
| R-12 | DB/source ถูก serve เป็น static | A-01–A-10 | 1 | 5 | 5 | Medium | serve `dist` เท่านั้น + tests | CI regression; `SR-DATA-002` | DevOps | Mitigated |
| R-13 | Credential/token ถูกดักระหว่างส่ง | A-01–A-03 | 3 | 5 | 15 | High | Hosting ยังไม่กำหนดใน repo | HTTPS redirect/HSTS; `SR-TRANS-001` | DevOps | Open |
| R-14 | Session หมดอายุแต่ไม่ถูก cleanup/revoke | A-02, A-03 | 3 | 3 | 9 | Medium | expiry ถูกตรวจทุก request | logout endpoint และ cleanup job; `SR-SES-002/003` | Backend | Open |

## ลำดับการจัดการ

1. **ทันที:** R-01 Stored XSS
2. **ก่อน Deploy สาธารณะ:** R-02, R-03, R-04, R-13
3. **ก่อนทดสอบพร้อมกันหลายผู้ใช้:** R-05
4. **ก่อนส่งงาน Security:** R-06, R-07, R-08, R-09, R-14
5. **Regression monitoring:** R-10, R-11, R-12

## Risk acceptance

Risk ระดับ High/Critical ห้ามเปลี่ยนเป็น Accepted โดยผู้พัฒนาเพียงคนเดียว ต้องระบุ:

- ผู้อนุมัติ (Project Manager/อาจารย์ที่ปรึกษา)
- เหตุผลทางธุรกิจ
- วันหมดอายุของการยอมรับ Risk
- Compensating control
- Issue/PR ที่จะติดตามการแก้ไข

