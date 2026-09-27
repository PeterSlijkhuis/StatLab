import { saveAvatar, type Progress } from './progress';
import { courseStats } from './stats';

/**
 * The avatar a student builds, and the shop where points buy more of it.
 *
 * Points are never stored: they are worked out from progress each time (see
 * `courseStats`). So nothing here subtracts from them. What a student can
 * spend is what they have earned less the price of everything they own.
 */

export type Slot = 'skin' | 'hairStyle' | 'hairColour' | 'outfit' | 'accessory' | 'background';

export type Piece = {
  id: string;
  slot: Slot;
  name: string;
  /** 0 means every student has it from the start. */
  price: number;
  /** A colour for swatches, where the piece is one. */
  colour?: string;
};

export const SLOTS: { slot: Slot; label: string }[] = [
  { slot: 'skin', label: 'Skin tone' },
  { slot: 'hairStyle', label: 'Hair style' },
  { slot: 'hairColour', label: 'Hair colour' },
  { slot: 'outfit', label: 'Outfit' },
  { slot: 'accessory', label: 'Accessory' },
  { slot: 'background', label: 'Background' },
];

export const PIECES: Piece[] = [
  { id: 'skin-1', slot: 'skin', name: 'Porcelain', price: 0, colour: '#fbe3d3' },
  { id: 'skin-2', slot: 'skin', name: 'Peach', price: 0, colour: '#f3c9a8' },
  { id: 'skin-3', slot: 'skin', name: 'Sand', price: 0, colour: '#e0a97e' },
  { id: 'skin-4', slot: 'skin', name: 'Honey', price: 0, colour: '#c68656' },
  { id: 'skin-5', slot: 'skin', name: 'Bronze', price: 0, colour: '#96603b' },
  { id: 'skin-6', slot: 'skin', name: 'Umber', price: 0, colour: '#6a4128' },

  { id: 'hair-short', slot: 'hairStyle', name: 'Short', price: 0 },
  { id: 'hair-long', slot: 'hairStyle', name: 'Long', price: 0 },
  { id: 'hair-bob', slot: 'hairStyle', name: 'Bob', price: 0 },
  { id: 'hair-curly', slot: 'hairStyle', name: 'Curly', price: 0 },
  { id: 'hair-bun', slot: 'hairStyle', name: 'Bun', price: 0 },
  { id: 'hair-spiky', slot: 'hairStyle', name: 'Spiky', price: 0 },
  { id: 'hair-none', slot: 'hairStyle', name: 'None', price: 0 },

  { id: 'colour-black', slot: 'hairColour', name: 'Black', price: 0, colour: '#1f1a17' },
  { id: 'colour-brown', slot: 'hairColour', name: 'Brown', price: 0, colour: '#5b3a24' },
  { id: 'colour-auburn', slot: 'hairColour', name: 'Auburn', price: 0, colour: '#8f3b1b' },
  { id: 'colour-blonde', slot: 'hairColour', name: 'Blonde', price: 0, colour: '#e3bf6b' },
  { id: 'colour-grey', slot: 'hairColour', name: 'Grey', price: 0, colour: '#a7a9ad' },
  { id: 'colour-pink', slot: 'hairColour', name: 'Pink', price: 0, colour: '#ec6fae' },
  { id: 'colour-blue', slot: 'hairColour', name: 'Blue', price: 0, colour: '#4a7de8' },
  { id: 'colour-green', slot: 'hairColour', name: 'Green', price: 0, colour: '#2fa87a' },

  { id: 'outfit-tee', slot: 'outfit', name: 'T-shirt', price: 0 },
  { id: 'outfit-hoodie', slot: 'outfit', name: 'Hoodie', price: 60 },
  { id: 'outfit-stripes', slot: 'outfit', name: 'Striped jumper', price: 80 },
  { id: 'outfit-r-tee', slot: 'outfit', name: 'R T-shirt', price: 100 },
  { id: 'outfit-shirt-tie', slot: 'outfit', name: 'Shirt and tie', price: 150 },
  { id: 'outfit-lab-coat', slot: 'outfit', name: 'Lab coat', price: 200 },
  { id: 'outfit-bell-curve', slot: 'outfit', name: 'Bell curve jumper', price: 250 },
  { id: 'outfit-gown', slot: 'outfit', name: 'Graduation gown', price: 400 },

  { id: 'acc-none', slot: 'accessory', name: 'None', price: 0 },
  { id: 'acc-glasses', slot: 'accessory', name: 'Glasses', price: 40 },
  { id: 'acc-flower', slot: 'accessory', name: 'Flower', price: 50 },
  { id: 'acc-beanie', slot: 'accessory', name: 'Beanie', price: 70 },
  { id: 'acc-sunglasses', slot: 'accessory', name: 'Sunglasses', price: 90 },
  { id: 'acc-headphones', slot: 'accessory', name: 'Headphones', price: 120 },
  { id: 'acc-grad-cap', slot: 'accessory', name: 'Graduation cap', price: 300 },
  { id: 'acc-crown', slot: 'accessory', name: 'Crown', price: 500 },

  { id: 'bg-plain', slot: 'background', name: 'Plain', price: 0, colour: '#e0e7ff' },
  { id: 'bg-mint', slot: 'background', name: 'Mint', price: 30, colour: '#bbf7d0' },
  { id: 'bg-sunset', slot: 'background', name: 'Sunset', price: 80, colour: '#fdba74' },
  { id: 'bg-ocean', slot: 'background', name: 'Ocean', price: 80, colour: '#7dd3fc' },
  { id: 'bg-scatter', slot: 'background', name: 'Scatter plot', price: 150, colour: '#fef3c7' },
  { id: 'bg-galaxy', slot: 'background', name: 'Galaxy', price: 250, colour: '#312e81' },
];

export type Look = Record<Slot, string>;

export const DEFAULT_LOOK: Look = {
  skin: 'skin-3',
  hairStyle: 'hair-short',
  hairColour: 'colour-brown',
  outfit: 'outfit-tee',
  accessory: 'acc-none',
  background: 'bg-plain',
};

const BY_ID = new Map(PIECES.map((piece) => [piece.id, piece]));

export function piece(id: string): Piece | undefined {
  return BY_ID.get(id);
}

export function piecesFor(slot: Slot): Piece[] {
  return PIECES.filter((p) => p.slot === slot);
}

/** Pieces bought, ignoring ids a later version of the catalogue dropped. */
export function ownedIds(progress: Progress): Set<string> {
  return new Set((progress.avatar?.owned ?? []).filter((id) => BY_ID.has(id)));
}

export function owns(progress: Progress, id: string): boolean {
  const p = piece(id);
  return Boolean(p) && (p!.price === 0 || ownedIds(progress).has(id));
}

/**
 * The saved look, slot by slot, falling back to the default wherever the
 * saved piece is unknown, in the wrong slot, or not owned. An imported file
 * can say anything; the avatar should still draw.
 */
export function currentLook(progress: Progress): Look {
  const saved = progress.avatar?.look ?? {};
  const look = { ...DEFAULT_LOOK };
  for (const { slot } of SLOTS) {
    const id = saved[slot];
    if (id && piece(id)?.slot === slot && owns(progress, id)) look[slot] = id;
  }
  return look;
}

export function pointsSpent(progress: Progress): number {
  let spent = 0;
  for (const id of ownedIds(progress)) spent += piece(id)!.price;
  return spent;
}

/**
 * Never below zero. Earned points can fall (a quiz answered right and then
 * wrong), and a student who spent them keeps what they bought.
 */
export function pointsToSpend(progress: Progress): number {
  return Math.max(0, courseStats(progress).points - pointsSpent(progress));
}

export function wear(progress: Progress, id: string): boolean {
  const p = piece(id);
  if (!p || !owns(progress, id)) return false;
  saveAvatar({ look: { ...currentLook(progress), [p.slot]: id }, owned: [...ownedIds(progress)] });
  return true;
}

/** Buys the piece and puts it on. False if it is free, owned, or unaffordable. */
export function buy(progress: Progress, id: string): boolean {
  const p = piece(id);
  if (!p || owns(progress, id) || pointsToSpend(progress) < p.price) return false;
  saveAvatar({ look: { ...currentLook(progress), [p.slot]: id }, owned: [...ownedIds(progress), id] });
  return true;
}
