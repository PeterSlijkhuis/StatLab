import { describe, expect, it } from 'vitest';
import { ALL_EXERCISES } from '..';
import { NL_EXERCISES } from '.';

describe('Dutch exercise text', () => {
  it.each(ALL_EXERCISES.map((e) => [e.id, e] as const))('%s has a Dutch prompt and the same number of hints', (id, exercise) => {
    const dutch = NL_EXERCISES[id];
    expect(dutch, `no Dutch text for ${id}`).toBeDefined();
    expect(dutch.hints).toHaveLength(exercise.hints.length);
    expect(dutch.prompt).not.toContain('—');
    expect(dutch.hints.join('')).not.toContain('—');
  });

  it('has no entries for exercises that do not exist', () => {
    const known = new Set(ALL_EXERCISES.map((e) => e.id));
    expect(Object.keys(NL_EXERCISES).filter((id) => !known.has(id))).toEqual([]);
  });
});
