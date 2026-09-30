import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { findLesson } from '../content/manifest';
import { allAnswers, follow, GROUPS, packagesDownloaded, packagesMissingHere, pathTo, SHIPS_WITH_R, TREE, type Answer, type Node } from './modelTree';
import { CUES, matchQuestion, type CueId } from './questionMatcher';
import './ModelChooser.css';

export { TREE, type Answer, type Node } from './modelTree';

/**
 * The link to a lesson. findLesson reads MODULES, which holds only modules
 * whose lesson files all exist, so a lessonId added before its module is
 * written resolves to undefined. The link still works in that case, since the
 * route renders its own not-found state, but it loses its title, which is
 * what ModelChooser.test.tsx watches for.
 */
function LessonLink({ lessonId, lead }: { lessonId: string; lead: string }) {
  const lesson = findLesson(lessonId);
  return <Link to={`/lesson/${lessonId}`}>{lesson ? `${lead}: ${lesson.title}` : lead}</Link>;
}

function Badges({ answer }: { answer: Answer }) {
  const runsHere = packagesMissingHere(answer).length === 0;
  return (
    <p className="model-chooser-badges">
      <span className={`model-badge ${answer.lessonId ? 'taught' : 'beyond'}`}>
        {answer.lessonId ? 'Taught in this course' : 'Beyond this course'}
      </span>
      <span className={`model-badge ${runsHere ? 'runs-here' : 'rstudio'}`}>{runsHere ? 'Runs in the R Workspace' : 'Needs RStudio'}</span>
    </p>
  );
}

function list(names: string[]): string {
  return names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

/** Where the snippet runs, and what it takes to get there. */
export function WhereItRuns({ answer }: { answer: Answer }) {
  const missing = packagesMissingHere(answer);
  if (missing.length === 0) {
    const installs = packagesDownloaded(answer);
    return (
      <p>
        <strong>Where to run it:</strong> in the <Link to="/workspace">R Workspace</Link>, once d holds your data.
        {installs.length > 0 && ` The first run downloads ${list(installs)}, which takes a moment.`}
      </p>
    );
  }
  const bundled = missing.filter((name) => SHIPS_WITH_R.includes(name));
  const toInstall = missing.filter((name) => !SHIPS_WITH_R.includes(name));
  return (
    <p>
      <strong>Where to run it:</strong> in RStudio, because this site does not have {list(missing)}.
      {bundled.length > 0 && ` ${list(bundled)} ${bundled.length > 1 ? 'come' : 'comes'} with R, so RStudio already has ${bundled.length > 1 ? 'them' : 'it'}.`}
      {toInstall.length > 0 && (
        <>
          {' '}
          Install {toInstall.length > 1 ? 'them' : 'it'} once with{' '}
          <code>install.packages({toInstall.length > 1 ? `c(${toInstall.map((name) => `"${name}"`).join(', ')})` : `"${toInstall[0]}"`})</code>.
        </>
      )}
    </p>
  );
}

function AnswerCard({ answer }: { answer: Answer }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(answer.rCode);
      setCopied(true);
    } catch {
      // No clipboard permission: the code is on screen to copy by hand.
    }
  }
  useEffect(() => setCopied(false), [answer]);

  return (
    <>
      <Badges answer={answer} />
      <p>
        <strong>When to use it:</strong> {answer.when}
      </p>
      <div className="model-chooser-code">
        <pre>
          <code>{answer.rCode}</code>
        </pre>
        <button type="button" className="button-secondary" onClick={() => void copy()}>
          {copied ? 'Copied' : 'Copy code'}
        </button>
      </div>
      <p>
        <strong>Check first:</strong> {answer.check}
      </p>
      {answer.traditional && (
        <p>
          <strong>Traditional name:</strong> {answer.traditional}
        </p>
      )}
      <p>
        <strong>How to read it:</strong> {answer.note}
      </p>
      <WhereItRuns answer={answer} />
      {answer.lessonId ? (
        <p className="model-chooser-lesson">
          <LessonLink lessonId={answer.lessonId} lead="Go to the lesson" />
        </p>
      ) : (
        <>
          {answer.further && (
            <p>
              <strong>Learn more:</strong> {answer.further}
            </p>
          )}
          {answer.buildsOn && (
            <p className="model-chooser-lesson">
              <LessonLink lessonId={answer.buildsOn} lead="Builds on the lesson" />
            </p>
          )}
        </>
      )}
    </>
  );
}

type Filter = 'all' | 'taught' | 'beyond';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'taught', label: 'Taught in this course' },
  { id: 'beyond', label: 'Beyond this course' },
];

/** Lowercase and without accents, so "Kaplan" finds "Kaplan-Meier" and "cronbach" finds "Cronbach's". */
const fold = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

/**
 * Every answer as a card, in sections that follow the order of the questions,
 * so a student who already knows what they need can go straight to it.
 */
function Index({ onPick }: { onPick: (id: string) => void }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const entries = useMemo(() => allAnswers(), []);

  const words = fold(query).split(/\s+/).filter(Boolean);
  const shown = entries.filter(({ answer }) => {
    if (filter === 'taught' && !answer.lessonId) return false;
    if (filter === 'beyond' && answer.lessonId) return false;
    const haystack = fold(`${answer.model} ${answer.when} ${answer.traditional ?? ''} ${answer.check}`);
    return words.every((word) => haystack.includes(word));
  });
  const sections = GROUPS.map((group) => ({ ...group, answers: shown.filter((entry) => entry.group === group.name).map((entry) => entry.answer) })).filter(
    (section) => section.answers.length > 0,
  );

  return (
    <section className="model-index" aria-labelledby="model-index-title">
      <div className="model-index-head">
        <h2 id="model-index-title">Browse all {entries.length} models</h2>
        <p>Already know what you need? Search by name, or by the test you know it as.</p>
      </div>
      <div className="model-index-tools">
        <label className="model-index-search">
          <span className="visually-hidden">Search the models</span>
          <svg aria-hidden="true" viewBox="0 0 20 20" width="18" height="18">
            <circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M13 13l4.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search, for example t-test or mediation" />
        </label>
        <div className="model-index-filters" role="group" aria-label="Show">
          {FILTERS.map((option) => (
            <button key={option.id} type="button" aria-pressed={filter === option.id} onClick={() => setFilter(option.id)}>
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {sections.length === 0 && <p className="model-index-empty">No model matches. Try another word, or answer the questions above.</p>}

      {sections.map((section) => (
        <div key={section.name} className="model-index-section">
          <h3>
            {section.name} <span className="model-index-count">{section.answers.length}</span>
          </h3>
          <p className="model-index-blurb">{section.blurb}</p>
          <ul className="model-cards">
            {section.answers.map((answer) => (
              <li key={answer.id} className={`model-card ${answer.lessonId ? 'taught' : 'beyond'}`}>
                <button type="button" onClick={() => onPick(answer.id)}>
                  {answer.model}
                </button>
                <span className="model-card-when">{answer.when}</span>
                <span className="model-card-tags">
                  <span className={`model-badge ${answer.lessonId ? 'taught' : 'beyond'}`}>
                    {answer.lessonId ? `Taught, lesson ${answer.lessonId}` : 'Beyond the course'}
                  </span>
                  {packagesMissingHere(answer).length > 0 && <span className="model-badge rstudio">Needs RStudio</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}

const ANSWERS = new Map(allAnswers().map(({ answer }) => [answer.id, answer]));

/** Research questions from the course data, one per common kind of analysis. */
const EXAMPLES = [
  'Do remote workers report higher wellbeing than office workers?',
  'Does workload predict whether employees leave?',
  'Did engagement rise from the first to the second measurement, and more for trained employees?',
  'Does the effect of workload on wellbeing differ between departments?',
  'Does training raise performance through higher engagement?',
  'Does workload predict the number of sick days?',
];

type Overrides = Partial<Record<CueId, boolean>>;

function Suggestion({ id, reasons, best, onCheck }: { id: string; reasons: string[]; best: boolean; onCheck: (id: string) => void }) {
  const answer = ANSWERS.get(id)!;
  const [open, setOpen] = useState(false);
  const detailId = useId();
  return (
    <article className={`mc-suggestion${best ? ' best' : ''}`}>
      <p className="mc-kicker">{best ? 'Best match' : 'Also possible'}</p>
      <h3>{answer.model}</h3>
      {best && <p className="mc-suggestion-when">{answer.when}</p>}
      <ul className="mc-why" aria-label="Why it fits">
        {reasons.map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>
      <div className="mc-suggestion-actions">
        <button type="button" className={best ? 'button-primary' : 'button-secondary'} onClick={() => onCheck(id)}>
          Check it with the questions
        </button>
        <button type="button" className="mc-link-button" aria-expanded={open} aria-controls={detailId} onClick={() => setOpen(!open)}>
          {open ? 'Hide the details' : 'Show the details'}
        </button>
      </div>
      <div id={detailId} className="mc-suggestion-detail" hidden={!open}>
        {open && <AnswerCard answer={answer} />}
      </div>
    </article>
  );
}

/**
 * The research-question box: a keyword matcher suggests a model, shows the
 * cues it read, and lets the student switch any of them off or add one.
 */
function QuestionMatcher({ onCheck }: { onCheck: (id: string) => void }) {
  const [text, setText] = useState('');
  const [overrides, setOverrides] = useState<Overrides>({});
  const match = useMemo(() => matchQuestion(text, overrides), [text, overrides]);
  const shown = match.suggestions.slice(0, 3);
  const chips = CUES.filter((cue) => match.detected.includes(cue.id) || match.cues.includes(cue.id) || cue.id in overrides);
  const addable = CUES.filter((cue) => !chips.includes(cue));
  const typed = text.trim().length > 0;

  function write(next: string) {
    setText(next);
    setOverrides({});
  }
  function toggle(id: CueId) {
    setOverrides({ ...overrides, [id]: !match.cues.includes(id) });
  }

  return (
    <section className="mc-panel mc-matcher" aria-labelledby="mc-matcher-title">
      <p className="mc-kicker">Quick start</p>
      <h2 id="mc-matcher-title">Describe your research question</h2>
      <label htmlFor="mc-question" className="visually-hidden">
        Your research question
      </label>
      <textarea
        id="mc-question"
        rows={2}
        value={text}
        onChange={(event) => write(event.target.value)}
        placeholder="For example: Do students who sleep more get higher exam scores?"
      />
      <div className="mc-examples">
        <span className="mc-examples-label">Or try one:</span>
        {EXAMPLES.map((example) => (
          <button key={example} type="button" aria-pressed={text === example} onClick={() => write(example)}>
            {example}
          </button>
        ))}
      </div>
      <p className="mc-note">
        <svg aria-hidden="true" viewBox="0 0 20 20" width="16" height="16">
          <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path d="M10 9v5M10 6.2v.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        The suggestion comes from keywords in your question, not from AI, so confirm it with the questions below.
      </p>

      <p className="visually-hidden" aria-live="polite">
        {shown.length > 0 ? `Best match: ${ANSWERS.get(shown[0].id)!.model}` : typed ? 'No clear match yet.' : ''}
      </p>

      {(chips.length > 0 || typed) && (
        <div className="mc-cues">
          <p className="mc-cues-title">
            {chips.length > 0 ? 'What we read in your question. Tap one to switch it off if it is wrong.' : 'We found no cue in your question yet. You can add one yourself.'}
          </p>
          {chips.length > 0 && (
            <ul>
              {chips.map((cue) => (
                <li key={cue.id}>
                  <button type="button" className="mc-chip" aria-pressed={match.cues.includes(cue.id)} onClick={() => toggle(cue.id)}>
                    {cue.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <details className="mc-add">
            <summary>Missed something? Add it</summary>
            <ul>
              {addable.map((cue) => (
                <li key={cue.id}>
                  <button type="button" className="mc-chip" aria-pressed="false" onClick={() => toggle(cue.id)}>
                    {cue.label}
                  </button>
                </li>
              ))}
            </ul>
          </details>
        </div>
      )}

      {shown.length > 0 ? (
        <div className="mc-suggestions">
          {shown.map((suggestion, i) => (
            <Suggestion key={suggestion.id} id={suggestion.id} reasons={suggestion.reasons} best={i === 0} onCheck={onCheck} />
          ))}
        </div>
      ) : (
        typed && (
          <p className="mc-empty">
            No clear match yet. Try saying what you measured and what you compare or predict it with, as in the examples, or
            answer the short questions below.
          </p>
        )
      )}
    </section>
  );
}

/** The question each step of a path answered, for the trail's labels. */
function questionsOn(path: string[]): string[] {
  const texts: string[] = [];
  let node: Node = TREE;
  for (const label of path) {
    if (node.kind !== 'question') break;
    texts.push(node.text);
    node = node.options.find((option) => option.label === label)!.next;
  }
  return texts;
}

const startsWith = (path: string[], prefix: string[]) => prefix.every((label, i) => path[i] === label);

export default function ModelChooser() {
  const [searchParams, setSearchParams] = useSearchParams();
  // The answers so far live in the URL, one history entry per question, so the browser's Back button goes back one question.
  const path = useMemo(() => {
    const model = searchParams.get('model');
    return model ? (pathTo(model) ?? []) : follow(searchParams.getAll('step')).path;
  }, [searchParams]);
  // The furthest path taken or suggested, so stepping back shows the choice made there.
  const [planned, setPlanned] = useState<{ path: string[]; suggested: boolean }>(() => ({ path, suggested: false }));
  const { node } = follow(path);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const treeRef = useRef<HTMLElement>(null);
  const baseId = useId();
  // Set by every control that replaces the button that was clicked, so focus
  // would otherwise fall to <body>. Never set on mount, so landing on the page
  // does not steal focus (also under StrictMode's double effect run).
  const moveFocus = useRef(false);
  useEffect(() => {
    if (!moveFocus.current) return;
    moveFocus.current = false;
    headingRef.current?.focus();
  }, [path]);

  function go(next: string[], plan?: { path: string[]; suggested: boolean }) {
    moveFocus.current = true;
    setPlanned(plan ?? (startsWith(planned.path, next) ? planned : { path: next, suggested: false }));
    const reached = follow(next).node;
    setSearchParams(reached.kind === 'answer' ? { model: reached.id } : { step: next });
  }

  function pick(id: string) {
    const next = pathTo(id) ?? [];
    go(next, { path: next, suggested: false });
  }

  function check(id: string) {
    const next = pathTo(id) ?? [];
    go(next, { path: next, suggested: true });
    const smooth = !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    treeRef.current?.scrollIntoView?.({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
  }

  const asked = questionsOn(path);
  const ahead = startsWith(planned.path, path) ? planned.path[path.length] : undefined;

  return (
    <div className="model-chooser">
      <header className="mc-intro">
        <h1>Which model should I use?</h1>
        <p>
          Describe your research question for a quick suggestion, or answer a few short questions. Almost every analysis in
          this course is one of three models, lm(), lmer() or glm(), and the chain is always the same: question, assumptions,
          choice of model, computation, interpretation, report.
        </p>
      </header>

      <QuestionMatcher onCheck={check} />

      <section ref={treeRef} className="mc-panel mc-tree" aria-labelledby="mc-tree-title">
        <p className="mc-kicker">Step by step</p>
        <h2 id="mc-tree-title">Answer a few short questions</h2>

        {path.length > 0 && (
          <nav className="model-chooser-trail" aria-label="Your answers so far">
            {planned.suggested && node.kind === 'answer' && (
              <p className="mc-trail-hint">These answers lead to the suggestion. Tap any step to check it or change it.</p>
            )}
            <ol>
              {path.map((label, i) => (
                <li key={label}>
                  <button type="button" title={asked[i]} onClick={() => go(path.slice(0, i))}>
                    <span className="visually-hidden">Change your answer to {asked[i]} You chose: </span>
                    {label}
                  </button>
                </li>
              ))}
            </ol>
            <div className="model-chooser-trail-actions">
              <button type="button" onClick={() => go(path.slice(0, -1))}>
                Back
              </button>
              <button type="button" onClick={() => go([], { path: [], suggested: false })}>
                Start over
              </button>
            </div>
          </nav>
        )}

        {node.kind === 'question' ? (
          <div className="mc-step" key={path.join('/')}>
            <p className="model-chooser-step">Question {path.length + 1}</p>
            <h3 ref={headingRef} tabIndex={-1} className="model-chooser-current">
              {node.text}
            </h3>
            {node.help && <p className="model-chooser-help">{node.help}</p>}
            <ul className="model-chooser-options">
              {node.options.map((option, i) => {
                const id = `${baseId}-${i}`;
                const flagged = option.label === ahead;
                return (
                  <li key={option.label}>
                    <button type="button" className={flagged ? 'flagged' : undefined} aria-labelledby={`${id}-label`} aria-describedby={`${id}-more`} onClick={() => go([...path, option.label])}>
                      <span className="mc-option-label" id={`${id}-label`}>
                        {option.label}
                      </span>
                      <span id={`${id}-more`} className="mc-option-more">
                        {flagged && <span className="mc-flag">{planned.suggested ? 'Suggested' : 'Your earlier choice'}</span>}
                        <span className="mc-option-example">{option.example}</span>
                        <span className="mc-option-tech">{option.tech}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          <div className="model-chooser-answer" key={node.id}>
            <p className="mc-kicker">Your model</p>
            <h3 ref={headingRef} tabIndex={-1} className="model-chooser-current">
              {node.model}
            </h3>
            <AnswerCard answer={node} />
          </div>
        )}

        <p className="model-chooser-legend">
          Most snippets run as they are in the <Link to="/workspace">R Workspace</Link>, and the ones that need RStudio say so.
          Each reads workplace.csv or wellbeing-population.csv, the course data the workspace already has, or a dataset built
          into R when the course data has nothing that fits. For your own data, change the file name in read.csv() and the
          column names.
        </p>
      </section>

      <Index onPick={pick} />
    </div>
  );
}
