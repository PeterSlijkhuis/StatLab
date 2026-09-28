import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
  currentStreak,
  exportProgress,
  getDraft,
  getProgress,
  hasStorageFailed,
  importProgress,
  lastVisitedLesson,
  localDay,
  markExercise,
  markQuiz,
  saveDraft,
  subscribeProgress,
  touchLesson,
} from './progress';

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks(); // A storage spy left behind by a failing test would cascade.
});

describe('progress store', () => {
  test('starts empty with a version stamp', () => {
    expect(getProgress()).toEqual({ version: 2, lessons: {} });
  });

  test('records exercise results', () => {
    markExercise('06-1', 'm6-e1', 'passed');
    expect(getProgress().lessons['06-1'].exercises['m6-e1']).toBe('passed');
  });

  test('a pass is never downgraded by a later attempt', () => {
    markExercise('06-1', 'm6-e1', 'passed');
    markExercise('06-1', 'm6-e1', 'attempted');
    expect(getProgress().lessons['06-1'].exercises['m6-e1']).toBe('passed');
  });

  test('records quiz answers', () => {
    markQuiz('06-1', 'q1', true);
    expect(getProgress().lessons['06-1'].quizzes.q1).toBe(true);
  });

  test('round-trips code drafts', () => {
    saveDraft('06-1', 'block-2', 'mean(x)');
    expect(getDraft('06-1', 'block-2')).toBe('mean(x)');
  });

  test('tracks the most recently visited lesson', () => {
    touchLesson('06-1');
    touchLesson('06-2');
    expect(lastVisitedLesson()).toBe('06-2');
  });

  test('exports and re-imports progress', () => {
    markExercise('06-1', 'm6-e1', 'passed');
    const json = exportProgress();
    localStorage.clear();
    expect(importProgress(json)).toBe(true);
    expect(getProgress().lessons['06-1'].exercises['m6-e1']).toBe('passed');
  });

  test('rejects malformed or wrong-version imports without corrupting state', () => {
    markExercise('06-1', 'm6-e1', 'passed');
    expect(importProgress('not json')).toBe(false);
    expect(importProgress(JSON.stringify({ version: 99, lessons: {} }))).toBe(false);
    expect(getProgress().lessons['06-1'].exercises['m6-e1']).toBe('passed');
  });

  test('survives corrupt stored data by starting fresh', () => {
    localStorage.setItem('statlab.progress.v1', '{{{');
    expect(getProgress()).toEqual({ version: 2, lessons: {} });
  });

  test('works when localStorage throws', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded');
    });
    expect(() => markExercise('06-1', 'm6-e1', 'passed')).not.toThrow();
    spy.mockRestore();
  });

  test('a refused write is recorded, still notifies, and clears on the next good one', () => {
    const seen: string[] = [];
    const off = subscribeProgress(() => seen.push('notified'));
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('private browsing');
    });

    expect(() => markExercise('06-1', 'm6-e1', 'passed')).not.toThrow();
    expect(hasStorageFailed()).toBe(true);
    expect(seen).toHaveLength(1); // The sidebar must still repaint, just unsaved.

    spy.mockRestore();
    markExercise('06-1', 'm6-e1', 'passed');
    expect(hasStorageFailed()).toBe(false);

    off();
  });

  test('reports refused storage before anything has been written', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('private browsing');
    });

    expect(hasStorageFailed()).toBe(true);

    spy.mockRestore();
    expect(hasStorageFailed()).toBe(false);
  });

  test('leaves nothing behind when it probes', () => {
    const before = { ...localStorage };
    expect(hasStorageFailed()).toBe(false);
    expect({ ...localStorage }).toEqual(before);
  });

  test('rejects an import whose version is right but whose lessons are malformed', () => {
    // The one untrusted input in the app: a file the student supplies.
    expect(importProgress(JSON.stringify({ version: 1, lessons: { '06-1': {} } }))).toBe(false);
    expect(importProgress(JSON.stringify({ version: 1, lessons: { '06-1': 'nope' } }))).toBe(false);
  });

  test('a malformed stored payload cannot make a later write throw', () => {
    localStorage.setItem('statlab.progress.v1', JSON.stringify({ version: 1, lessons: { '06-1': {} } }));
    expect(() => markExercise('06-1', 'm6-e1', 'passed')).not.toThrow();
    expect(getProgress().lessons['06-1'].exercises['m6-e1']).toBe('passed');
  });

  test('a throwing subscriber breaks neither the write nor the other subscribers', () => {
    const seen: string[] = [];
    const offA = subscribeProgress(() => {
      throw new Error('subscriber exploded');
    });
    const offB = subscribeProgress(() => seen.push('b'));

    expect(() => markExercise('06-1', 'm6-e1', 'passed')).not.toThrow();
    expect(seen).toContain('b');
    expect(getProgress().lessons['06-1'].exercises['m6-e1']).toBe('passed');

    offA();
    offB();
  });
});

describe('streak', () => {
  test('counts consecutive active days ending today', () => {
    const progress = { version: 2 as const, lessons: {}, activity: ['2026-09-19', '2026-09-20', '2026-09-21', '2026-09-22'] };
    expect(currentStreak(progress, new Date(2026, 8, 22, 20))).toBe(4);
  });

  test('is still alive the morning after, before the student has started', () => {
    const progress = { version: 2 as const, lessons: {}, activity: ['2026-09-20', '2026-09-21'] };
    expect(currentStreak(progress, new Date(2026, 8, 22, 8))).toBe(2);
  });

  test('breaks after a missed day', () => {
    const progress = { version: 2 as const, lessons: {}, activity: ['2026-09-18', '2026-09-20'] };
    expect(currentStreak(progress, new Date(2026, 8, 22, 8))).toBe(0);
  });

  test('any saved activity marks today, once', () => {
    markQuiz('06-1', 'q1', true);
    saveDraft('06-1', 'b1', 'x');
    expect(getProgress().activity).toEqual([localDay()]);
  });

  test('a file exported before streaks existed still imports', () => {
    expect(importProgress(JSON.stringify({ version: 1, lessons: {} }))).toBe(true);
  });

  test('rejects an activity list that is not a list of days', () => {
    expect(importProgress(JSON.stringify({ version: 1, lessons: {}, activity: [3] }))).toBe(false);
  });
});

describe('migration from version 1', () => {
  test('moves the old Modules 9 to 15 up one, keys and all', () => {
    const lesson = (exercise: string, quiz: string) => ({
      exercises: { [exercise]: 'passed' },
      quizzes: { [quiz]: true, 'q-r-meaning': true },
      drafts: { [exercise]: 'x <- 1', 'c-load': 'y' },
    });
    localStorage.setItem(
      'statlab.progress.v1',
      JSON.stringify({
        version: 1,
        lessons: { '06-1': lesson('m6-1-a', 'i-6-1'), '09-2': lesson('m9-2-a', 'i-9-2'), '15-4': lesson('m15-4-a', 'i-15-4') },
      }),
    );
    const { version, lessons } = getProgress();
    expect(version).toBe(2);
    expect(Object.keys(lessons).sort()).toEqual(['06-1', '10-2', '16-4']);
    expect(lessons['06-1']).toEqual(lesson('m6-1-a', 'i-6-1'));
    expect(lessons['10-2']).toEqual(lesson('m10-2-a', 'i-10-2'));
    expect(lessons['16-4']).toEqual(lesson('m16-4-a', 'i-16-4'));
  });

  test('an exported version 1 file imports into the new numbers', () => {
    expect(importProgress(JSON.stringify({ version: 1, lessons: { '14-2': { exercises: { 'm14-2-a': 'passed' }, quizzes: {}, drafts: {} } } }))).toBe(true);
    expect(getProgress().lessons['15-2'].exercises['m15-2-a']).toBe('passed');
  });
});
