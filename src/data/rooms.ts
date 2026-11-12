import type { Room } from '../types/booking';

export const ROOMS: Room[] = [
  {
    id: '701',
    name: 'บุนนาค',
    capacity: 100,
    building: 'อาคารเรียนรวม A',
    floor: 7,
    equipment: ['โปรเจกเตอร์', 'ไมโครโฟน', 'จอแสดงผล'],
    icon: '🏢',
  },
  {
    id: '702',
    name: 'ชงโค',
    capacity: 30,
    building: 'อาคารเรียนรวม A',
    floor: 7,
    equipment: ['จอแสดงผล', 'กระดานไวท์บอร์ด'],
    icon: '🏛️',
  },
  {
    id: '703',
    name: 'พิกุล',
    capacity: 35,
    building: 'อาคารเรียนรวม B',
    floor: 7,
    equipment: ['โปรเจกเตอร์', 'ไมโครโฟน'],
    icon: '🏢',
  },
  {
    id: '704',
    name: 'ราชพฤกษ์',
    capacity: 40,
    building: 'อาคารเรียนรวม B',
    floor: 7,
    equipment: ['จอแสดงผล', 'ไมโครโฟน', 'Wi-Fi'],
    icon: '🏛️',
  },
  {
    id: '706',
    name: 'บัวหลวง',
    capacity: 25,
    building: 'อาคารเรียนรวม A',
    floor: 7,
    equipment: ['จอแสดงผล', 'กระดานไวท์บอร์ด'],
    icon: '🏢',
  },
];
