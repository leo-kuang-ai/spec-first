'use strict';

const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.join(__dirname, '..', '..');
const SKILLS_DIR = path.join(REPO_ROOT, 'skills');
const GOVERNANCE_PATH = path.join(
  REPO_ROOT,
  'src/cli/contracts/dual-host-governance/skills-governance.json',
);
// DELIVERED_INTERNAL_SKILLS 镜像(src/cli/plugin.js)。internal_only 默认 skip,只有列入此集才会交付到 runtime。
const DELIVERED_INTERNAL_SKILLS = new Set(['spec-worktree']);
// Host-provided skills:由宿主/插件生态提供,spec-first 不负责交付到 runtime。
// 公开 workflow 可委托它们,但 prose 必须声明"宿主提供,缺失则降级"。
// 这是 Light-contract 形式的 source→runtime helper 可解析性治理(report 批次 C #3)。
const HOST_PROVIDED_SKILLS = new Set([
  'spec-commit',
  'spec-commit-push-pr',
  'spec-proof',
]);

function walkSkillDocs(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkSkillDocs(full));
    } else if (entry.name.endsWith('.md')) {
      out.push(full);
    }
  }
  return out;
}

function loadGovernanceSkillNames() {
  const governance = JSON.parse(fs.readFileSync(GOVERNANCE_PATH, 'utf8'));
  const byName = new Map();
  for (const record of governance.skills) {
    byName.set(record.skill_name, record);
  }
  return byName;
}

// 收集 skill 文档里对其它 skill 的「加载/调用」委托引用及其出处。
// 要求 skill 名带反引号(项目的委托书写约定),可选前置形容词(如 "the standalone `X` skill"),
// 以排除散文/标题误捕获;同时覆盖 load/invoke/use/run 多种动词,避免只认单一写法时漏扫真实委托。
function collectSkillLoadDelegations() {
  const pattern = /\b(?:load|invoke|use|run) the (?:[a-z]+ )?`([a-z][a-z0-9-]+)` skill\b/gi;
  const delegations = [];
  for (const file of walkSkillDocs(SKILLS_DIR)) {
    const content = fs.readFileSync(file, 'utf8');
    let match;
    while ((match = pattern.exec(content)) !== null) {
      delegations.push({
        skill: match[1],
        file: path.relative(REPO_ROOT, file),
      });
    }
  }
  return delegations;
}

function isRuntimeResolvable(skillName, governanceByName) {
  const record = governanceByName.get(skillName);
  if (!record) return false;
  if (record.entry_surface !== 'internal_only') return true; // command/standalone 都会交付
  return DELIVERED_INTERNAL_SKILLS.has(skillName);
}

describe('source→runtime helper resolvability (workflow skill delegations)', () => {
  // 范围边界:本 verifier 只治理「load/invoke/use/run the `X` skill」式 runtime skill-loading 委托。
  // 不覆盖 slash-command 风格的历史内部 skill 互调。
  // 调用同族 skill);该族 skill 两端都 internal_only+skipped、自成一对,不经 runtime skill-loading 解析。
  test('every "Load the X skill" delegation is runtime-delivered or registered host-provided', () => {
    const governanceByName = loadGovernanceSkillNames();
    const delegations = collectSkillLoadDelegations();
    expect(delegations.length).toBeGreaterThan(0); // 守卫:正则若失效不能空过

    const unresolvable = delegations.filter(
      (d) => !isRuntimeResolvable(d.skill, governanceByName) && !HOST_PROVIDED_SKILLS.has(d.skill),
    );

    // 任何既不交付到 runtime、又未登记为 host-provided 的委托,都是会在运行时断裂的多真相源。
    expect(unresolvable.map((d) => `${d.skill} @ ${d.file}`)).toEqual([]);
  });

  test('host-provided allowlist has no stale entries (must be referenced and genuinely not runtime-delivered)', () => {
    const governanceByName = loadGovernanceSkillNames();
    const delegatedSkills = new Set(collectSkillLoadDelegations().map((d) => d.skill));

    for (const skillName of HOST_PROVIDED_SKILLS) {
      // host-provided 条目必须真的被某处委托引用,否则是空挂条目
      expect(delegatedSkills.has(skillName)).toBe(true);
      // 若该 skill 其实会交付到 runtime,就不该标 host-provided(避免错误降级提示)
      expect(isRuntimeResolvable(skillName, governanceByName)).toBe(false);
    }
  });
});
