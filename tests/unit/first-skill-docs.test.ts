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
const PLATFORM_MAPPING = join(FIRST_ROOT, 'references/端类型产物映射.md');
const TEMPLATES_DIR = join(FIRST_ROOT, 'references/templates');
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
    expect(existsSync(PLATFORM_MAPPING)).toBe(true); // Phase 2 新增

    const skill = read(SKILL_MD);
    expect(skill).toContain('version: 2.0.0');
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
    expect(skill).toContain('证据抽检');
  });

  it('should keep A4 dependency chain consistent as A2 + B + D', () => {
    const skill = read(SKILL_MD);
    const arch = read(SUBAGENT_ARCH);
    const domain = read(join(FIRST_ROOT, 'references/agent-domain-model.md'));

    expect(skill).toContain('第三波（A2 + B + D 完成后）');
    expect(skill).toContain('等待 A2+B+D');
    expect(arch).toContain('等待 A2 + B + D 完成');
    expect(domain).toContain('派发时机: 第三波（等待 A2 + B + D 完成后）');
  });

  it('should keep timeout policy consistent at 60/120/300', () => {
    const skill = read(SKILL_MD);
    const arch = read(SUBAGENT_ARCH);

    expect(skill).toContain('单个子 agent 60s，单阶段总超时 120s，整体并行阶段最大 300s');
    expect(arch).toContain('| **quick 模式** | 60s | 120s |');
    expect(arch).toContain('| **deep 模式** | 60s（单个 Agent） | 300s（整体） |');
    expect(arch).toContain('整体并行阶段最大超时：**300s**（deep 模式）');
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
    expect(testing).toContain('T-QUICK-01'); // Phase 2: quick 模式测试用例
  });

  // Phase 2: 端类型检测测试用例
  it('should include platform type detection rules (Phase 2)', () => {
    const detection = read(DETECTION);
    const mapping = read(PLATFORM_MAPPING);

    // detection-rules.md 应包含端类型检测章节
    expect(detection).toContain('端类型检测规则（7 种主类型）');
    expect(detection).toContain('后台服务（backend）');
    expect(detection).toContain('前端 Web（frontend）');
    expect(detection).toContain('移动端 App（mobile）');
    expect(detection).toContain('跨平台（cross-platform）');
    expect(detection).toContain('端类型检测失败处理');

    // 端类型产物映射文件应存在并包含各类型产物定义
    expect(mapping).toContain('端类型产物映射配置');
    expect(mapping).toContain('## 1. 后台服务');
    expect(mapping).toContain('## 2. 前端 Web');
    expect(mapping).toContain('## 3. 移动端 App');
  });

  it('should include Phase 2 test cases in testing strategy', () => {
    const testing = read(TESTING);

    expect(testing).toContain('## 7. 端类型检测测试用例（Phase 2）');
    expect(testing).toContain('T-TYPE-01'); // backend 检测
    expect(testing).toContain('T-TYPE-02'); // frontend(Admin) 检测
    expect(testing).toContain('T-TYPE-04'); // mobile 检测
    expect(testing).toContain('## 8. Greenfield 检测测试用例（Phase 2）');
    expect(testing).toContain('T-GF-01'); // 空目录检测
    expect(testing).toContain('| 2.1.0 | 2026-03-02 | 新增端类型检测测试用例'); // 版本历史
  });

  // Phase 3: 模板和智能推荐测试用例
  it('should include Phase 3 templates and smart recommendations', () => {
    const skill = read(SKILL_MD);
    const detection = read(DETECTION);
    const testing = read(TESTING);

    // 智能模式推荐
    expect(skill).toContain('智能模式推荐（Phase 3）');
    expect(skill).toContain('渐进式升级（Phase 3）');
    expect(skill).toContain('模式选择与交互策略'); // 替代 "默认无交互模式"

    // 复合类型检测优化
    expect(detection).toContain('复合类型检测优化（Phase 3）');
    expect(detection).toContain('Monorepo 子类型识别');
    expect(detection).toContain('Flutter Web 混合');

    // Phase 3 测试用例
    expect(testing).toContain('## 10. Phase 3 测试用例');
    expect(testing).toContain('T-TMPL-01'); // 模板测试
    expect(testing).toContain('T-SMART-01'); // 智能推荐测试
    expect(testing).toContain('T-PROG-01'); // 渐进式升级测试
    expect(testing).toContain('T-COMP-01'); // 复合类型检测测试
    expect(testing).toContain('| 2.2.0 | 2026-03-02 | 新增 Phase 3 测试用例'); // 版本历史
  });

  it('should include platform-specific architecture templates', () => {
    // 检查模板目录存在
    expect(existsSync(TEMPLATES_DIR)).toBe(true);

    const backendTpl = read(join(TEMPLATES_DIR, 'architecture-backend.md'));
    const frontendTpl = read(join(TEMPLATES_DIR, 'architecture-frontend.md'));
    const mobileTpl = read(join(TEMPLATES_DIR, 'architecture-mobile.md'));
    const apiTpl = read(join(TEMPLATES_DIR, 'api-docs-perspective.md'));

    // backend 模板内容
    expect(backendTpl).toContain('系统架构（后台服务）');
    expect(backendTpl).toContain('分层架构');
    expect(backendTpl).toContain('Controller');
    expect(backendTpl).toContain('Service');
    expect(backendTpl).toContain('Repository');

    // frontend 模板内容
    expect(frontendTpl).toContain('系统架构（前端 Web）');
    expect(frontendTpl).toContain('FSD（Feature-Sliced Design）');
    expect(frontendTpl).toContain('状态管理');

    // mobile 模板内容
    expect(mobileTpl).toContain('系统架构（移动端 App）');
    expect(mobileTpl).toContain('Platform Channel Layer');
    expect(mobileTpl).toContain('Native Layer');

    // api-docs 视角差异
    expect(apiTpl).toContain('API 文档模板（视角差异）');
    expect(apiTpl).toContain('后台服务（暴露方视角）');
    expect(apiTpl).toContain('前端/App（调用方视角）');
  });
});
