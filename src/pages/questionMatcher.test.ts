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
  // Misread before: test names, lists, pairs, outcome words and "reduce" as a verb.
  { q: 'I want to do an ANOVA on wellbeing with department as factor', top: 'several-groups' },
  { q: 'one way anova stress per programme', top: 'several-groups' },
  { q: 'Do students from psychology, economics and law differ in stress?', top: 'several-groups' },
  { q: 'Is the mean stress score above the midpoint of the scale (5)?', top: 'mean-vs-value' },
  { q: 'What predicts wellbeing: workload, autonomy or tenure?', top: 'multiple-regression' },
  { q: 'Multiple regression with stress and sleep predicting exam scores', top: 'multiple-regression' },
  { q: 'Did engagement change between t1 and t2?', top: 'before-after' },
  { q: 'paired t-test engagement time 1 vs time 2', top: 'before-after' },
  { q: 'Do twins differ in IQ? (matched pairs)', top: 'before-after' },
  { q: 'What is the difference between the scores of students before and after the lecture?', top: 'before-after' },
  { q: 'Do students sleep fewer hours during exam weeks than before?', top: 'before-after' },
  { q: 'Does wellbeing change over 4 measurement waves?', top: 'repeated-measures' },
  { q: 'repeated measures anova with 3 time points on stress', top: 'repeated-measures' },
  { q: 'Did the trained group improve more from pre to post than the control group?', top: 'time-by-group' },
  { q: 'Do participants differ in how fast their symptoms improve over 6 weeks?', top: 'growth-curve' },
  { q: 'Logistic regression for passing the exam with study hours as predictor', top: 'logistic-regression' },
  { q: 'chi square test remote and left_company', top: 'cross-table' },
  { q: 'Is more than half of the students satisfied with the course?', top: 'proportion-vs-value' },
  { q: 'Did the same employees say yes more often after the training than before?', top: 'repeated-binary' },
  { q: 'Do patients answer yes or no at 3 visits, does it change?', top: 'repeated-binary' },
  { q: 'Do the programmes differ on a 5 point likert item about satisfaction?', top: 'rank-tests' },
  { q: 'Mann Whitney U test for stress between two groups', top: 'rank-tests' },
  { q: 'nonparametric test for skewed income between men and women', top: 'rank-tests' },
  { q: 'Is the effect of age on income different for men and women?', top: 'continuous-moderation' },
  { q: 'What factors underlie the 30 items of my questionnaire?', top: 'exploratory-factors' },
  { q: 'CFA to confirm the 3 factor structure of the scale', top: 'confirmatory-factors' },
  { q: 'I want to reduce 15 variables into a few components', top: 'principal-components' },
  { q: 'Does training affect both wellbeing and performance?', top: 'several-outcomes' },
  { q: 'Does the new law reduce monthly accidents?', top: 'interrupted-time-series' },
  { q: 'How does the number of hours studied relate to the grade?', top: 'simple-regression' },
  // Read right before and after: kept as a guard.
  { q: 't-test for wellbeing remote vs office', top: 'two-groups' },
  { q: 'Do remote workers have more stress than office workers?', top: 'two-groups' },
  { q: 'Is there a correlation between stress and sleep hours?', top: 'simple-regression' },
  { q: 'The more hours students study, the higher their grade?', top: 'simple-regression' },
  { q: 'ANCOVA: do departments differ in wellbeing when you adjust for workload?', top: 'groups-with-covariate' },
  { q: 'Does autonomy moderate the relationship between workload and wellbeing?', top: 'continuous-moderation' },
  { q: 'Is the effect of training on performance mediated by engagement?', top: 'mediation' },
  { q: 'Multilevel model of wellbeing with employees nested in teams', top: 'nested-groups' },
  { q: 'Do departments differ in the percentage of employees who left?', top: 'cross-table' },
  { q: 'one sample t-test: is IQ in our sample different from 100?', top: 'mean-vs-value' },
  { q: 'Does workload predict time until employees quit?', top: 'cox-regression' },
  { q: 'Kruskal-Wallis for satisfaction ranks across departments', top: 'rank-tests' },
  { q: 'Does stress predict satisfaction measured as low, medium or high?', top: 'ordinal-regression' },
  { q: 'Do students choose between psychology, law and economics equally often?', top: 'goodness-of-fit' },
  { q: 'Bayesian t-test for remote vs office wellbeing', top: 'bayes-t-test' },
  { q: 'is ther a diffrence in welbeing between remote and non remote employes', top: 'two-groups' },
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

  test('"reduce" as a verb is not dimension reduction', () => {
    expect(detectCues('Does training reduce stress?')).not.toContain('reduce');
  });

  test('alternatives keep to the kind of outcome and question asked', () => {
    const ids = matchQuestion('Does autonomy predict wellbeing?').suggestions.map((s) => s.id);
    expect(ids).not.toContain('cox-regression');
    expect(ids).not.toContain('ordinal-regression');
    expect(ids).not.toContain('bayesian-regression');
  });

  test('odd input gives no suggestion and does not throw', () => {
    for (const q of ['   ', '12345', '\u{1F600}\u{1F4CA}', '<script>alert(1)</script>', 'x'.repeat(2000), 'a, b, c and '.repeat(200)]) {
      expect(matchQuestion(q).suggestions).toEqual([]);
    }
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
