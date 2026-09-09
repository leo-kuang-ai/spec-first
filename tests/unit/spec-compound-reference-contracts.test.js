'use strict';

const fs = require('node:fs');
const { phaseFiles } = require('../helpers/compound-contract');
const read = file => fs.readFileSync(`skills/spec-compound/${file}`, 'utf8');

describe('compound phase reference migration', () => {
  test('entrypoint routes every phase while retaining publication and mode boundaries', () => {
    const entry = read('SKILL.md');
    for (const file of phaseFiles) {
      expect(entry).toContain(`references/${file}`);
      expect(read(`references/${file}`).trim()).not.toBe('');
    }
    expect(entry).not.toContain('### Phase 2: Assembly');
    expect(entry).toContain('Final paths stay untouched until semantic promotion');
    expect(entry).toContain('`mode:headless` runs Full without session history');
    expect(entry).toContain('instruction-file edits');
    const assembly = entry.indexOf('3. **Assembly and grounding:**');
    const enhancement = entry.indexOf('4. **Optional enhancement:**');
    const publication = entry.indexOf('5. **Publication:**');
    expect(assembly).toBeGreaterThanOrEqual(0);
    expect(enhancement).toBeGreaterThan(assembly);
    expect(publication).toBeGreaterThan(enhancement);
  });

  test('Lightweight reads its shared validation and publication dependencies', () => {
    const lightweight = read('references/lightweight.md');
    for (const file of ['research.md', 'assembly.md', 'promotion.md']) {
      expect(lightweight).toContain(`references/${file}`);
    }
    expect(lightweight).toContain('No subagents are launched');
    expect(lightweight).toContain('Do **not** bootstrap or seed');
    const promotion = read('references/promotion.md');
    expect(promotion).toContain('recompute the recorded existence/SHA-256');
    expect(promotion).toContain('report the exact partial publication');
    expect(read('references/report.md')).toContain('never imply that all durable paths stayed unchanged');
  });

  test('session filters resolve Git context at runtime after restricted-read authorization', () => {
    const history = read('references/session-history.md');
    expect(history).toContain('After restricted-read authorization');
    expect(history).toContain('git rev-parse --abbrev-ref HEAD');
    expect(history).toContain('git rev-parse --show-toplevel');
    expect(history).toContain('Skip branch filtering on detached HEAD');
    expect(history).not.toContain('!`git');
  });
});
