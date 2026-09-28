import type { MouseEvent } from 'react';
import { addBonusPoint } from '../state/progress';
import './Credits.css';

// Logo files are picked up from src/assets/logos by name, so adding
// utwente.svg or bmslab.png there is all it takes to swap a text wordmark for
// the real logo. Until a file is there, the partner's name stands in for it.
const LOGO_FILES = import.meta.glob<string>('../assets/logos/*.{svg,png,jpg,jpeg,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
});

function logoFor(key: string) {
  const path = Object.keys(LOGO_FILES).find((file) => file.split('/').pop()?.replace(/\.[^.]+$/, '') === key);
  return path ? LOGO_FILES[path] : undefined;
}

export const SOURCE_MATERIALS_BY = 'dr. S.J. Watson';

export const REFERENCE_BOOK = {
  title: 'Analysing Data Using Linear Models',
  author: 'S.M. van den Berg',
  href: 'https://ris.utwente.nl/ws/portalfiles/portal/253344321/Analysing_data_using_linear_models_5th_Ed_January_2021.pdf',
};

export const PARTNERS = [
  { key: 'utwente', name: 'University of Twente', href: 'https://www.utwente.nl/en/' },
  { key: 'bmslab', name: 'The BMS Lab', href: 'https://bmslab.utwente.nl/' },
] as const;

/** A surname in the credit line. */
function Name({ children }: { children: string }) {
  function click(event: MouseEvent<HTMLSpanElement>) {
    addBonusPoint();
    const plus = document.createElement('span');
    plus.className = 'credits-plus';
    plus.textContent = '+1';
    plus.style.left = `${event.clientX}px`;
    plus.style.top = `${event.clientY}px`;
    document.body.appendChild(plus);
    setTimeout(() => plus.remove(), 900);
  }
  return (
    <span className="credits-name" onClick={click}>
      {children}
    </span>
  );
}

type Props = {
  /** Compact sits at the foot of the sidebar; full closes the home page. */
  variant?: 'compact' | 'full';
};

export default function Credits({ variant = 'full' }: Props) {
  return (
    <footer className={`credits credits-${variant}`}>
      <p className="credits-authors">
        Made by dr. P.J.H. <Name>Slijkhuis</Name> and dr. V.d.C. <Name>Resendez Gomez</Name>, based on materials provided by{' '}
        {SOURCE_MATERIALS_BY}.
      </p>
      {variant === 'full' && (
        <p className="credits-book">
          Theory and terminology follow{' '}
          <a href={REFERENCE_BOOK.href} target="_blank" rel="noopener noreferrer">
            <cite>{REFERENCE_BOOK.title}</cite>
          </a>{' '}
          by {REFERENCE_BOOK.author} (5th ed., University of Twente, 2021).
        </p>
      )}
      <ul className="credits-partners">
        {PARTNERS.map((partner) => {
          const src = logoFor(partner.key);
          return (
            <li key={partner.key}>
              <a href={partner.href} target="_blank" rel="noopener noreferrer" className="credits-partner">
                {src ? <img src={src} alt={partner.name} /> : <span className="credits-wordmark">{partner.name}</span>}
              </a>
            </li>
          );
        })}
      </ul>
    </footer>
  );
}
