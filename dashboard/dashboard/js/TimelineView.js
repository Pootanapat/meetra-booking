class TimelineView {
    constructor({ roomRows, timeHead, rooms, onSelectionChange }) {
        this.roomRows = roomRows;
        this.timeHead = timeHead;
        this.rooms = rooms;
        this.onSelectionChange = onSelectionChange;
        this.date = '';
        this.bookings = [];
        this.selection = null;
        this.pointerSelecting = false;

        this.renderTimeHeader();
        this.bindEvents();
    }

    static slotCount = 20;
    static openingMinutes = 7 * 60;
    static slotMinutes = 30;

    static timeAt(index) {
        const totalMinutes = TimelineView.openingMinutes + index * TimelineView.slotMinutes;
        const hours = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
        const minutes = String(totalMinutes % 60).padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    static minutesAt(time) {
        const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time || '');
        return match ? Number(match[1]) * 60 + Number(match[2]) : null;
    }

    static overlaps(start, end, bookingStart, bookingEnd) {
        const startMinutes = TimelineView.minutesAt(start);
        const endMinutes = TimelineView.minutesAt(end);
        const bookingStartMinutes = TimelineView.minutesAt(bookingStart);
        const bookingEndMinutes = TimelineView.minutesAt(bookingEnd);
        return startMinutes !== null
            && endMinutes !== null
            && bookingStartMinutes !== null
            && bookingEndMinutes !== null
            && startMinutes < bookingEndMinutes
            && endMinutes > bookingStartMinutes;
    }

    static dateISO(date) {
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${date.getFullYear()}-${month}-${day}`;
    }

    static todayISO() {
        return TimelineView.dateISO(new Date());
    }

    renderTimeHeader() {
        this.timeHead.replaceChildren();
        for (let index = 0; index < TimelineView.slotCount; index += 1) {
            const hour = document.createElement('div');
            hour.className = 'hour';
            hour.textContent = index % 2 === 0 ? TimelineView.timeAt(index) : '';
            this.timeHead.append(hour);
        }
    }

    bindEvents() {
        this.roomRows.addEventListener('pointerdown', event => {
            const slot = event.target.closest('.slot');
            if (!slot || !this.roomRows.contains(slot) || slot.classList.contains('past') || slot.classList.contains('booked')) {
                return;
            }

            this.pointerSelecting = true;
            this.selectSlot(slot);
        });

        this.roomRows.addEventListener('pointerover', event => {
            if (!this.pointerSelecting) {
                return;
            }

            const slot = event.target.closest('.slot');
            if (slot && this.roomRows.contains(slot)) {
                this.extendSelection(slot);
            }
        });

        this.roomRows.addEventListener('click', event => {
            if (event.detail !== 0) {
                return;
            }

            const slot = event.target.closest('.slot');
            if (slot && this.roomRows.contains(slot)) {
                this.selectSlot(slot);
            }
        });

        this.roomRows.addEventListener('keydown', event => {
            if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
                return;
            }

            const slot = event.target.closest('.slot');
            if (!slot) {
                return;
            }

            const direction = event.key === 'ArrowRight' ? 1 : -1;
            const next = slot.parentElement.querySelector(`[data-index="${Number(slot.dataset.index) + direction}"]`);
            if (next) {
                event.preventDefault();
                next.focus();
            }
        });

        document.addEventListener('pointerup', () => {
            this.pointerSelecting = false;
        });
        document.addEventListener('pointercancel', () => {
            this.pointerSelecting = false;
        });
    }

    render({ date, rooms = this.rooms, bookings = [] }) {
        if (date !== this.date) {
            this.selection = null;
            this.date = date;
        }
        this.rooms = rooms;
        this.bookings = bookings;

        if (this.selection && !rooms.some(room => room.id === this.selection.room)) {
            this.selection = null;
        }

        this.roomRows.replaceChildren();
        rooms.forEach(room => this.roomRows.append(this.renderRoom(room)));
        this.updateSelection();
    }

    renderRoom(room) {
        const row = document.createElement('div');
        row.className = 'room-row';

        const info = document.createElement('div');
        info.className = 'room-info';

        const thumbnail = document.createElement('div');
        thumbnail.className = 'room-thumb';
        thumbnail.textContent = room.icon;

        const details = document.createElement('div');
        const name = document.createElement('b');
        name.append(document.createTextNode(`${room.name} `));
        const roomId = document.createElement('span');
        roomId.style.color = 'var(--purple)';
        roomId.textContent = room.id;
        name.append(roomId);

        const capacity = document.createElement('small');
        capacity.textContent = `♙ ${room.capacity} คน • ชั้น ${room.floor}`;
        details.append(name, capacity);
        info.append(thumbnail, details);

        const slots = document.createElement('div');
        slots.className = 'slots';
        slots.dataset.room = room.id;

        for (let index = 0; index < TimelineView.slotCount; index += 1) {
            const start = TimelineView.timeAt(index);
            const end = TimelineView.timeAt(index + 1);
            const status = this.getStatus(room.id, start, end);
            const slot = document.createElement('button');
            slot.type = 'button';
            slot.className = `slot ${status}`;
            slot.dataset.index = index;
            slot.setAttribute('aria-label', `${room.name} ${room.id}, ${start}–${end}, ${this.statusLabel(status)}`);
            slot.setAttribute('aria-pressed', 'false');
            slot.title = `${start} - ${end} • ${this.statusLabel(status)}`;
            slots.append(slot);
        }

        row.append(info, slots);
        return row;
    }

    statusLabel(status) {
        return {
            available: 'ว่าง',
            booked: 'จองแล้ว',
            past: 'ผ่านไปแล้ว',
        }[status];
    }

    getStatus(roomId, start, end) {
        return this.getStatusAt(roomId, start, end, new Date());
    }

    getStatusAt(roomId, start, end, now) {
        const startMinutes = TimelineView.minutesAt(start);
        const nowMinutes = now.getHours() * 60 + now.getMinutes();
        const today = TimelineView.dateISO(now);

        if (this.date < today || (this.date === today && startMinutes <= nowMinutes)) {
            return 'past';
        }

        const conflicts = this.bookings.some(booking =>
            booking.roomId === roomId
            && booking.date === this.date
            && TimelineView.overlaps(start, end, booking.start, booking.end));
        return conflicts ? 'booked' : 'available';
    }

    refreshStatuses() {
        const now = new Date();
        const roomsById = new Map(this.rooms.map(room => [room.id, room]));

        this.roomRows.querySelectorAll('.slot').forEach(slot => {
            const slots = slot.closest('.slots');
            const roomId = slots.dataset.room;
            const index = Number(slot.dataset.index);
            const start = TimelineView.timeAt(index);
            const end = TimelineView.timeAt(index + 1);
            const status = this.getStatusAt(roomId, start, end, now);
            const room = roomsById.get(roomId);

            slot.classList.remove('available', 'booked', 'past');
            slot.classList.add(status);
            slot.setAttribute(
                'aria-label',
                `${room.name} ${room.id}, ${start}–${end}, ${this.statusLabel(status)}`,
            );
            slot.title = `${start} - ${end} • ${this.statusLabel(status)}`;
        });

        this.updateSelection();
    }

    selectSlot(slot) {
        if (slot.classList.contains('past') || slot.classList.contains('booked')) {
            return;
        }

        this.selection = {
            room: slot.closest('.slots').dataset.room,
            start: Number(slot.dataset.index),
            end: Number(slot.dataset.index),
        };
        this.updateSelection();
    }

    extendSelection(slot) {
        if (!this.selection || slot.closest('.slots').dataset.room !== this.selection.room) {
            return;
        }

        this.selection.end = Number(slot.dataset.index);
        this.updateSelection();
    }

    getSelection() {
        if (!this.selection) {
            return null;
        }

        const lower = Math.min(this.selection.start, this.selection.end);
        const upper = Math.max(this.selection.start, this.selection.end);
        return {
            room: this.selection.room,
            date: this.date,
            start: TimelineView.timeAt(lower),
            end: TimelineView.timeAt(upper + 1),
        };
    }

    isSelectionValid(bookings = this.bookings) {
        const selection = this.getSelection();
        if (!selection) {
            return false;
        }

        const room = this.rooms.find(item => item.id === selection.room);
        if (!room) {
            return false;
        }

        const conflict = bookings.some(booking =>
            booking.roomId === selection.room
            && booking.date === selection.date
            && TimelineView.overlaps(selection.start, selection.end, booking.start, booking.end));
        const startMinutes = TimelineView.minutesAt(selection.start);
        const now = new Date();
        const startsInPast = selection.date < TimelineView.todayISO()
            || (selection.date === TimelineView.todayISO()
                && startMinutes <= now.getHours() * 60 + now.getMinutes());
        return !startsInPast && !conflict;
    }

    updateSelection() {
        const selection = this.getSelection();
        const valid = selection ? this.isSelectionValid() : false;
        this.roomRows.querySelectorAll('.slot').forEach(slot => {
            slot.classList.remove('selected', 'invalid');
            slot.setAttribute('aria-pressed', 'false');
        });

        if (selection) {
            const lower = Math.min(this.selection.start, this.selection.end);
            const upper = Math.max(this.selection.start, this.selection.end);
            this.roomRows.querySelectorAll(`.slots[data-room="${selection.room}"] .slot`).forEach(slot => {
                const index = Number(slot.dataset.index);
                if (index >= lower && index <= upper) {
                    slot.classList.add(valid ? 'selected' : 'invalid');
                    slot.setAttribute('aria-pressed', 'true');
                }
            });
        }

        const room = selection && this.rooms.find(item => item.id === selection.room);
        const reason = selection && !valid
            ? 'ช่วงเวลานี้ไม่ว่างหรือผ่านไปแล้ว'
            : '';
        this.onSelectionChange({
            selection,
            room,
            valid,
            reason,
        });
    }

    clearSelection() {
        this.selection = null;
        this.updateSelection();
    }
}
