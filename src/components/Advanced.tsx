import type { ReactNode } from 'react';
import { useAdvanced } from '../state/settings';

/**
 * A part of a lesson that goes beyond van den Berg's book and the BMS course
 * materials. Shown only with Advanced topics switched on under Settings; until
 * then a one-line note marks where it is. Never wrap an Exercise in it: a
 * hidden exercise would keep the lesson from ever completing.
 */
export default function Advanced({ children }: { children: ReactNode }) {
  const advanced = useAdvanced();
  if (!advanced) {
    return (
      <p className="advanced-note">
        <span aria-hidden="true">🎓 </span>An advanced section, beyond the book and the BMS course, is hidden here. Switch on Advanced topics under Settings to read it.
      </p>
    );
  }
  return (
    <section className="advanced-section" aria-label="Advanced, beyond the course">
      <p className="advanced-label"><span aria-hidden="true">🎓 </span>Advanced: beyond the book and the BMS course</p>
      {children}
    </section>
  );
}
