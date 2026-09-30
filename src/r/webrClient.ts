import { WebR } from 'webr';
import { dependencies } from '../../package.json';

/**
 * The webR release in package.json, so bumping it there is the only edit. The
 * npm package and the runtime on the CDN must be the same release, which is
 * why package.json pins it exactly.
 */
export const WEBR_VERSION = `v${dependencies.webr}`;
export const WEBR_BASE_URL = `https://webr.r-wasm.org/${WEBR_VERSION}/`;

export type RStatus = {
  phase: 'idle' | 'booting' | 'installing' | 'ready' | 'error';
  detail?: string;
};

let instance: WebR | null = null;
let booting: Promise<WebR> | null = null;
let status: RStatus = { phase: 'idle' };
const listeners = new Set<(s: RStatus) => void>();
const restartListeners = new Set<() => void>();

export function getStatus(): RStatus {
  return status;
}

export function setStatus(next: RStatus): void {
  status = next;
  for (const fn of listeners) fn(status);
}

export function onStatus(fn: (s: RStatus) => void): () => void {
  listeners.add(fn);
  fn(status);
  return () => listeners.delete(fn);
}

export function getWebR(): Promise<WebR> {
  if (instance) return Promise.resolve(instance);
  if (booting) return booting;

  setStatus({ phase: 'booting' });
  booting = (async () => {
    const webR = new WebR({ baseUrl: WEBR_BASE_URL });
    try {
      await webR.init();
    } catch (err) {
      booting = null;
      setStatus({ phase: 'error', detail: String(err) });
      throw err;
    }
    instance = webR;
    return webR;
  })();

  return booting;
}


/** Called on every restart, so anything cached per webR instance can forget it. */
export function onRestart(fn: () => void): () => void {
  restartListeners.add(fn);
  return () => restartListeners.delete(fn);
}

/**
 * Throws the running R away and starts a fresh one, without reloading the page.
 * webR's PostMessage channel cannot interrupt running R code, but closing ends
 * the worker even in the middle of a student's infinite loop. Listeners reset
 * their per-instance caches and remount what held the old R; code drafts live
 * in localStorage, so nothing typed is lost.
 */
export function restartR(): void {
  const old = instance;
  instance = null;
  booting = null;
  old?.close();
  for (const fn of restartListeners) fn();
}
