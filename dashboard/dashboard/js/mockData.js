const ROOMS = [
    {
        id: '701',
        name: 'บุนนาค',
        capacity: 100,
        floor: 7,
        building: 'อาคารเรียนรวม A',
        equipment: 'โปรเจกเตอร์ • ไมโครโฟน • จอแสดงผล',
        equipmentItems: ['โปรเจกเตอร์', 'ไมโครโฟน', 'จอแสดงผล'],
        icon: '🏢',
    },
    {
        id: '702',
        name: 'ชงโค',
        capacity: 30,
        floor: 7,
        building: 'อาคารเรียนรวม A',
        equipment: 'จอแสดงผล • กระดานไวท์บอร์ด',
        equipmentItems: ['จอแสดงผล', 'กระดานไวท์บอร์ด'],
        icon: '🏛️',
    },
    {
        id: '703',
        name: 'พิกุล',
        capacity: 35,
        floor: 7,
        building: 'อาคารเรียนรวม B',
        equipment: 'โปรเจกเตอร์ • ไมโครโฟน',
        equipmentItems: ['โปรเจกเตอร์', 'ไมโครโฟน'],
        icon: '🏢',
    },
    {
        id: '704',
        name: 'ราชพฤกษ์',
        capacity: 40,
        floor: 7,
        building: 'อาคารเรียนรวม B',
        equipment: 'จอแสดงผล • ไมโครโฟน • Wi-Fi',
        equipmentItems: ['จอแสดงผล', 'ไมโครโฟน', 'Wi-Fi'],
        icon: '🏛️',
    },
    {
        id: '706',
        name: 'บัวหลวง',
        capacity: 25,
        floor: 7,
        building: 'อาคารเรียนรวม A',
        equipment: 'จอแสดงผล • กระดานไวท์บอร์ด',
        equipmentItems: ['จอแสดงผล', 'กระดานไวท์บอร์ด'],
        icon: '🏢',
    },
];

function getDateOffset(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
}

const MOCK_BOOKINGS = [
    {
        id: 'mock-1',
        roomId: '701',
        date: getDateOffset(1),
        start: '09:00',
        end: '10:30',
        owner: 'สมชาย ใจดี',
        status: 'ยืนยันแล้ว',
    },
    {
        id: 'mock-2',
        roomId: '702',
        date: getDateOffset(1),
        start: '13:00',
        end: '14:00',
        owner: 'นภา แสงทอง',
        status: 'ยืนยันแล้ว',
    },
    {
        id: 'mock-3',
        roomId: '704',
        date: getDateOffset(2),
        start: '10:00',
        end: '12:00',
        owner: 'กิตติพงษ์ มั่นคง',
        status: 'ยืนยันแล้ว',
    },
    {
        id: 'mock-4',
        roomId: '703',
        date: getDateOffset(3),
        start: '14:00',
        end: '15:30',
        owner: 'พิมพ์ชนก ตั้งใจ',
        status: 'ยืนยันแล้ว',
    },
];
