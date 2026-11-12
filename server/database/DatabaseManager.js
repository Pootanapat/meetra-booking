import fs from 'node:fs/promises';
import path from 'node:path';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { ROOM_SEED } from '../config.js';

export class DatabaseManager {
  constructor(filename) {
    this.filename = filename;
    this.database = null;
  }

  async connect() {
    if (this.filename !== ':memory:') {
      await fs.mkdir(path.dirname(this.filename), { recursive: true });
    }
    this.database = await open({ filename: this.filename, driver: sqlite3.Database });
    await this.initializeSchema();
    await this.seedRooms();
    return this.database;
  }

  async initializeSchema() {
    await this.database.exec(`
      PRAGMA foreign_keys = ON;
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE COLLATE NOCASE,
        password_hash TEXT NOT NULL, password_salt TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'student', created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS rooms (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, capacity INTEGER NOT NULL, floor TEXT,
        equipment TEXT, location TEXT, image TEXT, description TEXT
      );
      CREATE TABLE IF NOT EXISTS bookings (
        id TEXT PRIMARY KEY, ref_code TEXT NOT NULL, room_id TEXT NOT NULL, user_id TEXT NOT NULL,
        booking_date TEXT NOT NULL, start_time TEXT NOT NULL, end_time TEXT NOT NULL,
        purpose TEXT, status TEXT NOT NULL DEFAULT 'approved', created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (room_id) REFERENCES rooms(id), FOREIGN KEY (user_id) REFERENCES users(id)
      );
      CREATE TABLE IF NOT EXISTS sessions (
        token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL, expires_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);
  }

  async seedRooms() {
    const statement = await this.database.prepare(`INSERT OR IGNORE INTO rooms
      (id, name, capacity, floor, equipment, location, image, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
    try {
      for (const room of ROOM_SEED) await statement.run(...room);
    } finally {
      await statement.finalize();
    }
  }

  async close() {
    if (this.database) await this.database.close();
  }
}

