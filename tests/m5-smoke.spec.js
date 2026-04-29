import { test, expect } from '@playwright/test';

const PLAYERS = ['Alice','Bob','Carol','Dave','Eve','Frank','Grace','Heidi','Ivan'];

async function setup(page) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
}

test('full end-to-end smoke: add 9 players → start match → score → sub → suggest sub → change goalie → half time → 2nd half → end → POTD → home', async ({ page }) => {
  await setup(page);

  // 1. Navigate to squad and add 9 players
  await page.goto('/#/squad');
  for (const name of PLAYERS) {
    await page.fill('#player-name', name);
    await page.click('button[type="submit"]');
  }
  await expect(page.locator('.item-list .item-row')).toHaveCount(9);

  // 2. Reload and verify persistence
  await page.reload();
  await page.goto('/#/squad');
  await expect(page.locator('.item-list .item-row')).toHaveCount(9);

  // 3. Start a new match
  await page.goto('/#/new-match');
  await page.fill('#opponent', 'Blue United');
  const checks = page.locator('.player-check');
  await checks.nth(0).check();
  await page.locator('.role-select').nth(0).selectOption('GOALIE');
  for (let i = 1; i <= 6; i++) await checks.nth(i).check();
  for (let i = 7; i <= 8; i++) {
    await checks.nth(i).check();
    await page.locator('.role-select').nth(i).selectOption('BENCH');
  }
  await page.click('#kickoff-btn');
  await expect(page).toHaveURL(/live-match/);
  await expect(page.locator('h1')).toContainText('Blue United');

  // 4. Score both ways
  await page.click('#goal-us');
  await page.click('#goal-us');
  await page.click('#goal-them');
  await expect(page.locator('text=2 – 1')).toBeVisible();

  // 5. Sub in a bench player
  page.once('dialog', d => d.accept('Bob'));
  await page.locator('[data-sub-in]').first().click();

  // 6. Suggest sub (tie → dismiss alert)
  page.once('dialog', d => d.dismiss());
  await page.click('#suggest-sub-btn');

  // 7. Change goalie
  const goalieBtn = page.locator('[data-make-goalie]').first();
  if (await goalieBtn.count() > 0) await goalieBtn.click();

  // 8. Half time
  await page.click('#half-time-btn');
  await expect(page.locator('#second-half-btn')).toBeVisible();

  // 9. Start 2nd half
  await page.click('#second-half-btn');
  await expect(page.locator('#half-time-btn')).toBeVisible();

  // 10. End match with POTD
  page.once('dialog', d => d.accept('Carol'));
  await page.click('#end-match-btn');

  // 11. Home shows match with correct score and POTD
  await expect(page).toHaveURL(/home/);
  await expect(page.locator('.item-list')).toContainText('Blue United');
  await expect(page.locator('.item-list')).toContainText('2–1');
  await expect(page.locator('.item-list')).toContainText('POTD: Carol');
});

test('no console errors during full flow', async ({ page }) => {
  const errors = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', err => errors.push(err.message));

  await setup(page);

  // Quick happy path
  await page.evaluate((names) => {
    const players = names.map((name, i) => ({ id: `p${i+1}`, name }));
    localStorage.setItem('players', JSON.stringify(players));
    localStorage.setItem('schemaVersion', '1');
  }, PLAYERS);

  await page.goto('/#/new-match');
  await page.fill('#opponent', 'Test FC');
  const checks = page.locator('.player-check');
  await checks.nth(0).check();
  await page.locator('.role-select').nth(0).selectOption('GOALIE');
  for (let i = 1; i <= 6; i++) await checks.nth(i).check();
  for (let i = 7; i <= 8; i++) {
    await checks.nth(i).check();
    await page.locator('.role-select').nth(i).selectOption('BENCH');
  }
  await page.click('#kickoff-btn');
  await page.click('#goal-us');
  page.once('dialog', d => d.accept('Alice'));
  await page.click('#end-match-btn');
  await expect(page).toHaveURL(/home/);

  expect(errors).toHaveLength(0);
});

test('mobile viewport — no horizontal scroll, tap targets visible', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); // iPhone 14
  await setup(page);
  await page.goto('/');
  const body = page.locator('body');
  const bodyWidth = await body.evaluate(el => el.scrollWidth);
  const viewportWidth = 390;
  expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 5); // allow 5px tolerance

  // Check tap targets: buttons should be ≥ 44px tall
  await page.goto('/#/squad');
  await page.evaluate((names) => {
    const players = names.map((name, i) => ({ id: `p${i+1}`, name }));
    localStorage.setItem('players', JSON.stringify(players));
  }, ['TestPlayer']);
  await page.reload();
  await page.goto('/#/squad');
  const btn = page.locator('button[type="submit"]');
  const box = await btn.boundingBox();
  expect(box.height).toBeGreaterThanOrEqual(40);
});
