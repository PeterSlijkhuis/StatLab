import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, test } from 'vitest';
import AvatarStudio from './AvatarStudio';
import { ALL_LESSONS } from '../content/manifest';
import { currentLook } from '../state/avatar';
import { getProgress, markExercise } from '../state/progress';

function renderStudio() {
  return render(
    <MemoryRouter>
      <AvatarStudio />
    </MemoryRouter>,
  );
}

beforeEach(() => localStorage.clear());

describe('AvatarStudio', () => {
  test('designs the avatar from free pieces', async () => {
    renderStudio();
    expect(screen.getByRole('img', { name: 'Your avatar' })).toBeDefined();
    await userEvent.click(screen.getByRole('button', { name: 'Curly' }));
    expect(currentLook(getProgress()).hairStyle).toBe('hair-curly');
    expect(screen.getByRole('button', { name: 'Curly' }).getAttribute('aria-pressed')).toBe('true');
    await userEvent.click(screen.getByRole('button', { name: 'Pink' }));
    expect(currentLook(getProgress()).hairColour).toBe('colour-pink');
  });

  test('shop items stay locked until the student has the points', async () => {
    renderStudio();
    await userEvent.click(screen.getByRole('tab', { name: 'Shop' }));
    const hoodie = screen.getByRole('button', { name: 'Buy Hoodie for 60 points' }) as HTMLButtonElement;
    expect(hoodie.disabled).toBe(true);
    expect(screen.getAllByText('60 more points needed').length).toBeGreaterThan(0);
  });

  test('buying an outfit spends points and dresses the avatar', async () => {
    for (const lesson of ALL_LESSONS.slice(0, 3)) {
      for (const id of lesson.exercises) markExercise(lesson.id, id, 'passed');
    }
    renderStudio();
    await userEvent.click(screen.getByRole('tab', { name: 'Shop' }));
    const before = Number(screen.getByText(/points to spend/).querySelector('strong')!.textContent);
    await userEvent.click(screen.getByRole('button', { name: 'Buy Hoodie for 60 points' }));
    expect(currentLook(getProgress()).outfit).toBe('outfit-hoodie');
    expect(Number(screen.getByText(/points to spend/).querySelector('strong')!.textContent)).toBe(before - 60);
    expect(screen.getByRole('button', { name: 'Wearing' })).toBeDefined();
  });
});
