export class IcsExporter {
  escapeText(value) {
    return String(value ?? '')
      .replaceAll('\\', '\\\\')
      .replaceAll(';', '\\;')
      .replaceAll(',', '\\,')
      .replace(/\r?\n/g, '\\n');
  }

  formatLocalDateTime(date, time) {
    return `${String(date).replaceAll('-', '')}T${String(time).replace(':', '')}00`;
  }

  buildContent(booking, now = new Date()) {
    const timestamp = now.toISOString().replaceAll('-', '').replaceAll(':', '').replace(/\.\d{3}Z$/, 'Z');
    const uid = `${booking.id || booking.refCode}@meetra-booking`;
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//KMITL//Meetra Booking//TH',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${this.escapeText(uid)}`,
      `DTSTAMP:${timestamp}`,
      `DTSTART:${this.formatLocalDateTime(booking.date, booking.startTime)}`,
      `DTEND:${this.formatLocalDateTime(booking.date, booking.endTime)}`,
      `SUMMARY:${this.escapeText(`จองห้อง ${booking.roomName || booking.roomId}`)}`,
      `LOCATION:${this.escapeText(booking.location)}`,
      `DESCRIPTION:${this.escapeText(booking.purpose || 'Meetra Booking')}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ];
    return `${lines.join('\r\n')}\r\n`;
  }

  download(booking) {
    const content = this.buildContent(booking);
    const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const reference = String(booking.refCode || booking.id || 'booking').replace(/[^a-zA-Z0-9_-]/g, '-');
    link.href = url;
    link.download = `meetra-${reference}.ics`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }
}

if (typeof window !== 'undefined') window.IcsExporter = IcsExporter;

