import { describe, expect, it } from 'vitest';
import { ALL_LESSONS } from '../content/manifest';
import { visibleModules } from '../content/parts';
import type { Progress } from './progress';
import { firstUnfinished } from './stats';

describe('firstUnfinished', () => {
  it('stays within the lessons on show once the core course is done', () => {
    const core = visibleModules(false).flatMap((module) => module.lessons);
    const lessons: Progress['lessons'] = {};
    for (const lesson of core) {
      lessons[lesson.id] = {
        exercises: Object.fromEntries(lesson.exercises.map((id) => [id, 'passed' as const])),
        quizzes: {},
        drafts: {},
        visitedAt: '2026-11-01T00:00:00Z',
      };
    }
    const progress: Progress = { version: 2, lessons };
    expect(core.length).toBeLessThan(ALL_LESSONS.length);
    expect(firstUnfinished(progress, core)).toBeUndefined();
    expect(firstUnfinished(progress)?.id).toBe(ALL_LESSONS[core.length].id);
  });
});
