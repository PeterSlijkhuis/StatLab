import type { ReactNode } from 'react';
import { currentLook } from '../state/avatar';
import { getProgress } from '../state/progress';
import Avatar from './Avatar';
import './AvatarTip.css';

type Props = {
  /** coach: sets a task, gives a hint or shows a solution. right, wrong, error: reacts to an answer. */
  tone: 'coach' | 'right' | 'wrong' | 'error';
  /** A short caption above the bubble's text, such as "Your task" or "Hint 2 of 3". */
  title?: string;
  className?: string;
  children: ReactNode;
};

/**
 * The student's own avatar, speaking in a speech bubble: it sets each task,
 * gives hints, explains mistakes and walks through the solution. The avatar is
 * decoration; the bubble's text is the message, so screen readers read it as
 * ordinary text.
 */
export default function AvatarTip({ tone, title, className, children }: Props) {
  return (
    <div className={['avatar-tip', `avatar-tip-${tone}`, className].filter(Boolean).join(' ')}>
      <Avatar look={currentLook(getProgress())} size={52} />
      <div className="avatar-tip-bubble">
        {title && <p className="avatar-tip-title">{title}</p>}
        {children}
      </div>
    </div>
  );
}
