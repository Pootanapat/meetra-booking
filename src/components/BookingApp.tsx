import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ROOMS } from '../data/rooms';
import type { Booking } from '../types/booking';
import {
  type BookingTimeRange,
  getSlotStatus,
  localDateISO,
  validateBookingTime,
} from '../utils/bookingTime';
import { BOOKING_STORAGE_KEY, loadBookings } from '../utils/bookingStorage';
import { TimelineView } from './TimelineView';

const USER_STORAGE_KEY = 'kmitlCurrentUser';
const SLOT_COUNT = 20;

interface CurrentUser {
  name: string;
  email: string;
}

interface LoadedUser {
  user: CurrentUser | null;
  error: string | null;
}

function loadCurrentUser(): LoadedUser {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return { user: null, error: null };
    const value: unknown = JSON.parse(raw);
    if (value && typeof value === 'object') {
      const user = value as Partial<CurrentUser>;
      if (typeof user.name === 'string' && typeof user.email === 'string') {
        return { user: { name: user.name, email: user.email }, error: null };
      }
    }
    throw new Error('ข้อมูลผู้ใช้มีรูปแบบไม่ถูกต้อง');
  } catch (error) {
    return {
      user: null,
      error: error instanceof Error ? error.message : 'อ่านข้อมูลผู้ใช้ไม่สำเร็จ',
    };
  }
}

function timeAt(index: number): string {
  const totalMinutes = 7 * 60 + index * 30;
  return `${String(Math.floor(totalMinutes / 60)).padStart(2, '0')}:${String(totalMinutes % 60).padStart(2, '0')}`;
}

function shiftDate(date: string, amount: number): string {
  const next = new Date(`${date}T12:00:00`);
  next.setDate(next.getDate() + amount);
  return localDateISO(next);
}

function BookingApp() {
  const initialBookings = useMemo(loadBookings, []);
  const [bookings, setBookings] = useState(initialBookings.bookings);
  const [storageError, setStorageError] = useState(initialBookings.error);
  const [initialUser] = useState(loadCurrentUser);
  const [user, setUser] = useState(initialUser.user);
  const [userError, setUserError] = useState(initialUser.error);
  const [date, setDate] = useState(localDateISO(new Date()));
  const [query, setQuery] = useState('');
  const [minimumCapacity, setMinimumCapacity] = useState(0);
  const [selection, setSelection] = useState<BookingTimeRange | null>(null);
  const [now, setNow] = useState(new Date());
  const [actionError, setActionError] = useState('');
  const skipStorageWrite = useRef(false);

  useEffect(() => {
    const refreshFromStorage = (event: StorageEvent) => {
      if (event.key === BOOKING_STORAGE_KEY || event.key === null) {
        const latest = loadBookings();
        skipStorageWrite.current = true;
        setBookings(latest.bookings);
        setStorageError(latest.error);
      }
      if (event.key === USER_STORAGE_KEY || event.key === null) {
        const latestUser = loadCurrentUser();
        setUser(latestUser.user);
        setUserError(latestUser.error);
      }
    };
    window.addEventListener('storage', refreshFromStorage);
    return () => window.removeEventListener('storage', refreshFromStorage);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (skipStorageWrite.current) {
      skipStorageWrite.current = false;
      return;
    }
    if (storageError) return;

    try {
      localStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(bookings));
    } catch (error) {
      setStorageError(error instanceof Error ? error.message : 'บันทึกข้อมูลการจองไม่สำเร็จ');
    }
  }, [bookings, storageError]);

  const visibleRooms = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return ROOMS.filter(room =>
      `${room.name} ${room.id} ${room.building}`.toLocaleLowerCase().includes(normalizedQuery)
      && room.capacity >= minimumCapacity,
    );
  }, [minimumCapacity, query]);

  const availableRoomCount = ROOMS.filter(room =>
    Array.from({ length: SLOT_COUNT }, (_, index) =>
      getSlotStatus({
        roomId: room.id,
        date,
        startTime: timeAt(index),
        endTime: timeAt(index + 1),
      }, bookings, now) === 'available',
    ).some(Boolean),
  ).length;

  const selectionError = selection
    ? validateBookingTime(selection, bookings, now)
    : null;

  const updateSelection = useCallback((next: BookingTimeRange | null) => {
    setSelection(next);
    setActionError('');
  }, []);

  const confirmBooking = () => {
    if (!selection) return;
    if (storageError) {
      setActionError('แก้ไขข้อมูลรายการจองก่อนจึงจะสามารถจองต่อได้');
      return;
    }
    if (userError) {
      setActionError(`อ่านข้อมูลผู้ใช้ไม่สำเร็จ: ${userError}`);
      return;
    }
    if (!user) {
      window.location.href = 'login.html';
      return;
    }

    const error = validateBookingTime(selection, bookings, new Date());
    if (error) {
      setActionError(error);
      return;
    }

    const room = ROOMS.find(candidate => candidate.id === selection.roomId);
    if (!room) {
      setActionError('ไม่พบข้อมูลห้องที่เลือก');
      return;
    }

    const id = `${Date.now()}`;
    const booking: Booking = {
      id,
      roomId: selection.roomId,
      roomName: room.name,
      location: room.building,
      date: selection.date,
      startTime: selection.startTime,
      endTime: selection.endTime,
      start: selection.startTime,
      end: selection.endTime,
      status: 'approved',
      userEmail: user.email,
      owner: user.name,
    };

    setBookings(current => [...current, booking]);
    setSelection(null);
    setActionError('');
  };

  const logout = () => {
    try {
      localStorage.removeItem(USER_STORAGE_KEY);
      setUser(null);
      setUserError(null);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'ออกจากระบบไม่สำเร็จ');
    }
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">K</div>
          <div><strong>KMITL</strong><small>ROOM BOOKING</small></div>
        </div>
        <div>
          <div className="nav-label">WORKSPACE</div>
          <nav className="nav">
            <a className="active" href="index.html"><span className="nav-icon">▦</span>ระบบจองห้องประชุม</a>
            <a href="my-bookings.html"><span className="nav-icon">▣</span>การจองของฉัน</a>
            <a href="statistics.html"><span className="nav-icon">▤</span>สถิติการจอง</a>
            <a href="rooms.html"><span className="nav-icon">▧</span>ข้อมูลห้องประชุม</a>
          </nav>
        </div>
        <div className="side-help">
          <b>เริ่มต้นจองห้องประชุม</b>
          เลือกห้องและช่วงเวลาที่ต้องการ ระบบจะตรวจสอบเวลาว่างให้อัตโนมัติ
        </div>
        <div className="profile">
          <div className="avatar">{user?.name.charAt(0) || 'G'}</div>
          <div><b>{user?.name || 'ผู้เยี่ยมชม'}</b><br /><small>KMITL Room Booking</small></div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="crumb">KMITL / ระบบจองห้องประชุม</div>
          <div className="top-actions">
            {user
              ? <button onClick={logout} type="button">ออกจากระบบ</button>
              : <>
                <button onClick={() => { window.location.href = 'login.html'; }} type="button">เข้าสู่ระบบ</button>
                <button onClick={() => { window.location.href = 'register.html'; }} type="button">สมัครสมาชิก</button>
              </>}
          </div>
        </header>

        <div className="content">
          <div className="eyebrow">KMITL MEETING SPACES</div>
          <div className="page-title">
            <div>
              <h1>พื้นที่สำหรับไอเดีย</h1>
              <p className="sub">ค้นหาและเลือกห้องประชุมที่เหมาะกับการใช้งานของคุณ</p>
            </div>
          </div>
          <div className="stats">
            <div className="stat"><div className="stat-icon">▦</div><div><small>ห้องประชุมทั้งหมด</small><strong>{ROOMS.length}</strong></div></div>
            <div className="stat"><div className="stat-icon">✓</div><div><small>ห้องว่างในวันที่เลือก</small><strong>{availableRoomCount}</strong></div></div>
            <div className="stat"><div className="stat-icon">▣</div><div><small>รายการจองวันนี้</small><strong>{bookings.filter(booking => booking.date === localDateISO(now)).length}</strong></div></div>
            <div className="stat"><div className="stat-icon">◷</div><div><small>เวลาให้บริการ</small><strong style={{ fontSize: 16 }}>07:00–17:00</strong></div></div>
          </div>

          <div className="section-head">
            <div><h2>เลือกห้องประชุมของคุณ</h2><p className="sub">คลิกเพื่อเลือกช่วงเวลา หรือกด Shift + ลูกศรเพื่อเลือกหลายช่วง</p></div>
          </div>

          <div className="toolbar">
            <div className="date-controls">
              <button className="secondary" onClick={() => setDate(current => shiftDate(current, -1))} type="button" aria-label="วันก่อนหน้า">‹</button>
              <input aria-label="เลือกวันที่" onChange={event => setDate(event.target.value)} type="date" value={date} />
              <button className="secondary" onClick={() => setDate(current => shiftDate(current, 1))} type="button" aria-label="วันถัดไป">›</button>
              <button className="secondary" onClick={() => setDate(localDateISO(new Date()))} type="button">วันนี้</button>
            </div>
            <input
              aria-label="ค้นหาห้องประชุม"
              onChange={event => setQuery(event.target.value)}
              placeholder="ค้นหาชื่อห้องหรือหมายเลขห้อง"
              type="search"
              value={query}
            />
            <select
              aria-label="กรองตามความจุ"
              onChange={event => setMinimumCapacity(Number(event.target.value))}
              value={minimumCapacity}
            >
              <option value={0}>ทุกขนาดห้อง</option>
              {[25, 30, 35, 40, 80, 100].map(capacity => (
                <option key={capacity} value={capacity}>{capacity} คนขึ้นไป</option>
              ))}
            </select>
          </div>

          <div className="legend" aria-label="คำอธิบายสถานะเวลา">
            <span><i className="dot" style={{ background: '#20b486' }} />ว่าง</span>
            <span><i className="dot" style={{ background: '#ed6682' }} />จองแล้ว</span>
            <span><i className="dot" style={{ background: '#bcb7c4' }} />ผ่านไปแล้ว</span>
            <span><i className="dot" style={{ background: '#8b45cf' }} />กำลังเลือก</span>
          </div>

          {storageError && <p className="timeline-error" role="alert">อ่านข้อมูลการจองไม่สำเร็จ: {storageError}</p>}
          {userError && <p className="timeline-error" role="alert">อ่านข้อมูลผู้ใช้ไม่สำเร็จ: {userError}</p>}
          <TimelineView
            bookings={bookings}
            date={date}
            now={now}
            onSelectionChange={updateSelection}
            rooms={visibleRooms}
          />

          <div className={`selection${selection ? ' show' : ''}`}>
            <div>
              <strong>{selection ? ROOMS.find(room => room.id === selection.roomId)?.name : 'ช่วงเวลาที่เลือก'}</strong>
              {selection && <p>{selection.date} • {selection.startTime} – {selection.endTime}</p>}
              {selectionError && <p className="timeline-error" role="alert">{selectionError}</p>}
              {actionError && <p className="timeline-error" role="alert">{actionError}</p>}
            </div>
            <div className="actions">
              <button className="secondary" onClick={() => updateSelection(null)} type="button">ยกเลิก</button>
              <button
                className="primary"
                disabled={!selection || Boolean(selectionError) || Boolean(storageError)}
                onClick={confirmBooking}
                type="button"
              >
                ยืนยันการจอง
              </button>
            </div>
          </div>
          <p className="timeline-filter-count">แสดง {visibleRooms.length} จาก {ROOMS.length} ห้อง</p>
        </div>
      </main>
    </div>
  );
}

export default BookingApp;
