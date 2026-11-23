import { useSyncExternalStore } from 'react';

export type Language = 'en' | 'nl';

const LANGUAGE_KEY = 'statlab.language';
const listeners = new Set<() => void>();

export function getLanguage(): Language {
  try {
    return localStorage.getItem(LANGUAGE_KEY) === 'nl' ? 'nl' : 'en';
  } catch {
    return 'en';
  }
}

export function setLanguage(language: Language): void {
  try {
    localStorage.setItem(LANGUAGE_KEY, language);
  } catch {
    // Private mode: the choice holds for this visit only.
  }
  document.documentElement.lang = language;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useLanguage(): Language {
  return useSyncExternalStore(subscribe, getLanguage);
}
