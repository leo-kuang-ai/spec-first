import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { DEFAULT_SPEC_FIRST_CONFIG } from '../../src/shared/config-schema.js';
import { mergeLayerRules } from '../../src/core/process-engine/layer-merger.js';
import { ensureArtifacts } from '../../src/core/template/artifact-checker.js';

const TMP = join(import.meta.dirname, '../../tests/fixtures/.tmp-release-evidence-governance');
const FEAT = 'FSREQ-20260307-REL-001';
const FEAT_DIR = join(TMP, 'specs', FEAT);

beforeEach(() => {
  mkdirSync(join(FEAT_DIR, 'reports'), { recursive: true });
  mkdirSync(join(TMP, 'templates', 'init'), { recursive: true });
  mkdirSync(join(TMP, 'templates', 'matrix'), { recursive: true });
  mkdirSync(join(TMP, 'templates', 'release'), { recursive: true });
  writeFileSync(join(TMP, 'templates', 'init', 'constitution.md.hbs'), '# {{featureId}}');
  writeFileSync(join(TMP, 'templates', 'matrix', 'traceability-matrix.md.hbs'), '| {{featureId}} |');
  writeFileSync(join(TMP, 'templates', 'release', 'release-note.md.hbs'), '# release {{featureId}}');
  writeFileSync(join(TMP, 'templates', 'release', 'smoke-test-report.md.hbs'), '# smoke {{featureId}}');
});

afterEach(() => rmSync(TMP, { recursive: true, force: true }));

describe('release evidence governance', () => {
  it('requires both release-note and smoke-test-report in config defaults', () => {
    expect(DEFAULT_SPEC_FIRST_CONFIG.dependencies?.stages?.['07_release']).toEqual({
      files: [
        'specs/{featureId}/reports/smoke-test-report.md',
        'specs/{featureId}/reports/release-note.md',
      ],
      npmScripts: ['contract:check'],
    });
  });

  it('exposes wrap-up and release deliverables from merged rules', () => {
    const rules = mergeLayerRules('N', 'S', [], TMP);
    expect(rules.deliverables['06_wrap_up'].some((item) => item.name === 'retro.md')).toBe(true);
    expect(rules.deliverables['07_release'].map((item) => item.name)).toEqual([
      'reports/smoke-test-report.md',
      'reports/release-note.md',
    ]);
  });

  it('materializes release report skeletons at 07_release', () => {
    writeFileSync(join(FEAT_DIR, 'stage-state.json'), JSON.stringify({
      featureId: FEAT,
      mode: 'N',
      size: 'S',
      platforms: ['app'],
      currentStage: '07_release',
      history: [],
      terminal: false,
    }));

    const result = ensureArtifacts(FEAT, TMP);
    expect(result.created).toBeGreaterThanOrEqual(2);
    expect(result.missing).not.toContain('reports/release-note.md');
    expect(result.missing).not.toContain('reports/smoke-test-report.md');
  });
});
