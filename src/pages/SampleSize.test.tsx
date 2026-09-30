import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { describe, expect, test } from 'vitest';
import { findLesson } from '../content/manifest';
import SampleSize from './SampleSize';
import { DESIGNS } from './sampleSizeDesigns';

/** Stands in for the browser's Back button. */
function BrowserBack() {
  const navigate = useNavigate();
  return <button type="button" onClick={() => navigate(-1)}>Browser back</button>;
}

function setup() {
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <SampleSize />
      <BrowserBack />
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
    // Each design names the model the course fits, not only the classic test.
    expect(screen.getByRole('button', { name: /^Compare two separate groups/ }).textContent).toContain('In R: lm(outcome ~ group)');
    await pick(/^Compare two separate groups/);
    await pick(/How many people do I need/);
    await pick(/I can guess the scores/);
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
    expect(screen.getByText(/is the independent-samples t-test \(Lesson 12-1\)/)).toBeTruthy();
    expect(trail()).toEqual(['Compare two separate groups', 'Plan a new study', 'My own guess of the scores', 'd = 0.30', '80% power', 'α = .05', 'Two-sided', '10% dropout']);
  });

  test('a student with nothing to go on gets typical values, and Cohen\'s medium gives the textbook 64 per group', async () => {
    const { pick } = setup();
    await pick(/^Compare two separate groups/);
    await pick(/How many people do I need/);
    await pick(/Choose a size in plain words/);
    const typical = screen.getByRole('button', { name: /Typical \(d = 0.36\)/ });
    expect(typical.textContent).toContain('Recommended');
    // pwr.t.test(d = 0.36, power = 0.8): 122.1 per group, so 123 × 2.
    expect(typical.textContent).toContain('Needs about 246 people');
    await pick(/Medium: noticeable \(d = 0.50\)/);
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
    await pick(/I can guess the scores/);
    await fill(/Smallest average change/, '2');
    await fill(/Standard deviation of the scores at one time point/, '10');
    expect(screen.getByLabelText(/Correlation between the two measurements/)).toHaveProperty('value', '.5');
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
    await pick(/I have an effect size from a paper/);
    await fill(/Correlation reported in earlier research/, '1.2');
    expect(document.querySelector('.ss-error')!.textContent).toMatch(/below 1/);
    expect(screen.getByRole('button', { name: 'Next' })).toHaveProperty('disabled', true);
  });

  test('F and chi-square designs skip the one-sided question', async () => {
    const { pick, next } = setup();
    await pick(/^Compare three or more groups/);
    await pick(/How many people do I need/);
    await next();
    await pick(/Choose a size in plain words/);
    await pick(/Medium: noticeable \(f = 0.25\)/);
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
    await pick(/Choose a size in plain words/);
    await pick(/Medium: noticeable \(f = 0.25\)/);
    await pick(/^80%/);
    await pick(/α = \.05/);
    await pick(/^None/);
    expect(report()).toContain('24 participants are needed to detect an effect of f = 0.25 (with a correlation of r = .50 between conditions)');
    expect(document.querySelector('.ss-warning')!.textContent).toContain('minimum');
    expect(screen.getByText(/n_people <- 24; k <- 4; n_stim <- 4/)).toBeTruthy();
    expect(trail()).toContain('Several stimuli per condition');
  });

  test('repeated measures turn the biggest difference into f', async () => {
    const { pick, next, fill } = setup();
    await pick(/^Measure the same people in several conditions/);
    await pick(/How many people do I need/);
    await fill(/Number of conditions/, '4');
    await next();
    await pick(/^r = \.50/);
    await pick(/No, one score per condition/);
    await pick(/I can guess the scores/);
    await fill(/highest and the lowest condition mean/, '30');
    await fill(/Standard deviation of the scores within one condition/, '50');
    // Cohen's cautious pattern: f = (30 / 50) / √(2 × 4) = 0.21.
    expect(document.querySelector('.ss-meaning')!.textContent).toContain('f = 0.21');
    await fill(/Standard deviation of the scores within one condition/, '0');
    expect(screen.getByRole('button', { name: 'Next' })).toHaveProperty('disabled', true);
  });

  test('three groups: the biggest difference gives f', async () => {
    const { pick, next, fill } = setup();
    await pick(/^Compare three or more groups/);
    await pick(/How many people do I need/);
    await next();
    await pick(/I can guess the scores/);
    await fill(/highest and the lowest group mean/, '4');
    await fill(/Standard deviation of the outcome/, '10');
    // (4 / 10) / √(2 × 3) = 0.16.
    expect(document.querySelector('.ss-meaning')!.textContent).toContain('f = 0.16');
  });

  test('a before-and-after study with a control group plans for the interaction in a 2 × 2 mixed design', async () => {
    const { pick, next, fill } = setup();
    await pick(/^Two factors at once/);
    await pick(/How many people do I need/);
    await pick(/One factor between people, one within/);
    await pick(/Whether one factor's effect depends on the other/);
    await pick(/^r = \.50/);
    await pick(/I can guess the scores/);
    await fill(/Effect of one factor at the first level/, '5');
    await fill(/The same effect at the other level/, '0');
    await fill(/Standard deviation of the scores within one cell/, '10');
    // (5 − 0) / 10 = 0.5 SD, f = 0.5 / √(8 × (1 − .5)) = 0.25.
    expect(document.querySelector('.ss-meaning')!.textContent).toContain('f = 0.25');
    await next();
    await pick(/^80%/);
    await pick(/α = \.05/);
    expect(question()).toBe('How many people will you lose?');
    await pick(/^None/);
    // λ = N·f² with df2 = N − 2: 128 people, 64 per group.
    expect(report()).toContain('128 participants (64 per group, each measured in both conditions) are needed to detect an effect of f = 0.25 (with a correlation of r = .50 between conditions)');
    expect(report()).toContain('the F test for the interaction in a 2 × 2 mixed ANOVA');
    expect(trail()).toContain('One factor between, one within');
  });

  test('2 × 2 in plain words: interactions are described by their shape, and between designs skip the correlation', async () => {
    const { pick } = setup();
    await pick(/^Two factors at once/);
    await pick(/How many people do I need/);
    await pick(/Each person is in one combination only/);
    await pick(/Whether one factor's effect depends on the other/);
    expect(question()).toBe('How big is the effect you want to be able to find?');
    await pick(/Choose a size in plain words/);
    const disappears = screen.getByRole('button', { name: /The effect disappears \(f = 0.13\)/ });
    expect(disappears.textContent).toContain('Recommended');
    // f = 0.5 / 4 = 0.125: λ = N/64 reaches 80% power at 508 people (127 per cell), as in R.
    expect(disappears.textContent).toContain('Needs about 508 people');
    await pick(/The effect disappears/);
    await pick(/^80%/);
    await pick(/α = \.05/);
    await pick(/^None/);
    expect(report()).toContain('508 participants (127 in each of the four cells)');
  });

  test("the browser's Back button goes back one question, keeping the answers", async () => {
    const { user, pick } = setup();
    await pick(/^Compare two separate groups/);
    await pick(/How many people do I need/);
    expect(question()).toBe('How big is the effect you want to be able to find?');
    await user.click(screen.getByRole('button', { name: 'Browser back' }));
    expect(question()).toBe('What do you want to find out?');
    expect(screen.getByRole('button', { name: /How many people do I need/ }).textContent).toContain('Your earlier choice');
    await user.click(screen.getByRole('button', { name: 'Browser back' }));
    expect(question()).toBe('What will you test?');
  });

  test('every design links to a lesson that exists', () => {
    for (const design of DESIGNS) expect(findLesson(design.lessonId), design.id).toBeTruthy();
  });
});
