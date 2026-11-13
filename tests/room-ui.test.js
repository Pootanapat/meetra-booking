import assert from 'node:assert/strict';
import test from 'node:test';
import { ROOM_SEED } from '../server/config.js';
import { DatabaseManager } from '../server/database/DatabaseManager.js';

test('every seeded room has a unique Unsplash image', () => {
  const images = ROOM_SEED.map(room => room[6]);
  assert.equal(images.length, 5);
  assert.equal(new Set(images).size, images.length);
  for (const image of images) {
    assert.match(image, /^https:\/\/images\.unsplash\.com\/photo-/);
  }
});

test('room seeding refreshes images for an existing database', async () => {
  const manager = new DatabaseManager(':memory:');
  const database = await manager.connect();
  try {
    await database.run("UPDATE rooms SET image = '' WHERE id = 'room-101'");
    await manager.seedRooms();
    const room = await database.get("SELECT image FROM rooms WHERE id = 'room-101'");
    assert.match(room.image, /^https:\/\/images\.unsplash\.com\/photo-/);
  } finally {
    await manager.close();
  }
});

