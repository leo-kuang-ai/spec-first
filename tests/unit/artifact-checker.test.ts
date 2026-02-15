import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ensureArtifacts, listArtifacts } from '../../src/core/template/artifact-checker.js';

const TMP = join(import.meta.dirname, '../../tests/fixtures/.tmp-artifact');
const FEAT = 'FSREQ-20260211-AUTH-001';
const FEAT_DIR = join(TMP, 'specs', FEAT);

function writeState(mode: string, size: string, stage: string) {
  writeFileSync(join(FEAT_DIR, 'stage-state.json'), JSON.stringify({
    featureId: FEAT,
    mode,
    size,
    platforms: ['app'],
    currentStage: stage,
    history: [],
    terminal: false,
  }));
}

beforeEach(() => {
  mkdirSync(FEAT_DIR, { recursive: true });
  mkdirSync(join(TMP, 'templates', 'init'), { recursive: true });
  mkdirSync(join(TMP, 'templates', 'matrix'), { recursive: true });
  mkdirSync(join(TMP, 'templates', 'release'), { recursive: true });
  // stub 模板文件，避免 renderTemplate 报 "not found"
  writeFileSync(join(TMP, 'templates', 'init', 'constitution.md.hbs'), '# {{featureId}}');
  writeFileSync(join(TMP, 'templates', 'matrix', 'traceability-matrix.md.hbs'), '| {{featureId}} |');
  writeFileSync(join(TMP, 'templates', 'release', 'release-note.md.hbs'), '# {{featureId}}');
  writeFileSync(join(TMP, 'templates', 'release', 'smoke-test-report.md.hbs'), '# {{featureId}}');
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
});

describe('listArtifacts', () => {
  it('should list init artifacts as missing when only stage-state exists', () => {
    writeState('N', 'M', '00_init');
    const list = listArtifacts(FEAT, TMP);
    const stageState = list.find((a) => a.name === 'stage-state.json');
    expect(stageState?.status).toBe('present');

    const constitution = list.find((a) => a.name === 'constitution.md');
    expect(constitution?.status).toBe('missing');
    expect(constitution?.required).toBe(true);
  });

  it('should mark research.md as skipped for Mode N-S', () => {
    writeState('N', 'S', '02_design');
    const list = listArtifacts(FEAT, TMP);
    const research = list.find((a) => a.name === 'research.md');
    expect(research?.status).toBe('skipped');
    expect(research?.required).toBe(false);
  });

  it('should mark research.md as missing for Mode N-M', () => {
    writeState('N', 'M', '02_design');
    const list = listArtifacts(FEAT, TMP);
    const research = list.find((a) => a.name === 'research.md');
    expect(research?.status).toBe('missing');
    expect(research?.required).toBe(true);
  });

  it('should mark impact-analysis.md as skipped for Mode N', () => {
    writeState('N', 'L', '02_design');
    const list = listArtifacts(FEAT, TMP);
    const impact = list.find((a) => a.name === 'impact-analysis.md');
    expect(impact?.status).toBe('skipped');
    expect(impact?.required).toBe(false);
  });

  it('should mark impact-analysis.md as required for Mode I', () => {
    writeState('I', 'M', '02_design');
    const list = listArtifacts(FEAT, TMP);
    const impact = list.find((a) => a.name === 'impact-analysis.md');
    expect(impact?.status).toBe('missing');
    expect(impact?.required).toBe(true);
  });

  it('should mark data-model.md as skipped for Mode N-S', () => {
    writeState('N', 'S', '02_design');
    const list = listArtifacts(FEAT, TMP);
    const dm = list.find((a) => a.name === 'data-model.md');
    expect(dm?.status).toBe('skipped');
    expect(dm?.required).toBe(false);
  });

  it('should mark regression-report as skipped for Mode N', () => {
    writeState('N', 'M', '05_verify');
    const list = listArtifacts(FEAT, TMP);
    const reg = list.find((a) => a.name === 'reports/regression-report.md');
    expect(reg?.status).toBe('skipped');
  });

  it('should mark regression-report as required for Mode I', () => {
    writeState('I', 'S', '05_verify');
    const list = listArtifacts(FEAT, TMP);
    const reg = list.find((a) => a.name === 'reports/regression-report.md');
    expect(reg?.status).toBe('missing');
    expect(reg?.required).toBe(true);
  });
});

describe('ensureArtifacts', () => {
  it('should report missing init artifacts', () => {
    writeState('N', 'M', '00_init');
    const result = ensureArtifacts(FEAT, TMP);
    // stage-state.json exists, others missing (no templates in TMP)
    expect(result.checked).toBeGreaterThan(0);
    expect(result.missing.length).toBeGreaterThan(0);
  });

  it('should skip N-S artifacts in design stage', () => {
    writeState('N', 'S', '02_design');
    const result = ensureArtifacts(FEAT, TMP);
    // research.md, data-model.md, adr/ should be skipped
    expect(result.skipped).toBeGreaterThanOrEqual(3);
  });

  it('should not skip artifacts for Mode I', () => {
    writeState('I', 'M', '02_design');
    const result = ensureArtifacts(FEAT, TMP);
    // impact-analysis.md should NOT be skipped
    expect(result.missing).toContain('impact-analysis.md');
  });

  it('should only check artifacts up to current stage', () => {
    writeState('N', 'M', '00_init');
    const result = ensureArtifacts(FEAT, TMP);
    // Should not check spec.md (01_specify) or design.md (02_design)
    expect(result.missing).not.toContain('spec.md');
    expect(result.missing).not.toContain('design.md');
  });
});
