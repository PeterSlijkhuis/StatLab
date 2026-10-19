import { useSyncExternalStore } from 'react';

/**
 * Whether the Advanced part of the course (Modules 16 and 17) is shown. The
 * core course follows the BMS Research Methods and Statistics courses; the
 * advanced modules go beyond them, so they stay hidden until a student asks.
 */
const ADVANCED_KEY = 'statlab.advanced';

const listeners = new Set<() => void>();

export function getAdvanced(): boolean {
  try {
    return localStorage.getItem(ADVANCED_KEY) === 'on';
  } catch {
    return false;
  }
}

export function setAdvanced(on: boolean): void {
  try {
    localStorage.setItem(ADVANCED_KEY, on ? 'on' : 'off');
  } catch {
    // Private mode: nothing is saved, and the setting falls back to off.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useAdvanced(): boolean {
  return useSyncExternalStore(subscribe, getAdvanced);
}
