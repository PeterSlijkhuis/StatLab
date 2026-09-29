/**
 * The distribution functions a power analysis needs, written to match R's
 * pnorm, pt, pf and pchisq (including their noncentral forms) to about ten
 * significant digits. distributions.test.ts checks them against values
 * printed by R.
 */

const LANCZOS = [
  0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313,
  -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6,
  1.5056327351493116e-7,
];

/** log Γ(x) for x > 0 (Lanczos, g = 7). */
export function lgamma(x: number): number {
  if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - lgamma(1 - x);
  x -= 1;
  let a = LANCZOS[0];
  const t = x + 7.5;
  for (let i = 1; i < 9; i++) a += LANCZOS[i] / (x + i);
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}

const EPS = 1e-16;
const TINY = 1e-300;

/** Continued fraction for the incomplete beta function (modified Lentz). */
function betacf(a: number, b: number, x: number): number {
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < TINY) d = TINY;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= 100000; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < TINY) d = TINY;
    c = 1 + aa / c;
    if (Math.abs(c) < TINY) c = TINY;
    d = 1 / d;
    h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < TINY) d = TINY;
    c = 1 + aa / c;
    if (Math.abs(c) < TINY) c = TINY;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < EPS) break;
  }
  return h;
}

/** Regularized incomplete beta I_x(a, b), like R's pbeta(x, a, b). */
export function ibeta(x: number, a: number, b: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const front = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log1p(-x));
  return x < (a + 1) / (a + b + 2)
    ? (front * betacf(a, b, x)) / a
    : 1 - (front * betacf(b, a, 1 - x)) / b;
}

/** Regularized lower incomplete gamma P(a, x), like R's pgamma(x, a). */
export function igamma(a: number, x: number): number {
  if (x <= 0) return 0;
  return x < a + 1 ? gammaSeries(a, x) : 1 - gammaCf(a, x);
}

/** Regularized upper incomplete gamma Q(a, x) = 1 - P(a, x), kept precise in the far tail. */
function igammaUpper(a: number, x: number): number {
  if (x <= 0) return 1;
  return x < a + 1 ? 1 - gammaSeries(a, x) : gammaCf(a, x);
}

function gammaSeries(a: number, x: number): number {
  let ap = a;
  let sum = 1 / a;
  let del = sum;
  for (let n = 0; n < 100000; n++) {
    ap += 1;
    del *= x / ap;
    sum += del;
    if (Math.abs(del) < Math.abs(sum) * EPS) break;
  }
  return sum * Math.exp(-x + a * Math.log(x) - lgamma(a));
}

function gammaCf(a: number, x: number): number {
  let b = x + 1 - a;
  let c = 1 / TINY;
  let d = 1 / b;
  let h = d;
  for (let i = 1; i < 100000; i++) {
    const an = -i * (i - a);
    b += 2;
    d = an * d + b;
    if (Math.abs(d) < TINY) d = TINY;
    c = b + an / c;
    if (Math.abs(c) < TINY) c = TINY;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < EPS) break;
  }
  return Math.exp(-x + a * Math.log(x) - lgamma(a)) * h;
}

/** Standard normal CDF, like R's pnorm(x). */
export function pnorm(x: number): number {
  const half = igammaUpper(0.5, (x * x) / 2) / 2;
  return x >= 0 ? 1 - half : half;
}

/** Central t CDF, like R's pt(t, df). */
function ptCentral(t: number, df: number): number {
  const tail = ibeta(df / (df + t * t), df / 2, 0.5) / 2;
  return t > 0 ? 1 - tail : tail;
}

/** Poisson weights e^-m m^j / j! for j in [from, to], computed in log space. */
function poissonRange(m: number): [number, number] {
  const spread = 12 * Math.sqrt(m) + 40;
  return [Math.max(0, Math.floor(m - spread)), Math.ceil(m + spread)];
}

/** t CDF with noncentrality ncp, like R's pt(t, df, ncp). */
export function pt(t: number, df: number, ncp = 0): number {
  if (ncp === 0) return ptCentral(t, df);
  if (t < 0) return 1 - pt(-t, df, -ncp);
  // F(t) = Φ(-δ) + ½ Σ_j [P_j I_x(j + ½, ν/2) + Q_j I_x(j + 1, ν/2)], x = t² / (t² + ν).
  const x = (t * t) / (t * t + df);
  const m = (ncp * ncp) / 2;
  // Terms outside the Poisson bulk weigh less than 1e-30 and are skipped.
  const [from, to] = poissonRange(m);
  const logM = Math.log(m);
  const logDelta = Math.log(Math.abs(ncp)) - 0.5 * Math.LN2;
  const sign = Math.sign(ncp);
  let sum = 0;
  for (let j = from; j <= to; j++) {
    const p = Math.exp(-m + j * logM - lgamma(j + 1));
    const q = sign * Math.exp(-m + j * logM + logDelta - lgamma(j + 1.5));
    sum += p * ibeta(x, j + 0.5, df / 2) + q * ibeta(x, j + 1, df / 2);
  }
  return Math.min(1, Math.max(0, pnorm(-ncp) + sum / 2));
}

/** F CDF with noncentrality ncp, like R's pf(f, df1, df2, ncp). */
export function pf(f: number, df1: number, df2: number, ncp = 0): number {
  if (f <= 0) return 0;
  const x = (df1 * f) / (df1 * f + df2);
  if (ncp === 0) return ibeta(x, df1 / 2, df2 / 2);
  const m = ncp / 2;
  const [from, to] = poissonRange(m);
  let sum = 0;
  for (let j = from; j <= to; j++) {
    sum += Math.exp(-m + j * Math.log(m) - lgamma(j + 1)) * ibeta(x, df1 / 2 + j, df2 / 2);
  }
  return Math.min(1, sum);
}

/** Chi-square CDF with noncentrality ncp, like R's pchisq(x, df, ncp). */
export function pchisq(x: number, df: number, ncp = 0): number {
  if (x <= 0) return 0;
  if (ncp === 0) return igamma(df / 2, x / 2);
  const m = ncp / 2;
  const [from, to] = poissonRange(m);
  let sum = 0;
  for (let j = from; j <= to; j++) {
    sum += Math.exp(-m + j * Math.log(m) - lgamma(j + 1)) * igamma(df / 2 + j, x / 2);
  }
  return Math.min(1, sum);
}

/** The x at which an increasing cdf reaches p, by bisection from lo upward. */
function invert(cdf: (x: number) => number, p: number, lo: number): number {
  let hi = Math.max(1, lo + 1);
  while (cdf(hi) < p) hi *= 2;
  for (let i = 0; i < 200 && hi - lo > 1e-14 * Math.max(1, Math.abs(hi)); i++) {
    const mid = (lo + hi) / 2;
    if (cdf(mid) < p) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/** Upper-tail quantiles: the value with probability `upper` above it. */
export const qnormUpper = (upper: number): number => (upper < 0.5 ? invert((x) => pnorm(x), 1 - upper, 0) : -qnormUpper(1 - upper));
export const qtUpper = (upper: number, df: number) => invert((t) => ptCentral(t, df), 1 - upper, 0);
export const qfUpper = (upper: number, df1: number, df2: number) => invert((f) => pf(f, df1, df2), 1 - upper, 0);
export const qchisqUpper = (upper: number, df: number) => invert((x) => pchisq(x, df), 1 - upper, 0);
