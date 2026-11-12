import assert from 'node:assert/strict';
import test from 'node:test';
import { IcsExporter } from '../public/js/calendar/IcsExporter.js';

test('IcsExporter creates an importable calendar event', () => {
  const content = new IcsExporter().buildContent({
    id: 'booking-one',
    refCode: 'KMITL-10001',
    roomName: 'ห้องประชุม 101',
    location: 'อาคารเรียนรวม, ชั้น 1',
    purpose: 'ประชุม; Senior Project',
    date: '2099-12-31',
    startTime: '09:00',
    endTime: '10:00',
  }, new Date('2099-01-01T00:00:00.000Z'));

  assert.match(content, /BEGIN:VCALENDAR\r\nVERSION:2.0/);
  assert.match(content, /DTSTART:20991231T090000/);
  assert.match(content, /DTEND:20991231T100000/);
  assert.match(content, /LOCATION:อาคารเรียนรวม\\, ชั้น 1/);
  assert.match(content, /DESCRIPTION:ประชุม\\; Senior Project/);
  assert.match(content, /END:VCALENDAR\r\n$/);
});
