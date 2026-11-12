import fs from 'node:fs/promises';
import path from 'node:path';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

async function validateBackup(filename) {
  const database = await open({
    filename,
    driver: sqlite3.Database,
    mode: sqlite3.OPEN_READONLY,
  });
  try {
    const integrity = await database.get('PRAGMA integrity_check');
    if (integrity.integrity_check !== 'ok') throw new Error('SQLite integrity check failed');
    const tables = await database.all(`SELECT name FROM sqlite_master
      WHERE type = 'table' AND name IN ('users', 'rooms', 'bookings', 'sessions')`);
    if (tables.length !== 4) throw new Error('Backup does not contain the required Meetra tables');
  } finally {
    await database.close();
  }
}

const [sourceArgument, confirmation] = process.argv.slice(2);
if (!sourceArgument || confirmation !== '--confirm') {
  console.error('Usage: npm run db:restore -- <backup-file.db> --confirm');
  process.exitCode = 1;
} else {
  const source = path.resolve(sourceArgument);
  const destination = path.resolve(process.env.DATABASE_FILE || 'data/kmitl_booking.db');
  const backupDirectory = path.resolve(process.env.BACKUP_DIRECTORY || 'backups');
  if (path.extname(source).toLowerCase() !== '.db') throw new Error('Backup must be a .db file');
  await fs.access(source);
  await validateBackup(source);
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.mkdir(backupDirectory, { recursive: true });

  try {
    await fs.access(destination);
    const timestamp = new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-');
    await fs.copyFile(destination, path.join(backupDirectory, `pre-restore-${timestamp}.db`));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  await fs.copyFile(source, destination);
  console.log(`Database restored from: ${source}`);
  console.log('Run npm test and start the server to verify the restored data.');
}
