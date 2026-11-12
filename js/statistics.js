function isCancelledBooking(b) {
  const status = String(b.status || '').toLowerCase();
  return status === 'cancelled' || status === 'canceled' || status.includes('ยกเลิก');
}

function timeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== 'string' || !timeStr.includes(':')) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h * 60) + (m || 0);
}

function getDurationHours(booking) {
  if (booking.duration) return Number(booking.duration);
  const start = booking.start || booking.startTime || '';
  const end = booking.end || booking.endTime || '';
  const diff = timeToMinutes(end) - timeToMinutes(start);
  return diff > 0 ? diff / 60 : 1;
}

function fetchAllBookings() {
  if (typeof getBookings === 'function') {
    const data = getBookings();
    if (Array.isArray(data)) return data;
  }
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.toLowerCase().includes('book')) {
      try {
        const parsed = JSON.parse(localStorage.getItem(key));
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
  }
  return [];
}

function getSystemRooms(bookings) {
  if (typeof ROOMS !== 'undefined' && Array.isArray(ROOMS) && ROOMS.length > 0) {
    return ROOMS;
  }
  const roomMap = new Map();
  bookings.forEach(b => {
    const id = b.roomId || b.room_id;
    const name = b.roomName || b.room || id;
    if (id && !roomMap.has(id)) roomMap.set(id, { id, name });
  });
  return Array.from(roomMap.values());
}

function matchRoom(booking, room) {
  const bId = String(booking.roomId || booking.room_id || '').trim().toLowerCase();
  const bName = String(booking.roomName || booking.room || '').trim().toLowerCase();
  const rId = String(room.id).trim().toLowerCase();
  const rName = String(room.name).trim().toLowerCase();
  return (bId && bId === rId) || (bName && (bName === rName || bName.includes(rId)));
}

function initPage() {
  const allBookings = fetchAllBookings();
  const activeBookings = allBookings.filter(b => !isCancelledBooking(b));
  const rooms = getSystemRooms(allBookings);

  document.getElementById('total').textContent = activeBookings.length;
  const totalHours = activeBookings.reduce((sum, b) => sum + getDurationHours(b), 0);
  document.getElementById('hours').textContent = Number.isInteger(totalHours) ? totalHours : totalHours.toFixed(1);
  const usedCount = new Set(activeBookings.map(b => b.roomId || b.roomName || b.room).filter(Boolean)).size;
  document.getElementById('used').textContent = usedCount;
  document.getElementById('totalRooms').textContent = rooms.length || 5;

  const statsRowsEl = document.getElementById('statsRows');
  statsRowsEl.innerHTML = '';
  let maxCount = 0;
  let topRoomName = 'ยังไม่มีการใช้งาน';

  rooms.forEach(room => {
    const count = activeBookings.filter(b => matchRoom(b, room)).length;
    const pct = activeBookings.length > 0 ? (count / activeBookings.length) * 100 : 0;
    if (count > maxCount) {
      maxCount = count;
      topRoomName = room.name;
    }
    const row = document.createElement('div');
    row.className = 'bar-row';
    row.innerHTML = `
      <span>${room.name} <small style="color:#94a3b8">(${room.id})</small></span>
      <div class="bar"><i style="width: ${pct}%"></i></div>
      <b>${count} ครั้ง</b>
    `;
    statsRowsEl.appendChild(row);
  });

  document.getElementById('peakRoomBadge').textContent = maxCount > 0 ? `★ ยอดนิยม: ${topRoomName}` : 'ยังไม่มีรายการจอง';

  const avgHours = activeBookings.length > 0 ? (totalHours / activeBookings.length).toFixed(1) : '0';
  const cancelledCount = allBookings.length - activeBookings.length;
  document.getElementById('insightList').innerHTML = `
    <div class="insight-item">
      <small>ห้องประชุมยอดนิยมอันดับ 1</small>
      <strong>${maxCount > 0 ? `${topRoomName} (${maxCount} ครั้ง)` : 'ยังไม่มีข้อมูล'}</strong>
    </div>
    <div class="insight-item">
      <small>ระยะเวลาใช้งานเฉลี่ยต่อครั้ง</small>
      <strong>${avgHours} ชั่วโมง / การจอง</strong>
    </div>
    <div class="insight-item">
      <small>สถานะรายการในระบบทั้งหมด</small>
      <strong>ยืนยันแล้ว ${activeBookings.length} รายการ (ยกเลิก ${cancelledCount} รายการ)</strong>
    </div>
  `;

  const container = document.getElementById('recentBookingsContainer');
  if (allBookings.length === 0) {
    container.innerHTML = `<div class="empty-state">ยังไม่มีรายการจองในระบบ</div>`;
    return;
  }

  const latest = allBookings.slice(0, 5);
  container.innerHTML = `<div class="recent-list">` + latest.map(b => {
    const matched = rooms.find(r => matchRoom(b, r));
    const rCode = matched ? matched.id : (b.roomId || 'ROOM');
    const rName = matched ? matched.name : (b.roomName || b.room || 'ห้องประชุม');
    const topic = b.title || b.topic || b.purpose || 'การจองห้องประชุม';
    const user = b.user || b.bookedBy || b.name || 'ผู้ใช้งาน';
    const timeStr = (b.start && b.end) ? `${b.start} - ${b.end} น.` : (b.time || '-');
    const cancelled = isCancelledBooking(b);
    const badgeStyle = cancelled 
      ? 'background:#fee2e2; color:#dc2626; border:1px solid #fecaca;' 
      : 'background:#dcfce7; color:#15803d; border:1px solid #bbf7d0;';

    return `
      <div class="recent-item" style="${cancelled ? 'opacity: 0.72;' : ''}">
        <div class="recent-left">
          <div class="room-tag">${rCode}</div>
          <div class="recent-item-info">
            <strong>${rName} — ${topic}</strong>
            <small>วันที่ ${b.date || '-'} • เวลา ${timeStr} • ผู้จอง: ${user}</small>
          </div>
        </div>
        <span class="status-pill" style="${badgeStyle}">${cancelled ? 'ยกเลิกแล้ว' : 'ยืนยันแล้ว'}</span>
      </div>
    `;
  }).join('') + `</div>`;
}

document.addEventListener('DOMContentLoaded', initPage);