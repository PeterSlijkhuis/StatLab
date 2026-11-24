import { getLanguage } from '../state/language';
import { NL_FEEDBACK } from './nlFeedback';

/**
 * Feedback from the R checks is built in R out of fixed pieces of English and
 * numbers. The pieces are translated here: at each position the longest known
 * piece is swapped for its Dutch text and everything else (the numbers) is kept.
 */
const buckets = new Map<string, string[]>();
for (const key of Object.keys(NL_FEEDBACK)) {
  const list = buckets.get(key[0]) ?? [];
  list.push(key);
  buckets.set(key[0], list);
}
for (const list of buckets.values()) list.sort((a, b) => b.length - a.length);

export function translateFeedback(message: string): string {
  if (getLanguage() !== 'nl') return message;
  let out = '';
  let plain = '';
  const flush = () => {
    out += plain.replace(/(\d)\.(\d)/g, '$1,$2');
    plain = '';
  };
  let i = 0;
  while (i < message.length) {
    const hit = buckets.get(message[i])?.find((key) => message.startsWith(key, i));
    if (hit) {
      flush();
      out += NL_FEEDBACK[hit];
      i += hit.length;
    } else {
      plain += message[i++];
    }
  }
  flush();
  return out;
}
