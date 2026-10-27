import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function expectAccessible(page, testInfo, state) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  await testInfo.attach(`axe-${state}`, { body: JSON.stringify(results, null, 2), contentType: 'application/json' });
  expect(results.violations).toEqual([]);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('renders engine output, token styling and responsive layout without runtime errors', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Small interface. Real checks.');
  const generated = page.getByRole('button', { name: 'Generated action', exact: true });
  await expect(generated).toHaveAttribute('type', 'button');
  await expect(generated).toHaveCSS('background-color', 'rgb(21, 94, 239)');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await expectAccessible(page, testInfo, 'initial');
  await testInfo.attach('initial-layout', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
  expect(errors).toEqual([]);
});

test('validates, saves with the keyboard, disables duplicate save, and accepts edits', async ({ page }, testInfo) => {
  const name = page.getByRole('textbox', { name: 'Display name' });
  const save = page.getByRole('button', { name: 'Save preferences' });
  await save.click();
  await expect(name).toBeFocused();
  await expect(name).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByText('Enter a display name before saving.')).toBeVisible();
  await expectAccessible(page, testInfo, 'validation');
  await name.fill('   Ada   ');
  await page.keyboard.press('Tab');
  await expect(save).toBeFocused();
  await expect(save).toHaveCSS('outline-style', 'solid');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('status')).toContainText('Saved for this session: Ada');
  await expect(name).toHaveValue('Ada');
  await expect(save).toBeDisabled();
  await expectAccessible(page, testInfo, 'saved');
  await name.fill('Grace');
  await expect(save).toBeEnabled();
  await name.press('Enter');
  await expect(page.getByRole('status')).toContainText('Grace');
  await page.reload();
  await expect(name).toHaveValue('');
});

test('cancel and Escape preserve data; repeated opening restores focus; reset clears state', async ({ page }, testInfo) => {
  const name = page.getByRole('textbox', { name: 'Display name' });
  const reset = page.getByRole('button', { name: 'Reset example', exact: true });
  await expect(reset).toBeDisabled();
  await name.fill('Lin');
  await page.getByRole('button', { name: 'Save preferences' }).click();
  await reset.click();
  const dialog = page.getByRole('dialog', { name: 'Reset this example?' });
  await expect(dialog).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cancel' })).toBeFocused();
  await expectAccessible(page, testInfo, 'dialog');
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(reset).toBeFocused();
  await expect(name).toHaveValue('Lin');
  await reset.press('Enter');
  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(reset).toBeFocused();
  await expect(name).toHaveValue('Lin');
  await reset.press('Enter');
  await page.getByRole('button', { name: 'Reset now' }).click();
  await expect(dialog).not.toBeVisible();
  await expect(name).toHaveValue('');
  await expect(page.getByRole('status')).toBeEmpty();
  await expect(reset).toBeDisabled();
  await expectAccessible(page, testInfo, 'reset');
});
