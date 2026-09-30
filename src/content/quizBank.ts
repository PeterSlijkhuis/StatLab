import { isValidElement, type ReactNode } from 'react';
import type { Choice } from '../components/ChoiceBlock';
import type { Progress } from '../state/progress';
import { ALL_LESSONS } from './manifest';
import { mdxComponents } from './mdxComponents';

export type BankQuiz = { lessonId: string; id: string; question: string; choices: Choice[] };

type Content = (props: { components?: unknown }) => ReactNode;
const loaders = import.meta.glob<{ default: Content }>('./lessons/*.mdx');

function Marker() {
  return null;
}

/**
 * The quizzes a lesson contains, read from its compiled MDX rather than kept in
 * a second copy: the lesson is called with a stand-in for Quiz, and the element
 * tree it returns is searched for that stand-in. Nothing is rendered.
 */
export function quizzesIn(content: Content, lessonId: string): BankQuiz[] {
  const found: BankQuiz[] = [];
  const walk = (node: ReactNode): void => {
    if (Array.isArray(node)) node.forEach(walk);
    else if (isValidElement<{ children?: ReactNode; id: string; question: string; choices: Choice[] }>(node)) {
      const { children, id, question, choices } = node.props;
      if (node.type === Marker) found.push({ lessonId, id, question, choices });
      else walk(children);
    }
  };
  walk(content({ components: { ...mdxComponents, Quiz: Marker } }));
  return found;
}

export async function loadQuizzes(lessonIds: string[]): Promise<BankQuiz[]> {
  const lessons = ALL_LESSONS.filter((lesson) => lessonIds.includes(lesson.id));
  const lists = await Promise.all(
    lessons.map(async (lesson) => {
      const loader = loaders[`./lessons/${lesson.file}.mdx`];
      return loader ? quizzesIn((await loader()).default, lesson.id) : [];
    }),
  );
  return lists.flat();
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * A mixed round: questions first answered wrong come first in line, then ones
 * never answered, then the rest, and the round is shuffled so topics
 * interleave. Choices are shuffled too, so an answer can't be remembered by
 * its letter.
 */
export function pickRound(quizzes: BankQuiz[], progress: Progress, size = 10, random = Math.random): BankQuiz[] {
  const state = (quiz: BankQuiz) => progress.lessons[quiz.lessonId]?.quizzes[quiz.id];
  const line = [
    ...shuffle(quizzes.filter((quiz) => state(quiz) === false), random),
    ...shuffle(quizzes.filter((quiz) => state(quiz) === undefined), random),
    ...shuffle(quizzes.filter((quiz) => state(quiz) === true), random),
  ];
  return shuffle(line.slice(0, size), random).map((quiz) => ({ ...quiz, choices: shuffle(quiz.choices, random) }));
}
