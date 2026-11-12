export class SessionRepository {
  constructor(database) { this.database = database; }

  create({ tokenHash, userId, expiresAt }) {
    return this.database.run(
      'INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)',
      [tokenHash, userId, expiresAt],
    );
  }

  findActiveUser(tokenHash, currentTime) {
    return this.database.get(`SELECT u.id, u.name, u.email, u.role
      FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = ? AND s.expires_at > ?`, [tokenHash, currentTime]);
  }

  deleteByTokenHash(tokenHash) {
    return this.database.run('DELETE FROM sessions WHERE token_hash = ?', [tokenHash]);
  }
}

