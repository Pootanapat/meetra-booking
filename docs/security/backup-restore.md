# SQLite Backup and Restore Plan

ฐานข้อมูล Production อยู่บน Railway Volume ที่ `/app/data` และกำหนดผ่าน
`DATABASE_FILE=/app/data/kmitl_booking.db` ไฟล์ Backup มีข้อมูลผู้ใช้และการจอง
จึงห้าม Commit เข้า Git หรือส่งผ่านช่องทางสาธารณะ

## Backup

```bash
DATABASE_FILE=/app/data/kmitl_booking.db BACKUP_DIRECTORY=/app/backups npm run db:backup
```

คำสั่งใช้ SQLite Online Backup API เพื่อให้ Snapshot สอดคล้องกันแม้มีการอ่านข้อมูลอยู่
ควรรันทุกวัน เก็บอย่างน้อย 7 ชุด และคัดลอกออกจาก Volume เดียวกับฐานข้อมูล

## Restore

1. หยุด Service เพื่อไม่ให้มี Write ระหว่าง Restore
2. ตรวจชื่อและขนาดไฟล์ Backup
3. รันคำสั่งโดยระบุ `--confirm`:

```bash
DATABASE_FILE=/app/data/kmitl_booking.db npm run db:restore -- /secure/path/backup.db --confirm
```

Script จะสำรองฐานข้อมูลปัจจุบันไว้ใน `backups/pre-restore-*.db` ก่อนเขียนทับ

## Verification drill

1. เปิด Service และตรวจ `/api/health`
2. Login ด้วยบัญชีทดสอบ
3. ตรวจจำนวนห้องและรายการจองล่าสุด
4. สร้างและยกเลิกรายการทดสอบหนึ่งรายการ
5. บันทึกวัน ผู้ทดสอบ ไฟล์ Backup และผลลัพธ์ไว้เป็นหลักฐาน

ควรซ้อม Restore อย่างน้อยก่อนส่งงานและทุกครั้งก่อนเปลี่ยน Database schema
