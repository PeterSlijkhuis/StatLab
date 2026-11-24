import { describe, expect, it } from 'vitest';
import { NL } from './nl';
import { translate } from './t';

describe('translate', () => {
  it('looks up Dutch, fills in values, and falls back to English', () => {
    expect(translate('nl', 'Run')).toBe('Uitvoeren');
    expect(translate('nl', 'Lesson {at} of {total}', { at: 2, total: 4 })).toBe('Les 2 van 4');
    expect(translate('nl', 'Not in the dictionary')).toBe('Not in the dictionary');
    expect(translate('en', 'Run')).toBe('Run');
  });

  it('keeps no placeholder the English text lacks, and no em dash', () => {
    for (const [english, dutch] of Object.entries(NL)) {
      const names = (text: string) => text.match(/\{\w+\}/g) ?? [];
      for (const name of names(dutch)) expect(names(english), english).toContain(name);
      expect(dutch, english).not.toContain('—');
    }
  });
});
