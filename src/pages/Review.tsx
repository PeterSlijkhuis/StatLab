import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AvatarTip from '../components/AvatarTip';
import ChoiceBlock from '../components/ChoiceBlock';
import { LessonProvider } from '../content/LessonContext';
import { ALL_LESSONS, findLesson } from '../content/manifest';
import { loadQuizzes, pickRound, type BankQuiz } from '../content/quizBank';
import { getProgress } from '../state/progress';
import { firstUnfinished } from '../state/stats';
import './ModelChooser.css';

const label = (lessonId: string) => `Lesson ${lessonId.replace(/^0/, '')}`;

export default function Review() {
  const [round, setRound] = useState<BankQuiz[] | null>(null);
  const [at, setAt] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [missed, setMissed] = useState<BankQuiz[]>([]);
  const [roundNumber, setRoundNumber] = useState(0);

  useEffect(() => {
    let live = true;
    const progress = getProgress();
    void loadQuizzes(Object.keys(progress.lessons)).then((quizzes) => {
      if (!live) return;
      setRound(pickRound(quizzes, progress));
      setAt(0);
      setAnswered(false);
      setMissed([]);
    });
    return () => {
      live = false;
    };
  }, [roundNumber]);

  const quiz = round?.[at];
  const start = firstUnfinished(getProgress()) ?? ALL_LESSONS[0];

  return (
    <div className="model-chooser review">
      <header className="mc-intro">
        <h1>Review quiz</h1>
        <p>
          Ten questions, mixed, from the lessons you have opened. Pulling an answer from memory, with topics mixed
          together, is one of the best-tested ways to make it stick. Questions you got wrong in a lesson come up first.
        </p>
      </header>

      {round && round.length === 0 && (
        <AvatarTip tone="coach" title="Nothing to review yet">
          <p>
            Questions come from the lessons you have opened. Start with{' '}
            <Link to={`/lesson/${start.id}`}>{label(start.id)}: {start.title}</Link>, then come back here.
          </p>
        </AvatarTip>
      )}

      {quiz && (
        <section className="mc-panel" aria-live="polite">
          <p className="mc-kicker">Question {at + 1} of {round.length}</p>
          <p>
            From <Link to={`/lesson/${quiz.lessonId}`}>{label(quiz.lessonId)}: {findLesson(quiz.lessonId)?.title}</Link>
          </p>
          <LessonProvider value={{ lessonId: quiz.lessonId, webR: null, env: null, ready: false }}>
            <ChoiceBlock
              key={`${roundNumber}/${quiz.lessonId}/${quiz.id}`}
              id={quiz.id}
              kind="quiz"
              question={quiz.question}
              choices={quiz.choices}
              onAnswer={(correct) => {
                setAnswered(true);
                if (!correct) setMissed((list) => [...list, quiz]);
              }}
            />
          </LessonProvider>
          {answered && (
            <button
              type="button"
              className="button-primary"
              onClick={() => {
                setAt(at + 1);
                setAnswered(false);
              }}
            >
              {at + 1 < round.length ? 'Next question' : 'See your score'}
            </button>
          )}
        </section>
      )}

      {round && round.length > 0 && at >= round.length && (
        <section className="mc-panel" aria-live="polite">
          <p className="mc-kicker">Round done</p>
          <h2>
            You got {round.length - missed.length} of {round.length} right.
          </h2>
          {missed.length === 0 ? (
            <p>A clean sweep. Open a few more lessons to widen the pool.</p>
          ) : (
            <>
              <p>Worth another look:</p>
              <ul>
                {missed.map((item) => (
                  <li key={`${item.lessonId}/${item.id}`}>
                    <Link to={`/lesson/${item.lessonId}`}>{label(item.lessonId)}: {findLesson(item.lessonId)?.title}</Link>
                  </li>
                ))}
              </ul>
            </>
          )}
          <button type="button" className="button-primary" onClick={() => setRoundNumber(roundNumber + 1)}>
            New round
          </button>
        </section>
      )}
    </div>
  );
}
