CREATE DATABASE IF NOT EXISTS kmitl_booking CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE kmitl_booking;

-- 1. ตารางผู้ใช้งาน (Users)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'student',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. ตารางห้องประชุม (Rooms)
CREATE TABLE IF NOT EXISTS rooms (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    capacity INT NOT NULL,
    floor VARCHAR(10),
    equipment TEXT,
    location VARCHAR(150),
    image TEXT,
    description TEXT
);

-- 3. ตารางการจอง (Bookings)
CREATE TABLE IF NOT EXISTS bookings (
    id VARCHAR(50) PRIMARY KEY,
    ref_code VARCHAR(30) NOT NULL,
    room_id VARCHAR(50) NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    booking_date DATE NOT NULL,
    start_time VARCHAR(10) NOT NULL,
    end_time VARCHAR(10) NOT NULL,
    purpose TEXT,
    status VARCHAR(20) DEFAULT 'approved',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- เพิ่มข้อมูลห้องประชุมเริ่มต้น 5 ห้อง
INSERT INTO rooms (id, name, capacity, floor, equipment, location, image, description) VALUES
('room-101', 'ห้องประชุม 101 - อาคารเรียนรวม', 10, '1', 'ระบบ VDO Conference, Smart Board, โปรเจคเตอร์', 'ชั้น 1 อาคารเรียนรวม KMITL', 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80', 'ห้องประชุมขนาดกลาง พร้อมระบบ VDO Conference และ Smart Board'),
('room-lab-b', 'ห้องปฏิบัติการคอมพิวเตอร์ B', 30, '3', 'คอมพิวเตอร์ 30 เครื่อง, โปรเจคเตอร์, ระบบเสียง', 'ชั้น 3 คณะเทคโนโลยีสารสนเทศ', 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=600&q=80', 'ห้องปฏิบัติการคอมพิวเตอร์ 30 เครื่อง เหมาะสำหรับการอบรมเชิงปฏิบัติการ'),
('room-sem-b', 'ห้องสัมมนาใหญ่ B', 50, '2', 'เวที, ระบบเครื่องเสียง, ไมโครโฟนไร้สาย', 'ชั้น 2 อาคารหอประชุมใหญ่', 'https://images.unsplash.com/photo-1431540015161-0bf868a2d407?auto=format&fit=crop&w=600&q=80', 'ห้องสัมมนาพร้อมเวที ระบบเครื่องเสียง และไมโครโฟนไร้สายครบชุด'),
('room-coworking', 'Co-Working Space Zone A', 15, '1', 'ปลั๊กไฟ, Wi-Fi ความเร็วสูง, โต๊ะทำงานกลุ่ม', 'ชั้น 1 สำนักหอสมุดกลาง', 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80', 'พื้นที่ทำงานกลุ่มแบบเป็นกันเอง พร้อมปลั๊กไฟและ Wi-Fi ความเร็วสูง'),
('room-mac-lab', 'ห้องปฏิบัติการ Mac Lab 402', 25, '4', 'iMac 25 เครื่อง, ซอฟต์แวร์ Adobe, ระบบเสียง', 'ชั้น 4 คณะเทคโนโลยีสารสนเทศ', 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=600&q=80', 'ห้องปฏิบัติการ iMac สำหรับงานดีไซน์ ออกแบบ และตัดต่อสื่อประสม');