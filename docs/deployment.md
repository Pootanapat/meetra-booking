# Continuous Integration และ Continuous Deployment

## CI — GitHub Actions

Workflow `.github/workflows/ci.yml` ทำงานเมื่อเปิด Pull Request เข้า `main` และเมื่อ
มีการ Push เข้า `main` โดยรันตามลำดับ:

1. `npm ci`
2. `npm run check` — production build และ automated tests
3. `npm audit --omit=dev`

ตั้ง Branch protection ให้ Check ชื่อ **Build and test** ผ่านก่อน Merge

## CD — Railway

1. สร้าง Railway project จาก GitHub repository `Pootanapat/meetra-booking`
2. เลือก Deploy branch เป็น `main`
3. Railway จะพบ `Dockerfile` และ Build image อัตโนมัติ
4. สร้าง Volume และ mount ที่ `/app/data` เพื่อเก็บ SQLite ข้ามการ Redeploy
5. ตั้ง Healthcheck path เป็น `/api/health`
6. เปิด GitHub Autodeploy และ **Wait for CI**
7. Generate public domain จาก Railway Networking

Railway เป็น URL หลักสำหรับ Demo ฟีเจอร์เต็ม เพราะรัน Express API และ SQLite ได้
ส่วน GitHub Pages เป็น Static UI preview เท่านั้น จึงไม่รองรับ Login/Booking/API โดยลำพัง

## Static preview — GitHub Pages

Workflow `.github/workflows/pages.yml` Build ด้วย Vite และ Publish เฉพาะโฟลเดอร์
`dist/` เพื่อให้ CSS และ JavaScript paths ถูกต้อง ห้ามตั้ง Pages ให้ Publish repository
root เพราะไฟล์ Tailwind source ยังไม่ผ่านการ Compile

ระบบอ่าน `PORT` จาก Environment ของ Railway อยู่แล้ว ไม่ต้อง hardcode port เพิ่ม

## หลักฐานที่ต้องบันทึก

- GitHub Actions run ที่ผ่านทุก Step
- Pull Request ที่ถูก Block เมื่อ CI ไม่ผ่าน
- Railway deployment status เป็น Success/Active
- Public URL เปิดหน้าเว็บและ `/api/health` ได้
- สร้าง Booking ก่อน Redeploy และยืนยันว่าข้อมูลยังอยู่หลัง Redeploy

## Rollback

ใช้ Railway Deployment history เลือก Deployment ก่อนหน้าที่ผ่าน Healthcheck แล้ว Redeploy
หากเกี่ยวกับข้อมูล ให้สำรองไฟล์ SQLite ใน Volume ก่อนการเปลี่ยน Schema

