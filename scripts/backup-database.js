import fs from 'node:fs/promises';
import path from 'node:path';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const source = path.resolve(process.env.DATABASE_FILE || 'data/kmitl_booking.db');
const backupDirectory = path.resolve(process.env.BACKUP_DIRECTORY || 'backups');
const timestamp = new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-');
const destination = path.join(backupDirectory, `kmitl_booking-${timestamp}.db`);

await fs.access(source);
await fs.mkdir(backupDirectory, { recursive: true });
const database = await open({ filename: source, driver: sqlite3.Database });
try {
  const backup = database.db.backup(destination);
  await new Promise((resolve, reject) => {
    backup.step(-1, error => error ? reject(error) : resolve());
  });
  await new Promise((resolve, reject) => {
    backup.finish(error => error ? reject(error) : resolve());
  });
} catch (error) {
  await fs.rm(destination, { force: true });
  throw error;
} finally {
  await database.close();
}
console.log(`Database backup created: ${destination}`);
