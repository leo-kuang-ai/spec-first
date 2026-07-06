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
    expect(skill).toContain('`docs/ai/project-rules.md` 是默认 canonical full rules');
    expect(skill).toContain('<=1000 words');
    expect(skill).toContain('## Purpose');
    expect(skill).toContain('## When To Use');
    expect(skill).toContain('## When Not To Use');
    expect(skill).toContain('## Inputs');
    expect(skill).toContain('## Outputs');
    expect(skill).toContain('## Workflow');
    expect(skill).toContain('## Failure Modes');
    expect(skill).toContain('近邻路由');
    expect(skill).toContain('`spec-team-standards-governance`');
    expect(skill).toContain('不要修改业务源码');
    expect(skill).toContain("Host-projected copies are outside this skill's rule targets");
    expect(skill).toContain('[Pattern Categories](references/pattern-categories.md)');
    expect(skill).toContain('[Write Targets](references/write-targets.md)');
    expect(skill).toContain('spec-rule-miner-start');
    expect(skill).toContain('headless_default_write');
    expect(skill).toContain('普通聊天里用户暂未回复不能算 headless');
    expect(skill).toContain('evidence_summary');
    expect(skill).toContain('refresh_noop');
    expect(skill).toContain('先重新取证并生成 candidate rules block');
    expect(skill).toContain('大仓库可按其中 capability-class 边界使用 `code-graph` / `project-graph` 候选');

    expect(patternCategories).toContain('Hidden Associations');
    expect(patternCategories).toContain('Anti-Patterns');
    expect(patternCategories).toContain('函数与代码体风格');
    expect(patternCategories).toContain('大仓库');
    expect(patternCategories).toContain('混合语言');
    expect(patternCategories).toContain('多包/monorepo/workspace');
    expect(patternCategories).toContain('先识别包级边界');
    expect(patternCategories).toContain('改具体子项目先跟随本包现有结构');
    expect(patternCategories).toContain('不要把主模式写成全仓库事实或绝对禁令');
    expect(patternCategories).toContain('除非证据在目标适用范围内压倒性一致');
    expect(patternCategories).toContain('## 大仓候选导航');
    expect(patternCategories).toContain('`code-graph` / `project-graph` capability-class 输出作为 `provider_untrusted` 候选导航');
    expect(patternCategories).toContain('候选只回答“先看哪里”');
    expect(patternCategories).toContain('不能证明规则、频率、80% 一致性');
    expect(patternCategories).toContain('不要读取完整 raw graph artifact，例如 `graph.json`');
    expect(patternCategories).toContain('不要阻塞规则挖掘');

    expect(skill).toContain('大仓库或多包仓库使用分层抽样');
    expect(skill).toContain('多包规则必须区分跨包通用模式、包级专属模式和历史例外');
    expect(skill).toContain('规则正文可以包含适用范围和例外边界');
    expect(skill).toContain('改具体子项目先跟随本包现有结构');
    expect(skill).toContain('不要写成“全仓库统一/只/永远/不得”的绝对事实');

    expect(writeTargets).toContain('canonical full rules');
    expect(writeTargets).toContain('`docs/ai/project-rules.md`：写完整规则块');
    expect(writeTargets).toContain('`AGENTS.md`：默认写 pointer 到 `docs/ai/project-rules.md`');
    expect(writeTargets).toContain('`CLAUDE.md`：默认写 pointer 到 `docs/ai/project-rules.md`');
    expect(writeTargets).toContain('不把完整规则写进入口文件');
    expect(writeTargets).toContain('CLAUDE.md');
    expect(writeTargets).toContain('.cursor/rules/project-rules.mdc');
    expect(writeTargets).toContain('markers');
    expect(writeTargets).toContain('legacy `rule-miner-start` / `rule-miner-end` markers');
    expect(writeTargets).toContain('legacy marker migration');
    expect(writeTargets).toContain('非首次 refresh');
    expect(writeTargets).toContain('candidate 与当前 canonical block 无实质变化且 pointer 已正确时，不写任何文件');
    expect(writeTargets).toContain('preview 展示规则差异和受影响目标');
    expect(writeTargets).toContain('不因排序、更新时间、同义措辞或 pointer 已正确而重写无变化文件');
    expect(writeTargets).toContain('frontmatter 必须保持文件第一段');
    expect(writeTargets).toContain('禁止目标');
    expect(writeTargets).toContain('非当前 spec-first 支持的编程工具或 legacy 规则文件不作为写入目标');
    expect(writeTargets).toContain('Kiro 当前通过根目录 `AGENTS.md` 和 skill delivery 消费规则');
    expect(writeTargets).not.toContain('GitHub Copilot |');
    expect(writeTargets).not.toContain('Trae |');
    expect(writeTargets).not.toContain('Copilot inline');
    expect(writeTargets).not.toContain('| Kiro | `.kiro/steering/project-rules.md`');
    expect(writeTargets).not.toContain('Legacy Cursor');
    expect(writeTargets).not.toContain('`.cursorrules` 为纯文本');
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
      'refresh-noop',
      'use-provider-candidates-as-navigation-only',
      'do-not-generate-empty-rules',
    ]));
    const casesById = new Map(cases.cases.map((entry) => [entry.id, entry]));
    const refreshNoop = casesById.get('refresh-noop-idempotence');
    expect(refreshNoop).toMatchObject({
      case_type: 'expected',
      expected_result: 'refresh-noop',
      expected_mode: 'compare-candidate-to-canonical-block-and-write-nothing',
      reason_code: 'refresh-noop-idempotence',
    });
    expect(refreshNoop.coverage_tags).toEqual(expect.arrayContaining([
      'write-safety',
      'refresh',
      'idempotence',
    ]));
    expect(refreshNoop.required_signals).toEqual(expect.arrayContaining([
      'generate candidate rules before deciding',
      'compare with canonical marked block',
      'record refresh_noop',
      'preserve existing pointers',
    ]));
    expect(refreshNoop.forbidden_signals).toEqual(expect.arrayContaining([
      'exit only because project-rules.md exists',
      'rewrite timestamp-only changes',
      'rewrite AGENTS.md when pointer is already correct',
      'skip evidence summary',
    ]));

    const largeRepoGraph = casesById.get('large-repo-graph-candidate-boundary');
    expect(largeRepoGraph).toMatchObject({
      case_type: 'expected',
      expected_result: 'use-provider-candidates-as-navigation-only',
      expected_mode: 'provider-untrusted-candidates-then-source-confirmation',
      reason_code: 'large-repo-provider-candidate-boundary',
    });
    expect(largeRepoGraph.coverage_tags).toEqual(expect.arrayContaining([
      'expected',
      'scope',
      'large-repo',
      'capability-class',
      'provider-boundary',
    ]));
    expect(largeRepoGraph.required_signals).toEqual(expect.arrayContaining([
      'provider_untrusted',
      'source confirmation before rule text',
      'fallback to bounded source reads',
      'record accepted and rejected candidates',
    ]));
    expect(largeRepoGraph.forbidden_signals).toEqual(expect.arrayContaining([
      'cite graph edge as rule evidence',
      'treat provider candidate as confirmed frequency',
      'refresh or rebuild the graph from this skill',
      'cat graph.json',
    ]));

    const noAnalyzableSource = casesById.get('no-analyzable-source-failure');
    expect(noAnalyzableSource).toMatchObject({
      case_type: 'failure',
      expected_result: 'do-not-generate-empty-rules',
      expected_mode: 'stop-with-limitations',
      reason_code: 'no-analyzable-source',
    });
    expect(noAnalyzableSource.coverage_tags).toEqual(expect.arrayContaining([
      'failure',
      'source-evidence',
    ]));
    expect(noAnalyzableSource.required_signals).toEqual(expect.arrayContaining([
      'no analyzable source',
      'do not generate empty rules',
      'limitations',
    ]));
    expect(noAnalyzableSource.forbidden_signals).toEqual(expect.arrayContaining([
      'write generic best practices',
      'infer rules from generated code',
      'create empty project-rules.md',
    ]));

    expect(JSON.stringify(cases)).toContain('project-rule-mining');
    expect(JSON.stringify(cases)).toContain('standards-governance-not-rule-mining');
    expect(JSON.stringify(cases)).toContain('review-not-rule-mining');
    expect(JSON.stringify(cases)).toContain('generated-runtime-not-rule-target');
    expect(JSON.stringify(cases)).toContain('headless-default-write-requires-evidence');
    expect(JSON.stringify(cases)).toContain('legacy-marker-migration');
    expect(JSON.stringify(cases)).toContain('leave full rules in AGENTS.md');
    expect(JSON.stringify(cases)).toContain('unsupported-tool-rule-file');
    expect(JSON.stringify(cases)).toContain('unsupported-legacy-cursorrules');
    expect(JSON.stringify(cases)).toContain('unsupported-kiro-steering');
    expect(JSON.stringify(cases)).toContain('multi-package-scope-boundary');
    expect(JSON.stringify(cases)).toContain('scoped-rules-with-limitations');
    expect(JSON.stringify(cases)).toContain('write workspace-wide absolute rule');
    expect(JSON.stringify(cases)).toContain('omit package-level scope');
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
