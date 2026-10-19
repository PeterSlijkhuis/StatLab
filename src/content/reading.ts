/** The online version of van den Berg's book, one page per chapter. */
export const BOOK_BASE = 'https://019c2310-d1f3-c202-b65d-2af52db09a6c.share.connect.posit.cloud/';

/** The online book's chapter pages, in order: chapter 1 is intro.html. */
export const BOOK_CHAPTERS = [
  'intro', 'mean', 'prop', 'simple', 'inf-lm', 'categorical', 'assumptions', 'nonpar1',
  'moderation', 'contrasts', 'post-hoc', 'mixed', 'premidpost', 'nonpar2', 'logistic', 'poissonrevised',
] as const;

/** The online book's appendices. */
export const BOOK_APPENDICES = { normal: 'appnormal', t: 'appt', matrix: 'matrix' } as const;

export function bookChapterHref(chapter: number): string {
  return `${BOOK_BASE}${BOOK_CHAPTERS[chapter - 1]}.html`;
}

export type Reading = {
  book?: number[];
  appendix?: (keyof typeof BOOK_APPENDICES)[];
  /** Chapters of the BMS guide "Intro R for BMS Bachelor programs". */
  guide?: string;
  /** Sections of van der Kolk's short guide to research questions, hypotheses and crosstabs. */
  shortGuide?: string;
};

/**
 * Where each lesson's material sits in the course's sources: chapters of the
 * online book, of the BMS guide "Intro R for BMS Bachelor programs", and
 * sections of the research methods course's short guide.
 * Shown at the top of the lesson so a student can read along. A lesson the
 * sources do not cover (the advanced modules, mostly) has no entry.
 */
export const READING: Record<string, Reading> = {
  'rm-1': { shortGuide: '1 and 2' },
  'rm-2': { book: [1], shortGuide: '3 and 4' },
  'rm-3': { book: [2] },
  'rm-4': { book: [4], shortGuide: '3 and 5' },
  'rm-5': { shortGuide: '1' },
  '00-1': { guide: '1' },
  '00-2': { guide: '1' },
  '00-3': { guide: '1' },
  '00-4': { guide: '1' },
  '01-1': { guide: '1' },
  '01-2': { guide: '1' },
  '01-3': { guide: '1' },
  '02-1': { book: [1], guide: '1 and 2' },
  '02-2': { guide: '1 and 2' },
  '02-3': { book: [1], guide: '2' },
  '02-4': { guide: '2' },
  '03-1': { book: [1], guide: '3' },
  '03-2': { book: [1], guide: '3' },
  '03-3': { book: [1], guide: '3' },
  '03-4': { guide: '6' },
  '04-1': { book: [1], guide: '3' },
  '04-2': { book: [1], guide: '4 and 5' },
  '04-3': { book: [1], guide: '4' },
  '05-1': { book: [1], appendix: ['normal'] },
  '05-2': { book: [1], appendix: ['normal'] },
  '05-3': { book: [1], appendix: ['normal'] },
  '06-1': { book: [2] },
  '06-2': { book: [2] },
  '06-3': { book: [2] },
  '07-1': { book: [2], appendix: ['t'] },
  '07-2': { book: [2] },
  '07-3': { book: [2] },
  '08-1': { book: [2] },
  '08-2': { book: [2], appendix: ['t'], guide: '3' },
  '08-3': { book: [2] },
  '08-4': { book: [2] },
  '09-1': { book: [3], guide: '3' },
  '09-2': { book: [1], guide: '4' },
  '09-3': { book: [16], guide: '3 and 4' },
  '10-1': { book: [4], guide: '4' },
  '10-2': { book: [4], guide: '4' },
  '10-3': { book: [5], guide: '5' },
  '10-4': { book: [8], guide: '4' },
  '11-1': { book: [4], guide: '5' },
  '11-2': { book: [4] },
  '11-3': { book: [5], guide: '5' },
  '11-4': { book: [7], guide: '5' },
  '12-1': { book: [6], guide: '4' },
  '12-2': { book: [6, 10], guide: '4' },
  '12-3': { book: [11] },
  '12-4': { book: [8], guide: '4' },
  '13-1': { book: [9] },
  '13-2': { book: [9, 10] },
  '13-3': { book: [9] },
  '14-1': { book: [12] },
  '14-2': { book: [12], guide: '5' },
  '14-3': { book: [12], guide: '5' },
  '14-4': { book: [13], guide: '5' },
  '14-5': { book: [14], guide: '5' },
  '15-1': { book: [15] },
  '15-2': { book: [15], guide: '5' },
  '15-3': { book: [15] },
  '15-4': { book: [16], guide: '5' },
  '17-2': { guide: '6' },
};

export function bookAppendixHref(key: keyof typeof BOOK_APPENDICES): string {
  return `${BOOK_BASE}${BOOK_APPENDICES[key]}.html`;
}

export const APPENDIX_NAMES: Record<keyof typeof BOOK_APPENDICES, string> = {
  normal: 'appendix on the normal distribution',
  t: 'appendix on the t-distribution',
  matrix: 'appendix on matrix algebra',
};
