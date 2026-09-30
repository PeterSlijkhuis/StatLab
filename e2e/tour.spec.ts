import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// A first visit: the config marks the tour as seen for every other spec.
test.use({ storageState: { cookies: [], origins: [] }, reducedMotion: 'reduce' });

test('the tour shows on a first visit, steps through, and stays away once skipped', async ({ page }) => {
  await page.goto('./');
  const tour = page.getByRole('dialog', { name: 'Welcome to StatLab' });
  await expect(tour).toBeVisible();
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).include('.tour-card').analyze()).violations).toEqual([]);

  await page.getByRole('button', { name: 'Show me around' }).click();
  await expect(page.getByRole('dialog', { name: 'The modules' })).toBeVisible();
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByRole('dialog', { name: 'Your avatar' })).toBeVisible();
  await page.getByRole('button', { name: 'Back' }).click();
  await expect(page.getByRole('dialog', { name: 'The modules' })).toBeVisible();

  await page.getByRole('button', { name: 'Skip tour' }).click();
  await expect(page.locator('.tour')).toHaveCount(0);
  await page.reload();
  await page.waitForTimeout(1000);
  await expect(page.locator('.tour')).toHaveCount(0);

  // The helper can bring it back.
  await page.getByRole('button', { name: /Where to\?/ }).click();
  await page.getByRole('button', { name: 'Show me around the site' }).click();
  await expect(page.getByRole('dialog', { name: 'Welcome to StatLab' })).toBeVisible();
});

test('on a phone the tour points at the Lessons button instead of the hidden sidebar', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 740 });
  await page.goto('./');
  await page.getByRole('button', { name: 'Show me around' }).click();
  await expect(page.getByRole('dialog', { name: 'The lessons' })).toBeVisible();
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByRole('dialog', { name: 'The modules' })).toHaveCount(0);
});
