export class RoomService {
  constructor(roomRepository, bookingRepository) {
    this.roomRepository = roomRepository;
    this.bookingRepository = bookingRepository;
  }

  listRooms() { return this.roomRepository.listAll(); }
  listAvailability() { return this.bookingRepository.listAvailability(); }

  async getStatistics() {
    const [rooms, bookings] = await Promise.all([
      this.roomRepository.listAll(),
      this.bookingRepository.listStatistics(),
    ]);
    return { rooms: rooms.map(({ id, name }) => ({ id, name })), bookings };
  }
}

