export class UserRepository {
  constructor(database) { this.database = database; }

  findByEmail(email) {
    return this.database.get('SELECT * FROM users WHERE email = ?', [email]);
  }

  create({ id, name, email, passwordHash, passwordSalt }) {
    return this.database.run(
      'INSERT INTO users (id, name, email, password_hash, password_salt) VALUES (?, ?, ?, ?, ?)',
      [id, name, email, passwordHash, passwordSalt],
    );
  }
}

