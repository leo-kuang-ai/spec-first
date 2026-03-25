import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { Stage } from '../../src/shared/types.js';
import type { FeatureState } from '../../src/shared/types.js';
import { advance, cancel } from '../../src/core/process-engine/advance.js';
import { resetConfigCache } from '../../src/shared/config-schema.js';

const TMP = join(import.meta.dirname, '../../tests/fixtures/.tmp-advance');
const FEAT_ID = 'FSREQ-20260211-ADV-001';
const SPEC_DIR = join(TMP, 'specs', FEAT_ID);

function makeState(overrides: Partial<FeatureState> = {}): FeatureState {
  const currentStage = overrides.currentStage ?? Stage.INIT;
  return {
    featureId: FEAT_ID,
    mode: 'N',
    size: 'S',
    platforms: ['backend'],
    currentStage,
    terminal: false,
    nodes: { [currentStage]: { status: 'done', checklistStatus: 'complete', canMarkDone: true } },
    createdAt: '2026-02-11T00:00:00.000Z',
    updatedAt: '2026-02-11T00:00:00.000Z',
    ...overrides,
  };
}

function writeState(state: FeatureState): void {
  writeFileSync(join(SPEC_DIR, 'stage-state.json'), JSON.stringify(state, null, 2), 'utf-8');
}

function readState(): FeatureState {
  const raw = require('node:fs').readFileSync(join(SPEC_DIR, 'stage-state.json'), 'utf-8');
  return JSON.parse(raw);
}

function markCurrentNodeDone(): void {
  const state = readState();
  const currentNode = state.nodes?.[state.currentStage] ?? { status: 'done' as const };
  writeState({
    ...state,
    nodes: {
      ...(state.nodes ?? {}),
      [state.currentStage]: {
        ...currentNode,
        status: 'done',
        checklistStatus: 'complete',
        canMarkDone: true,
      },
    },
  });
}

beforeEach(() => {
  resetConfigCache();
  mkdirSync(SPEC_DIR, { recursive: true });
  // findings.md 需要存在才能追加
  writeFileSync(join(SPEC_DIR, 'findings.md'), '# Findings\n', 'utf-8');
  // 为 DESIGN 阶段准备必需的依赖文件
  writeFileSync(join(SPEC_DIR, 'prd.md'), '# PRD\n', 'utf-8');
  writeFileSync(join(SPEC_DIR, 'spec.md'), 'Feature ID: FSREQ-20260211-ADV-001\n', 'utf-8');
  writeFileSync(
    join(SPEC_DIR, 'document-links.yaml'),
    `version: 1
featureId: ${FEAT_ID}
documents:
  - path: spec.md
    kind: spec
    stage: 01_specify
    references: []
  - path: design.md
    kind: design
    stage: 02_design
    references: [spec.md]
  - path: task_plan.md
    kind: task-plan
    stage: 03_plan
    references: [spec.md, design.md]
  - path: reports/test-report.md
    kind: report
    stage: 05_verify
    references: [task_plan.md]
  - path: reports/security-scan.md
    kind: report
    stage: 05_verify
    references: [task_plan.md]
`,
    'utf-8'
  );
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
  resetConfigCache();
});

describe('advance', () => {
  it('should advance INIT → SPECIFY when gate passes', () => {
    writeState(makeState());
    const result = advance(FEAT_ID, TMP);
    expect(result.from).toBe(Stage.INIT);
    expect(result.to).toBe(Stage.SPECIFY);
    expect(result.gateResult).toBe('TRANSITIONED');
    const updated = readState();
    expect(updated.currentStage).toBe(Stage.SPECIFY);
  });

  it('should ignore legacy force option and still use normal gate path', () => {
    writeState(makeState());
    const result = advance(FEAT_ID, TMP, { force: true } as never);
    expect(result.gateResult).toBe('TRANSITIONED');
    expect(readState().currentStage).toBe(Stage.SPECIFY);
  });

  it('should reject advance from terminal stage', () => {
    writeState(makeState({ currentStage: Stage.DONE, terminal: true, nodes: { [Stage.DONE]: { status: 'done' } } }));
    expect(() => advance(FEAT_ID, TMP)).toThrow(/终态阶段/);
  });

  it('should reject when feature not found', () => {
    expect(() => advance('NONEXISTENT', TMP)).toThrow(/未找到 Feature/);
  });

  it('should advance SPECIFY → DESIGN when specify gate passes', () => {
    writeState(makeState({ currentStage: Stage.SPECIFY }));
    writeFileSync(join(SPEC_DIR, 'design.md'), '# Design\n', 'utf-8');
    const result = advance(FEAT_ID, TMP);
    expect(result.from).toBe(Stage.SPECIFY);
    expect(result.to).toBe(Stage.DESIGN);
  });


  it('should drop legacy current_stage field when persisting advanced state', () => {
    const legacy = { ...makeState(), current_stage: Stage.IMPLEMENT } as FeatureState & { current_stage: Stage };
    writeFileSync(join(SPEC_DIR, 'stage-state.json'), JSON.stringify(legacy, null, 2), 'utf-8');

    advance(FEAT_ID, TMP);

    const raw = readFileSync(join(SPEC_DIR, 'stage-state.json'), 'utf-8');
    expect(raw).not.toContain('"current_stage"');
    const updated = JSON.parse(raw) as FeatureState & { current_stage?: string };
    expect(updated.currentStage).toBe(Stage.SPECIFY);
    expect(updated.current_stage).toBeUndefined();
  });

  it('should preserve background and auto-advance metadata when persisting advanced state', () => {
    const state = {
      ...makeState({ backgroundInputStatus: 'degraded' }),
      stageStatus: 'ready_to_advance',
      autoAdvancePolicy: 'assisted',
      lastSuggestedCommand: 'spec-first stage suggest FSREQ-20260211-ADV-001',
      lastVerifiedAt: '2026-03-09T00:00:00.000Z',
    } as FeatureState & {
      stageStatus?: string;
      autoAdvancePolicy?: string;
      lastSuggestedCommand?: string;
      lastVerifiedAt?: string;
    };
    writeState(state);

    advance(FEAT_ID, TMP);

    const updated = readState() as FeatureState & {
      backgroundInputStatus?: string;
      stageStatus?: string;
      autoAdvancePolicy?: string;
      lastSuggestedCommand?: string;
      lastVerifiedAt?: string;
    };
    expect(updated.backgroundInputStatus).toBe('degraded');
    expect(updated.stageStatus).toBe('ready_to_advance');
    expect(updated.autoAdvancePolicy).toBe('assisted');
    expect(updated.lastSuggestedCommand).toBe('spec-first stage suggest FSREQ-20260211-ADV-001');
    expect(updated.lastVerifiedAt).toBe('2026-03-09T00:00:00.000Z');
  });

  it('should not persist legacy gate-history.jsonl on advance', () => {
    writeState(makeState());
    advance(FEAT_ID, TMP);
    const logPath = join(SPEC_DIR, 'gate-history.jsonl');
    expect(existsSync(logPath)).toBe(false);
  });

  it('should chain multiple advances', () => {
    writeState(makeState());
    advance(FEAT_ID, TMP);
    writeFileSync(join(SPEC_DIR, 'design.md'), '# Design\n', 'utf-8');
    markCurrentNodeDone();
    resetConfigCache();
    advance(FEAT_ID, TMP);
    const state = readState();
    expect(state.currentStage).toBe(Stage.DESIGN);
  });

  it('should not auto-sync legacy context file when advancing DESIGN → PLAN', () => {
    writeState(makeState({ currentStage: Stage.DESIGN }));
    mkdirSync(join(TMP, 'skills', '03-spec', 'references'), { recursive: true });
    mkdirSync(join(TMP, 'skills', '04-design'), { recursive: true });
    mkdirSync(join(TMP, 'skills', '08-review'), { recursive: true });
    writeFileSync(
      join(TMP, 'skills', '03-spec', 'references', 'constitution-authority.md'),
      [
        '# Constitution Authority',
        '',
        'Level 0',
        'Level 1',
        'Level 2',
        'Level 3',
        '',
        'Any Constitution conflict must be resolved in favor of Constitution.',
        '',
      ].join('\n'),
      'utf-8',
    );
    writeFileSync(join(TMP, 'skills', '03-spec', 'SKILL.md'), 'See constitution-authority.md', 'utf-8');
    writeFileSync(join(TMP, 'skills', '04-design', 'SKILL.md'), 'See constitution-authority.md', 'utf-8');
    writeFileSync(join(TMP, 'skills', '08-review', 'SKILL.md'), 'See constitution-authority.md', 'utf-8');
    writeFileSync(join(SPEC_DIR, 'constitution.md'), [
      '# Constitution',
      '',
      '- Version: 1.0.0',
      '- Ratified: 2026-02-11',
      '- Last Amended: 2026-02-11',
      '',
      '## Amendment History',
      '- init',
      '',
    ].join('\n'), 'utf-8');
    writeFileSync(join(SPEC_DIR, 'design.md'), '# Design\n\nConstitution Clause C-1 (v1.0.0)\n\n## API\n', 'utf-8');
    writeFileSync(join(SPEC_DIR, 'task_plan.md'), '# Task Plan\n', 'utf-8');
    writeFileSync(join(TMP, 'CLAUDE.md'), '# CLAUDE\n', 'utf-8');

    const result = advance(FEAT_ID, TMP);
    expect(result.from).toBe(Stage.DESIGN);
    expect(result.to).toBe(Stage.PLAN);

    const content = readFileSync(join(TMP, 'CLAUDE.md'), 'utf-8');
    expect(content).toBe('# CLAUDE\n');
  });

  it('should only transition WRAP_UP → RELEASE in one step', () => {
    mkdirSync(join(TMP, '.spec-first', 'meta'), { recursive: true });
    writeFileSync(
      join(TMP, '.spec-first', 'meta', 'config.yaml'),
      'dependencies:\n  autoCheck: false\n',
      'utf-8'
    );
    writeState(makeState({ currentStage: Stage.WRAP_UP }));
    writeFileSync(join(SPEC_DIR, 'spec.md'), '# Spec\n', 'utf-8');
    writeFileSync(join(SPEC_DIR, 'design.md'), '# Design\n', 'utf-8');
    writeFileSync(join(SPEC_DIR, 'task_plan.md'), '# Task Plan\n', 'utf-8');
    writeFileSync(join(SPEC_DIR, 'verify.md'), '# Verify\n', 'utf-8');
    writeFileSync(join(SPEC_DIR, 'retro.md'), '# Retro\n', 'utf-8');

    const result = advance(FEAT_ID, TMP);

    expect(result.from).toBe(Stage.WRAP_UP);
    expect(result.to).toBe(Stage.RELEASE);
    expect(result.gateResult).toBe('TRANSITIONED');

    const updated = readState();
    expect(updated.currentStage).toBe(Stage.RELEASE);
    expect(updated.terminal).toBe(false);
  });
});

describe('cancel', () => {
  it('should cancel from INIT', () => {
    writeState(makeState());
    const result = cancel(FEAT_ID, TMP, 'requirements changed');
    expect(result.from).toBe(Stage.INIT);
    expect(result.to).toBe(Stage.CANCELLED);
    expect(result.gateResult).toBe('CANCELLED: requirements changed');
    const state = readState();
    expect(state.terminal).toBe(true);
  });

  it('should cancel from mid-stage (IMPLEMENT)', () => {
    writeState(makeState({ currentStage: Stage.IMPLEMENT }));
    const result = cancel(FEAT_ID, TMP, 'budget cut');
    expect(result.to).toBe(Stage.CANCELLED);
  });

  it('should reject cancel without reason', () => {
    writeState(makeState());
    expect(() => cancel(FEAT_ID, TMP, '')).toThrow(/取消原因不能为空/);
  });

  it('should reject cancel from terminal stage', () => {
    writeState(makeState({ currentStage: Stage.DONE, terminal: true }));
    expect(() => cancel(FEAT_ID, TMP, 'too late')).toThrow(/终态阶段/);
  });

  it('should not persist legacy gate-history.jsonl on cancel', () => {
    writeState(makeState());
    cancel(FEAT_ID, TMP, 'test cancel');
    const logPath = join(SPEC_DIR, 'gate-history.jsonl');
    expect(existsSync(logPath)).toBe(false);
  });
});
