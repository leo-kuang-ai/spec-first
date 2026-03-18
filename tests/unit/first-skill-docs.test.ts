import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const FIRST_ROOT = join(import.meta.dirname, '../../skills/spec-first/00-first');
const SKILLS_INDEX = join(import.meta.dirname, '../../skills/spec-first/README.md');
const SKILL_MD = join(FIRST_ROOT, 'SKILL.md');
const SUBAGENT_ARCH = join(FIRST_ROOT, 'references/subagent-architecture.md');
const AGENT_DB = join(FIRST_ROOT, 'references/agent-database.md');
const DETECTION = join(FIRST_ROOT, 'references/detection-rules.md');
const TESTING = join(FIRST_ROOT, 'references/testing-strategy.md');
const QA_SHARED = join(FIRST_ROOT, 'references/quality-assurance-rules.md');
const PLATFORM_MAPPING = join(FIRST_ROOT, 'references/platform-document-mapping.md');
const LEGACY_PLATFORM_MAPPING = join(FIRST_ROOT, 'references/端类型产物映射.md');
const EXECUTION_FLOW = join(FIRST_ROOT, 'references/execution-flow.md');
const OPENAI_META = join(FIRST_ROOT, 'agents/openai.yaml');
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
  it('should keep expected core files and minimal frontmatter', () => {
    expect(existsSync(SKILL_MD)).toBe(true);
    expect(existsSync(SKILLS_INDEX)).toBe(true);
    expect(existsSync(SUBAGENT_ARCH)).toBe(true);
    expect(existsSync(QA_SHARED)).toBe(true);
    expect(existsSync(TESTING)).toBe(true);
    expect(existsSync(PLATFORM_MAPPING)).toBe(true);
    expect(existsSync(OPENAI_META)).toBe(true);
    expect(existsSync(LEGACY_PLATFORM_MAPPING)).toBe(false);

    const skill = read(SKILL_MD);
    expect(skill).toContain('name: "spec-first:first"');
    expect(skill).toContain('description: "Use when you need to understand an existing project quickly');
    expect(skill).not.toContain('version: "2.3.0"');
    expect(skill).not.toContain('last_updated: "2026-03-17"');
  });

  it('should use trigger-style description and keep CLI as default path', () => {
    const skill = read(SKILL_MD);
    expect(skill).toContain('description: "Use when');
    expect(skill).toContain('spec-first first --yes');
  });

  it('should keep common mistakes focused on runtime-first misuse', () => {
    const skill = read(SKILL_MD);
    expect(skill).toContain('## Common Mistakes');
    expect(skill).toContain('docs/first');
  });

  it('should not use deprecated evidence marker format', () => {
    const files = [SKILL_MD, SUBAGENT_ARCH, AGENT_DB, DETECTION, TESTING, QA_SHARED, ...AGENT_DOCS];
    for (const file of files) {
      const content = read(file);
      expect(content).not.toContain('(证据:');
    }
  });

  it('should describe 00-first as single-entry default-deep flow in skills index', () => {
    const index = read(SKILLS_INDEX);
    expect(index).toContain('runtime 真源');
    expect(index).not.toContain('quick 模式');
  });

  it('should centralize QA rules in shared reference', () => {
    const shared = read(QA_SHARED);
    expect(shared).toContain('统一 QA 规则');
    expect(shared).toContain('runtime 资产');

    for (const file of AGENT_DOCS) {
      const content = read(file);
      expect(content).toContain('quality-assurance-rules.md');
    }
  });

  it('should describe runtime asset handoff in agent specs', () => {
    for (const file of AGENT_DOCS) {
      const content = read(file);
      expect(content).toMatch(/\w+\.json/);
    }
  });

  it('should document technical credential safeguards for Agent D', () => {
    const db = read(AGENT_DB);
    expect(db).toContain('凭证防护');
    expect(db).toContain('日志脱敏');
  });

  it('should include Context7 key governance requirements', () => {
    const detection = read(DETECTION);
    expect(detection).toContain('Context7');
    expect(detection).toContain('CONTEXT7_API_KEY');
  });

  it('should keep detection rules on runtime-first identification contract', () => {
    const detection = read(DETECTION);
    expect(detection).toContain('项目识别');
    expect(detection).not.toContain('quick 模式');
  });

  it('should keep database config focused on conditional database capability', () => {
    const databaseConfig = read(join(FIRST_ROOT, 'references/database-config.md'));
    expect(databaseConfig).toContain('条件型能力');
    expect(databaseConfig).toContain('database-schema.json');
  });

  it('should include testing strategy matrix and link from SKILL.md', () => {
    const skill = read(SKILL_MD);
    const testing = read(TESTING);

    expect(skill).toContain('testing-strategy.md');
    expect(testing).toContain('测试策略');
  });

  it('should describe testing strategy by assets and projections', () => {
    const testing = read(TESTING);
    expect(testing).toContain('资产');
    expect(testing).toContain('投影');
    expect(testing).toContain('runtime');
  });

  it('should keep execution flow on runtime-first contract', () => {
    const flow = read(EXECUTION_FLOW);
    expect(flow).toContain('spec-first first --yes');
    expect(flow).toContain('.spec-first/runtime/first/');
  });

  it('should keep domain model analysis as asset-generation spec', () => {
    const domainAnalysis = read(join(FIRST_ROOT, 'references/domain-model-analysis.md'));
    expect(domainAnalysis).toContain('领域模型');
    expect(domainAnalysis).toContain('domain-model.json');
  });

  it('should keep subagent orchestration on runtime-first delivery chain', () => {
    const arch = read(SUBAGENT_ARCH);
    expect(arch).toContain('CLI');
    expect(arch).toContain('runtime');
  });

  it('should include openai ui metadata for 00-first', () => {
    const meta = read(OPENAI_META);
    expect(meta).toContain('display_name: First');
    expect(meta).toContain('runtime-first');
  });

  it('should include platform type detection rules', () => {
    const detection = read(DETECTION);
    const mapping = read(PLATFORM_MAPPING);

    expect(detection).toContain('主类型识别');
    expect(mapping).toContain('平台文档映射');
  });

  it('should include platform and degradation test cases in testing strategy', () => {
    const testing = read(TESTING);
    expect(testing).toContain('端类型');
    expect(testing).toContain('降级');
  });

});


const INIT_SKILL = join(import.meta.dirname, '../../skills/spec-first/01-init/SKILL.md');
const INIT_PREREQ = join(import.meta.dirname, '../../skills/spec-first/01-init/references/prerequisites.md');
const INIT_OUTPUT = join(import.meta.dirname, '../../skills/spec-first/01-init/references/output-format.md');
const FIRST_README = join(import.meta.dirname, '../../docs/first/README.md');

describe('runtime truth source and docs projection model', () => {
  it('documents runtime truth source in 00-first skill', () => {
    const skill = read(SKILL_MD);
    expect(skill).toContain('.spec-first/runtime/first/');
    expect(skill).toContain('docs/first/');
    expect(skill).not.toContain('.index.yaml');
  });

  it('documents the current runtime-first artifact inventory', () => {
    const skill = read(SKILL_MD);
    expect(skill).toContain('投影视图');
    expect(skill).toContain('.json');
  });

  it.skip('documents init readiness against runtime truth source', () => {
    const initSkill = read(INIT_SKILL);
    const prereq = read(INIT_PREREQ);
    const output = read(INIT_OUTPUT);

    expect(initSkill).toContain('.spec-first/runtime/first/index.json');
    expect(initSkill).toContain('.spec-first/runtime/first/summary.json');
    expect(initSkill).not.toContain('.index.yaml');
    expect(prereq).not.toContain('.index.yaml');
    expect(prereq).toContain('.spec-first/runtime/first/');
    expect(output).toContain('.spec-first/runtime/first/index.json');
  });

  it('documents docs/first as projection-layer outputs in skill docs', () => {
    const skill = read(SKILL_MD);
    expect(skill).toContain('projection');
    expect(skill).toContain('.spec-first/runtime/first/');
  });

  it('documents canonical docs/first projection inventory in skill docs', () => {
    const skill = read(SKILL_MD);
    expect(skill).toContain('投影视图');
  });
});


describe('refresh mode docs', () => {
  it.skip('documents the three refresh modes in 00-first skill', () => {
    const skill = read(SKILL_MD);
    expect(skill).toContain('refresh-runtime-only');
    expect(skill).toContain('refresh-docs-from-runtime');
    expect(skill).toContain('refresh-all');
  });
});
