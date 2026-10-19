/**
 * Where each module's material sits in the course's sources: chapters of van
 * den Berg's book, and of the BMS guide "Intro R for BMS Bachelor programs".
 * Shown at the top of every lesson so a student can read along.
 */
export const READING: Record<number, { book?: string; guide?: string }> = {
  0: { guide: '1' },
  1: { guide: '1' },
  2: { book: '1', guide: '2' },
  3: { book: '1', guide: '3' },
  4: { book: '1', guide: '3 and 4' },
  5: { book: '1' },
  6: { book: '2' },
  7: { book: '2' },
  8: { book: '2' },
  9: { book: '3 and 14', guide: '3 and 4' },
  10: { book: '4, 5 and 8', guide: '4' },
  11: { book: '4, 5 and 7', guide: '5' },
  12: { book: '6 and 8', guide: '4' },
  13: { book: '9' },
  14: { book: '10, 11 and 12', guide: '5' },
  15: { book: '13 and 14', guide: '5' },
  17: { guide: '6' },
};
