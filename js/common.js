import '../src/tailwind.css';

window.ROOMS = [
  { id: '701', name: 'บุนนาค', capacity: 100, floor: 7, equipment: 'โปรเจกเตอร์ • ไมโครโฟน • จอแสดงผล', icon: '🏢' },
  { id: '702', name: 'ชงโค', capacity: 30, floor: 7, equipment: 'จอแสดงผล • กระดานไวท์บอร์ด', icon: '🏛️' },
  { id: '703', name: 'พิกุล', capacity: 35, floor: 7, equipment: 'โปรเจกเตอร์ • ไมโครโฟน', icon: '🏢' },
  { id: '704', name: 'ราชพฤกษ์', capacity: 40, floor: 7, equipment: 'จอแสดงผล • ไมโครโฟน • Wi-Fi', icon: '🏛️' },
  { id: '706', name: 'บัวหลวง', capacity: 25, floor: 7, equipment: 'จอแสดงผล • กระดานไวท์บอร์ด', icon: '🏢' }
];

window.getBookings = function () {
  const bookingsById = new Map();
  ['kmitlBookings', 'bookings', 'my_bookings_preview_data'].forEach(key => {
    const raw = localStorage.getItem(key);
    if (!raw) return;

    const bookings = JSON.parse(raw);
    if (!Array.isArray(bookings)) {
      throw new TypeError(`Expected ${key} to contain a booking list`);
    }
    bookings.forEach(booking => {
      if (booking && booking.id !== undefined && booking.id !== null) {
        bookingsById.set(String(booking.id), booking);
      }
    });
  });
  return Array.from(bookingsById.values());
};

window.saveBookings = function (bookings) {
  const serialized = JSON.stringify(bookings);
  localStorage.setItem('my_bookings_preview_data', serialized);
  localStorage.setItem('bookings', serialized);
};

window.getUser = function () {
  const raw = localStorage.getItem('kmitlCurrentUser');
  return raw ? JSON.parse(raw) : null;
};

window.logout = function () {
  localStorage.removeItem('kmitlCurrentUser');
  window.location.href = 'index.html';
};

function updateUserUI() {
  const user = window.getUser();
  const label = document.getElementById('userLabel');
  const avatar = document.getElementById('avatar');
  const login = document.getElementById('loginTop');
  const register = document.getElementById('registerTop');
  const logoutButton = document.getElementById('logoutTop');

  if (label) label.textContent = user ? user.name : 'ผู้เยี่ยมชม';
  if (avatar) avatar.textContent = user && user.name ? user.name.charAt(0) : 'G';
  if (login) login.style.display = user ? 'none' : '';
  if (register) register.style.display = user ? 'none' : '';
  if (logoutButton) logoutButton.style.display = user ? '' : 'none';
}

document.addEventListener('DOMContentLoaded', updateUserUI);
