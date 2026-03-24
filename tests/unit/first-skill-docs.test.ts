import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const FIRST_ROOT = join(import.meta.dirname, '../../skills/spec-first/00-first');
const SKILLS_INDEX = join(import.meta.dirname, '../../skills/spec-first/README.md');
const SKILL_MD = join(FIRST_ROOT, 'SKILL.md');
const EXECUTION_AND_ARCH = join(FIRST_ROOT, 'references/execution-and-agent-architecture.md');
const MAIN_THREAD_CONTRACT = join(FIRST_ROOT, 'references/main-thread-and-evidence-contract.md');
const OUTPUT_GUIDE = join(FIRST_ROOT, 'references/output-consumption-guide.md');
const DATABASE_ANALYSIS = join(FIRST_ROOT, 'references/database-analysis.md');
const DETECTION = join(FIRST_ROOT, 'references/detection-rules.md');
const TESTING = join(FIRST_ROOT, 'references/testing-strategy.md');
const QA_SHARED = join(FIRST_ROOT, 'references/quality-assurance-rules.md');
const PLATFORM_MAPPING = join(FIRST_ROOT, 'references/platform-document-mapping.md');
const OPENAI_META = join(FIRST_ROOT, 'agents/openai.yaml');

const TOPIC_ANALYSIS_DOCS = [
  join(FIRST_ROOT, 'references/code-structure-analysis.md'),
  join(FIRST_ROOT, 'references/api-and-dependencies-analysis.md'),
  join(FIRST_ROOT, 'references/conventions-and-setup-analysis.md'),
  join(FIRST_ROOT, 'references/domain-model-analysis.md'),
  join(FIRST_ROOT, 'references/database-analysis.md'),
];

function read(path: string): string {
  return readFileSync(path, 'utf-8');
}

describe('00-first skill docs consistency', () => {
  it('should keep expected core files and minimal frontmatter', () => {
    expect(existsSync(SKILL_MD)).toBe(true);
    expect(existsSync(SKILLS_INDEX)).toBe(true);
    expect(existsSync(EXECUTION_AND_ARCH)).toBe(true);
    expect(existsSync(MAIN_THREAD_CONTRACT)).toBe(true);
    expect(existsSync(OUTPUT_GUIDE)).toBe(true);
    expect(existsSync(QA_SHARED)).toBe(true);
    expect(existsSync(TESTING)).toBe(true);
    expect(existsSync(PLATFORM_MAPPING)).toBe(true);
    expect(existsSync(OPENAI_META)).toBe(true);
  });

  it('should use trigger-style description and keep CLI as default path', () => {
    const skill = read(SKILL_MD);
    expect(skill).toContain('description: "Use when');
    expect(skill).toContain('spec-first first');
    expect(skill).not.toContain('spec-first first --yes');
  });

  it('should keep common mistakes focused on runtime-first misuse', () => {
    const skill = read(SKILL_MD);
    expect(skill).toContain('## Common Mistakes');
    expect(skill).toContain('docs/first');
  });

  it('should not use deprecated evidence marker format', () => {
    const files = [SKILL_MD, EXECUTION_AND_ARCH, DATABASE_ANALYSIS, DETECTION, TESTING, QA_SHARED, ...TOPIC_ANALYSIS_DOCS];
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

    for (const file of TOPIC_ANALYSIS_DOCS) {
      const content = read(file);
      expect(content).toContain('quality-assurance-rules.md');
    }
  });

  it('should describe runtime asset outputs in topic analysis specs', () => {
    for (const file of TOPIC_ANALYSIS_DOCS) {
      const content = read(file);
      expect(content).toMatch(/\w+\.json/);
    }
  });

  it('should document technical credential safeguards in database analysis', () => {
    const db = read(DATABASE_ANALYSIS);
    expect(db).toContain('凭证防护');
    expect(db).toContain('日志脱敏');
  });

  it('should keep detection rules focused on runtime-first identification', () => {
    const detection = read(DETECTION);
    expect(detection).not.toContain('Context7');
    expect(detection).not.toContain('CONTEXT7_API_KEY');
  });

  it('should keep detection rules on runtime-first identification contract', () => {
    const detection = read(DETECTION);
    expect(detection).toContain('项目识别');
    expect(detection).not.toContain('quick 模式');
  });

  it('should keep database analysis focused on conditional database capability', () => {
    const databaseAnalysis = read(DATABASE_ANALYSIS);
    expect(databaseAnalysis).toContain('条件型能力');
    expect(databaseAnalysis).toContain('database-schema.json');
  });

  it('should include testing strategy matrix and link from SKILL.md', () => {
    const skill = read(SKILL_MD);
    const testing = read(TESTING);
    const outputGuide = read(OUTPUT_GUIDE);

    expect(skill).toContain('testing-strategy.md');
    expect(skill).toContain('references/main-thread-and-evidence-contract.md');
    expect(skill).toContain('output-consumption-guide.md');
    expect(testing).toContain('测试策略');
    expect(outputGuide).toContain('消费决策');
  });

  it('should describe testing strategy by assets and docs outputs', () => {
    const testing = read(TESTING);
    expect(testing).toContain('资产');
    expect(testing).toContain('docs 输出');
    expect(testing).toContain('runtime');
  });

  it('should keep execution flow on runtime-first contract', () => {
    const flow = read(EXECUTION_AND_ARCH);
    expect(flow).toContain('spec-first first');
    expect(flow).not.toContain('spec-first first --yes');
    expect(flow).toContain('.spec-first/runtime/first/');
  });

  it('loads main-thread canonical contracts before collecting evidence pack', () => {
    const flow = read(EXECUTION_AND_ARCH);
    expect(flow).toContain('步骤 0: 加载主线程契约');
    expect(flow).toContain('main-thread-and-evidence-contract.md');
    expect(flow).toContain('步骤 1: 收集证据包');

    // Order matters: contract needs to be loaded before evidence gathering.
    expect(flow.indexOf('步骤 0: 加载主线程契约')).toBeLessThan(
      flow.indexOf('步骤 1: 收集证据包')
    );
  });

  it('should keep domain model analysis as asset-generation spec', () => {
    const domainAnalysis = read(join(FIRST_ROOT, 'references/domain-model-analysis.md'));
    expect(domainAnalysis).toContain('领域模型');
    expect(domainAnalysis).toContain('domain-model.json');
  });

  it('should keep subagent orchestration on runtime-first delivery chain', () => {
    const arch = read(EXECUTION_AND_ARCH);
    expect(arch).toContain('CLI');
    expect(arch).toContain('runtime');
    expect(arch).toContain('Serena');
    expect(arch).toContain('shared/summary.json');
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
    expect(mapping).toContain('database-analysis.md');
    expect(mapping).not.toContain('database-config.md');
  });

  it('should include platform and degradation test cases in testing strategy', () => {
    const testing = read(TESTING);
    expect(testing).toContain('端类型');
    expect(testing).toContain('降级');
  });

});


const INIT_SKILL = join(import.meta.dirname, '../../skills/spec-first/01-init/SKILL.md');
const INIT_PREREQ = join(import.meta.dirname, '../../skills/spec-first/01-init/references/prerequisites.md');
const INIT_OUTPUT = join(import.meta.dirname, '../../skills/spec-first/01-init/references/prerequisites.md');

describe('runtime truth source and docs output model', () => {
  it('documents runtime truth source in 00-first skill', () => {
    const skill = read(SKILL_MD);
    expect(skill).toContain('.spec-first/runtime/first/');
    expect(skill).toContain('docs/first/');
    expect(skill).not.toContain('.index.yaml');
  });

  it('documents the current runtime-first artifact inventory', () => {
    const skill = read(SKILL_MD);
    expect(skill).toContain('docs/first');
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

  it('documents docs/first as reading outputs in skill docs', () => {
    const skill = read(SKILL_MD);
    expect(skill).toContain('阅读产物');
    expect(skill).toContain('.spec-first/runtime/first/');
  });

  it('documents docs/first output inventory in skill docs', () => {
    const skill = read(SKILL_MD);
    expect(skill).toContain('docs/first/*.md');
  });
});
