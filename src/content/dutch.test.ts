import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const dir = join(__dirname, 'lessons');
const read = (path: string) => readFileSync(join(dir, path), 'utf8');

/** Everything a translation must leave alone: block ids, code, and which choice is correct. */
function skeleton(source: string) {
  return {
    blocks: [...source.matchAll(/<(Exercise|Quiz|Predict|Interpret|CodeBlock)\s+id="([^"]+)"/g)].map((m) => `${m[1]}:${m[2]}`),
    code: [...source.matchAll(/code=\{`([\s\S]*?)`\}/g)].map((m) => m[1]),
    correct: [...source.matchAll(/\{ text: /g)].length + ':' + [...source.matchAll(/correct: true/g)].length,
  };
}

describe('Dutch lessons', () => {
  const files = readdirSync(join(dir, 'nl')).filter((name) => name.endsWith('.mdx'));

  it.each(files)('%s keeps the blocks, code and answer keys of the English lesson', (name) => {
    const english = skeleton(read(name));
    const dutch = skeleton(read(`nl/${name}`));
    expect(dutch.blocks).toEqual(english.blocks);
    expect(dutch.code).toEqual(english.code);
    expect(dutch.correct).toBe(english.correct);
  });

  it('has no em dash', () => {
    for (const name of files) expect(read(`nl/${name}`), name).not.toContain('—');
  });
});
