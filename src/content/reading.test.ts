import { describe, expect, test } from 'vitest';
import { ALL_LESSONS, MODULES } from './manifest';
import { BOOK_CHAPTERS, READING } from './reading';

describe('read-along references', () => {
  test('every chapter of the online book is read along with at least one lesson', () => {
    const used = new Set(Object.values(READING).flatMap((reading) => reading.book ?? []));
    BOOK_CHAPTERS.forEach((_, index) => expect(used, `chapter ${index + 1}`).toContain(index + 1));
  });

  test('every reference names a real lesson and a real chapter', () => {
    const ids = new Set(ALL_LESSONS.map((lesson) => lesson.id));
    for (const [id, reading] of Object.entries(READING)) {
      expect(ids, id).toContain(id);
      for (const chapter of reading.book ?? []) expect(chapter >= 1 && chapter <= BOOK_CHAPTERS.length, `${id} chapter ${chapter}`).toBe(true);
    }
  });

  test('every lesson in the core course has something to read along', () => {
    for (const module of MODULES.filter((m) => m.number <= 15)) {
      for (const lesson of module.lessons) expect(READING[lesson.id], lesson.id).toBeDefined();
    }
  });
});
