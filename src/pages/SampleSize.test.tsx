import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, test } from 'vitest';
import { findLesson } from '../content/manifest';
import SampleSize from './SampleSize';
import { DESIGNS } from './sampleSizeDesigns';

function renderPage() {
  return render(
    <MemoryRouter>
      <SampleSize />
    </MemoryRouter>,
  );
}

const report = () => document.querySelector('.ss-report')!.textContent!;

describe('sample size page', () => {
  test('plans a two-group study at d = 0.5 as the lesson does: 64 per group', () => {
    renderPage();
    expect(report()).toContain('128 participants (64 per group)');
    expect(report()).toContain('d = 0.50 with 80% power in a two-sided independent-samples t-test at α = .05');
    // 10% dropout by default: 64 / 0.9 rounds up to 72 per group.
    expect(report()).toContain('we will recruit 144 participants');
    expect(screen.getByText(/pwr.t.test\(d = 0.5, sig.level = 0.05, power = 0.8/)).toBeTruthy();
  });

  test('a design change resets the effect and names its own test', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('radio', { name: /Relate two numeric variables/ }));
    expect(screen.getByLabelText(/the correlation r/)).toHaveProperty('value', '0.3');
    expect(report()).toContain('85 participants');
    expect(report()).toContain('r = .30');
  });

  test('the benchmark buttons fill in the effect', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: 'Large (0.80)' }));
    expect(report()).toContain('52 participants (26 per group)');
  });

  test('the calculator turns a raw difference into d', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByText(/Work out d from what you know/));
    await user.type(screen.getByLabelText(/Difference between the means/), '3');
    await user.type(screen.getByLabelText(/Standard deviation within the groups/), '10');
    await user.click(screen.getByRole('button', { name: 'Use this value' }));
    expect(screen.getByLabelText(/Cohen's d \(d\)/)).toHaveProperty('value', '0.3');
  });

  test('a fixed sample reports the smallest detectable effect', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('radio', { name: /What can my sample detect/ }));
    expect(report()).toContain('with 100 participants (50 per group)');
    expect(report()).toContain('effects of d = 0.57 or larger');
  });

  test('explains an impossible input instead of computing', async () => {
    const user = userEvent.setup();
    renderPage();
    const input = screen.getByLabelText(/Cohen's d \(d\)/);
    await user.clear(input);
    await user.type(input, '-0.4');
    expect(screen.getByRole('alert').textContent).toMatch(/without a minus sign/);
  });

  test('F and chi-square designs have no one-sided option', async () => {
    const user = userEvent.setup();
    renderPage();
    expect(screen.getByRole('group', { name: 'One or two sides?' })).toBeTruthy();
    await user.click(screen.getByRole('radio', { name: /Compare three or more groups/ }));
    expect(screen.queryByRole('group', { name: 'One or two sides?' })).toBeNull();
  });

  test('every design links to a lesson that exists', () => {
    for (const design of DESIGNS) expect(findLesson(design.lessonId), design.id).toBeTruthy();
  });
});
