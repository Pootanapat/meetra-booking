# Meetra Booking security documentation

เอกสารชุดนี้เป็น Security Baseline ของระบบ Meetra Booking สำหรับใช้อ้างอิงใน
รายงาน การนำเสนอ Code Review และการทดสอบก่อน Deploy โดยประเมินจากโค้ดบน
`main` ที่ commit `b75b2c9`

> สถานะในเอกสารแบ่งเป็น **Implemented**, **Partial** และ **Planned** เพื่อไม่ให้
> กล่าวอ้างว่าระบบมีมาตรการที่ยังไม่ได้พัฒนา

## เอกสารในชุดนี้

1. [Threat model และ DFD](threat-model.md)
2. [Misuse cases](misuse-cases.md)
3. [Asset list](asset-list.md)
4. [Security requirements](security-requirements.md)
5. [Risk register](risk-register.md)
6. [Traceability matrix](traceability-matrix.md)

## ขอบเขต

รวม Browser UI, Express API, Authentication/Session, Booking workflow, SQLite,
ไฟล์ Static ที่ Build แล้ว และสภาพแวดล้อม Deploy ไม่รวมระบบของมหาวิทยาลัยหรือ
Identity Provider ภายนอก เพราะระบบปัจจุบันไม่ได้เชื่อมต่อบริการเหล่านั้น

## วิธีดูแลเอกสาร

- ทบทวนเมื่อเพิ่ม Endpoint, เปลี่ยนวิธี Login, เปลี่ยนฐานข้อมูล หรือเปลี่ยน Hosting
- ทุก Risk ต้องมี Owner, Treatment และ Security Requirement ที่ตรวจสอบได้
- เมื่อ Implement มาตรการใหม่ ให้เปลี่ยนสถานะและเพิ่มหลักฐาน Code/Test ใน
  Traceability Matrix
- ก่อน Release ให้ทีม QA และผู้ดูแล Deployment ลงชื่อ Review

## วิธีประเมิน

- Threat classification: STRIDE
- Risk score: `Likelihood (1–5) × Impact (1–5)`
- Verification baseline: OWASP ASVS ในหมวด Authentication, Session,
  Access Control, Validation, Data Protection และ Security Configuration

## แหล่งอ้างอิง

- [OWASP Threat Modeling](https://owasp.org/www-community/Threat_Modeling)
- [OWASP Threat Modeling Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Threat_Modeling_Cheat_Sheet.html)
- [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/)
- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

