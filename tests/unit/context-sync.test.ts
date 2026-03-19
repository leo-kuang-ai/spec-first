import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Stage } from '../../src/shared/types.js';
import { syncAgentContextFromDesign } from '../../src/core/tool-integration/context-sync.js';

const TMP = join(import.meta.dirname, '../../tests/fixtures/.tmp-context-sync');
const FEAT = 'FSREQ-20260226-CONTEXT-001';

beforeEach(() => {
  mkdirSync(join(TMP, 'specs', FEAT), { recursive: true });
  writeFileSync(join(TMP, 'specs', FEAT, 'stage-state.json'), JSON.stringify({
    featureId: FEAT,
    mode: 'N',
    size: 'S',
    platforms: ['backend'],
    currentStage: Stage.PLAN,
    history: [],
    terminal: false,
    createdAt: '2026-02-26T00:00:00Z',
    updatedAt: '2026-02-26T00:00:00Z',
  }, null, 2), 'utf-8');
  writeFileSync(join(TMP, 'specs', FEAT, 'design.md'), '# Design\n## API\n## Data Model\n', 'utf-8');
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
});

describe('syncAgentContextFromDesign', () => {
  it('should update managed block and preserve manual block', () => {
    const claudePath = join(TMP, 'CLAUDE.md');
    writeFileSync(
      claudePath,
      '# CLAUDE\n\n<!-- SPEC-FIRST:BEGIN MANUAL -->\nmanual-note\n<!-- SPEC-FIRST:END MANUAL -->\n\n'
      + '<!-- SPEC-FIRST:BEGIN AUTO-CONTEXT -->\nold\n<!-- SPEC-FIRST:END AUTO-CONTEXT -->\n',
      'utf-8',
    );

    const result = syncAgentContextFromDesign(FEAT, TMP);
    expect(result.updated).toContain(claudePath);

    const content = readFileSync(claudePath, 'utf-8');
    expect(content).toContain('manual-note');
    expect(content).toContain('Spec-First Context Snapshot');
    expect(content).toContain(`Feature: ${FEAT}`);
    expect(content).toContain('Design Highlights');
  });

  it('should skip missing context targets without throwing', () => {
    const result = syncAgentContextFromDesign(FEAT, TMP);
    expect(result.updated).toHaveLength(0);
    expect(result.skipped.length).toBeGreaterThan(0);
  });
});

