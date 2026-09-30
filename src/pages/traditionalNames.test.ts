import { expect, test } from 'vitest';
import { GROUPS, TREE, type Node } from './modelTree';
import { CUES } from './questionMatcher';
import { DESIGNS } from './sampleSizeDesigns';

// The course teaches models, so the chooser and the sample size page name a
// traditional test only with "traditional" a few words before it.
const NAMES =
  /t-test|\bANOVAs?\b|ANCOVA|MANOVA|chi-square test|chi-square goodness|goodness-of-fit test|Mann-Whitney|Wilcoxon|Kruskal-Wallis|Friedman|Fisher'?s? exact|McNemar|Welch|binomial test|log-rank|Sobel|Spearman|Pearson correlation|test of two proportions/gi;

function unprefixed(text: string): string[] {
  const bad: string[] = [];
  for (const match of text.matchAll(NAMES)) {
    const at = match.index!;
    const after = text.slice(at + match[0].length);
    // R code in the prose: anova(), friedman.test(), method = "spearman".
    if (/^(\(|\.test)/.test(after) || /["._]$/.test(text.slice(0, at))) continue;
    if (!/traditional\s+(\S+\s+){0,5}$/i.test(text.slice(0, at))) bad.push(`${match[0]} in: ${text.slice(Math.max(0, at - 60), at + 30)}`);
  }
  return bad;
}

function treeTexts(node: Node): string[] {
  if (node.kind === 'answer') {
    const { rCode: _code, id: _id, lessonId: _lesson, buildsOn: _builds, kind: _kind, ...texts } = node;
    return Object.values(texts).filter((value): value is string => typeof value === 'string');
  }
  return [node.text, node.help ?? '', ...node.options.flatMap((option) => [option.label, option.example, option.tech, option.group ?? '', ...treeTexts(option.next)])];
}

test('the model chooser names traditional tests only as traditional', () => {
  const texts = [...treeTexts(TREE), ...GROUPS.flatMap((group) => [group.name, group.blurb]), ...CUES.flatMap((cue) => [cue.label, cue.why])];
  expect(texts.flatMap(unprefixed)).toEqual([]);
});

test('the sample size page names traditional tests only as traditional', () => {
  const texts = DESIGNS.flatMap(({ id: _id, model: _model, lessonId: _lesson, ...design }) => Object.values(design).filter((value): value is string => typeof value === 'string'));
  expect(texts.flatMap(unprefixed)).toEqual([]);
});

test('the check itself catches a bare test name', () => {
  expect(unprefixed('the paired t-test')).toHaveLength(1);
  expect(unprefixed('the traditional paired t-test, then anova(model)')).toEqual([]);
});
