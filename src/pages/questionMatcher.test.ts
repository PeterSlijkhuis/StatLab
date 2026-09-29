import { describe, expect, test } from 'vitest';
import { allAnswers } from './modelTree';
import { CUES, detectCues, matchQuestion, RULE_IDS } from './questionMatcher';

// Realistic questions as students write them. `top` must rank first; `inTop2`
// is for questions a careful reader could answer two ways.
const QUESTIONS: { q: string; top?: string; inTop2?: string }[] = [
  { q: 'Do remote workers report higher wellbeing than office workers?', top: 'two-groups' },
  { q: 'Is there a difference in exam scores between men and women?', top: 'two-groups' },
  { q: 'Do the four departments differ in wellbeing?', top: 'several-groups' },
  { q: 'Does wellbeing differ across departments?', top: 'several-groups' },
  { q: 'Does autonomy predict wellbeing?', top: 'simple-regression' },
  { q: 'Is sleep related to exam performance?', top: 'simple-regression' },
  { q: 'Do autonomy and workload each predict wellbeing, controlling for tenure?', top: 'multiple-regression' },
  { q: 'Does training raise engagement, adjusting for engagement at baseline?', inTop2: 'groups-with-covariate' },
  { q: 'Does workload predict whether employees leave?', top: 'logistic-regression' },
  { q: 'Which factors affect the chance that a student passes the course?', top: 'logistic-regression' },
  { q: 'Did engagement rise from the first to the second measurement, and more for trained employees?', top: 'time-by-group' },
  { q: 'Do the same people report less stress before and after the mindfulness course?', top: 'before-after' },
  { q: 'Did anxiety scores drop from pre-test to post-test?', inTop2: 'before-after' },
  { q: 'Does stress change across three exam weeks?', top: 'repeated-measures' },
  { q: 'Does the effect of workload on wellbeing differ between departments?', top: 'continuous-moderation' },
  { q: 'Is the effect of workload on wellbeing stronger for employees with little autonomy?', top: 'continuous-moderation' },
  { q: 'Do training and mentoring interact in their effect on performance?', top: 'factorial' },
  { q: 'Does autonomy predict wellbeing for employees working in 30 teams?', top: 'nested-groups' },
  { q: 'Do pupils in different schools score differently on the reading test?', inTop2: 'nested-groups' },
  { q: 'Does training improve performance through engagement?', top: 'mediation' },
  { q: 'Does social support explain why workload lowers wellbeing?', top: 'mediation' },
  { q: 'Does workload predict the number of sick days?', top: 'poisson-regression' },
  { q: 'How many times a week do students go to the gym, and does it depend on age?', inTop2: 'poisson-regression' },
  { q: 'Do students get more than 7 out of 10 answers correct?', inTop2: 'proportion-vs-value' },
  { q: 'Does practice raise the number correct out of 10 questions?', top: 'successes-of-trials' },
  { q: 'Is the proportion of students who pass higher than 50%?', top: 'proportion-vs-value' },
  { q: 'Is the average exam score different from 70?', top: 'mean-vs-value' },
  { q: 'Do departments differ in satisfaction rated low, medium or high?', top: 'rank-tests' },
  { q: 'Do my questionnaire items hang together?', top: 'scale-reliability' },
  { q: 'What is the reliability of the five wellbeing items?', top: 'scale-reliability' },
  { q: 'Which traits lie behind the 20 personality items of the questionnaire?', top: 'exploratory-factors' },
  { q: 'Do the 9 test items measure the 3 abilities they were written for?', top: 'confirmatory-factors' },
  { q: 'How long does it take until employees leave the company?', inTop2: 'survival-curves' },
  { q: 'Do remote workers stay longer before they leave than office workers?', top: 'survival-curves' },
  { q: 'Did monthly sick leave drop after the new policy started?', top: 'interrupted-time-series' },
  { q: 'Can we forecast monthly sales for next year?', top: 'forecast-series' },
  { q: 'Which employees will leave next year, as accurately as possible?', top: 'random-forest' },
  { q: 'Which of 50 survey questions matter most for predicting turnover?', top: 'lasso' },
  { q: 'How likely is it that the pass rate is above 70%?', top: 'bayes-proportion' },
  { q: 'Are there distinct types of customers based on their shopping habits?', top: 'cluster-analysis' },
  { q: 'Does more sleep help exam scores only up to a point?', top: 'curved-relationship' },
  { q: 'Does age predict how people travel to work: car, bike or train?', top: 'multinomial-regression' },
];

describe('matchQuestion', () => {
  test.each(QUESTIONS)('$q', ({ q, top, inTop2 }) => {
    const ids = matchQuestion(q).suggestions.map((s) => s.id);
    if (top) expect(ids[0], ids.join(', ')).toBe(top);
    if (inTop2) expect(ids.slice(0, 2), ids.join(', ')).toContain(inTop2);
  });

  test('7 out of 10 correct is a yes-or-no outcome, not a count', () => {
    const cues = detectCues('Do students get 7 out of 10 answers correct more often after training?');
    expect(cues).toContain('binary');
    expect(cues).not.toContain('count');
    expect(matchQuestion('Do students get 7 out of 10 answers correct more often after training?').suggestions[0].id).not.toBe('poisson-regression');
  });

  test('"sick leave" is not someone leaving', () => {
    expect(detectCues('Does workload predict the number of sick leave days?')).not.toContain('binary');
  });

  test('a relationship between two numbers is not a two-group comparison', () => {
    expect(detectCues('Is there a relationship between sleep and exam scores?')).not.toContain('twoGroups');
  });

  test('without an outcome cue, the outcome is taken to be a number', () => {
    expect(matchQuestion('Does autonomy predict wellbeing?').cues).toContain('number');
    expect(matchQuestion('Does workload predict whether employees leave?').cues).not.toContain('number');
  });

  test('every suggestion says why, in plain words', () => {
    const [first] = matchQuestion('Do remote workers report higher wellbeing than office workers?').suggestions;
    expect(first.reasons).toContain('You compare groups');
    expect(first.reasons).toContain('There are two groups');
  });

  test('a correction re-ranks: switching a cue off or on changes the suggestion', () => {
    const q = 'Did engagement rise from the first to the second measurement, and more for trained employees?';
    expect(matchQuestion(q).suggestions[0].id).toBe('time-by-group');
    expect(matchQuestion(q, { moderation: false, groups: false }).suggestions[0].id).toBe('before-after');
    expect(matchQuestion('Does autonomy predict wellbeing?', { clustered: true }).suggestions[0].id).toBe('nested-groups');
  });

  test('nothing useful gives no suggestion', () => {
    expect(matchQuestion('').suggestions).toEqual([]);
    expect(matchQuestion('hello there').suggestions).toEqual([]);
    expect(matchQuestion('I like my data').suggestions).toEqual([]);
  });

  test('every rule points at an answer in the tree, once', () => {
    const ids = allAnswers().map((entry) => entry.answer.id);
    for (const id of RULE_IDS) expect(ids).toContain(id);
    expect(new Set(RULE_IDS).size).toBe(RULE_IDS.length);
  });

  test('no cue text uses an em dash', () => {
    expect(JSON.stringify(CUES.map(({ label, why }) => ({ label, why })))).not.toContain('\u2014');
  });
});
