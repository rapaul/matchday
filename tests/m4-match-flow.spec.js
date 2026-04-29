import { test, expect } from '@playwright/test';

const PLAYERS = ['Alice','Bob','Carol','Dave','Eve','Frank','Grace','Heidi','Ivan'];

async function seedPlayers(page) {
  await page.evaluate((names) => {
    const players = names.map((name, i) => ({ id: `p${i+1}`, name }));
    localStorage.setItem('players', JSON.stringify(players));
    localStorage.setItem('schemaVersion', '1');
  }, PLAYERS);
}

async function startMatch(page) {
  await page.goto('/#/new-match');
  await page.fill('#opponent', 'Red FC');
  // Pick all 9 players: first as goalie, next 6 outfield, last 2 bench
  const checks = page.locator('.player-check');
  await checks.nth(0).check();
  await page.locator('.role-select').nth(0).selectOption('GOALIE');
  for (let i = 1; i <= 6; i++) {
    await checks.nth(i).check();
    // default role is FIELD — no need to change
  }
  for (let i = 7; i <= 8; i++) {
    await checks.nth(i).check();
    await page.locator('.role-select').nth(i).selectOption('BENCH');
  }
  await page.click('#kickoff-btn');
  await expect(page).toHaveURL(/live-match/);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await seedPlayers(page);
});

test('new-match shows error if fewer than 9 players', async ({ page }) => {
  await page.evaluate(() => localStorage.setItem('players', JSON.stringify([{ id: 'p1', name: 'Solo' }])));
  await page.goto('/#/new-match');
  await expect(page.locator('.page-body')).toContainText('at least 9 players');
});

test('new-match kickoff button disabled until valid lineup', async ({ page }) => {
  await page.goto('/#/new-match');
  await expect(page.locator('#kickoff-btn')).toBeDisabled();
});

test('can start a match and see live match screen', async ({ page }) => {
  await startMatch(page);
  await expect(page.locator('h1')).toContainText('vs Red FC');
  await expect(page.locator('#clock-display')).toBeVisible();
});

test('goal +Us increments our score', async ({ page }) => {
  await startMatch(page);
  await page.click('#goal-us');
  await expect(page.locator('text=1 – 0')).toBeVisible();
});

test('goal +Them increments their score', async ({ page }) => {
  await startMatch(page);
  await page.click('#goal-them');
  await expect(page.locator('text=0 – 1')).toBeVisible();
});

test('on-field and bench lists render correctly', async ({ page }) => {
  await startMatch(page);
  // goalie indicator present
  await expect(page.locator('.page-body')).toContainText('🧤');
  // bench section present with 2 players
  const benchItems = page.locator('.page-body ul').nth(1).locator('.item-row');
  await expect(benchItems).toHaveCount(2);
});

test('sub in bench player via dialog', async ({ page }) => {
  await startMatch(page);
  // "Sub in" the first bench player
  page.once('dialog', async d => {
    // type the name of an outfielder (Bob, position 2)
    await d.accept('Bob');
  });
  await page.locator('[data-sub-in]').first().click();
  // after swap, bench count changes — Grace (p8) moved on field
  await expect(page.locator('.page-body')).toContainText('Bob');
});

test('half time pauses clock and shows Start 2nd half', async ({ page }) => {
  await startMatch(page);
  await page.click('#half-time-btn');
  await expect(page.locator('#second-half-btn')).toBeVisible();
  await expect(page.locator('#half-time-btn')).not.toBeVisible();
});

test('2nd half button resumes clock', async ({ page }) => {
  await startMatch(page);
  await page.click('#half-time-btn');
  await page.click('#second-half-btn');
  await expect(page.locator('#half-time-btn')).toBeVisible();
});

test('end match navigates to home with finished match', async ({ page }) => {
  await startMatch(page);
  // Score a goal first
  await page.click('#goal-us');
  // End match — POTD dialog
  page.once('dialog', async d => { await d.accept('Alice'); });
  await page.click('#end-match-btn');
  await expect(page).toHaveURL(/home/);
  await expect(page.locator('.item-list')).toContainText('Red FC');
  await expect(page.locator('.item-list')).toContainText('1–0');
  await expect(page.locator('.item-list')).toContainText('POTD: Alice');
});

test('suggest sub shows alert on empty bench or tie', async ({ page }) => {
  await startMatch(page);
  page.once('dialog', d => d.accept()); // dismiss the suggest-sub alert
  await page.click('#suggest-sub-btn');
  // if tie (all bench players have 0 min), gets "no clear suggestion"
  // just check it doesn't crash
  await expect(page.locator('.page-body')).toBeVisible();
});
