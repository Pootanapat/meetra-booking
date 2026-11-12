// js/booking.js - จัดการ Logic การจองห้องประชุม
// ทำงานร่วมกับ js/common.js

class BookingManager {
    constructor() {
        this.rooms = [
            {
                id: 'room-101',
                name: 'ห้องประชุม 101 - อาคารเรียนรวม',
                capacity: 10,
                location: 'ชั้น 1 อาคารเรียนรวม KMITL',
                image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80',
                description: 'ห้องประชุมขนาดกลาง พร้อมระบบ VDO Conference และ Smart Board'
            },
            {
                id: 'room-lab-b',
                name: 'ห้องปฏิบัติการคอมพิวเตอร์ B',
                capacity: 30,
                location: 'ชั้น 3 คณะเทคโนโลยีสารสนเทศ',
                image: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=600&q=80',
                description: 'ห้องปฏิบัติการคอมพิวเตอร์ 30 เครื่อง เหมาะสำหรับการอบรมเชิงปฏิบัติการ'
            },
            {
                id: 'room-sem-b',
                name: 'ห้องสัมมนาใหญ่ B',
                capacity: 50,
                location: 'ชั้น 2 อาคารหอประชุมใหญ่',
                image: 'https://images.unsplash.com/photo-1431540015161-0bf868a2d407?auto=format&fit=crop&w=600&q=80',
                description: 'ห้องสัมมนาพร้อมเวที ระบบเครื่องเสียง และไมโครโฟนไร้สายครบชุด'
            },
            {
                id: 'room-coworking',
                name: 'Co-Working Space Zone A',
                capacity: 15,
                location: 'ชั้น 1 สำนักหอสมุดกลาง',
                image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80',
                description: 'พื้นที่ทำงานกลุ่มแบบเป็นกันเอง พร้อมปลั๊กไฟและ Wi-Fi ความเร็วสูง'
            },
            {
                id: 'room-mac-lab',
                name: 'ห้องปฏิบัติการ Mac Lab 402',
                capacity: 25,
                location: 'ชั้น 4 คณะเทคโนโลยีสารสนเทศ',
                image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=600&q=80',
                description: 'ห้องปฏิบัติการ iMac สำหรับงานดีไซน์ ออกแบบ และตัดต่อสื่อประสม'
            }
        ];
    }

    // ✅ แก้ข้อ 9: ดึงข้อมูลผู้ใช้ที่ล็อกอินอยู่จริง
    getCurrentUser() {
        return JSON.parse(localStorage.getItem('kmitlCurrentUser') || 'null');
    }

    // ✅ แก้ข้อ 8: ตรวจสอบก่อนจองว่าล็อกอินแล้วหรือยัง
    createBooking(roomId, date, startTime, endTime, purpose = 'ประชุมงานทั่วไป') {
        const user = this.getCurrentUser();
        if (!user) {
            return { success: false, message: 'กรุณาเข้าสู่ระบบก่อนทำการจอง' };
        }

        const room = this.rooms.find(r => r.id === roomId);
        if (!room) {
            return { success: false, message: 'ไม่พบข้อมูลห้องประชุม' };
        }

        // ตรวจสอบเวลาชนกัน (ใช้ฟังก์ชันจาก common.js)
        const conflict = checkTimeConflict(roomId, room.name, date, startTime, endTime);
        if (conflict.hasConflict) {
            return { success: false, message: conflict.message };
        }

        // สร้างรหัสอ้างอิง
        const randomRef = 'KMITL-' + Math.floor(10000 + Math.random() * 90000);

        // ✅ แก้ข้อ 9: ใช้อีเมลของผู้ใช้จริง ไม่ใช่ somchai@kmitl.ac.th
        const newBooking = {
            id: 'bkg-' + Date.now(),
            refCode: randomRef,
            roomId: room.id,
            roomName: room.name,
            location: room.location,
            image: room.image,
            capacity: room.capacity,
            date: date,
            startTime: startTime,
            endTime: endTime,
            start: startTime,
            end: endTime,
            purpose: purpose,
            status: 'approved',
            userEmail: user.email,
            userName: user.name || user.email,
            createdAt: new Date().toISOString()
        };

        // บันทึกข้อมูล (ใช้ฟังก์ชันจาก common.js)
        const allBookings = getAllBookings();
        allBookings.unshift(newBooking);
        saveBookings(allBookings);

        return { success: true, booking: newBooking };
    }

    // ยกเลิกการจอง
    cancelBooking(bookingId) {
        const allBookings = getAllBookings();
        const updated = allBookings.map(b =>
            b.id === bookingId ? { ...b, status: 'cancelled' } : b
        );
        saveBookings(updated);
        return true;
    }

    // ✅ แก้ข้อ 11: แก้ไขการจองพร้อมตรวจสอบเวลาชน
    editBooking(bookingId, newDate, newStartTime, newEndTime) {
        const allBookings = getAllBookings();
        const booking = allBookings.find(b => b.id === bookingId);

        if (!booking) {
            return { success: false, message: 'ไม่พบข้อมูลการจอง' };
        }

        // ตรวจสอบเวลาชนกัน (ยกเว้นตัวเอง)
        const conflict = checkTimeConflict(
            booking.roomId,
            booking.roomName,
            newDate,
            newStartTime,
            newEndTime,
            bookingId
        );

        if (conflict.hasConflict) {
            return { success: false, message: conflict.message };
        }

        const updated = allBookings.map(b => {
            if (b.id === bookingId) {
                return {
                    ...b,
                    date: newDate,
                    startTime: newStartTime,
                    endTime: newEndTime,
                    start: newStartTime,
                    end: newEndTime
                };
            }
            return b;
        });

        saveBookings(updated);
        return { success: true };
    }

    // ✅ แก้ข้อ 12: คำนวณสถานะห้องแบบ dynamic ตามวันที่
    getRoomStatus(roomId, date) {
        const allBookings = getAllBookings();
        const room = this.rooms.find(r => r.id === roomId);

        const hasBooking = allBookings.some(b =>
            (b.roomId === roomId || b.roomName === room?.name) &&
            b.date === date &&
            b.status !== 'cancelled' &&
            b.status !== 'ยกเลิกแล้ว'
        );

        return hasBooking ? 'booked' : 'available';
    }

    // ✅ แก้ข้อ 10: ดึงการจองเฉพาะของผู้ใช้ปัจจุบัน
    getUserBookings() {
        const user = this.getCurrentUser();
        if (!user) return [];

        const allBookings = getAllBookings();
        return allBookings.filter(b => b.userEmail === user.email);
    }

    // นับสถิติการจองวันนี้
    getTodayStats(date) {
        const allBookings = getAllBookings();
        const todayBookings = allBookings.filter(b =>
            b.date === date &&
            b.status !== 'cancelled' &&
            b.status !== 'ยกเลิกแล้ว'
        );

        const bookedRoomIds = new Set(todayBookings.map(b => b.roomId));
        const availableCount = this.rooms.length - bookedRoomIds.size;

        return {
            totalRooms: this.rooms.length,
            availableCount: availableCount,
            todayBookings: todayBookings.length
        };
    }
}

// Export สำหรับใช้งานในหน้าเว็บ
if (typeof window !== 'undefined') {
    window.BookingManager = BookingManager;
}