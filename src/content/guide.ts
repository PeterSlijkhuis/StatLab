import { allAnswers } from '../pages/modelTree';
import { matchQuestion } from '../pages/questionMatcher';
import { LESSON_KEYWORDS, PAGE_ENTRIES } from './guideIndex';
import { findLesson, MODULES } from './manifest';

/** A place on the site the helper can send a student to. */
export type GuideHit = { to: string; title: string; detail: string };

type Entry = GuideHit & { titleWords: Set<string>; words: Set<string> };

const STOP = new Set('a an and are as at be by can do does for from how i in is it me my of on or should the to use what when where which with you your want need about'.split(' '));

/** Lower case, spelling variants joined, punctuation dropped, a plural s removed. */
export function words(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/\bt[\s-]?tests?\b/g, 'ttest')
    .replace(/\bchi[\s-]?squared?\b/g, 'chisquare')
    .replace(/\bp[\s-]?values?\b/g, 'pvalue')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 1 && !STOP.has(word))
    .map((word) => (word.length > 4 && word.endsWith('ies') ? `${word.slice(0, -3)}y` : word.length > 3 && word.endsWith('s') && !word.endsWith('ss') ? word.slice(0, -1) : word));
}

const ENTRIES: Entry[] = [
  ...MODULES.flatMap((module) =>
    module.lessons.map((lesson) => ({
      to: `/lesson/${lesson.id}`,
      title: `Lesson ${lesson.id.replace(/^0/, '')}: ${lesson.title}`,
      detail: `Module ${module.number}: ${module.title}`,
      titleWords: new Set(words(lesson.title)),
      words: new Set(words(`${module.title} ${LESSON_KEYWORDS[lesson.id] ?? ''}`)),
    })),
  ),
  ...PAGE_ENTRIES.map((page) => ({
    to: page.path,
    title: page.title,
    detail: page.what,
    titleWords: new Set(words(page.title)),
    words: new Set(words(page.keywords)),
  })),
];

function score(entry: Entry, query: string[]): number {
  let total = 0;
  for (const word of query) {
    // Title and keywords count the same, so ties go to the earlier lesson, where a topic is taught first.
    if (entry.titleWords.has(word) || entry.words.has(word)) total += 2;
    else if (word.length >= 4 && [...entry.titleWords, ...entry.words].some((w) => w.length >= 4 && (w.startsWith(word) || word.startsWith(w)))) total += 1;
  }
  return total;
}

/** Up to four places that fit what the student typed, best first. */
export function guide(text: string): GuideHit[] {
  const query = words(text);
  if (query.length === 0) return [];
  const hits: GuideHit[] = ENTRIES.map((entry) => ({ entry, points: score(entry, query) }))
    .filter((scored) => scored.points > 0)
    .sort((a, b) => b.points - a.points)
    .slice(0, 4)
    .map(({ entry: { to, title, detail } }) => ({ to, title, detail }));
  // A research question: also name the analysis the model chooser would suggest.
  const [best] = query.length >= 3 ? matchQuestion(text).suggestions : [];
  const answer = best && allAnswers().find((entry) => entry.answer.id === best.id)?.answer;
  if (answer) {
    const lesson = answer.lessonId ? findLesson(answer.lessonId) : undefined;
    const teaching: GuideHit[] = lesson ? [{ to: `/lesson/${lesson.id}`, title: `Lesson ${lesson.id.replace(/^0/, '')}: ${lesson.title}`, detail: `Where the course teaches ${answer.model.toLowerCase()}` }] : [];
    const rest = hits.filter((hit) => !teaching.some((t) => t.to === hit.to));
    return [{ to: `/which-model?model=${answer.id}`, title: `Likely analysis: ${answer.model}`, detail: 'Suggested from the words in your question. The model chooser explains it.' }, ...teaching, ...rest].slice(0, 4);
  }
  return hits;
}
