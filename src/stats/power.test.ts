import { describe, expect, test } from 'vitest';
import { dzFromD, f2FromR2, fFromEta2, fFromMeans, powerAt, rCode, solveEffect, solveN, totalN, wFromV, type Plan } from './power';

// Printed by the pwr package (1.3) and base R's power.prop.test, with n
// rounded up: ceiling(pwr.t.test(d = 0.5, power = 0.8)$n) and so on.
const N_CASES: { plan: Plan; power: number; n: number }[] = [
{ plan: { design: 'two-groups', effect: 0.2, alpha: 0.05, sides: 2 }, power: 0.8, n: 394 },
  { plan: { design: 'two-groups', effect: 0.2, alpha: 0.05, sides: 2 }, power: 0.9, n: 527 },
  { plan: { design: 'paired', effect: 0.2, alpha: 0.05, sides: 2 }, power: 0.8, n: 199 },
  { plan: { design: 'paired', effect: 0.2, alpha: 0.05, sides: 2 }, power: 0.9, n: 265 },
  { plan: { design: 'one-sample', effect: 0.2, alpha: 0.05, sides: 2 }, power: 0.8, n: 199 },
  { plan: { design: 'one-sample', effect: 0.2, alpha: 0.05, sides: 2 }, power: 0.9, n: 265 },
  { plan: { design: 'two-groups', effect: 0.2, alpha: 0.05, sides: 1 }, power: 0.8, n: 310 },
  { plan: { design: 'two-groups', effect: 0.2, alpha: 0.05, sides: 1 }, power: 0.9, n: 429 },
  { plan: { design: 'paired', effect: 0.2, alpha: 0.05, sides: 1 }, power: 0.8, n: 156 },
  { plan: { design: 'paired', effect: 0.2, alpha: 0.05, sides: 1 }, power: 0.9, n: 216 },
  { plan: { design: 'one-sample', effect: 0.2, alpha: 0.05, sides: 1 }, power: 0.8, n: 156 },
  { plan: { design: 'one-sample', effect: 0.2, alpha: 0.05, sides: 1 }, power: 0.9, n: 216 },
  { plan: { design: 'two-groups', effect: 0.5, alpha: 0.05, sides: 2 }, power: 0.8, n: 64 },
  { plan: { design: 'two-groups', effect: 0.5, alpha: 0.05, sides: 2 }, power: 0.9, n: 86 },
  { plan: { design: 'paired', effect: 0.5, alpha: 0.05, sides: 2 }, power: 0.8, n: 34 },
  { plan: { design: 'paired', effect: 0.5, alpha: 0.05, sides: 2 }, power: 0.9, n: 44 },
  { plan: { design: 'one-sample', effect: 0.5, alpha: 0.05, sides: 2 }, power: 0.8, n: 34 },
  { plan: { design: 'one-sample', effect: 0.5, alpha: 0.05, sides: 2 }, power: 0.9, n: 44 },
  { plan: { design: 'two-groups', effect: 0.5, alpha: 0.05, sides: 1 }, power: 0.8, n: 51 },
  { plan: { design: 'two-groups', effect: 0.5, alpha: 0.05, sides: 1 }, power: 0.9, n: 70 },
  { plan: { design: 'paired', effect: 0.5, alpha: 0.05, sides: 1 }, power: 0.8, n: 27 },
  { plan: { design: 'paired', effect: 0.5, alpha: 0.05, sides: 1 }, power: 0.9, n: 36 },
  { plan: { design: 'one-sample', effect: 0.5, alpha: 0.05, sides: 1 }, power: 0.8, n: 27 },
  { plan: { design: 'one-sample', effect: 0.5, alpha: 0.05, sides: 1 }, power: 0.9, n: 36 },
  { plan: { design: 'two-groups', effect: 0.8, alpha: 0.05, sides: 2 }, power: 0.8, n: 26 },
  { plan: { design: 'two-groups', effect: 0.8, alpha: 0.05, sides: 2 }, power: 0.9, n: 34 },
  { plan: { design: 'paired', effect: 0.8, alpha: 0.05, sides: 2 }, power: 0.8, n: 15 },
  { plan: { design: 'paired', effect: 0.8, alpha: 0.05, sides: 2 }, power: 0.9, n: 19 },
  { plan: { design: 'one-sample', effect: 0.8, alpha: 0.05, sides: 2 }, power: 0.8, n: 15 },
  { plan: { design: 'one-sample', effect: 0.8, alpha: 0.05, sides: 2 }, power: 0.9, n: 19 },
  { plan: { design: 'two-groups', effect: 0.8, alpha: 0.05, sides: 1 }, power: 0.8, n: 21 },
  { plan: { design: 'two-groups', effect: 0.8, alpha: 0.05, sides: 1 }, power: 0.9, n: 28 },
  { plan: { design: 'paired', effect: 0.8, alpha: 0.05, sides: 1 }, power: 0.8, n: 12 },
  { plan: { design: 'paired', effect: 0.8, alpha: 0.05, sides: 1 }, power: 0.9, n: 15 },
  { plan: { design: 'one-sample', effect: 0.8, alpha: 0.05, sides: 1 }, power: 0.8, n: 12 },
  { plan: { design: 'one-sample', effect: 0.8, alpha: 0.05, sides: 1 }, power: 0.9, n: 15 },
  { plan: { design: 'anova', effect: 0.1, alpha: 0.05, sides: 2, k: 3 }, power: 0.8, n: 323 },
  { plan: { design: 'anova', effect: 0.25, alpha: 0.05, sides: 2, k: 3 }, power: 0.8, n: 53 },
  { plan: { design: 'anova', effect: 0.4, alpha: 0.05, sides: 2, k: 3 }, power: 0.8, n: 22 },
  { plan: { design: 'anova', effect: 0.1, alpha: 0.05, sides: 2, k: 5 }, power: 0.8, n: 240 },
  { plan: { design: 'anova', effect: 0.25, alpha: 0.05, sides: 2, k: 5 }, power: 0.8, n: 40 },
  { plan: { design: 'anova', effect: 0.4, alpha: 0.05, sides: 2, k: 5 }, power: 0.8, n: 16 },
  { plan: { design: 'correlation', effect: 0.1, alpha: 0.05, sides: 2 }, power: 0.8, n: 782 },
  { plan: { design: 'correlation', effect: 0.1, alpha: 0.05, sides: 1 }, power: 0.8, n: 617 },
  { plan: { design: 'correlation', effect: 0.3, alpha: 0.05, sides: 2 }, power: 0.8, n: 85 },
  { plan: { design: 'correlation', effect: 0.3, alpha: 0.05, sides: 1 }, power: 0.8, n: 67 },
  { plan: { design: 'correlation', effect: 0.5, alpha: 0.05, sides: 2 }, power: 0.8, n: 29 },
  { plan: { design: 'correlation', effect: 0.5, alpha: 0.05, sides: 1 }, power: 0.8, n: 23 },
  { plan: { design: 'regression', effect: 0.02, alpha: 0.05, sides: 2, predictors: 1 }, power: 0.8, n: 395 },
  { plan: { design: 'regression', effect: 0.15, alpha: 0.05, sides: 2, predictors: 1 }, power: 0.8, n: 55 },
  { plan: { design: 'regression', effect: 0.35, alpha: 0.05, sides: 2, predictors: 1 }, power: 0.8, n: 25 },
  { plan: { design: 'regression', effect: 0.02, alpha: 0.05, sides: 2, predictors: 3 }, power: 0.8, n: 550 },
  { plan: { design: 'regression', effect: 0.15, alpha: 0.05, sides: 2, predictors: 3 }, power: 0.8, n: 77 },
  { plan: { design: 'regression', effect: 0.35, alpha: 0.05, sides: 2, predictors: 3 }, power: 0.8, n: 36 },
  { plan: { design: 'regression', effect: 0.02, alpha: 0.05, sides: 2, predictors: 6 }, power: 0.8, n: 688 },
  { plan: { design: 'regression', effect: 0.15, alpha: 0.05, sides: 2, predictors: 6 }, power: 0.8, n: 98 },
  { plan: { design: 'regression', effect: 0.35, alpha: 0.05, sides: 2, predictors: 6 }, power: 0.8, n: 46 },
  { plan: { design: 'r2-change', effect: 0.02, alpha: 0.05, sides: 2, predictors: 5, added: 1 }, power: 0.8, n: 399 },
  { plan: { design: 'r2-change', effect: 0.15, alpha: 0.05, sides: 2, predictors: 5, added: 1 }, power: 0.8, n: 59 },
  { plan: { design: 'r2-change', effect: 0.02, alpha: 0.05, sides: 2, predictors: 5, added: 2 }, power: 0.8, n: 488 },
  { plan: { design: 'r2-change', effect: 0.15, alpha: 0.05, sides: 2, predictors: 5, added: 2 }, power: 0.8, n: 71 },
  { plan: { design: 'chi-square', effect: 0.1, alpha: 0.05, sides: 2, df: 1 }, power: 0.8, n: 785 },
  { plan: { design: 'chi-square', effect: 0.1, alpha: 0.05, sides: 2, df: 4 }, power: 0.8, n: 1194 },
  { plan: { design: 'chi-square', effect: 0.3, alpha: 0.05, sides: 2, df: 1 }, power: 0.8, n: 88 },
  { plan: { design: 'chi-square', effect: 0.3, alpha: 0.05, sides: 2, df: 4 }, power: 0.8, n: 133 },
  { plan: { design: 'chi-square', effect: 0.5, alpha: 0.05, sides: 2, df: 1 }, power: 0.8, n: 32 },
  { plan: { design: 'chi-square', effect: 0.5, alpha: 0.05, sides: 2, df: 4 }, power: 0.8, n: 48 },
  { plan: { design: 'proportions', effect: 0.45, alpha: 0.05, sides: 2, p1: 0.3 }, power: 0.8, n: 163 },
  { plan: { design: 'proportions', effect: 0.45, alpha: 0.05, sides: 1, p1: 0.3 }, power: 0.8, n: 128 },
  { plan: { design: 'proportions', effect: 0.6, alpha: 0.05, sides: 2, p1: 0.5 }, power: 0.8, n: 388 },
  { plan: { design: 'proportions', effect: 0.6, alpha: 0.05, sides: 1, p1: 0.5 }, power: 0.8, n: 305 },
  { plan: { design: 'proportions', effect: 0.2, alpha: 0.05, sides: 2, p1: 0.1 }, power: 0.8, n: 199 },
  { plan: { design: 'proportions', effect: 0.2, alpha: 0.05, sides: 1, p1: 0.1 }, power: 0.8, n: 157 },
  { plan: { design: 'two-groups', effect: 0.5, alpha: 0.01, sides: 2 }, power: 0.8, n: 96 },
];

// The smallest effect each n detects with 80% power, from the same functions.
const EFFECT_CASES: { plan: Plan; n: number; effect: number }[] = [
{ plan: { design: 'two-groups', effect: 0, alpha: 0.05, sides: 2 }, n: 20, effect: 0.909159 },
  { plan: { design: 'paired', effect: 0, alpha: 0.05, sides: 1 }, n: 20, effect: 0.576919 },
  { plan: { design: 'anova', effect: 0, alpha: 0.05, sides: 2, k: 4 }, n: 20, effect: 0.378801 },
  { plan: { design: 'correlation', effect: 0, alpha: 0.05, sides: 2 }, n: 20, effect: 0.582148 },
  { plan: { design: 'regression', effect: 0, alpha: 0.05, sides: 2, predictors: 3 }, n: 20, effect: 0.697689 },
  { plan: { design: 'chi-square', effect: 0, alpha: 0.05, sides: 2, df: 2 }, n: 20, effect: 0.694075 },
  { plan: { design: 'proportions', effect: 0, alpha: 0.05, sides: 2, p1: 0.3 }, n: 20, effect: 0.729847 },
  { plan: { design: 'two-groups', effect: 0, alpha: 0.05, sides: 2 }, n: 50, effect: 0.565858 },
  { plan: { design: 'paired', effect: 0, alpha: 0.05, sides: 1 }, n: 50, effect: 0.356606 },
  { plan: { design: 'anova', effect: 0, alpha: 0.05, sides: 2, k: 4 }, n: 50, effect: 0.235826 },
  { plan: { design: 'correlation', effect: 0, alpha: 0.05, sides: 2 }, n: 50, effect: 0.384319 },
  { plan: { design: 'regression', effect: 0, alpha: 0.05, sides: 2, predictors: 3 }, n: 50, effect: 0.237476 },
  { plan: { design: 'chi-square', effect: 0, alpha: 0.05, sides: 2, df: 2 }, n: 50, effect: 0.438970 },
  { plan: { design: 'proportions', effect: 0, alpha: 0.05, sides: 2, p1: 0.3 }, n: 50, effect: 0.574686 },
  { plan: { design: 'two-groups', effect: 0, alpha: 0.05, sides: 2 }, n: 200, effect: 0.280827 },
  { plan: { design: 'paired', effect: 0, alpha: 0.05, sides: 1 }, n: 200, effect: 0.176418 },
  { plan: { design: 'anova', effect: 0, alpha: 0.05, sides: 2, k: 4 }, n: 200, effect: 0.117038 },
  { plan: { design: 'correlation', effect: 0, alpha: 0.05, sides: 2 }, n: 200, effect: 0.196577 },
  { plan: { design: 'regression', effect: 0, alpha: 0.05, sides: 2, predictors: 3 }, n: 200, effect: 0.055610 },
  { plan: { design: 'chi-square', effect: 0, alpha: 0.05, sides: 2, df: 2 }, n: 200, effect: 0.219485 },
  { plan: { design: 'proportions', effect: 0, alpha: 0.05, sides: 2, p1: 0.3 }, n: 200, effect: 0.434657 },
];

describe('sample size matches pwr and power.prop.test', () => {
  for (const { plan, power, n } of N_CASES) {
    test(`${plan.design} ${JSON.stringify(plan)} at ${power}`, () => {
      expect(solveN(plan, power)).toBe(n);
    });
  }
});

describe('detectable effect matches pwr and power.prop.test', () => {
  for (const { plan, n, effect } of EFFECT_CASES) {
    test(`${plan.design} ${JSON.stringify(plan)} with n = ${n}`, () => {
      expect(solveEffect(plan, n, 0.8)).toBeCloseTo(effect, 4);
    });
  }
});

describe('repeated measures match G*Power', () => {
  // G*Power 3.1, "ANOVA: repeated measures, within factors", 1 group, ε = 1:
  // f = .25, r = .5, α = .05, 80% power gives 28 people for 3 measurements and 24 for 4.
  const plan = (k: number): Plan => ({ design: 'repeated', effect: 0.25, alpha: 0.05, sides: 2, k, rho: 0.5 });
  test('sample sizes', () => {
    expect(solveN(plan(3), 0.8)).toBe(28);
    expect(solveN(plan(4), 0.8)).toBe(24);
  });
  test('two conditions give the paired t-test: f = d / 2 and dz = d / √(2(1 − r))', () => {
    expect(solveN(plan(2), 0.8)).toBe(solveN({ design: 'paired', effect: 0.5, alpha: 0.05, sides: 2 }, 0.8));
  });
  test('power, from R\'s pf (and within simulation error of aov with Error(id/c))', () => {
    expect(powerAt(plan(4), 20)).toBeCloseTo(0.7288426, 6);
    expect(powerAt({ design: 'repeated', effect: 0.3, alpha: 0.05, sides: 2, k: 3, rho: 0.7 }, 15)).toBeCloseTo(0.8858583, 6);
  });
});

describe('planning helpers', () => {
  test('the solved n reaches the power and one fewer does not', () => {
    const plan: Plan = { design: 'two-groups', effect: 0.5, alpha: 0.05, sides: 2 };
    expect(powerAt(plan, 64)).toBeGreaterThanOrEqual(0.8);
    expect(powerAt(plan, 63)).toBeLessThan(0.8);
    expect(totalN(plan, 64)).toBe(128);
  });

  test('effect size conversions', () => {
    expect(dzFromD(0.5, 0.5)).toBeCloseTo(0.5, 10);
    expect(dzFromD(0.5, 0.75)).toBeCloseTo(0.7071068, 6);
    expect(fFromMeans([10, 12, 14], 4)).toBeCloseTo(Math.sqrt(8 / 3) / 4, 10);
    expect(fFromEta2(0.0588)).toBeCloseTo(0.25, 2);
    expect(f2FromR2(0.13)).toBeCloseTo(0.1494, 4);
    expect(f2FromR2(0.05, 0.3)).toBeCloseTo(0.0714, 4);
    expect(wFromV(0.2, 3, 4)).toBeCloseTo(0.2828, 4);
  });

  test('an effect too small to study gives no n', () => {
    expect(solveN({ design: 'two-groups', effect: 0.001, alpha: 0.05, sides: 2 }, 0.8)).toBeNull();
  });

  test('the R code names the same inputs', () => {
    const code = rCode({ design: 'regression', effect: 0.15, alpha: 0.05, sides: 2, predictors: 3 }, 'n', 0.8);
    expect(code).toContain('pwr.f2.test(u = 3, f2 = 0.15, sig.level = 0.05, power = 0.8)');
    expect(code).toContain('ceiling(res$v) + 4');
  });
});
