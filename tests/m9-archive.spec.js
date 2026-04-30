import { test, expect } from '@playwright/test';

async function setup(page) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
}

async function seed(page, matches) {
  await page.evaluate((matches) => {
    localStorage.setItem('schemaVersion', '1');
    localStorage.setItem('players', JSON.stringify([{ id: 'p1', name: 'Alice' }]));
    localStorage.setItem('matches', JSON.stringify(matches));
    localStorage.setItem('stints', JSON.stringify([]));
  }, matches);
}

test('archived match is hidden from main list and shown in archived section', async ({ page }) => {
  await setup(page);
  await seed(page, [
    {
      id: 'm1', opponent: 'Red FC', halfLengthSec: 600, status: 'FINISHED',
      goalsUs: 1, goalsThem: 0, potdPlayerId: null,
      createdAt: Date.now(), clockElapsedSec: 0, clockStartWall: null, archived: false,
    },
    {
      id: 'm2', opponent: 'Blue FC', halfLengthSec: 600, status: 'FINISHED',
      goalsUs: 2, goalsThem: 2, potdPlayerId: null,
      createdAt: Date.now(), clockElapsedSec: 0, clockStartWall: null, archived: true,
    },
  ]);
  await page.goto('/#/home');

  // Main list shows only the non-archived match
  await expect(page.locator('.item-row').filter({ hasText: 'Red FC' })).toHaveCount(1);
  await expect(page.locator('details .item-row').filter({ hasText: 'Red FC' })).toHaveCount(0);

  // Archived match is inside <details> only
  await expect(page.locator('details .item-row').filter({ hasText: 'Blue FC' })).toHaveCount(1);

  // Archived section is collapsed by default
  const details = page.locator('details');
  await expect(details).toHaveJSProperty('open', false);
});

test('archive button moves match into archived section; unarchive restores it', async ({ page }) => {
  await setup(page);
  await seed(page, [
    {
      id: 'm1', opponent: 'Red FC', halfLengthSec: 600, status: 'FINISHED',
      goalsUs: 1, goalsThem: 0, potdPlayerId: null,
      createdAt: Date.now(), clockElapsedSec: 0, clockStartWall: null, archived: false,
    },
  ]);
  await page.goto('/#/home');

  // Click archive
  await page.locator('[data-archive="m1"]').click();

  // No longer in main list (empty state shown instead)
  await expect(page.locator('.empty-state')).toContainText('No finished matches yet');
  // Now in archived section
  await page.locator('details > summary').click();
  await expect(page.locator('details .item-row').filter({ hasText: 'Red FC' })).toHaveCount(1);

  // Unarchive
  await page.locator('[data-unarchive="m1"]').click();
  await expect(page.locator('.item-row').filter({ hasText: 'Red FC' })).toHaveCount(1);
  await expect(page.locator('details')).toHaveCount(0);
});

test('archive button on a LIVE match hides it from Live section', async ({ page }) => {
  await setup(page);
  await seed(page, [
    {
      id: 'm1', opponent: 'Wrong FC', halfLengthSec: 600, status: 'LIVE',
      goalsUs: 0, goalsThem: 0, potdPlayerId: null,
      createdAt: Date.now(), clockElapsedSec: 0, clockStartWall: null, archived: false,
    },
  ]);
  await page.goto('/#/home');
  await expect(page.getByText('Wrong FC')).toBeVisible();

  await page.locator('[data-archive="m1"]').click();
  // Live section now empty; match only visible inside archived <details>
  await page.locator('details > summary').click();
  await expect(page.locator('details').getByText('Wrong FC')).toBeVisible();
});
