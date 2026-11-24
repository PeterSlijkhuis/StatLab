import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AvatarTip from '../components/AvatarTip';
import ChoiceBlock from '../components/ChoiceBlock';
import { LessonProvider } from '../content/LessonContext';
import { ALL_LESSONS, findLesson } from '../content/manifest';
import { loadQuizzes, pickRound, type BankQuiz } from '../content/quizBank';
import { getProgress } from '../state/progress';
import { firstUnfinished } from '../state/stats';
import { useAdvanced } from '../state/settings';
import { useLanguage } from '../state/language';
import { useT } from '../i18n/t';
import { visibleModules } from '../content/parts';
import './ModelChooser.css';

const number = (lessonId: string) => lessonId.replace(/^0/, '').toUpperCase();

export default function Review() {
  const t = useT();
  const language = useLanguage();
  const label = (lessonId: string) => `${t('Lesson')} ${number(lessonId)}`;
  const lessonTitle = (id: string) => t(findLesson(id)?.title ?? '');
  const [round, setRound] = useState<BankQuiz[] | null>(null);
  const [at, setAt] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [missed, setMissed] = useState<BankQuiz[]>([]);
  const [roundNumber, setRoundNumber] = useState(0);

  useEffect(() => {
    let live = true;
    const progress = getProgress();
    void loadQuizzes(Object.keys(progress.lessons), language).then((quizzes) => {
      if (!live) return;
      setRound(pickRound(quizzes, progress));
      setAt(0);
      setAnswered(false);
      setMissed([]);
    });
    return () => {
      live = false;
    };
  }, [roundNumber, language]);

  const quiz = round?.[at];
  const advanced = useAdvanced();
  const start = firstUnfinished(getProgress(), visibleModules(advanced).flatMap((module) => module.lessons)) ?? ALL_LESSONS[0];

  return (
    <div className="model-chooser review">
      <header className="mc-intro">
        <h1>{t('Review quiz')}</h1>
        <p>
          {t('Ten questions, mixed, from the lessons you have opened. Pulling an answer from memory, with topics mixed together, is one of the best-tested ways to make it stick. Questions you got wrong in a lesson come up first.')}
        </p>
      </header>

      {round && round.length === 0 && (
        <AvatarTip tone="coach" title={t('Nothing to review yet')}>
          <p>
            {t('Questions come from the lessons you have opened. Start with')}{' '}
            <Link to={`/lesson/${start.id}`}>{label(start.id)}: {t(start.title)}</Link>, {t('then come back here.')}
          </p>
        </AvatarTip>
      )}

      {quiz && (
        <section className="mc-panel" aria-live="polite">
          <p className="mc-kicker">{t('Question {at} of {total}', { at: at + 1, total: round.length })}</p>
          <p>
            {t('From')} <Link to={`/lesson/${quiz.lessonId}`}>{label(quiz.lessonId)}: {lessonTitle(quiz.lessonId)}</Link>
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
              {t(at + 1 < round.length ? 'Next question' : 'See your score')}
            </button>
          )}
        </section>
      )}

      {round && round.length > 0 && at >= round.length && (
        <section className="mc-panel" aria-live="polite">
          <p className="mc-kicker">{t('Round done')}</p>
          <h2>
            {t('You got {right} of {total} right.', { right: round.length - missed.length, total: round.length })}
          </h2>
          {missed.length === 0 ? (
            <p>{t('A clean sweep. Open a few more lessons to widen the pool.')}</p>
          ) : (
            <>
              <p>{t('Worth another look:')}</p>
              <ul>
                {missed.map((item) => (
                  <li key={`${item.lessonId}/${item.id}`}>
                    <Link to={`/lesson/${item.lessonId}`}>{label(item.lessonId)}: {lessonTitle(item.lessonId)}</Link>
                  </li>
                ))}
              </ul>
            </>
          )}
          <button type="button" className="button-primary" onClick={() => setRoundNumber(roundNumber + 1)}>
            {t('New round')}
          </button>
        </section>
      )}
    </div>
  );
}
