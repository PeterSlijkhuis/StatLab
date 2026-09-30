import { pchisq, pf, pnorm, pt, qchisqUpper, qfUpper, qnormUpper, qtUpper } from './distributions';

/**
 * A priori power analysis for the designs taught in the course. Every formula
 * is the one the R function in `rCode` uses (pwr, or base R's power.prop.test),
 * so the page and the code a student copies give the same answer.
 * power.itest.ts checks that in real R.
 */

export type DesignId =
  | 'two-groups'
  | 'paired'
  | 'repeated'
  | 'factorial'
  | 'one-sample'
  | 'anova'
  | 'correlation'
  | 'regression'
  | 'r2-change'
  | 'proportions'
  | 'chi-square';

export type Plan = {
  design: DesignId;
  /** d, f, r, f², w, or for proportions the second group's proportion p2. */
  effect: number;
  alpha: number;
  /** 2 for a two-sided test; 1 for a one-sided test in the expected direction. */
  sides: 1 | 2;
  /** Groups (ANOVA). */
  k?: number;
  /** Predictors in the full model (regression, R² change). */
  predictors?: number;
  /** Predictors added to the model (R² change). */
  added?: number;
  /** Degrees of freedom (chi-square). */
  df?: number;
  /** The first group's proportion (proportions). */
  p1?: number;
  /** Correlation between a person's scores in different conditions (repeated). */
  rho?: number;
  /** Factorial: which factors each person does, and the effect the plan is for. */
  layout?: Layout;
  which?: Which;
};

/** A 2 × 2 design: both factors between people, both within, or one of each. */
export type Layout = 'between' | 'within' | 'mixed';
/** The effect in a 2 × 2 design. In a mixed design, main effects say which factor. */
export type Which = 'main' | 'main-within' | 'main-between' | 'interaction';

/** Whether n counts people per group (or pairs), or everyone in the study. */
export const PER_GROUP: Record<DesignId, boolean> = {
  'two-groups': true,
  paired: false,
  repeated: false,
  factorial: true,
  'one-sample': false,
  anova: true,
  correlation: false,
  regression: false,
  'r2-change': false,
  proportions: true,
  'chi-square': false,
};

/** Designs whose test has no direction: F and chi-square tests. */
export const HAS_SIDES: Record<DesignId, boolean> = {
  'two-groups': true,
  paired: true,
  repeated: false,
  factorial: false,
  'one-sample': true,
  anova: false,
  correlation: true,
  regression: false,
  'r2-change': false,
  proportions: true,
  'chi-square': false,
};

/** The smallest n each formula accepts. */
export function minN(plan: Plan): number {
  switch (plan.design) {
    case 'correlation': return 4;
    case 'regression':
    case 'r2-change': return (plan.predictors ?? 1) + 2;
    case 'chi-square':
    case 'proportions': return 2;
    default: return 2;
  }
}

/** A 2 × 2 design's n counts people per cell, per group, or everyone. */
const CELLS: Record<Layout, number> = { between: 4, mixed: 2, within: 1 };
/** Error degrees of freedom are N minus this. */
const LOST_DF: Record<Layout, number> = { between: 4, mixed: 2, within: 1 };

/**
 * Cohen's f of one effect in a 2 × 2 design, from its size in standard
 * deviations of the scores in one cell, and the correlation r between a
 * person's scores in different conditions (compound symmetry). For a main
 * effect `delta` is the difference between the two levels, averaged over the
 * other factor; for the interaction it is the difference between the two
 * simple effects. Every effect has 1 df, so its test is a t-test on one
 * contrast, and λ = N·f² in every layout.
 */
export function factorialF(layout: Layout, which: Which, delta: number, r = 0.5): number {
  const d = Math.abs(delta);
  if (layout === 'between') return which === 'interaction' ? d / 4 : d / 2;
  if (layout === 'within') return which === 'interaction' ? d / (2 * Math.sqrt(1 - r)) : d / Math.sqrt(1 - r);
  if (which === 'interaction') return d / Math.sqrt(8 * (1 - r));
  if (which === 'main-between') return d / Math.sqrt(2 * (1 + r));
  return d / Math.sqrt(2 * (1 - r));
}

/** Everyone in the study, for a given n. */
export function totalN(plan: Plan, n: number): number {
  if (plan.design === 'anova') return n * (plan.k ?? 3);
  if (plan.design === 'two-groups' || plan.design === 'proportions') return 2 * n;
  if (plan.design === 'factorial') return n * CELLS[plan.layout ?? 'between'];
  return n;
}

function tPower(n: number, d: number, tsample: 1 | 2, alpha: number, sides: 1 | 2): number {
  const nu = (n - 1) * tsample;
  const ncp = Math.sqrt(n / tsample) * d;
  if (sides === 1) return 1 - pt(qtUpper(alpha, nu), nu, ncp);
  const qu = qtUpper(alpha / 2, nu);
  return 1 - pt(qu, nu, ncp) + pt(-qu, nu, ncp);
}

function fPower(df1: number, df2: number, lambda: number, alpha: number): number {
  return 1 - pf(qfUpper(alpha, df1, df2), df1, df2, lambda);
}

/** Power of the planned test with n (per group where the design has groups). */
export function powerAt(plan: Plan, n: number): number {
  const { effect, alpha, sides } = plan;
  switch (plan.design) {
    case 'two-groups': return tPower(n, effect, 2, alpha, sides);
    case 'paired':
    case 'one-sample': return tPower(n, effect, 1, alpha, sides);
    case 'anova': {
      const k = plan.k ?? 3;
      return fPower(k - 1, (n - 1) * k, k * n * effect ** 2, alpha);
    }
    case 'repeated': {
      // G*Power's "ANOVA: repeated measures, within factors" with sphericity (ε = 1).
      const k = plan.k ?? 3;
      return fPower(k - 1, (n - 1) * (k - 1), (n * k * effect ** 2) / (1 - (plan.rho ?? 0.5)), alpha);
    }
    case 'factorial': {
      // One effect of a 2 × 2 ANOVA: G*Power's "fixed effects, special" for a between design.
      const N = totalN(plan, n);
      return fPower(1, N - LOST_DF[plan.layout ?? 'between'], N * effect ** 2, alpha);
    }
    case 'regression':
    case 'r2-change': {
      const p = plan.predictors ?? 1;
      const u = plan.design === 'regression' ? p : (plan.added ?? 1);
      const v = n - p - 1;
      return fPower(u, v, effect * (u + v + 1), alpha);
    }
    case 'correlation': {
      // pwr.r.test: Fisher's z with a small-sample bias correction.
      const ttt = qtUpper(alpha / sides, n - 2);
      const rc = Math.sqrt((ttt * ttt) / (ttt * ttt + n - 2));
      const zr = Math.atanh(effect) + effect / (2 * (n - 1));
      const zrc = Math.atanh(rc);
      const s = Math.sqrt(n - 3);
      return sides === 1 ? pnorm((zr - zrc) * s) : pnorm((zr - zrc) * s) + pnorm((-zr - zrc) * s);
    }
    case 'proportions': {
      // power.prop.test with its default strict = FALSE.
      const p1 = plan.p1 ?? 0.5;
      const p2 = effect;
      return pnorm(
        (Math.sqrt(n) * Math.abs(p1 - p2) - qnormUpper(alpha / sides) * Math.sqrt((p1 + p2) * (1 - (p1 + p2) / 2))) /
          Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2)),
      );
    }
    case 'chi-square': {
      const df = plan.df ?? 1;
      return 1 - pchisq(qchisqUpper(alpha, df), df, n * effect ** 2);
    }
  }
}

/** Above this, the effect is too small to plan a study for. */
export const MAX_N = 1_000_000;

/** The smallest whole n that reaches the target power, or null beyond MAX_N. */
export function solveN(plan: Plan, target: number): number | null {
  let lo = minN(plan);
  if (powerAt(plan, lo) >= target) return lo;
  let hi = lo * 2;
  while (powerAt(plan, hi) < target) {
    lo = hi;
    hi *= 2;
    if (hi > MAX_N * 2) return null;
  }
  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2);
    if (powerAt(plan, mid) >= target) hi = mid;
    else lo = mid;
  }
  return hi > MAX_N ? null : hi;
}

/** Where to search for the detectable effect. */
function effectRange(plan: Plan): [number, number] {
  switch (plan.design) {
    case 'correlation': return [1e-9, 1 - 1e-9];
    case 'proportions': return [plan.p1 ?? 0.5, 1 - 1e-9];
    case 'regression':
    case 'r2-change': return [1e-9, 100];
    default: return [1e-9, 10];
  }
}

/** The smallest effect that n detects with the target power, or null if none can. */
export function solveEffect(plan: Plan, n: number, target: number): number | null {
  let [lo, hi] = effectRange(plan);
  if (powerAt({ ...plan, effect: hi }, n) < target) return null;
  for (let i = 0; i < 100 && hi - lo > 1e-10; i++) {
    const mid = (lo + hi) / 2;
    if (powerAt({ ...plan, effect: mid }, n) < target) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/** Cohen's d from a mean difference and the standard deviation within groups. */
export const dFromMeans = (difference: number, sd: number) => difference / sd;

/** dz for a paired design, from d and the correlation between the two measurements. */
export const dzFromD = (d: number, r: number) => d / Math.sqrt(2 * (1 - r));

/** Cohen's f from expected group means (equal groups) and the SD within groups. */
export function fFromMeans(means: number[], sd: number): number {
  const mean = means.reduce((a, b) => a + b, 0) / means.length;
  const between = Math.sqrt(means.reduce((a, m) => a + (m - mean) ** 2, 0) / means.length);
  return between / sd;
}

/** Cohen's f from eta squared (or partial eta squared for one factor). */
export const fFromEta2 = (eta2: number) => Math.sqrt(eta2 / (1 - eta2));

/** Cohen's f² from R² (whole model) or from R² change and the full model's R². */
export const f2FromR2 = (r2Change: number, r2Full = r2Change) => r2Change / (1 - r2Full);

/** Cohen's w from Cramér's V and the smaller of the table's rows and columns. */
export const wFromV = (v: number, rows: number, cols: number) => v * Math.sqrt(Math.min(rows, cols) - 1);

const num = (x: number) => String(Number(x.toFixed(4)));

/** The R call that gives the same answer, so a student can check and cite it. */
export function rCode(plan: Plan, solveFor: 'n' | 'effect', target: number, n?: number): string {
  const a = `sig.level = ${num(plan.alpha)}`;
  const pw = `power = ${num(target)}`;
  const e = solveFor === 'n';
  const alt = plan.sides === 1 ? 'greater' : 'two.sided';
  switch (plan.design) {
    case 'two-groups':
    case 'paired':
    case 'one-sample': {
      const type = { 'two-groups': 'two.sample', paired: 'paired', 'one-sample': 'one.sample' }[plan.design];
      const size = e ? `d = ${num(plan.effect)}` : `n = ${n}`;
      return `library(pwr)\npwr.t.test(${size}, ${a}, ${pw},\n           type = "${type}", alternative = "${alt}")`;
    }
    case 'anova': {
      const size = e ? `f = ${num(plan.effect)}` : `n = ${n}`;
      return `library(pwr)\npwr.anova.test(k = ${plan.k ?? 3}, ${size}, ${a}, ${pw})`;
    }
    case 'repeated': {
      const head = `# Repeated measures, assuming sphericity (G*Power's formula)\nk <- ${plan.k ?? 3}; r <- ${num(plan.rho ?? 0.5)}; alpha <- ${num(plan.alpha)}; target <- ${num(target)}\npower_at <- function(n, f) {\n  df1 <- k - 1; df2 <- (n - 1) * (k - 1)\n  1 - pf(qf(1 - alpha, df1, df2), df1, df2, ncp = n * k * f^2 / (1 - r))\n}\n`;
      return e
        ? `${head}n <- 2\nwhile (power_at(n, ${num(plan.effect)}) < target) n <- n + 1\nn`
        : `${head}uniroot(function(f) power_at(${n}, f) - target, c(1e-6, 10), tol = 1e-10)$root`;
    }
    case 'factorial': {
      const layout = plan.layout ?? 'between';
      const per = { between: 'people per cell', mixed: 'people per group', within: 'people' }[layout];
      const head = `# One effect in a 2 × 2 design (${layout === 'mixed' ? 'one factor between, one within people' : `both factors ${layout} people`}): F test with 1 df\nalpha <- ${num(plan.alpha)}; target <- ${num(target)}\npower_at <- function(n, f) {   # n = ${per}\n  N <- ${CELLS[layout]} * n; df2 <- N - ${LOST_DF[layout]}\n  1 - pf(qf(1 - alpha, 1, df2), 1, df2, ncp = N * f^2)\n}\n`;
      return e
        ? `${head}n <- 2\nwhile (power_at(n, ${num(plan.effect)}) < target) n <- n + 1\nn   # ${per}`
        : `${head}uniroot(function(f) power_at(${n}, f) - target, c(1e-6, 10), tol = 1e-10)$root`;
    }
    case 'correlation': {
      const size = e ? `r = ${num(plan.effect)}` : `n = ${n}`;
      return `library(pwr)\npwr.r.test(${size}, ${a}, ${pw}, alternative = "${alt}")`;
    }
    case 'regression':
    case 'r2-change': {
      const p = plan.predictors ?? 1;
      const u = plan.design === 'regression' ? p : (plan.added ?? 1);
      if (e) {
        return `library(pwr)\nres <- pwr.f2.test(u = ${u}, f2 = ${num(plan.effect)}, ${a}, ${pw})\nres\n# v is the error df; people needed = v + ${p} predictors + 1\nceiling(res$v) + ${p + 1}`;
      }
      return `library(pwr)\npwr.f2.test(u = ${u}, v = ${(n ?? 0) - p - 1}, ${a}, ${pw})`;
    }
    case 'proportions': {
      const alt2 = plan.sides === 1 ? 'one.sided' : 'two.sided';
      const size = e ? `p2 = ${num(plan.effect)}` : `n = ${n}`;
      return `power.prop.test(p1 = ${num(plan.p1 ?? 0.5)}, ${size}, ${a}, ${pw},\n                alternative = "${alt2}")`;
    }
    case 'chi-square': {
      const size = e ? `w = ${num(plan.effect)}` : `N = ${n}`;
      return `library(pwr)\npwr.chisq.test(${size}, df = ${plan.df ?? 1}, ${a}, ${pw})`;
    }
  }
}

/**
 * A simulation for a repeated-measures design with several stimuli per
 * condition, where no formula applies. The standard deviations are
 * placeholders the student replaces with estimates from a pilot.
 */
export function stimulusSimCode(nPeople: number, k: number, nStim: number, f: number, alpha = 0.05, nsim = 100): string {
  return `# Power with several stimuli per condition, by simulation (lmerTest).
# The standard deviations below are placeholders. Replace them with
# estimates from a pilot or an earlier study: fit the same model to those
# data and read them from VarCorr(). They are in single-trial units.
library(lmerTest)
n_people <- ${nPeople}; k <- ${k}; n_stim <- ${nStim}   # people, conditions, stimuli per condition
same_stimuli <- TRUE     # FALSE if each condition has its own stimuli
alpha <- ${num(alpha)}
f <- ${num(f)}           # in SDs of people's average score in one condition, as on the page
sd_person <- 0.6         # people differ in their average score
sd_person_cond <- 0.3    # people differ in how the conditions affect them
sd_stim <- 0.3           # stimuli differ in their average score
sd_stim_cond <- 0.2      # stimuli differ in how the conditions affect them
sd_noise <- 0.7          # everything else, from trial to trial
sd_average <- sqrt(sd_person^2 + sd_person_cond^2 + sd_noise^2 / n_stim)   # SD of people's averages
sd_person^2 / sd_average^2   # the correlation between conditions these imply; compare with the page's r
means <- seq(-1, 1, length.out = k)
means <- f * sd_average * means / sqrt(mean(means^2))   # or type your own condition means
nsim <- ${nsim}             # use 1000 in desktop R for a precise answer

one_study <- function() {
  d <- expand.grid(person = 1:n_people, cond = 1:k, stim = 1:n_stim)
  if (!same_stimuli) d$stim <- (d$cond - 1) * n_stim + d$stim
  n_s <- max(d$stim)
  d$y <- means[d$cond] +
    rnorm(n_people, 0, sd_person)[d$person] +
    matrix(rnorm(n_people * k, 0, sd_person_cond), n_people)[cbind(d$person, d$cond)] +
    rnorm(n_s, 0, sd_stim)[d$stim] +
    (if (same_stimuli) matrix(rnorm(n_s * k, 0, sd_stim_cond), n_s)[cbind(d$stim, d$cond)] else 0) +
    rnorm(nrow(d), 0, sd_noise)
  d$person <- factor(d$person); d$cond <- factor(d$cond); d$stim <- factor(d$stim)
  model <- if (same_stimuli) {
    y ~ cond + (1 | person) + (1 | person:cond) + (1 | stim) + (1 | stim:cond)
  } else {
    y ~ cond + (1 | person) + (1 | person:cond) + (1 | stim)
  }
  tryCatch(suppressMessages(suppressWarnings(
    anova(lmer(model, data = d))[["Pr(>F)"]][1]
  )), error = function(e) NA)
}

p <- replicate(nsim, one_study())
mean(p < alpha, na.rm = TRUE)   # the estimated power`;
}
