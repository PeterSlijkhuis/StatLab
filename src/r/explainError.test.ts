import { describe, expect, test } from 'vitest';
import { explainRError } from './explainError';

describe('explainRError', () => {
  test('names the object R could not find, with or without the Error in prefix', () => {
    expect(explainRError("object 'wellbeng' not found")).toMatch(/anything called "wellbeng"/);
    expect(explainRError('Error in eval(expr, envir): object ‘Age’ not found')).toMatch(/"Age"/);
  });

  test('explains a missing function and a missing package', () => {
    expect(explainRError('could not find function "ggplt"')).toMatch(/no function called ggplt\(\)/);
    expect(explainRError("there is no package called 'dplr'")).toMatch(/dplr is not installed/);
  });

  test('explains the common syntax slips', () => {
    expect(explainRError('<text>:2:0: unexpected end of input')).toMatch(/bracket or a quote/);
    expect(explainRError('<text>:1:8: unexpected symbol')).toMatch(/comma is missing/);
    expect(explainRError("<text>:1:9: unexpected ')'")).toMatch(/bracket/);
    expect(explainRError('non-numeric argument to binary operator')).toMatch(/not a number/);
  });

  test('falls back to a general nudge for anything else', () => {
    expect(explainRError('something nobody has seen before')).toMatch(/R stopped at an error/);
  });
});
