import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, test } from 'vitest';
import { findLesson } from '../content/manifest';
import SampleSize from './SampleSize';
import { DESIGNS } from './sampleSizeDesigns';

function setup() {
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <SampleSize />
    </MemoryRouter>,
  );
  const pick = (name: RegExp) => user.click(screen.getByRole('button', { name }));
  const next = () => user.click(screen.getByRole('button', { name: 'Next' }));
  const fill = async (label: RegExp, value: string) => {
    const input = screen.getByLabelText(label);
    await user.clear(input);
    await user.type(input, value);
  };
  return { user, pick, next, fill };
}

const report = () => document.querySelector('.ss-report')!.textContent!;
const question = () => document.querySelector('.model-chooser-current')!.textContent!;
const trail = () => [...document.querySelectorAll('.model-chooser-trail ol button')].map((b) => b.textContent!.replace('Change your answer: ', ''));

describe('sample size page', () => {
  test('walks a first-timer from the design to a plan: d = 0.30 from a raw difference', async () => {
    const { pick, next, fill } = setup();
    expect(question()).toBe('What will you test?');
    await pick(/^Compare two separate groups/);
    await pick(/How many people do I need/);
    await pick(/The smallest effect that would matter/);
    await fill(/Smallest difference between the group means/, '3');
    await fill(/Standard deviation of the outcome/, '10');
    expect(document.querySelector('.ss-meaning')!.textContent).toContain('d = 0.30');
    await next();
    await pick(/^80%/);
    await pick(/α = \.05/);
    await pick(/^Two-sided/);
    await pick(/^10%/);
    expect(question()).toBe('The sample you need');
    // pwr.t.test(d = 0.3, power = 0.8) gives n = 175.4 per group.
    expect(report()).toContain('352 participants (176 per group)');
    expect(report()).toContain('d = 0.30 with 80% power in a two-sided independent-samples t-test at α = .05');
    // 176 / 0.9 rounds up to 196 per group.
    expect(report()).toContain('we will recruit 392 participants');
    expect(screen.getByText(/pwr.t.test\(d = 0.3, sig.level = 0.05, power = 0.8/)).toBeTruthy();
    expect(trail()).toEqual(['Compare two separate groups', 'Plan a new study', 'Smallest effect that matters', 'd = 0.30', '80% power', 'α = .05', 'Two-sided', '10% dropout']);
  });

  test('a student with nothing to go on gets typical values, and Cohen\'s medium gives the textbook 64 per group', async () => {
    const { pick } = setup();
    await pick(/^Compare two separate groups/);
    await pick(/How many people do I need/);
    await pick(/I have nothing to go on yet/);
    expect(screen.getByRole('button', { name: /Typical \(d = 0.36\)/ }).textContent).toContain('Recommended');
    await pick(/Medium \(d = 0.50\)/);
    await pick(/^80%/);
    await pick(/α = \.05/);
    await pick(/^Two-sided/);
    await pick(/^None/);
    expect(report()).toContain('128 participants (64 per group)');
    expect(report()).toContain('Say that this is a conventional value');
  });

  test('the trail goes back to an earlier question and marks the earlier answer', async () => {
    const { user, pick } = setup();
    await pick(/^Compare two separate groups/);
    await pick(/How many people do I need/);
    await user.click(screen.getByRole('button', { name: 'Change your answer: Compare two separate groups' }));
    expect(question()).toBe('What will you test?');
    expect(screen.getByRole('button', { name: /^Compare two separate groups/ }).textContent).toContain('Your earlier choice');
    // Picking the same design again keeps the later answers.
    await pick(/^Compare two separate groups/);
    expect(trail()).toEqual(['Compare two separate groups']);
    await user.click(screen.getByRole('button', { name: 'Start over' }));
    expect(document.querySelector('.model-chooser-trail')).toBeNull();
  });

  test('paired designs ask for the correlation, so dz is never typed blind', async () => {
    const { pick, next, fill } = setup();
    await pick(/^Measure the same people twice/);
    await pick(/How many people do I need/);
    await pick(/The smallest effect that would matter/);
    await fill(/Smallest average change/, '2');
    await fill(/Standard deviation of the scores at one time point/, '10');
    await fill(/Correlation between the two measurements/, '.5');
    // dz = 2 / (10 × √(2 × 0.5)) = 0.20.
    expect(document.querySelector('.ss-meaning')!.textContent).toContain('dz = 0.20');
    await next();
    expect(question()).toBe('How much power do you want?');
  });

  test('a fixed sample reports the smallest detectable effect', async () => {
    const { pick, next } = setup();
    await pick(/^Compare two separate groups/);
    await pick(/What can my sample detect/);
    expect(question()).toBe('How many people will you have?');
    await next();
    await pick(/^80%/);
    await pick(/α = \.05/);
    await pick(/^Two-sided/);
    expect(report()).toContain('with 200 participants (100 per group)');
    expect(report()).toContain('effects of d = 0.40 or larger');
  });

  test('explains an impossible input instead of moving on', async () => {
    const { pick, fill } = setup();
    await pick(/^Relate two numeric variables/);
    await pick(/How many people do I need/);
    await pick(/An effect size from earlier research/);
    await fill(/Correlation reported in earlier research/, '1.2');
    expect(document.querySelector('.ss-error')!.textContent).toMatch(/below 1/);
    expect(screen.getByRole('button', { name: 'Next' })).toHaveProperty('disabled', true);
  });

  test('F and chi-square designs skip the one-sided question', async () => {
    const { pick, next } = setup();
    await pick(/^Compare three or more groups/);
    await pick(/How many people do I need/);
    await next();
    await pick(/I have nothing to go on yet/);
    await pick(/Medium \(f = 0.25\)/);
    await pick(/^80%/);
    await pick(/α = \.05/);
    expect(question()).toBe('How many people will you lose?');
    await pick(/^None/);
    // pwr.anova.test(k = 3, f = 0.25, power = 0.8) gives n = 52.4 per group.
    expect(report()).toContain('159 participants (53 per group)');
  });

  test('repeated measures with several stimuli: G*Power\'s 24 people as the minimum, plus a simulation', async () => {
    const { pick, next, fill } = setup();
    await pick(/^Measure the same people in several conditions/);
    await pick(/How many people do I need/);
    await fill(/Number of conditions/, '4');
    await next();
    await pick(/^r = \.50/);
    await pick(/Yes, several stimuli per condition/);
    await next();
    await pick(/I have nothing to go on yet/);
    await pick(/Medium \(f = 0.25\)/);
    await pick(/^80%/);
    await pick(/α = \.05/);
    await pick(/^None/);
    expect(report()).toContain('24 participants are needed to detect an effect of f = 0.25 (with a correlation of r = .50 between conditions)');
    expect(document.querySelector('.ss-warning')!.textContent).toContain('minimum');
    expect(screen.getByText(/n_people <- 24; k <- 4; n_stim <- 4/)).toBeTruthy();
    expect(trail()).toContain('Several stimuli per condition');
  });

  test('repeated measures turn expected condition means into f', async () => {
    const { pick, next, fill } = setup();
    await pick(/^Measure the same people in several conditions/);
    await pick(/How many people do I need/);
    await fill(/Number of conditions/, '4');
    await next();
    await pick(/^r = \.50/);
    await pick(/No, one score per condition/);
    await pick(/The smallest effect that would matter/);
    await fill(/condition means you expect/, '500 510 520 530');
    await fill(/Standard deviation of the scores within one condition/, '50');
    // The means spread by √125 = 11.18 around 515; 11.18 / 50 = 0.22.
    expect(document.querySelector('.ss-meaning')!.textContent).toContain('f = 0.22');
    await fill(/condition means you expect/, '500 510 520');
    expect(screen.getByRole('button', { name: 'Next' })).toHaveProperty('disabled', true);
  });

  test('three groups: expected means give f', async () => {
    const { pick, next, fill } = setup();
    await pick(/^Compare three or more groups/);
    await pick(/How many people do I need/);
    await next();
    await pick(/The smallest effect that would matter/);
    await fill(/group means you expect/, '44 46 48');
    await fill(/Standard deviation of the outcome/, '10');
    // √(8/3) / 10 = 0.16.
    expect(document.querySelector('.ss-meaning')!.textContent).toContain('f = 0.16');
  });

  test('every design links to a lesson that exists', () => {
    for (const design of DESIGNS) expect(findLesson(design.lessonId), design.id).toBeTruthy();
  });
});
