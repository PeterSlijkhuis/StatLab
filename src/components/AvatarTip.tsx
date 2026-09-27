import type { ReactNode } from 'react';
import { currentLook } from '../state/avatar';
import { getProgress } from '../state/progress';
import Avatar from './Avatar';
import './AvatarTip.css';

type Props = {
  tone: 'wrong' | 'error';
  children: ReactNode;
};

/**
 * The student's own avatar, explaining a mistake in a speech bubble. The
 * avatar is decoration; the bubble's text is the message, so screen readers
 * read it as ordinary text.
 */
export default function AvatarTip({ tone, children }: Props) {
  return (
    <div className={`avatar-tip avatar-tip-${tone}`}>
      <Avatar look={currentLook(getProgress())} size={52} />
      <div className="avatar-tip-bubble">{children}</div>
    </div>
  );
}
