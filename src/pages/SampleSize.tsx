import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import AvatarTip from '../components/AvatarTip';
import { pnorm } from '../stats/distributions';
import { HAS_SIDES, minN, PER_GROUP, powerAt, rCode, solveEffect, solveN, stimulusSimCode, totalN, type DesignId, type Plan } from '../stats/power';
import { DESIGNS, designById, effectInputs, presets, type Design, type EffectRoute } from './sampleSizeDesigns';
import './ModelChooser.css';
import './SampleSize.css';

type Mode = 'n' | 'effect';

const parse = (text: string) => (text.trim() === '' ? NaN : Number(text.replace(',', '.')));
const pct = (x: number, digits = 0) => `${(100 * x).toFixed(digits)}%`;
/** APA style: no leading zero for values that cannot exceed 1. */
const noZero = (text: string) => text.replace(/^(-?)0\./, '$1.');

function formatEffect(design: Design, value: number): string {
  if (design.id === 'correlation') return noZero(value.toFixed(2));
  if (design.symbol === 'f²') return value.toFixed(3);
  return value.toFixed(2);
}

/** What an effect of this size means, in words a student can check against their field. */
function meaning(design: Design, effect: number, p1: number): string {
  switch (design.id) {
    case 'two-groups':
      return `If scores are normal, about ${pct(pnorm(effect))} of the higher group scores above the other group's mean (it would be 50% with no difference).`;
    case 'paired':
      return `If change scores are normal, about ${pct(pnorm(effect))} of people change in the expected direction.`;
    case 'one-sample':
      return `If scores are normal, about ${pct(pnorm(effect))} of people score on the expected side of the fixed value.`;
    case 'repeated':
      return `Within one condition, the conditions would explain ${pct(effect ** 2 / (1 + effect ** 2), 1)} of the variance in the scores (η², leaving out the differences between people).`;
    case 'anova':
      return `The groups explain ${pct(effect ** 2 / (1 + effect ** 2), 1)} of the variance in the outcome (η²).`;
    case 'correlation':
      return `The two variables share ${pct(effect ** 2, 1)} of their variance (r²).`;
    case 'regression':
      return `The predictors explain ${pct(effect / (1 + effect), 1)} of the variance in the outcome (R²).`;
    case 'r2-change':
      return `The added predictors explain ${pct(effect / (1 + effect), 1)} of the variance the other predictors leave unexplained (partial R²).`;
    case 'proportions':
      return `A difference of ${(100 * Math.abs(effect - p1)).toFixed(1)} percentage points.`;
    case 'chi-square':
      return 'For a 2 × 2 table, w is the phi coefficient; for larger tables, w = Cramér\'s V × √(min(rows, columns) − 1).';
  }
}

function peopleText(design: Design, plan: Plan, n: number): string {
  const total = totalN(plan, n);
  if (design.id === 'paired') return `${total} participants, each measured twice`;
  if (PER_GROUP[design.id]) return `${total} participants (${n} per group)`;
  return `${total} participants`;
}

function testText(design: Design, sides: 1 | 2): string {
  return HAS_SIDES[design.id] ? `a ${sides === 2 ? 'two' : 'one'}-sided ${design.test}` : `the ${design.test}`;
}

function effectText(design: Design, plan: Plan, value: number): string {
  if (design.id === 'proportions') return `a difference between ${pct(plan.p1 ?? 0, 1)} and ${pct(value, 1)}`;
  if (design.id === 'repeated') return `an effect of f = ${formatEffect(design, value)} (with a correlation of r = ${noZero((plan.rho ?? 0.5).toFixed(2))} between conditions)`;
  return `an effect of ${design.symbol} = ${formatEffect(design, value)}`;
}

function tool(design: Design): string {
  if (design.id === 'repeated') return 'the formula G*Power uses for repeated measures (Faul et al., 2007), computed in R';
  return design.id === 'proportions' ? 'the power.prop.test() function in R' : 'the pwr package in R (Champely, 2020)';
}

/** Power against sample size (or against effect size when n is fixed). */
function PowerCurve({ points, xLabel, target, mark, markLabel }: {
  points: [number, number][];
  xLabel: string;
  target: number;
  mark: [number, number];
  markLabel: string;
}) {
  const W = 560, H = 240, L = 44, R = 12, T = 12, B = 40;
  const xs = points.map((p) => p[0]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs);
  const sx = (x: number) => L + ((x - x0) / (x1 - x0 || 1)) * (W - L - R);
  const sy = (y: number) => T + (1 - y) * (H - T - B);
  const path = points.map(([x, y], i) => `${i ? 'L' : 'M'}${sx(x).toFixed(1)},${sy(y).toFixed(1)}`).join('');
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  const xTicks = [x0, x0 + (x1 - x0) / 2, x1];
  const fmt = (x: number) => (Number.isInteger(x) || x > 20 ? String(Math.round(x)) : x.toFixed(2));
  return (
    <svg className="ss-curve" viewBox={`0 0 ${W} ${H}`} role="img"
      aria-label={`Power rises with ${xLabel.toLowerCase()}. It reaches ${pct(target)} at ${markLabel}.`}>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={L} x2={W - R} y1={sy(t)} y2={sy(t)} className="ss-grid" />
          <text x={L - 6} y={sy(t) + 4} textAnchor="end">{pct(t)}</text>
        </g>
      ))}
      <line x1={L} x2={W - R} y1={sy(target)} y2={sy(target)} className="ss-target" />
      {xTicks.map((x) => <text key={x} x={sx(x)} y={H - B + 18} textAnchor="middle">{fmt(x)}</text>)}
      <text x={(L + W - R) / 2} y={H - 4} textAnchor="middle" className="ss-axis-label">{xLabel}</text>
      <path d={path} className="ss-line" />
      <circle cx={sx(mark[0])} cy={sy(mark[1])} r={5} className="ss-mark" />
    </svg>
  );
}

type StepId = 'design' | 'mode' | 'n' | 'k' | 'rho' | 'stimuli' | 'nstim' | 'predictors' | 'added' | 'table' | 'p1' | 'route' | 'effect' | 'power' | 'alpha' | 'tests' | 'sides' | 'dropout';
type AlphaChoice = 'standard' | 'strict' | 'bonferroni';

type Answers = {
  design?: DesignId;
  mode?: Mode;
  route?: EffectRoute;
  rho?: number;
  /** Several stimuli (pictures, words, items) per condition. */
  stimuli?: boolean;
  effect?: number;
  power?: number;
  alpha?: AlphaChoice;
  sides?: 1 | 2;
  dropout?: number;
  /** Everything typed into a text box, by field name. */
  text: Record<string, string>;
};

const START: Answers = { text: { n: '100', k: '3', predictors: '3', added: '1', rows: '2', cols: '2', p1: '30', tests: '3', nstim: '4', rpre: '.5' } };

function stepsFor(a: Answers): StepId[] {
  const steps: StepId[] = ['design'];
  if (!a.design) return steps;
  steps.push('mode');
  if (!a.mode) return steps;
  if (a.mode === 'effect') steps.push('n');
  if (a.design === 'anova' || a.design === 'repeated') steps.push('k');
  if (a.design === 'repeated') {
    steps.push('rho', 'stimuli');
    if (a.stimuli) steps.push('nstim');
  }
  if (a.design === 'regression' || a.design === 'r2-change') steps.push('predictors');
  if (a.design === 'r2-change') steps.push('added');
  if (a.design === 'chi-square') steps.push('table');
  if (a.design === 'proportions') steps.push('p1');
  if (a.mode === 'n') steps.push(...(a.design === 'proportions' ? ['effect' as const] : ['route' as const, 'effect' as const]));
  steps.push('power', 'alpha');
  if (a.alpha === 'bonferroni') steps.push('tests');
  if (HAS_SIDES[a.design]) steps.push('sides');
  if (a.mode === 'n') steps.push('dropout');
  return steps;
}

const alphaOf = (a: Answers) => (a.alpha === 'strict' ? 0.01 : a.alpha === 'bonferroni' ? 0.05 / parse(a.text.tests) : 0.05);
const alphaLabel = (x: number) => noZero(String(Number(x.toPrecision(3))));

function unitLabel(design: Design): string {
  if (design.id === 'paired') return 'people, each measured twice';
  return PER_GROUP[design.id] ? 'people per group' : 'people in total';
}

/** The question each text-box step asks, its fields, and whether the answer can be used. */
function inputStep(step: StepId, a: Answers, design: Design): { fields: { key: string; label: string; hint?: string }[]; error?: string } | null {
  const t = a.text;
  const whole = (key: string, lo: number, hi: number) => Number.isInteger(parse(t[key])) && parse(t[key]) >= lo && parse(t[key]) <= hi;
  switch (step) {
    case 'n':
      return { fields: [{ key: 'n', label: `Number of ${unitLabel(design)}` }], error: whole('n', 2, 1_000_000) ? undefined : 'Enter a whole number of people.' };
    case 'k':
      return { fields: [{ key: 'k', label: design.id === 'repeated' ? 'Number of conditions' : 'Number of groups' }], error: whole('k', 2, 50) ? undefined : 'Enter a whole number from 2 to 50.' };
    case 'predictors':
      return { fields: [{ key: 'predictors', label: 'Number of predictors' }], error: whole('predictors', 1, 100) ? undefined : 'Enter a whole number from 1 to 100.' };
    case 'added':
      return { fields: [{ key: 'added', label: 'Number of predictors you test' }], error: whole('added', 1, parse(t.predictors)) ? undefined : `Enter a whole number from 1 to ${t.predictors}.` };
    case 'table':
      return {
        fields: [{ key: 'rows', label: 'Rows (categories of one variable)' }, { key: 'cols', label: 'Columns (categories of the other)' }],
        error: whole('rows', 2, 50) && whole('cols', 2, 50) ? undefined : 'Enter whole numbers of at least 2.',
      };
    case 'p1':
      return { fields: [{ key: 'p1', label: 'Percentage "yes" in the first group' }], error: parse(t.p1) > 0 && parse(t.p1) < 100 ? undefined : 'Enter a percentage between 0 and 100.' };
    case 'nstim':
      return { fields: [{ key: 'nstim', label: 'Stimuli per condition' }], error: whole('nstim', 1, 500) ? undefined : 'Enter a whole number from 1 to 500.' };
    case 'tests':
      return { fields: [{ key: 'tests', label: 'Number of tests' }], error: whole('tests', 2, 100) ? undefined : 'Enter a whole number from 2 to 100.' };
    default:
      return null;
  }
}

const INPUT_TEXT: Partial<Record<StepId, { question: string; help: string }>> = {
  n: { question: 'How many people will you have?', help: 'Count the people you expect to have complete data for, not everyone you invite.' },
  k: { question: 'How many groups will you compare?', help: 'For example 3 for three training programmes. The plan assumes groups of about equal size.' },
  predictors: { question: 'How many predictors will the model have?', help: 'Count every term in the model, control variables included. A numeric predictor counts once; a categorical predictor with g categories counts g − 1 times, because R turns it into g − 1 dummy variables (Lesson 12-2).' },
  added: { question: 'How many of those predictors are you testing?', help: 'Usually 1: the predictor your question is about, with the others as controls. With one tested predictor, this is the same test as that predictor\'s t-test in summary().' },
  table: { question: 'How big is your table of counts?', help: 'Rows are the categories of one variable, columns those of the other: department (4) by remote work (2) is a 4 × 2 table. For a goodness-of-fit test of one variable, enter its number of categories as rows and 2 as columns; that gives the right degrees of freedom.' },
  p1: { question: 'What percentage says "yes" in the first group?', help: 'The comparison or control group. Take it from records, earlier studies or national figures. The same difference in percentage points is harder to detect near 50% than near 0% or 100%.' },
  nstim: { question: 'How many stimuli per condition?', help: 'For example 4 pictures in every condition. If every condition uses the same stimuli, count them once.' },
  tests: { question: 'How many tests will you correct for?', help: 'Bonferroni divides α by the number of tests you correct for together, so each test needs a smaller p-value, and the study needs more people.' },
};

type Option<T> = { value: T; label: string; note: ReactNode; tag?: string };

function Choice<T>({ options, chosen, onPick }: { options: Option<T>[]; chosen: T | undefined; onPick: (value: T) => void }) {
  const id = useId();
  return (
    <ul className="model-chooser-options">
      {options.map((option, i) => {
        const earlier = chosen !== undefined && option.value === chosen;
        return (
          <li key={option.label}>
            <button type="button" className={earlier ? 'flagged' : undefined} aria-labelledby={`${id}-${i}-label`} aria-describedby={`${id}-${i}-more`} onClick={() => onPick(option.value)}>
              <span className="mc-option-label" id={`${id}-${i}-label`}>{option.label}</span>
              <span id={`${id}-${i}-more`} className="mc-option-more">
                {earlier && <span className="mc-flag">Your earlier choice</span>}
                {option.tag && <span className="ss-tag">{option.tag}</span>}
                <span className="ss-option-note">{option.note}</span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export default function SampleSize() {
  const [answers, setAnswers] = useState<Answers>(START);
  const [at, setAt] = useState(0);
  const [copied, setCopied] = useState('');
  const headingRef = useRef<HTMLHeadingElement>(null);
  const moveFocus = useRef(false);
  const ids = useId();

  const steps = stepsFor(answers);
  const step: StepId | 'result' = at < steps.length ? steps[at] : 'result';
  const design = designById(answers.design ?? 'two-groups');

  useEffect(() => {
    if (!moveFocus.current) return;
    moveFocus.current = false;
    headingRef.current?.focus();
  }, [at, step]);

  function go(index: number) {
    moveFocus.current = true;
    setAt(index);
  }
  function answer(patch: Partial<Answers>) {
    moveFocus.current = true;
    setAnswers((prev) => ({ ...prev, ...patch }));
    setAt((i) => i + 1);
  }
  function type(key: string, value: string) {
    setAnswers((prev) => ({ ...prev, text: { ...prev.text, [key]: value } }));
  }

  const plan = useMemo((): Plan | null => {
    const a = answers;
    if (!a.design || !a.mode || !a.power || !a.alpha) return null;
    if (a.mode === 'n' && a.effect === undefined) return null;
    const t = a.text;
    return {
      design: a.design,
      effect: a.effect ?? 0,
      alpha: alphaOf(a),
      sides: HAS_SIDES[a.design] ? (a.sides ?? 2) : 2,
      k: parse(t.k),
      predictors: parse(t.predictors),
      added: parse(t.added),
      df: (parse(t.rows) - 1) * (parse(t.cols) - 1),
      p1: parse(t.p1) / 100,
      rho: a.rho,
    };
  }, [answers]);

  const power = answers.power ?? 0.8;
  const result = useMemo(() => {
    if (step !== 'result' || !plan) return null;
    if (answers.mode === 'n') {
      const n = solveN(plan, power);
      if (n === null) return { kind: 'too-small' as const };
      const drop = (answers.dropout ?? 0) / 100;
      const recruitUnit = Math.ceil(n / (1 - drop));
      const hi = Math.max(n * 2, minN(plan) + 10);
      const stepSize = Math.max(1, Math.round((hi - minN(plan)) / 48));
      const points: [number, number][] = [];
      for (let x = minN(plan); x <= hi; x += stepSize) points.push([totalN(plan, x), powerAt(plan, x)]);
      const smaller = [0.75, 0.5].map((f) => {
        const e = plan.design === 'proportions' ? (plan.p1 ?? 0) + (plan.effect - (plan.p1 ?? 0)) * f : plan.effect * f;
        const m = solveN({ ...plan, effect: e }, power);
        return { f, e, total: m === null ? null : totalN(plan, m) };
      });
      return { kind: 'n' as const, plan, n, achieved: powerAt(plan, n), drop, recruitUnit, points, smaller };
    }
    const n = parse(answers.text.n);
    if (n < minN(plan)) return { kind: 'bad-n' as const, min: minN(plan) };
    const e = solveEffect(plan, n, power);
    if (e === null) return { kind: 'none' as const };
    const lo = plan.design === 'proportions' ? (plan.p1 ?? 0) : 0;
    const hi = Math.min(lo + (e - lo) * 2, plan.design === 'correlation' || plan.design === 'proportions' ? 0.999 : Infinity);
    const points: [number, number][] = [];
    for (let i = 0; i <= 48; i++) {
      const x = lo + ((hi - lo) * i) / 48;
      points.push([x, powerAt({ ...plan, effect: x }, n)]);
    }
    return { kind: 'effect' as const, plan, n, effect: e, points };
  }, [step, plan, answers.mode, answers.dropout, answers.text.n, power]);

  const code = result && (result.kind === 'n' || result.kind === 'effect') ? rCode(result.plan, answers.mode ?? 'n', power, result.kind === 'effect' ? result.n : undefined) : '';
  useEffect(() => setCopied(''), [code]);
  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(text);
    } catch {
      // No clipboard permission: the code is on screen to copy by hand.
    }
  }

  const stimuli = design.id === 'repeated' && answers.stimuli && result && (result.kind === 'n' || result.kind === 'effect');
  const simCode = stimuli
    ? stimulusSimCode(result.n, parse(answers.text.k), parse(answers.text.nstim), result.kind === 'n' ? result.plan.effect : result.effect)
    : '';

  /** Everyone needed for an effect at the usual settings, to show next to each plain-words option. */
  function previewPeople(effect: number): number | null {
    const t = answers.text;
    const p: Plan = {
      design: design.id, effect, alpha: 0.05, sides: 2, k: parse(t.k), predictors: parse(t.predictors), added: parse(t.added),
      df: (parse(t.rows) - 1) * (parse(t.cols) - 1), p1: parse(t.p1) / 100, rho: answers.rho,
    };
    const n = solveN(p, 0.8);
    return n === null ? null : totalN(p, n);
  }

  /** The trail's label for an answered step. */
  function summary(s: StepId): string {
    const t = answers.text;
    switch (s) {
      case 'design': return design.title;
      case 'mode': return answers.mode === 'n' ? 'Plan a new study' : 'Sample size is fixed';
      case 'n': return `${t.n} ${unitLabel(design)}`;
      case 'k': return `${t.k} ${design.id === 'repeated' ? 'conditions' : 'groups'}`;
      case 'rho': return `r = ${noZero((answers.rho ?? 0.5).toFixed(2))} between conditions`;
      case 'stimuli': return answers.stimuli ? 'Several stimuli per condition' : 'One score per condition';
      case 'nstim': return `${t.nstim} stimuli per condition`;
      case 'predictors': return `${t.predictors} predictors`;
      case 'added': return `${t.added} tested`;
      case 'table': return `${t.rows} × ${t.cols} table`;
      case 'p1': return `${t.p1}% yes in group 1`;
      case 'route': return { matter: 'My own guess of the scores', research: 'From a paper', unknown: 'In plain words' }[answers.route ?? 'unknown'];
      case 'effect': return design.id === 'proportions' ? `${pct(answers.effect ?? 0, 1)} yes in group 2` : `${design.symbol} = ${formatEffect(design, answers.effect ?? 0)}`;
      case 'power': return `${pct(power)} power`;
      case 'alpha': return `α = ${alphaLabel(alphaOf(answers))}`;
      case 'tests': return `${t.tests} tests`;
      case 'sides': return answers.sides === 1 ? 'One-sided' : 'Two-sided';
      case 'dropout': return `${answers.dropout}% dropout`;
    }
  }

  const alphaText = alphaLabel(alphaOf(answers));
  let question: ReactNode = null;
  let help: ReactNode = null;
  let body: ReactNode = null;

  const input = step === 'result' ? null : inputStep(step, answers, design);
  if (input) {
    const text = step === 'k' && design.id === 'repeated'
      ? { question: 'How many conditions will each person do?', help: 'Count the conditions every participant goes through, for example 4. With 2 conditions and one score each, this is the paired t-test.' }
      : INPUT_TEXT[step as StepId]!;
    question = text.question;
    help = text.help;
    body = (
      <form className="ss-input-step" onSubmit={(e) => { e.preventDefault(); if (!input.error) answer({}); }}>
        <div className="ss-fields">
          {input.fields.map((field) => (
            <label key={field.key} className="ss-field">
              <span>{field.label}</span>
              <input inputMode="decimal" value={answers.text[field.key] ?? ''} onChange={(e) => type(field.key, e.target.value)} />
            </label>
          ))}
        </div>
        {step === 'table' && !input.error && <p className="ss-meaning">Degrees of freedom: ({answers.text.rows} − 1) × ({answers.text.cols} − 1) = {(parse(answers.text.rows) - 1) * (parse(answers.text.cols) - 1)}.</p>}
        {step === 'tests' && !input.error && <p className="ss-meaning">Each test then uses α = .05 / {answers.text.tests} = {alphaLabel(0.05 / parse(answers.text.tests))}.</p>}
        {input.error && <p className="ss-error">{input.error}</p>}
        <button type="submit" className="button-primary" disabled={!!input.error}>Next</button>
      </form>
    );
  } else if (step === 'design') {
    question = 'What will you test?';
    help = <>Pick the comparison your research question makes. Not sure? <Link to="/which-model">Which model should I use?</Link> helps you choose. Repeated measures, with or without several stimuli per condition, are under "Measure the same people in several conditions". Logistic regression, mediation and models with more random factors are not here: plan those by simulation, as <Link to="/lesson/08-3">Lesson 8-3</Link> does.</>;
    body = (
      <Choice
        options={DESIGNS.map((d) => ({ value: d.id, label: d.title, note: `e.g. ${d.example} Analysis: ${d.test}.` }))}
        chosen={answers.design}
        onPick={(value) => answer(value === answers.design ? {} : { design: value, route: undefined, effect: undefined, text: { ...answers.text, ...Object.fromEntries(['diff', 'sd', 'r', 'es', 'spread', 'eta2', 'r2', 'dr2', 'v', 'p2'].map((k) => [k, ''])), rpre: '.5' } })}
      />
    );
  } else if (step === 'mode') {
    question = 'What do you want to find out?';
    help = 'Most people use a power analysis to plan a new study. If your data already exist, or the number of people is fixed (one class, one company), turn the question around.';
    body = (
      <Choice<Mode>
        options={[
          { value: 'n', label: 'How many people do I need?', note: 'For a study you are still planning. This is the usual question.', tag: 'Most common' },
          { value: 'effect', label: 'What can my sample detect?', note: 'The number of people is already fixed. This tells you the smallest effect your study can reliably find.' },
        ]}
        chosen={answers.mode}
        onPick={(value) => answer({ mode: value })}
      />
    );
  } else if (step === 'route') {
    question = 'How big is the effect you want to be able to find?';
    help = (
      <>
        The effect size is how big the difference or relationship is. It is the choice that matters most: an effect half as big needs
        about four times as many people. You do not need to know it exactly. Pick the way that fits what you know.
      </>
    );
    body = (
      <Choice<EffectRoute>
        options={[
          { value: 'unknown', label: 'Choose a size in plain words', note: 'No numbers needed. Pick small, typical, medium or large, and see straight away how many people each one needs.', tag: 'Easiest: start here if this is new' },
          { value: 'matter', label: 'I can guess the scores', note: 'You know your measure well enough to say what difference, in its own units, would be worth finding, and roughly how much people differ. The strongest basis for a plan.' },
          { value: 'research', label: 'I have an effect size from a paper', note: 'From a meta-analysis or similar studies. One study\'s effect is usually too optimistic: replications find on average about half the original effect (Open Science Collaboration, 2015).' },
        ]}
        chosen={answers.route}
        onPick={(value) => answer({ route: value })}
      />
    );
  } else if (step === 'effect' && answers.route === 'unknown') {
    question = 'Which size of effect do you want to be able to find?';
    help = (
      <>
        Choose the smallest effect you would not want to miss. Smaller effects need more people. The number of people under each option
        uses the usual settings (80% power, α = .05); you can change those in the next questions.
        {design.id === 'paired' && ' For two measurements of the same people, these sizes are rougher: Cohen wrote them for d, not dz.'}
      </>
    );
    body = (
      <Choice
        options={presets(design).map((p) => {
          const people = previewPeople(p.value);
          return { value: p.value, label: p.label, note: <>{p.note} <strong>{people === null ? 'Needs more than a million people.' : `Needs about ${people} people.`}</strong></>, tag: p.recommended ? 'Recommended' : undefined };
        })}
        chosen={answers.effect}
        onPick={(value) => answer({ effect: value })}
      />
    );
  } else if (step === 'effect') {
    const route = design.id === 'proportions' ? 'matter' : (answers.route as 'matter' | 'research');
    const { fields, compute } = effectInputs(design.id, route);
    const values = Object.fromEntries(Object.entries(answers.text).map(([k, v]) => [k, parse(v)]));
    const missing = fields.some((f) => !f.optional && (answers.text[f.key] ?? '').trim() === '');
    const effect = missing ? NaN : compute(values, answers.text);
    const p1 = parse(answers.text.p1) / 100;
    let error: string | undefined;
    if (missing) error = undefined;
    else if (design.id === 'proportions') error = effect > 0 && effect < 1 && effect !== p1 ? undefined : 'Enter a percentage between 0 and 100 that differs from the first group\'s.';
    else if (!(Number.isFinite(effect) && effect > 0)) error = 'These numbers do not give a usable effect size. Check that standard deviations are above 0 and correlations and R² values are between 0 and 1.';
    else if (design.id === 'correlation' && effect >= 1) error = 'A correlation has to be below 1.';
    question = design.id === 'proportions' ? 'What percentage do you expect in the second group?' : route === 'matter' ? 'What difference would be worth finding?' : 'What did earlier research find?';
    help = design.id === 'proportions'
      ? 'Take the smallest difference from the first group that would matter to you, or what earlier studies found.'
      : route === 'matter'
        ? 'Rough guesses are fine. The page turns them into the effect size and says what it means, and you can always come back and try other values.'
        : 'If it comes from a single study, a common precaution is to plan for a smaller value than it reports.';
    body = (
      <form className="ss-input-step" onSubmit={(e) => { e.preventDefault(); if (!missing && !error) answer({ effect: Number(design.id === 'proportions' ? effect.toFixed(4) : formatEffect(design, effect).replace(/^\./, '0.')) }); }}>
        <div className="ss-fields ss-fields-wide">
          {fields.map((field) => (
            <label key={field.key} className="ss-field">
              <span>{field.label}</span>
              <input inputMode="decimal" placeholder={field.placeholder} value={answers.text[field.key] ?? ''} onChange={(e) => type(field.key, e.target.value)} />
              <small>{field.hint}</small>
            </label>
          ))}
        </div>
        {!missing && !error && (
          <p className="ss-meaning">
            {design.id === 'proportions' ? <>That is a difference of {(100 * Math.abs(effect - p1)).toFixed(1)} percentage points.</> : <>That is {design.symbol} = <strong>{formatEffect(design, effect)}</strong>. {meaning(design, effect, 0)}</>}
          </p>
        )}
        {error && <p className="ss-error">{error}</p>}
        <button type="submit" className="button-primary" disabled={missing || !!error}>Next</button>
      </form>
    );
  } else if (step === 'rho') {
    question = 'How strongly do a person\'s scores in different conditions go together?';
    help = 'People who score high in one condition usually score high in the others too. The stronger that correlation, the fewer people you need, because every person is compared with themselves. Take it from a pilot or an earlier study with the same measure if you can.';
    body = (
      <Choice
        options={[
          { value: 0.3, label: 'r = .30', note: 'Weak: noisy measures, or conditions far apart in time or very different from each other.' },
          { value: 0.5, label: 'r = .50', note: 'The cautious choice when you do not know, and G*Power\'s default.', tag: 'Recommended if you do not know' },
          { value: 0.7, label: 'r = .70', note: 'Strong: a reliable measure, or scores averaged over many trials. Only with evidence, because it lowers the sample a lot.' },
        ]}
        chosen={answers.rho}
        onPick={(value) => answer({ rho: value, text: { ...answers.text, rho: String(value) } })}
      />
    );
  } else if (step === 'stimuli') {
    question = 'Does each condition use several stimuli?';
    help = 'Stimuli are the things people respond to: pictures, words, sentences, video clips or vignettes. If you want your conclusion to hold for stimuli like yours, and not only for these few, the stimuli are a sample too, just like the people.';
    body = (
      <Choice
        options={[
          { value: false, label: 'No, one score per condition', note: 'For example one questionnaire score per condition, or the stimuli are exactly what you want to draw conclusions about.' },
          { value: true, label: 'Yes, several stimuli per condition', note: 'For example 4 pictures in each of 4 conditions. The page gives the minimum number of people and a simulation for the rest.' },
        ]}
        chosen={answers.stimuli}
        onPick={(value) => answer({ stimuli: value })}
      />
    );
  } else if (step === 'power') {
    question = 'How much power do you want?';
    help = 'Power is the chance that your study finds the effect (p below α) if the effect is really as large as you said. The rest is the chance of wrongly concluding there is nothing. Below 80% a study is generally considered underpowered.';
    body = (
      <Choice
        options={[
          { value: 0.8, label: '80%', note: 'A one-in-five chance of missing a real effect of this size. Cohen\'s convention, accepted by most supervisors and journals.', tag: 'Most common: the usual minimum' },
          { value: 0.9, label: '90%', note: 'Halves the risk of missing it, to one in ten, for roughly a third more people.', tag: 'Recommended if you can afford it' },
          { value: 0.95, label: '95%', note: 'For confirmatory or high-stakes studies. About two-thirds more people than 80%.' },
        ]}
        chosen={answers.power}
        onPick={(value) => answer({ power: value })}
      />
    );
  } else if (step === 'alpha') {
    question = 'Which significance level (α)?';
    help = 'α is the chance of a false positive: finding an effect that is not there. You will call a result significant when p is below α.';
    body = (
      <Choice<AlphaChoice>
        options={[
          { value: 'standard', label: 'α = .05', note: 'The convention in most fields.', tag: 'What almost everyone uses' },
          { value: 'strict', label: 'α = .01', note: 'Stricter, when a false positive would be costly. Needs about 50% more people.' },
          { value: 'bonferroni', label: 'Several tests, corrected', note: 'If you test several hypotheses and correct with Bonferroni, plan with α divided by the number of tests.' },
        ]}
        chosen={answers.alpha}
        onPick={(value) => answer({ alpha: value })}
      />
    );
  } else if (step === 'sides') {
    question = 'A two-sided or a one-sided test?';
    help = 'A two-sided test counts an effect in either direction. A one-sided test looks in one direction only, and ignores an effect the other way, however large.';
    body = (
      <Choice<1 | 2>
        options={[
          { value: 2, label: 'Two-sided', note: 'An effect in either direction counts. R\'s default.', tag: 'Recommended: what almost everyone uses' },
          { value: 1, label: 'One-sided', note: 'Only if you fixed the direction in advance, in writing, and an effect the other way would mean the same to you as no effect. Needs about a fifth fewer people, which is why reviewers distrust it when it was not planned.' },
        ]}
        chosen={answers.sides}
        onPick={(value) => answer({ sides: value })}
      />
    );
  } else if (step === 'dropout') {
    question = 'How many people will you lose?';
    help = 'Some people drop out, skip questions or fail attention checks. Recruit extra so enough complete cases remain. These are rough guides; figures from similar studies are better.';
    body = (
      <Choice
        options={[
          { value: 0, label: 'None', note: 'The data are already complete, or nobody can drop out.' },
          { value: 10, label: '10%', note: 'One session, in the lab or online.', tag: 'A common minimum' },
          { value: 20, label: '20%', note: 'An online survey with attention checks, or a hard-to-reach group.' },
          { value: 30, label: '30%', note: 'Several sessions, or a follow-up measurement weeks later.' },
        ]}
        chosen={answers.dropout}
        onPick={(value) => answer({ dropout: value })}
      />
    );
  }

  return (
    <div className="model-chooser sample-size">
      <header className="mc-intro">
        <h1>How many participants do I need?</h1>
        <p>
          A power analysis, done before you collect data, tells you how many people you need for a good chance of
          finding an effect that matters. Answer a few short questions; each one explains what to choose if you have
          never done this before.
        </p>
      </header>

      <AvatarTip tone="coach" title="Before you start">
        <p>
          Plan the sample before you collect it. Afterwards, a power analysis based on the effect you found tells you
          nothing the p-value and the confidence interval don't already say (<Link to="/lesson/08-3">Lesson 8-3</Link>).
        </p>
      </AvatarTip>

      <section className="mc-panel mc-tree" aria-labelledby={`${ids}-title`}>
        <p className="mc-kicker">Step by step</p>
        <h2 id={`${ids}-title`}>Answer a few short questions</h2>

        {at > 0 && (
          <nav className="model-chooser-trail" aria-label="Your answers so far">
            <ol>
              {steps.slice(0, at).map((s, i) => (
                <li key={s}>
                  <button type="button" onClick={() => go(i)}>
                    <span className="visually-hidden">Change your answer: </span>
                    {summary(s)}
                  </button>
                </li>
              ))}
            </ol>
            <div className="model-chooser-trail-actions">
              <button type="button" onClick={() => go(at - 1)}>Back</button>
              <button type="button" onClick={() => { go(0); setAnswers(START); }}>Start over</button>
            </div>
          </nav>
        )}

        {step !== 'result' ? (
          <div className="mc-step" key={step}>
            <p className="model-chooser-step">Question {at + 1}</p>
            <h3 ref={headingRef} tabIndex={-1} className="model-chooser-current">{question}</h3>
            <p className="model-chooser-help">{help}</p>
            {body}
          </div>
        ) : (
          <div className="model-chooser-answer ss-result" key="result">
            <p className="mc-kicker">Your plan</p>
            <h3 ref={headingRef} tabIndex={-1} className="model-chooser-current">{answers.mode === 'n' ? 'The sample you need' : 'What your sample can detect'}</h3>
            {result?.kind === 'too-small' && (
              <p role="alert" className="ss-error">An effect this small would need more than a million people. Check the effect size, or ask whether an effect this small matters.</p>
            )}
            {result?.kind === 'bad-n' && <p role="alert" className="ss-error">This design needs at least {result.min} people. Change the number of people above.</p>}
            {result?.kind === 'none' && <p role="alert" className="ss-error">No effect size reaches that power with this many people. Lower the power or add people.</p>}

            {result?.kind === 'n' && (
              <>
                <div className="ss-headline">
                  <p><span className="ss-big">{totalN(result.plan, result.recruitUnit)}</span> to recruit</p>
                  <p><span className="ss-big">{totalN(result.plan, result.n)}</span> complete cases needed</p>
                </div>
                <p>
                  You need {peopleText(design, result.plan, result.n)} with complete data. With that many, the power is {pct(result.achieved, 1)}.
                  {result.drop > 0 && <> To allow for {pct(result.drop)} dropout, recruit {peopleText(design, result.plan, result.recruitUnit)}.</>}
                </p>
                {stimuli && (
                  <p className="ss-note ss-warning">
                    With several stimuli per condition, this is the <strong>minimum</strong>: it treats your {answers.text.nstim} stimuli as the only ones that matter. See <a href="#ss-stimuli">Your stimuli</a> below.
                  </p>
                )}
                <h4>If the true effect is smaller</h4>
                <table className="ss-table">
                  <thead><tr><th scope="col">True effect</th><th scope="col">Complete cases needed</th></tr></thead>
                  <tbody>
                    <tr><td>{design.id === 'proportions' ? `${pct(result.plan.effect, 1)} (as planned)` : `${design.symbol} = ${formatEffect(design, result.plan.effect)} (as planned)`}</td><td>{totalN(result.plan, result.n)}</td></tr>
                    {result.smaller.map((s) => (
                      <tr key={s.f}>
                        <td>{design.id === 'proportions' ? `${pct(s.e, 1)} (${pct(s.f)} of the difference)` : `${design.symbol} = ${formatEffect(design, s.e)} (${pct(s.f)} of it)`}</td>
                        <td>{s.total === null ? 'more than a million' : s.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="ss-note">A somewhat smaller true effect needs a much larger sample. That is why the effect size is the choice to get right.</p>
                <PowerCurve points={result.points} xLabel="Total number of people" target={power}
                  mark={[totalN(result.plan, result.n), result.achieved]} markLabel={`${totalN(result.plan, result.n)} people`} />
                <h4>How to report it</h4>
                <p className="ss-report">
                  An a priori power analysis with {tool(design)} showed that {peopleText(design, result.plan, result.n)}{design.id === 'paired' && ','} are
                  needed to detect {effectText(design, result.plan, result.plan.effect)} with {pct(power)} power in {testText(design, result.plan.sides)} at
                  α = {alphaText}.{' '}
                  <em>{answers.route === 'unknown' ? '[Say that this is a conventional value, and why no better estimate was available.]' : '[Say where the effect size comes from.]'}</em>
                  {result.drop > 0 && <> To allow for {pct(result.drop)} dropout, we will recruit {totalN(result.plan, result.recruitUnit)} participants.</>}
                </p>
              </>
            )}

            {result?.kind === 'effect' && (
              <>
                <div className="ss-headline">
                  <p><span className="ss-big">{design.id === 'proportions' ? pct(result.effect, 1) : formatEffect(design, result.effect)}</span> {design.id === 'proportions' ? 'in the second group' : `smallest ${design.symbol} with ${pct(power)} power`}</p>
                </div>
                <p>
                  With {peopleText(design, result.plan, result.n)}, {testText(design, result.plan.sides)} at α = {alphaText} has {pct(power)} power
                  for {design.id === 'proportions' ? `a difference between ${pct(result.plan.p1 ?? 0, 1)} and ${pct(result.effect, 1)} or larger` : `effects of ${design.symbol} = ${formatEffect(design, result.effect)} or larger`}.
                  Smaller effects may well go unnoticed, so a non-significant result says little about them.
                </p>
                {stimuli && (
                  <p className="ss-note ss-warning">
                    With several stimuli per condition, this effect is <strong>optimistic</strong>: it treats your {answers.text.nstim} stimuli as the only ones that matter. See <a href="#ss-stimuli">Your stimuli</a> below.
                  </p>
                )}
                {design.id !== 'proportions' && <p className="ss-meaning">{meaning(design, result.effect, 0)}</p>}
                <PowerCurve points={result.points} xLabel={design.id === 'proportions' ? 'Proportion in the second group' : `Effect size (${design.symbol})`}
                  target={power} mark={[result.effect, power]} markLabel={`${design.symbol} = ${formatEffect(design, result.effect)}`} />
                <h4>How to report it</h4>
                <p className="ss-report">
                  A sensitivity power analysis with {tool(design)} showed that with {peopleText(design, result.plan, result.n)},{' '}
                  {testText(design, result.plan.sides)} at α = {alphaText} has {pct(power)} power to detect{' '}
                  {design.id === 'proportions' ? `a difference between ${pct(result.plan.p1 ?? 0, 1)} and ${pct(result.effect, 1)}` : `effects of ${design.symbol} = ${formatEffect(design, result.effect)}`} or larger.
                </p>
              </>
            )}

            {code && (
              <>
                <h4>Check it in R</h4>
                <p>The same calculation in R. It runs in the <Link to="/workspace">R Workspace</Link>; {design.id === 'proportions' || design.id === 'repeated' ? 'it needs only base R' : 'the first run downloads the pwr package'}.</p>
                <div className="model-chooser-code">
                  <pre tabIndex={0} aria-label="R code"><code>{code}</code></pre>
                  <button type="button" className="button-secondary" onClick={() => void copy(code)}>{copied === code ? 'Copied' : 'Copy code'}</button>
                </div>
                {answers.mode === 'n' && design.id !== 'regression' && design.id !== 'r2-change' && design.id !== 'repeated' && (
                  <p className="ss-note">R reports n unrounded{PER_GROUP[design.id] ? ' and per group' : ''}; round it up to whole people.</p>
                )}
              </>
            )}

            {stimuli && (
              <>
                <h4 id="ss-stimuli">Your stimuli</h4>
                <p>
                  The formula above averages each person's scores over the stimuli in a condition. That ignores that some stimuli are easier or
                  react more strongly to a condition than others. When stimuli really differ, a test on those averages finds effects too often,
                  and the true power is lower than the page says (Judd, Westfall &amp; Kenny, 2012).
                </p>
                <p>
                  With few stimuli, their number limits power more than the number of people: past some point, adding people barely helps,
                  while adding stimuli does (Westfall, Kenny &amp; Judd, 2014). With {answers.text.nstim} stimuli per condition, adding stimuli is
                  often the cheapest way to more power.
                </p>
                <p>
                  The honest plan is a simulation: make up data that look like your study many times, analyse each with the mixed model you will
                  use, and count how often the effect is significant. The script below does that. Its standard deviations are guesses: replace them
                  with estimates from a pilot or an earlier study, then change the number of people or stimuli until the power reaches {pct(power)}.
                  In the browser it takes a few minutes.
                </p>
                <div className="model-chooser-code">
                  <pre tabIndex={0} aria-label="R simulation code"><code>{simCode}</code></pre>
                  <button type="button" className="button-secondary" onClick={() => void copy(simCode)}>{copied === simCode ? 'Copied' : 'Copy code'}</button>
                </div>
                <p className="ss-note">
                  Without pilot data, the free PANGEA app by Jake Westfall (
                  <a href="https://jakewestfall.shinyapps.io/pangea/" target="_blank" rel="noreferrer">jakewestfall.shinyapps.io/pangea</a>)
                  plans this design from standardised guesses.
                </p>
              </>
            )}

            <h4>What this assumes</h4>
            <p>{design.assumes}</p>
          </div>
        )}
      </section>
    </div>
  );
}
