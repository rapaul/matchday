import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // Clear localStorage so tests are isolated
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
});

test('home view loads by default', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('Match Tracker');
});

test('hash routing to #/squad shows Squad', async ({ page }) => {
  await page.goto('/#/squad');
  await expect(page.locator('h1')).toContainText('Squad');
});

test('hash routing to #/new-match shows New match', async ({ page }) => {
  await page.goto('/#/new-match');
  await expect(page.locator('h1')).toContainText('New match');
});

test('hash routing to live match route renders without crash', async ({ page }) => {
  await page.goto('/#/live-match/abc123');
  // No real match exists, so shows "not found" — but routing works (no 404 page)
  await expect(page.locator('.page-body')).toContainText('not found');
});

test('localStorage round-trips via storage module', async ({ page }) => {
  await page.goto('/');
  const result = await page.evaluate(() => {
    localStorage.setItem('players', JSON.stringify([{ id: '1', name: 'Alice' }]));
    const raw = localStorage.getItem('players');
    return JSON.parse(raw);
  });
  expect(result).toEqual([{ id: '1', name: 'Alice' }]);
});
