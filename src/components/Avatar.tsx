import { useId } from 'react';
import { piece, type Look } from '../state/avatar';

type Props = {
  look: Look;
  size?: number;
  /** Omit for a decorative avatar, as in the sidebar beside the student's own name for it. */
  label?: string;
};

/**
 * The student's avatar, drawn in layers: background, body and outfit, head,
 * hair, then the accessory on top. Everything is plain SVG shapes, so it is
 * crisp at any size and needs no image files.
 */
export default function Avatar({ look, size = 96, label }: Props) {
  // Ids must be unique on the page: the sidebar and the designer both draw one.
  const uid = useId().replace(/:/g, '');
  const clip = `avatar-clip-${uid}`;
  const body = `avatar-body-${uid}`;
  const skin = piece(look.skin)?.colour ?? '#e0a97e';
  const hair = piece(look.hairColour)?.colour ?? '#5b3a24';
  const a11y = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true };

  return (
    <svg className="avatar" viewBox="0 0 120 120" width={size} height={size} {...a11y}>
      <defs>
        <clipPath id={clip}><circle cx="60" cy="60" r="60" /></clipPath>
        <clipPath id={body}><path d={BODY} /></clipPath>
      </defs>
      <g clipPath={`url(#${clip})`}>
        <Background id={look.background} uid={uid} />
        <HairBack style={look.hairStyle} colour={hair} />
        <rect x="53" y="64" width="14" height="22" rx="4" fill={skin} />
        <Outfit id={look.outfit} skin={skin} clip={body} />
        <circle cx="38" cy="52" r="4.5" fill={skin} />
        <circle cx="82" cy="52" r="4.5" fill={skin} />
        <ellipse cx="60" cy="50" rx="22" ry="24" fill={skin} />
        <circle cx="52" cy="50" r="2.6" fill="#1f2937" />
        <circle cx="68" cy="50" r="2.6" fill="#1f2937" />
        <circle cx="47" cy="58" r="3.5" fill="#f472b6" opacity="0.25" />
        <circle cx="73" cy="58" r="3.5" fill="#f472b6" opacity="0.25" />
        <path d="M53 60 Q60 66 67 60" fill="none" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" />
        <HairFront style={look.hairStyle} colour={hair} />
        <Accessory id={look.accessory} />
      </g>
    </svg>
  );
}

const BODY = 'M18 124 C18 96 36 82 60 82 C84 82 102 96 102 124 Z';

function Background({ id, uid }: { id: string; uid: string }) {
  const grad = `avatar-bg-${uid}`;
  switch (id) {
    case 'bg-sunset':
      return (
        <>
          <defs>
            <linearGradient id={grad} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#f472b6" />
              <stop offset="1" stopColor="#fdba74" />
            </linearGradient>
          </defs>
          <rect width="120" height="120" fill={`url(#${grad})`} />
          <circle cx="92" cy="30" r="12" fill="#fde68a" />
        </>
      );
    case 'bg-ocean':
      return (
        <>
          <rect width="120" height="120" fill="#7dd3fc" />
          <path d="M0 96 Q15 88 30 96 T60 96 T90 96 T120 96 V120 H0 Z" fill="#0ea5e9" />
        </>
      );
    case 'bg-scatter':
      return (
        <>
          <rect width="120" height="120" fill="#fef3c7" />
          {[[12, 96], [22, 84], [30, 90], [96, 30], [104, 20], [90, 40], [16, 70], [100, 50]].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="2.5" fill="#d97706" opacity="0.7" />
          ))}
          <path d="M6 104 L114 14" stroke="#b45309" strokeWidth="1.5" opacity="0.5" />
        </>
      );
    case 'bg-galaxy':
      return (
        <>
          <rect width="120" height="120" fill="#312e81" />
          {[[14, 20], [30, 40], [100, 16], [88, 44], [20, 80], [106, 76], [60, 10], [44, 24]].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="1.3" fill="#fff" />
          ))}
          <circle cx="96" cy="96" r="9" fill="#a78bfa" opacity="0.6" />
        </>
      );
    default:
      return <rect width="120" height="120" fill={piece(id)?.colour ?? '#e0e7ff'} />;
  }
}

/** The part of the hair that falls behind the head and shoulders. */
function HairBack({ style, colour }: { style: string; colour: string }) {
  switch (style) {
    case 'hair-long':
      return <path d="M35 48 C35 22 85 22 85 48 L88 96 L32 96 Z" fill={colour} />;
    case 'hair-bob':
      return <path d="M35 48 C35 22 85 22 85 48 L86 70 Q60 76 34 70 Z" fill={colour} />;
    case 'hair-bun':
      return <circle cx="60" cy="22" r="10" fill={colour} />;
    case 'hair-curly':
      return (
        <g fill={colour}>
          {[[36, 58], [84, 58], [34, 46], [86, 46]].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="7" />)}
        </g>
      );
    default:
      return null;
  }
}

/** The part of the hair over the top of the head. */
function HairFront({ style, colour }: { style: string; colour: string }) {
  switch (style) {
    case 'hair-none':
      return null;
    case 'hair-spiky':
      return <path d="M38 47 L39 30 L46 34 L49 21 L56 30 L61 18 L66 30 L72 21 L75 33 L81 29 L82 47 C74 36 46 36 38 47 Z" fill={colour} />;
    case 'hair-curly':
      return (
        <g fill={colour}>
          {[[39, 42], [43, 32], [51, 26], [60, 24], [69, 26], [77, 32], [81, 42]].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="8" />
          ))}
        </g>
      );
    default:
      return <path d="M37 50 C34 26 52 22 62 24 C77 24 88 32 83 50 C78 38 64 33 52 37 C45 40 40 44 37 50 Z" fill={colour} />;
  }
}

function Outfit({ id, skin, clip }: { id: string; skin: string; clip: string }) {
  const neckline = <path d="M50 82 Q60 93 70 82 Z" fill={skin} />;
  switch (id) {
    case 'outfit-hoodie':
      return (
        <g>
          <path d={BODY} fill="#dc2626" />
          <path d="M42 86 Q60 102 78 86" fill="none" stroke="#991b1b" strokeWidth="3" />
          {neckline}
          <path d="M55 92 L54 106 M65 92 L66 106" stroke="#fef2f2" strokeWidth="1.8" strokeLinecap="round" />
          <rect x="44" y="108" width="32" height="12" rx="4" fill="#b91c1c" />
        </g>
      );
    case 'outfit-stripes':
      return (
        <g>
          <path d={BODY} fill="#0ea5e9" />
          <g clipPath={`url(#${clip})`} fill="#f0f9ff">
            {[94, 104, 114].map((y) => <rect key={y} x="0" y={y} width="120" height="4" />)}
          </g>
          {neckline}
        </g>
      );
    case 'outfit-r-tee':
      return (
        <g>
          <path d={BODY} fill="#1e293b" />
          {neckline}
          <circle cx="60" cy="106" r="11" fill="#94a3b8" />
          <text x="60" y="111" textAnchor="middle" fontSize="15" fontWeight="800" fontFamily="system-ui, sans-serif" fill="#1d4ed8">R</text>
        </g>
      );
    case 'outfit-shirt-tie':
      return (
        <g>
          <path d={BODY} fill="#f8fafc" stroke="#cbd5e1" />
          <path d="M50 82 L60 90 L70 82 Z" fill={skin} />
          <path d="M50 82 L60 90 L53 94 Z M70 82 L60 90 L67 94 Z" fill="#e2e8f0" stroke="#cbd5e1" />
          <path d="M57 90 L63 90 L65 112 L60 118 L55 112 Z" fill="#dc2626" />
        </g>
      );
    case 'outfit-lab-coat':
      return (
        <g>
          <path d={BODY} fill="#f8fafc" stroke="#cbd5e1" />
          <path d="M50 82 L60 104 L70 82 Z" fill="#93c5fd" />
          <path d="M50 82 L60 104 M70 82 L60 104" stroke="#cbd5e1" strokeWidth="2" />
          <rect x="72" y="102" width="12" height="10" rx="1.5" fill="none" stroke="#cbd5e1" />
          <path d="M76 97 L76 104" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" />
          <path d="M53 82 Q60 88 67 82 Z" fill={skin} />
        </g>
      );
    case 'outfit-bell-curve':
      return (
        <g>
          <path d={BODY} fill="#f59e0b" />
          {neckline}
          <path d="M38 114 C50 114 52 96 60 96 C68 96 70 114 82 114" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M60 96 L60 114" stroke="#fff" strokeWidth="1.2" strokeDasharray="2 2" />
        </g>
      );
    case 'outfit-gown':
      return (
        <g>
          <path d={BODY} fill="#111827" />
          <path d="M50 82 L60 100 L70 82 Z" fill="#f8fafc" />
          <path d="M46 84 L52 120 L44 120 L40 88 Z M74 84 L68 120 L76 120 L80 88 Z" fill="#facc15" />
          <path d="M53 82 Q60 88 67 82 Z" fill={skin} />
        </g>
      );
    default:
      return (
        <g>
          <path d={BODY} fill="#4f46e5" />
          {neckline}
        </g>
      );
  }
}

function Accessory({ id }: { id: string }) {
  switch (id) {
    case 'acc-glasses':
      return (
        <g fill="none" stroke="#1f2937" strokeWidth="2">
          <circle cx="52" cy="50" r="6.5" />
          <circle cx="68" cy="50" r="6.5" />
          <path d="M58.5 50 L61.5 50 M45.5 49 L39 47 M74.5 49 L81 47" />
        </g>
      );
    case 'acc-sunglasses':
      return (
        <g>
          <rect x="43" y="45" width="15" height="10" rx="4" fill="#111827" />
          <rect x="62" y="45" width="15" height="10" rx="4" fill="#111827" />
          <path d="M58 49 L62 49 M43 48 L38 46 M77 48 L82 46" stroke="#111827" strokeWidth="2" />
          <path d="M46 48 L50 48" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
        </g>
      );
    case 'acc-flower':
      return (
        <g>
          {[[0, -5], [5, 0], [0, 5], [-5, 0]].map(([dx, dy]) => (
            <circle key={`${dx}-${dy}`} cx={80 + dx} cy={32 + dy} r="4.5" fill="#f472b6" />
          ))}
          <circle cx="80" cy="32" r="3" fill="#facc15" />
        </g>
      );
    case 'acc-beanie':
      return (
        <g>
          <path d="M36 44 C35 16 85 16 84 44 Z" fill="#e11d48" />
          <rect x="34" y="38" width="52" height="9" rx="4" fill="#be123c" />
          <circle cx="60" cy="16" r="6" fill="#fda4af" />
        </g>
      );
    case 'acc-headphones':
      return (
        <g>
          <path d="M36 52 C34 18 86 18 84 52" fill="none" stroke="#334155" strokeWidth="4.5" />
          <rect x="30" y="44" width="10" height="17" rx="4" fill="#0f172a" />
          <rect x="80" y="44" width="10" height="17" rx="4" fill="#0f172a" />
        </g>
      );
    case 'acc-grad-cap':
      return (
        <g>
          <path d="M44 32 L44 40 Q60 46 76 40 L76 32 Z" fill="#111827" />
          <path d="M28 28 L60 18 L92 28 L60 38 Z" fill="#1f2937" />
          <path d="M60 28 L84 32 L84 46" fill="none" stroke="#facc15" strokeWidth="1.8" />
          <circle cx="84" cy="47" r="2.5" fill="#facc15" />
        </g>
      );
    case 'acc-crown':
      return (
        <g>
          <path d="M42 32 L40 14 L50 23 L60 10 L70 23 L80 14 L78 32 Z" fill="#facc15" stroke="#ca8a04" strokeWidth="1.2" />
          <circle cx="60" cy="25" r="2.5" fill="#ef4444" />
          <circle cx="49" cy="28" r="1.8" fill="#3b82f6" />
          <circle cx="71" cy="28" r="1.8" fill="#22c55e" />
        </g>
      );
    default:
      return null;
  }
}
