import React, { useState, useEffect, useRef } from 'react';
import type { Booking } from '../types/booking';
import { useAuth } from '../context/AuthContext';
import { validateBookingTime } from '../utils/bookingTime';
import { BOOKING_STORAGE_KEY, loadBookings } from '../utils/bookingStorage';
import { generateICSFile } from '../utils/icsGenerator';

export const MyBookings: React.FC = () => {
  const { user } = useAuth();
  const [initial] = useState(loadBookings);
  const [bookings, setBookings] = useState<Booking[]>(initial.bookings);
  const [storageError, setStorageError] = useState(initial.error);
  const skipStorageWrite = useRef(false);

  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [editError, setEditError] = useState('');

  useEffect(() => {
    const refreshFromStorage = (event: StorageEvent) => {
      if (event.key !== BOOKING_STORAGE_KEY && event.key !== null) return;
      const latest = loadBookings();
      skipStorageWrite.current = true;
      setBookings(latest.bookings);
      setStorageError(latest.error);
    };
    window.addEventListener('storage', refreshFromStorage);
    return () => window.removeEventListener('storage', refreshFromStorage);
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

  // 1. ฟีเจอร์: ยกเลิกการจอง (Cancel Feature)
  const handleCancelBooking = (id: Booking['id']) => {
    if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการยกเลิกรายการจองนี้?')) {
      setBookings(prev =>
        prev.map(item => (String(item.id) === String(id) ? { ...item, status: 'cancelled' } : item))
      );
    }
  };

  // 2. ฟีเจอร์: บันทึกการแก้ไข (Edit Feature)
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBooking) return;

    const error = validateBookingTime(
      {
        roomId: editingBooking.roomId,
        date: editingBooking.date,
        startTime: editingBooking.startTime,
        endTime: editingBooking.endTime,
      },
      bookings,
      new Date(),
      editingBooking.id,
    );
    if (error) {
      setEditError(error);
      return;
    }

    setBookings(prev =>
      prev.map(item => (String(item.id) === String(editingBooking.id) ? editingBooking : item))
    );
    setEditError('');
    setEditingBooking(null); // ปิด Modal
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 space-y-6">
      {storageError && <p className="text-sm text-red-600" role="alert">ข้อมูลการจองมีปัญหา: {storageError}</p>}
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-5 rounded-xl shadow-sm border border-purple-100">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">รายการจองห้องประชุมของฉัน</h2>
          <p className="text-sm text-gray-500">จัดการ ตรวจสอบ แก้ไข หรือยกเลิกการจองห้องประชุม</p>
        </div>
        {user && (
          <div className="mt-3 sm:mt-0 bg-purple-50 px-4 py-2 rounded-lg border border-purple-200">
            <span className="text-xs text-purple-600 block font-semibold">ผู้ใช้งานปัจจุบัน</span>
            <span className="text-sm font-bold text-purple-900">{user.name}</span>
          </div>
        )}
      </div>

      {/* Booking List */}
      <div className="space-y-4">
        {bookings.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-500">
            ยังไม่มีรายการจองห้องประชุม
          </div>
        ) : (
          bookings.map(item => (
            <div
              key={item.id}
              className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-purple-300 transition"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg text-gray-800">{item.roomName}</h3>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                      item.status === 'approved'
                        ? 'bg-green-100 text-green-700'
                        : item.status === 'cancelled'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {item.status === 'approved' && 'อนุมัติแล้ว'}
                    {item.status === 'cancelled' && 'ยกเลิกแล้ว'}
                    {item.status === 'pending' && 'รอดำเนินการ'}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{item.location}</p>
                <p className="text-xs text-gray-500 font-medium">
                  📅 วันที่: <span className="text-gray-700">{item.date}</span> | ⏰ เวลา: <span className="text-gray-700">{item.startTime} - {item.endTime} น.</span>
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
                {item.status !== 'cancelled' && (
                  <>
                    {/* ปุ่มแก้ไข */}
                    <button
                      onClick={() => { setEditError(''); setEditingBooking(item); }}
                      className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium transition shadow-sm"
                    >
                      ✏️ แก้ไข
                    </button>
                    {/* ปุ่มยกเลิก */}
                    <button
                      onClick={() => handleCancelBooking(item.id)}
                      className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium transition"
                    >
                      ❌ ยกเลิก
                    </button>
                  </>
                )}

                {/* ปุ่ม Export .ICS */}
                <button
                  onClick={() => generateICSFile(item)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition shadow-sm"
                >
                  📅 Export .ICS
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Modal (ป๊อปอัปแก้ไขการจอง) */}
      {editingBooking && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleSaveEdit}
            className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl border border-gray-100 space-y-4"
          >
            <div className="flex justify-between items-center pb-2 border-b">
              <h3 className="text-lg font-bold text-gray-800">แก้ไขข้อมูลการจอง</h3>
              <button
                type="button"
                onClick={() => setEditingBooking(null)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                ✕
              </button>
            </div>
            {editError && <p className="text-sm text-red-600" role="alert">{editError}</p>}

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">ชื่อห้องประชุม</label>
              <input
                type="text"
                disabled
                value={editingBooking.roomName}
                className="w-full bg-gray-100 border border-gray-200 rounded-lg p-2.5 text-sm text-gray-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">วันที่จอง</label>
              <input
                type="date"
                required
                value={editingBooking.date}
                onChange={e => setEditingBooking({ ...editingBooking, date: e.target.value })}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">เวลาเริ่มต้น</label>
                <input
                  type="time"
                  required
                  value={editingBooking.startTime}
                  onChange={e => setEditingBooking({ ...editingBooking, startTime: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">เวลาสิ้นสุด</label>
                <input
                  type="time"
                  required
                  value={editingBooking.endTime}
                  onChange={e => setEditingBooking({ ...editingBooking, endTime: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <button
                type="button"
                onClick={() => setEditingBooking(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition shadow-sm"
              >
                บันทึกการแก้ไข
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};