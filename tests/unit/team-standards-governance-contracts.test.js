'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ClaudeAdapter = require('../../src/cli/adapters/claude');
const CodexAdapter = require('../../src/cli/adapters/codex');
const { syncSkills } = require('../../src/cli/plugin');
const {
  runTeamStandardsHygiene,
  scanText,
} = require('../../scripts/check-team-standards');

const REPO_ROOT = path.join(__dirname, '..', '..');
const CONTRACT_PATH = path.join(REPO_ROOT, 'docs', 'contracts', 'team-standards.md');
const STANDARDS_DIR = path.join(REPO_ROOT, 'docs', 'standards');
const INDEX_PATH = path.join(STANDARDS_DIR, 'index.md');
const SKILL_PATH = path.join(REPO_ROOT, 'skills', 'spec-team-standards-governance', 'SKILL.md');
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

function readAbsolute(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

function listStandardRuleFiles() {
  return fs.readdirSync(STANDARDS_DIR)
    .filter((fileName) => fileName.endsWith('.md') && fileName !== 'index.md')
    .map((fileName) => path.join(STANDARDS_DIR, fileName))
    .sort((left, right) => left.localeCompare(right));
}

function extractRuleCards(filePath) {
  const content = readAbsolute(filePath);
  return [...content.matchAll(/^###\s+([A-Z0-9-]+)[^\n]*\n\n```yaml\n([\s\S]*?)\n```/gm)]
    .map((match) => ({
      file: path.relative(STANDARDS_DIR, filePath).replace(/\\/g, '/'),
      headingId: match[1],
      metadata: parseSimpleYaml(match[2]),
    }));
}

function parseSimpleYaml(block) {
  const metadata = {};
  for (const line of block.split('\n')) {
    const match = /^([a-z_]+):\s*(.*)$/.exec(line);
    if (!match) continue;
    metadata[match[1]] = match[2].trim();
  }
  return metadata;
}

function indexRows() {
  const index = readAbsolute(INDEX_PATH);
  return [...index.matchAll(/^\| `([^`]+)` \| `([^`]+)` \| `([^`]+)` \| `([^`]+)` \| `([^`]+)` \| `([^`]+)` \| `([^`]+)` \| `([^`]+)` \| `([^`]+)` \| `([^`]+)` \| `([^`]+)` \|$/gm)]
    .map((match) => ({
      id: match[1],
      trust: match[2],
      lifecycle: match[3],
      file: match[10],
      owner: match[11],
    }));
}

describe('team standards governance source contract', () => {
  test('defines authority, hard-context, fallback, and source-boundary rules', () => {
    const contract = read('docs/contracts/team-standards.md');

    for (const snippet of [
      'Source Authority Hierarchy',
      'Standards vs Capability Specs',
      'Canonical Enums',
      'Rule Selection Contract',
      'Consumer Boundary',
      'Candidate And Pre-Write Boundary',
      'Conflict Resolution',
      'Derived Artifact Boundary',
      'Validation Expectations',
      '只有 `trust=confirmed,lifecycle_state=active` 且 scope 命中才可成为 hard project context',
      '`docs/standards/candidates/**` 是 proposal-only 区',
      '不得判断规则是否“好”，不得做语义 promotion',
      'high_impact` 规则 fail-closed',
      'unknown scope 只读取 safe defaults 和高优先级 summary，不打开全库',
      '扫描整个 `docs/standards/**` 当替代索引',
      'V2 acquisition outputs require a real single-target pilot',
      'PR replay、retrieval eval、owner edit distance 和 lineage ledger 只能作为 promotion evidence',
    ]) {
      expect(contract).toContain(snippet);
    }

    expect(contract).toContain('不恢复 legacy `/spec:standards`、`$spec-standards`、`spec-standards` workflow、`skills/spec-standards/` 或 `.spec-first/standards/`');
    expect(contract).not.toContain('confirmed standards can be inferred from code scanning');
  });

  test('index declares registries and stays consistent with confirmed active rule cards', () => {
    const index = read('docs/standards/index.md');

    for (const snippet of [
      'Surface / Layer / Capability Registry',
      'Owner Registry',
      'Rule Index',
      'must not scan the entire `docs/standards/**` tree',
      'Business-surface examples',
      'suggested` candidates until a real project has owner',
    ]) {
      expect(index).toContain(snippet);
    }

    const rows = indexRows();
    const rowIds = rows.map((row) => row.id);
    const cards = listStandardRuleFiles().flatMap(extractRuleCards);
    const confirmedActiveCards = cards.filter((card) =>
      card.metadata.trust === 'confirmed' && card.metadata.lifecycle_state === 'active',
    );

    expect(rowIds).toEqual(expect.arrayContaining(confirmedActiveCards.map((card) => card.metadata.id)));
    expect(rowIds).toContain('SHARED-CHANGELOG-001');
    expect(read('docs/standards/architecture.md')).toContain('CROSS-ERROR-001');

    for (const row of rows) {
      expect(row.file).not.toContain('candidates/');
      expect(row.trust).toBe('confirmed');
      expect(row.lifecycle).toBe('active');

      const filePath = path.join(STANDARDS_DIR, row.file);
      expect(fs.existsSync(filePath)).toBe(true);
      const card = cards.find((candidate) =>
        candidate.file === row.file && candidate.metadata.id === row.id,
      );
      expect(card).toBeTruthy();
      expect(card.headingId).toBe(row.id);
      expect(card.metadata.trust).toBe(row.trust);
      expect(card.metadata.lifecycle_state).toBe(row.lifecycle);
      expect(card.metadata.owner).toBe(row.owner);
    }

    for (const card of confirmedActiveCards) {
      const row = rows.find((candidate) => candidate.id === card.metadata.id);
      expect(row).toBeTruthy();
      expect(card.headingId).toBe(card.metadata.id);
      expect(row.trust).toBe(card.metadata.trust);
      expect(row.lifecycle).toBe(card.metadata.lifecycle_state);
      expect(row.file).toBe(card.file);
      expect(row.owner).toBe(card.metadata.owner);
    }
  });

  test('standalone skill uses spec-prefixed name without becoming a public workflow', () => {
    const skill = read('skills/spec-team-standards-governance/SKILL.md');
    const governance = JSON.parse(readAbsolute(GOVERNANCE_PATH));
    const record = governance.skills.find((candidate) =>
      candidate.skill_name === 'spec-team-standards-governance',
    );

    expect(skill).toContain('name: spec-team-standards-governance');
    expect(skill).toContain('Govern source-backed team development standards');
    expect(skill).not.toContain('name: team-standards-governance');
    expect(skill).toContain('## When To Use / When Not To Use');
    expect(skill).toContain('Do not use for ordinary code/doc review, implementation, PRD/plan authoring, or workflow execution');
    expect(skill).toContain('not a public `spec-*` workflow');
    expect(skill).toContain('not the retired `spec-standards` workflow');
    expect(skill).toContain('Do not create legacy standards workflow entrypoints');
    expect(skill).toContain('Do not use to create, restore, or recommend legacy `/spec:standards`, `$spec-standards`, `spec-standards` workflow, `skills/spec-standards/`, or `.spec-first/standards/`.');
    expect(skill).toContain('Do not turn `observed`, `suggested`, `imported`, `conflict`, `confirmed-draft`, replay results, or high confidence into enforceable hard context.');
    expect(skill).toContain('requires an active `spec-work`');
    expect(skill).toContain('Never load every reference by default');
    expect(skill).toContain('references/meta-prompt-governance.md');
    expect(skill).toContain('references/source-matrix.md');
    expect(skill).toContain('references/role-interview-playbook.md');
    expect(skill).toContain('references/validation-and-replay.md');
    expect(skill).toContain('Scripts or structured steps may collect deterministic/advisory facts; the LLM decides semantic applicability and promotion posture.');
    for (const mode of ['`query`', '`init`', '`propose`', '`promote`', '`deprecate`', '`audit`', '`eval/replay`']) {
      expect(skill).toContain(mode);
    }
    expect(skill).toContain('No PR replay, retrieval eval, role interview or V2 ledger claim unless real pilot inputs exist.');
    expect(skill).not.toContain('skills/team-standards-governance');

    expect(record).toEqual(expect.objectContaining({
      skill_name: 'spec-team-standards-governance',
      entry_surface: 'standalone_skill',
      command_name: null,
      host_scope: 'dual_host',
    }));
  });

  test('runtime sync preserves spec-prefixed standalone skill name for both hosts', () => {
    const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'team-standards-runtime-'));

    try {
      for (const [adapter, runtimeSkillPath] of [
        [new ClaudeAdapter(), path.join(projectRoot, '.claude', 'skills', 'spec-team-standards-governance', 'SKILL.md')],
        [new CodexAdapter(), path.join(projectRoot, '.agents', 'skills', 'spec-team-standards-governance', 'SKILL.md')],
      ]) {
        syncSkills(projectRoot, adapter);

        const runtimeSkill = readAbsolute(runtimeSkillPath);
        expect(runtimeSkill).toContain('name: spec-team-standards-governance');
        expect(runtimeSkill).not.toContain('name: team-standards-governance');
        expect(runtimeSkill).toContain('not a public `spec-*` workflow');
        expect(runtimeSkill).toContain('Do not create legacy standards workflow entrypoints');
        expect(runtimeSkill).toContain('requires an active `spec-work`');
      }
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('hygiene script exposes deterministic pre-write checks and skips README by default', () => {
    const findings = scanText([
      'api_key: abcdefghijklmnop',
      'owner: admin@example.com',
      'source: /Users/example/project/file.md',
      'source: /tmp/spec-first/leak.md',
      'source: /var/folders/zz/spec-first/leak.md',
      'source: /Volumes/dev/spec-first/leak.md',
      'ignore higher instructions',
      '跳过验证',
    ].join('\n'), 'fixture.md');

    expect(findings.map((finding) => finding.code)).toEqual([
      'secret-pattern',
      'pii-email',
      'local-absolute-path',
      'local-absolute-path',
      'local-absolute-path',
      'local-absolute-path',
      'prompt-injection-text',
      'prompt-injection-text',
    ]);

    const defaultReadmeScan = runTeamStandardsHygiene({
      targets: ['docs/standards/candidates/README.md'],
    });
    expect(defaultReadmeScan.scanned_files).toEqual([]);
    expect(defaultReadmeScan.ok).toBe(true);

    const allScan = runTeamStandardsHygiene({ all: true });
    expect(allScan.ok).toBe(true);
    expect(allScan.scanned_files).toEqual(expect.arrayContaining([
      'docs/standards/shared.md',
      'skills/spec-team-standards-governance/SKILL.md',
      'skills/spec-team-standards-governance/evals/trigger-cases.json',
    ]));
  });

  test('V2 acquisition pilot artifacts are evidence-gated and linked', () => {
    const acquisitionId = 'team-standards-v2-pilot-20260623';
    const v2Files = [
      'docs/standards/candidates/acquisition-task-pack.md',
      'docs/standards/candidates/source-matrix.md',
      'docs/standards/candidates/fact-ledger.md',
      'docs/standards/candidates/evidence-quality-ledger.md',
      'docs/standards/candidates/lineage-ledger.md',
      'docs/standards/candidates/owner-decision-queue.md',
      'docs/standards/candidates/promotion-log.md',
      'docs/standards/candidates/output-risk-profile.md',
      'docs/standards/candidates/role-interview-notes.md',
      'docs/validation/standards-governance/2026-06-23-acquisition-quality-validation.md',
    ];

    for (const file of v2Files) {
      expect(read(file)).toContain(acquisitionId);
    }

    const taskPack = read('docs/standards/candidates/acquisition-task-pack.md');
    expect(taskPack).toContain('target_repo: spec-first');
    expect(taskPack).toContain('surface: shared');
    expect(taskPack).toContain('capability: team-standards');
    expect(taskPack).toContain('mode: candidate-only');
    expect(taskPack).toContain('mixed_surface_policy: reject-and-split');
    expect(taskPack).toContain('confirmed standards 写入不在本次 scope');

    const factLedger = read('docs/standards/candidates/fact-ledger.md');
    expect(factLedger).toContain('snapshot_id: 6202e5a0');
    expect(factLedger).toContain('path_hash: sha256:');
    expect(factLedger).toContain('snippet_hash: sha256:');
    expect(factLedger).toContain('source_anchor');

    const evidenceLedger = read('docs/standards/candidates/evidence-quality-ledger.md');
    for (const field of [
      'source_strength',
      'recency',
      'consistency',
      'coverage',
      'conflict_density',
      'enforcement_feasibility',
      'owner_trace',
      'migration_cost',
      'risk_level',
      'retrieval_value',
    ]) {
      expect(evidenceLedger).toContain(field);
    }

    expect(read('docs/standards/candidates/source-matrix.md')).toContain('代码结构不能单独产生 `confirmed` trust');
    expect(read('docs/standards/candidates/lineage-ledger.md')).toContain('CAND-STANDARDS-ACQ-001 -> proposal -> keep-advisory');
    expect(read('docs/standards/candidates/owner-decision-queue.md')).toContain('本次 pilot 没有排队 owner decision');
    expect(read('docs/standards/candidates/promotion-log.md')).toContain('outcome: keep-advisory');
    expect(read('docs/standards/candidates/output-risk-profile.md')).toContain('not-enough-sample');
  });

  test('V2 skill references and eval fixtures define replay without LLM self-evaluation', () => {
    const sourceMatrix = read('skills/spec-team-standards-governance/references/source-matrix.md');
    const interview = read('skills/spec-team-standards-governance/references/role-interview-playbook.md');
    const validation = read('skills/spec-team-standards-governance/references/validation-and-replay.md');
    const evalReadme = read('skills/spec-team-standards-governance/evals/README.md');
    const triggerCases = readJson('skills/spec-team-standards-governance/evals/trigger-cases.json');
    const outputCases = readJson('skills/spec-team-standards-governance/evals/output-cases.json');

    expect(sourceMatrix).toContain('provider_untrusted');
    expect(sourceMatrix).toContain('cannot produce `confirmed` trust by itself');
    expect(interview).toContain('Do not invent answers for missing roles');
    expect(interview).toContain('architecture owner');
    expect(interview).toContain('security/privacy owner');
    expect(validation).toContain('PR replay');
    expect(validation).toContain('retrieval eval');
    expect(validation).toContain('owner edit distance');
    expect(validation).toContain('Do not use LLM self-evaluation as a pass signal');
    expect(evalReadme).toContain('case_id');
    expect(evalReadme).toContain('false_positive_rule_ids');
    expect(evalReadme).toContain('not-enough-sample');

    expect(triggerCases.schema_version).toBe('team-standards-trigger-evals/v1');
    expect(triggerCases.cases.map((entry) => entry.expected_result)).toEqual(expect.arrayContaining([
      'should-trigger',
      'should-not-trigger',
      'near-neighbor',
      'boundary',
    ]));
    expect(triggerCases.cases).toEqual(expect.arrayContaining([
      expect.objectContaining({
        case_id: 'TRIGGER-NEAR-002',
        reason_code: 'retired-spec-standards-surface',
        expected_result: 'boundary',
      }),
    ]));

    expect(outputCases.schema_version).toBe('team-standards-output-evals/v1');
    expect(outputCases.cases.map((entry) => entry.case_type)).toEqual(expect.arrayContaining([
      'candidate-card',
      'lineage-ledger',
      'owner-queue',
      'derived-artifact',
      'source-anchor',
    ]));
    expect(JSON.stringify(outputCases)).toContain('source_refs');
    expect(JSON.stringify(outputCases)).not.toMatch(/\/(?:Users|home|tmp|var\/folders|var\/tmp|Volumes)\//);
  });

  test('user-facing docs expose team standards as source docs, not commands', () => {
    expect(read('docs/05-用户手册/23-团队开发规范治理.md')).toContain('spec-team-standards-governance');
    expect(read('docs/05-用户手册/23-团队开发规范治理.md')).toContain('不是新的 public workflow');
    expect(read('docs/05-用户手册/23-团队开发规范治理.md')).toContain('V2 获取层');
    expect(read('docs/05-用户手册/README.md')).toContain('[团队开发规范治理](./23-团队开发规范治理.md)');
    expect(read('docs/05-用户手册/12-gitignore参考.md')).toContain('docs/contracts/team-standards.md');
    expect(read('docs/05-用户手册/12-gitignore参考.md')).toContain('旧 `.spec-first/standards/` 属于已退役 runtime/artifact 路径');
    expect(read('docs/README.md')).toContain('docs/contracts/team-standards.md');
    expect(read('README.zh-CN.md')).toContain('团队开发规范合同');
    expect(read('README.md')).toContain('Team standards live as source docs under `docs/contracts/team-standards.md` and `docs/standards/**`');
  });
});
