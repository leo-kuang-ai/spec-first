import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const FIRST_ROOT = join(import.meta.dirname, '../../skills/spec-first/00-first');
const SKILL_MD = join(FIRST_ROOT, 'SKILL.md');
const SUBAGENT_ARCH = join(FIRST_ROOT, 'references/subagent-architecture.md');
const AGENT_DB = join(FIRST_ROOT, 'references/agent-database.md');
const DETECTION = join(FIRST_ROOT, 'references/detection-rules.md');
const TESTING = join(FIRST_ROOT, 'references/testing-strategy.md');
const QA_SHARED = join(FIRST_ROOT, 'references/quality-assurance-rules.md');
const AGENT_DOCS = [
  join(FIRST_ROOT, 'references/agents-code-analysis.md'),
  join(FIRST_ROOT, 'references/agents-api-deps.md'),
  join(FIRST_ROOT, 'references/agent-guidelines-setup.md'),
  join(FIRST_ROOT, 'references/agent-database.md'),
  join(FIRST_ROOT, 'references/agent-domain-model.md'),
];

function read(path: string): string {
  return readFileSync(path, 'utf-8');
}

describe('00-first skill docs consistency', () => {
  it('should keep expected core files and frontmatter version', () => {
    expect(existsSync(SKILL_MD)).toBe(true);
    expect(existsSync(SUBAGENT_ARCH)).toBe(true);
    expect(existsSync(QA_SHARED)).toBe(true);
    expect(existsSync(TESTING)).toBe(true);

    const skill = read(SKILL_MD);
    expect(skill).toContain('version: 1.11.1');
  });

  it('should not use deprecated evidence marker format', () => {
    const files = [SKILL_MD, SUBAGENT_ARCH, AGENT_DB, DETECTION, TESTING, QA_SHARED, ...AGENT_DOCS];
    for (const file of files) {
      const content = read(file);
      expect(content).not.toContain('(证据:');
    }
  });

  it('should keep unified evidence format in SKILL.md', () => {
    const skill = read(SKILL_MD);
    expect(skill).toContain('- <结论> (`<file_path>:<line>` — `<关键代码片段>` — `[证据类型]`)');
    expect(skill).toContain('证据标注抽检');
  });

  it('should keep A4 dependency chain consistent as A2 + B + D', () => {
    const skill = read(SKILL_MD);
    const arch = read(SUBAGENT_ARCH);
    const domain = read(join(FIRST_ROOT, 'references/agent-domain-model.md'));

    expect(skill).toContain('第三波（A2 + B + D 完成后派发）');
    expect(skill).toContain('等待 A2 + B + D 完成');
    expect(arch).toContain('等待 A2 + B + D 完成');
    expect(domain).toContain('派发时机: 第三波（等待 A2 + B + D 完成后）');
  });

  it('should keep timeout policy consistent at 60/120/300', () => {
    const skill = read(SKILL_MD);
    const arch = read(SUBAGENT_ARCH);

    expect(skill).toContain('单个子 agent 60s，单阶段总超时 120s，整体并行阶段最大 300s');
    expect(arch).toContain('| 第一波 | 60s | 120s |');
    expect(arch).toContain('| 第二波 | 60s | 120s |');
    expect(arch).toContain('| 第三波 | 60s | 120s |');
    expect(arch).toContain('整体并行阶段最大超时：**300s**');
    expect(arch).not.toContain('| 第三波 | 40s | 120s |');
  });

  it('should centralize QA rules in shared reference', () => {
    const shared = read(QA_SHARED);
    expect(shared).toContain('统一 QA 规则（00-first）');
    expect(shared).toContain('Agent 最低要求矩阵');

    for (const file of AGENT_DOCS) {
      const content = read(file);
      expect(content).toContain('quality-assurance-rules.md');
      expect(content).not.toContain('**证据类型分类**');
    }
  });

  it('should document technical credential safeguards for Agent D', () => {
    const db = read(AGENT_DB);
    expect(db).toContain('凭证防护执行规则（技术性，强制）');
    expect(db).toContain('最小暴露');
    expect(db).toContain('日志脱敏');
    expect(db).toContain('输出约束');
    expect(db).toContain('失败兜底');
    expect(db).toContain('会话清理');
  });

  it('should include Context7 key governance requirements', () => {
    const detection = read(DETECTION);
    expect(detection).toContain('Context7 密钥治理（安全要求）');
    expect(detection).toContain('CONTEXT7_API_KEY');
    expect(detection).toContain('日志脱敏');
    expect(detection).toContain('最小权限');
  });

  it('should include testing strategy matrix and link from SKILL.md', () => {
    const skill = read(SKILL_MD);
    const testing = read(TESTING);

    expect(skill).toContain('references/testing-strategy.md');
    expect(testing).toContain('00-first 测试策略（最小矩阵）');
    expect(testing).toContain('A1、A2、A3、B、C1、C2、D、A4');
    expect(testing).toContain('T-SEC-01');
    expect(testing).toContain('T-ORCH-05');
  });
});
