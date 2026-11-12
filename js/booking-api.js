async function postBookingApi(path, payload, signal) {
    const response = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal,
    });
    if (!response.ok) throw new Error(`Booking API returned HTTP ${response.status}`);
    return response.json();
}

function filterRoomsOnServer(rooms, query, capacity, signal) {
    return postBookingApi('/api/rooms/filter', { rooms, query, capacity }, signal);
}

function checkBookingOnServer(roomId, date, start, end, excludedBookingId) {
    const bookings = getBookings()
        .filter(booking => String(booking.id) !== excludedBookingId
            && !isCancelledBooking(booking) && booking.roomId === roomId && booking.date === date)
        .map(booking => ({
            roomId: booking.roomId,
            date: booking.date,
            start: booking.startTime || booking.start,
            end: booking.endTime || booking.end,
        }));

    return postBookingApi('/api/bookings/check', { roomId, date, start, end, bookings });
}

function bookingTimeError(result) {
    switch (result.status) {
        case 'available': return '';
        case 'booked': return `ช่วงเวลานี้ถูกจองแล้ว (${result.start} - ${result.end} น.) กรุณาเลือกช่วงเวลาอื่น`;
        case 'invalid_time': return 'เวลาเริ่มต้นต้องน้อยกว่าเวลาสิ้นสุด';
        default: throw new Error('Unexpected booking status');
    }
}
