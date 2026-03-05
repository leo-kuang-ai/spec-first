/**
 * 异常路径 E2E 测试
 * Gate FAIL 阻断 / Force 推进 / Cancel 流程 / RFC 变更 / 缺陷闭环
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, writeFileSync, readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import yaml from 'js-yaml';
import { init } from '../../src/core/process-engine/init.js';
import { advance, cancel } from '../../src/core/process-engine/advance.js';
import { getFeatureState } from '../../src/core/process-engine/feature.js';
import { preWriteArchive } from '../../src/core/skill-runtime/phase-machine.js';
import { createRfc, getRfc, transitionRfc } from '../../src/core/change-mgr/rfc.js';
import { registerDefect, getDefect, transitionDefect } from '../../src/core/change-mgr/defect.js';

const TMP = join(import.meta.dirname, '../fixtures/.tmp-e2e-error');

function setupProject(): void {
  mkdirSync(join(TMP, '.spec-first', 'layer2'), { recursive: true });
  mkdirSync(join(TMP, 'specs'), { recursive: true });
  writeFileSync(join(TMP, '.spec-first', 'layer2', 'h5.yaml'), yaml.dump({
    platform: 'h5',
    gate_conditions: { '04_implement': [{ id: 'L2-H5-001', description: 'ESLint' }] },
    quality_thresholds: { bundle_size_kb: { value: 500, direction: 'lower_is_better' } },
  }));
}

beforeEach(() => setupProject());
afterEach(() => rmSync(TMP, { recursive: true, force: true }));

// ─── Gate FAIL 阻断 ─────────────────────────────────────

describe('Gate FAIL blocking', () => {
  it('should block advance when gate result is FAIL', () => {
    writeFileSync(join(TMP, '.spec-first', 'config.yaml'), yaml.dump({
      version: '1.0', project: 'e2e',
      gate: { pilot_mode: false },
    }));
    const { featureId } = init({
      feat: 'BLK', mode: 'N', size: 'S', platforms: ['h5'], projectRoot: TMP,
    });
    advance(featureId, TMP); // 00_init -> 01_specify
    // 为 DESIGN 阶段准备必需的依赖文件
    writeFileSync(join(TMP, 'specs', featureId, 'prd.md'), '# PRD');
    writeFileSync(join(TMP, 'specs', featureId, 'spec.md'), '# Spec');
    expect(() => advance(featureId, TMP))
      .toThrow(/Gate 未通过/);
  });

  it('should allow advance with gate PASS', () => {
    writeFileSync(join(TMP, '.spec-first', 'config.yaml'), yaml.dump({
      version: '1.0', project: 'e2e',
      gate: { pilot_mode: true },
    }));
    const { featureId } = init({
      feat: 'PLT', mode: 'N', size: 'S', platforms: ['h5'], projectRoot: TMP,
    });
    writeFileSync(join(TMP, 'specs', featureId, 'spec.md'), '# Spec');
    const result = advance(featureId, TMP);
    expect(result.gateResult).toBe('PASS');
  });
});

// ─── Force 推进 + 审计记录 ───────────────────────────────

describe('Force advance with audit', () => {
  it('should write FORCE_SKIPPED to findings.md', () => {
    writeFileSync(join(TMP, '.spec-first', 'config.yaml'), yaml.dump({
      version: '1.0', gate: { pilot_mode: false },
    }));
    const { featureId } = init({
      feat: 'FRC', mode: 'N', size: 'S', platforms: ['h5'], projectRoot: TMP,
    });
    const result = advance(featureId, TMP, { force: true });
    expect(result.gateResult).toBe('FORCE_SKIPPED');
    const findings = readFileSync(
      join(TMP, 'specs', featureId, 'findings.md'), 'utf-8',
    );
    expect(findings).toContain('FORCE_SKIPPED');
    expect(findings).toContain('00_init');
  });
});

describe('Archive composite threshold', () => {
  it('should archive medium task_plan.md when risk markers exist', () => {
    writeFileSync(join(TMP, '.spec-first', 'config.yaml'), yaml.dump({
      version: '1.0', gate: { pilot_mode: true },
    }));
    const { featureId } = init({
      feat: 'ARC', mode: 'N', size: 'M', platforms: ['h5'], projectRoot: TMP,
    });

    const findingsLines = Array.from({ length: 220 }, (_, i) => `finding-${i + 1}`);
    writeFileSync(join(TMP, 'specs', featureId, 'findings.md'), findingsLines.join('\n'), 'utf-8');

    const taskLines = Array.from({ length: 220 }, (_, i) => `task-${i + 1}`);
    taskLines[40] = '状态: 阻塞（等待外部依赖）';
    writeFileSync(join(TMP, 'specs', featureId, 'task_plan.md'), taskLines.join('\n'), 'utf-8');

    const archived = preWriteArchive(featureId, TMP);
    expect(archived).toContain('task_plan.md');
    expect(archived).not.toContain('findings.md');

    const keptTaskPlan = readFileSync(join(TMP, 'specs', featureId, 'task_plan.md'), 'utf-8');
    expect(keptTaskPlan.split('\n').length).toBeLessThanOrEqual(200);

    const archiveFiles = readdirSync(join(TMP, 'specs', featureId))
      .filter((file) => /^task_plan-\d{4}-\d{2}-\d{2}-\d+\.md$/.test(file));
    expect(archiveFiles.length).toBeGreaterThan(0);
  });

  it('should not archive medium task_plan.md without risk markers', () => {
    writeFileSync(join(TMP, '.spec-first', 'config.yaml'), yaml.dump({
      version: '1.0', gate: { pilot_mode: true },
    }));
    const { featureId } = init({
      feat: 'ARN', mode: 'N', size: 'M', platforms: ['h5'], projectRoot: TMP,
    });

    const taskLines = Array.from({ length: 220 }, (_, i) => `task-${i + 1}`);
    writeFileSync(join(TMP, 'specs', featureId, 'task_plan.md'), taskLines.join('\n'), 'utf-8');

    const archived = preWriteArchive(featureId, TMP);
    expect(archived).not.toContain('task_plan.md');

    const archiveFiles = readdirSync(join(TMP, 'specs', featureId))
      .filter((file) => /^task_plan-\d{4}-\d{2}-\d{2}-\d+\.md$/.test(file));
    expect(archiveFiles.length).toBe(0);

    const currentTaskPlan = readFileSync(join(TMP, 'specs', featureId, 'task_plan.md'), 'utf-8');
    expect(currentTaskPlan.split('\n').length).toBe(220);
  });
});

// ─── Cancel 流程 ─────────────────────────────────────────

describe('Cancel flow', () => {
  it('should cancel feature with reason', () => {
    writeFileSync(join(TMP, '.spec-first', 'config.yaml'), yaml.dump({
      version: '1.0', gate: { pilot_mode: true },
    }));
    const { featureId } = init({
      feat: 'CAN', mode: 'N', size: 'S', platforms: ['h5'], projectRoot: TMP,
    });
    advance(featureId, TMP); // 00→01
    const result = cancel(featureId, TMP, '需求变更，取消开发');
    expect(result.to).toBe('09_cancelled');
    const state = getFeatureState(featureId, TMP);
    expect(state.terminal).toBe(true);
  });

  it('should reject operations after cancel', () => {
    writeFileSync(join(TMP, '.spec-first', 'config.yaml'), yaml.dump({
      version: '1.0', gate: { pilot_mode: true },
    }));
    const { featureId } = init({
      feat: 'CAN2', mode: 'N', size: 'S', platforms: ['h5'], projectRoot: TMP,
    });
    cancel(featureId, TMP, '取消');
    expect(() => advance(featureId, TMP, { force: true }))
      .toThrow(/终态阶段/);
  });
});

// ─── RFC 变更流程 ────────────────────────────────────────

describe('RFC change flow', () => {
  it('should create → approve → close RFC lifecycle', () => {
    writeFileSync(join(TMP, '.spec-first', 'config.yaml'), yaml.dump({
      version: '1.0', gate: { pilot_mode: true },
    }));
    const { featureId } = init({
      feat: 'RFC', mode: 'N', size: 'S', platforms: ['h5'], projectRoot: TMP,
    });
    // 创建 RFC
    const rfc = createRfc(featureId, {
      title: '变更登录方式', level: 'Major', by: 'Leo',
    }, TMP);
    expect(rfc.id).toBe('RFC-001');
    expect(rfc.status).toBe('draft');

    // 审批
    transitionRfc(rfc.id, 'approved', featureId, TMP);
    const approved = getRfc(rfc.id, featureId, TMP);
    expect(approved.status).toBe('approved');

    // 关闭
    transitionRfc(rfc.id, 'closed', featureId, TMP);
    const closed = getRfc(rfc.id, featureId, TMP);
    expect(closed.status).toBe('closed');
  });
});

// ─── 缺陷闭环流程 ────────────────────────────────────────

describe('Defect lifecycle', () => {
  it('should register → fix → verify defect', () => {
    writeFileSync(join(TMP, '.spec-first', 'config.yaml'), yaml.dump({
      version: '1.0', gate: { pilot_mode: true },
    }));
    const { featureId } = init({
      feat: 'DEF', mode: 'N', size: 'S', platforms: ['h5'], projectRoot: TMP,
    });
    // 注册缺陷
    const defect = registerDefect(featureId, {
      severity: 'S2', title: '登录按钮无响应', reporter: 'QA',
    }, TMP);
    expect(defect.seq).toBe(1);
    expect(defect.status).toBe('open');

    // 修复中
    transitionDefect(featureId, 1, 'fixing', TMP);
    expect(getDefect(featureId, 1, TMP).status).toBe('fixing');

    // 已修复
    transitionDefect(featureId, 1, 'fixed', TMP);
    expect(getDefect(featureId, 1, TMP).status).toBe('fixed');

    // 验证通过
    transitionDefect(featureId, 1, 'verified', TMP);
    expect(getDefect(featureId, 1, TMP).status).toBe('verified');
  });
});
