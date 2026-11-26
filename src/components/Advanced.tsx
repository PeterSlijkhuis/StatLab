import type { ReactNode } from 'react';
import { useAdvanced } from '../state/settings';
import { useT } from '../i18n/t';

/**
 * A part of a lesson that goes beyond van den Berg's book and the BMS course
 * materials. Shown only with Advanced topics switched on under Settings; until
 * then a one-line note marks where it is. Never wrap an Exercise in it: a
 * hidden exercise would keep the lesson from ever completing.
 */
export default function Advanced({ children }: { children: ReactNode }) {
  const t = useT();
  const advanced = useAdvanced();
  if (!advanced) {
    return (
      <p className="advanced-note">
        <span aria-hidden="true">🎓 </span>{t('An advanced section, beyond the book and the BMS course, is hidden here. Switch on Advanced topics under Settings to read it.')}
      </p>
    );
  }
  return (
    <section className="advanced-section" aria-label={t('Advanced, beyond the course')}>
      <p className="advanced-label"><span aria-hidden="true">🎓 </span>{t('Advanced: beyond the book and the BMS course')}</p>
      {children}
    </section>
  );
}
