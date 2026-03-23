/**
 * Gate 推进链集成测试
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { evaluateGate } from '../../src/core/gate-engine/gate-evaluator.js';

const TMP = join(import.meta.dirname, '../fixtures/.tmp-gate-flow');
const FEAT = 'FSREQ-20260312-FLOW-001';

function writeState(stage: string, mergedRules = {}) {
  writeFileSync(
    join(TMP, 'specs', FEAT, 'stage-state.json'),
    JSON.stringify({
      featureId: FEAT,
      mode: 'N',
      size: 'M',
      platforms: ['h5'],
      currentStage: stage,
      history: [],
      terminal: false,
      createdAt: '2026-03-12T00:00:00Z',
      updatedAt: '2026-03-12T00:00:00Z',
      mergedRules,
    })
  );
}

function writeDocumentLinks(content: string) {
  writeFileSync(join(TMP, 'specs', FEAT, 'document-links.yaml'), content, 'utf-8');
}

beforeEach(() => {
  mkdirSync(join(TMP, 'specs', FEAT, 'reports'), { recursive: true });
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
});

describe('gate flow integration', () => {
  it('should pass through init -> specify -> design with warnings', () => {
    writeState('00_init');
    let result = evaluateGate(FEAT, TMP);
    expect(result.status).toBe('PASS');

    writeState('01_specify');
    writeFileSync(join(TMP, 'specs', FEAT, 'prd.md'), '# PRD\n## 1. 业务目标\nTest', 'utf-8');
    writeFileSync(join(TMP, 'specs', FEAT, 'spec.md'), '# Spec', 'utf-8');
    writeDocumentLinks([
      'version: 1',
      `featureId: ${FEAT}`,
      'documents:',
      '  - path: spec.md',
      '    kind: requirements',
      '    stage: 01_specify',
      '    references: []',
      '',
    ].join('\n'));
    mkdirSync(join(TMP, 'specs', FEAT, 'checklists'), { recursive: true });
    writeFileSync(
      join(TMP, 'specs', FEAT, 'checklists', 'spec-review.md'),
      '- [x] Item1\n- [ ] Item2\n',
      'utf-8'
    );

    result = evaluateGate(FEAT, TMP);
    expect(result.status).toBe('PASS');
    const warnings = result.conditions.filter(
      (condition) => condition.blocking === false && condition.status === 'FAIL'
    );
    expect(warnings.length).toBeGreaterThan(0);

    writeState('02_design');
    writeFileSync(join(TMP, 'specs', FEAT, 'design.md'), '# Design', 'utf-8');
    writeFileSync(
      join(TMP, 'specs', FEAT, 'constitution.md'),
      '# Constitution\n- Version: 1.0.0\n- Ratified: 2026-02-26\n- Last Amended: 2026-02-26\n\n## Amendment History\n- init\n',
      'utf-8'
    );
    writeDocumentLinks([
      'version: 1',
      `featureId: ${FEAT}`,
      'documents:',
      '  - path: spec.md',
      '    kind: requirements',
      '    stage: 01_specify',
      '    references: []',
      '  - path: design.md',
      '    kind: design',
      '    stage: 02_design',
      '    references:',
      '      - spec.md',
      '',
    ].join('\n'));

    result = evaluateGate(FEAT, TMP);
    expect(result.status).toBe('PASS');
  });

  it('should apply profile-specific Layer2 rules', () => {
    writeState('00_init', {
      gateConditions: {
        '00_init': [
          {
            id: 'L2-PROFILE-001',
            description: 'Profile test',
            command: 'node -e "process.exit(0)"',
          },
        ],
      },
    });

    const result = evaluateGate(FEAT, TMP);
    expect(result.conditions.find((condition) => condition.id === 'L2-PROFILE-001')?.status).toBe(
      'PASS'
    );
  });
});
