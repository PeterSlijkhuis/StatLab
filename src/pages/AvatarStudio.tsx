import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Avatar from '../components/Avatar';
import { confetti, showToast } from '../components/celebrate';
import {
  SLOTS,
  buy,
  currentLook,
  owns,
  piecesFor,
  pointsSpent,
  pointsToSpend,
  wear,
  type Look,
  type Piece,
  type Slot,
} from '../state/avatar';
import { getProgress, subscribeProgress } from '../state/progress';
import { courseStats } from '../state/stats';
import './AvatarStudio.css';

type Tab = 'design' | 'shop';

/** Slots with pieces to buy. Hair and skin are the student's own, and free. */
const SHOP_SLOTS: { slot: Slot; heading: string }[] = [
  { slot: 'outfit', heading: 'Outfits' },
  { slot: 'accessory', heading: 'Accessories' },
  { slot: 'background', heading: 'Backgrounds' },
];
const SWATCH_SLOTS: Slot[] = ['skin', 'hairColour'];

export default function AvatarStudio() {
  const [, setTick] = useState(0);
  useEffect(() => subscribeProgress(() => setTick((tick) => tick + 1)), []);
  const [tab, setTab] = useState<Tab>('design');

  const progress = getProgress();
  const look = currentLook(progress);
  const earned = courseStats(progress).points;
  const balance = pointsToSpend(progress);
  const spent = pointsSpent(progress);

  function onBuy(p: Piece, button: HTMLElement) {
    if (!buy(getProgress(), p.id)) return;
    confetti(button);
    showToast(`${p.name} is yours`, `${p.price} points spent. Your avatar is wearing it now.`);
  }

  return (
    <div className="avatar-studio">
      <header className="avatar-studio-head">
        <Avatar look={look} size={148} label="Your avatar" />
        <div>
          <h1>Your avatar</h1>
          <p className="avatar-balance">
            <span aria-hidden="true">⭐</span> <strong>{balance}</strong> points to spend
          </p>
          <p className="avatar-balance-detail">
            {earned} earned, {spent} spent. Earn more by passing exercises (10), answering questions (5) and finishing lessons (20).
          </p>
        </div>
      </header>

      <div className="avatar-tabs" role="tablist" aria-label="Avatar">
        {(['design', 'shop'] as const).map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`avatar-tab-${id}`}
            aria-selected={tab === id}
            aria-controls={`avatar-panel-${id}`}
            className={tab === id ? 'avatar-tab active' : 'avatar-tab'}
            onClick={() => setTab(id)}
          >
            {id === 'design' ? 'Design' : 'Shop'}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`avatar-panel-${tab}`} aria-labelledby={`avatar-tab-${tab}`}>
        {tab === 'design'
          ? <Designer look={look} onShop={() => setTab('shop')} />
          : <Shop look={look} balance={balance} onBuy={onBuy} />}
      </div>

      <p className="avatar-note">
        Your avatar is saved in this browser along with your progress, and travels with it when you export your progress.
        Back to <Link to="/">your course</Link>.
      </p>
    </div>
  );
}

function Designer({ look, onShop }: { look: Look; onShop: () => void }) {
  const progress = getProgress();
  return (
    <div className="avatar-designer">
      {SLOTS.map(({ slot, label }) => {
        const pieces = piecesFor(slot);
        const mine = pieces.filter((p) => owns(progress, p.id));
        const locked = pieces.length - mine.length;
        return (
          <fieldset key={slot} className="avatar-slot">
            <legend>{label}</legend>
            <div className={SWATCH_SLOTS.includes(slot) ? 'avatar-options swatches' : 'avatar-options'}>
              {mine.map((p) => (
                <PieceButton key={p.id} piece={p} look={look} selected={look[slot] === p.id} onClick={() => wear(getProgress(), p.id)} />
              ))}
            </div>
            {locked > 0 && (
              <button type="button" className="avatar-more" onClick={onShop}>
                {locked} more in the shop
              </button>
            )}
          </fieldset>
        );
      })}
    </div>
  );
}

function PieceButton({ piece: p, look, selected, onClick }: { piece: Piece; look: Look; selected: boolean; onClick: () => void }) {
  if (SWATCH_SLOTS.includes(p.slot)) {
    return (
      <button
        type="button"
        className={selected ? 'avatar-swatch selected' : 'avatar-swatch'}
        aria-pressed={selected}
        aria-label={p.name}
        title={p.name}
        style={{ background: p.colour }}
        onClick={onClick}
      />
    );
  }
  return (
    <button type="button" className={selected ? 'avatar-option selected' : 'avatar-option'} aria-pressed={selected} onClick={onClick}>
      <Avatar look={{ ...look, [p.slot]: p.id }} size={64} />
      <span>{p.name}</span>
    </button>
  );
}

function Shop({ look, balance, onBuy }: { look: Look; balance: number; onBuy: (p: Piece, button: HTMLElement) => void }) {
  const progress = getProgress();
  return (
    <div className="avatar-shop">
      {SHOP_SLOTS.map(({ slot, heading }) => (
        <section key={slot} className="avatar-shop-section">
          <h2>{heading}</h2>
          <ul className="avatar-shop-grid">
            {piecesFor(slot).filter((p) => p.price > 0).map((p) => {
              const owned = owns(progress, p.id);
              const wearing = look[slot] === p.id;
              const short = p.price - balance;
              return (
                <li key={p.id} className={owned ? 'avatar-card owned' : 'avatar-card'}>
                  <Avatar look={{ ...look, [slot]: p.id }} size={88} />
                  <strong>{p.name}</strong>
                  {owned ? (
                    <button type="button" className="button button-secondary" disabled={wearing} onClick={() => wear(getProgress(), p.id)}>
                      {wearing ? 'Wearing' : 'Wear'}
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="button button-primary"
                        disabled={short > 0}
                        aria-label={`Buy ${p.name} for ${p.price} points`}
                        onClick={(event) => onBuy(p, event.currentTarget)}
                      >
                        ⭐ {p.price}
                      </button>
                      {short > 0 && <span className="avatar-short">{short} more points needed</span>}
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
