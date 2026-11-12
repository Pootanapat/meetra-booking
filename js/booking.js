window.bookingStorage = {
  add(booking) {
    const bookings = window.getBookings();
    bookings.unshift(booking);
    window.saveBookings(bookings);
  },
  save(bookings) {
    window.saveBookings(bookings);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  if (typeof window.BookingPageController !== 'function') {
    throw new Error('BookingPageController is not available on this page');
  }
  window.bookingController = new window.BookingPageController();
});
