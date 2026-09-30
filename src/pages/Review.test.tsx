import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { getProgress, markQuiz, STORAGE_KEY, touchLesson } from '../state/progress';
import Review from './Review';

const show = () => render(<MemoryRouter><Review /></MemoryRouter>).container;

describe('Review quiz', () => {
  beforeEach(() => localStorage.removeItem(STORAGE_KEY));

  it('points to a first lesson when nothing has been opened', async () => {
    show();
    expect(await screen.findByText('Nothing to review yet')).toBeTruthy();
  });

  it('asks questions from opened lessons and scores the round', async () => {
    touchLesson('06-1');
    const page = show();
    expect(await screen.findByText(/Question 1 of \d+/)).toBeTruthy();
    expect(screen.getByRole('link', { name: /Lesson 6-1/ })).toBeTruthy();
    const total = Number(screen.getByText(/Question 1 of/).textContent!.match(/of (\d+)/)![1]);
    for (let i = 0; i < total; i++) {
      fireEvent.click(page.querySelector('.choice-options button')!);
      fireEvent.click(screen.getByRole('button', { name: /Next question|See your score/ }));
    }
    expect(screen.getByText(new RegExp(`of ${total} right`))).toBeTruthy();
    expect(screen.getByRole('button', { name: 'New round' })).toBeTruthy();
  });
});

describe('markQuiz', () => {
  beforeEach(() => localStorage.removeItem(STORAGE_KEY));

  it('keeps a right answer when the question is later answered wrong', () => {
    markQuiz('06-1', 'q1', true);
    markQuiz('06-1', 'q1', false);
    expect(getProgress().lessons['06-1'].quizzes.q1).toBe(true);
  });
});
