import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:4321/';

function seed(page) {
  return page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('schemaVersion', '1');
    localStorage.setItem('teamName', 'Lions');
    localStorage.setItem('players', JSON.stringify([{ id: 'p1', name: 'Alice' }]));
    localStorage.setItem('matches', JSON.stringify([{
      id: 'm1', opponent: 'Tigers', goalsUs: 2, goalsThem: 1,
      status: 'FINISHED', archived: false, potdPlayerId: 'p1',
      secondHalfStartSec: 600, createdAt: 1700000000000,
      halfLengthSec: 1500, clockElapsedSec: 1500, clockStartWall: null,
    }]));
    localStorage.setItem('stints', JSON.stringify([
      { id: 's1', matchId: 'm1', playerId: 'p1', role: 'GOALIE', startSec: 0, endSec: 600 },
    ]));
    location.hash = '#/home';
  });
}

test('export data downloads a JSON backup of all stored data', async ({ page }) => {
  await page.goto(BASE);
  await seed(page);
  await page.waitForSelector('#export-json-btn');

  const downloadPromise = page.waitForEvent('download');
  await page.click('#export-json-btn');
  const dl = await downloadPromise;

  expect(dl.suggestedFilename()).toMatch(/^matchday-backup-\d{4}-\d{2}-\d{2}\.json$/);

  const path = await dl.path();
  const fs = await import('node:fs/promises');
  const backup = JSON.parse(await fs.readFile(path, 'utf8'));

  expect(backup.app).toBe('matchday');
  expect(backup.schemaVersion).toBe(1);
  expect(backup.data.teamName).toBe('Lions');
  expect(backup.data.players).toEqual([{ id: 'p1', name: 'Alice' }]);
  expect(backup.data.matches[0].opponent).toBe('Tigers');
  expect(backup.data.stints).toHaveLength(1);
});

test('import replaces all data after confirming the warning', async ({ page }) => {
  await page.goto(BASE);
  await seed(page);
  await page.waitForSelector('#import-json-btn');

  const backup = {
    app: 'matchday',
    schemaVersion: 1,
    data: {
      teamName: 'Rovers',
      players: [{ id: 'x1', name: 'Zoe' }],
      matches: [{
        id: 'x9', opponent: 'Bears', goalsUs: 0, goalsThem: 0,
        status: 'FINISHED', archived: false, potdPlayerId: null,
        secondHalfStartSec: null, createdAt: 1710000000000,
        halfLengthSec: 1500, clockElapsedSec: 0, clockStartWall: null,
      }],
      stints: [],
    },
  };

  let dialogMessage = '';
  page.on('dialog', d => { dialogMessage = d.message(); d.accept(); });

  await page.setInputFiles('#import-json-input', {
    name: 'backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(backup)),
  });

  await page.waitForFunction(() => localStorage.getItem('teamName') === 'Rovers');
  expect(dialogMessage).toMatch(/DELETE and REPLACE/);

  // Old data is gone, new data present and rendered
  await expect(page.locator('body')).toContainText('Rovers 0–0 Bears');
  await expect(page.locator('body')).not.toContainText('Tigers');
  const players = await page.evaluate(() => JSON.parse(localStorage.getItem('players')));
  expect(players).toEqual([{ id: 'x1', name: 'Zoe' }]);
});

test('cancelling the import warning leaves data untouched', async ({ page }) => {
  await page.goto(BASE);
  await seed(page);
  await page.waitForSelector('#import-json-btn');

  page.on('dialog', d => d.dismiss());

  await page.setInputFiles('#import-json-input', {
    name: 'backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({
      app: 'matchday', schemaVersion: 1,
      data: { teamName: 'Rovers', players: [], matches: [], stints: [] },
    })),
  });

  // Give the handler a tick, then assert nothing changed
  await expect(page.locator('body')).toContainText('Lions 2–1 Tigers');
  const teamName = await page.evaluate(() => localStorage.getItem('teamName'));
  expect(teamName).toBe('Lions');
});

test('importing a non-Matchday file shows an error and keeps data', async ({ page }) => {
  await page.goto(BASE);
  await seed(page);
  await page.waitForSelector('#import-json-btn');

  let alertMessage = '';
  page.on('dialog', d => { alertMessage = d.message(); d.accept(); });

  await page.setInputFiles('#import-json-input', {
    name: 'not-a-backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ hello: 'world' })),
  });

  await expect.poll(() => alertMessage).toMatch(/does not look like a Matchday backup/);
  const teamName = await page.evaluate(() => localStorage.getItem('teamName'));
  expect(teamName).toBe('Lions');
});
