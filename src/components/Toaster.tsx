import { useEffect, useState } from 'react';
import { useT } from '../i18n/t';
import { dismissToast, subscribeToasts, type Toast } from './celebrate';

export default function Toaster() {
  const t = useT();
  const [toasts, setToasts] = useState<Toast[]>([]);
  useEffect(() => subscribeToasts(setToasts), []);

  return (
    <div className="toaster" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.tone}`}>
          <span className="toast-icon" aria-hidden="true">{toast.tone === 'milestone' ? '🏆' : '✨'}</span>
          <div className="toast-body">
            <strong>{t(toast.title)}</strong>
            {toast.detail && <span>{t(toast.detail)}</span>}
          </div>
          <button type="button" className="toast-close" aria-label={t('Dismiss')} onClick={() => dismissToast(toast.id)}>×</button>
        </div>
      ))}
    </div>
  );
}
