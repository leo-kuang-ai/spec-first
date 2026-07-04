'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { buildManagedBlock } = require('../../src/cli/lang-policy');
const { getAdapter } = require('../../src/cli/adapters');
const {
  BOOTSTRAP_END,
  BOOTSTRAP_START,
  applyManagedBootstrapBlock,
  buildBootstrapBlock,
  inspectInstructionBootstrap,
  removeManagedBootstrapBlock,
  writeInstructionBootstrap,
} = require('../../src/cli/instruction-bootstrap');

const REPO_ROOT = path.join(__dirname, '..', '..');

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-bootstrap-'));
}

function managedBootstrapBlock(content) {
  const start = content.indexOf(BOOTSTRAP_START);
  const end = content.indexOf(BOOTSTRAP_END);

  expect(start).not.toBe(-1);
  expect(end).toBeGreaterThan(start);

  return content.slice(start, end + BOOTSTRAP_END.length);
}

describe('instruction bootstrap', () => {
  test('writes the managed block into an empty instruction file', () => {
    const block = buildBootstrapBlock('claude', 'zh');

    expect(applyManagedBootstrapBlock('', block)).toBe(block);
  });

  test('is idempotent and coexists with the language block in stable order', () => {
    const existing = buildManagedBlock('zh');
    const block = buildBootstrapBlock('claude', 'zh');
    const once = applyManagedBootstrapBlock(existing, block);
    const twice = applyManagedBootstrapBlock(once, block);

    expect(twice).toBe(once);
    expect(twice.indexOf('<!-- spec-first:lang:start -->')).toBeLessThan(twice.indexOf(BOOTSTRAP_START));
    expect(twice.match(/<!-- spec-first:bootstrap:start -->/g)).toHaveLength(1);
    expect(twice).toContain('## Workflow 入口治理');
    expect(twice).not.toContain('## Workflow 入口治理（由 spec-first 管理）');
    expect(twice).toContain('Claude workflow 入口使用 `spec-*` project commands');
    // 抗膨胀上界断言(替代旧的 toHaveLength(12) 精确行数断言):
    // body 是核心决策集,行数随内容增长,但需有上界防膨胀。
    expect(block.split('\n').length).toBeGreaterThan(8);
    expect(block.split('\n').length).toBeLessThan(26);
    // 核心决策集四段在场(替代旧 thin-router 措辞断言):
    expect(twice).toContain('最小入口锚点');
    expect(twice).toContain('何时进入 workflow');
    expect(twice).toContain('何时直接做');
    expect(twice).toContain('如何路由');
    expect(twice).toContain('常见入口锚点');
    expect(twice).toContain('外部 issue/PR 输入');
    expect(twice).toContain('issue/PR 是 input surface,不是独立 workflow');
    expect(twice).toContain('不得为外部 issue/PR 新增专用 public workflow 入口');
    expect(twice).toContain('也不得把 reporter 命令当 confirmed truth');
    expect(twice).toContain('反合理化红旗');
    expect(twice).toContain('完整路由表仍在 `skills/using-spec-first/SKILL.md`,边界细节和例外见其 registered `references/*.md`');
    expect(twice).toContain('substantial work');
    expect(twice).toContain('不默认进入 `spec-brainstorm`');
    expect(twice).toContain('不自动串联多个 workflow');
    expect(twice).toContain('当前上下文解释');
    expect(twice).toContain('当前对话/用户给定单文档整理');
    expect(twice).toContain('用户可见输出语言以本文件的 `spec-first:lang` managed block 为准');
    expect(twice).toContain('当前会话惯性不得覆盖该策略');
    expect(twice).toContain('bounded subagent');
    expect(twice).toContain('bounded direct reads');
    expect(twice).toContain('target_repo');
    expect(twice).toContain('Runtime context 默认排除 `.spec-first/audits/**`');
    expect(twice).toContain('`.spec-first/governance/**`');
    expect(twice).toContain('generated mirrors（`.claude/**`、`.codex/**`、`.agents/skills/**`、`.cursor/skills/**`、`.cursor/spec-first/**`、`.cursor/mcp.json`、`.kiro/skills/**`、`.kiro/agents/**`、`.kiro/spec-first/**`、`.kiro/settings/**`、`.qoder/commands/spec-*.md`、`.qoder/commands/spec/**`、`.qoder/skills/**`、`.qoder/agents/**`、`.qoder/spec-first/**`、`.qoder/settings.local.json`）');
    expect(twice).toContain('`.cursor/rules/**`、`.cursor/agents/**`、`.kiro/specs/**` 与 `.qoder/rules/**` 是宿主原生 advisory artifact');
    expect(twice).toContain('docs/10-prompt/结构化项目角色契约.md');
    expect(twice).toContain('scripts/tools 只产 deterministic facts');
    expect(twice).toContain('优化→`spec-optimize`');
    expect(twice).toContain('不要直接暴露 internal-only skills');
    expect(twice).not.toContain('入口映射(意图→入口)');
    expect(twice).not.toContain('过往 session 检索');
    expect(twice).not.toContain('发布说明');
    // R2 哲学守护:保留「不强制」,严禁滑向 1% 强制全拦截语义
    expect(twice).toContain('可直接回答、bounded read 或正常执行');
    expect(twice).toContain('明确单点低风险小改动');
    expect(twice).toContain('小改动仍遵守 CHANGELOG、最窄验证和 source/runtime 边界');
    expect(twice).toContain('需要工程闭环的非平凡/有风险编辑');
    expect(twice).toContain('明确小改动可直接做');
    expect(twice).not.toContain('先判断是否 work/debug/update/compound-refresh');
    expect(twice).not.toMatch(/1%|任何可能.*必须 invoke|any chance.*must invoke/i);
    expect(twice).not.toContain('startup-reminder --codex');
    expect(twice).not.toContain('$spec-update` 由用户自主决策升级');
    expect(twice).not.toContain('spec-next');
    expect(twice).not.toContain('spec-guide');
    expect(twice).not.toContain('spec-intake');
    expect(twice).not.toContain('User Next-Step Guide Mode');
    expect(twice).not.toContain('discovered child repo');
    expect(twice).not.toContain('高级路由');
  });

  test('repairs corrupted markers by removing stray lines and appending one clean block', () => {
    const corrupted = [
      '## Existing Notes',
      BOOTSTRAP_START,
      buildBootstrapBlock('claude', 'zh').replace(`${BOOTSTRAP_START}\n`, '').replace(`\n${BOOTSTRAP_END}`, ''),
    ].join('\n');

    const updated = applyManagedBootstrapBlock(corrupted, buildBootstrapBlock('codex', 'en'));

    expect(updated.match(/<!-- spec-first:bootstrap:start -->/g)).toHaveLength(1);
    expect(updated.match(/<!-- spec-first:bootstrap:end -->/g)).toHaveLength(1);
    expect(updated).toContain('## Existing Notes');
    expect(updated).toContain('## Workflow Entry Governance');
    expect(updated).not.toContain('## Workflow Entry Governance (managed by spec-first)');
    expect(updated).toContain('Codex workflow entrypoints use same-name `spec-*` Skills');
    expect(updated).toContain('minimal entry anchor');
    expect(updated).toContain('the full route map lives in `skills/using-spec-first/SKILL.md`, with boundary details and exceptions in its registered `references/*.md`');
    expect(updated).toContain('skills/using-spec-first/SKILL.md');
    expect(updated).toContain('startup-reminder --codex');
    expect(updated).toContain('must not block routing');
    expect(updated).toContain('current-context explanations');
    expect(updated).toContain('user-provided single-document summaries');
    expect(updated).toContain("User-visible output language follows this file's `spec-first:lang` managed block");
    expect(updated).toContain('conversation inertia must not override it');
    expect(updated).toContain('bounded subagents, leaf reviewers, and worker agents');
    expect(updated).toContain('Runtime context excludes `.spec-first/audits/**`');
    expect(updated).toContain('`.spec-first/governance/**`');
    expect(updated).toContain('generated mirrors (`.claude/**`, `.codex/**`, `.agents/skills/**`, `.cursor/skills/**`, `.cursor/spec-first/**`, `.cursor/mcp.json`, `.kiro/skills/**`, `.kiro/agents/**`, `.kiro/spec-first/**`, `.kiro/settings/**`, `.qoder/commands/spec-*.md`, `.qoder/commands/spec/**`, `.qoder/skills/**`, `.qoder/agents/**`, `.qoder/spec-first/**`, `.qoder/settings.local.json`)');
    expect(updated).toContain('`.cursor/rules/**`, `.cursor/agents/**`, `.kiro/specs/**`, and `.qoder/rules/**` are host-native advisory artifacts');
    expect(updated).toContain('Common entry anchors');
    expect(updated).toContain('External issue/PR inputs');
    expect(updated).toContain('issue/PR material is an input surface, not a separate workflow');
    expect(updated).toContain('do not add an external issue/PR-specific public workflow entrypoint, tracker state, label/comment mutation path, or treat reporter commands as confirmed truth');
    expect(updated).toContain('optimization→`spec-optimize`');
    expect(updated).not.toContain('priority rules, and red flags');
    expect(updated).not.toContain('Entry map (intent→entrypoint)');
    expect(updated).not.toContain('spec-intake');
    expect(updated).not.toContain('Claude workflow 入口使用 `/spec:*`');
  });

  test('repairs corrupted markers even when the stale bootstrap body was lightly edited', () => {
    const editedBody = buildBootstrapBlock('claude', 'en')
      .replace(`${BOOTSTRAP_START}\n`, '')
      .replace(`\n${BOOTSTRAP_END}`, '')
      .replace('decide whether to enter a public spec-first workflow', 'perform route checks');
    const corrupted = [
      '## Existing Notes',
      editedBody,
      BOOTSTRAP_END,
    ].join('\n');

    const updated = applyManagedBootstrapBlock(corrupted, buildBootstrapBlock('codex', 'en'));

    expect(updated).toContain('## Existing Notes');
    expect(updated).toContain('Codex workflow entrypoints use same-name `spec-*` Skills');
    expect(updated).not.toContain('perform route checks');
    expect(updated).not.toContain('Claude workflow entrypoints use `/spec:*`');
    expect(updated.match(/<!-- spec-first:bootstrap:start -->/g)).toHaveLength(1);
  });

  test('preserves a clean-heading user section when markers are corrupted', () => {
    const corrupted = [
      '# Header',
      '',
      BOOTSTRAP_START,
      '## Workflow Entry Governance',
      '',
      '- Custom workflow note.',
      '- Keep the local planning checklist.',
      '- Require owner approval before changing commands.',
      '- Do not remove this section.',
      '',
      '# Tail',
    ].join('\n');

    const updated = applyManagedBootstrapBlock(corrupted, buildBootstrapBlock('codex', 'en'));

    expect(updated).toContain('- Custom workflow note.');
    expect(updated).toContain('- Do not remove this section.');
    expect(updated).toContain('# Tail');
    expect(updated.match(/<!-- spec-first:bootstrap:start -->/g)).toHaveLength(1);
    expect(updated.match(/^## Workflow Entry Governance$/gm)).toHaveLength(2);
  });

  test('remove preserves a clean-heading user section when markers are corrupted', () => {
    const corrupted = [
      '# Header',
      '',
      BOOTSTRAP_START,
      '## Workflow Entry Governance',
      '',
      '- Custom workflow note.',
      '- Keep the local planning checklist.',
      '- Require owner approval before changing commands.',
      '- Do not remove this section.',
      '',
      '# Tail',
    ].join('\n');

    const updated = removeManagedBootstrapBlock(corrupted);

    expect(updated).toContain('- Custom workflow note.');
    expect(updated).toContain('- Do not remove this section.');
    expect(updated).toContain('# Tail');
    expect(updated).not.toContain(BOOTSTRAP_START);
    expect(updated.match(/^## Workflow Entry Governance$/gm)).toHaveLength(1);
  });

  test('clears a clean-heading generated-like body when markers are corrupted', () => {
    const corrupted = [
      '# Header',
      '',
      BOOTSTRAP_START,
      '## Workflow Entry Governance',
      '',
      '- This block is the spec-first workflow entry reminder; `using-spec-first` is a standalone meta skill, not a workflow command',
      '- Common entry anchors: environment/MCP→`spec-mcp-setup`; version/runtime check→run `spec-first update` in the terminal; execution→`spec-work`',
      '- Do not expose internal-only skills directly',
      '- CUSTOM DRIFT',
      '',
      '# Tail',
    ].join('\n');

    const updated = applyManagedBootstrapBlock(corrupted, buildBootstrapBlock('codex', 'en'));

    expect(updated).toContain('# Header');
    expect(updated).toContain('# Tail');
    expect(updated).not.toContain('CUSTOM DRIFT');
    expect(updated.match(/^## Workflow Entry Governance$/gm)).toHaveLength(1);
    expect(updated).toContain(BOOTSTRAP_END);
  });

  test('clears a markerless EXPLICIT-legacy managed section before appending (no duplicate on re-init)', () => {
    // The unambiguous "(managed by spec-first)" heading predates the marker scheme and is
    // safe to strip even without markers, because it can only be spec-first's own content.
    const legacy = [
      '# Header',
      '',
      '## Workflow Entry Governance (managed by spec-first)',
      '',
      '- This block is the spec-first workflow entry reminder; `using-spec-first` is a standalone meta skill, not a workflow command',
      '- Common entry anchors: environment/MCP→`spec-mcp-setup`; version/runtime check→run `spec-first update` in the terminal; execution→`spec-work`',
      '- Do not expose internal-only skills directly',
      '- CUSTOM DRIFT',
      '',
      '# Tail',
    ].join('\n');

    const updated = applyManagedBootstrapBlock(legacy, buildBootstrapBlock('codex', 'en'));

    expect(updated).toContain('# Header');
    expect(updated).toContain('# Tail');
    expect(updated).not.toContain('CUSTOM DRIFT');
    expect(updated).not.toContain('## Workflow Entry Governance (managed by spec-first)');
    // Only the freshly appended block's generic heading remains, and one marker pair.
    expect(updated.match(/^## Workflow Entry Governance$/gm)).toHaveLength(1);
    expect(updated.match(/<!-- spec-first:bootstrap:start -->/g)).toHaveLength(1);
  });

  test('preserves a markerless GENERIC-heading user section even when it shares anchor phrases (no data loss)', () => {
    // A user-authored section under the generic heading with >=2 incidental anchor phrases
    // and no markers. Without proof it was ever spec-first-managed, it must NOT be stripped:
    // a possible duplicate is recoverable, deleting user content is not.
    const existing = [
      '# Header',
      '',
      '## Workflow Entry Governance',
      '',
      '- We follow `using-spec-first` loosely here',
      '- Do not expose internal-only skills to contractors',
      '- Require owner approval before changing commands',
      '- IMPORTANT USER DATA do not delete',
      '',
      '# Tail',
    ].join('\n');

    const updated = applyManagedBootstrapBlock(existing, buildBootstrapBlock('codex', 'en'));

    expect(updated).toContain('- IMPORTANT USER DATA do not delete');
    expect(updated).toContain('# Tail');
    expect(updated.match(/<!-- spec-first:bootstrap:start -->/g)).toHaveLength(1);
    // Two generic headings: the preserved user section plus the freshly appended block.
    expect(updated.match(/^## Workflow Entry Governance$/gm)).toHaveLength(2);
  });

  test('preserves a markerless non-managed governance section when appending', () => {
    // Same heading text but only user content (no spec-first anchor phrases) and no
    // markers: must NOT be stripped, proving the append-path cleanup is spec-first-scoped.
    const existing = [
      '# Header',
      '',
      '## Workflow Entry Governance',
      '',
      '- Custom workflow note.',
      '- Keep the local planning checklist.',
      '- Require owner approval before changing commands.',
      '- Do not remove this section.',
      '',
      '# Tail',
    ].join('\n');

    const updated = applyManagedBootstrapBlock(existing, buildBootstrapBlock('codex', 'en'));

    expect(updated).toContain('- Custom workflow note.');
    expect(updated).toContain('- Do not remove this section.');
    expect(updated).toContain('# Tail');
    expect(updated.match(/<!-- spec-first:bootstrap:start -->/g)).toHaveLength(1);
    // Two headings: the preserved user section plus the freshly appended managed block.
    expect(updated.match(/^## Workflow Entry Governance$/gm)).toHaveLength(2);
  });

  test('removes only the managed block and preserves user content', () => {
    const content = [
      '# Header',
      '',
      buildBootstrapBlock('claude', 'zh'),
      '',
      'custom tail',
      '',
    ].join('\n');

    const updated = removeManagedBootstrapBlock(content);

    expect(updated).toContain('# Header');
    expect(updated).toContain('custom tail');
    expect(updated).not.toContain(BOOTSTRAP_START);
    expect(updated).not.toContain(BOOTSTRAP_END);
  });

  test('removeManagedBootstrapBlock clears stale managed body when markers are corrupted', () => {
    const corrupted = [
      '# Header',
      '',
      buildBootstrapBlock('claude', 'en')
        .replace('## Workflow Entry Governance', '## Workflow Entry Governance (managed by spec-first)')
        .replace(`${BOOTSTRAP_START}\n`, ''),
      '',
      'custom tail',
    ].join('\n');

    const updated = removeManagedBootstrapBlock(corrupted);

    expect(updated).toContain('# Header');
    expect(updated).toContain('custom tail');
    expect(updated).not.toContain('Workflow Entry Governance (managed by spec-first)');
    expect(updated).not.toContain('This block is the spec-first workflow entry reminder');
  });

  test('removeManagedBootstrapBlock clears corrupted stale body after light edits', () => {
    const corrupted = [
      '# Header',
      '',
      BOOTSTRAP_END,
      '',
      buildBootstrapBlock('claude', 'en')
        .replace(`${BOOTSTRAP_START}\n`, '')
        .replace(`\n${BOOTSTRAP_END}`, '')
        .replace('This block is the spec-first workflow entry reminder', 'This repository enables spec-first workflow entry governance'),
      '',
      'custom tail',
    ].join('\n');

    const updated = removeManagedBootstrapBlock(corrupted);

    expect(updated).toContain('# Header');
    expect(updated).toContain('custom tail');
    expect(updated).not.toContain('Workflow Entry Governance (managed by spec-first)');
    expect(updated).not.toContain('This repository enables spec-first workflow entry governance');
  });

  test('inspects installed and drifted bootstrap blocks', () => {
    const projectRoot = makeTempDir();
    const adapter = getAdapter('claude');

    try {
      writeInstructionBootstrap(projectRoot, adapter, 'zh');
      expect(inspectInstructionBootstrap(projectRoot, adapter)).toEqual({
        status: 'installed',
        message: 'managed bootstrap block present',
      });

      const filePath = path.join(projectRoot, adapter.instructionFile);
      const drifted = fs.readFileSync(filePath, 'utf8').replace('公开 spec-first workflow', 'workflow 判定');
      fs.writeFileSync(filePath, drifted, 'utf8');

      expect(inspectInstructionBootstrap(projectRoot, adapter)).toEqual({
        status: 'drifted',
        message: 'managed bootstrap block drifted from the bundled template',
      });
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('checked-in host instruction bootstrap matches the current generator', () => {
    expect(inspectInstructionBootstrap(REPO_ROOT, getAdapter('claude'))).toEqual({
      status: 'installed',
      message: 'managed bootstrap block present',
    });
    expect(inspectInstructionBootstrap(REPO_ROOT, getAdapter('codex'))).toEqual({
      status: 'installed',
      message: 'managed bootstrap block present',
    });

    expect(managedBootstrapBlock(fs.readFileSync(path.join(REPO_ROOT, 'CLAUDE.md'), 'utf8')))
      .toBe(buildBootstrapBlock('claude', 'zh'));
    expect(managedBootstrapBlock(fs.readFileSync(path.join(REPO_ROOT, 'AGENTS.md'), 'utf8')))
      .toBe(buildBootstrapBlock('codex', 'zh'));
  });

  test('Codex bootstrap includes best-effort top-level startup version reminder guidance', () => {
    const codexZh = buildBootstrapBlock('codex', 'zh');
    const codexEn = buildBootstrapBlock('codex', 'en');
    const claudeZh = buildBootstrapBlock('claude', 'zh');
    const qoderZh = buildBootstrapBlock('qoder', 'zh');

    expect(codexZh).toContain('Codex：进入公开 `spec-*` workflow 前');
    expect(codexZh).toContain('spec-first startup-reminder --codex');
    expect(codexZh).toContain('只提示在终端运行 `spec-first update`');
    expect(codexZh).toContain('失败/空输出不阻塞');
    expect(codexZh).toContain('bounded subagents、leaf reviewers、worker agents 不运行');
    expect(codexZh).toContain('公开 `spec-*` workflow 调用只授权 workflow 本身');
    expect(codexZh).toContain('不自动授权 `spawn_agent`');
    expect(codexZh).toContain('`spec-doc-review` 缺少 subagents/personas/delegated/parallel 明示授权时走 documented fallback');
    expect(codexZh).toContain('`dispatch_authorization_missing`');
    expect(codexZh).toContain('需要多 persona/subagent review 时请在请求中明说 `subagents`/`personas`');
    expect(codexZh).not.toContain('`spec-doc-review` 默认多 persona dispatch');
    expect(codexZh).not.toContain('仅 report-only/no-agents、dispatch/runtime 缺失或安全边界不满足时降级');
    expect(codexZh).not.toContain('公开 `spec-*` workflow 调用即授权该 workflow 文档化的只读 reviewer/researcher phase');
    expect(codexZh.split('\n').length).toBeGreaterThan(10);
    expect(codexZh.split('\n').length).toBeLessThan(28);
    expect(codexEn).toContain('a top-level orchestrator');
    expect(codexEn).toContain('failure/empty output must not block routing');
    expect(codexEn).toContain('worker agents do not run it');
    expect(codexEn).toContain('invoking a public `spec-*` workflow authorizes the workflow itself, not `spawn_agent`');
    expect(codexEn).toContain('`spec-doc-review` without explicit subagents/personas/delegated/parallel wording uses the documented fallback');
    expect(codexEn).toContain('`dispatch_authorization_missing`');
    expect(codexEn).toContain('for multi-persona/subagent review, ask for `subagents` or `personas` in the request');
    expect(codexEn).not.toContain('`spec-doc-review` defaults to multi-persona dispatch');
    expect(codexEn).not.toContain('falls back only for report-only/no-agents, missing dispatch/runtime, or unmet safety boundaries');
    expect(codexEn).not.toContain('that workflow\'s documented read-only reviewer/researcher phase');
    expect(codexEn.split('\n').length).toBeGreaterThan(10);
    expect(codexEn.split('\n').length).toBeLessThan(28);
    expect(claudeZh).not.toContain('startup-reminder --codex');
    expect(claudeZh).not.toContain('$spec-update');
    expect(claudeZh).not.toContain('默认多 persona dispatch');
    expect(claudeZh).not.toContain('dispatch_authorization_missing');
    expect(qoderZh).not.toContain('startup-reminder --codex');
    expect(qoderZh).not.toContain('dispatch_authorization_missing');
  });

  test('Qoder bootstrap uses project command entrypoints instead of Codex entrypoint prose', () => {
    const qoderZh = buildBootstrapBlock('qoder', 'zh');
    const qoderEn = buildBootstrapBlock('qoder', 'en');

    expect(qoderZh).toContain('Qoder workflow 入口优先使用 `spec-*` project commands');
    expect(qoderZh).toContain('setup/runtime→`spec-mcp-setup`');
    expect(qoderZh).toContain('计划/执行→`spec-plan`/`spec-work`');
    expect(qoderZh).toContain('不要把 `using-spec-first` 本身当作 command-backed workflow');
    expect(qoderZh).not.toContain('Codex workflow 入口使用 `$spec-*`');
    expect(qoderZh).not.toContain('Codex：进入公开 `$spec-*` 前');
    expect(qoderZh).not.toContain('$spec-mcp-setup');

    expect(qoderEn).toContain('Qoder workflow entrypoints prefer `spec-*` project commands');
    expect(qoderEn).toContain('setup/runtime→`spec-mcp-setup`');
    expect(qoderEn).not.toContain('Codex workflow entrypoints use `$spec-*`');
    expect(qoderEn).not.toContain('before entering public `$spec-*`');
  });

  // U3: 最小入口锚点 + R2 哲学守护(AE1/AE2)
  test('minimal entry anchor carries core segments without 1% coercion (AE1/AE2)', () => {
    for (const host of ['claude', 'codex', 'qoder']) {
      for (const lang of ['zh', 'en']) {
        const block = buildBootstrapBlock(host, lang);
        // 四段在场
        if (lang === 'zh') {
          expect(block).toContain('何时进入 workflow');
          expect(block).toContain('何时直接做');
          expect(block).toContain('如何路由');
          expect(block).toContain('常见入口锚点');
          expect(block).toContain('外部 issue/PR 输入');
          expect(block).toContain('issue/PR 是 input surface,不是独立 workflow');
          expect(block).toContain('反合理化红旗');
          expect(block).toContain('可直接回答、bounded read 或正常执行');
          expect(block).toContain('明确单点低风险小改动');
          expect(block).toContain('小改动仍遵守 CHANGELOG、最窄验证和 source/runtime 边界');
        } else {
          expect(block).toContain('When to enter a workflow');
          expect(block).toContain('When to just answer');
          expect(block).toContain('How to route');
          expect(block).toContain('Common entry anchors');
          expect(block).toContain('External issue/PR inputs');
          expect(block).toContain('issue/PR material is an input surface, not a separate workflow');
          expect(block).toContain('Anti-rationalization red flags');
          expect(block).toContain('does NOT mean brainstorming-first');
          expect(block).toContain('clearly scoped low-risk small edits');
          expect(block).toContain('small edits still follow CHANGELOG, narrow verification, and source/runtime boundaries');
          expect(block).toContain('non-trivial or risky edits that need an engineering loop');
        }
        // R2: 严禁 1% 强制全拦截语义
        expect(block).not.toMatch(/1%/);
        expect(block).not.toMatch(/any chance.*must invoke/i);
        expect(block).not.toMatch(/任何可能.*必须/);
        expect(block).not.toContain('spec-intake');
        // R5: subagent 豁免在场
        expect(block.toLowerCase()).toContain('bounded subagent');
      }
    }
  });

  // U3: drift 不变量 — bootstrap identifier 子集(P1-④, AE4/R6)
  // 用 identifier 集合而非措辞片段:identifier 不因措辞改写消失,误红率低。
  // 能力边界(诚实标注,不 overclaim):
  //   - block ⊆ SKILL 方向:断言 block 不含 SKILL Route Map 之外的入口(抓 block 自造入口)。
  //   - curated-core 正向:断言 block 覆盖少量高频入口锚点(抓 block 静默删除关键入口)。
  //   - progressive disclosure 负向:断言 block 入口集合严格小于 SKILL Route Map,避免回退到完整映射常驻注入。
  //   - 本测试不保证语义等价(优先级层数/route 语义改写需人工同步)。
  test('drift invariant: bootstrap identifiers stay within SKILL without copying the full Route Map (AE4/R6)', () => {
    const skillPath = path.join(__dirname, '..', '..', 'skills', 'using-spec-first', 'SKILL.md');
    const skill = fs.readFileSync(skillPath, 'utf8');
    // 从 SKILL 的 Route Map 区提取公开 workflow identifier(`spec-NAME` 形式)
    const routeMapSection = skill.slice(skill.indexOf('### Route Map'));
    const skillIds = new Set(
      [...routeMapSection.matchAll(/`spec-([a-z-]+)`/g)].map((m) => m[1]),
    );
    expect(skillIds.size).toBeGreaterThan(10); // SKILL Route Map 应有充足条目(防提取失败)

    // block 必须覆盖的最小入口锚点(防静默删除)。完整 Route Map 留在 SKILL。
    const CURATED_CORE = [
      'mcp-setup', 'debug', 'code-review', 'doc-review', 'brainstorm', 'prd',
      'plan', 'work', 'optimize', 'ideate', 'compound', 'compound-refresh',
    ];
    // R-09: CURATED_CORE 不得相对 governance registry 静默 stale。
    // 从 skills-governance.json 派生全部 workflow_command 集合,断言
    // CURATED_CORE 与显式 non-core 集严格二分该全集(无遗漏、无重叠、无幽灵)。
    // registry 新增/退役 workflow_command 时,本断言失败直到有人显式归类,
    // 消除硬编码数组与 registry 的 silent drift。
    const governance = JSON.parse(fs.readFileSync(
      path.join(__dirname, '..', '..', 'src', 'cli', 'contracts', 'dual-host-governance', 'skills-governance.json'),
      'utf8',
    ));
    const allWorkflowCommands = new Set(
      governance.skills
        .filter((s) => s.entry_surface === 'workflow_command')
        .map((s) => s.command_name),
    );
    // 显式 non-core workflow_command:有 workflow_command 入口但不进 bootstrap 锚点集
    const NON_CORE_WORKFLOW_COMMANDS = [
      'app-consistency-audit', 'polish-beta', 'release-notes',
      'sessions', 'skill-audit', 'slack-research', 'write-skill', 'write-tasks',
    ];
    // 每个 CURATED_CORE 必须是真实 registry workflow_command(抓幽灵/拼写漂移)
    for (const id of CURATED_CORE) {
      expect(allWorkflowCommands.has(id)).toBe(true);
    }
    // core + non-core 必须正好覆盖全部 workflow_command(抓 registry 新增未归类)
    const classified = new Set([...CURATED_CORE, ...NON_CORE_WORKFLOW_COMMANDS]);
    expect([...allWorkflowCommands].sort()).toEqual([...classified].sort());
    // 无重叠:core 与 non-core 互斥
    for (const id of NON_CORE_WORKFLOW_COMMANDS) {
      expect(CURATED_CORE.includes(id)).toBe(false);
    }
    // 守护:CURATED_CORE 本身必须都在 SKILL Route Map 内(否则列表自身 stale)
    for (const id of CURATED_CORE) {
      expect(skillIds.has(id)).toBe(true);
    }

    for (const host of ['claude', 'codex', 'qoder']) {
      for (const lang of ['zh', 'en']) {
        const block = buildBootstrapBlock(host, lang);
        const blockIds = new Set([...block.matchAll(/`spec-([a-z-]+)`/g)]
          .map((m) => m[1])
          .filter((id) => id !== '*'));
        // block ⊆ SKILL:不得含 SKILL Route Map 之外的入口(防自造入口/drift)
        for (const id of blockIds) {
          expect(skillIds.has(id)).toBe(true);
        }
        // curated-core 正向:每个高频入口锚点都必须在 block(防静默删除)
        for (const id of CURATED_CORE) {
          expect(blockIds.has(id)).toBe(true);
        }
        // progressive-disclosure 负向:bootstrap 不复制完整 Route Map。
        expect(blockIds.size).toBeLessThan(skillIds.size);
        expect(blockIds.has('sessions')).toBe(false);
        expect(blockIds.has('release-notes')).toBe(false);
        // R-08: 非 curated-core 的 workflow_command skill 也必须缺席 bootstrap block
        // (这些有 workflow_command 入口但非高频核心,不应进 progressive-disclosure 锚点集)
        expect(blockIds.has('slack-research')).toBe(false);
        expect(blockIds.has('skill-audit')).toBe(false);
        expect(blockIds.has('app-consistency-audit')).toBe(false);
        expect(blockIds.has('polish-beta')).toBe(false);
        expect(block).not.toContain(lang === 'zh' ? '入口映射(意图→入口)' : 'Entry map (intent→entrypoint)');
      }
    }
  });

  // U3: R8 双宿主对齐 — claude 与 codex 除入口语法外四段核心语义对齐(AE5)
  test('dual-host alignment: claude and codex blocks share core decision semantics (AE5)', () => {
    for (const lang of ['zh', 'en']) {
      const claude = buildBootstrapBlock('claude', lang);
      const codex = buildBootstrapBlock('codex', lang);
      const qoder = buildBootstrapBlock('qoder', lang);
      // 把入口语法差异归一化后,四段核心语义点应两端都在
      const segmentProbes = lang === 'zh'
        ? ['何时进入 workflow', '何时直接做', '如何路由', '反合理化红旗', '常见入口锚点', '外部 issue/PR 输入', 'bounded subagent']
        : ['When to enter a workflow', 'When to just answer', 'How to route', 'Anti-rationalization red flags', 'Common entry anchors', 'External issue/PR inputs', 'bounded subagent'];
      for (const probe of segmentProbes) {
        expect(claude).toContain(probe);
        expect(codex).toContain(probe);
        expect(qoder).toContain(probe);
      }
    }
  });

  // R-10: 两条 load-bearing 红旗必须在 bootstrap 内联或有 intentional deferral 记录。
  // routing-red-flags.md 有 7 条红旗;bootstrap 的 "反合理化红旗" 行内联 5 条措辞,
  // 但两条 load-bearing 红旗 (vague→brainstorm/plan、run-init-now→route first)
  // 不在那 5 条措辞里,而是被 "何时进入 workflow" + "常见入口锚点" 两段语义覆盖。
  // 本测试守护这种 intentional deferral:这两条红旗的语义必须在 bootstrap 在场,
  // 即使不在红旗措辞行内;若被静默删除则失败。
  test('load-bearing red flags (vague-route, run-init-route-first) stay covered in bootstrap (R-10)', () => {
    for (const host of ['claude', 'codex', 'qoder']) {
      for (const lang of ['zh', 'en']) {
        const block = buildBootstrapBlock(host, lang);
        if (lang === 'en') {
          // vague→brainstorm/plan: "When to enter" 含 plan/brainstorm 作为 substantial-work 入口
          expect(block).toMatch(/starting [^\n]*plan/i);
          expect(block).toMatch(/definition→[^\n]*brainstorm/i);
          // run-init-now→route first: "running state-changing commands" + setup 锚点
          expect(block).toMatch(/running state-changing commands/i);
          expect(block).toMatch(/setup\/runtime→[^\n]*mcp-setup/i);
        } else {
          // vague→brainstorm/plan
          expect(block).toMatch(/启动 [^\n]*plan/i);
          expect(block).toMatch(/定义→[^\n]*brainstorm/i);
          // run-init-now→route first
          expect(block).toMatch(/运行改状态命令/);
          expect(block).toMatch(/setup\/runtime→[^\n]*mcp-setup/i);
        }
      }
    }
  });
});
