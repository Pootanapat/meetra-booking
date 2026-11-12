import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { Booking, Room } from '../types/booking';
import {
  type BookingTimeRange,
  getSlotStatus,
  type SlotStatus,
  validateBookingTime,
} from '../utils/bookingTime';

const SLOT_COUNT = 20;
const OPENING_MINUTES = 7 * 60;
const SLOT_MINUTES = 30;

interface SlotRange {
  roomId: string;
  startIndex: number;
  endIndex: number;
}

export interface TimelineViewProps {
  rooms: Room[];
  bookings: Booking[];
  date: string;
  now: Date;
  onSelectionChange: (selection: BookingTimeRange | null) => void;
}

function timeAt(index: number): string {
  const totalMinutes = OPENING_MINUTES + index * SLOT_MINUTES;
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
  const minutes = String(totalMinutes % 60).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function slotId(roomId: string, index: number): string {
  return `timeline-slot-${roomId}-${index}`;
}

function statusLabel(status: SlotStatus): string {
  return {
    available: 'ว่าง',
    booked: 'จองแล้ว',
    past: 'ผ่านไปแล้ว',
  }[status];
}

export function TimelineView({
  rooms,
  bookings,
  date,
  now,
  onSelectionChange,
}: TimelineViewProps) {
  const [range, setRange] = useState<SlotRange | null>(null);
  const dragging = useRef(false);

  const selection = useMemo<BookingTimeRange | null>(() => {
    if (!range) return null;
    const first = Math.min(range.startIndex, range.endIndex);
    const last = Math.max(range.startIndex, range.endIndex);
    return {
      roomId: range.roomId,
      date,
      startTime: timeAt(first),
      endTime: timeAt(last + 1),
    };
  }, [date, range]);

  useEffect(() => {
    onSelectionChange(selection);
  }, [onSelectionChange, selection]);

  useEffect(() => {
    const stopDragging = () => {
      dragging.current = false;
    };
    window.addEventListener('pointerup', stopDragging);
    window.addEventListener('pointercancel', stopDragging);
    return () => {
      window.removeEventListener('pointerup', stopDragging);
      window.removeEventListener('pointercancel', stopDragging);
    };
  }, []);

  useEffect(() => {
    setRange(null);
  }, [date]);

  const selectSlot = (roomId: string, index: number) => {
    const startTime = timeAt(index);
    const endTime = timeAt(index + 1);
    const status = getSlotStatus(
      { roomId, date, startTime, endTime },
      bookings,
      now,
    );
    if (status !== 'available') return;

    setRange({ roomId, startIndex: index, endIndex: index });
  };

  const extendRange = (roomId: string, index: number) => {
    setRange(current => {
      if (!current || current.roomId !== roomId) return current;
      return { ...current, endIndex: index };
    });
  };

  const handleKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    roomId: string,
    index: number,
  ) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;

    const nextIndex = index + (event.key === 'ArrowRight' ? 1 : -1);
    if (nextIndex < 0 || nextIndex >= SLOT_COUNT) return;

    event.preventDefault();
    if (event.shiftKey) {
      setRange(current => current?.roomId === roomId
        ? { ...current, endIndex: nextIndex }
        : { roomId, startIndex: index, endIndex: nextIndex });
    }
    document.getElementById(slotId(roomId, nextIndex))?.focus();
  };

  const selectionError = selection
    ? validateBookingTime(selection, bookings, now)
    : null;

  return (
    <div className="timeline-card">
      <div className="timeline-scroll">
        <div className="timeline-inner">
          <div className="time-head">
            <div className="room-head">ห้องประชุม / MEETING ROOM</div>
            <div className="hours">
              {Array.from({ length: SLOT_COUNT }, (_, index) => (
                <div className="hour" key={index}>
                  {index % 2 === 0 ? timeAt(index) : ''}
                </div>
              ))}
            </div>
          </div>
          {rooms.map(room => (
            <div className="room-row" key={room.id}>
              <div className="room-info">
                <div className="room-thumb" aria-hidden="true">{room.icon}</div>
                <div>
                  <b>{room.name} <span style={{ color: 'var(--purple)' }}>{room.id}</span></b>
                  <small>♙ {room.capacity} คน • ชั้น {room.floor}</small>
                </div>
              </div>
              <div className="slots" data-room={room.id}>
                {Array.from({ length: SLOT_COUNT }, (_, index) => {
                  const startTime = timeAt(index);
                  const endTime = timeAt(index + 1);
                  const status = getSlotStatus(
                    { roomId: room.id, date, startTime, endTime },
                    bookings,
                    now,
                  );
                  const selected = range?.roomId === room.id
                    && index >= Math.min(range.startIndex, range.endIndex)
                    && index <= Math.max(range.startIndex, range.endIndex);
                  const classes = [
                    'slot',
                    status,
                    selected ? selectionError ? 'invalid' : 'selected' : '',
                  ].filter(Boolean).join(' ');

                  return (
                    <button
                      aria-label={`${room.name} ${room.id}, ${startTime}–${endTime}, ${statusLabel(status)}`}
                      aria-pressed={selected}
                      className={classes}
                      data-index={index}
                      id={slotId(room.id, index)}
                      key={index}
                      onClick={event => {
                        if (event.detail === 0) selectSlot(room.id, index);
                      }}
                      onKeyDown={event => handleKeyDown(event, room.id, index)}
                      onPointerDown={event => {
                        if (event.button !== 0 || status !== 'available') return;
                        event.preventDefault();
                        dragging.current = true;
                        selectSlot(room.id, index);
                      }}
                      onPointerEnter={() => {
                        if (dragging.current) extendRange(room.id, index);
                      }}
                      onPointerUp={() => {
                        dragging.current = false;
                      }}
                      title={`${startTime}–${endTime} • ${statusLabel(status)}`}
                      type="button"
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="timeline-foot">
        เวลาทำการ 07:00–17:00 น. • เลือกช่วงเวลาได้ครั้งละ 30 นาที
      </div>
    </div>
  );
}
