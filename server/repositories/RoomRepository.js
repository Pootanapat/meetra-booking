export class RoomRepository {
  constructor(database) { this.database = database; }

  listAll() {
    return this.database.all('SELECT * FROM rooms ORDER BY id');
  }

  async exists(roomId) {
    return Boolean(await this.database.get('SELECT id FROM rooms WHERE id = ?', [roomId]));
  }
}

