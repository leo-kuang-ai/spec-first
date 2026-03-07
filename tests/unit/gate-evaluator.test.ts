/**
 * Gate Condition Evaluator 单元测试
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { evaluateGate, getConditions, getGateHistory } from '../../src/core/gate-engine/gate-evaluator.js';
import { Stage } from '../../src/shared/types.js';

const TMP = join(import.meta.dirname, '../../tests/fixtures/.tmp-gate-evaluator');
const FEAT = 'FSREQ-20260211-AUTH-001';

function withCwd(dir: string, fn: () => unknown): unknown {
  const orig = process.cwd;
  process.cwd = () => dir;
  try { return fn(); } finally { process.cwd = orig; }
}

function writeState(stage: string, mode = 'N', size = 'M') {
  writeFileSync(join(TMP, 'specs', FEAT, 'stage-state.json'), JSON.stringify({
    featureId: FEAT, mode, size, platforms: ['h5'],
    currentStage: stage, history: [], terminal: false,
    createdAt: '2026-02-11T00:00:00Z',
    updatedAt: '2026-02-11T00:00:00Z',
  }));
}

function writeMatrix(rows: string) {
  writeFileSync(join(TMP, 'specs', FEAT, 'traceability-matrix.md'),
    '| ID | Type | Title | Status | Upstream | Downstream |\n' +
    '|----|------|-------|--------|----------|------------|\n' + rows,
  );
}

function writeSpecReview(content: string) {
  mkdirSync(join(TMP, 'specs', FEAT, 'checklists'), { recursive: true });
  writeFileSync(join(TMP, 'specs', FEAT, 'checklists', 'spec-review.md'), content, 'utf-8');
}

function writeConstitutionAuthorityMappingArtifacts() {
  const authorityDir = join(TMP, 'skills', 'spec-first', '03-spec', 'references');
  mkdirSync(authorityDir, { recursive: true });
  writeFileSync(
    join(authorityDir, 'constitution-authority.md'),
    [
      '# Constitution 权威层级',
      'Level 0: Constitution',
      'Level 1: Spec',
      'Level 2: Design',
      'Level 3: Code',
      '',
      '任意与 Constitution 冲突：阻断推进，先修复违规项',
      '',
    ].join('\n'),
    'utf-8',
  );

  mkdirSync(join(TMP, 'skills', 'spec-first', '03-spec'), { recursive: true });
  writeFileSync(join(TMP, 'skills', 'spec-first', '03-spec', 'SKILL.md'), '- references/constitution-authority.md\n', 'utf-8');

  mkdirSync(join(TMP, 'skills', 'spec-first', '04-design'), { recursive: true });
  writeFileSync(join(TMP, 'skills', 'spec-first', '04-design', 'SKILL.md'), '- ../03-spec/references/constitution-authority.md\n', 'utf-8');

  mkdirSync(join(TMP, 'skills', 'spec-first', '08-review'), { recursive: true });
  writeFileSync(join(TMP, 'skills', 'spec-first', '08-review', 'SKILL.md'), '- ../03-spec/references/constitution-authority.md\n', 'utf-8');
}

function writeGlobalConstitution(content: string) {
  mkdirSync(join(TMP, '.spec-first'), { recursive: true });
  writeFileSync(join(TMP, '.spec-first', 'constitution.md'), content, 'utf-8');
}

beforeEach(() => {
  mkdirSync(join(TMP, 'specs', FEAT, 'reports'), { recursive: true });
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
});

describe('getConditions', () => {
  it('should return conditions for 00_init', () => {
    const conds = getConditions(Stage.INIT);
    expect(conds.length).toBeGreaterThanOrEqual(2);
    expect(conds[0].id).toBe('G-INIT-01');
  });

  it('should return empty for unknown stage', () => {
    expect(getConditions('99_unknown' as Stage)).toEqual([]);
  });

  it('should have conditions for all main stages', () => {
    for (const s of [Stage.INIT, Stage.SPECIFY, Stage.DESIGN, Stage.PLAN, Stage.IMPLEMENT, Stage.VERIFY, Stage.WRAP_UP, Stage.RELEASE]) {
      expect(getConditions(s).length).toBeGreaterThan(0);
    }
  });
});

describe('evaluateGate', () => {
  it('should PASS for 00_init when directory and state exist', () => {
    writeState('00_init');
    const result = evaluateGate(FEAT, TMP);
    expect(result.status).toBe('PASS');
    expect(result.stage).toBe('00_init');
    expect(result.conditions.every(c => c.status === 'PASS')).toBe(true);
  });

  it('should FAIL for 01_specify when spec.md missing', () => {
    writeState('01_specify');
    const result = evaluateGate(FEAT, TMP);
    const specCond = result.conditions.find(c => c.id === 'G-SPEC-01');
    expect(specCond?.status).toBe('FAIL');
    expect(result.status).toBe('FAIL');
  });

  it('should PASS for 01_specify when spec.md exists and matrix has FR', () => {
    writeState('01_specify');
    writeFileSync(join(TMP, 'specs', FEAT, 'prd.md'), [
      '---',
      'scenario: "iteration"',
      'scenario_reason: "test feature"',
      'evidence_paths: ["test.md"]',
      'complexity: "Simple"',
      '---',
      '# PRD',
      '## 1. 业务目标',
      'Implement test feature for authentication',
      '## 2. 功能需求',
      'Login and logout functionality',
      '## 3. 非功能需求',
      'Must use existing auth service',
    ].join('\n'));
    writeFileSync(join(TMP, 'specs', FEAT, 'spec.md'), '# Spec');
    writeMatrix('| FR-AUTH-001 | FR | Login | Planned | REQ-PRD-001 |  |\n| REQ-PRD-001 | REQ-PRD | Req | Planned |  |  |\n');
    writeSpecReview('- [x] 完整性\n- [x] 清晰度\n- [x] 可测量\n- [x] 一致性\n- [ ] 风险\n');
    const result = evaluateGate(FEAT, TMP);
    expect(result.status).toBe('PASS');
  });

  it('should FAIL for 01_specify when C10 is below threshold', () => {
    writeState('01_specify');
    writeFileSync(join(TMP, 'specs', FEAT, 'spec.md'), '# Spec');
    writeMatrix('| FR-AUTH-001 | FR | Login | Planned |  |  |\n');
    writeSpecReview('- [x] 完整性\n- [ ] 清晰度\n- [ ] 可测量\n- [ ] 一致性\n');
    const result = evaluateGate(FEAT, TMP);
    const c10 = result.conditions.find(c => c.id === 'G-SPEC-03');
    expect(c10?.status).toBe('FAIL');
    expect(c10?.detail).toContain('C10=25.0%');
  });

  it('should FAIL for 02_design when design.md missing', () => {
    writeState('02_design');
    writeMatrix('| FR-AUTH-001 | FR | Login | Planned |  |  |\n');
    const result = evaluateGate(FEAT, TMP);
    expect(result.status).toBe('FAIL');
    expect(result.suggestions).toBeDefined();
  });

  it('should PASS C11 when constitution metadata exists and design references constitution clause', () => {
    writeState('02_design');
    writeConstitutionAuthorityMappingArtifacts();
    writeFileSync(join(TMP, 'specs', FEAT, 'design.md'), '## Governance\nConstitution Clause P1 (v1.0.0) is applied.', 'utf-8');
    writeFileSync(
      join(TMP, 'specs', FEAT, 'constitution.md'),
      '# Constitution\n- Version: 1.0.0\n- Ratified: 2026-02-26\n- Last Amended: 2026-02-26\n\n## Amendment History\n- init\n',
      'utf-8',
    );
    writeMatrix(
      '| FR-AUTH-001 | FR | Login | Planned |  |  |\n'
      + '| DS-AUTH-001 | DS | Login Design | Planned | FR-AUTH-001 |  |\n',
    );
    const result = evaluateGate(FEAT, TMP);
    const c11 = result.conditions.find(c => c.id === 'G-DESIGN-03');
    expect(c11?.status).toBe('PASS');
  });

  it('should FAIL C11 when feature constitution version mismatches global main copy', () => {
    writeState('02_design');
    writeConstitutionAuthorityMappingArtifacts();
    writeGlobalConstitution(
      '# Project Constitution\n\n## Meta\n- Version: 1.1.0\n- Ratified: 2026-03-05\n- Last Amended: 2026-03-05\n\n## Amendment History\n- init\n',
    );
    writeFileSync(join(TMP, 'specs', FEAT, 'design.md'), '## Governance\nConstitution Clause P1 (v1.0.0) is applied.', 'utf-8');
    writeFileSync(
      join(TMP, 'specs', FEAT, 'constitution.md'),
      '# Constitution\n- Version: 1.0.0\n- Ratified: 2026-02-26\n- Last Amended: 2026-02-26\n\n## Amendment History\n- init\n',
      'utf-8',
    );
    writeMatrix(
      '| FR-AUTH-001 | FR | Login | Planned |  |  |\n'
      + '| DS-AUTH-001 | DS | Login Design | Planned | FR-AUTH-001 |  |\n',
    );

    const result = evaluateGate(FEAT, TMP);
    const c11 = result.conditions.find(c => c.id === 'G-DESIGN-03');
    expect(c11?.status).toBe('FAIL');
    expect(c11?.detail).toContain('global constitution');
  });

  it('should FAIL C11 when version is same but constitution content mismatches global main copy', () => {
    writeState('02_design');
    writeConstitutionAuthorityMappingArtifacts();
    writeGlobalConstitution(
      '# Project Constitution\n\n## Meta\n- Version: 1.1.0\n- Ratified: 2026-03-05\n- Last Amended: 2026-03-05\n\n## Principles\n1. Simplicity first.\n\n## Amendment History\n- init\n',
    );
    writeFileSync(join(TMP, 'specs', FEAT, 'design.md'), '## Governance\nConstitution Clause P1 (v1.1.0) is applied.', 'utf-8');
    writeFileSync(
      join(TMP, 'specs', FEAT, 'constitution.md'),
      '# Constitution\n- Version: 1.1.0\n- Ratified: 2026-03-05\n- Last Amended: 2026-03-05\n\n## Principles\n1. Simplicity first.\n2. Facts first.\n\n## Amendment History\n- init\n',
      'utf-8',
    );
    writeMatrix(
      '| FR-AUTH-001 | FR | Login | Planned |  |  |\n'
      + '| DS-AUTH-001 | DS | Login Design | Planned | FR-AUTH-001 |  |\n',
    );

    const result = evaluateGate(FEAT, TMP);
    const c11 = result.conditions.find(c => c.id === 'G-DESIGN-03');
    expect(c11?.status).toBe('FAIL');
    expect(c11?.detail).toContain('content mismatch');
  });

  it('should PASS C11 when constitution mismatch has explicit override reason', () => {
    writeState('02_design');
    writeConstitutionAuthorityMappingArtifacts();
    writeGlobalConstitution(
      '# Project Constitution\n\n## Meta\n- Version: 1.1.0\n- Ratified: 2026-03-05\n- Last Amended: 2026-03-05\n\n## Principles\n1. Simplicity first.\n\n## Amendment History\n- init\n',
    );
    writeFileSync(join(TMP, 'specs', FEAT, 'design.md'), '## Governance\nConstitution Clause P1 (v1.1.0) is applied.', 'utf-8');
    writeFileSync(
      join(TMP, 'specs', FEAT, 'constitution.md'),
      '# Constitution\n- Version: 1.1.0\n- Ratified: 2026-03-05\n- Last Amended: 2026-03-05\n\nFeature override reason: this feature requires stricter policy.\n\n## Principles\n1. Simplicity first.\n2. Facts first.\n\n## Amendment History\n- init\n',
      'utf-8',
    );
    writeMatrix(
      '| FR-AUTH-001 | FR | Login | Planned |  |  |\n'
      + '| DS-AUTH-001 | DS | Login Design | Planned | FR-AUTH-001 |  |\n',
    );

    const result = evaluateGate(FEAT, TMP);
    const c11 = result.conditions.find(c => c.id === 'G-DESIGN-03');
    expect(c11?.status).toBe('PASS');
  });

  it('should FAIL C11 when constitution-authority mapping artifacts are missing', () => {
    writeState('02_design');
    writeFileSync(join(TMP, 'specs', FEAT, 'design.md'), '## Governance\nConstitution Clause P1 (v1.0.0) is applied.', 'utf-8');
    writeFileSync(
      join(TMP, 'specs', FEAT, 'constitution.md'),
      '# Constitution\n- Version: 1.0.0\n- Ratified: 2026-02-26\n- Last Amended: 2026-02-26\n\n## Amendment History\n- init\n',
      'utf-8',
    );
    writeMatrix(
      '| FR-AUTH-001 | FR | Login | Planned |  |  |\n'
      + '| DS-AUTH-001 | DS | Login Design | Planned | FR-AUTH-001 |  |\n',
    );

    const result = evaluateGate(FEAT, TMP);
    const c11 = result.conditions.find(c => c.id === 'G-DESIGN-03');
    expect(c11?.status).toBe('FAIL');
    expect(c11?.detail).toContain('constitution-authority.md missing');
    expect(c11?.detail).toContain('fix:');
    expect(c11?.detail).toContain('skills/spec-first/03-spec/references/constitution-authority.md');
  });

  it('should FAIL C11 when design has no constitution reference', () => {
    writeState('02_design');
    writeFileSync(join(TMP, 'specs', FEAT, 'design.md'), '# Design\nNo governance section', 'utf-8');
    writeFileSync(
      join(TMP, 'specs', FEAT, 'constitution.md'),
      '# Constitution\n- Version: 1.0.0\n- Ratified: 2026-02-26\n- Last Amended: 2026-02-26\n\n## Amendment History\n- init\n',
      'utf-8',
    );
    writeMatrix(
      '| FR-AUTH-001 | FR | Login | Planned |  |  |\n'
      + '| DS-AUTH-001 | DS | Login Design | Planned | FR-AUTH-001 |  |\n',
    );
    const result = evaluateGate(FEAT, TMP);
    const c11 = result.conditions.find(c => c.id === 'G-DESIGN-03');
    expect(c11?.status).toBe('FAIL');
    expect(c11?.detail).toContain('specs/FSREQ-20260211-AUTH-001/design.md');
    expect(c11?.detail).toContain('fix:');
  });

  it('should FAIL C11 with file-level fix hint when constitution.md is missing', () => {
    writeState('02_design');
    writeConstitutionAuthorityMappingArtifacts();
    writeFileSync(join(TMP, 'specs', FEAT, 'design.md'), '## Governance\nConstitution Clause P1 (v1.0.0) is applied.', 'utf-8');
    writeMatrix(
      '| FR-AUTH-001 | FR | Login | Planned |  |  |\n'
      + '| DS-AUTH-001 | DS | Login Design | Planned | FR-AUTH-001 |  |\n',
    );

    const result = evaluateGate(FEAT, TMP);
    const c11 = result.conditions.find(c => c.id === 'G-DESIGN-03');
    expect(c11?.status).toBe('FAIL');
    expect(c11?.detail).toContain('constitution.md missing');
    expect(c11?.detail).toContain('fix: create specs/FSREQ-20260211-AUTH-001/constitution.md');
  });

  it('should write gate-history.jsonl on evaluation', () => {
    writeState('00_init');
    evaluateGate(FEAT, TMP);
    const history = getGateHistory(FEAT, TMP);
    expect(history).toHaveLength(1);
    expect(history[0].stage).toBe('00_init');
  });

  it('should accumulate history entries', () => {
    writeState('00_init');
    evaluateGate(FEAT, TMP);
    evaluateGate(FEAT, TMP);
    const history = getGateHistory(FEAT, TMP);
    expect(history).toHaveLength(2);
  });

  it('should FAIL for 06_wrap_up when matrix has non-terminal entries', () => {
    writeState('06_wrap_up');
    writeMatrix('| FR-AUTH-001 | FR | Login | Planned |  |  |\n');
    const result = evaluateGate(FEAT, TMP);
    const wrapCond = result.conditions.find(c => c.id === 'G-WRAP-02');
    expect(wrapCond?.status).toBe('FAIL');
  });

  it('should PASS for 06_wrap_up when all matrix entries are terminal', () => {
    writeState('06_wrap_up');
    writeMatrix('| FR-AUTH-001 | FR | Login | Accepted |  |  |\n| DS-AUTH-001 | DS | Design | Cancelled |  |  |\n');
    const result = evaluateGate(FEAT, TMP);
    const wrapCond = result.conditions.find(c => c.id === 'G-WRAP-02');
    expect(wrapCond?.status).toBe('PASS');
  });

  it('should reject undocumented terminal aliases such as done at 06_wrap_up', () => {
    writeState('06_wrap_up');
    writeMatrix('| FR-AUTH-001 | FR | Login | done |  |  |\n');
    expect(() => evaluateGate(FEAT, TMP)).toThrow(/Invalid matrix status/);
  });

  it('should FAIL for 03_plan when analysis-report.md is missing', () => {
    writeState('03_plan');
    writeMatrix(
      '| FR-AUTH-001 | FR | Login | Planned |  |  |\n'
      + '| TASK-AUTH-001 | TASK | Impl | Planned | FR-AUTH-001 |  |\n',
    );
    const result = evaluateGate(FEAT, TMP);
    const cond = result.conditions.find(c => c.id === 'G-PLAN-03');
    expect(cond?.status).toBe('FAIL');
    expect(cond?.detail).toContain('Analyze report missing');
  });

  it('should FAIL for 03_plan when analysis-report.md has CRITICAL findings', () => {
    writeState('03_plan');
    writeMatrix(
      '| FR-AUTH-001 | FR | Login | Planned |  |  |\n'
      + '| TASK-AUTH-001 | TASK | Impl | Planned | FR-AUTH-001 |  |\n',
    );
    mkdirSync(join(TMP, 'specs', FEAT, 'reports'), { recursive: true });
    writeFileSync(
      join(TMP, 'specs', FEAT, 'reports', 'analysis-report.md'),
      '# Analysis Report\n\n## Summary\n- CRITICAL: 2\n- HIGH: 0\n- MEDIUM: 0\n- LOW: 0\n',
      'utf-8',
    );

    const result = evaluateGate(FEAT, TMP);
    const cond = result.conditions.find(c => c.id === 'G-PLAN-03');
    expect(cond?.status).toBe('FAIL');
    expect(cond?.detail).toContain('CRITICAL=2');
  });

  it('should PASS for 03_plan when analysis-report.md has zero CRITICAL', () => {
    writeState('03_plan');
    writeMatrix(
      '| FR-AUTH-001 | FR | Login | Planned |  |  |\n'
      + '| TASK-AUTH-001 | TASK | Impl | Planned | FR-AUTH-001 |  |\n',
    );
    mkdirSync(join(TMP, 'specs', FEAT, 'reports'), { recursive: true });
    writeFileSync(
      join(TMP, 'specs', FEAT, 'reports', 'analysis-report.md'),
      '# Analysis Report\n\n## Summary\n- CRITICAL: 0\n- HIGH: 1\n- MEDIUM: 0\n- LOW: 0\n',
      'utf-8',
    );

    const result = evaluateGate(FEAT, TMP);
    const cond = result.conditions.find(c => c.id === 'G-PLAN-03');
    expect(cond?.status).toBe('PASS');
  });

  it('should PASS C3/C8 in 03_plan for FR→DS→TASK chain', () => {
    writeState('03_plan');
    writeMatrix(
      '| FR-AUTH-001 | FR | Login | Planned |  | DS-AUTH-001,TASK-AUTH-001 |\n'
      + '| DS-AUTH-001 | DS | Design | Planned | FR-AUTH-001 | TASK-AUTH-001 |\n'
      + '| TASK-AUTH-001 | TASK | Impl | Planned | DS-AUTH-001 |  |\n',
    );
    mkdirSync(join(TMP, 'specs', FEAT, 'reports'), { recursive: true });
    writeFileSync(
      join(TMP, 'specs', FEAT, 'reports', 'analysis-report.md'),
      '# Analysis Report\n\n## Summary\n- CRITICAL: 0\n- HIGH: 0\n- MEDIUM: 0\n- LOW: 0\n',
      'utf-8',
    );

    const result = evaluateGate(FEAT, TMP);
    const c3 = result.conditions.find(c => c.id === 'G-PLAN-01');
    const c8 = result.conditions.find(c => c.id === 'G-PLAN-02');
    expect(c3?.status).toBe('PASS');
    expect(c8?.status).toBe('PASS');
  });

  it('should PASS Layer2 command gate with allowed command', () => {
    writeState('00_init');
    writeFileSync(join(TMP, 'specs', FEAT, 'stage-state.json'), JSON.stringify({
      featureId: FEAT,
      mode: 'N',
      size: 'M',
      platforms: ['h5'],
      currentStage: '00_init',
      history: [],
      terminal: false,
      createdAt: '2026-02-11T00:00:00Z',
      updatedAt: '2026-02-11T00:00:00Z',
      mergedRules: {
        gateConditions: {
          '00_init': [{
            id: 'L2-CMD-001',
            description: 'node command should pass',
            command: 'node -e "process.stdout.write(\'ok\')"',
          }],
        },
        deliverables: {},
        thresholds: {},
      },
    }), 'utf-8');

    const result = evaluateGate(FEAT, TMP);
    const cond = result.conditions.find(c => c.id === 'L2-CMD-001');
    expect(cond?.status).toBe('PASS');
  });

  it('should FAIL Layer2 command gate with blocked operator', () => {
    writeFileSync(join(TMP, 'specs', FEAT, 'stage-state.json'), JSON.stringify({
      featureId: FEAT,
      mode: 'N',
      size: 'M',
      platforms: ['h5'],
      currentStage: '00_init',
      history: [],
      terminal: false,
      createdAt: '2026-02-11T00:00:00Z',
      updatedAt: '2026-02-11T00:00:00Z',
      mergedRules: {
        gateConditions: {
          '00_init': [{
            id: 'L2-CMD-002',
            description: 'unsafe operator should fail',
            command: 'node -e "process.stdout.write(\'ok\')"; echo hacked',
          }],
        },
        deliverables: {},
        thresholds: {},
      },
    }), 'utf-8');

    const result = evaluateGate(FEAT, TMP);
    const cond = result.conditions.find(c => c.id === 'L2-CMD-002');
    expect(cond?.status).toBe('FAIL');
    expect(cond?.detail).toContain('Blocked command');
  });

  it('should FAIL Layer2 command gate with disallowed executable', () => {
    writeFileSync(join(TMP, 'specs', FEAT, 'stage-state.json'), JSON.stringify({
      featureId: FEAT,
      mode: 'N',
      size: 'M',
      platforms: ['h5'],
      currentStage: '00_init',
      history: [],
      terminal: false,
      createdAt: '2026-02-11T00:00:00Z',
      updatedAt: '2026-02-11T00:00:00Z',
      mergedRules: {
        gateConditions: {
          '00_init': [{
            id: 'L2-CMD-004',
            description: 'disallowed executable should fail',
            command: 'rm -rf ./tmp',
          }],
        },
        deliverables: {},
        thresholds: {},
      },
    }), 'utf-8');

    const result = evaluateGate(FEAT, TMP);
    const cond = result.conditions.find(c => c.id === 'L2-CMD-004');
    expect(cond?.status).toBe('FAIL');
    expect(cond?.detail).toContain('not allowed');
  });

  it('should PASS Layer2 command gate with logical and chain', () => {
    writeFileSync(join(TMP, 'specs', FEAT, 'stage-state.json'), JSON.stringify({
      featureId: FEAT,
      mode: 'N',
      size: 'M',
      platforms: ['h5'],
      currentStage: '00_init',
      history: [],
      terminal: false,
      createdAt: '2026-02-11T00:00:00Z',
      updatedAt: '2026-02-11T00:00:00Z',
      mergedRules: {
        gateConditions: {
          '00_init': [{
            id: 'L2-CMD-003',
            description: 'and chain should pass',
            command: 'node -e "process.stdout.write(\'a\')" && node -e "process.stdout.write(\'b\')"',
          }],
        },
        deliverables: {},
        thresholds: {},
      },
    }), 'utf-8');

    const result = evaluateGate(FEAT, TMP);
    const cond = result.conditions.find(c => c.id === 'L2-CMD-003');
    expect(cond?.status).toBe('PASS');
  });
});

describe('getGateHistory', () => {
  it('should return empty array when no history file', () => {
    expect(getGateHistory(FEAT, TMP)).toEqual([]);
  });
});
