import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

// Every page must pass the automated WCAG 2.1 AA rules. Automated checks catch
// roughly a third of accessibility problems; the rest needs a person with a
// screen reader and a keyboard. None of this needs R.
// Scroll-in animations fade text from transparent, which axe would flag mid-fade.
test.use({ reducedMotion: 'reduce' });

const LESSONS = [...readFileSync('src/content/manifest.ts', 'utf8').matchAll(/id: '(\d\d-\d)'/g)].map((m) => m[1]);
const PAGES = ['./', './workspace', './which-model', './sample-size', './review', './avatar', ...LESSONS.map((id) => `./lesson/${id}`)];

async function violations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    // CodeMirror's editor is checked by its own project; its internals are not ours to fix.
    .exclude('.cm-editor')
    .analyze();
  return results.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(' ')).slice(0, 5).join(' | ')}`);
}

test('every page passes the automated WCAG 2.1 AA checks', async ({ page }) => {
  test.setTimeout(600_000);
  const found: string[] = [];
  for (const path of PAGES) {
    await page.goto(path);
    await expect(page.locator('main h1').first()).toBeVisible();
    for (const v of await violations(page)) found.push(`${path}: ${v}`);
  }
  expect(found, found.join('\n')).toEqual([]);
});

test('answer feedback passes the automated WCAG 2.1 AA checks', async ({ page }) => {
  await page.goto('./lesson/03-4');
  await expect(page.locator('main h1').first()).toBeVisible();
  // Answer every choice block so the right, wrong and coach bubbles are all on the page.
  for (const block of await page.locator('.choice-block').all()) {
    const option = block.getByRole('button').first();
    if (await option.isEnabled()) await option.click();
  }
  expect(await violations(page)).toEqual([]);
});
