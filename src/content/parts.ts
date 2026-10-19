import { MODULES, type ModuleMeta } from './manifest';

/**
 * Spec §7 groups the modules into three parts. Module 0 opens the first, and a
 * fourth part holds the advanced modules that go beyond the core course.
 */
export const PARTS = [
  { title: 'Foundations', blurb: 'Setting up, R, data, summaries and plots', modules: [0, 1, 2, 3, 4] },
  { title: 'Inference', blurb: 'From one sample to the population', modules: [5, 6, 7, 8, 9] },
  { title: 'The linear model', blurb: 'One model, many names', modules: [10, 11, 12, 13, 14, 15] },
  { title: 'Advanced', blurb: 'Beyond the book and the BMS course: Bayesian statistics, mediation and reports', modules: [16, 17], advanced: true },
] as const;

/** The parts to show: the Advanced part only when the student switched it on. */
export function visibleParts(advanced: boolean) {
  return PARTS.filter((part) => advanced || !('advanced' in part));
}

/** The modules of the parts to show. */
export function visibleModules(advanced: boolean): ModuleMeta[] {
  const numbers = visibleParts(advanced).flatMap((part) => [...part.modules] as number[]);
  return MODULES.filter((module) => numbers.includes(module.number));
}

export function partOf(module: ModuleMeta): (typeof PARTS)[number] | undefined {
  return PARTS.find((part) => (part.modules as readonly number[]).includes(module.number));
}
