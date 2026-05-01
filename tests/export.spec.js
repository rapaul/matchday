import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:4321/';

test('export button downloads markdown with squad and match history', async ({ page }) => {
  await page.goto(BASE);

  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('schemaVersion', '1');
    localStorage.setItem('teamName', 'Lions');
    localStorage.setItem('players', JSON.stringify([
      { id: 'p1', name: 'Alice' },
      { id: 'p2', name: 'Bob' },
    ]));
    localStorage.setItem('matches', JSON.stringify([
      {
        id: 'm1', opponent: 'Tigers', goalsUs: 2, goalsThem: 1,
        status: 'FINISHED', archived: false,
        potdPlayerId: 'p1', secondHalfStartSec: 600, createdAt: 1700000000000,
        halfLengthSec: 1500, clockElapsedSec: 1500, clockStartWall: null,
      },
      {
        id: 'm2', opponent: 'Eagles', goalsUs: 0, goalsThem: 3,
        status: 'FINISHED', archived: true,
        potdPlayerId: null, secondHalfStartSec: 600, createdAt: 1690000000000,
        halfLengthSec: 1500, clockElapsedSec: 1500, clockStartWall: null,
      },
    ]));
    localStorage.setItem('stints', JSON.stringify([
      { id: 's1', matchId: 'm1', playerId: 'p1', role: 'GOALIE', startSec: 0, endSec: 600 },
      { id: 's2', matchId: 'm1', playerId: 'p2', role: 'GOALIE', startSec: 600, endSec: 1200 },
    ]));
    location.hash = '#/home';
  });
  await page.waitForSelector('#export-btn');

  const downloadPromise = page.waitForEvent('download');
  await page.click('#export-btn');
  const dl = await downloadPromise;

  expect(dl.suggestedFilename()).toMatch(/^matchday-\d{4}-\d{2}-\d{2}\.md$/);

  const path = await dl.path();
  const fs = await import('node:fs/promises');
  const content = await fs.readFile(path, 'utf8');

  expect(content).toMatch(/^# Lions\n/);
  expect(content).toMatch(/- Alice\n- Bob/);
  expect(content).toMatch(/### Active/);
  expect(content).toMatch(/Lions 2–1 Tigers/);
  expect(content).toMatch(/- POTD: Alice/);
  expect(content).toMatch(/- Keepers: Alice \/ Bob/);
  expect(content).toMatch(/### Archived/);
  expect(content).toMatch(/Lions 0–3 Eagles/);
});
