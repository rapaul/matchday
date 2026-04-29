import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/#/squad');
});

test('empty squad shows add prompt', async ({ page }) => {
  await expect(page.locator('.empty-state')).toBeVisible();
});

test('can add a player', async ({ page }) => {
  await page.fill('#player-name', 'Alice');
  await page.click('button[type="submit"]');
  await expect(page.locator('.item-list')).toContainText('Alice');
});

test('players persist across reload', async ({ page }) => {
  await page.fill('#player-name', 'Bob');
  await page.click('button[type="submit"]');
  await page.reload();
  await page.goto('/#/squad');
  await expect(page.locator('.item-list')).toContainText('Bob');
});

test('can add 9 players', async ({ page }) => {
  const names = ['Alice','Bob','Carol','Dave','Eve','Frank','Grace','Heidi','Ivan'];
  for (const name of names) {
    await page.fill('#player-name', name);
    await page.click('button[type="submit"]');
  }
  for (const name of names) {
    await expect(page.locator('.item-list')).toContainText(name);
  }
});

test('can rename a player', async ({ page }) => {
  await page.fill('#player-name', 'OldName');
  await page.click('button[type="submit"]');
  await page.click('[data-edit]');
  await page.fill('[data-player-id] input', 'NewName');
  await page.click('[data-save]');
  await expect(page.locator('.item-list')).toContainText('NewName');
  await expect(page.locator('.item-list')).not.toContainText('OldName');
});

test('can delete a player', async ({ page }) => {
  await page.fill('#player-name', 'Temporary');
  await page.click('button[type="submit"]');
  page.once('dialog', d => d.accept());
  await page.click('[data-delete]');
  await expect(page.locator('.empty-state')).toBeVisible();
});

test('deletion persists after hard refresh', async ({ page }) => {
  await page.fill('#player-name', 'DeleteMe');
  await page.click('button[type="submit"]');
  page.once('dialog', d => d.accept());
  await page.click('[data-delete]');
  await page.reload();
  await page.goto('/#/squad');
  await expect(page.locator('.empty-state')).toBeVisible();
});

test('home screen shows squad link', async ({ page }) => {
  await page.goto('/#/home');
  await expect(page.locator('a[href="#/squad"]')).toBeVisible();
});
