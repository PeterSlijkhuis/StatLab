import { useRef, useState } from 'react';
import { getExercise } from '../content/exercises';
import { useLesson } from '../content/LessonContext';
import { runExercise, type CheckOutcome } from '../r/checker';
import { explainRError } from '../r/explainError';
import { findLesson } from '../content/manifest';
import { getDraft, getProgress, markExercise, saveDraft } from '../state/progress';
import { lessonStatus, POINTS } from '../state/stats';
import AvatarTip from './AvatarTip';
import { confetti, showToast } from './celebrate';
import { PLOT_SIZE, R_STOPPED_MESSAGE } from './CodeBlock';
import FileUpload from './FileUpload';
import OutputPane from './OutputPane';
import REditor from './REditor';
import './Exercise.css';

export default function Exercise({ id }: { id: string }) {
  const { lessonId, webR, env, ready } = useLesson();
  const definition = getExercise(id);
  const [source, setSource] = useState(() => getDraft(lessonId, id) ?? definition?.starterCode ?? '');
  const [outcome, setOutcome] = useState<CheckOutcome | null>(null);
  const [checking, setChecking] = useState(false);
  const [hintsShown, setHintsShown] = useState(0);
  const [attempted, setAttempted] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [crashed, setCrashed] = useState(false);
  const checkButton = useRef<HTMLButtonElement | null>(null);

  if (!definition) {
    return <p className="exercise-missing">Exercise “{id}” is not defined.</p>;
  }

  function edit(next: string) {
    setSource(next);
    saveDraft(lessonId, id, next);
  }

  async function check() {
    if (!webR || !env || !ready) return;
    setChecking(true);
    setCrashed(false);
    try {
      const result = await runExercise(webR, definition!, source, env, PLOT_SIZE);
      setOutcome(result);
      // Every evaluated submission counts as an attempt — including a broken
      // check. The student genuinely tried; keeping the solution locked would
      // punish them for a faulty exercise.
      setAttempted(true);
      // A broken check is an infrastructure fault: it records nothing.
      if (result.status === 'pass') {
        const lesson = findLesson(lessonId);
        const alreadyPassed = getProgress().lessons[lessonId]?.exercises[id] === 'passed';
        const wasComplete = lesson ? lessonStatus(lesson, getProgress()) === 'complete' : false;
        markExercise(lessonId, id, 'passed');
        // Rewards only for a first solve: re-checking a solved exercise is practice.
        if (!alreadyPassed) {
          confetti(checkButton.current);
          if (lesson && !wasComplete && lessonStatus(lesson, getProgress()) === 'complete') {
            showToast('Lesson complete!', `+${POINTS.exercise + POINTS.lesson} points. On to the next one.`, 'milestone');
          } else {
            showToast('Exercise solved', `+${POINTS.exercise} points`);
          }
        }
      } else if (result.status === 'fail' || result.status === 'student-error') {
        markExercise(lessonId, id, 'attempted');
      }
    } catch {
      // Neither the student's fault nor the exercise's: R itself stopped
      // responding. Record nothing, and do not count it as an attempt — their
      // answer was never evaluated.
      setOutcome(null);
      setCrashed(true);
    } finally {
      setChecking(false);
    }
  }

  return (
    <section className={`exercise${outcome?.status === 'pass' ? ' exercise-passed' : ''}`}>
      <p className="exercise-label"><span aria-hidden="true">🎯</span> Exercise</p>
      {/* The student's avatar leads the exercise: it sets the task, gives the
          hints, reacts to each check and walks through the solution. */}
      <AvatarTip tone="coach" title="Your task" className="exercise-task">
        <p className="exercise-prompt">{definition.prompt}</p>
        {!attempted && <p className="exercise-advice">Write your code in the editor, then press "Check my answer" and I'll tell you what I see.</p>}
      </AvatarTip>

      <REditor value={source} onChange={edit} />

      <div className="exercise-actions">
        <button ref={checkButton} type="button" onClick={check} disabled={!ready || checking}>
          {checking ? 'Checking…' : 'Check my answer'}
        </button>
        <button
          type="button"
          className="secondary"
          onClick={() => setHintsShown((n) => Math.min(n + 1, definition.hints.length))}
          disabled={hintsShown >= definition.hints.length}
        >
          Show a hint
        </button>
        <button
          type="button"
          className="secondary"
          onClick={() => setShowSolution(true)}
          disabled={!attempted || showSolution}
          title={attempted ? undefined : 'Try the exercise first'}
        >
          Show solution
        </button>
      </div>

      {/* Files land beside the course datasets and never replace them, so an
          upload cannot change what a check compares the answer against. */}
      <FileUpload compact />

      {hintsShown > 0 && (
        <AvatarTip tone="coach" title={`Hint ${hintsShown} of ${definition.hints.length}`}>
          <ul className="exercise-hints">
            {definition.hints.slice(0, hintsShown).map((hint) => (
              <li key={hint}>{hint}</li>
            ))}
          </ul>
        </AvatarTip>
      )}

      {crashed && (
        <div className="exercise-outcome outcome-broken-check">
          <p>{R_STOPPED_MESSAGE}</p>
        </div>
      )}

      {outcome?.status === 'pass' && (
        <AvatarTip tone="right" title="Well done" className="exercise-outcome-pass">
          <p>{outcome.message}</p>
        </AvatarTip>
      )}
      {outcome?.status === 'broken-check' && (
        <div className="exercise-outcome outcome-broken-check">
          <p>
            There is a problem with this exercise itself, not with your answer. Please report it.
          </p>
        </div>
      )}

      {/* Mistakes are explained by the student's own avatar. */}
      {outcome?.status === 'fail' && (
        <AvatarTip tone="wrong">
          <p>{outcome.message}</p>
          {hintsShown < definition.hints.length && <p>Stuck? Press "Show a hint" and I'll give you a nudge.</p>}
        </AvatarTip>
      )}
      {outcome?.status === 'student-error' && (
        <AvatarTip tone="error">
          <p><strong>Your code did not run.</strong> {explainRError(outcome.run.output.filter((o) => o.type === 'error').map((o) => o.data).join('\n'))}</p>
          <p>R's own message is shown below.</p>
        </AvatarTip>
      )}

      {/* An answer that prints nothing and draws nothing would leave an empty dark panel under the verdict. */}
      {outcome && (outcome.run.output.length > 0 || outcome.run.images.length > 0) && (
        <OutputPane result={outcome.run} running={false} />
      )}

      {showSolution && (
        <AvatarTip tone="coach" title="Solution">
          <p>
            Here is one way to write it. Compare it with yours line by line: a different route to the
            same result is also correct.
          </p>
          <pre className="exercise-solution">
            <code>{definition.solution}</code>
          </pre>
        </AvatarTip>
      )}
    </section>
  );
}
