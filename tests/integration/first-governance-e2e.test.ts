import { execSync } from 'node:child_process';
import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { bootstrapFirstRuntime } from '../../src/core/skill-runtime/first-bootstrap.js';
import { advance } from '../../src/core/process-engine/advance.js';
import { Stage, type StageState } from '../../src/shared/types.js';

const TMP = join(import.meta.dirname, '../fixtures/.tmp-first-governance-e2e');
const FEATURE_ID = 'FSREQ-20260316-GOV-001';
const SPEC_DIR = join(TMP, 'specs', FEATURE_ID);

function initRepo(): void {
  execSync('git -c core.hooksPath=/dev/null init', { cwd: TMP, stdio: 'ignore' });
  execSync('git config user.email "dev@example.com"', { cwd: TMP, stdio: 'ignore' });
  execSync('git config user.name "Dev"', { cwd: TMP, stdio: 'ignore' });
  execSync('git config core.hooksPath /dev/null', { cwd: TMP, stdio: 'ignore' });
  execSync('git config commit.gpgsign false', { cwd: TMP, stdio: 'ignore' });
}

function writeStageState(currentStage: Stage): void {
  const state: StageState = {
    featureId: FEATURE_ID,
    mode: 'N',
    size: 'M',
    platforms: ['backend'],
    currentStage,
    history: [],
    terminal: false,
    createdAt: '2026-03-16T00:00:00.000Z',
    updatedAt: '2026-03-16T00:00:00.000Z',
  };
  writeFileSync(join(SPEC_DIR, 'stage-state.json'), JSON.stringify(state, null, 2), 'utf-8');
}

function seedFeatureDeliverables(): void {
  mkdirSync(join(TMP, '.spec-first', 'meta'), { recursive: true });
  mkdirSync(join(TMP, 'src', 'core', 'skill-runtime'), { recursive: true });
  mkdirSync(join(TMP, 'src', 'cli', 'commands'), { recursive: true });
  mkdirSync(join(SPEC_DIR, 'reports'), { recursive: true });

  writeFileSync(
    join(TMP, '.spec-first', 'meta', 'config.yaml'),
    'dependencies:\n  autoCheck: false\n',
    'utf-8'
  );
  writeFileSync(
    join(TMP, 'package.json'),
    JSON.stringify(
      {
        name: 'first-governance-e2e',
        version: '1.0.0',
        type: 'module',
        scripts: {
          'contract:check': 'echo ok',
        },
      },
      null,
      2
    ) + '\n',
    'utf-8'
  );
  writeFileSync(join(SPEC_DIR, 'findings.md'), '# Findings\n', 'utf-8');
  writeFileSync(join(SPEC_DIR, 'spec.md'), '# Spec\n', 'utf-8');
  writeFileSync(join(SPEC_DIR, 'retro.md'), '# Retro\n', 'utf-8');
  writeFileSync(join(SPEC_DIR, 'reports', 'release-note.md'), '# Release\n', 'utf-8');
  writeFileSync(join(SPEC_DIR, 'reports', 'smoke-test-report.md'), '# Smoke\n', 'utf-8');
  writeFileSync(
    join(SPEC_DIR, 'traceability-matrix.md'),
    [
      '| ID | Type | Title | Status | Upstream | Downstream |',
      '|----|------|-------|--------|----------|------------|',
      '| FR-GOV-001 | FR | Governance flow | Accepted |  | TASK-GOV-001,TC-UT-GOV-001 |',
      '| TASK-GOV-001 | TASK | Implement governance | Accepted | FR-GOV-001 |  |',
      '| TC-UT-GOV-001 | TC | Verify governance | Accepted | FR-GOV-001 |  |',
      '',
    ].join('\n'),
    'utf-8'
  );
  writeFileSync(
    join(TMP, 'src', 'core', 'skill-runtime', 'first-conventions.ts'),
    'export const marker = "baseline";\n',
    'utf-8'
  );
  writeFileSync(
    join(TMP, 'src', 'cli', 'commands', 'first.ts'),
    'export const commandMarker = "baseline";\n',
    'utf-8'
  );
}

beforeEach(() => {
  rmSync(TMP, { recursive: true, force: true });
  mkdirSync(TMP, { recursive: true });
  initRepo();
  seedFeatureDeliverables();
  bootstrapFirstRuntime(TMP, { mode: 'deep' });
  execSync('git -c core.hooksPath=/dev/null add .', { cwd: TMP, stdio: 'ignore' });
  execSync('git -c core.hooksPath=/dev/null -c commit.gpgsign=false commit -m "seed"', {
    cwd: TMP,
    stdio: 'ignore',
  });
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
});

describe('first governance e2e', () => {
  it('writes back canonical runtime truth when wrap_up advances with first runtime source changes', () => {
    writeStageState(Stage.WRAP_UP);
    writeFileSync(
      join(TMP, 'src', 'core', 'skill-runtime', 'first-conventions.ts'),
      'export const marker = "changed";\n',
      'utf-8'
    );

    const result = advance(FEATURE_ID, TMP);

    expect(result.from).toBe(Stage.WRAP_UP);
    expect(result.to).toBe(Stage.DONE);

    const updatesLog = readFileSync(
      join(TMP, '.spec-first', 'runtime', 'first', 'project-cognition-updates.jsonl'),
      'utf-8'
    );
    expect(updatesLog).toContain('"triggerStage":"06_wrap_up"');
    expect(updatesLog).toContain('"decision":"must_update"');
    expect(updatesLog).toContain('"gateStatus":"approved"');
    expect(updatesLog).toContain('"writebackMode":"refresh-all"');
    expect(updatesLog).toContain('"topicKey":"project-cognition/first"');
    expect(updatesLog).toContain('"assetId":"conventions.json"');
    expect(updatesLog).toContain('"updateSource":"governance-wrap-up"');

    const findings = readFileSync(join(SPEC_DIR, 'findings.md'), 'utf-8');
    expect(findings).toContain('PROJECT_COGNITION_APPROVED: must_update');

    const index = JSON.parse(
      readFileSync(join(TMP, '.spec-first', 'runtime', 'first', 'index.json'), 'utf-8')
    ) as { status: string; conventions: { healthy: boolean } };
    expect(index.status).toBe('current');
    expect(index.conventions.healthy).toBe(true);
  });

  it('reprojects canonical docs from runtime when release advances to done with docs drift', () => {
    writeStageState(Stage.RELEASE);
    writeFileSync(join(TMP, 'docs', 'first', 'README.md'), '# Drifted README\n', 'utf-8');

    const result = advance(FEATURE_ID, TMP);

    expect(result.from).toBe(Stage.RELEASE);
    expect(result.to).toBe(Stage.DONE);

    const readme = readFileSync(join(TMP, 'docs', 'first', 'README.md'), 'utf-8');
    expect(readme).not.toContain('Drifted README');
    expect(readme).toContain('Canonical Projection Docs');

    const updatesLog = readFileSync(
      join(TMP, '.spec-first', 'runtime', 'first', 'project-cognition-updates.jsonl'),
      'utf-8'
    );
    expect(updatesLog).toContain('"triggerStage":"08_done"');
    expect(updatesLog).toContain('"decision":"should_update"');
    expect(updatesLog).toContain('"writebackMode":"refresh-docs-from-runtime"');
    expect(updatesLog).toContain('"topicKey":"project-cognition/first"');
    expect(updatesLog).toContain('"assetId":"docs/first/README.md"');
    expect(updatesLog).toContain('"updateSource":"governance-done"');
  });
});
