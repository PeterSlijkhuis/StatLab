// @vitest-environment node
import { readFile, writeFile } from 'node:fs/promises';
import { WebR, type RCharacter } from 'webr';
import { afterAll, beforeAll, test } from 'vitest';
import { ALL_LESSONS } from '../manifest';
import { createLessonEnv, destroyEnv } from '../../r/environments';
import { evaluateR } from '../../r/evaluate';
import { ensurePackages, installCoursePackages, mountDatasets } from '../../r/session';

let webR: WebR;
let boot: string[];
beforeAll(async () => {
  webR = new WebR();
  await webR.init();
  const sp = await webR.evalR('search()');
  boot = (await (sp as RCharacter).toArray()) as string[];
  await installCoursePackages(webR);
  const declared = [...new Set(ALL_LESSONS.flatMap((lesson) => lesson.packages ?? []))];
  if (declared.length > 0) await ensurePackages(webR, declared);
  await mountDatasets(webR, async (name) =>
    new Uint8Array(await readFile(new URL(`../../../public/data/${name}`, import.meta.url))),
  );
}, 1_800_000);
afterAll(async () => { await webR.close(); });

const blocks = (s: string) =>
  [...s.matchAll(/<CodeBlock\s+id="([^"]+)"\s+code=\{`((?:\\[\s\S]|[^`\\])*)`\}\s*\/>/g)].map((m) => ({ id: m[1], code: m[2].replace(/\\([`$\\])/g, '$1') }));

test('print every lesson block output', async () => {
  let all = '';
  for (const lesson of ALL_LESSONS) {
    const src = (await readFile(new URL(`../lessons/${lesson.file}.mdx`, import.meta.url), 'utf8')).replace(/\r\n?/g, '\n');
    await webR.evalRVoid(`for (name in setdiff(search(), c(${boot.map((n) => JSON.stringify(n)).join(', ')}))) detach(name, character.only = TRUE, unload = FALSE)`);
    const env = await createLessonEnv(webR);
    for (const b of blocks(src)) {
      const r = await evaluateR(webR, b.code, { env, graphics: false });
      all += `\n##### ${lesson.id} ${b.id}\n` + r.output.map((o) => `[${o.type}] ${o.data}`).join('\n');
    }
    await destroyEnv(webR, env);
  }
  await writeFile('lesson-outputs.txt', all);
}, 3_600_000);
