import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const SPEC_SKILL = join(import.meta.dirname, '../../skills/spec-first/03-spec/SKILL.md');
const DESIGN_SKILL = join(import.meta.dirname, '../../skills/spec-first/04-design/SKILL.md');
const CODE_REVIEW_SKILL = join(import.meta.dirname, '../../skills/spec-first/08-review/SKILL.md');
const VERIFY_SKILL = join(import.meta.dirname, '../../skills/spec-first/12-verify/SKILL.md');

function read(path: string): string {
  return readFileSync(path, 'utf-8');
}

describe('phase1 enhancement docs consistency', () => {
  it('spec skill should define explicit constitution check flow with violation marker', () => {
    const content = read(SPEC_SKILL);
    expect(content).toContain('## 宪法权威检查（P1-CON）');
    expect(content).toContain('### P1.5: 宪法一致性检查');
    expect(content).toContain('[CONSTITUTION_VIOLATION]');
    expect(content).toContain('输出违反的具体宪法条款');
  });

  it('design skill should define explicit constitution consistency check step', () => {
    const content = read(DESIGN_SKILL);
    expect(content).toContain('## 宪法权威检查（P1-CON）');
    expect(content).toContain('### P2.5: 设计宪法检查');
    expect(content).toContain('检查每条 DS 是否违反宪法约束');
    expect(content).toContain('不得带冲突推进');
  });

  it('review skill should define layer-selection workflow', () => {
    const content = read(CODE_REVIEW_SKILL);
    expect(content).toContain('## 执行阶段（增强）');
    expect(content).toContain('确定检查层级（single/cross/completion）');
    expect(content).toContain('## 检查层级选择');
    expect(content).toContain('| 单文件小改动 | single |');
    expect(content).toContain('| 多文件/跨模块改动 | cross |');
    expect(content).toContain('| 功能完成/阶段推进 | completion |');
  });

  it('verify skill should define three-layer check model and completion constraint', () => {
    const content = read(VERIFY_SKILL);
    expect(content).toContain('## 三层检查体系（P1-LAYER）');
    expect(content).toContain('### Layer 1: 单层检查（Single-Layer）');
    expect(content).toContain('### Layer 2: 跨层检查（Cross-Layer）');
    expect(content).toContain('### Layer 3: 完成检查（Completion）');
    expect(content).toContain('支持：`/spec-first:verify --layer completion`');
    expect(content).toContain('本期仅允许 `completion`');
  });
});
