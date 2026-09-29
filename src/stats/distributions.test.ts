import { describe, expect, test } from 'vitest';
import { pchisq, pf, pnorm, pt, qchisqUpper, qfUpper, qnormUpper, qtUpper } from './distributions';

// Printed by R 4.x: sprintf("%.15g", pt(1.5, 10, 0)) and so on.
const R: (string | number)[][] = [
['pt', 1.5, 10, 0, 0.91774633677728],
['pt', -0.7, 3, 0, 0.267163499152382],
['pt', 2.1, 58, 2.8, 0.243202469821043],
['pt', 1.97, 126, 2.8, 0.203955473335556],
['pt', -1.97, 126, 2.8, 1.12091234028e-06],
['pt', 0.3, 5, -1.2, 0.930460824971067],
['pt', 2.5, 400, 20, 4.90898930080756e-69],
['pt', 1.65, 30, 0.1, 0.933596100808969],
['pt', -2, 20, -3, 0.83589892704217],
['pf', 3.1, 2, 57, 9, 0.245296229816306],
['pf', 2.6, 3, 120, 7.5, 0.375775642149186],
['pf', 1.2, 5, 30, 0, 0.667022397553201],
['pf', 4.5, 1, 800, 40, 1.34646353569467e-05],
['pf', 2, 10, 200, 60, 4.29928227020721e-05],
['pchisq', 5.99, 2, 9.6, 0.201430990924574],
['pchisq', 3.84, 1, 0, 0.949956478751295],
['pchisq', 12, 6, 3, 0.765184592514623],
['pchisq', 30, 4, 25, 0.574956960993616],
['pchisq', 9.49, 4, 0.5, 0.923871072117236],
['pnorm', -3, 0.00134989803163009],
['pnorm', -1.2, 0.115069670221708],
['pnorm', 0, 0.5],
['pnorm', 0.5, 0.691462461274013],
['pnorm', 2.4, 0.991802464075404],
['pnorm', -8, 6.22096057427178e-16],
['qt', 0.025, 58, 2.00171748414524],
['qt', 0.05, 3, 2.35336343480183],
['qf', 0.05, 2, 57, 3.15884271926064],
['qchisq', 0.05, 4, 9.48772903678115],
['qnorm', 0.025, 1.95996398454005],
];

// R's noncentral F stops summing at an error of 1e-9 (errmax in pnbeta.c), so
// agreement beyond that is not expected there; everywhere else it is 1e-12.
const close = (got: number, want: number, fn: string) =>
  expect(Math.abs(got - want)).toBeLessThanOrEqual(fn === 'pf' ? 2e-9 : Math.max(1e-12, 1e-9 * Math.abs(want)));

describe('distribution functions match R', () => {
  for (const [fn, ...args] of R) {
    const want = args.pop() as number;
    const a = args as number[];
    test(`${fn}(${a.join(', ')})`, () => {
      const got = {
        pt: () => pt(a[0], a[1], a[2]),
        pf: () => pf(a[0], a[1], a[2], a[3]),
        pchisq: () => pchisq(a[0], a[1], a[2]),
        pnorm: () => pnorm(a[0]),
        qt: () => qtUpper(a[0], a[1]),
        qf: () => qfUpper(a[0], a[1], a[2]),
        qchisq: () => qchisqUpper(a[0], a[1]),
        qnorm: () => qnormUpper(a[0]),
      }[fn as string]!();
      close(got, want, fn as string);
    });
  }
});
