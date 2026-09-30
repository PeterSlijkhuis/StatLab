import { useId } from 'react';

/** A bell curve on the brand gradient: the same mark as public/favicon.svg. */
export default function Logo({ size = 22 }: { size?: number }) {
  // Each instance needs its own gradient id: the first copy of a shared id can
  // sit in a hidden topbar, and a hidden gradient paints nothing.
  const gradient = `logo-gradient-${useId().replace(/:/g, '')}`;
  return (
    <svg className="logo" viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      <defs>
        <linearGradient id={gradient} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4f46e5" />
          <stop offset="1" stopColor="#0ea5e9" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill={`url(#${gradient})`} />
      <path d="M8 48 C 20 48, 22 16, 32 16 S 44 48, 56 48" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}
