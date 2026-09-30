import { useEffect, useId, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { guide } from '../content/guide';
import { ALL_LESSONS, findLesson } from '../content/manifest';
import { currentLook } from '../state/avatar';
import { getProgress, lastVisitedLesson } from '../state/progress';
import Avatar from './Avatar';
import { startTour } from './Tour';
import './SiteGuide.css';

const STARTERS = ['I am new to R', 'Which test do I need?', 'How many participants?', 'Make a plot'];

/**
 * The student's avatar in the corner of every page: type a few words and it
 * suggests a lesson or page. Keyword matching only (the site has no server);
 * see src/content/guide.ts.
 */
export default function SiteGuide() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const { pathname } = useLocation();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const id = useId();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  function close() {
    setOpen(false);
    buttonRef.current?.focus();
  }

  const hits = guide(text);
  const last = findLesson(lastVisitedLesson() ?? '') ?? ALL_LESSONS[0];

  return (
    <div className={pathname === '/workspace' ? 'site-guide site-guide-compact' : 'site-guide'}>
      {open && (
        <section
          className="site-guide-panel"
          role="dialog"
          aria-labelledby={`${id}-title`}
          onKeyDown={(e) => { if (e.key === 'Escape') close(); }}
        >
          <div className="site-guide-head">
            <p id={`${id}-title`} className="site-guide-title">Where do you want to go?</p>
            <button type="button" className="site-guide-close" aria-label="Close" onClick={close}>×</button>
          </div>
          <label className="visually-hidden" htmlFor={`${id}-input`}>Type a topic or a question</label>
          <input
            id={`${id}-input`}
            ref={inputRef}
            className="site-guide-input"
            placeholder="e.g. t-test, make a plot, how many participants"
            value={text}
            onChange={(e) => setText(e.target.value)}
            autoComplete="off"
          />
          {text.trim() === '' ? (
            <>
              <Link className="site-guide-hit" to={`/lesson/${last.id}`}>
                <strong>{lastVisitedLesson() ? 'Carry on' : 'Start here'}: Lesson {last.id.replace(/^0/, '')}</strong>
                <span>{last.title}</span>
              </Link>
              <p className="site-guide-note">Or try:</p>
              <div className="site-guide-starters">
                {STARTERS.map((starter) => (
                  <button key={starter} type="button" onClick={() => { setText(starter); inputRef.current?.focus(); }}>{starter}</button>
                ))}
              </div>
              <button type="button" className="site-guide-tour" onClick={() => { setOpen(false); startTour(); }}>Show me around the site</button>
            </>
          ) : hits.length > 0 ? (
            <ul className="site-guide-hits" aria-live="polite">
              {hits.map((hit) => (
                <li key={hit.to}>
                  <Link className="site-guide-hit" to={hit.to}>
                    <strong>{hit.title}</strong>
                    <span>{hit.detail}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="site-guide-note" aria-live="polite">
              I could not match that. Try a topic such as "regression" or "boxplot", or ask <Link to="/which-model">which model to use</Link>.
            </p>
          )}
        </section>
      )}
      <button
        ref={buttonRef}
        type="button"
        className="site-guide-button"
        aria-expanded={open}
        aria-label="Where to? Find a lesson or page"
        onClick={() => (open ? close() : setOpen(true))}
      >
        <Avatar look={currentLook(getProgress())} size={48} />
        <span className="site-guide-label" aria-hidden="true">Where to?</span>
      </button>
    </div>
  );
}
