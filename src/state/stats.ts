import { ALL_LESSONS, MODULES, type LessonMeta, type ModuleMeta } from '../content/manifest';
import { currentStreak, type Progress } from './progress';

export type LessonStatus = 'new' | 'started' | 'complete';

/**
 * Complete means every exercise the lesson contains is passed, not merely
 * every exercise the student happens to have touched. A lesson with no
 * exercises is complete once visited.
 */
export function lessonStatus(lesson: LessonMeta, progress: Progress): LessonStatus {
  const record = progress.lessons[lesson.id];
  if (!record) return 'new';
  const complete =
    lesson.exercises.length === 0
      ? Boolean(record.visitedAt)
      : lesson.exercises.every((id) => record.exercises[id] === 'passed');
  return complete ? 'complete' : 'started';
}

export function exercisesPassed(lesson: LessonMeta, progress: Progress): number {
  const record = progress.lessons[lesson.id];
  return record ? lesson.exercises.filter((id) => record.exercises[id] === 'passed').length : 0;
}

export function moduleProgress(module: ModuleMeta, progress: Progress): { done: number; total: number } {
  return {
    done: module.lessons.filter((lesson) => lessonStatus(lesson, progress) === 'complete').length,
    total: module.lessons.length,
  };
}

/** What each thing is worth, so the numbers on screen add up the same way everywhere. */
export const POINTS = { exercise: 10, quiz: 5, lesson: 20 } as const;

export type CourseStats = {
  lessonsComplete: number;
  lessonsTotal: number;
  exercisesPassed: number;
  exercisesTotal: number;
  points: number;
  streak: number;
};

export function courseStats(progress: Progress, lessons: LessonMeta[] = ALL_LESSONS): CourseStats {
  const completeIn = (list: LessonMeta[]) => list.filter((lesson) => lessonStatus(lesson, progress) === 'complete').length;
  const passedIn = (list: LessonMeta[]) => list.reduce((sum, lesson) => sum + exercisesPassed(lesson, progress), 0);
  const quizzesRight = Object.values(progress.lessons).reduce(
    (sum, lesson) => sum + Object.values(lesson.quizzes).filter(Boolean).length,
    0,
  );
  // Points count every lesson, shown or not, so hiding a part never takes back
  // points a student has already earned or spent.
  return {
    lessonsComplete: completeIn(lessons),
    lessonsTotal: lessons.length,
    exercisesPassed: passedIn(lessons),
    exercisesTotal: lessons.reduce((sum, lesson) => sum + lesson.exercises.length, 0),
    points: passedIn(ALL_LESSONS) * POINTS.exercise + quizzesRight * POINTS.quiz + completeIn(ALL_LESSONS) * POINTS.lesson + (progress.bonus ?? 0),
    streak: currentStreak(progress),
  };
}

/** The first lesson not yet complete, for a student with no lesson to resume. */
export function firstUnfinished(progress: Progress): LessonMeta | undefined {
  return ALL_LESSONS.find((lesson) => lessonStatus(lesson, progress) !== 'complete');
}

export function moduleOf(lessonId: string): ModuleMeta | undefined {
  return MODULES.find((module) => module.lessons.some((lesson) => lesson.id === lessonId));
}
