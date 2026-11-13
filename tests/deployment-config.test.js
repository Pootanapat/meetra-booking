import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '..');
const htmlFiles = [
  'index.html', 'login.html', 'register.html', 'my-bookings.html', 'rooms.html', 'statistics.html',
];

test('Railway configuration is valid JSON with production healthcheck', async () => {
  const config = JSON.parse(await fs.readFile(path.join(root, 'railway.json'), 'utf8'));
  assert.equal(config.build.builder, 'DOCKERFILE');
  assert.equal(config.deploy.healthcheckPath, '/api/health');
  assert.equal(config.deploy.startCommand, 'npm start');
});

test('Vite build emits repository-relative JavaScript asset paths', async () => {
  for (const filename of htmlFiles) {
    const html = await fs.readFile(path.join(root, 'dist', filename), 'utf8');
    assert.doesNotMatch(html, /(?:src|href)="\/js\//, `${filename} must not point at the domain root`);
  }
});

test('GitHub Pages workflow builds and publishes dist', async () => {
  const workflow = await fs.readFile(path.join(root, '.github', 'workflows', 'pages.yml'), 'utf8');
  assert.match(workflow, /npm (?:run build|run check)/);
  assert.match(workflow, /path:\s*\.\/dist/);
  assert.match(workflow, /actions\/deploy-pages@v4/);
});
