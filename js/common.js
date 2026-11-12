// js/common.js - โค้ดกลางที่ใช้ในทุกหน้า
// หน้าที่: จัดการ Authentication, UI กลาง, และ Utility Functions

// ============================================
// 1. ระบบ Authentication
// ============================================

// ตรวจสอบสถานะ login และ redirect ถ้าจำเป็น
function checkAuth() {
    const currentUser = localStorage.getItem('kmitlCurrentUser');
    const currentPage = window.location.pathname.split('/').pop();
    
    // หน้าที่ไม่ต้อง login ก็เข้าได้
    const publicPages = [
        'index.html', 
        'rooms.html', 
        'my-bookings.html', 
        'login.html', 
        'register.html', 
        'statistics.html'
    ];
    
    // ถ้ายังไม่ login และไม่ใช่หน้าสาธารณะ → redirect ไปหน้า login
    if (!currentUser && !publicPages.includes(currentPage)) {
        window.location.href = 'login.html';
        return null;
    }
    
    return currentUser ? JSON.parse(currentUser) : null;
}

// อัปเดต UI ตามสถานะ login (เรียกใช้ในทุกหน้า)
function updateAuthUI() {
    const user = checkAuth();
    const userLabel = document.getElementById('userLabel');
    const avatar = document.getElementById('avatar');
    const loginBtn = document.getElementById('loginTop');
    const registerBtn = document.getElementById('registerTop');
    const logoutBtn = document.getElementById('logoutTop');
    
    if (user) {
        // แสดงข้อมูลผู้ใช้
        if (userLabel) {
            userLabel.textContent = user.name || user.email || 'ผู้ใช้';
        }
        if (avatar) {
            const initial = (user.name || user.email || 'G').charAt(0).toUpperCase();
            avatar.textContent = initial;
        }
        
        // ซ่อนปุ่ม login/register แสดงปุ่ม logout
        if (loginBtn) loginBtn.style.display = 'none';
        if (registerBtn) registerBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'block';
    } else {
        // แสดงปุ่ม login/register ซ่อนปุ่ม logout
        if (loginBtn) loginBtn.style.display = 'block';
        if (registerBtn) registerBtn.style.display = 'block';
        if (logoutBtn) logoutBtn.style.display = 'none';
    }
}

// ฟังก์ชัน logout
function logout() {
    if (confirm('คุณต้องการออกจากระบบใช่หรือไม่?')) {
        localStorage.removeItem('kmitlCurrentUser');
        window.location.href = 'index.html';
    }
}

// ============================================
// 2. Utility Functions
// ============================================

// แปลงเวลาเป็นนาที (สำหรับคำนวณเวลาชนกัน)
function timeToMinutes(t) {
    if (!t) return 0;
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
}

// ตรวจสอบเวลาชนกัน (ใช้ร่วมกันทุกหน้า)
function checkTimeConflict(roomId, roomName, date, startTime, endTime, excludeBookingId = null) {
    const previewData = JSON.parse(localStorage.getItem('my_bookings_preview_data') || '[]');
    const bookingsData = JSON.parse(localStorage.getItem('bookings') || '[]');
    const allBookings = [...previewData, ...bookingsData];
    
    const newStart = timeToMinutes(startTime);
    const newEnd = timeToMinutes(endTime);
    
    // ตรวจสอบว่าเวลาเริ่มต้นน้อยกว่าเวลาสิ้นสุด
    if (newStart >= newEnd) {
        return { hasConflict: true, message: 'เวลาเริ่มต้นต้องน้อยกว่าเวลาสิ้นสุด' };
    }
    
    for (let b of allBookings) {
        if (!b || b.status === 'cancelled' || b.status === 'ยกเลิกแล้ว') continue;
        if (excludeBookingId && b.id === excludeBookingId) continue;
        
        const sameRoom = (b.roomId === roomId || b.roomName === roomName);
        const sameDate = (b.date === date);
        
        if (sameRoom && sameDate) {
            const bStart = timeToMinutes(b.startTime || b.start);
            const bEnd = timeToMinutes(b.endTime || b.end);
            
            if (Math.max(newStart, bStart) < Math.min(newEnd, bEnd)) {
                return {
                    hasConflict: true,
                    message: `ช่วงเวลานี้ถูกจองแล้ว (${b.startTime || b.start} - ${b.endTime || b.end} น.) กรุณาเลือกช่วงเวลาอื่น`
                };
            }
        }
    }
    
    return { hasConflict: false, message: '' };
}

// ดึงข้อมูลการจองทั้งหมด
function getAllBookings() {
    const previewData = JSON.parse(localStorage.getItem('my_bookings_preview_data') || '[]');
    const bookingsData = JSON.parse(localStorage.getItem('bookings') || '[]');
    const combined = [...previewData, ...bookingsData];
    
    const uniqueMap = new Map();
    combined.forEach(item => {
        if (item && item.id) uniqueMap.set(item.id, item);
    });
    
    return Array.from(uniqueMap.values());
}

// บันทึกข้อมูลการจอง (เขียนลงทั้ง 2 keys พร้อมกัน)
function saveBookings(bookings) {
    localStorage.setItem('my_bookings_preview_data', JSON.stringify(bookings));
    localStorage.setItem('bookings', JSON.stringify(bookings));
}

// ============================================
// 3. Auto-run เมื่อหน้าโหลดเสร็จ
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
});