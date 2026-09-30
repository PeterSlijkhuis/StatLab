import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import './Tour.css';

export const TOUR_KEY = 'statlab.tour.v1';
const RESTART = 'statlab:tour';

/** Opens the tour again, from anywhere (the helper's "Show me around" button). */
export function startTour() {
  window.dispatchEvent(new Event(RESTART));
}

type Step = { target?: string; title: string; text: string };

/**
 * Each step points at one part of the page. A step whose target is missing or
 * off screen (the sidebar on a phone, the Continue button off the home page)
 * is left out, so one list serves every page and screen size.
 */
export const STEPS: Step[] = [
  { title: 'Welcome to StatLab', text: 'A quick tour of where everything is. Skip it whenever you like; the helper in the corner can show it again.' },
  { target: '.topbar-menu', title: 'The lessons', text: 'On a small screen the modules, your avatar and the tools live behind this button.' },
  { target: '.sidebar-part', title: 'The modules', text: 'The course, in order: open a module to see its lessons. A tick means you finished it.' },
  { target: '.sidebar-avatar', title: 'Your avatar', text: 'Design it, then spend your points in the shop. It also explains your mistakes in the exercises.' },
  { target: '.sidebar-stats', title: 'Streak and points', text: 'Days in a row, points earned, and lessons done. Exercises, questions and finished lessons all earn points.' },
  { target: '.sidebar-reference', title: 'Reference tools', text: 'Which model to use, how many participants you need, a review quiz, and an R Workspace for your own data.' },
  { target: '.hero-cta', title: 'Where to start', text: 'This button always opens your next lesson, so you never have to look for where you left off.' },
  { target: '.site-guide-button', title: 'Lost? Ask your avatar', text: 'Type what you are looking for, like "compare two groups", and it points you to the right lesson or tool.' },
  { target: '.r-status', title: 'R, in your browser', text: 'R starts here on its own, which takes a moment the first time. If it ever stops responding, press Restart R.' },
  { title: 'You are all set', text: 'Everything runs in your browser and your progress stays on this computer. Have fun!' },
];

function visible(selector?: string): Element | null {
  if (!selector) return null;
  const element = document.querySelector(selector);
  if (!element) return null;
  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0 && rect.right > 0 && rect.left < window.innerWidth ? element : null;
}

function seen(): boolean {
  try {
    return localStorage.getItem(TOUR_KEY) === 'done';
  } catch {
    return true; // No storage: showing the tour on every page load would be worse than never.
  }
}

export default function Tour() {
  const [steps, setSteps] = useState<Step[] | null>(null);
  const [at, setAt] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const card = useRef<HTMLDivElement>(null);
  const primary = useRef<HTMLButtonElement>(null);
  const id = useId();

  const open = useCallback(() => {
    // Measured at the start: steps whose target is not on this page drop out.
    setSteps(STEPS.filter((step) => !step.target || visible(step.target)));
    setAt(0);
  }, []);

  useEffect(() => {
    // After the first paint, so the sidebar and home page are there to point at.
    const timer = window.setTimeout(() => { if (!seen()) open(); }, 400);
    window.addEventListener(RESTART, open);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(RESTART, open);
    };
  }, [open]);

  const step = steps?.[at];

  useLayoutEffect(() => {
    if (!step) return;
    const element = visible(step.target);
    element?.scrollIntoView({ block: 'nearest' });
    const measure = () => setRect(visible(step.target)?.getBoundingClientRect() ?? null);
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [step]);

  useEffect(() => primary.current?.focus(), [step]);

  if (!steps || !step) return null;

  function finish() {
    try {
      localStorage.setItem(TOUR_KEY, 'done');
    } catch {
      // Nothing to do: the tour simply shows again next time.
    }
    setSteps(null);
  }

  const last = at === steps.length - 1;
  const pad = 6;
  const width = Math.min(340, window.innerWidth - 32);
  let place: React.CSSProperties = { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' };
  if (rect) {
    const clampLeft = (x: number) => Math.max(16, Math.min(x, window.innerWidth - width - 16));
    const height = card.current?.offsetHeight ?? 200;
    const clampTop = (y: number) => Math.max(16, Math.min(y, window.innerHeight - height - 16));
    if (rect.right + pad + 16 + width < window.innerWidth - 16 && rect.width < window.innerWidth / 2) {
      place = { left: rect.right + pad + 16, top: clampTop(rect.top) };
    } else if (window.innerHeight - rect.bottom > height + 32) {
      place = { left: clampLeft(rect.left), top: rect.bottom + pad + 12 };
    } else {
      place = { left: clampLeft(rect.right - width), top: clampTop(rect.top - pad - 12 - height) };
    }
  }

  return (
    <div className="tour" onKeyDown={(e) => { if (e.key === 'Escape') finish(); }}>
      {rect ? (
        <div
          className="tour-spotlight"
          style={{ left: rect.left - pad, top: rect.top - pad, width: rect.width + 2 * pad, height: rect.height + 2 * pad }}
          aria-hidden="true"
        />
      ) : (
        <div className="tour-dim" aria-hidden="true" />
      )}
      <div
        ref={card}
        className="tour-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-text`}
        style={{ ...place, width }}
      >
        <p className="tour-count">{at + 1} of {steps.length}</p>
        <h2 id={`${id}-title`}>{step.title}</h2>
        <p id={`${id}-text`}>{step.text}</p>
        <div className="tour-actions">
          {!last && <button type="button" className="tour-skip" onClick={finish}>Skip tour</button>}
          {at > 0 && <button type="button" className="button-secondary" onClick={() => setAt(at - 1)}>Back</button>}
          <button ref={primary} type="button" className="button-primary" onClick={() => (last ? finish() : setAt(at + 1))}>
            {last ? 'Start learning' : at === 0 ? 'Show me around' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
