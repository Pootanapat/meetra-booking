const $ = id => document.getElementById(id);

function updateSelection({ selection, room, valid, reason }) {
    const panel = $('selectionPanel');
    panel.classList.toggle('show', Boolean(selection));
    if (!selection || !room) {
        $('confirmBooking').disabled = true;
        $('selectionTitle').textContent = 'ช่วงเวลาที่เลือก';
        $('selectionInfo').textContent = '';
        $('selectionError').textContent = '';
        return;
    }

    $('selectionTitle').textContent = `${room.name} (${room.id})`;
    $('selectionInfo').textContent = `${selection.date} • ${selection.start} – ${selection.end}`;
    $('selectionError').textContent = reason;
    $('confirmBooking').disabled = !valid;
}

const timeline = new TimelineView({
    roomRows: $('roomRows'),
    timeHead: $('timeHead'),
    rooms: ROOMS,
    onSelectionChange: updateSelection,
});

function drawNow() {
    document.querySelectorAll('.now-line').forEach(line => line.remove());
    if ($('datePicker').value !== todayISO()) {
        return;
    }

    const now = new Date();
    const minutes = now.getHours() * 60 + now.getMinutes();
    const opening = 7 * 60;
    const closing = 17 * 60;
    if (minutes < opening || minutes > closing) {
        return;
    }

    document.querySelectorAll('.slots').forEach(slots => {
        const line = document.createElement('div');
        line.className = 'now-line';
        line.style.left = `calc(8px + (100% - 16px) * ${(minutes - opening) / (closing - opening)})`;
        slots.append(line);
    });
}

function render() {
    const date = $('datePicker').value;
    const query = $('searchRoom').value.trim().toLowerCase();
    const capacity = Number($('capacityFilter').value);
    const bookings = getBookings();
    const visibleRooms = ROOMS.filter(room =>
        `${room.name}${room.id}`.toLowerCase().includes(query)
        && room.capacity >= capacity);

    timeline.render({
        date,
        rooms: visibleRooms,
        bookings,
    });

    $('roomCount').textContent = ROOMS.length;
    $('todayCount').textContent = bookings.filter(booking => booking.date === todayISO()).length;
    $('availableCount').textContent = ROOMS.filter(room =>
        Array.from({ length: TimelineView.slotCount }, (_, index) =>
            timeline.getStatus(room.id, TimelineView.timeAt(index), TimelineView.timeAt(index + 1)))
            .some(status => status === 'available')).length;
    drawNow();
}

function shiftDate(amount) {
    const date = new Date(`${$('datePicker').value}T12:00:00`);
    date.setDate(date.getDate() + amount);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    $('datePicker').value = `${date.getFullYear()}-${month}-${day}`;
    render();
}

$('clearSelection').addEventListener('click', () => timeline.clearSelection());
$('confirmBooking').addEventListener('click', () => {
    const selection = timeline.getSelection();
    if (!selection) {
        return;
    }

    const user = getUser();
    if (!user) {
        alert('กรุณาเข้าสู่ระบบก่อนจอง');
        location.href = 'login.html';
        return;
    }

    const bookings = getBookings();
    if (!timeline.isSelectionValid(bookings)) {
        render();
        return;
    }

    bookings.push({
        id: Date.now(),
        roomId: selection.room,
        date: selection.date,
        start: selection.start,
        end: selection.end,
        owner: user.name,
        status: 'ยืนยันแล้ว',
    });
    saveBookings(bookings);
    timeline.clearSelection();
    render();
    alert('บันทึกการจองเรียบร้อย');
});

$('datePicker').value = todayISO();
$('datePicker').addEventListener('change', render);
$('searchRoom').addEventListener('input', render);
$('capacityFilter').addEventListener('change', render);
$('todayBtn').addEventListener('click', () => {
    $('datePicker').value = todayISO();
    render();
});
$('prevDay').addEventListener('click', () => shiftDate(-1));
$('nextDay').addEventListener('click', () => shiftDate(1));

render();
setInterval(drawNow, 30000);
