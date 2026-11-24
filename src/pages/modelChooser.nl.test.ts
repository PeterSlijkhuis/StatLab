import { describe, expect, it } from 'vitest';
import { NL } from '../i18n/nl';
import { CUES } from './questionMatcher';
import { EXAMPLES } from './ModelChooser';
import { GROUPS, TREE, type Node } from './modelTree';

/** Every sentence the model chooser shows from data needs a Dutch entry. */
function strings(): string[] {
  const found: string[] = [];
  (function walk(node: Node) {
    if (node.kind === 'answer') {
      found.push(node.model, node.when, node.check, node.note);
      for (const extra of [node.traditional, node.further]) if (extra) found.push(extra);
      return;
    }
    found.push(node.text);
    if (node.help) found.push(node.help);
    for (const option of node.options) {
      found.push(option.label, option.example, option.tech);
      if (option.group) found.push(option.group);
      walk(option.next);
    }
  })(TREE);
  for (const group of GROUPS) found.push(group.name, group.blurb);
  for (const cue of CUES) found.push(cue.label, cue.why);
  found.push(...EXAMPLES);
  return [...new Set(found)];
}

describe('model chooser in Dutch', () => {
  it('translates every data string', () => {
    const missing = strings().filter((text) => !(text in NL));
    expect(missing).toEqual([]);
  });
});
