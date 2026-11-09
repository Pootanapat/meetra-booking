import { Booking } from '../types/booking';

export const generateICSFile = (booking: Booking): void => {
  const formatDateISO = (dateStr: string, timeStr: string) => {
    const cleanDate = dateStr.replace(/-/g, '');
    const cleanTime = timeStr.replace(/:/g, '') + '00';
    return `${cleanDate}T${cleanTime}`;
  };

  const startISO = formatDateISO(booking.date, booking.startTime);
  const endISO = formatDateISO(booking.date, booking.endTime);

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//KMITL Room Booking System//TH',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:bkg-${booking.id}@kmitl.ac.th`,
    `DTSTAMP:${startISO}Z`,
    `DTSTART:${startISO}`,
    `DTEND:${endISO}`,
    `SUMMARY:การจองห้องประชุม: ${booking.roomName}`,
    `DESCRIPTION:สถานที่: ${booking.location} | ผู้จอง: ${booking.userEmail}`,
    `LOCATION:${booking.location}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
  const downloadUrl = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.setAttribute('download', `Booking-${booking.roomName.replace(/\s+/g, '_')}-${booking.date}.ics`);
  document.body.appendChild(link);
  link.click();
  
  document.body.removeChild(link);
  URL.revokeObjectURL(downloadUrl);
};