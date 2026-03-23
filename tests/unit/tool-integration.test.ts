/**
 * M7 ToolIntegration 单元测试
 * Hook Installer + Commit + Feature CLI + Doctor Extended + AI Runtime Hook
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdirSync, rmSync, writeFileSync, readFileSync, existsSync, symlinkSync, lstatSync } from 'node:fs';
import { join } from 'node:path';
import { installHooks, uninstallHooks, checkHooks } from '../../src/core/tool-integration/hook-installer.js';
import { generateAIHookConfigs, registerAIHooks, executePreToolUse, executeStopHook } from '../../src/core/tool-integration/ai-runtime-hook.js';
import { handleFeature } from '../../src/cli/commands/feature.js';
import { handleStatus } from '../../src/cli/commands/status.js';
import { handleCommit } from '../../src/cli/commands/commit.js';
import { ExitCode } from '../../src/shared/types.js';

const TMP = join(import.meta.dirname, '../../tests/fixtures/.tmp-tool-integration');

function withCwd(dir: string, fn: () => number): number {
  const orig = process.cwd;
  process.cwd = () => dir;
  try { return fn(); } finally { process.cwd = orig; }
}

function captureConsole(run: () => number): { code: number; stdout: string; stderr: string } {
  const stdout: string[] = [];
  const stderr: string[] = [];
  const logSpy = vi.spyOn(console, 'log').mockImplementation((msg?: unknown) => {
    stdout.push(String(msg ?? ''));
  });
  const errSpy = vi.spyOn(console, 'error').mockImplementation((msg?: unknown) => {
    stderr.push(String(msg ?? ''));
  });

  try {
    return {
      code: run(),
      stdout: stdout.join('\n'),
      stderr: stderr.join('\n'),
    };
  } finally {
    logSpy.mockRestore();
    errSpy.mockRestore();
  }
}

beforeEach(() => {
  mkdirSync(join(TMP, '.git', 'hooks'), { recursive: true });
  mkdirSync(join(TMP, '.spec-first'), { recursive: true });
  mkdirSync(join(TMP, 'specs'), { recursive: true });
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
});

// ─── Hook Installer Tests ───────────────────────────────

describe('installHooks', () => {
  it('should install 4 hooks', () => {
    const installed = installHooks(TMP);
    expect(installed).toHaveLength(4);
    expect(installed).toContain('prepare-commit-msg');
    expect(installed).toContain('commit-msg');
  });

  it('should create executable hook files', () => {
    installHooks(TMP);
    const hookPath = join(TMP, '.git', 'hooks', 'commit-msg');
    expect(existsSync(hookPath)).toBe(true);
    const content = readFileSync(hookPath, 'utf-8');
    expect(content).toContain('#!/bin/sh');
    expect(content).toContain('spec-first-hook');
  });

  it('should keep existing custom hook content', () => {
    const preCommitPath = join(TMP, '.git', 'hooks', 'pre-commit');
    writeFileSync(preCommitPath, '#!/bin/sh\necho custom-pre-commit\n', 'utf-8');
    installHooks(TMP);
    const content = readFileSync(preCommitPath, 'utf-8');
    expect(content).toContain('echo custom-pre-commit');
    expect(content).toContain('spec-first-hook');
  });

  it('should refresh existing spec-first hook block to latest template', () => {
    const preCommitPath = join(TMP, '.git', 'hooks', 'pre-commit');
    writeFileSync(
      preCommitPath,
      '#!/bin/sh\necho custom-pre-commit\n\n#!/bin/sh\n# spec-first-hook\necho OLD_PRECOMMIT_TEMPLATE\n',
      'utf-8',
    );

    installHooks(TMP);
    const content = readFileSync(preCommitPath, 'utf-8');

    expect(content).toContain('echo custom-pre-commit');
    expect(content).not.toContain('OLD_PRECOMMIT_TEMPLATE');
    expect(content).toContain('--diff-filter=ACMRD');
    expect(content).toContain('while IFS= read -r FILE');
  });

  it('should replace dangling legacy symlink hooks with managed files', () => {
    const hookPath = join(TMP, '.git', 'hooks', 'commit-msg');
    symlinkSync(join(TMP, '.spec-first', 'hooks', 'commit-msg.sh'), hookPath);

    const installed = installHooks(TMP);
    const stat = lstatSync(hookPath);
    const content = readFileSync(hookPath, 'utf-8');

    expect(installed).toContain('commit-msg');
    expect(stat.isSymbolicLink()).toBe(false);
    expect(content).toContain('spec-first-hook');
    expect(content).toContain('有效 ID');
  });
});

describe('uninstallHooks', () => {
  it('should remove spec-first hooks', () => {
    installHooks(TMP);
    const removed = uninstallHooks(TMP);
    expect(removed).toHaveLength(4);
    expect(existsSync(join(TMP, '.git', 'hooks', 'commit-msg'))).toBe(false);
  });

  it('should not remove non-spec-first hooks', () => {
    writeFileSync(join(TMP, '.git', 'hooks', 'pre-commit'), '#!/bin/sh\necho custom');
    const removed = uninstallHooks(TMP);
    expect(removed).toHaveLength(0);
    expect(existsSync(join(TMP, '.git', 'hooks', 'pre-commit'))).toBe(true);
  });

  it('should keep custom hook when uninstalling appended spec-first block', () => {
    const preCommitPath = join(TMP, '.git', 'hooks', 'pre-commit');
    writeFileSync(preCommitPath, '#!/bin/sh\necho custom\n', 'utf-8');
    installHooks(TMP);
    const removed = uninstallHooks(TMP);
    expect(removed).toContain('pre-commit');
    expect(existsSync(preCommitPath)).toBe(true);
    expect(readFileSync(preCommitPath, 'utf-8')).toContain('echo custom');
  });
});

describe('checkHooks', () => {
  it('should report all hooks not installed', () => {
    const statuses = checkHooks(TMP);
    expect(statuses).toHaveLength(4);
    expect(statuses.every(s => !s.installed)).toBe(true);
  });

  it('should detect spec-first hooks', () => {
    installHooks(TMP);
    const statuses = checkHooks(TMP);
    expect(statuses.every(s => s.installed && s.isSpecFirst)).toBe(true);
  });
});

// ─── Feature CLI Tests ──────────────────────────────────

const FEAT = 'FSREQ-20260211-AUTH-001';

function writeFeatureState() {
  mkdirSync(join(TMP, 'specs', FEAT), { recursive: true });
  writeFileSync(join(TMP, 'specs', FEAT, 'stage-state.json'), JSON.stringify({
    featureId: FEAT, mode: 'N', size: 'M', platforms: ['h5'],
    currentStage: '04_implement', history: [], terminal: false,
    title: 'Auth Module', createdAt: '2026-02-11T00:00:00Z', updatedAt: '2026-02-11T00:00:00Z',
  }));
}

describe('handleFeature', () => {
  it('should return VALIDATION_ERROR without subcommand', () => {
    const code = withCwd(TMP, () => handleFeature([]));
    expect(code).toBe(ExitCode.VALIDATION_ERROR);
  });

  it('should list features', () => {
    writeFeatureState();
    const code = withCwd(TMP, () => handleFeature(['list']));
    expect(code).toBe(ExitCode.SUCCESS);
  });

  it('should show current (no current set)', () => {
    const { code, stdout } = captureConsole(() => withCwd(TMP, () => handleFeature(['current'])));
    expect(code).toBe(ExitCode.SUCCESS);
    expect(stdout).toContain('尚未设置当前 Feature');
    expect(stdout).toContain('spec-first feature switch <featureId> --yes');
  });

  it('should switch feature', () => {
    writeFeatureState();
    const { code, stdout } = captureConsole(() => withCwd(TMP, () => handleFeature(['switch', FEAT])));
    expect(code).toBe(ExitCode.SUCCESS);
    const current = readFileSync(join(TMP, '.spec-first', 'current'), 'utf-8');
    expect(current).toBe(FEAT);
    expect(stdout).toContain(`已切换到：${FEAT}`);
    expect(stdout).toContain('.spec-first/current 已更新');
    expect(stdout).toContain('/spec-first:catchup');
  });

  it('should fail switch for nonexistent feature', () => {
    const { code, stderr } = captureConsole(() =>
      withCwd(TMP, () => handleFeature(['switch', 'NONEXIST']))
    );
    expect(code).toBe(ExitCode.VALIDATION_ERROR);
    expect(stderr).toContain('失败时未改写 .spec-first/current');
  });
});

describe('handleStatus', () => {
  function writeRuntimeIndex() {
    mkdirSync(join(TMP, '.spec-first', 'runtime', 'first'), { recursive: true });
    writeFileSync(
      join(TMP, '.spec-first', 'runtime', 'first', 'index.json'),
      JSON.stringify({
        version: '1.0.0',
        lastRun: '2026-03-18T00:00:00Z',
        summary: { path: '.spec-first/runtime/first/summary.json', fileHash: 'a', lastUpdated: '2026-03-18T00:00:00Z', healthy: true },
        steering: { path: '.spec-first/runtime/first/steering.json', fileHash: 'b', lastUpdated: '2026-03-18T00:00:00Z', healthy: true },
        conventions: { path: '.spec-first/runtime/first/conventions.json', fileHash: 'c', lastUpdated: '2026-03-18T00:00:00Z', healthy: true },
        criticalFlows: { path: '.spec-first/runtime/first/critical-flows.json', fileHash: 'd', lastUpdated: '2026-03-18T00:00:00Z', healthy: true },
        entryGuide: { path: '.spec-first/runtime/first/entry-guide.json', fileHash: 'e', lastUpdated: '2026-03-18T00:00:00Z', healthy: true },
        apiContracts: { path: '.spec-first/runtime/first/api-contracts.json', fileHash: 'f', lastUpdated: '2026-03-18T00:00:00Z', healthy: true },
        structureOverview: { path: '.spec-first/runtime/first/structure-overview.json', fileHash: 'g', lastUpdated: '2026-03-18T00:00:00Z', healthy: true },
        domainModel: { path: '.spec-first/runtime/first/domain-model.json', fileHash: 'h', lastUpdated: '2026-03-18T00:00:00Z', healthy: true },
        databaseSchema: {
          path: '.spec-first/runtime/first/database-schema.json',
          fileHash: 'i',
          lastUpdated: '2026-03-18T00:00:00Z',
          healthy: true,
          status: 'healthy',
        },
        docsProjection: {
          'docs/first/index.md': {
            path: 'docs/first/index.md',
            fileHash: 'p',
            lastUpdated: '2026-03-18T00:00:00Z',
            healthy: true,
          },
        },
        status: 'current',
      }),
    );
  }

  function writeDocsOutputs() {
    const docsRoot = join(TMP, 'docs', 'first');
    mkdirSync(docsRoot, { recursive: true });
    const docs = [
      'README.md',
      'summary.md',
      'steering.md',
      'conventions.md',
      'critical-flows.md',
      'entry-guide.md',
      'api-docs.md',
      'codebase-overview.md',
      'domain-model.md',
      'architecture.md',
      'call-graph.md',
      'development-guidelines.md',
      'external-deps.md',
    ];
    for (const doc of docs) {
      writeFileSync(join(docsRoot, doc), `# ${doc}\n`, 'utf-8');
    }
    writeFileSync(join(docsRoot, 'database-er.md'), '# database-er.md\n', 'utf-8');
  }

  function writeTaskPlan() {
    writeFileSync(
      join(TMP, 'specs', FEAT, 'task_plan.md'),
      [
        '| Task ID | Title | Status | Depends On | Traces | Owner |',
        '|---------|-------|--------|------------|--------|-------|',
        '| TASK-AUTH-001 | Build login UI | done | - | FR-AUTH-001 | dev |',
        '| TASK-AUTH-002 | Wire SMS API | in_progress | TASK-AUTH-001 | FR-AUTH-001 | dev |',
        '| TASK-AUTH-003 | Add retry logic | planned | TASK-AUTH-002 | FR-AUTH-001 | dev |',
        '| TASK-AUTH-004 | Fix flaky test | blocked | TASK-AUTH-002 | FR-AUTH-001 | qa |',
        '',
      ].join('\n'),
      'utf-8',
    );
  }

  function writeDocumentLinks() {
    writeFileSync(
      join(TMP, 'specs', FEAT, 'document-links.yaml'),
      [
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
        '  - path: task_plan.md',
        '    kind: plan',
        '    stage: 03_plan',
        '    references:',
        '      - spec.md',
        '      - design.md',
        '',
      ].join('\n'),
      'utf-8',
    );
  }

  it('should print layered background status, canonical task states, and next step guidance', () => {
    writeFeatureState();
    writeRuntimeIndex();
    writeTaskPlan();
    writeDocumentLinks();
    writeFileSync(join(TMP, 'specs', FEAT, 'spec.md'), '# Spec\n', 'utf-8');
    writeFileSync(join(TMP, 'specs', FEAT, 'design.md'), '# Design\n', 'utf-8');
    writeDocsOutputs();
    writeFileSync(join(TMP, '.spec-first', 'current'), FEAT, 'utf-8');
    writeFileSync(
      join(TMP, 'specs', FEAT, 'stage-state.json'),
      JSON.stringify({
        featureId: FEAT,
        mode: 'N',
        size: 'M',
        platforms: ['h5'],
        backgroundInputStatus: 'full',
        stageStatus: 'ready_to_advance',
        currentStage: '04_implement',
        history: [],
        terminal: false,
        title: 'Auth Module',
        createdAt: '2026-02-11T00:00:00Z',
        updatedAt: '2026-02-11T00:00:00Z',
      }),
    );

    const { code, stdout } = captureConsole(() => withCwd(TMP, () => handleStatus([])));

    expect(code).toBe(ExitCode.SUCCESS);
    expect(stdout).toContain('background_input_status: full');
    expect(stdout).toContain('runtime 真源: current');
    expect(stdout).toContain('docs 输出: ready');
    expect(stdout).toContain('同步状态: ready');
    expect(stdout).toContain('声明文档数: 3');
    expect(stdout).toContain('已存在文档数: 3');
    expect(stdout).toContain('done: 1');
    expect(stdout).toContain('in_progress: 1');
    expect(stdout).toContain('todo: 1');
    expect(stdout).toContain('blocked: 1');
    expect(stdout).toContain('建议下一步: /spec-first:code');
  });
});

// ─── Commit CLI Tests ───────────────────────────────────

describe('handleCommit', () => {
  it('should return VALIDATION_ERROR without message', () => {
    const code = withCwd(TMP, () => handleCommit([]));
    expect(code).toBe(ExitCode.VALIDATION_ERROR);
  });

  it('should return VALIDATION_ERROR for invalid task ID', () => {
    const code = withCwd(TMP, () => handleCommit(['--message', 'test', '--task', 'INVALID']));
    expect(code).toBe(ExitCode.VALIDATION_ERROR);
  });
});

// ─── AI Runtime Hook Tests ──────────────────────────────

describe('generateAIHookConfigs', () => {
  it('should generate 6 hook configs', () => {
    const configs = generateAIHookConfigs(TMP);
    expect(configs).toHaveLength(6);
    const types = configs.map(c => c.type);
    expect(types).toContain('PreToolUse');
    expect(types).toContain('PostToolUse');
    expect(types).toContain('Stop');
  });
});

describe('registerAIHooks', () => {
  it('should register hooks when .claude/ exists', () => {
    mkdirSync(join(TMP, '.claude'), { recursive: true });
    const result = registerAIHooks(TMP);
    expect(result.registered).toHaveLength(3);
    expect(result.warnings).toHaveLength(0);
  });

  it('should warn when .claude/ missing', () => {
    // TMP has no .claude/ dir
    rmSync(join(TMP, '.claude'), { recursive: true, force: true });
    const result = registerAIHooks(TMP);
    expect(result.registered).toHaveLength(0);
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});

describe('executePreToolUse', () => {
  it('should soft-block when no stage-state', () => {
    const result = executePreToolUse(FEAT, TMP);
    expect(result.success).toBe(false);
    expect(result.softBlock).toBe(true);
  });

  it('should pass when stage-state exists', () => {
    writeFeatureState();
    const result = executePreToolUse(FEAT, TMP);
    expect(result.success).toBe(true);
  });
});

describe('executeStopHook', () => {
  it('should append to findings.md', () => {
    writeFeatureState();
    const result = executeStopHook(FEAT, TMP, 'Session summary');
    expect(result.success).toBe(true);
    const content = readFileSync(join(TMP, 'specs', FEAT, 'findings.md'), 'utf-8');
    expect(content).toContain('Session summary');
  });
});
