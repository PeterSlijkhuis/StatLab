import { useEffect, useState } from 'react';
import { onStatus, restartR, type RStatus as Status } from '../r/webrClient';

/**
 * `where` splits the two homes: an error sits in the page ("page"), the ready
 * and busy pill stacks under the helper in the corner ("corner").
 */
export default function RStatus({ where }: { where?: 'page' | 'corner' }) {
  const [status, setStatus] = useState<Status>({ phase: 'idle' });
  useEffect(() => onStatus(setStatus), []);

  // Nothing has started yet, so claim nothing: an amber "Starting R…" pill for
  // idle would be a lie on any page reached before the boot effect runs.
  if (status.phase === 'idle') return null;
  if (where === (status.phase === 'error' ? 'corner' : 'page')) return null;

  if (status.phase === 'ready') {
    return <div className="r-status ready"><span>R is ready</span><button type="button" onClick={restartR} title="Use this if R stops responding">Restart R</button></div>;
  }

  if (status.phase === 'error') {
    return (
      <div className="r-status error">
        <p>R could not start. StatLab needs a recent browser and an internet connection the first time it loads. You can still read the lessons and answer the questions.</p>
        <p className="r-status-detail">{status.detail}</p>
        <button type="button" onClick={restartR}>Try again</button>
      </div>
    );
  }

  return <div className="r-status busy"><span>{status.detail ?? (status.phase === 'installing' ? 'Installing packages…' : 'Starting R…')}</span></div>;
}
