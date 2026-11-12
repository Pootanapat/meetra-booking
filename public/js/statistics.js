const isCancelledBooking = booking => booking.status === 'cancelled';

const timeToMinutes = time => {
  const [hours, minutes] = String(time || '0:0').split(':').map(Number);
  return hours * 60 + minutes;
};

const durationHours = booking => {
  const minutes = timeToMinutes(booking.endTime) - timeToMinutes(booking.startTime);
  return Math.max(0, minutes / 60);
};

const escapeHtml = value => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

async function initPage() {
  try {
    const response = await fetch('/api/statistics');
    if (!response.ok) throw new Error('โหลดสถิติไม่สำเร็จ');
    const { rooms, bookings } = await response.json();
    renderStatistics(rooms, bookings);
  } catch {
    document.getElementById('statsRows').innerHTML = '<p class="empty-state">ไม่สามารถโหลดสถิติได้</p>';
  }
}

function renderStatistics(rooms, bookings) {
  const activeBookings = bookings.filter(booking => !isCancelledBooking(booking));
  const totalHours = activeBookings.reduce((total, booking) => total + durationHours(booking), 0);
  document.getElementById('total').textContent = activeBookings.length;
  document.getElementById('hours').textContent = Number.isInteger(totalHours) ? totalHours : totalHours.toFixed(1);
  document.getElementById('used').textContent = new Set(activeBookings.map(booking => booking.roomId)).size;
  document.getElementById('totalRooms').textContent = rooms.length;

  let topRoom = null;
  let topRoomCount = 0;
  document.getElementById('statsRows').innerHTML = rooms.map(room => {
    const count = activeBookings.filter(booking => booking.roomId === room.id).length;
    if (count > topRoomCount) {
      topRoom = room;
      topRoomCount = count;
    }
    const percentage = activeBookings.length ? count / activeBookings.length * 100 : 0;
    return `<div class="bar-row">
      <span>${escapeHtml(room.name)} <small style="color:#94a3b8">(${escapeHtml(room.id)})</small></span>
      <div class="bar"><i style="width:${percentage}%"></i></div>
      <b>${count} ครั้ง</b>
    </div>`;
  }).join('');

  document.getElementById('peakRoomBadge').textContent = topRoom
    ? `★ ยอดนิยม: ${topRoom.name}`
    : 'ยังไม่มีรายการจอง';

  const averageHours = activeBookings.length ? (totalHours / activeBookings.length).toFixed(1) : '0';
  const cancelledCount = bookings.length - activeBookings.length;
  document.getElementById('insightList').innerHTML = `
    <div class="insight-item"><small>ห้องยอดนิยม</small><strong>${escapeHtml(topRoom?.name || 'ยังไม่มีข้อมูล')}</strong></div>
    <div class="insight-item"><small>ระยะเวลาเฉลี่ย</small><strong>${averageHours} ชั่วโมง / การจอง</strong></div>
    <div class="insight-item"><small>สถานะทั้งหมด</small><strong>ยืนยัน ${activeBookings.length} / ยกเลิก ${cancelledCount}</strong></div>`;

  const recent = bookings.slice(0, 5);
  document.getElementById('recentBookingsContainer').innerHTML = recent.length
    ? `<div class="recent-list">${recent.map(booking => `
      <div class="recent-item">
        <div class="recent-left"><div class="room-tag">${escapeHtml(booking.roomId)}</div>
          <div class="recent-item-info"><strong>${escapeHtml(booking.roomName)}</strong>
            <small>${escapeHtml(booking.date)} • ${escapeHtml(booking.startTime)} - ${escapeHtml(booking.endTime)} น.</small>
          </div></div>
        <span class="status-pill">${isCancelledBooking(booking) ? 'ยกเลิกแล้ว' : 'ยืนยันแล้ว'}</span>
      </div>`).join('')}</div>`
    : '<div class="empty-state">ยังไม่มีรายการจอง</div>';
}

document.addEventListener('DOMContentLoaded', initPage);
