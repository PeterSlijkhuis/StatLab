import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import Exercise from './Exercise';
import { R_STOPPED_MESSAGE } from './CodeBlock';
import { LessonProvider } from '../content/LessonContext';
import { getProgress } from '../state/progress';
import type { ExerciseDef } from '../r/checker';

vi.mock('./REditor', () => ({
  default: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <textarea aria-label="R code" value={value} onChange={(e) => onChange(e.target.value)} />
  ),
}));

const definition: ExerciseDef = {
  id: 'm6-e1',
  prompt: 'Assign the mean of x to m.',
  starterCode: 'm <- ',
  solution: 'm <- mean(x)',
  wrongAnswers: ['m <- 0'],
  check: 'list(pass = TRUE, message = "ok")',
  hints: ['Use mean().', 'Write m <- mean(x).'],
};

vi.mock('../content/exercises', () => ({
  getExercise: (id: string) => (id === 'm6-e1' ? definition : undefined),
}));

const runExercise = vi.hoisted(() => vi.fn());
vi.mock('../r/checker', async (original) => ({
  ...(await original<typeof import('../r/checker')>()),
  runExercise,
}));

const emptyRun = { output: [], images: [], errored: false };

function renderExercise() {
  return render(
    <LessonProvider value={{ lessonId: '06-1', webR: {} as never, env: {} as never, ready: true }}>
      <Exercise id="m6-e1" />
    </LessonProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
  runExercise.mockReset();
});

describe('Exercise', () => {
  test('shows the prompt and starter code', () => {
    renderExercise();
    expect(screen.getByText(/assign the mean/i)).toBeDefined();
    expect(screen.getByLabelText('R code')).toHaveProperty('value', 'm <- ');
  });

  test('a pass is recorded and announced', async () => {
    runExercise.mockResolvedValue({ status: 'pass', message: 'Correct.', run: emptyRun });
    renderExercise();
    await userEvent.click(screen.getByRole('button', { name: /check/i }));
    await waitFor(() => expect(screen.getByText('Correct.')).toBeDefined());
    expect(getProgress().lessons['06-1'].exercises['m6-e1']).toBe('passed');
  });

  test('an answer that prints nothing leaves no empty output panel', async () => {
    runExercise.mockResolvedValue({ status: 'pass', message: 'Correct.', run: emptyRun });
    const { container } = renderExercise();
    await userEvent.click(screen.getByRole('button', { name: /check/i }));
    await waitFor(() => expect(screen.getByText('Correct.')).toBeDefined());
    expect(container.querySelector('.output-pane')).toBeNull();
  });

  test('a failed check records an attempt, not a pass', async () => {
    runExercise.mockResolvedValue({ status: 'fail', message: 'm is 0 but should be 5.', run: emptyRun });
    renderExercise();
    await userEvent.click(screen.getByRole('button', { name: /check/i }));
    await waitFor(() => expect(screen.getByText(/should be 5/)).toBeDefined());
    expect(getProgress().lessons['06-1'].exercises['m6-e1']).toBe('attempted');
  });

  test('a student error is shown as an R error, not as a wrong answer', async () => {
    runExercise.mockResolvedValue({
      status: 'student-error',
      message: 'Your code did not run.',
      run: { output: [{ type: 'error', data: 'could not find function' }], images: [], errored: true },
    });
    renderExercise();
    await userEvent.click(screen.getByRole('button', { name: /check/i }));
    await waitFor(() => expect(screen.getByText(/could not find function/)).toBeDefined());
    expect(screen.queryByText(/not quite/i)).toBeNull();
  });

  test('the avatar explains an R error in plain words', async () => {
    runExercise.mockResolvedValue({
      status: 'student-error',
      message: 'Your code did not run.',
      run: { output: [{ type: 'error', data: "object 'mn' not found" }], images: [], errored: true },
    });
    const { container } = renderExercise();
    await userEvent.click(screen.getByRole('button', { name: /check/i }));
    await waitFor(() => expect(container.querySelector('.avatar-tip-error')).not.toBeNull());
    expect(container.querySelector('.avatar-tip-error')!.textContent).toMatch(/anything called "mn"/);
  });

  test('the avatar gives the reason for a wrong answer and points to a hint', async () => {
    runExercise.mockResolvedValue({ status: 'fail', message: 'm is 0 but should be 5.', run: emptyRun });
    const { container } = renderExercise();
    await userEvent.click(screen.getByRole('button', { name: /check/i }));
    await waitFor(() => expect(container.querySelector('.avatar-tip-wrong')).not.toBeNull());
    expect(container.querySelector('.avatar-tip-wrong')!.textContent).toMatch(/should be 5.*Show a hint/);
  });

  test('a broken check blames the exercise, never the student', async () => {
    runExercise.mockResolvedValue({ status: 'broken-check', message: 'check exploded', run: emptyRun });
    renderExercise();
    await userEvent.click(screen.getByRole('button', { name: /check/i }));
    await waitFor(() => expect(screen.getByText(/problem with this exercise/i)).toBeDefined());
    expect(getProgress().lessons['06-1']?.exercises['m6-e1']).toBeUndefined();
  });

  test('the avatar sets the task, gives hints, praises a pass and shows the solution', async () => {
    runExercise.mockResolvedValue({ status: 'pass', message: 'Correct.', run: emptyRun });
    const { container } = renderExercise();
    const task = container.querySelector('.avatar-tip-coach');
    expect(task?.textContent).toMatch(/Your task.*Assign the mean of x to m/);
    await userEvent.click(screen.getByRole('button', { name: /hint/i }));
    expect(screen.getByText('Hint 1 of 2')).toBeDefined();
    await userEvent.click(screen.getByRole('button', { name: /check/i }));
    await waitFor(() => expect(container.querySelector('.avatar-tip-right')?.textContent).toMatch(/Correct\./));
    await userEvent.click(screen.getByRole('button', { name: /solution/i }));
    const solution = container.querySelector('.exercise-solution');
    expect(solution?.closest('.avatar-tip')?.textContent).toMatch(/one way to write it/);
  });

  test('hints reveal one at a time', async () => {
    renderExercise();
    expect(screen.queryByText('Use mean().')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: /hint/i }));
    expect(screen.getByText('Use mean().')).toBeDefined();
    expect(screen.queryByText('Write m <- mean(x).')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: /hint/i }));
    expect(screen.getByText('Write m <- mean(x).')).toBeDefined();
  });

  test('the solution is locked until at least one attempt', async () => {
    runExercise.mockResolvedValue({ status: 'fail', message: 'Not quite.', run: emptyRun });
    renderExercise();
    expect(screen.getByRole('button', { name: /solution/i })).toHaveProperty('disabled', true);
    await userEvent.click(screen.getByRole('button', { name: /check/i }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /solution/i })).toHaveProperty('disabled', false),
    );
  });

  test('a broken check still unlocks the solution — the student genuinely attempted', async () => {
    runExercise.mockResolvedValue({ status: 'broken-check', message: 'check exploded', run: emptyRun });
    renderExercise();
    expect(screen.getByRole('button', { name: /solution/i })).toHaveProperty('disabled', true);
    await userEvent.click(screen.getByRole('button', { name: /check/i }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /solution/i })).toHaveProperty('disabled', false),
    );
  });

  test('a rejected check (worker crash) explains itself, counts as no attempt, and does not unlock the solution', async () => {
    runExercise.mockRejectedValue(new Error('worker died'));
    renderExercise();
    await userEvent.click(screen.getByRole('button', { name: /check/i }));
    await waitFor(() => expect(screen.getByText(R_STOPPED_MESSAGE)).toBeDefined());
    expect(getProgress().lessons['06-1']?.exercises['m6-e1']).toBeUndefined();
    expect(screen.getByRole('button', { name: /solution/i })).toHaveProperty('disabled', true);
  });
});
