import { describe, expect, it } from 'vitest';
import { ALL_LESSONS } from './manifest';
import { loadQuizzes, pickRound, type BankQuiz } from './quizBank';

describe('quiz bank', () => {
  it('finds every quiz in the course, each with exactly one right answer', async () => {
    const quizzes = await loadQuizzes(ALL_LESSONS.map((lesson) => lesson.id));
    expect(quizzes.length).toBeGreaterThanOrEqual(60);
    expect(new Set(quizzes.map((quiz) => `${quiz.lessonId}/${quiz.id}`)).size).toBe(quizzes.length);
    for (const quiz of quizzes) {
      expect(quiz.question, quiz.id).toBeTruthy();
      expect(quiz.choices.filter((choice) => choice.correct).length, quiz.id).toBe(1);
    }
  });

  it('only loads the lessons asked for', async () => {
    const quizzes = await loadQuizzes(['06-1']);
    expect(quizzes.map((quiz) => quiz.id)).toContain('q-6-1');
    expect(quizzes.every((quiz) => quiz.lessonId === '06-1')).toBe(true);
  });

  it('puts wrong answers first in line, then unanswered, then right', () => {
    const quiz = (id: string): BankQuiz => ({ lessonId: '06-1', id, question: id, choices: [{ text: 'x', correct: true, response: '' }] });
    const bank = ['right', 'wrong', 'new'].map(quiz);
    const progress = { version: 2 as const, lessons: { '06-1': { exercises: {}, drafts: {}, quizzes: { right: true, wrong: false } } } };
    expect(pickRound(bank, progress, 1).map((q) => q.id)).toEqual(['wrong']);
    expect(pickRound(bank, progress, 2).map((q) => q.id).sort()).toEqual(['new', 'wrong']);
    expect(pickRound(bank, progress, 10)).toHaveLength(3);
  });
});
