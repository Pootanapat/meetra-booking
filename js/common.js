// js/common.js (เวอร์ชันรวม - รองรับทั้งข้อมูลเก่าและใหม่)

// ============================================
// 1. จัดการ LocalStorage (รวม Key เก่าและใหม่)
// ============================================
const getBookings = () => {
    // อ่านจาก Key ใหม่
    let savedNew = localStorage.getItem('kmitlBookings');
    // อ่านจาก Key เก่า
    let savedOld1 = localStorage.getItem('bookings');
    let savedOld2 = localStorage.getItem('my_bookings_preview_data');

    let bookings = [];

    // แปลงข้อมูลใหม่
    if (savedNew) {
        try { bookings.push(...JSON.parse(savedNew)); } catch (e) {}
    }
    // แปลงข้อมูลเก่า
    if (savedOld1) {
        try { bookings.push(...JSON.parse(savedOld1)); } catch (e) {}
    }
    if (savedOld2) {
        try { bookings.push(...JSON.parse(savedOld2)); } catch (e) {}
    }

    // ลบข้อมูลซ้ำ (ใช้ id เป็นตัวเช็ค)
    const uniqueMap = new Map();
    bookings.forEach(b => {
        if (b && b.id) uniqueMap.set(String(b.id), normalizeBooking(b));
    });

    const finalBookings = Array.from(uniqueMap.values());
    
    // บันทึกกลับไปที่ Key เดียว (kmitlBookings) เพื่อความสะอาดในอนาคต
    localStorage.setItem('kmitlBookings', JSON.stringify(finalBookings));
    
    // ถ้าไม่มีข้อมูลเลย ให้ใช้ Mock Data
    if (finalBookings.length === 0 && typeof MOCK_BOOKINGS !== 'undefined') {
        saveBookings(MOCK_BOOKINGS.map(normalizeBooking));
        return MOCK_BOOKINGS.map(normalizeBooking);
    }

    return finalBookings;
};

const saveBookings = (bookings) => {
    const normalized = bookings.map(normalizeBooking);
    // บันทึกลง Key ใหม่เป็นหลัก
    localStorage.setItem('kmitlBookings', JSON.stringify(normalized));
    // บันทึกลง Key เก่าด้วย (เผื่อหน้าเก่าเรียกใช้)
    localStorage.setItem('bookings', JSON.stringify(normalized));
    localStorage.setItem('my_bookings_preview_data', JSON.stringify(normalized));
};

// ฟังก์ชันแปลงโครงสร้างข้อมูลเก่า -> ใหม่ (Adapter)
function normalizeBooking(b) {
    return {
        id: b.id,
        roomId: b.roomId || b.roomName || '', // รองรับทั้ง id และชื่อ
        date: b.date,
        start: b.start || b.startTime || '09:00', // แปลง startTime -> start
        end: b.end || b.endTime || '10:00',       // แปลง endTime -> end
        owner: b.owner || b.userName || b.userEmail || 'ผู้เยี่ยมชม',
        status: b.status || 'ยืนยันแล้ว',
        // เก็บข้อมูลอื่นๆ ไว้เผื่อหน้าเก่าใช้
        roomName: b.roomName,
        location: b.location,
        image: b.image,
        capacity: b.capacity,
        userEmail: b.userEmail,
        purpose: b.purpose
    };
}

// ============================================
// 2. จัดการ User (Login)
// ============================================
const getUser = () => JSON.parse(localStorage.getItem('kmitlCurrentUser') || 'null');

const todayISO = () => {
    let d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

function updateUserUI() {
    const u = getUser();
    const label = document.getElementById('userLabel');
    const avatar = document.getElementById('avatar');
    const loginBtn = document.getElementById('loginTop');
    const regBtn = document.getElementById('registerTop');
    const logoutBtn = document.getElementById('logoutTop');

    if (label) label.textContent = u ? u.name : 'ผู้เยี่ยมชม';
    if (avatar) avatar.textContent = u ? u.name.charAt(0) : 'G';
    
    if (loginBtn) loginBtn.style.display = u ? 'none' : '';
    if (regBtn) regBtn.style.display = u ? 'none' : '';
    if (logoutBtn) logoutBtn.style.display = u ? '' : 'none';
}

function logout() {
    if(confirm('ต้องการออกจากระบบใช่หรือไม่?')) {
        localStorage.removeItem('kmitlCurrentUser');
        location.href = 'index.html';
    }
}

// ============================================
// 3. Auto-run เมื่อโหลดหน้า
// ============================================
document.addEventListener('DOMContentLoaded', updateUserUI);