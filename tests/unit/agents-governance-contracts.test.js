'use strict';

const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.join(__dirname, '..', '..');
const AGENTS_DIR = path.join(REPO_ROOT, 'agents');
const GOVERNANCE_PATH = path.join(
  REPO_ROOT,
  'src/cli/contracts/dual-host-governance/agents-governance.json',
);
const GOVERNANCE_SCHEMA_PATH = path.join(
  REPO_ROOT,
  'src/cli/contracts/dual-host-governance/agents-governance.schema.json',
);
const { validateAgainstSchema } = require('../../src/contracts/schema-validator');
// orphan-detection 扫描的引用来源:agent 被这些 source 区域里任意文件以名称引用即视为"有 consumer"。
// 引用本身就是事实源——不复制每个 agent 的调度元数据,符合 Light contract。
const REFERENCE_ROOTS = ['skills', 'templates', 'src/cli'];

function listAgentNames() {
  return fs
    .readdirSync(AGENTS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.agent.md'))
    .map((entry) => entry.name.replace(/\.agent\.md$/, ''))
    .sort((a, b) => a.localeCompare(b));
}

function walkTextFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkTextFiles(full));
    } else if (/\.(md|js|json|sh|txt)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

function buildReferenceCorpus() {
  let corpus = '';
  for (const root of REFERENCE_ROOTS) {
    const abs = path.join(REPO_ROOT, root);
    if (!fs.existsSync(abs)) continue;
    for (const file of walkTextFiles(abs)) {
      // 排除治理文件自身,否则 allowlist 条目会自我匹配,使孤儿伪装成"有 consumer"。
      if (path.resolve(file) === path.resolve(GOVERNANCE_PATH)) continue;
      corpus += fs.readFileSync(file, 'utf8');
      corpus += '\n';
    }
  }
  return corpus;
}

function loadGovernance() {
  return JSON.parse(fs.readFileSync(GOVERNANCE_PATH, 'utf8'));
}

describe('agents governance (orphan detection)', () => {
  test('governance file conforms to its schema', () => {
    // 让 schema 成为形态真相源(而非装饰性死文档):直接用 validateAgainstSchema 校验数据,
    // 不再手抄字段断言,避免 schema 与手工检查漂移。
    const schema = JSON.parse(fs.readFileSync(GOVERNANCE_SCHEMA_PATH, 'utf8'));
    const data = loadGovernance();
    const result = validateAgainstSchema(schema, data);
    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(true);
  });

  test('every bundled agent is either referenced by source or registered as standalone', () => {
    const agentNames = listAgentNames();
    expect(agentNames.length).toBeGreaterThan(0); // 守卫:agent 目录重构致空列表时不能静默 PASS
    const corpus = buildReferenceCorpus();
    const allowlist = new Set(
      loadGovernance().standalone_agents.map((record) => record.agent_name),
    );

    const orphans = agentNames.filter(
      (name) => !corpus.includes(name) && !allowlist.has(name),
    );

    expect(orphans).toEqual([]);
  });

  test('standalone allowlist has no stale entries (entry must be a real agent and a genuine orphan)', () => {
    const agentNames = new Set(listAgentNames());
    const corpus = buildReferenceCorpus();
    const governance = loadGovernance();

    for (const record of governance.standalone_agents) {
      // allowlist 条目必须对应真实存在的 agent
      expect(agentNames.has(record.agent_name)).toBe(true);
      // allowlist 仅用于真正无 source 引用的孤儿;若它已被引用,应从 allowlist 移除,避免空挂条目
      expect(corpus.includes(record.agent_name)).toBe(false);
    }
  });

  test('bundled agent instructions use unified spec-* workflow entrypoints', () => {
    for (const entry of fs.readdirSync(AGENTS_DIR, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith('.agent.md')) continue;
      const content = fs.readFileSync(path.join(AGENTS_DIR, entry.name), 'utf8');
      expect(content).not.toMatch(/\/spec:[a-z-]+|\$spec-[a-z-]+/);
    }
  });
});
