'use strict';

const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.join(__dirname, '..', '..');
const GOVERNANCE_PATH = path.join(
  REPO_ROOT,
  'src',
  'cli',
  'contracts',
  'dual-host-governance',
  'skills-governance.json',
);

function read(relativePath) {
  return fs.readFileSync(path.join(REPO_ROOT, relativePath), 'utf8');
}

describe('spec-rule-miner skill contract', () => {
  test('defines a standalone project-rule mining skill with source/runtime boundaries', () => {
    const skill = read('skills/spec-rule-miner/SKILL.md');
    const patternCategories = read('skills/spec-rule-miner/references/pattern-categories.md');
    const writeTargets = read('skills/spec-rule-miner/references/write-targets.md');

    expect(skill).toContain('name: spec-rule-miner');
    expect(skill).toContain('standalone skill');
    expect(skill).toContain('`AGENTS.md`');
    expect(skill).toContain('<=1000 words');
    expect(skill).toContain('近邻路由');
    expect(skill).toContain('`spec-team-standards-governance`');
    expect(skill).toContain('不要修改业务源码');
    expect(skill).toContain('不手改 generated runtime mirrors');
    expect(skill).toContain('[Pattern Categories](references/pattern-categories.md)');
    expect(skill).toContain('[Write Targets](references/write-targets.md)');
    expect(skill).toContain('spec-rule-miner-start');
    expect(skill).toContain('headless_default_write');
    expect(skill).toContain('普通聊天里用户暂未回复不能算 headless');
    expect(skill).toContain('evidence_summary');

    expect(patternCategories).toContain('Hidden Associations');
    expect(patternCategories).toContain('Anti-Patterns');
    expect(patternCategories).toContain('函数与代码体风格');
    expect(patternCategories).toContain('大仓库');
    expect(patternCategories).toContain('混合语言');

    expect(writeTargets).toContain('canonical full rules');
    expect(writeTargets).toContain('CLAUDE.md');
    expect(writeTargets).toContain('.cursor/rules/project-rules.mdc');
    expect(writeTargets).toContain('.cursorrules');
    expect(writeTargets).toContain('markers');
    expect(writeTargets).toContain('legacy `rule-miner-start` / `rule-miner-end` markers');
    expect(writeTargets).toContain('legacy marker migration');
    expect(writeTargets).toContain('frontmatter 必须保持文件第一段');
    expect(writeTargets).toContain('禁止目标');
  });

  test('declares trigger, near-neighbor, and runtime-boundary eval coverage', () => {
    const cases = JSON.parse(read('skills/spec-rule-miner/evals/trigger-cases.json'));

    expect(cases.schema_version).toBe('spec-rule-miner-trigger-evals/v1');
    expect(cases.skill).toBe('spec-rule-miner');
    expect(cases.source_refs).toEqual(expect.arrayContaining([
      'skills/spec-rule-miner/SKILL.md',
      'skills/spec-rule-miner/references/pattern-categories.md',
      'skills/spec-rule-miner/references/write-targets.md',
    ]));

    const results = cases.cases.map((entry) => entry.expected_result);
    expect(results).toEqual(expect.arrayContaining([
      'should-trigger',
      'near-neighbor',
      'should-not-trigger',
      'boundary',
    ]));
    expect(JSON.stringify(cases)).toContain('project-rule-mining');
    expect(JSON.stringify(cases)).toContain('standards-governance-not-rule-mining');
    expect(JSON.stringify(cases)).toContain('review-not-rule-mining');
    expect(JSON.stringify(cases)).toContain('generated-runtime-not-rule-target');
    expect(JSON.stringify(cases)).toContain('headless-default-write-requires-evidence');
    expect(JSON.stringify(cases)).toContain('legacy-marker-migration');
    expect(JSON.stringify(cases)).toContain('frontmatter-preservation');
  });

  test('governance registers spec-rule-miner as a dual-host standalone skill', () => {
    const governance = JSON.parse(fs.readFileSync(GOVERNANCE_PATH, 'utf8'));
    const record = governance.skills.find((candidate) =>
      candidate.skill_name === 'spec-rule-miner',
    );

    expect(record).toEqual({
      skill_name: 'spec-rule-miner',
      entry_surface: 'standalone_skill',
      command_name: null,
      host_scope: 'dual_host',
      owner_host: null,
      host_delivery: {
        claude: 'skill',
        codex: 'skill',
        cursor: 'skill',
        kiro: 'skill',
        qoder: 'skill',
      },
    });
  });
});
