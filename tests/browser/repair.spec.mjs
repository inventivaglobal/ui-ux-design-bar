import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {settleVisuals} from './settle.mjs';

async function scan(page, testInfo, state) {
  await settleVisuals(page);
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  await testInfo.attach(`repair-${state}`, { body: JSON.stringify(result, null, 2), contentType: 'application/json' });
  return result.violations;
}

test('real repair removes the demonstrated axe violation, preserves BUILD output and reverses cleanly', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/?demo=repair');
  const image = page.getByTestId('repair-fixture').locator('img');
  const toggle = page.getByRole('button', { name: 'Preview safe repair' });
  await expect(image).not.toHaveAttribute('alt');
  const before = await scan(page, testInfo, 'before');
  expect(before.map(v => v.id)).toEqual(['image-alt']);
  expect(before[0].nodes).toHaveLength(1);
  await expect(page.getByRole('button', { name: 'Generated action', exact: true })).toBeVisible();
  await toggle.focus();
  await page.keyboard.press('Enter');
  await expect(image).toHaveAttribute('alt', '');
  await expect(page.getByRole('status')).toContainText('0 findings');
  expect(await scan(page, testInfo, 'after')).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await testInfo.attach('repair-layout', { body: await page.screenshot({ fullPage: true, animations: 'disabled' }), contentType: 'image/png' });
  await page.getByRole('button', { name: 'Restore broken fixture' }).press('Enter');
  await expect(image).not.toHaveAttribute('alt');
  await page.getByRole('button', { name: 'Preview safe repair' }).press('Enter');
  expect(await scan(page, testInfo, 'repeated')).toEqual([]);
  await page.getByRole('link', { name: 'Back to preferences example' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Small interface. Real checks.');
  await page.goBack();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Break it. Find it. Fix it.');
  await expect(image).not.toHaveAttribute('alt');
  expect(errors).toEqual([]);
});
