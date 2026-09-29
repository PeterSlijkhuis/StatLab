import { useEffect, useId, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AvatarTip from '../components/AvatarTip';
import { pnorm } from '../stats/distributions';
import {
  dFromMeans, dzFromD, f2FromR2, fFromEta2, fFromMeans, HAS_SIDES, minN, PER_GROUP, powerAt, rCode,
  solveEffect, solveN, totalN, wFromV, type DesignId, type Plan,
} from '../stats/power';
import { DESIGNS, designById, type Design } from './sampleSizeDesigns';
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
  return `an effect of ${design.symbol} = ${formatEffect(design, value)}`;
}

function tool(design: Design): string {
  return design.id === 'proportions' ? 'the power.prop.test() function in R' : 'the pwr package in R (Champely, 2020)';
}

/** A small calculator that turns what a student knows into the effect size. */
function EffectHelper({ design, onUse }: { design: Design; onUse: (value: number) => void }) {
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [c, setC] = useState('');
  const id = useId();
  useEffect(() => { setA(''); setB(''); setC(''); }, [design.id]);

  let fields: { label: string; value: string; set: (v: string) => void; hint?: string }[] = [];
  let result = NaN;
  switch (design.id) {
    case 'two-groups':
    case 'one-sample':
      fields = [
        { label: design.id === 'two-groups' ? 'Difference between the means that matters' : 'Expected mean minus the fixed value', value: a, set: setA, hint: 'in the outcome\'s own units, e.g. 3 points' },
        { label: 'Standard deviation within the groups', value: b, set: setB, hint: 'from earlier studies or the scale\'s norms' },
      ];
      result = Math.abs(dFromMeans(parse(a), parse(b)));
      break;
    case 'paired':
      fields = [
        { label: 'Cohen\'s d between the two measurements', value: a, set: setA, hint: 'mean change divided by the SD at one time point, assuming the SD is about the same at both' },
        { label: 'Correlation between the two measurements', value: b, set: setB, hint: 'test-retest correlations are often .5 to .8' },
      ];
      result = Math.abs(dzFromD(parse(a), parse(b)));
      break;
    case 'anova':
      fields = [
        { label: 'Expected group means, separated by spaces', value: a, set: setA, hint: 'e.g. 44 46 48 50' },
        { label: 'Standard deviation within the groups', value: b, set: setB },
        { label: 'Or: eta squared (η²) from earlier studies', value: c, set: setC, hint: 'leave the fields above empty to use this' },
      ];
      {
        const means = a.trim().split(/[\s;]+/).map(parse).filter((x) => !Number.isNaN(x));
        result = a.trim() !== '' && means.length >= 2 ? fFromMeans(means, parse(b)) : fFromEta2(parse(c));
      }
      break;
    case 'regression':
      fields = [{ label: 'Expected R² of the whole model', value: a, set: setA, hint: 'e.g. .13' }];
      result = f2FromR2(parse(a));
      break;
    case 'r2-change':
      fields = [
        { label: 'Expected R² change from the added predictors', value: a, set: setA, hint: 'e.g. .05' },
        { label: 'Expected R² of the full model', value: b, set: setB, hint: 'with all predictors, e.g. .30' },
      ];
      result = f2FromR2(parse(a), parse(b));
      break;
    case 'chi-square':
      fields = [
        { label: 'Cramér\'s V from earlier studies', value: a, set: setA },
        { label: 'Rows in the table', value: b, set: setB },
        { label: 'Columns in the table', value: c, set: setC },
      ];
      result = wFromV(parse(a), parse(b), parse(c));
      break;
    default:
      return null;
  }
  const ok = Number.isFinite(result) && result > 0;
  return (
    <details className="ss-helper">
      <summary>Work out {design.symbol} from what you know</summary>
      <div className="ss-helper-fields">
        {fields.map((field, i) => (
          <label key={field.label} htmlFor={`${id}-${i}`}>
            <span>{field.label}</span>
            <input id={`${id}-${i}`} inputMode="decimal" value={field.value} onChange={(e) => field.set(e.target.value)} />
            {field.hint && <small>{field.hint}</small>}
          </label>
        ))}
      </div>
      <p className="ss-helper-result">
        {ok ? <>That is {design.symbol} = <strong>{formatEffect(design, result)}</strong>. </> : 'Fill in the fields to see the effect size. '}
        <button type="button" className="button-secondary" disabled={!ok} onClick={() => onUse(Number(formatEffect(design, result).replace(/^\./, '0.')))}>
          Use this value
        </button>
      </p>
    </details>
  );
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

export default function SampleSize() {
  const [designId, setDesignId] = useState<DesignId>('two-groups');
  const design = designById(designId);
  const [mode, setMode] = useState<Mode>('n');
  const [effect, setEffect] = useState(String(design.defaultEffect));
  const [p1, setP1] = useState('30');
  const [p2, setP2] = useState('45');
  const [k, setK] = useState('3');
  const [predictors, setPredictors] = useState('3');
  const [added, setAdded] = useState('1');
  const [df, setDf] = useState('1');
  const [alpha, setAlpha] = useState('0.05');
  const [target, setTarget] = useState('0.8');
  const [sides, setSides] = useState<1 | 2>(2);
  const [dropout, setDropout] = useState('10');
  const [nFixed, setNFixed] = useState('50');
  const [copied, setCopied] = useState(false);
  const ids = useId();

  function pick(id: DesignId) {
    setDesignId(id);
    setEffect(String(designById(id).defaultEffect));
    setCopied(false);
  }

  const power = Number(target);
  const built = useMemo((): { plan: Plan } | { error: string } => {
    const a = parse(alpha);
    if (!(a > 0 && a < 0.5)) return { error: 'α has to be between 0 and .5, usually .05.' };
    const plan: Plan = { design: designId, effect: parse(effect), alpha: a, sides: HAS_SIDES[designId] ? sides : 2 };
    if (designId === 'proportions') {
      plan.p1 = parse(p1) / 100;
      plan.effect = parse(p2) / 100;
      if (!(plan.p1 > 0 && plan.p1 < 1)) return { error: 'The first group\'s percentage has to be between 0 and 100.' };
      if (mode === 'n' && !(plan.effect > 0 && plan.effect < 1)) return { error: 'The second group\'s percentage has to be between 0 and 100.' };
      if (mode === 'n' && plan.effect === plan.p1) return { error: 'The two percentages are the same, so there is no difference to detect.' };
    }
    if (designId === 'anova') {
      plan.k = parse(k);
      if (!(Number.isInteger(plan.k) && plan.k >= 2 && plan.k <= 50)) return { error: 'The number of groups has to be a whole number from 2 to 50.' };
    }
    if (designId === 'regression' || designId === 'r2-change') {
      plan.predictors = parse(predictors);
      if (!(Number.isInteger(plan.predictors) && plan.predictors >= 1 && plan.predictors <= 100)) return { error: 'The number of predictors has to be a whole number from 1 to 100.' };
    }
    if (designId === 'r2-change') {
      plan.added = parse(added);
      if (!(Number.isInteger(plan.added) && plan.added >= 1 && plan.added <= (plan.predictors ?? 1))) return { error: 'The added predictors have to be a whole number from 1 up to the predictors in the full model.' };
    }
    if (designId === 'chi-square') {
      plan.df = parse(df);
      if (!(Number.isInteger(plan.df) && plan.df >= 1 && plan.df <= 100)) return { error: 'The degrees of freedom have to be a whole number of at least 1.' };
    }
    if (mode === 'n' && designId !== 'proportions') {
      const max = designId === 'correlation' ? 1 : Infinity;
      if (!(plan.effect > 0 && plan.effect < max)) return { error: `${design.effectName} has to be above 0${designId === 'correlation' ? ' and below 1' : ''}. Use the size of the effect, without a minus sign.` };
    }
    return { plan };
  }, [designId, design, mode, effect, p1, p2, k, predictors, added, df, alpha, sides]);

  const nNumber = parse(nFixed);
  const result = useMemo(() => {
    if ('error' in built) return null;
    const plan = built.plan;
    if (mode === 'n') {
      const n = solveN(plan, power);
      if (n === null) return { kind: 'too-small' as const };
      const drop = Math.min(Math.max(parse(dropout) || 0, 0), 90) / 100;
      const recruitUnit = Math.ceil(n / (1 - drop));
      const hi = Math.max(n * 2, minN(plan) + 10);
      const step = Math.max(1, Math.round((hi - minN(plan)) / 48));
      const points: [number, number][] = [];
      for (let x = minN(plan); x <= hi; x += step) points.push([totalN(plan, x), powerAt(plan, x)]);
      const smaller = [0.75, 0.5].map((f) => {
        const e = plan.design === 'proportions' ? (plan.p1 ?? 0) + (plan.effect - (plan.p1 ?? 0)) * f : plan.effect * f;
        const m = solveN({ ...plan, effect: e }, power);
        return { f, e, total: m === null ? null : totalN(plan, m) };
      });
      return { kind: 'n' as const, plan, n, achieved: powerAt(plan, n), drop, recruit: totalN(plan, recruitUnit), recruitUnit, points, smaller };
    }
    const n = nNumber;
    if (!(Number.isInteger(n) && n >= minN(plan))) return { kind: 'bad-n' as const, min: minN(plan) };
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
  }, [built, mode, power, dropout, nNumber]);

  const code = result && (result.kind === 'n' || result.kind === 'effect')
    ? rCode(result.plan, mode, power, result.kind === 'effect' ? result.n : undefined)
    : '';
  useEffect(() => setCopied(false), [code]);
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      // No clipboard permission: the code is on screen to copy by hand.
    }
  }

  const unitLabel = design.id === 'paired' ? 'People (each measured twice)' : PER_GROUP[design.id] ? 'People per group' : 'People in total';
  const alphaText = noZero(String(parse(alpha)));

  return (
    <div className="model-chooser sample-size">
      <header className="mc-intro">
        <h1>How many participants do I need?</h1>
        <p>
          A power analysis, done before you collect data, tells you how many people you need for a good chance of
          finding an effect that matters. G*Power and R do the arithmetic; the hard part is the choices that go into
          it, and this page walks you through each one.
        </p>
      </header>

      <AvatarTip tone="coach" title="Before you start">
        <p>
          Plan the sample before you collect it. Afterwards, a power analysis based on the effect you found tells you
          nothing the p-value and the confidence interval don't already say (<Link to="/lesson/08-3">Lesson 8-3</Link>).
          If your data already exist, choose "What can my sample detect?" below instead.
        </p>
      </AvatarTip>

      <section className="mc-panel" aria-labelledby={`${ids}-design`}>
        <p className="mc-kicker">Step 1</p>
        <h2 id={`${ids}-design`}>What will you test?</h2>
        <div className="ss-designs" role="radiogroup" aria-labelledby={`${ids}-design`}>
          {DESIGNS.map((d) => (
            <label key={d.id} className={`ss-design${d.id === designId ? ' selected' : ''}`}>
              <input type="radio" name={`${ids}-design`} checked={d.id === designId} onChange={() => pick(d.id)} />
              <span className="ss-design-title">{d.title}</span>
              <span className="ss-design-example">{d.example}</span>
            </label>
          ))}
        </div>
        <p className="ss-note">
          Not sure which of these fits your question? <Link to="/which-model">Which model should I use?</Link> helps you choose.
          Mixed models, logistic regression and mediation are not here: plan those by simulation, as{' '}
          <Link to="/lesson/08-3">Lesson 8-3</Link> does, or with the simr package for mixed models.
        </p>
      </section>

      <section className="mc-panel" aria-labelledby={`${ids}-mode`}>
        <p className="mc-kicker">Step 2</p>
        <h2 id={`${ids}-mode`}>What do you want to find out?</h2>
        <div className="ss-choice" role="radiogroup" aria-labelledby={`${ids}-mode`}>
          <label><input type="radio" name={`${ids}-mode`} checked={mode === 'n'} onChange={() => setMode('n')} /> How many people I need <small>for a study you are still planning</small></label>
          <label><input type="radio" name={`${ids}-mode`} checked={mode === 'effect'} onChange={() => setMode('effect')} /> What can my sample detect? <small>when the number of people is already fixed, for example existing data</small></label>
        </div>
        {mode === 'effect' && (
          <label className="ss-field">
            <span>{unitLabel}</span>
            <input inputMode="numeric" value={nFixed} onChange={(e) => setNFixed(e.target.value)} />
          </label>
        )}
      </section>

      <section className="mc-panel" aria-labelledby={`${ids}-effect`}>
        <p className="mc-kicker">Step 3</p>
        <h2 id={`${ids}-effect`}>{mode === 'n' ? 'How big is the effect you want to be able to find?' : 'Describe the design'}</h2>
        <p>
          This plans for {testText(design, sides)} (<Link to={`/lesson/${design.lessonId}`}>Lesson {design.lessonId.replace(/^0/, '')}</Link>).
          {mode === 'n' && <> The effect size is {design.effectName}: {design.effectMeaning}</>}
        </p>

        <div className="ss-fields">
          {design.id === 'anova' && (
            <label className="ss-field"><span>Number of groups</span><input inputMode="numeric" value={k} onChange={(e) => setK(e.target.value)} /></label>
          )}
          {(design.id === 'regression' || design.id === 'r2-change') && (
            <label className="ss-field"><span>Predictors in the {design.id === 'r2-change' ? 'full ' : ''}model</span><input inputMode="numeric" value={predictors} onChange={(e) => setPredictors(e.target.value)} /></label>
          )}
          {design.id === 'r2-change' && (
            <label className="ss-field"><span>Of which added and tested</span><input inputMode="numeric" value={added} onChange={(e) => setAdded(e.target.value)} /></label>
          )}
          {design.id === 'chi-square' && (
            <label className="ss-field"><span>Degrees of freedom</span><input inputMode="numeric" value={df} onChange={(e) => setDf(e.target.value)} /><small>(rows − 1) × (columns − 1)</small></label>
          )}
          {design.id === 'proportions' && (
            <>
              <label className="ss-field"><span>First group: % yes</span><input inputMode="decimal" value={p1} onChange={(e) => setP1(e.target.value)} /></label>
              {mode === 'n' && (
                <label className="ss-field"><span>Second group: % yes</span><input inputMode="decimal" value={p2} onChange={(e) => setP2(e.target.value)} /></label>
              )}
            </>
          )}
          {mode === 'n' && design.id !== 'proportions' && (
            <label className="ss-field ss-effect"><span>{design.effectName} ({design.symbol})</span><input inputMode="decimal" value={effect} onChange={(e) => setEffect(e.target.value)} /></label>
          )}
        </div>

        {mode === 'n' && 'plan' in built && (
          <p className="ss-meaning">{meaning(design, built.plan.effect, built.plan.p1 ?? 0)}</p>
        )}

        {mode === 'n' && (
          <>
            <EffectHelper design={design} onUse={(value) => setEffect(String(value))} />
            <details className="ss-explain" open>
              <summary>Where should this number come from?</summary>
              <ol>
                <li><strong>The smallest effect that would matter.</strong> Ask what difference would change a decision or be worth knowing about, in the outcome's own units (say, 3 points on a wellbeing scale), and convert it with the calculator above. This is the smallest effect size of interest, and the best basis for a plan.</li>
                <li><strong>A meta-analysis, or several similar studies.</strong> Their average is a far better guide than any single study. Published effects still tend to be inflated, because significant results are published more often.</li>
                <li><strong>One earlier study.</strong> Treat its effect as an upper limit and plan for something smaller: a significant result from a small study usually overstates the effect (<Link to="/lesson/08-4">Lesson 8-4</Link>).</li>
                <li><strong>A pilot study.</strong> Too small to estimate an effect size well. Use a pilot to test your materials and procedure, not to set the effect size.</li>
                {design.benchmarks && (
                  <li><strong>Cohen's conventions, as a last resort.</strong> Cohen called {design.symbol} = {design.benchmarks.map((b) => formatEffect(design, b)).join(', ')} small, medium and large, for when nothing else is known. They ignore what matters in your field, so say so if you use them.{' '}
                    <span className="ss-bench">
                      {design.benchmarks.map((b, i) => (
                        <button key={b} type="button" className="button-secondary" onClick={() => setEffect(String(b))}>
                          {['Small', 'Medium', 'Large'][i]} ({formatEffect(design, b)})
                        </button>
                      ))}
                    </span>
                  </li>
                )}
              </ol>
            </details>
          </>
        )}
      </section>

      <section className="mc-panel" aria-labelledby={`${ids}-sure`}>
        <p className="mc-kicker">Step 4</p>
        <h2 id={`${ids}-sure`}>How sure do you want to be?</h2>
        <div className="ss-fields">
          <label className="ss-field">
            <span>Power</span>
            <select value={target} onChange={(e) => setTarget(e.target.value)}>
              <option value="0.8">80%</option>
              <option value="0.9">90%</option>
              <option value="0.95">95%</option>
            </select>
            <small>80% means a one-in-five chance of missing a real effect of this size. 90% halves that risk and takes roughly a third more people.</small>
          </label>
          <label className="ss-field">
            <span>α (significance level)</span>
            <input inputMode="decimal" value={alpha} onChange={(e) => setAlpha(e.target.value)} />
            <small>.05 is the convention. If you test several hypotheses and correct for it, plan with the corrected α, for example .05 / 3 = .0167 for three Bonferroni-corrected tests.</small>
          </label>
          {mode === 'n' && (
            <label className="ss-field">
              <span>Expected dropout (%)</span>
              <input inputMode="decimal" value={dropout} onChange={(e) => setDropout(e.target.value)} />
              <small>People who drop out, skip questions or fail attention checks. You recruit extra so enough complete cases remain.</small>
            </label>
          )}
        </div>
        {HAS_SIDES[design.id] && (
          <fieldset className="ss-choice">
            <legend>One or two sides?</legend>
            <label><input type="radio" name={`${ids}-sides`} checked={sides === 2} onChange={() => setSides(2)} /> Two-sided <small>the default: an effect in either direction counts</small></label>
            <label><input type="radio" name={`${ids}-sides`} checked={sides === 1} onChange={() => setSides(1)} /> One-sided <small>only if you fixed the direction in advance, in writing, and an effect in the other direction would mean the same to you as no effect. It needs about a fifth fewer people, which is why reviewers distrust it when it was not planned.</small></label>
          </fieldset>
        )}
      </section>

      <section className="mc-panel ss-result" aria-labelledby={`${ids}-result`}>
        <p className="mc-kicker">Your plan</p>
        <h2 id={`${ids}-result`}>{mode === 'n' ? 'The sample you need' : 'What your sample can detect'}</h2>
        {'error' in built && <p role="alert" className="ss-error">{built.error}</p>}
        {result?.kind === 'too-small' && (
          <p role="alert" className="ss-error">An effect this small would need more than a million people. Check the effect size, or ask whether an effect this small matters.</p>
        )}
        {result?.kind === 'bad-n' && <p role="alert" className="ss-error">Enter a whole number of people, at least {result.min}.</p>}
        {result?.kind === 'none' && <p role="alert" className="ss-error">No effect size reaches that power with this many people. Lower the power or add people.</p>}

        {result?.kind === 'n' && (
          <>
            <div className="ss-headline" aria-live="polite">
              <p><span className="ss-big">{result.recruit}</span> to recruit</p>
              <p><span className="ss-big">{totalN(result.plan, result.n)}</span> complete cases needed</p>
            </div>
            <p>
              You need {peopleText(design, result.plan, result.n)} with complete data. With that many, the power is {pct(result.achieved, 1)}.
              {result.drop > 0 && <> To allow for {pct(result.drop)} dropout, recruit {peopleText(design, result.plan, result.recruitUnit)}.</>}
            </p>
            <h3>If the true effect is smaller</h3>
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
            <h3>How to report it</h3>
            <p className="ss-report">
              An a priori power analysis with {tool(design)} showed that {peopleText(design, result.plan, result.n)} are
              needed to detect {effectText(design, result.plan, result.plan.effect)} with {pct(power)} power in {testText(design, result.plan.sides)} at
              α = {alphaText}.{' '}
              <em>[Say where the effect size comes from.]</em>
              {result.drop > 0 && <> To allow for {pct(result.drop)} dropout, we will recruit {totalN(result.plan, result.recruitUnit)} participants.</>}
            </p>
          </>
        )}

        {result?.kind === 'effect' && (
          <>
            <div className="ss-headline" aria-live="polite">
              <p><span className="ss-big">{design.id === 'proportions' ? pct(result.effect, 1) : formatEffect(design, result.effect)}</span> {design.id === 'proportions' ? 'in the second group' : `smallest ${design.symbol} with ${pct(power)} power`}</p>
            </div>
            <p>
              With {peopleText(design, result.plan, result.n)}, {testText(design, result.plan.sides)} at α = {alphaText} has {pct(power)} power
              for {design.id === 'proportions' ? `a difference between ${pct(result.plan.p1 ?? 0, 1)} and ${pct(result.effect, 1)} or larger` : `effects of ${design.symbol} = ${formatEffect(design, result.effect)} or larger`}.
              Smaller effects may well go unnoticed, so a non-significant result says little about them.
            </p>
            {design.id !== 'proportions' && <p className="ss-meaning">{meaning(design, result.effect, 0)}</p>}
            <PowerCurve points={result.points} xLabel={design.id === 'proportions' ? 'Proportion in the second group' : `Effect size (${design.symbol})`}
              target={power} mark={[result.effect, power]} markLabel={`${design.symbol} = ${formatEffect(design, result.effect)}`} />
            <h3>How to report it</h3>
            <p className="ss-report">
              A sensitivity power analysis with {tool(design)} showed that with {peopleText(design, result.plan, result.n)},{' '}
              {testText(design, result.plan.sides)} at α = {alphaText} has {pct(power)} power to detect{' '}
              {design.id === 'proportions' ? `a difference between ${pct(result.plan.p1 ?? 0, 1)} and ${pct(result.effect, 1)}` : `effects of ${design.symbol} = ${formatEffect(design, result.effect)}`} or larger.
            </p>
          </>
        )}

        {code && (
          <>
            <h3>Check it in R</h3>
            <p>The same calculation in R. It runs in the <Link to="/workspace">R Workspace</Link>; {design.id === 'proportions' ? 'it needs only base R' : 'the first run downloads the pwr package'}.</p>
            <div className="model-chooser-code">
              <pre><code>{code}</code></pre>
              <button type="button" className="button-secondary" onClick={() => void copy()}>{copied ? 'Copied' : 'Copy code'}</button>
            </div>
            {mode === 'n' && design.id !== 'regression' && design.id !== 'r2-change' && (
              <p className="ss-note">R reports n unrounded{PER_GROUP[design.id] ? ' and per group' : ''}; round it up to whole people.</p>
            )}
          </>
        )}

        <h3>What this assumes</h3>
        <p>{design.assumes}</p>
      </section>
    </div>
  );
}
