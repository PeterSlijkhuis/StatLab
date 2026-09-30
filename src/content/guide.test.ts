import { describe, expect, test } from 'vitest';
import { guide } from './guide';
import { LESSON_KEYWORDS } from './guideIndex';
import { ALL_LESSONS } from './manifest';

const first = (text: string) => guide(text)[0]?.to;

describe('the helper in the corner', () => {
  test('every lesson has keywords, and every keyword entry is a lesson', () => {
    expect(Object.keys(LESSON_KEYWORDS).sort()).toEqual(ALL_LESSONS.map((lesson) => lesson.id).sort());
  });

  test.each([
    ['t-test', '/lesson/12-1'],
    ['I am new to R', '/lesson/00-1'],
    ['chi square', '/lesson/09-3'],
    ['logistic regression', '/lesson/15-2'],
    ['how to make a boxplot', '/lesson/04-2'],
    ['Cronbach alpha', '/lesson/03-4'],
    ['mixed model', '/lesson/14-2'],
    ['paired t-test', '/lesson/14-3'],
    ['upload my own data', '/workspace'],
  ])('"%s" goes to %s first', (text, to) => {
    expect(first(text)).toBe(to);
  });

  test('a sample size question finds the planner', () => {
    expect(guide('how many participants do I need').map((hit) => hit.to)).toContain('/sample-size');
  });

  test('a research question also names the analysis', () => {
    expect(first('Do remote workers report higher wellbeing than office workers?')).toMatch(/^\/which-model\?model=/);
    // ...and the lesson that teaches it comes next.
    expect(guide('Does workload predict whether employees leave?').map((hit) => hit.to).slice(0, 2)).toEqual(['/which-model?model=logistic-regression', '/lesson/15-2']);
  });

  test('nothing typed, or nothing recognised, finds nothing', () => {
    expect(guide('')).toEqual([]);
    expect(guide('xyzzy')).toEqual([]);
  });
});
