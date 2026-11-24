import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AvatarTip from '../components/AvatarTip';
import { pnorm } from '../stats/distributions';
import { t, useT } from '../i18n/t';
import { getLanguage } from '../state/language';
import { HAS_SIDES, minN, PER_GROUP, powerAt, rCode, solveEffect, solveN, stimulusSimCode, totalN, type DesignId, type Layout, type Plan, type Which } from '../stats/power';
import { DESIGNS, designById, effectInputs, presets, shortEffect, type Design, type EffectRoute } from './sampleSizeDesigns';
import './ModelChooser.css';
import './SampleSize.css';

type Mode = 'n' | 'effect';

const parse = (text: string) => (text.trim() === '' ? NaN : Number(text.replace(',', '.')));
/** Dutch writes the decimal comma; the numbers behind a display stay plain. */
const dec = (text: string) => (getLanguage() === 'nl' ? text.replace(/\./g, ',') : text);
const pct = (x: number, digits = 0) => dec(`${(100 * x).toFixed(digits)}%`);
/** APA style: no leading zero for values that cannot exceed 1. */
const noZero = (text: string) => dec(text.replace(/^(-?)0\./, '$1.'));

/** The effect size as typed back into the next step: always a plain decimal point. */
function rawEffect(design: Design, value: number): string {
  if (design.id === 'correlation') return value.toFixed(2).replace(/^(-?)0\./, '$1.');
  if (design.symbol === 'f²') return value.toFixed(3);
  return shortEffect(value);
}
const formatEffect = (design: Design, value: number) => dec(rawEffect(design, value));

/** What an effect of this size means, in words a student can check against their field. */
function meaning(design: Design, effect: number, p1: number, k = 3, rho = 0.5): string {
  switch (design.id) {
    case 'two-groups':
      return t('If scores are normal, about {pct} of the higher group scores above the other group\'s mean (it would be 50% with no difference).', { pct: pct(pnorm(effect)) });
    case 'paired':
      return t('If change scores are normal, about {pct} of people change in the expected direction.', { pct: pct(pnorm(effect)) });
    case 'one-sample':
      return t('If scores are normal, about {pct} of people score on the expected side of the fixed value.', { pct: pct(pnorm(effect)) });
    case 'repeated':
      // Partial η² as a repeated-measures analysis reports it: λ = n(k − 1)·ηp²/(1 − ηp²).
      return t('The conditions would explain {pct} of the variance left once the differences between people are taken out (partial η², as a repeated-measures analysis reports it).', { pct: pct((k * effect ** 2) / (k * effect ** 2 + (k - 1) * (1 - rho)), 1) });
    case 'factorial':
      return t('This effect explains {pct} of the variance the other effects leave (partial η²).', { pct: pct(effect ** 2 / (1 + effect ** 2), 1) });
    case 'anova':
      return t('The groups explain {pct} of the variance in the outcome (η²).', { pct: pct(effect ** 2 / (1 + effect ** 2), 1) });
    case 'correlation':
      return t('The two variables share {pct} of their variance (r²).', { pct: pct(effect ** 2, 1) });
    case 'regression':
      return t('The predictors explain {pct} of the variance in the outcome (R²).', { pct: pct(effect / (1 + effect), 1) });
    case 'r2-change':
      return t('The added predictors explain {pct} of the variance the other predictors leave unexplained (partial R²).', { pct: pct(effect / (1 + effect), 1) });
    case 'proportions':
      return t('A difference of {points} percentage points.', { points: dec((100 * Math.abs(effect - p1)).toFixed(1)) });
    case 'chi-square':
      return t('For a 2 × 2 table, w is the phi coefficient; for larger tables, w = Cramér\'s V × √(min(rows, columns) − 1).');
  }
}

function peopleText(design: Design, plan: Plan, n: number): string {
  const total = totalN(plan, n);
  if (design.id === 'paired') return t('{total} participants, each measured twice', { total });
  if (design.id === 'factorial') {
    if (plan.layout === 'within') return t('{total} participants, each in all four conditions', { total });
    if (plan.layout === 'mixed') return t('{total} participants ({n} per group, each measured in both conditions)', { total, n });
    return t('{total} participants ({n} in each of the four cells)', { total, n });
  }
  if (PER_GROUP[design.id]) return t('{total} participants ({n} per group)', { total, n });
  return t('{total} participants', { total });
}

const WHICH_TEXT: Record<Which, string> = {
  interaction: 'interaction',
  main: 'main effect',
  'main-within': 'main effect of the within-person factor',
  'main-between': 'main effect of the between-person factor',
};
const LAYOUT_TEXT: Record<Layout, string> = {
  between: 'a 2 × 2 between-subjects design (a traditional two-way ANOVA)',
  within: 'a 2 × 2 within-subjects design (a traditional repeated-measures ANOVA)',
  mixed: 'a 2 × 2 mixed design, one factor between and one within people (a traditional mixed ANOVA)',
};

function testText(design: Design, sides: 1 | 2, plan?: Plan): string {
  if (design.id === 'factorial' && plan) return t('the F test for the {which} in {layout}', { which: t(WHICH_TEXT[plan.which ?? 'interaction']), layout: t(LAYOUT_TEXT[plan.layout ?? 'between']) });
  if (!HAS_SIDES[design.id]) return t('the {test}', { test: t(design.test) });
  return t(sides === 2 ? 'a two-sided {test}' : 'a one-sided {test}', { test: t(design.test) });
}

function effectText(design: Design, plan: Plan, value: number): string {
  if (design.id === 'proportions') return t('a difference between {from} and {to}', { from: pct(plan.p1 ?? 0, 1), to: pct(value, 1) });
  const r = plan.rho ?? 0.5;
  const rText = noZero(r.toFixed(2));
  if (design.id === 'repeated') return t('an effect of f = {value} (with a correlation of r = {r} between conditions)', { value: formatEffect(design, value), r: rText });
  if (design.id === 'factorial' && plan.layout !== 'between') {
    // This page's f already contains the correlation (λ = N·f²). G*Power's repeated-measures f does not.
    const gpower = plan.layout === 'mixed' ? t('; in G*Power\'s repeated-measures procedures, with r = {r}, this is f = {value}', { r: rText, value: dec(shortEffect(value * Math.sqrt((plan.which === 'main-between' ? 1 + r : 1 - r) / 2))) }) : '';
    return t('an effect of f = {value} (an f that already includes the correlation of r = {r} between conditions{gpower})', { value: formatEffect(design, value), r: rText, gpower });
  }
  return t('an effect of {symbol} = {value}', { symbol: design.symbol, value: formatEffect(design, value) });
}

function tool(design: Design): string {
  if (design.id === 'repeated') return t('the formula G*Power uses for repeated measures (Faul et al., 2007), computed in R,');
  if (design.id === 'factorial') return t('the noncentral F distribution, as in G*Power (Faul et al., 2007), computed in R,');
  return design.id === 'proportions' ? t('the power.prop.test() function in R') : t('the pwr package in R (Champely, 2020)');
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
  const fmt = (x: number) => (Number.isInteger(x) || x > 20 ? String(Math.round(x)) : dec(x.toFixed(2)));
  return (
    <svg className="ss-curve" viewBox={`0 0 ${W} ${H}`} role="img"
      aria-label={t('Power rises with {x}. It reaches {pct} at {at}.', { x: xLabel.toLowerCase(), pct: pct(target), at: markLabel })}>
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

type StepId = 'design' | 'mode' | 'layout' | 'which' | 'n' | 'k' | 'rho' | 'stimuli' | 'nstim' | 'predictors' | 'added' | 'table' | 'p1' | 'route' | 'effect' | 'power' | 'alpha' | 'tests' | 'sides' | 'dropout';
type AlphaChoice = 'standard' | 'strict' | 'bonferroni';

type Answers = {
  design?: DesignId;
  mode?: Mode;
  route?: EffectRoute;
  rho?: number;
  /** Several stimuli (pictures, words, items) per condition. */
  stimuli?: boolean;
  layout?: Layout;
  which?: Which;
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
  if (a.design === 'factorial') steps.push('layout', 'which');
  if (a.mode === 'effect') steps.push('n');
  if (a.design === 'factorial' && a.layout !== 'between') steps.push('rho');
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

function unitLabel(design: Design, layout?: Layout): string {
  if (design.id === 'paired') return t('people, each measured twice');
  if (design.id === 'factorial') return layout === 'between' ? t('people in each of the four cells') : layout === 'mixed' ? t('people per group') : t('people in total');
  return PER_GROUP[design.id] ? t('people per group') : t('people in total');
}

/** The question each text-box step asks, its fields, and whether the answer can be used. */
function inputStep(step: StepId, a: Answers, design: Design): { fields: { key: string; label: string; hint?: string }[]; error?: string } | null {
  const tx = a.text;
  const whole = (key: string, lo: number, hi: number) => Number.isInteger(parse(tx[key])) && parse(tx[key]) >= lo && parse(tx[key]) <= hi;
  switch (step) {
    case 'n':
      return { fields: [{ key: 'n', label: t('Number of {unit}', { unit: unitLabel(design, a.layout) }) }], error: whole('n', 2, 1_000_000) ? undefined : t('Enter a whole number of people.') };
    case 'k':
      return { fields: [{ key: 'k', label: design.id === 'repeated' ? t('Number of conditions') : t('Number of groups') }], error: whole('k', 2, 50) ? undefined : t('Enter a whole number from 2 to 50.') };
    case 'predictors':
      return { fields: [{ key: 'predictors', label: t('Number of predictors') }], error: whole('predictors', 1, 100) ? undefined : t('Enter a whole number from 1 to 100.') };
    case 'added':
      return { fields: [{ key: 'added', label: t('Number of predictors you test') }], error: whole('added', 1, parse(tx.predictors)) ? undefined : t('Enter a whole number from 1 to {max}.', { max: tx.predictors }) };
    case 'table':
      return {
        fields: [{ key: 'rows', label: t('Rows (categories of one variable)') }, { key: 'cols', label: t('Columns (categories of the other)') }],
        error: whole('rows', 2, 50) && whole('cols', 2, 50) ? undefined : t('Enter whole numbers of at least 2.'),
      };
    case 'p1':
      return { fields: [{ key: 'p1', label: t('Percentage "yes" in the first group') }], error: parse(tx.p1) > 0 && parse(tx.p1) < 100 ? undefined : t('Enter a percentage between 0 and 100.') };
    case 'nstim':
      return { fields: [{ key: 'nstim', label: t('Stimuli per condition') }], error: whole('nstim', 1, 500) ? undefined : t('Enter a whole number from 1 to 500.') };
    case 'tests':
      return { fields: [{ key: 'tests', label: t('Number of tests') }], error: whole('tests', 2, 100) ? undefined : t('Enter a whole number from 2 to 100.') };
    default:
      return null;
  }
}

const INPUT_TEXT: Partial<Record<StepId, { question: string; help: string }>> = {
  n: { question: 'How many people will you have?', help: 'Count the people you expect to have complete data for, not everyone you invite.' },
  k: { question: 'How many groups will you compare?', help: 'For example 3 for three training programmes. The plan assumes groups of about equal size.' },
  predictors: { question: 'How many predictors will the model have?', help: 'Count every term in the model, control variables included. A numeric predictor counts once; a categorical predictor with g categories counts g − 1 times, because R turns it into g − 1 dummy variables (Lesson 12-2).' },
  added: { question: 'How many of those predictors are you testing?', help: 'Usually 1: the predictor your question is about, with the others as controls. With one tested predictor, this is the same test as that predictor\'s p-value in summary().' },
  table: { question: 'How big is your table of counts?', help: 'Rows are the categories of one variable, columns those of the other: department (4) by remote work (2) is a 4 × 2 table. For a traditional goodness-of-fit test of one variable, enter its number of categories as rows and 2 as columns; that gives the right degrees of freedom.' },
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
            <button type="button" className={earlier ? 'flagged' : undefined} aria-describedby={`${id}-${i}-more`} onClick={() => onPick(option.value)}>
              <span className="mc-option-label" id={`${id}-${i}-label`}>{typeof option.label === 'string' ? t(option.label) : option.label}</span>
              <span id={`${id}-${i}-more`} className="mc-option-more" aria-hidden="true">
                {earlier && <span className="mc-flag">{t('Your earlier choice')}</span>}
                {option.tag && <span className="ss-tag">{t(option.tag)}</span>}
                <span className="ss-option-note">{typeof option.note === 'string' ? t(option.note) : option.note}</span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export default function SampleSize() {
  useT();
  const [answers, setAnswers] = useState<Answers>(START);
  // The step lives in the URL, one history entry per question, so the browser's Back button goes back one question.
  // Answers are not in the URL, so a step is only shown once it has been reached in this visit.
  const [params, setParams] = useSearchParams();
  const [reached, setReached] = useState(0);
  const at = Math.min(Math.max(0, Math.floor(Number(params.get('step')) || 0)), reached);
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
    setParams(index > 0 ? { step: String(index) } : {});
  }
  function answer(patch: Partial<Answers>) {
    setAnswers((prev) => ({ ...prev, ...patch }));
    setReached(at + 1);
    go(at + 1);
  }
  function type(key: string, value: string) {
    setAnswers((prev) => ({ ...prev, text: { ...prev.text, [key]: value } }));
  }

  const plan = useMemo((): Plan | null => {
    const a = answers;
    if (!a.design || !a.mode || !a.power || !a.alpha) return null;
    if (a.mode === 'n' && a.effect === undefined) return null;
    const tx = a.text;
    return {
      design: a.design,
      effect: a.effect ?? 0,
      alpha: alphaOf(a),
      sides: HAS_SIDES[a.design] ? (a.sides ?? 2) : 2,
      k: parse(tx.k),
      predictors: parse(tx.predictors),
      added: parse(tx.added),
      df: (parse(tx.rows) - 1) * (parse(tx.cols) - 1),
      p1: parse(tx.p1) / 100,
      rho: a.rho,
      layout: a.layout,
      which: a.which,
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
    ? stimulusSimCode(result.n, parse(answers.text.k), parse(answers.text.nstim), result.kind === 'n' ? result.plan.effect : result.effect, result.plan.alpha)
    : '';

  /** Everyone needed for an effect at the usual settings, to show next to each plain-words option. */
  function previewPeople(effect: number): number | null {
    const tx = answers.text;
    const p: Plan = {
      design: design.id, effect, alpha: 0.05, sides: 2, k: parse(tx.k), predictors: parse(tx.predictors), added: parse(tx.added),
      df: (parse(tx.rows) - 1) * (parse(tx.cols) - 1), p1: parse(tx.p1) / 100, rho: answers.rho,
      layout: answers.layout, which: answers.which,
    };
    const n = solveN(p, 0.8);
    return n === null ? null : totalN(p, n);
  }

  /** The trail's label for an answered step. */
  function summary(s: StepId): string {
    const tx = answers.text;
    switch (s) {
      case 'design': return t(design.title);
      case 'mode': return answers.mode === 'n' ? t('Plan a new study') : t('Sample size is fixed');
      case 'layout': return t({ between: 'Each person in one cell', within: 'Each person in all four', mixed: 'One factor between, one within' }[answers.layout ?? 'between']);
      case 'which': return t(WHICH_TEXT[answers.which ?? 'interaction']).replace(/^./, (c) => c.toUpperCase());
      case 'n': return `${tx.n} ${unitLabel(design, answers.layout)}`;
      case 'k': return `${tx.k} ${design.id === 'repeated' ? t('conditions') : t('groups')}`;
      case 'rho': return t('r = {r} between conditions', { r: noZero((answers.rho ?? 0.5).toFixed(2)) });
      case 'stimuli': return answers.stimuli ? t('Several stimuli per condition') : t('One score per condition');
      case 'nstim': return t('{n} stimuli per condition', { n: tx.nstim });
      case 'predictors': return t('{n} predictors', { n: tx.predictors });
      case 'added': return t('{n} tested', { n: tx.added });
      case 'table': return t('{rows} × {cols} table', { rows: tx.rows, cols: tx.cols });
      case 'p1': return t('{p}% yes in group 1', { p: tx.p1 });
      case 'route': return t({ matter: 'My own guess of the scores', research: 'From a paper', unknown: 'In plain words' }[answers.route ?? 'unknown']);
      case 'effect': return design.id === 'proportions' ? t('{p} yes in group 2', { p: pct(answers.effect ?? 0, 1) }) : `${design.symbol} = ${formatEffect(design, answers.effect ?? 0)}`;
      case 'power': return t('{p} power', { p: pct(power) });
      case 'alpha': return `α = ${alphaLabel(alphaOf(answers))}`;
      case 'tests': return t('{n} tests', { n: tx.tests });
      case 'sides': return answers.sides === 1 ? t('One-sided') : t('Two-sided');
      case 'dropout': return t('{n}% dropout', { n: answers.dropout ?? 0 });
    }
  }

  const alphaText = alphaLabel(alphaOf(answers));
  let question: ReactNode = null;
  let help: ReactNode = null;
  let body: ReactNode = null;

  const input = step === 'result' ? null : inputStep(step, answers, design);
  if (input) {
    const text = step === 'k' && design.id === 'repeated'
      ? { question: 'How many conditions will each person do?', help: 'Count the conditions every participant goes through, for example 4. With 2 conditions and one score each, this is the traditional paired t-test.' }
      : INPUT_TEXT[step as StepId]!;
    question = t(text.question);
    help = t(text.help);
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
        {step === 'table' && !input.error && <p className="ss-meaning">{t('Degrees of freedom: ({rows} − 1) × ({cols} − 1) = {df}.', { rows: answers.text.rows, cols: answers.text.cols, df: (parse(answers.text.rows) - 1) * (parse(answers.text.cols) - 1) })}</p>}
        {step === 'tests' && !input.error && <p className="ss-meaning">{t('Each test then uses α = {a} / {n} = {result}.', { a: noZero('0.05'), n: answers.text.tests, result: alphaLabel(0.05 / parse(answers.text.tests)) })}</p>}
        {input.error && <p className="ss-error">{input.error}</p>}
        <button type="submit" className="button-primary" disabled={!!input.error}>{t('Next')}</button>
      </form>
    );
  } else if (step === 'design') {
    question = t('What will you test?');
    help = <>{t('Pick the comparison your research question makes; each option shows the model from the course. Not sure?')} <Link to="/which-model">{t('Which model should I use?')}</Link> {t('helps you choose. An A/B test is two separate groups: a score, or a yes/no outcome such as clicks. A before-and-after study with a control group is a 2 × 2 design. Logistic regression with several predictors, mediation and models with more random factors are not here: plan those by simulation, as')} <Link to="/lesson/08-3">{t('Lesson 8-3')}</Link> {t('does.')}</>;
    body = (
      <Choice
        options={DESIGNS.map((d) => ({ value: d.id, label: d.title, note: <>{t('e.g.')} {t(d.example)}<br />{t('In R:')} <code>{d.model}</code></> }))}
        chosen={answers.design}
        onPick={(value) => answer(value === answers.design ? {} : { design: value, route: undefined, effect: undefined, text: { ...answers.text, ...Object.fromEntries(['diff', 'sd', 'r', 'es', 'spread', 'eta2', 'r2', 'dr2', 'v', 'p2', 'eff1', 'eff2'].map((k) => [k, ''])), rpre: '.5' } })}
      />
    );
  } else if (step === 'mode') {
    question = t('What do you want to find out?');
    help = t('Most people use a power analysis to plan a new study. If your data already exist, or the number of people is fixed (one class, one company), turn the question around.');
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
    question = t('How big is the effect you want to be able to find?');
    help = t('The effect size is how big the difference or relationship is. It is the choice that matters most: an effect half as big needs about four times as many people. You do not need to know it exactly. Pick the way that fits what you know.');
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
    question = t('Which size of effect do you want to be able to find?');
    help = (
      <>
        {t('Choose the smallest effect you would not want to miss. Smaller effects need more people. The number of people under each option uses the usual settings (80% power, α = .05); you can change those in the next questions.')}
        {design.id === 'paired' && ` ${t('For two measurements of the same people, these sizes are rougher: Cohen wrote them for d, not dz.')}`}
      </>
    );
    body = (
      <Choice
        options={presets(design, answers.layout && answers.which ? { layout: answers.layout, which: answers.which, rho: answers.rho } : undefined).map((p) => {
          const people = previewPeople(p.value);
          return { value: p.value, label: p.label, note: <>{t(p.note)} <strong>{people === null ? t('Needs more than a million people.') : t('Needs about {people} people.', { people })}</strong></>, tag: p.recommended ? 'Recommended' : undefined };
        })}
        chosen={answers.effect}
        onPick={(value) => answer({ effect: value })}
      />
    );
  } else if (step === 'effect') {
    const route = design.id === 'proportions' ? 'matter' : (answers.route as 'matter' | 'research');
    const { fields, compute } = effectInputs(design.id, route, answers.layout && answers.which ? { layout: answers.layout, which: answers.which } : undefined);
    const values = Object.fromEntries(Object.entries(answers.text).map(([k, v]) => [k, parse(v)]));
    const missing = fields.some((f) => !f.optional && (answers.text[f.key] ?? '').trim() === '');
    const effect = missing ? NaN : compute(values, answers.text);
    const p1 = parse(answers.text.p1) / 100;
    let error: string | undefined;
    if (missing) error = undefined;
    else if (design.id === 'proportions') error = effect > 0 && effect < 1 && effect !== p1 ? undefined : t('Enter a percentage between 0 and 100 that differs from the first group\'s.');
    else if (!(Number.isFinite(effect) && effect > 0)) error = t('These numbers do not give a usable effect size. Check that standard deviations are above 0 and correlations and R² values are between 0 and 1.');
    else if (design.id === 'correlation' && effect >= 1) error = t('A correlation has to be below 1.');
    question = t(design.id === 'proportions' ? 'What percentage do you expect in the second group?' : route === 'matter' ? 'What difference would be worth finding?' : 'What did earlier research find?');
    help = t(
      design.id === 'proportions'
        ? 'Take the smallest difference from the first group that would matter to you, or what earlier studies found.'
        : route === 'matter'
          ? 'Rough guesses are fine. The page turns them into the effect size and says what it means, and you can always come back and try other values.'
          : 'If it comes from a single study, a common precaution is to plan for a smaller value than it reports.',
    );
    body = (
      <form className="ss-input-step" onSubmit={(e) => { e.preventDefault(); if (!missing && !error) answer({ effect: Number(design.id === 'proportions' ? effect.toFixed(4) : rawEffect(design, effect).replace(/^\./, '0.')) }); }}>
        <div className="ss-fields ss-fields-wide">
          {fields.map((field) => (
            <label key={field.key} className="ss-field">
              <span>{t(field.label)}</span>
              <input inputMode="decimal" placeholder={t(field.placeholder)} value={answers.text[field.key] ?? ''} onChange={(e) => type(field.key, e.target.value)} />
              <small>{t(field.hint)}</small>
            </label>
          ))}
        </div>
        {!missing && !error && (
          <p className="ss-meaning">
            {design.id === 'proportions' ? t('That is a difference of {points} percentage points.', { points: dec((100 * Math.abs(effect - p1)).toFixed(1)) }) : <>{t('That is')} {design.symbol} = <strong>{formatEffect(design, effect)}</strong>. {meaning(design, effect, 0, parse(answers.text.k), answers.rho)}</>}
          </p>
        )}
        {error && <p className="ss-error">{error}</p>}
        <button type="submit" className="button-primary" disabled={missing || !!error}>{t('Next')}</button>
      </form>
    );
  } else if (step === 'layout') {
    question = t('How do people take part in the four combinations?');
    help = t('A 2 × 2 design crosses two factors with two levels each, which gives four combinations (cells). A factor is between people when each person gets one level, and within people when each person gets both.');
    body = (
      <Choice<Layout>
        options={[
          { value: 'mixed', label: 'One factor between people, one within', note: 'For example training versus waiting list (between), each measured before and after (within). The usual design for a study with a control group.', tag: 'Most common' },
          { value: 'within', label: 'Each person does all four combinations', note: 'For example every participant sees photo and text ads, each in two colours. Needs the fewest people.' },
          { value: 'between', label: 'Each person is in one combination only', note: 'For example four versions of a questionnaire, each person answers one. Needs the most people.' },
        ]}
        chosen={answers.layout}
        onPick={(value) => answer({ layout: value, which: undefined, effect: undefined })}
      />
    );
  } else if (step === 'which') {
    question = t('Which effect is your question about?');
    help = t('Plan for the effect your hypothesis is about. An interaction asks whether the effect of one factor depends on the other; it needs far more people than a main effect of a within-person factor of the same size, often four times as many.');
    const main: Option<Which>[] = answers.layout === 'mixed'
      ? [
          { value: 'main-within', label: 'The effect of the within-person factor', note: 'Averaged over both groups. For example: do scores change from before to after, whichever group people are in?' },
          { value: 'main-between', label: 'The difference between the groups', note: 'Averaged over both conditions. Usually the least interesting question in a before-and-after study.' },
        ]
      : [{ value: 'main', label: 'The effect of one factor, averaged over the other', note: 'A main effect. For example: do photo ads work better than text ads, whatever their colour?' }];
    body = (
      <Choice<Which>
        options={[
          { value: 'interaction', label: 'Whether one factor\'s effect depends on the other', note: answers.layout === 'mixed' ? 'The interaction. For example: does the training group improve more than the waiting-list group? In a before-and-after study with a control group, this is the test that answers your question.' : 'The interaction. For example: do photo ads work better than text ads for young viewers, but not for old ones?', tag: 'Most common' },
          ...main,
        ]}
        chosen={answers.which}
        onPick={(value) => answer({ which: value, effect: undefined })}
      />
    );
  } else if (step === 'rho') {
    question = t('How strongly do a person\'s scores in different conditions go together?');
    const between = answers.which === 'main-between';
    help = t(
      between
        ? 'People who score high in one condition usually score high in the others too. For the difference between the groups this works the other way round: each person\'s scores are averaged over the conditions, and the stronger they go together, the less that averaging helps. So here a stronger correlation means you need more people. Take it from a pilot or an earlier study with the same measure if you can.'
        : 'People who score high in one condition usually score high in the others too. The stronger that correlation, the fewer people you need, because every person is compared with themselves. Take it from a pilot or an earlier study with the same measure if you can. If people do each condition several times (repeated trials), plan on their average per condition: averages over many trials are more reliable, so they usually correlate more strongly.',
    );
    body = (
      <Choice
        options={[
          { value: 0.3, label: 'r = .30', note: between ? 'Weak: noisy measures, or conditions far apart in time. Only with evidence, because for this effect it lowers the sample.' : 'Weak: noisy measures, or conditions far apart in time or very different from each other.' },
          { value: 0.5, label: 'r = .50', note: between ? 'G*Power\'s default and a reasonable middle. For the most cautious plan for this effect, choose .70.' : 'The cautious choice when you do not know, and G*Power\'s default.', tag: 'Recommended if you do not know' },
          { value: 0.7, label: 'r = .70', note: between ? 'Strong: a reliable measure, or scores averaged over many trials. For this effect it raises the sample, so it is the cautious choice.' : 'Strong: a reliable measure, or scores averaged over many trials. Only with evidence, because it lowers the sample a lot.' },
        ]}
        chosen={answers.rho}
        onPick={(value) => answer({ rho: value, text: { ...answers.text, rho: String(value) } })}
      />
    );
  } else if (step === 'stimuli') {
    question = t('Does each condition use several stimuli?');
    help = t('Stimuli are the things people respond to: pictures, words, sentences, video clips or vignettes. If you want your conclusion to hold for stimuli like yours, and not only for these few, the stimuli are a sample too, just like the people.');
    body = (
      <Choice
        options={[
          { value: false, label: 'No, one score per condition', note: 'For example one questionnaire score per condition, or the same trial repeated several times and averaged, or the stimuli are exactly what you want to draw conclusions about.' },
          { value: true, label: 'Yes, several stimuli per condition', note: 'For example 4 pictures in each of 4 conditions. The page gives the minimum number of people and a simulation for the rest.' },
        ]}
        chosen={answers.stimuli}
        onPick={(value) => answer({ stimuli: value })}
      />
    );
  } else if (step === 'power') {
    question = t('How much power do you want?');
    help = t('Power is the chance that your study finds the effect (p below α) if the effect is really as large as you said. The rest is the chance of wrongly concluding there is nothing. Below 80% a study is generally considered underpowered.');
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
    question = t('Which significance level (α)?');
    help = t('α is the chance of a false positive: finding an effect that is not there. You will call a result significant when p is below α.');
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
    question = t('A two-sided or a one-sided test?');
    help = t('A two-sided test counts an effect in either direction. A one-sided test looks in one direction only, and ignores an effect the other way, however large.');
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
    question = t('How many people will you lose?');
    help = t('Some people drop out, skip questions or fail attention checks. Recruit extra so enough complete cases remain. These are rough guides; figures from similar studies are better.');
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
        <h1>{t('How many participants do I need?')}</h1>
        <p>
          {t('A power analysis, done before you collect data, tells you how many people you need for a good chance of finding an effect that matters. Answer a few short questions; each one explains what to choose if you have never done this before.')}
        </p>
      </header>

      <AvatarTip tone="coach" title={t('Before you start')}>
        <p>
          {t('Plan the sample before you collect it. Afterwards, a power analysis based on the effect you found tells you nothing the p-value and the confidence interval do not already say')} (<Link to="/lesson/08-3">{t('Lesson 8-3')}</Link>).
        </p>
      </AvatarTip>

      <section className="mc-panel mc-tree" aria-labelledby={`${ids}-title`}>
        <p className="mc-kicker">{t('Step by step')}</p>
        <h2 id={`${ids}-title`}>{t('Answer a few short questions')}</h2>

        {at > 0 && (
          <nav className="model-chooser-trail" aria-label={t('Your answers so far')}>
            <ol>
              {steps.slice(0, at).map((s, i) => (
                <li key={s}>
                  <button type="button" onClick={() => go(i)}>
                    <span className="visually-hidden">{t('Change your answer:')} </span>
                    {summary(s)}
                  </button>
                </li>
              ))}
            </ol>
            <div className="model-chooser-trail-actions">
              <button type="button" onClick={() => go(at - 1)}>{t('Back')}</button>
              <button type="button" onClick={() => { go(0); setReached(0); setAnswers(START); }}>{t('Start over')}</button>
            </div>
          </nav>
        )}

        {step !== 'result' ? (
          <div className="mc-step" key={step}>
            <p className="model-chooser-step">{t('Question {n}', { n: at + 1 })}</p>
            <h3 ref={headingRef} tabIndex={-1} className="model-chooser-current">{question}</h3>
            <p className="model-chooser-help">{help}</p>
            {body}
          </div>
        ) : (
          <div className="model-chooser-answer ss-result" key="result">
            <p className="mc-kicker">{t('Your plan')}</p>
            <h3 ref={headingRef} tabIndex={-1} className="model-chooser-current">{answers.mode === 'n' ? t('The sample you need') : t('What your sample can detect')}</h3>
            {result?.kind === 'too-small' && (
              <p role="alert" className="ss-error">{t('An effect this small would need more than a million people. Check the effect size, or ask whether an effect this small matters.')}</p>
            )}
            {result?.kind === 'bad-n' && <p role="alert" className="ss-error">{t('This design needs at least {min} people. Change the number of people above.', { min: result.min })}</p>}
            {result?.kind === 'none' && <p role="alert" className="ss-error">{t('No effect size reaches that power with this many people. Lower the power or add people.')}</p>}

            {result?.kind === 'n' && (
              <>
                <div className="ss-headline">
                  <p><span className="ss-big">{totalN(result.plan, result.recruitUnit)}</span> {t('to recruit')}</p>
                  <p><span className="ss-big">{totalN(result.plan, result.n)}</span> {t('complete cases needed')}</p>
                </div>
                <p>
                  {t('You need {people} with complete data. With that many, the power is {power}.', { people: peopleText(design, result.plan, result.n), power: pct(result.achieved, 1) })}
                  {result.drop > 0 && ` ${t('To allow for {drop} dropout, recruit {people}.', { drop: pct(result.drop), people: peopleText(design, result.plan, result.recruitUnit) })}`}
                </p>
                {stimuli && (
                  <p className="ss-note ss-warning">
                    {t('With several stimuli per condition, this is the')} <strong>{t('minimum')}</strong>{t(': it treats your {n} stimuli as the only ones that matter. See', { n: answers.text.nstim })} <a href="#ss-stimuli">{t('Your stimuli')}</a> {t('below.')}
                  </p>
                )}
                <h4>{t('If the true effect is smaller')}</h4>
                <table className="ss-table">
                  <thead><tr><th scope="col">{t('True effect')}</th><th scope="col">{t('Complete cases needed')}</th></tr></thead>
                  <tbody>
                    <tr><td>{design.id === 'proportions' ? t('{value} (as planned)', { value: pct(result.plan.effect, 1) }) : t('{value} (as planned)', { value: `${design.symbol} = ${formatEffect(design, result.plan.effect)}` })}</td><td>{totalN(result.plan, result.n)}</td></tr>
                    {result.smaller.map((s) => (
                      <tr key={s.f}>
                        <td>{design.id === 'proportions' ? t('{value} ({share} of the difference)', { value: pct(s.e, 1), share: pct(s.f) }) : t('{value} ({share} of it)', { value: `${design.symbol} = ${formatEffect(design, s.e)}`, share: pct(s.f) })}</td>
                        <td>{s.total === null ? t('more than a million') : s.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="ss-note">{t('A somewhat smaller true effect needs a much larger sample. That is why the effect size is the choice to get right.')}</p>
                <PowerCurve points={result.points} xLabel={t('Total number of people')} target={power}
                  mark={[totalN(result.plan, result.n), result.achieved]} markLabel={t('{n} people', { n: totalN(result.plan, result.n) })} />
                <h4>{t('How to report it')}</h4>
                <p className="ss-report">
                  {t('An a priori power analysis with {tool} showed that {people} are needed to detect {effect} with {power} power in {test} at α = {alpha}.', { tool: tool(design), people: peopleText(design, result.plan, result.n), effect: effectText(design, result.plan, result.plan.effect), power: pct(power), test: testText(design, result.plan.sides, result.plan), alpha: alphaText })}{' '}
                  <em>{answers.route === 'unknown' ? t('[Say that this is a conventional value, and why no better estimate was available.]') : t('[Say where the effect size comes from.]')}</em>
                  {result.drop > 0 && ` ${t('To allow for {drop} dropout, we will recruit {n} participants.', { drop: pct(result.drop), n: totalN(result.plan, result.recruitUnit) })}`}
                </p>
              </>
            )}

            {result?.kind === 'effect' && (
              <>
                <div className="ss-headline">
                  <p><span className="ss-big">{design.id === 'proportions' ? pct(result.effect, 1) : formatEffect(design, result.effect)}</span> {design.id === 'proportions' ? t('in the second group') : t('smallest {symbol} with {power} power', { symbol: design.symbol, power: pct(power) })}</p>
                </div>
                <p>
                  {t('With {people}, {test} at α = {alpha} has {power} power for {effect}.', { people: peopleText(design, result.plan, result.n), test: testText(design, result.plan.sides, result.plan), alpha: alphaText, power: pct(power), effect: design.id === 'proportions' ? t('a difference between {from} and {to} or larger', { from: pct(result.plan.p1 ?? 0, 1), to: pct(result.effect, 1) }) : t('effects of {value} or larger', { value: `${design.symbol} = ${formatEffect(design, result.effect)}` }) })}{' '}
                  {t('Smaller effects may well go unnoticed, so a non-significant result says little about them.')}
                </p>
                {stimuli && (
                  <p className="ss-note ss-warning">
                    {t('With several stimuli per condition, this effect is')} <strong>{t('optimistic')}</strong>{t(': it treats your {n} stimuli as the only ones that matter. See', { n: answers.text.nstim })} <a href="#ss-stimuli">{t('Your stimuli')}</a> {t('below.')}
                  </p>
                )}
                {design.id !== 'proportions' && <p className="ss-meaning">{meaning(design, result.effect, 0, result.plan.k, result.plan.rho)}</p>}
                <PowerCurve points={result.points} xLabel={design.id === 'proportions' ? t('Proportion in the second group') : t('Effect size ({symbol})', { symbol: design.symbol })}
                  target={power} mark={[result.effect, power]} markLabel={`${design.symbol} = ${formatEffect(design, result.effect)}`} />
                <h4>{t('How to report it')}</h4>
                <p className="ss-report">
                  {t('A sensitivity power analysis with {tool} showed that with {people}, {test} at α = {alpha} has {power} power to detect {effect} or larger.', { tool: tool(design), people: peopleText(design, result.plan, result.n), test: testText(design, result.plan.sides, result.plan), alpha: alphaText, power: pct(power), effect: design.id === 'proportions' ? t('a difference between {from} and {to}', { from: pct(result.plan.p1 ?? 0, 1), to: pct(result.effect, 1) }) : t('effects of {value}', { value: `${design.symbol} = ${formatEffect(design, result.effect)}` }) })}
                </p>
              </>
            )}

            {code && (
              <>
                <h4>{t('Check it in R')}</h4>
                <p>{t('The same calculation in R. It runs in the')} <Link to="/workspace">R Workspace</Link>; {design.id === 'proportions' || design.id === 'repeated' || design.id === 'factorial' ? t('it needs only base R') : t('the first run downloads the pwr package')}.</p>
                <div className="model-chooser-code">
                  <pre tabIndex={0} aria-label={t('R code')}><code>{code}</code></pre>
                  <button type="button" className="button-secondary" onClick={() => void copy(code)}>{copied === code ? t('Copied') : t('Copy code')}</button>
                </div>
                {answers.mode === 'n' && design.id !== 'regression' && design.id !== 'r2-change' && design.id !== 'repeated' && design.id !== 'factorial' && (
                  <p className="ss-note">{t(PER_GROUP[design.id] ? 'R reports n unrounded and per group; round it up to whole people.' : 'R reports n unrounded; round it up to whole people.')}</p>
                )}
              </>
            )}

            {stimuli && (
              <>
                <h4 id="ss-stimuli">{t('Your stimuli')}</h4>
                <p>
                  {t('The formula above averages each person\'s scores over the stimuli in a condition. That ignores that stimuli differ. When they differ in how the conditions affect them (or, with different stimuli in each condition, in their average score), a test on those averages finds effects too often, and the true power is lower than the page says (Judd, Westfall & Kenny, 2012).')}
                </p>
                <p>
                  {t('With few stimuli, their number limits power more than the number of people: past some point, adding people barely helps, while adding stimuli does (Westfall, Kenny & Judd, 2014). With {n} stimuli per condition, adding stimuli is often the cheapest way to more power.', { n: answers.text.nstim })}
                </p>
                <p>
                  {t('The honest plan is a simulation: make up data that look like your study many times, analyse each with the mixed model you will use, and count how often the effect is significant. The script below does that. Its standard deviations are guesses: replace them with estimates from a pilot or an earlier study, then change the number of people or stimuli until the power reaches {power}. In the browser it takes a few minutes.', { power: pct(power) })}
                </p>
                <div className="model-chooser-code">
                  <pre tabIndex={0} aria-label={t('R simulation code')}><code>{simCode}</code></pre>
                  <button type="button" className="button-secondary" onClick={() => void copy(simCode)}>{copied === simCode ? t('Copied') : t('Copy code')}</button>
                </div>
                <p className="ss-note">
                  {t('Without pilot data, the free PANGEA app by Jake Westfall')} (
                  <a href="https://jakewestfall.shinyapps.io/pangea/" target="_blank" rel="noreferrer">jakewestfall.shinyapps.io/pangea</a>)
                  {t('plans this design from standardised guesses.')}
                </p>
              </>
            )}

            <h4>{t('The model you will fit')}</h4>
            <p><code>{design.model}</code></p>
            <p>{t(design.modelNote)}</p>

            <h4>{t('What this assumes')}</h4>
            <p>{t(design.assumes)}</p>
          </div>
        )}
      </section>
    </div>
  );
}
