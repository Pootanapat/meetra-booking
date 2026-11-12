import { BookingApiClient } from './BookingApiClient.js';
import { BookingPolicy } from './BookingPolicy.js';
import { RoomFilterPolicy } from './RoomFilterPolicy.js';

export class BookingPageController {
  constructor({
    apiClient = new BookingApiClient({ authenticatedFetch: window.apiFetch }),
    bookingPolicy = new BookingPolicy(),
    roomFilterPolicy = new RoomFilterPolicy(),
  } = {}) {
    this.apiClient = apiClient;
    this.bookingPolicy = bookingPolicy;
    this.roomFilterPolicy = roomFilterPolicy;
    this.timelineStart = null;
    this.rooms = [];
    this.serverBookings = [];
    this.selectedRoom = null;
    this.gridContainer = document.getElementById('roomGridContainer');
    this.searchInput = document.getElementById('searchInput');
    this.capacityFilter = document.getElementById('capacityFilter');
    this.equipmentFilter = document.getElementById('equipmentFilter');
    this.buildingFilter = document.getElementById('buildingFilter');
    this.dateInput = document.getElementById('bookingDateInput');
    this.formModal = document.getElementById('bookingFormModal');
    this.bookingForm = document.getElementById('bookingDetailsForm');
    this.init();
  }

  getLocalToday() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  getCurrentUser() {
    return window.getUser();
  }

  showLoginModal() {
    const modal = document.getElementById('loginAlertModal');
    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }
  }

  async init() {
    const today = this.getLocalToday();
    if (this.dateInput) {
      this.dateInput.value = today;
      this.dateInput.min = today;
    }
    this.bindEvents();
    await this.syncRoomsFromServer();
    await this.syncBookingsFromServer();
  }

  async syncRoomsFromServer() {
    try {
      const { response, data } = await this.apiClient.listRooms();
      if (!response.ok) throw new Error('โหลดข้อมูลห้องไม่สำเร็จ');
      this.rooms = data;
      this.populateSmartFilters();
    } catch (error) {
      console.error(error);
      this.rooms = [];
    }
  }

  async syncBookingsFromServer() {
    try {
      const { response, data } = await this.apiClient.listAvailability();
      if (response.ok) {
        this.serverBookings = data;
      }
    } catch (e) {
      console.warn('ไม่สามารถดึงข้อมูลจากเซิร์ฟเวอร์ได้:', e);
    }
    this.handleFilter();
    this.updateStats();
  }

  getAllActiveBookings() {
    return this.bookingPolicy.activeBookings(this.serverBookings);
  }

  bindEvents() {
    if (this.searchInput) {
      this.searchInput.addEventListener('input', () => this.handleFilter());
    }
    if (this.capacityFilter) {
      this.capacityFilter.addEventListener('change', () => this.handleFilter());
    }
    for (const filter of [this.equipmentFilter, this.buildingFilter]) {
      filter?.addEventListener('change', () => this.handleFilter());
    }
    if (this.dateInput) {
      this.dateInput.addEventListener('change', () => {
        this.handleFilter();
        this.updateStats();
      });
    }
    const modalDateInput = document.getElementById('inputBookingDate');
    if (modalDateInput) {
      modalDateInput.addEventListener('change', () => {
        this.timelineStart = null;
        this.renderBookedSlotsInModal();
        this.renderTimeline();
      });
    }
    for (const inputId of ['inputStartTime', 'inputEndTime']) {
      document.getElementById(inputId)?.addEventListener('change', () => this.renderTimeline());
    }
    const todayBtn = document.getElementById('todayBtn');
    if (todayBtn) {
      todayBtn.addEventListener('click', () => {
        if (this.dateInput) this.dateInput.value = this.getLocalToday();
        this.handleFilter();
        this.updateStats();
      });
    }
    const prevDay = document.getElementById('prevDay');
    if (prevDay) {
      prevDay.addEventListener('click', () => {
        if (!this.dateInput) return;
        const d = new Date(this.dateInput.value);
        d.setDate(d.getDate() - 1);
        this.dateInput.value = d.toISOString().split('T')[0];
        this.handleFilter();
        this.updateStats();
      });
    }
    const nextDay = document.getElementById('nextDay');
    if (nextDay) {
      nextDay.addEventListener('click', () => {
        if (!this.dateInput) return;
        const d = new Date(this.dateInput.value);
        d.setDate(d.getDate() + 1);
        this.dateInput.value = d.toISOString().split('T')[0];
        this.handleFilter();
        this.updateStats();
      });
    }
    if (this.bookingForm) {
      this.bookingForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
    }
  }

  handleFilter() {
    const filtered = this.roomFilterPolicy.filter(this.rooms, {
      query: this.searchInput?.value,
      capacity: this.capacityFilter?.value,
      equipment: this.equipmentFilter?.value,
      building: this.buildingFilter?.value,
    });
    this.renderRooms(filtered);
  }

  populateSmartFilters() {
    this.replaceFilterOptions(
      this.equipmentFilter,
      'ทุกอุปกรณ์',
      this.roomFilterPolicy.getEquipmentOptions(this.rooms),
    );
    this.replaceFilterOptions(
      this.buildingFilter,
      'ทุกอาคาร',
      this.roomFilterPolicy.getBuildingOptions(this.rooms),
    );
  }

  replaceFilterOptions(select, allLabel, options) {
    if (!select) return;
    select.replaceChildren(new Option(allLabel, 'all'));
    for (const value of options) select.add(new Option(value, value));
  }

  getRoomStatus(roomId, date) {
    const roomObj = this.rooms.find(r => r.id === roomId);
    return this.bookingPolicy.getRoomStatus({
      roomId,
      roomName: roomObj?.name,
      date,
      bookings: this.serverBookings,
    });
  }

  getStatusBadge(roomStatus) {
    if (roomStatus.status === 'booked') {
      return `
        <span class="bg-rose-500/90 text-white backdrop-blur-md text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm border border-rose-400/30 flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-white animate-pulse"></span>
          ถูกจองแล้ว
        </span>
      `;
    }
    if (roomStatus.status === 'partial') {
      return `
        <span class="bg-amber-500/95 text-white backdrop-blur-md text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm border border-amber-400/30 flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-white"></span>
          ${roomStatus.statusText}
        </span>
      `;
    }
    return `
      <span class="bg-emerald-500/90 text-white backdrop-blur-md text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm border border-emerald-400/30 flex items-center gap-1.5">
        <span class="w-2 h-2 rounded-full bg-white"></span>
        ว่าง
      </span>
    `;
  }

  renderRooms(data) {
    if (!this.gridContainer) return;
    const currentDate = this.dateInput?.value || this.getLocalToday();

    if (data.length === 0) {
      this.gridContainer.innerHTML = `
        <div class="col-span-full text-center py-12 text-gray-400 font-medium">
          ไม่พบห้องประชุมที่ตรงกับเงื่อนไขการค้นหา
        </div>
      `;
      return;
    }

    this.gridContainer.innerHTML = data.map(room => {
      const roomStatus = this.getRoomStatus(room.id, currentDate);

      return `
        <div class="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md hover:border-purple-100 transition duration-200 flex flex-col justify-between group">
          <div>
            <div class="relative overflow-hidden h-44">
              <img
                src="${room.image}"
                alt="${room.name}"
                class="w-full h-full object-cover group-hover:scale-105 transition duration-500 ease-out"
              />
              <div class="absolute top-3 left-3">
                ${this.getStatusBadge(roomStatus)}
              </div>
              <span class="absolute top-3 right-3 bg-white/90 backdrop-blur-md text-gray-800 text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm border border-white/50 flex items-center gap-1">
                <svg class="icon-svg text-gray-500" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
                ${room.capacity} คน
              </span>
            </div>
            <div class="p-4 space-y-2">
              <h4 class="font-bold text-gray-900 text-base leading-snug tracking-tight group-hover:text-purple-700 transition">${room.name}</h4>
              <p class="text-xs text-gray-500 flex items-center gap-1 font-medium">
                <svg class="icon-svg text-rose-500" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                ${room.location}
              </p>
              <p class="text-xs text-gray-500 leading-relaxed line-clamp-2 pt-1 border-t border-gray-50">${room.description}</p>
            </div>
          </div>
          <div class="p-4 pt-0">
            ${roomStatus.isFullDay ? `
              <button
                disabled
                class="w-full py-2.5 bg-gray-100 text-gray-400 rounded-xl font-medium text-xs tracking-wide cursor-not-allowed flex items-center justify-center gap-1"
              >
                <span>ถูกจองแล้ว</span>
              </button>
            ` : `
              <button
                onclick="window.bookingController.openFormModal('${room.id}')"
                class="w-full py-3 btn-purple-pill font-semibold text-xs tracking-wide cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>＋ เลือกจองห้องนี้</span>
              </button>
            `}
          </div>
        </div>
      `;
    }).join('');
  }

  updateStats() {
    const currentDate = this.dateInput?.value || this.getLocalToday();
    const allBookings = this.getAllActiveBookings();

    const todayBookings = allBookings.filter(b => b.date === currentDate);
    const fullBookedRooms = this.rooms.filter(r => this.getRoomStatus(r.id, currentDate).isFullDay).length;
    const availableCount = this.rooms.length - fullBookedRooms;

    const availableCountEl = document.getElementById('availableCount');
    const todayBookingCountEl = document.getElementById('todayBookingCount');
    if (availableCountEl) availableCountEl.textContent = availableCount;
    if (todayBookingCountEl) todayBookingCountEl.textContent = todayBookings.length;
  }

  openFormModal(roomId) {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      this.showLoginModal();
      return;
    }

    this.selectedRoom = this.rooms.find(r => r.id === roomId);
    if (!this.selectedRoom) return;

    document.getElementById('formRoomImg').src = this.selectedRoom.image;
    document.getElementById('formRoomTitle').textContent = this.selectedRoom.name;
    document.getElementById('formRoomLoc').innerHTML = '<svg class="icon-svg text-rose-500" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg> ' + this.selectedRoom.location;
    document.getElementById('formRoomCap').textContent = this.selectedRoom.capacity + ' คน';

    const modalDateInput = document.getElementById('inputBookingDate');
    modalDateInput.min = this.getLocalToday();
    modalDateInput.value = this.dateInput?.value || this.getLocalToday();
    document.getElementById('modalErrorMsg').classList.add('hidden');

    this.renderBookedSlotsInModal();
    this.timelineStart = null;
    this.renderTimeline();
    this.formModal.classList.remove('hidden');
    this.formModal.classList.add('flex');
  }

  renderBookedSlotsInModal() {
    const noticeBox = document.getElementById('bookedSlotsNotice');
    const listBox = document.getElementById('bookedSlotsList');
    if (!this.selectedRoom || !noticeBox || !listBox) return;

    const selectedDate = document.getElementById('inputBookingDate').value;
    const allBookings = this.getAllActiveBookings();
    const bookedSlots = allBookings
      .filter(b => (b.roomId === this.selectedRoom.id || b.roomName === this.selectedRoom.name) && b.date === selectedDate)
      .sort((a, b) => this.timeToMinutes(a.startTime || a.start) - this.timeToMinutes(b.startTime || b.start));

    if (bookedSlots.length === 0) {
      noticeBox.classList.add('hidden');
      listBox.innerHTML = '';
      return;
    }

    listBox.innerHTML = bookedSlots.map(b =>
      `<span class="bg-rose-100 text-rose-700 border border-rose-300 px-2 py-0.5 rounded-full font-semibold">${b.startTime || b.start} - ${b.endTime || b.end} น. (ถูกจองแล้ว)</span>`
    ).join('');
    noticeBox.classList.remove('hidden');
  }

  closeFormModal() {
    this.formModal.classList.add('hidden');
    this.formModal.classList.remove('flex');
  }

  renderTimeline() {
    const container = document.getElementById('bookingTimeline');
    const date = document.getElementById('inputBookingDate')?.value;
    if (!container || !date || !this.selectedRoom) return;
    const selectedStart = document.getElementById('inputStartTime')?.value;
    const selectedEnd = document.getElementById('inputEndTime')?.value;
    const selectedStartMinutes = this.timeToMinutes(selectedStart);
    const selectedEndMinutes = this.timeToMinutes(selectedEnd);
    const slots = this.bookingPolicy.buildTimeline({
      roomId: this.selectedRoom.id,
      roomName: this.selectedRoom.name,
      date,
      bookings: this.serverBookings,
    });
    const styles = {
      available: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
      booked: 'border-rose-200 bg-rose-100 text-rose-500 cursor-not-allowed',
      past: 'border-slate-300 bg-slate-200 text-slate-500 cursor-not-allowed',
      selected: 'border-purple-600 bg-purple-600 text-white ring-2 ring-purple-200',
    };
    container.innerHTML = slots.map(slot => {
      const slotStart = this.timeToMinutes(slot.startTime);
      const isSelected = slot.status === 'available' &&
        slotStart >= selectedStartMinutes && slotStart < selectedEndMinutes;
      const visualStatus = isSelected ? 'selected' : slot.status;
      const disabled = slot.status !== 'available';
      const label = `${slot.startTime}-${slot.endTime} ${slot.status === 'booked' ? 'จองแล้ว' : slot.status === 'past' ? 'ผ่านไปแล้ว' : 'ว่าง'}`;
      return `<button type="button" data-start="${slot.startTime}" data-end="${slot.endTime}"
        aria-label="${label}" ${disabled ? 'disabled' : ''}
        class="timeline-slot rounded-lg border px-1 py-2 text-[11px] font-semibold transition ${styles[visualStatus]}">${slot.startTime}</button>`;
    }).join('');
    container.querySelectorAll('.timeline-slot:not(:disabled)').forEach(button => {
      button.addEventListener('click', () => this.handleTimelineSlotClick(button.dataset.start, button.dataset.end));
    });
  }

  handleTimelineSlotClick(startTime, endTime) {
    const startInput = document.getElementById('inputStartTime');
    const endInput = document.getElementById('inputEndTime');
    const date = document.getElementById('inputBookingDate')?.value;
    if (!startInput || !endInput || !date) return;

    if (!this.timelineStart || this.timeToMinutes(startTime) <= this.timeToMinutes(this.timelineStart)) {
      this.timelineStart = startTime;
      startInput.value = startTime;
      endInput.value = endTime;
      this.renderTimeline();
      return;
    }

    const conflict = this.checkTimeConflict(this.selectedRoom.id, date, this.timelineStart, endTime);
    if (conflict.hasConflict) {
      const errorBox = document.getElementById('modalErrorMsg');
      errorBox.textContent = conflict.message;
      errorBox.classList.remove('hidden');
      this.timelineStart = startTime;
      startInput.value = startTime;
      endInput.value = endTime;
      this.renderTimeline();
      return;
    }

    startInput.value = this.timelineStart;
    endInput.value = endTime;
    this.timelineStart = null;
    document.getElementById('modalErrorMsg')?.classList.add('hidden');
    this.renderTimeline();
  }

  timeToMinutes(t) {
    return this.bookingPolicy.timeToMinutes(t);
  }

  checkTimeConflict(roomId, date, startTime, endTime) {
    return this.bookingPolicy.checkConflict({
      roomId,
      roomName: this.selectedRoom?.name,
      date,
      startTime,
      endTime,
      bookings: this.serverBookings,
    });
  }

  async handleFormSubmit(e) {
    e.preventDefault();
    if (!this.selectedRoom) return;

    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      this.closeFormModal();
      this.showLoginModal();
      return;
    }

    const dateVal = document.getElementById('inputBookingDate').value;
    const startVal = document.getElementById('inputStartTime').value;
    const endVal = document.getElementById('inputEndTime').value;
    const purposeVal = document.getElementById('inputPurpose').value;
    const errorBox = document.getElementById('modalErrorMsg');

    const conflictCheck = this.checkTimeConflict(this.selectedRoom.id, dateVal, startVal, endVal);
    if (conflictCheck.hasConflict) {
      errorBox.textContent = conflictCheck.message;
      errorBox.classList.remove('hidden');
      return;
    }

    const submitBtn = document.getElementById('submitBookingBtn');
    if (submitBtn) submitBtn.disabled = true;

    const randomRef = 'KMITL-' + Math.floor(10000 + Math.random() * 90000);
    const newBooking = {
      id: 'bkg-' + Date.now(),
      refCode: randomRef,
      roomId: this.selectedRoom.id,
      userId: currentUser.id,
      roomName: this.selectedRoom.name,
      location: this.selectedRoom.location,
      image: this.selectedRoom.image,
      capacity: this.selectedRoom.capacity,
      date: dateVal,
      startTime: startVal,
      endTime: endVal,
      start: startVal,
      end: endVal,
      purpose: purposeVal || 'ประชุมงานทั่วไป',
      status: 'approved',
      userEmail: currentUser.email
    };

    try {
      const { response: res, data: result } = await this.apiClient.createBooking(newBooking);

      if (!res.ok) {
        errorBox.textContent = result.error || 'ช่วงเวลานี้ถูกจองแล้ว กรุณาเลือกช่วงเวลาอื่น';
        errorBox.classList.remove('hidden');
        return;
      }
    } catch (err) {
      errorBox.textContent = 'ไม่สามารถเชื่อมต่อระบบได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง';
      errorBox.classList.remove('hidden');
      return;
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }

    await this.syncBookingsFromServer();

    this.closeFormModal();
    document.getElementById('recRefCode').textContent = '#' + randomRef;
    document.getElementById('recRoomName').textContent = this.selectedRoom.name;
    document.getElementById('recLocation').textContent = this.selectedRoom.location;
    document.getElementById('recDate').textContent = dateVal;
    document.getElementById('recTime').textContent = `${startVal} - ${endVal} น.`;
    document.getElementById('goToBookingsBtn').onclick = () => {
      window.location.href = 'my-bookings.html';
    };

    const receiptModal = document.getElementById('receiptModal');
    receiptModal.classList.remove('hidden');
    receiptModal.classList.add('flex');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.bookingController = new BookingPageController();
});
