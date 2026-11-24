import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, test } from 'vitest';
import { setLanguage } from '../state/language';
import SampleSize from './SampleSize';

afterEach(() => setLanguage('en'));

test('the planner walks to a Dutch report with decimal commas', async () => {
  setLanguage('nl');
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <SampleSize />
    </MemoryRouter>,
  );
  const pick = (name: RegExp) => user.click(screen.getByRole('button', { name }));
  expect(document.querySelector('.model-chooser-current')!.textContent).toBe('Wat ga je toetsen?');
  await pick(/Twee aparte groepen vergelijken/);
  await pick(/Hoeveel mensen heb ik nodig/);
  await pick(/Kies een grootte in gewone woorden/);
  await pick(/Typisch \(d = 0,36\)/);
  await pick(/80%/);
  await pick(/α = ,05/);
  await pick(/Tweezijdig/);
  await pick(/Geen/);
  const report = document.querySelector('.ss-report')!.textContent!;
  expect(report).toContain('poweranalyse');
  expect(report).toContain('d = 0,36');
  expect(report).toContain('α = ,05');
  expect(report).not.toMatch(/participants|power analysis/);
});
