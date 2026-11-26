import type { ExerciseText } from './types';
import { part1 } from './part1';
import { part2 } from './part2';
import { part3 } from './part3';

export const NL_EXERCISES: Record<string, ExerciseText> = { ...part1, ...part2, ...part3 };
