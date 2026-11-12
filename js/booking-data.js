const BOOKING_STORAGE_KEY = 'kmitl_bookings';
const LEGACY_BOOKING_KEYS = ['kmitlBookings', 'my_bookings_preview_data', 'bookings'];

function isCancelledBooking(booking) {
    const status = String(booking.status ?? '').toLowerCase();
    return status === 'cancelled' || status === 'canceled' || status.includes('ยกเลิก');
}

function readBookingList(raw) {
    try {
        const value = JSON.parse(raw);
        return Array.isArray(value) ? value : [];
    } catch {
        return [];
    }
}

function getBookings() {
    const current = localStorage.getItem(BOOKING_STORAGE_KEY);
    if (current !== null) return readBookingList(current);

    const byId = new Map();
    const sources = LEGACY_BOOKING_KEYS.map(key => localStorage.getItem(key));
    for (const source of sources) {
        for (const booking of readBookingList(source)) {
            if (booking?.id == null) continue;
            const id = String(booking.id);
            const previous = byId.get(id);
            const start = booking.startTime || booking.start || previous?.start;
            const end = booking.endTime || booking.end || previous?.end;
            byId.set(id, {
                ...previous,
                ...booking,
                id,
                roomId: String(booking.roomId ?? booking.room_id ?? previous?.roomId ?? ''),
                start,
                end,
                startTime: start,
                endTime: end,
                status: isCancelledBooking(booking) || (previous && isCancelledBooking(previous))
                    ? 'cancelled'
                    : booking.status ?? previous?.status,
            });
        }
    }

    const bookings = [...byId.values()];
    if (sources.some(source => source !== null)) saveBookings(bookings);
    return bookings;
}

function saveBookings(bookings) {
    localStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(bookings));
}
