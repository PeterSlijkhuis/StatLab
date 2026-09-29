import type { DesignId } from '../stats/power';

/** Everything the sample size page says about one design. */
export type Design = {
  id: DesignId;
  title: string;
  example: string;
  /** The test the plan is for, as a student would name it. */
  test: string;
  lessonId: string;
  /** The effect size's symbol and name, and what it measures. */
  symbol: string;
  effectName: string;
  effectMeaning: string;
  /** Cohen's (1988) conventions, as a last resort. */
  benchmarks?: [number, number, number];
  defaultEffect: number;
  /** What the power formula takes for granted. */
  assumes: string;
};

export const DESIGNS: Design[] = [
  {
    id: 'two-groups',
    title: 'Compare two separate groups',
    example: 'Do remote and office workers differ in wellbeing?',
    test: 'independent-samples t-test',
    lessonId: '12-1',
    symbol: 'd',
    effectName: "Cohen's d",
    effectMeaning: 'the difference between the two group means, in standard deviations within the groups.',
    benchmarks: [0.2, 0.5, 0.8],
    defaultEffect: 0.5,
    assumes:
      'Two groups of equal size, and scores that are roughly normal with the same spread in both groups. With equal groups, Welch\'s t-test (R\'s default) has almost exactly this power. Unequal groups need more people in total for the same power.',
  },
  {
    id: 'paired',
    title: 'Measure the same people twice',
    example: 'Does engagement change between the first and second measurement?',
    test: 'paired t-test',
    lessonId: '14-3',
    symbol: 'dz',
    effectName: 'Cohen\'s dz',
    effectMeaning: 'the mean change, in standard deviations of the change scores.',
    benchmarks: [0.2, 0.5, 0.8],
    defaultEffect: 0.5,
    assumes:
      'Change scores that are roughly normal. dz already contains how strongly the two measurements correlate: the higher that correlation, the larger dz for the same change, and the fewer people you need. Here n counts people, each measured twice.',
  },
  {
    id: 'one-sample',
    title: 'Compare one group with a fixed value',
    example: 'Is average wellbeing different from a benchmark score of 50?',
    test: 'one-sample t-test',
    lessonId: '08-2',
    symbol: 'd',
    effectName: "Cohen's d",
    effectMeaning: 'the difference between the expected mean and the fixed value, in standard deviations.',
    benchmarks: [0.2, 0.5, 0.8],
    defaultEffect: 0.5,
    assumes: 'Scores that are roughly normal, and a comparison value that is fixed in advance, not estimated from other data.',
  },
  {
    id: 'anova',
    title: 'Compare three or more groups',
    example: 'Does wellbeing differ between the four departments?',
    test: 'one-way ANOVA (the overall F test)',
    lessonId: '12-2',
    symbol: 'f',
    effectName: "Cohen's f",
    effectMeaning: 'how far the group means spread around their average, in standard deviations within the groups.',
    benchmarks: [0.1, 0.25, 0.4],
    defaultEffect: 0.25,
    assumes:
      'Equal group sizes, and scores that are roughly normal with the same spread in every group. The plan is for the overall F test only. Follow-up comparisons between pairs of groups have their own power, often lower, especially after correcting for multiple comparisons. If one comparison is what you really care about, plan for that comparison as two groups with d.',
  },
  {
    id: 'correlation',
    title: 'Relate two numeric variables',
    example: 'Is workload related to wellbeing?',
    test: 'Pearson correlation test',
    lessonId: '10-1',
    symbol: 'r',
    effectName: 'the correlation r',
    effectMeaning: 'the strength of the straight-line relationship, from 0 (none) to 1 (perfect).',
    benchmarks: [0.1, 0.3, 0.5],
    defaultEffect: 0.3,
    assumes:
      'A straight-line relationship between two roughly normal variables. The power uses Fisher\'s z approximation, as the pwr package does, so G*Power\'s exact method can differ by a person or two.',
  },
  {
    id: 'regression',
    title: 'Predict an outcome from several predictors',
    example: 'Do workload, autonomy and tenure together predict wellbeing?',
    test: 'F test of R² in a multiple regression',
    lessonId: '11-3',
    symbol: 'f²',
    effectName: "Cohen's f²",
    effectMeaning: 'the variance the predictors explain relative to the variance they leave unexplained: R² / (1 − R²).',
    benchmarks: [0.02, 0.15, 0.35],
    defaultEffect: 0.15,
    assumes: 'The usual regression assumptions (Lesson 11-4). This plans for the test of the whole model, not for any one predictor.',
  },
  {
    id: 'r2-change',
    title: 'Test predictors on top of others',
    example: 'Does autonomy predict wellbeing over and above workload and tenure?',
    test: 'F test of the R² change (with one added predictor, the same as its t-test)',
    lessonId: '11-3',
    symbol: 'f²',
    effectName: "Cohen's f²",
    effectMeaning: 'the extra variance the added predictors explain, relative to what the full model leaves unexplained: R² change / (1 − R² of the full model).',
    benchmarks: [0.02, 0.15, 0.35],
    defaultEffect: 0.05,
    assumes:
      'The usual regression assumptions (Lesson 11-4). This page follows Cohen (1988) and the pwr package. G*Power computes this test with a slightly different noncentrality, so its answer can differ by a few people.',
  },
  {
    id: 'proportions',
    title: 'Compare a yes/no outcome between two groups',
    example: 'Do fewer mentored employees leave the company?',
    test: 'test of two proportions (a chi-square test on a 2 × 2 table)',
    lessonId: '09-3',
    symbol: 'p₂',
    effectName: 'the two proportions',
    effectMeaning: 'the share of "yes" you expect in each group.',
    defaultEffect: 0.45,
    assumes:
      'Two groups of equal size and the normal approximation that base R\'s power.prop.test() uses. prop.test() applies a continuity correction by default, which costs a little power; with small expected counts (under about 5 in a cell), plan by simulation instead.',
  },
  {
    id: 'chi-square',
    title: 'Relate two categorical variables',
    example: 'Is department related to working remotely?',
    test: 'chi-square test of independence (or goodness of fit)',
    lessonId: '09-3',
    symbol: 'w',
    effectName: "Cohen's w",
    effectMeaning: 'how far the table\'s proportions are from what independence predicts. For a 2 × 2 table, w equals the phi coefficient.',
    benchmarks: [0.1, 0.3, 0.5],
    defaultEffect: 0.3,
    assumes:
      'Independent observations and expected counts of at least about 5 in every cell. The degrees of freedom are (rows − 1) × (columns − 1), or categories − 1 for a goodness-of-fit test.',
  },
];

export const designById = (id: DesignId) => DESIGNS.find((design) => design.id === id)!;
