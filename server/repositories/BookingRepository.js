export class BookingRepository {
  constructor(database) {
    this.database = database;
    this.writeQueue = Promise.resolve();
  }

  runSerialized(operation) {
    const result = this.writeQueue.then(operation, operation);
    this.writeQueue = result.catch(() => {});
    return result;
  }

  async inImmediateTransaction(operation) {
    await this.database.exec('BEGIN IMMEDIATE');
    try {
      const result = await operation();
      await this.database.exec('COMMIT');
      return result;
    } catch (error) {
      await this.database.exec('ROLLBACK');
      throw error;
    }
  }

  findConflict({ roomId, date, startTime, endTime, excludeId = null }) {
    return this.database.get(`SELECT id FROM bookings
      WHERE room_id = ? AND booking_date = ? AND status != 'cancelled'
        AND start_time < ? AND end_time > ? AND (? IS NULL OR id != ?)
      LIMIT 1`, [roomId, date, endTime, startTime, excludeId, excludeId]);
  }

  listAvailability() {
    return this.database.all(`SELECT id, room_id AS roomId, booking_date AS date,
      start_time AS startTime, end_time AS endTime, status
      FROM bookings WHERE status != 'cancelled'`);
  }

  listStatistics() {
    return this.database.all(`SELECT b.id, b.room_id AS roomId, b.booking_date AS date,
      b.start_time AS startTime, b.end_time AS endTime, b.status,
      r.name AS roomName FROM bookings b JOIN rooms r ON r.id = b.room_id
      ORDER BY b.created_at DESC`);
  }

  listForUser(userId) {
    return this.database.all(`SELECT b.id, b.ref_code AS refCode, b.room_id AS roomId,
      b.user_id AS userId, b.booking_date AS date, b.start_time AS startTime,
      b.end_time AS endTime, b.purpose, b.status, r.name AS roomName,
      r.location, r.image, r.capacity, u.name AS userName, u.email AS userEmail
      FROM bookings b JOIN rooms r ON b.room_id = r.id JOIN users u ON b.user_id = u.id
      WHERE b.user_id = ? ORDER BY b.created_at DESC`, [userId]);
  }

  findOwnedById(bookingId, userId) {
    return this.database.get('SELECT * FROM bookings WHERE id = ? AND user_id = ?', [bookingId, userId]);
  }

  create({ id, refCode, roomId, userId, date, startTime, endTime, purpose }) {
    return this.database.run(`INSERT INTO bookings
      (id, ref_code, room_id, user_id, booking_date, start_time, end_time, purpose)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, refCode, roomId, userId, date, startTime, endTime, purpose]);
  }

  createIfAvailable(booking) {
    return this.runSerialized(() => this.inImmediateTransaction(async () => {
      if (await this.findConflict(booking)) return false;
      await this.create(booking);
      return true;
    }));
  }

  update({ id, userId, date, startTime, endTime, purpose }) {
    return this.database.run(`UPDATE bookings
      SET booking_date = ?, start_time = ?, end_time = ?, purpose = ?
      WHERE id = ? AND user_id = ?`, [date, startTime, endTime, purpose, id, userId]);
  }

  updateIfAvailable(booking) {
    return this.runSerialized(() => this.inImmediateTransaction(async () => {
      const conflict = await this.findConflict({
        ...booking,
        excludeId: booking.id,
      });
      if (conflict) return false;
      await this.update(booking);
      return true;
    }));
  }

  cancel(bookingId, userId) {
    return this.runSerialized(() => this.inImmediateTransaction(() =>
      this.database.run(`UPDATE bookings SET status = 'cancelled'
        WHERE id = ? AND user_id = ? AND status != 'cancelled'`, [bookingId, userId])
    ));
  }
}

