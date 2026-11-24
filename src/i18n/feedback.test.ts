import { afterEach, describe, expect, it } from 'vitest';
import { setLanguage } from '../state/language';
import { translateFeedback } from './feedback';

afterEach(() => setLanguage('en'));

describe('translateFeedback', () => {
  it('leaves English alone', () => {
    expect(translateFeedback('I could not find an object called alpha.')).toBe('I could not find an object called alpha.');
  });

  it('translates fixed pieces and keeps the numbers, with a decimal comma', () => {
    setLanguage('nl');
    expect(translateFeedback('I could not find an object called alpha.')).toBe('Ik kon geen object met de naam alpha vinden.');
    expect(translateFeedback('Correct: 4.07. Read it back left to right: scores, and then the mean without the NA, and then round to two decimals. round(mean(scores, na.rm = TRUE), 2) says the same thing inside out.')).toContain('Juist: 4,07.');
    expect(translateFeedback('Correct: 12.5 employees are above the line. That is a list of cases to look at, not a list of cases to delete.')).toBe('Juist: 12,5 medewerkers zitten boven de lijn. Dat is een lijst met gevallen om naar te kijken, niet een lijst met gevallen om te verwijderen.');
  });
});
