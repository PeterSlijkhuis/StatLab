import { factorialF, fFromEta2, type DesignId, type Layout, type Which } from '../stats/power';

/** Everything the sample size page says about one design. */
export type Design = {
  id: DesignId;
  title: string;
  example: string;
  /** The test the plan is for, as a student would name it. */
  test: string;
  /** The model the course fits for this question, and how its test relates to the planned one. */
  model: string;
  modelNote: string;
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
    example: 'Do remote and office workers differ in wellbeing? Or an A/B test on a score, such as time on a page.',
    test: 'test of the group difference (the traditional independent-samples t-test)',
    model: 'lm(outcome ~ group)',
    modelNote: 'The test of the group coefficient is the same as the traditional independent-samples t-test (Lesson 12-1).',
    lessonId: '12-1',
    symbol: 'd',
    effectName: "Cohen's d",
    effectMeaning: 'the difference between the two group means, in standard deviations within the groups.',
    benchmarks: [0.2, 0.5, 0.8],
    defaultEffect: 0.5,
    assumes:
      'Two groups of equal size, and scores that are roughly normal with the same spread in both groups. With equal groups, the traditional Welch t-test (the default of t.test()) has almost exactly this power. Unequal groups need more people in total for the same power.',
  },
  {
    id: 'paired',
    title: 'Measure the same people twice',
    example: 'Does engagement change between the first and second measurement?',
    test: 'test of the change (the traditional paired t-test)',
    model: 'lmer(outcome ~ time + (1 | person))',
    modelNote: 'With two time points and nobody missing, the test of time is the same as the traditional paired t-test (Lesson 14-3).',
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
    id: 'repeated',
    title: 'Measure the same people in several conditions',
    example: 'Does reaction time differ between four conditions that every participant does?',
    test: 'overall F test for condition (the traditional repeated-measures ANOVA)',
    model: 'lmer(outcome ~ condition + (1 | person))',
    modelNote: 'The F test for condition is the same as the traditional repeated-measures ANOVA (Lesson 14-4).',
    lessonId: '14-4',
    symbol: 'f',
    effectName: "Cohen's f",
    effectMeaning: 'how far the condition means spread around their average, in standard deviations of the scores within one condition.',
    benchmarks: [0.1, 0.25, 0.4],
    defaultEffect: 0.25,
    assumes:
      'Every person does every condition, scores are roughly normal, and sphericity holds: the differences between each pair of conditions vary about equally. This is the formula G*Power uses for repeated measures within factors, with ε = 1. When sphericity fails, the Greenhouse-Geisser correction costs power, so plan for more people. The same test is the F test for condition in a mixed model with a random intercept per person (Lesson 14-4). The plan is for the overall F test; follow-up comparisons between pairs of conditions have their own, often lower, power.',
  },
  {
    id: 'factorial',
    title: 'Two factors at once, like a 2 × 2 design',
    example: 'Does a training raise wellbeing more than a waiting list, measured before and after? Or: do photo and text ads work differently for young and old viewers?',
    test: 'F test for one effect in a 2 × 2 design (a traditional two-way ANOVA)',
    model: 'lm(outcome ~ a * b)',
    modelNote: 'Each effect is one term of this model: a * b gives both main effects and their interaction (Lesson 13-2). When a factor is within people, add a random intercept per person: lmer(outcome ~ a * b + (1 | person)) (Lesson 14-4).',
    lessonId: '13-2',
    symbol: 'f',
    effectName: "Cohen's f",
    effectMeaning: 'the size of one effect relative to the variation left after the other effects.',
    benchmarks: [0.1, 0.25, 0.4],
    defaultEffect: 0.25,
    assumes:
      'Two factors with two levels each, the same number of people in every cell or group, and roughly normal scores with the same spread in every cell. For factors within people, the correlation between conditions is the same for every pair. Each effect in a 2 × 2 design has 1 degree of freedom, so its F is the square of the t for one contrast; for a design with both factors between people this is G*Power\'s option for fixed effects, special, main effects and interactions. A factor with three or more levels, or several stimuli per condition, needs a simulation or the Superpower package. If each condition repeats the same trial several times, plan on each person\'s average over those trials.',
  },
  {
    id: 'one-sample',
    title: 'Compare one group with a fixed value',
    example: 'Is average wellbeing different from a benchmark score of 50?',
    test: 'test of the mean against a fixed value (the traditional one-sample t-test)',
    model: 'lm(outcome - value ~ 1)',
    modelNote: 'The test of the intercept is the same as the traditional one-sample t-test against the fixed value (Lesson 8-2 runs it as t.test()).',
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
    test: 'overall F test for the groups (the traditional one-way ANOVA)',
    model: 'lm(outcome ~ group)',
    modelNote: 'With group a factor of three or more categories, the overall F test of the model is the same as the traditional one-way ANOVA (Lesson 12-2).',
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
    test: 'test of the correlation (the traditional Pearson correlation test)',
    model: 'lm(outcome ~ predictor)',
    modelNote: 'The test of the slope gives the same p-value as the test of the correlation (Lesson 10-2).',
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
    model: 'lm(outcome ~ x1 + x2 + x3)',
    modelNote: 'The F test at the bottom of summary() tests the whole model (Lesson 11-3).',
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
    test: 'F test of the R² change (with one added predictor, the same as the test of its coefficient)',
    model: 'anova(small_model, big_model)',
    modelNote: 'The F test comparing lm(outcome ~ controls) with lm(outcome ~ controls + x) is the test of the R² change (Lesson 11-3).',
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
    example: 'Do fewer mentored employees leave the company? Or an A/B test: do more visitors click with version B than with version A?',
    test: 'traditional test of two proportions (a traditional chi-square test on a 2 × 2 table)',
    model: 'glm(yes_no ~ group, family = binomial)',
    modelNote: 'The page plans with the traditional test of two proportions. The group coefficient in this logistic regression has almost the same power, at most a few percentage points less, so a few extra people cover it (Module 15).',
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
    test: 'traditional chi-square test of independence (or goodness of fit)',
    model: 'chisq.test(table(a, b))',
    modelNote: 'As a model: glm(count ~ a + b, family = poisson) on the table of counts gives the same chi-square as the traditional test (Lesson 15-4).',
    lessonId: '09-3',
    symbol: 'w',
    effectName: "Cohen's w",
    effectMeaning: 'how far the table\'s proportions are from what independence predicts. For a 2 × 2 table, w equals the phi coefficient.',
    benchmarks: [0.1, 0.3, 0.5],
    defaultEffect: 0.3,
    assumes:
      'Independent observations and expected counts of at least about 5 in every cell. The degrees of freedom are (rows − 1) × (columns − 1), or categories − 1 for a traditional goodness-of-fit test.',
  },
];

export const designById = (id: DesignId) => DESIGNS.find((design) => design.id === id)!;

/** How the student arrives at the effect size. */
export type EffectRoute = 'matter' | 'research' | 'unknown';

export type EffectField = { key: string; label: string; hint: string; placeholder: string; optional?: boolean };

/** Values the student has typed, by field key, already parsed (NaN when empty). */
export type FieldValues = Record<string, number>;

/**
 * What to ask for each design and route, and how it becomes the effect size.
 * `rows` and `cols` (chi-square) come from the earlier table-size question.
 */
export function effectInputs(id: DesignId, route: 'matter' | 'research', factors?: { layout: Layout; which: Which }): { fields: EffectField[]; compute: (v: FieldValues, raw: Record<string, string>) => number } {
  const sd: EffectField = { key: 'sd', label: 'Standard deviation of the outcome', hint: 'How much scores vary within one group. Take it from earlier studies that used the same measure, or from the scale\'s manual. Not sure? Think of the range where almost everyone\'s scores fall and divide it by 4: if almost everyone scores between 30 and 70, the SD is about 10.', placeholder: 'e.g. 10' };
  const r2Full: EffectField = { key: 'r2', label: 'Expected R² of the full model', hint: 'What all predictors together explain, controls included. If unsure, take what the controls explain in earlier studies and add the change.', placeholder: 'e.g. .30' };
  switch (id) {
    case 'two-groups':
    case 'one-sample':
      return route === 'matter'
        ? {
            fields: [
              { key: 'diff', label: id === 'two-groups' ? 'Smallest difference between the group means that would matter' : 'Smallest difference from the fixed value that would matter', hint: 'In the outcome\'s own units, for example 3 points on a 0 to 100 wellbeing scale. Ask: below what difference would I shrug?', placeholder: 'e.g. 3' },
              sd,
            ],
            compute: (v) => Math.abs(v.diff) / v.sd,
          }
        : { fields: [{ key: 'es', label: "Cohen's d reported in earlier research", hint: 'Use the average of a meta-analysis if there is one.', placeholder: 'e.g. 0.40' }], compute: (v) => Math.abs(v.es) };
    case 'paired':
      return route === 'matter'
        ? {
            fields: [
              { key: 'diff', label: 'Smallest average change that would matter', hint: 'In the outcome\'s own units, for example 2 points from before to after.', placeholder: 'e.g. 2' },
              { ...sd, label: 'Standard deviation of the scores at one time point', hint: 'How much people differ from each other at one measurement, from earlier studies or the scale\'s manual. Not sure? Think of the range where almost everyone\'s scores fall and divide it by 4: if almost everyone scores between 30 and 70, the SD is about 10.' },
              { key: 'rpre', label: 'Correlation between the two measurements', hint: 'Filled in with .5, the cautious choice when you do not know. How strongly people\'s first and second scores go together: repeated measurements of the same scale often correlate .5 to .8.', placeholder: 'e.g. .5' },
            ],
            compute: (v) => Math.abs(v.diff) / (v.sd * Math.sqrt(2 * (1 - v.rpre))),
          }
        : {
            fields: [
              { key: 'es', label: 'Effect size reported in earlier research (dz or d)', hint: 'dz is the mean change divided by the SD of the change scores. Many papers report d instead, based on the SD at one time point.', placeholder: 'e.g. 0.40' },
              { key: 'r', label: 'Only if the paper reports d: the correlation between the two measurements', hint: 'Leave empty if the paper reports dz. With a correlation, d is converted: dz = d / √(2(1 − r)).', placeholder: 'e.g. .5', optional: true },
            ],
            compute: (v) => (Number.isNaN(v.r) ? Math.abs(v.es) : Math.abs(v.es) / Math.sqrt(2 * (1 - v.r))),
          };
    case 'repeated':
      return route === 'matter'
        ? {
            fields: [
              { key: 'spread', label: 'Smallest difference between the highest and the lowest condition mean that would matter', hint: 'In the outcome\'s own units, for example 4 points. The page assumes any other conditions fall in the middle, the most cautious pattern.', placeholder: 'e.g. 4' },
              { ...sd, label: 'Standard deviation of the scores within one condition', hint: 'How much people differ from each other in one condition, from earlier studies or a pilot. If each condition has several stimuli, use the SD of people\'s average over those stimuli. Not sure? Think of the range where almost everyone\'s scores fall and divide it by 4: if almost everyone scores between 30 and 70, the SD is about 10.' },
            ],
            // Cohen's (1988) minimum-variability pattern: f = d / √(2k).
            compute: (v) => Math.abs(v.spread) / v.sd / Math.sqrt(2 * v.k),
          }
        : {
            fields: [{ key: 'eta2', label: 'Partial η² from a similar repeated-measures study', hint: 'Only from a study where the same people also did every condition: partial η² from a between-groups study is not comparable. It already contains that study\'s correlation between conditions.', placeholder: 'e.g. .06' }],
            // λ = n(k − 1)·ηp²/(1 − ηp²), written as G*Power's f for the chosen correlation.
            compute: (v) => Math.sqrt((v.eta2 / (1 - v.eta2)) * ((v.k - 1) * (1 - v.rho)) / v.k),
          };
    case 'factorial': {
      const { layout, which } = factors ?? { layout: 'between', which: 'interaction' };
      const cellSd: EffectField = { ...sd, label: 'Standard deviation of the scores within one cell', hint: 'A cell is one combination of the two factors. How much people differ from each other there, from earlier studies or a pilot. Not sure? Think of the range where almost everyone\'s scores fall and divide it by 4: if almost everyone scores between 30 and 70, the SD is about 10.' };
      if (route === 'research') {
        return {
          fields: [{ key: 'eta2', label: 'Partial η² of the same effect in a similar study', hint: 'Only from a study with the same layout (the same factors between or within people): partial η² from another layout is not comparable.', placeholder: 'e.g. .04' }],
          compute: (v) => fFromEta2(v.eta2),
        };
      }
      return which === 'interaction'
        ? {
            fields: [
              { key: 'eff1', label: 'Effect of one factor at the first level of the other', hint: 'A difference in the outcome\'s own units. In a pre-post design with a control group: the expected change in the training group, for example 5 points.', placeholder: 'e.g. 5' },
              { key: 'eff2', label: 'The same effect at the other level', hint: 'For example 0 points of change in the waiting-list group. Use a minus sign if the effect goes the other way there.', placeholder: 'e.g. 0' },
              cellSd,
            ],
            compute: (v) => factorialF(layout, which, (v.eff1 - v.eff2) / v.sd, v.rho),
          }
        : {
            fields: [
              { key: 'diff', label: 'Smallest difference between the two levels of the factor that would matter', hint: 'Averaged over the other factor, in the outcome\'s own units, for example 3 points.', placeholder: 'e.g. 3' },
              cellSd,
            ],
            compute: (v) => factorialF(layout, which, v.diff / v.sd, v.rho),
          };
    }
    case 'anova':
      return route === 'matter'
        ? {
            fields: [
              { key: 'spread', label: 'Smallest difference between the highest and the lowest group mean that would matter', hint: 'In the outcome\'s own units, for example 4 points. The page assumes any other groups fall in the middle, the most cautious pattern.', placeholder: 'e.g. 4' },
              sd,
            ],
            // Cohen's (1988) minimum-variability pattern: f = d / √(2k).
            compute: (v) => Math.abs(v.spread) / v.sd / Math.sqrt(2 * v.k),
          }
        : { fields: [{ key: 'eta2', label: 'η² (eta squared) reported in earlier research', hint: 'For a design with one factor, partial η² is the same number.', placeholder: 'e.g. .06' }], compute: (v) => fFromEta2(v.eta2) };
    case 'correlation':
      return {
        fields: [route === 'matter'
          ? { key: 'r', label: 'Smallest correlation that would matter', hint: 'Below this, the relationship would be too weak to be useful for your purpose. r = .10 means the variables share 1% of their variance; r = .30 means 9%.', placeholder: 'e.g. .20' }
          : { key: 'r', label: 'Correlation reported in earlier research', hint: 'Use the average of a meta-analysis if there is one.', placeholder: 'e.g. .25' }],
        compute: (v) => Math.abs(v.r),
      };
    case 'regression':
      return {
        fields: [{ key: 'r2', label: route === 'matter' ? 'Smallest R² that would matter' : 'R² reported in earlier research', hint: 'The share of variance in the outcome that the predictors explain together.', placeholder: 'e.g. .10' }],
        compute: (v) => v.r2 / (1 - v.r2),
      };
    case 'r2-change':
      return {
        fields: [
          { key: 'dr2', label: route === 'matter' ? 'Smallest R² change that would matter' : 'R² change reported in earlier research', hint: 'The extra variance the tested predictors explain on top of the others, for example .03 (3%).', placeholder: 'e.g. .03' },
          r2Full,
        ],
        compute: (v) => v.dr2 / (1 - v.r2),
      };
    case 'chi-square':
      return {
        fields: [{ key: 'v', label: route === 'matter' ? "Smallest Cramér's V that would matter" : "Cramér's V reported in earlier research", hint: 'The effect size for a table of counts, from 0 (no relation) to 1. For a 2 × 2 table it equals phi.', placeholder: 'e.g. .20' }],
        compute: (v) => v.v * Math.sqrt(Math.min(v.rows, v.cols) - 1),
      };
    case 'proportions':
      return {
        fields: [{ key: 'p2', label: 'Percentage "yes" in the second group', hint: 'The smallest difference from the first group that would matter, or what earlier studies found.', placeholder: 'e.g. 45' }],
        compute: (v) => v.p2 / 100,
      };
  }
}

/** Effect sizes in plain words, for a student with no numbers to go on. */
export type Preset = { value: number; label: string; note: string; recommended?: boolean };

export function presets(design: Design, factors?: { layout: Layout; which: Which; rho?: number }): Preset[] {
  if (design.id === 'factorial' && factors) return factorialPresets(factors.layout, factors.which, factors.rho);
  const [s, m, l] = design.benchmarks ?? [0, 0, 0];
  const d = design.symbol === 'd' || design.symbol === 'dz';
  const cohen: Preset[] = [
    { value: s, label: `Small: subtle (${design.symbol} = ${fmt(design, s)})`, note: `Real, but hard to notice without measuring many people.${d ? ' Cohen\'s example: the height difference between 15- and 16-year-old girls.' : ''}` },
    { value: m, label: `Medium: noticeable (${design.symbol} = ${fmt(design, m)})`, note: `Visible to a careful observer.${d ? ' Cohen\'s example: the height difference between 14- and 18-year-old girls.' : ''} Common in student projects, but real effects are often smaller.` },
    { value: l, label: `Large: obvious (${design.symbol} = ${fmt(design, l)})`, note: `Most people would notice it without any statistics.${d ? ' Cohen\'s example: 13- versus 18-year-old girls.' : ''} Rarely realistic; choose it only with a strong reason.` },
  ];
  if (design.id === 'two-groups') {
    return [{ value: 0.36, label: 'Typical (d = 0.36)', note: 'Between small and medium: the median effect found in social psychology (Lovakov & Agadullina, 2021). An honest default when you have nothing else.', recommended: true }, ...cohen];
  }
  if (design.id === 'correlation') {
    return [{ value: 0.2, label: 'Typical (r = .20)', note: 'Between small and medium: a typical correlation in psychology (Gignac & Szodorai, 2016). An honest default when you have nothing else.', recommended: true }, ...cohen];
  }
  return cohen;
}

/** 2 × 2 effects in plain words: a main effect as Cohen's d, an interaction as the shape of the two simple effects. */
function factorialPresets(layout: Layout, which: Which, rho = 0.5): Preset[] {
  const f = (delta: number) => factorialF(layout, which, delta, rho);
  const show = (delta: number) => `f = ${f(delta).toFixed(2)}`;
  if (which === 'interaction') {
    return [
      { value: f(0.5), label: `The effect disappears (${show(0.5)})`, note: 'One factor has a medium effect (d = 0.50) at one level of the other factor and none at the other level. For example: the training helps, the waiting list does not.', recommended: true },
      { value: f(0.25), label: `The effect halves (${show(0.25)})`, note: 'A medium effect (d = 0.50) at one level shrinks to a small one (d = 0.25) at the other. Common, and very hard to detect.' },
      { value: f(1), label: `The effect reverses (${show(1)})`, note: 'A medium effect (d = 0.50) one way at one level, and the same effect the other way at the other level. Rare; choose it only with a strong reason.' },
    ];
  }
  return [
    { value: f(0.2), label: `Small: subtle (d = 0.20, ${show(0.2)})`, note: 'The two levels differ by a fifth of a standard deviation, averaged over the other factor. Real, but hard to notice.' },
    { value: f(0.5), label: `Medium: noticeable (d = 0.50, ${show(0.5)})`, note: 'Half a standard deviation. Common in student projects, but real effects are often smaller.' },
    { value: f(0.8), label: `Large: obvious (d = 0.80, ${show(0.8)})`, note: 'Most people would notice it without any statistics. Rarely realistic; choose it only with a strong reason.' },
  ];
}

function fmt(design: Design, value: number): string {
  return design.id === 'correlation' ? value.toFixed(2).replace(/^0\./, '.') : value.toFixed(2);
}
