'use strict';

const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.join(__dirname, '..', '..');
const CONTRACT_PATH = path.join(REPO_ROOT, 'docs', 'contracts', 'workflows', 'skill-agent-quality-governance.md');
const DOCS_README_PATH = path.join(REPO_ROOT, 'docs', 'README.md');
const SKILLS_GOVERNANCE_SCHEMA_PATH = path.join(
  REPO_ROOT,
  'src',
  'cli',
  'contracts',
  'dual-host-governance',
  'skills-governance.schema.json',
);
const SOURCE_ROOTS = ['skills'];

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function walkPromptFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkPromptFiles(full));
    } else if (/\.(md|yaml|yml|json)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

describe('skill/agent quality governance thin contract', () => {
  test('contract document exists with required contract sections and non-goals', () => {
    const contract = read(CONTRACT_PATH);

    expect(contract).toContain('# Skill/Agent Quality Governance Thin Contract');
    expect(contract).toContain('## 0. Non-goals');
    expect(contract).toContain('Not a state machine');
    expect(contract).toContain('Not a hard gate platform');
    expect(contract).toContain('Not a universal JSON schema');
    expect(contract).toContain('Not a runtime mirror source');
    expect(contract).toContain('Not an eval platform');
    expect(contract).toContain('Skill Minimum Contract v1');
    expect(contract).toContain('High-risk Execution Safety Contract v1');
    expect(contract).toContain('Agent Output Contract Registry v1');
    expect(contract).toContain('Research Evidence Contract v1');
  });

  test('contract preserves source/runtime and existing exception boundaries', () => {
    const contract = read(CONTRACT_PATH);

    expect(contract).toContain('generated runtime mirrors such as `.claude/`, `.codex/`, and `.agents/skills/` are not source of truth');
    expect(contract).toContain('`spec-doc-review` personas receive output schema from `skills/spec-doc-review/references/subagent-template.md`');
    expect(contract).toContain('orchestrator dispatch');
    expect(contract).toContain('optional/internal skills do not need examples until they become high-risk, high-traffic, or downstream-consumed');
    expect(contract).toContain('they must not pretend to judge semantic quality');
  });

  test('lifecycle metadata waiver avoids per-skill manifest topology', () => {
    const contract = read(CONTRACT_PATH);
    const schema = JSON.parse(read(SKILLS_GOVERNANCE_SCHEMA_PATH));
    const specPlanManifest = path.join(REPO_ROOT, 'skills', 'spec-plan', 'manifest.json');
    const specPlanInterface = path.join(REPO_ROOT, 'skills', 'spec-plan', 'agents', 'interface.yaml');

    expect(contract).toContain('公开 workflow skill 不需要为了响应单个审计 finding');
    expect(contract).toContain('当前集中式 dual-host governance contract 只记录 delivery topology');
    expect(contract).toContain('才设计独立的集中式 advisory lifecycle contract');
    expect(contract).toContain('至少两个 public workflows 需要同一组 lifecycle fields');
    expect(contract).toContain('不要为了单个 skill 新增 `skills/<skill>/manifest.json`、`agents/interface.yaml`');
    expect(fs.existsSync(specPlanManifest)).toBe(false);
    expect(fs.existsSync(specPlanInterface)).toBe(false);
    expect(schema.$defs.skillGovernanceRecord.additionalProperties).toBe(false);
    expect(schema.$defs.skillGovernanceRecord.properties.owner).toBeUndefined();
    expect(schema.$defs.skillGovernanceRecord.properties.review_cadence).toBeUndefined();
    expect(schema.$defs.skillGovernanceRecord.properties.maturity).toBeUndefined();
    expect(schema.$defs.skillGovernanceRecord.properties.lifecycle).toBeUndefined();
  });

  test('docs index lists the contract as current source-of-truth documentation', () => {
    const readme = read(DOCS_README_PATH);

    expect(readme).toContain('docs/contracts/workflows/skill-agent-quality-governance.md');
    expect(readme).toContain('skill / agent 质量治理的薄契约、执行边界语言和例外说明');
  });

  test('source skills and agents do not hard-code the current year or current date', () => {
    const bannedPatterns = [
      /(?:note:\s*)?the current year is 20\d{2}/i,
      /current year is 20\d{2}/i,
      /current date is 20\d{2}[-/]\d{1,2}[-/]\d{1,2}/i,
      /today is 20\d{2}[-/]\d{1,2}[-/]\d{1,2}/i,
      /当前年份[^。\n]*20\d{2}/,
      /当前日期[^。\n]*20\d{2}/,
      /今天是[^。\n]*20\d{2}/,
      /今年是[^。\n]*20\d{2}/,
    ];
    const violations = [];

    for (const root of SOURCE_ROOTS) {
      for (const file of walkPromptFiles(path.join(REPO_ROOT, root))) {
        const relativePath = path.relative(REPO_ROOT, file);
        const content = read(file);
        bannedPatterns.forEach((pattern) => {
          if (pattern.test(content)) {
            violations.push(`${relativePath} matches ${pattern}`);
          }
        });
      }
    }

    expect(violations).toEqual([]);
  });
});
