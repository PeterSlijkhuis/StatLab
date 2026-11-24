import { getLanguage, useLanguage, type Language } from '../state/language';
import { NL } from './nl';

/**
 * Interface text is written in English in the components and looked up here by
 * that same English text. A string without a Dutch entry shows in English, so
 * a missing translation is never an empty button.
 */
export function translate(language: Language, english: string, values?: Record<string, string | number>): string {
  const text = language === 'nl' ? (NL[english] ?? english) : english;
  return values ? text.replace(/\{(\w+)\}/g, (match: string, name: string) => (name in values ? String(values[name]) : match)) : text;
}

/** For code outside React, such as toasts. */
export const t = (english: string, values?: Record<string, string | number>) => translate(getLanguage(), english, values);

/** Re-renders the component when the student switches language. */
export function useT() {
  const language = useLanguage();
  return (english: string, values?: Record<string, string | number>) => translate(language, english, values);
}
