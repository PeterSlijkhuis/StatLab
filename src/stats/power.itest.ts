// @vitest-environment node
import { WebR } from 'webr';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { ensurePackages } from '../r/session';
import { rCode, solveEffect, solveN, stimulusSimCode, type Plan } from './power';

/**
 * The sample size page shows R code that should give the same answer as the
 * page. This runs that code in real R with the pwr package, for every design
 * and both questions the page answers.
 */

let webR: WebR;

beforeAll(async () => {
  webR = new WebR();
  await webR.init();
  await ensurePackages(webR, ['pwr']);
}, 300_000);

afterAll(async () => {
  await webR.close();
});

const PLANS: Plan[] = [
  { design: 'two-groups', effect: 0.45, alpha: 0.05, sides: 2 },
  { design: 'two-groups', effect: 0.3, alpha: 0.01, sides: 1 },
  { design: 'paired', effect: 0.35, alpha: 0.05, sides: 2 },
  { design: 'one-sample', effect: 0.6, alpha: 0.05, sides: 1 },
  { design: 'anova', effect: 0.2, alpha: 0.05, sides: 2, k: 4 },
  { design: 'repeated', effect: 0.25, alpha: 0.05, sides: 2, k: 4, rho: 0.5 },
  { design: 'repeated', effect: 0.15, alpha: 0.01, sides: 2, k: 3, rho: 0.7 },
  { design: 'factorial', effect: 0.25, alpha: 0.05, sides: 2, layout: 'between', which: 'main' },
  { design: 'factorial', effect: 0.15, alpha: 0.05, sides: 2, layout: 'mixed', which: 'interaction', rho: 0.5 },
  { design: 'factorial', effect: 0.2, alpha: 0.01, sides: 2, layout: 'within', which: 'interaction', rho: 0.7 },
  { design: 'correlation', effect: 0.25, alpha: 0.05, sides: 2 },
  { design: 'correlation', effect: 0.2, alpha: 0.05, sides: 1 },
  { design: 'regression', effect: 0.1, alpha: 0.05, sides: 2, predictors: 4 },
  { design: 'r2-change', effect: 0.04, alpha: 0.05, sides: 2, predictors: 5, added: 2 },
  { design: 'proportions', effect: 0.35, alpha: 0.05, sides: 2, p1: 0.2 },
  { design: 'proportions', effect: 0.6, alpha: 0.05, sides: 1, p1: 0.5 },
  { design: 'chi-square', effect: 0.25, alpha: 0.05, sides: 2, df: 3 },
];

/** The number the printed result leads with: n (or N, or v turned into people), or the effect. */
async function runAndRead(code: string, plan: Plan, solveFor: 'n' | 'effect'): Promise<number> {
  const lines = code.split('\n');
  // The regression code ends with the number of people; every other call returns a power.htest.
  // The repeated-measures and 2 × 2 code is base R and ends with its answer.
  if (plan.design === 'repeated' || plan.design === 'factorial') return webR.evalRNumber(`local({\n${code}\n})`);
  if (solveFor === 'n' && (plan.design === 'regression' || plan.design === 'r2-change')) {
    return webR.evalRNumber(`local({\n${lines.filter((l) => !/^res$|^#/.test(l)).join('\n')}\n})`);
  }
  const field = solveFor === 'n'
    ? (plan.design === 'chi-square' ? 'N' : 'n')
    : ({ 'two-groups': 'd', paired: 'd', repeated: 'f', factorial: 'f', 'one-sample': 'd', anova: 'f', correlation: 'r', regression: 'f2', 'r2-change': 'f2', proportions: 'p2', 'chi-square': 'w' } as const)[plan.design];
  const call = lines.filter((l) => !l.startsWith('library')).join('\n');
  const value = await webR.evalRNumber(`local({ library(pwr); (${call})$${field} })`);
  return solveFor === 'n' ? Math.ceil(value) : value;
}

describe('the R code on the sample size page gives the page\'s answer', () => {
  for (const plan of PLANS) {
    test(`${plan.design}: n for 80% power (${JSON.stringify(plan)})`, async () => {
      const code = rCode(plan, 'n', 0.8);
      expect(await runAndRead(code, plan, 'n')).toBe(solveN(plan, 0.8));
    });

    test(`${plan.design}: effect detectable with a fixed n (${JSON.stringify(plan)})`, async () => {
      const n = plan.design === 'regression' || plan.design === 'r2-change' ? 120 : 60;
      const code = rCode(plan, 'effect', 0.8, n);
      expect(await runAndRead(code, plan, 'effect')).toBeCloseTo(solveEffect(plan, n, 0.8)!, 3);
    });
  }
});

test('the stimulus simulation runs and returns a power', async () => {
  await ensurePackages(webR, ['lmerTest']);
  const code = stimulusSimCode(12, 3, 3, 0.4, 3);
  const power = await webR.evalRNumber(`local({\n${code}\n})`);
  expect(power).toBeGreaterThanOrEqual(0);
  expect(power).toBeLessThanOrEqual(1);
}, 300_000);
