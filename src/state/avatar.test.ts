import { beforeEach, describe, expect, test } from 'vitest';
import { ALL_LESSONS } from '../content/manifest';
import { buy, currentLook, DEFAULT_LOOK, owns, pointsSpent, pointsToSpend, wear } from './avatar';
import { getProgress, importProgress, markExercise, saveAvatar } from './progress';

/** Passes every exercise in the first `n` lessons: 30 points a lesson with one exercise. */
function earn(n: number) {
  for (const lesson of ALL_LESSONS.slice(0, n)) {
    for (const id of lesson.exercises) markExercise(lesson.id, id, 'passed');
  }
}

beforeEach(() => localStorage.clear());

describe('avatar', () => {
  test('a new student has the default look, free pieces, and nothing to spend', () => {
    const progress = getProgress();
    expect(currentLook(progress)).toEqual(DEFAULT_LOOK);
    expect(owns(progress, 'hair-curly')).toBe(true);
    expect(owns(progress, 'outfit-hoodie')).toBe(false);
    expect(pointsToSpend(progress)).toBe(0);
  });

  test('wearing a free piece changes the look without touching the streak', () => {
    expect(wear(getProgress(), 'hair-curly')).toBe(true);
    expect(currentLook(getProgress()).hairStyle).toBe('hair-curly');
    expect(getProgress().activity).toBeUndefined();
  });

  test('a locked piece cannot be worn, and cannot be bought without the points', () => {
    expect(wear(getProgress(), 'outfit-hoodie')).toBe(false);
    expect(buy(getProgress(), 'outfit-hoodie')).toBe(false);
    expect(currentLook(getProgress()).outfit).toBe('outfit-tee');
  });

  test('buying spends points, puts the piece on, and cannot be done twice', () => {
    earn(3);
    const before = pointsToSpend(getProgress());
    expect(before).toBeGreaterThanOrEqual(60);
    expect(buy(getProgress(), 'outfit-hoodie')).toBe(true);
    const after = getProgress();
    expect(currentLook(after).outfit).toBe('outfit-hoodie');
    expect(pointsSpent(after)).toBe(60);
    expect(pointsToSpend(after)).toBe(before - 60);
    expect(buy(after, 'outfit-hoodie')).toBe(false);
    expect(pointsSpent(getProgress())).toBe(60);
  });

  test('points to spend never go below zero when earned points fall', () => {
    earn(3);
    expect(buy(getProgress(), 'outfit-hoodie')).toBe(true);
    // The same student, with their exercises gone and their purchase kept.
    importProgress(JSON.stringify({ ...getProgress(), lessons: {} }));
    expect(pointsToSpend(getProgress())).toBe(0);
    expect(currentLook(getProgress()).outfit).toBe('outfit-hoodie');
  });

  test('a saved look naming unknown, misplaced or unowned pieces falls back slot by slot', () => {
    saveAvatar({ look: { skin: 'nope', outfit: 'outfit-crown', accessory: 'acc-crown', hairStyle: 'hair-bun' }, owned: ['gone'] });
    const look = currentLook(getProgress());
    expect(look).toEqual({ ...DEFAULT_LOOK, hairStyle: 'hair-bun' });
    expect(pointsSpent(getProgress())).toBe(0);
  });

  test('an imported file with a malformed avatar is refused, and one without an avatar still imports', () => {
    expect(importProgress(JSON.stringify({ version: 1, lessons: {}, avatar: { look: {}, owned: 'all' } }))).toBe(false);
    expect(importProgress(JSON.stringify({ version: 1, lessons: {}, avatar: { look: { skin: 3 }, owned: [] } }))).toBe(false);
    expect(importProgress(JSON.stringify({ version: 1, lessons: {} }))).toBe(true);
    expect(importProgress(JSON.stringify({ version: 1, lessons: {}, avatar: { look: { skin: 'skin-5' }, owned: [] } }))).toBe(true);
    expect(currentLook(getProgress()).skin).toBe('skin-5');
  });
});
