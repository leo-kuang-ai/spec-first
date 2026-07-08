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
const NON_WORKFLOW_SPEC_IDS = new Set(['*', 'using-spec-first', 'worktree']);

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
    // init 只写 L0 指针；完整入口治理留在 using-spec-first source。
    expect(block.split('\n').length).toBeGreaterThanOrEqual(5);
    expect(block.split('\n').length).toBeLessThan(8);
    expect(twice).toContain('完整入口路由与边界在 `skills/using-spec-first/SKILL.md`');
    expect(twice).toContain('source pointer');
    expect(twice).not.toContain('L0 启动锚点');
    expect(twice).not.toContain('入口映射(意图→入口)');
    expect(twice).not.toContain('过往 session 检索');
    expect(twice).not.toContain('发布说明');
    expect(twice).not.toContain('substantial work 前先判断');
    expect(twice).not.toContain('当前上下文解释');
    expect(twice).not.toContain('不默认进入 `spec-brainstorm`');
    expect(twice).not.toContain('不自动串联多个 workflow');
    expect(twice).not.toContain('source/runtime 边界');
    expect(twice).not.toContain('target_repo');
    expect(twice).not.toContain('deterministic facts');
    expect(block).not.toContain('spec-first:lang');
    expect(twice).not.toContain('Workflow 入口统一使用同名 `spec-*`');
    expect(twice).not.toContain('command-backed workflow');
    expect(twice).not.toContain('spec-worktree');
    expect(twice).not.toContain('最小入口锚点');
    expect(twice).not.toContain('外部 issue/PR 输入');
    expect(twice).not.toContain('反合理化红旗');
    expect(twice).not.toContain('完整 map 查 SKILL');
    expect(twice).not.toContain('spec-optimize');
    expect(twice).not.toContain('spec-compound');
    expect(twice).not.toContain('可直接回答、bounded read 或正常执行');
    expect(twice).not.toContain('明确单点低风险小改动');
    expect(twice).not.toContain('先判断是否 work/debug/update/compound-refresh');
    expect(twice).not.toMatch(/1%|任何可能.*必须 invoke|any chance.*must invoke/i);
    expect(twice).not.toContain('startup-reminder --codex');
    expect(twice).not.toContain('spawn_agent');
    expect(twice).not.toContain('dispatch_authorization_missing');
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
    expect(updated).toContain('source pointer');
    expect(updated).not.toContain('L0 startup anchor');
    expect(updated).toContain('the full entry routing map and boundaries live in `skills/using-spec-first/SKILL.md`');
    expect(updated).toContain('skills/using-spec-first/SKILL.md');
    expect(updated).not.toContain('Workflow entrypoints use the same `spec-*` names');
    expect(updated).not.toContain('startup-reminder --codex');
    expect(updated).not.toContain('must not block routing');
    expect(updated).not.toContain('current-context explanations');
    expect(updated).not.toContain('user-provided single-document summaries');
    expect(updated).not.toContain("User-visible output language follows this file's `spec-first:lang` managed block");
    expect(updated).not.toContain('bounded subagents, leaf reviewers, and worker agents');
    expect(updated).not.toContain('generated runtime mirrors as source');
    expect(updated).not.toContain('complete context denylist lives in `docs/contracts/context-governance.md`');
    expect(updated).not.toContain('without explicit subagents/personas/delegated/parallel wording');
    expect(updated).not.toContain('Minimal entry anchors');
    expect(updated).not.toContain('External issue/PR inputs');
    expect(updated).not.toContain('optimization→`spec-optimize`');
    expect(updated).not.toContain('priority rules, and red flags');
    expect(updated).not.toContain('Entry map (intent→entrypoint)');
    expect(updated).not.toContain('spec-intake');
    expect(updated).not.toContain('Claude workflow 入口使用 `/spec:*`');
  });

  test('repairs corrupted markers even when the stale bootstrap body was lightly edited', () => {
    const editedBody = buildBootstrapBlock('claude', 'en')
      .replace(`${BOOTSTRAP_START}\n`, '')
      .replace(`\n${BOOTSTRAP_END}`, '')
      .replace('the full entry routing map and boundaries live in `skills/using-spec-first/SKILL.md`', 'perform route checks');
    const corrupted = [
      '## Existing Notes',
      editedBody,
      BOOTSTRAP_END,
    ].join('\n');

    const updated = applyManagedBootstrapBlock(corrupted, buildBootstrapBlock('codex', 'en'));

    expect(updated).toContain('## Existing Notes');
    expect(updated).toContain('source pointer');
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
      const drifted = fs.readFileSync(filePath, 'utf8').replace('source pointer', 'workflow 判定');
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

  test('shared AGENTS hosts render the same bootstrap block', () => {
    for (const lang of ['zh', 'en']) {
      const codex = buildBootstrapBlock('codex', lang);
      for (const host of ['cursor', 'kiro', 'qoder']) {
        expect(buildBootstrapBlock(host, lang)).toBe(codex);
      }
    }
  });

  test('Codex bootstrap keeps startup and dispatch guidance out of init bootstrap', () => {
    const codexZh = buildBootstrapBlock('codex', 'zh');
    const codexEn = buildBootstrapBlock('codex', 'en');
    const claudeZh = buildBootstrapBlock('claude', 'zh');
    const cursorZh = buildBootstrapBlock('cursor', 'zh');
    const kiroZh = buildBootstrapBlock('kiro', 'zh');
    const qoderZh = buildBootstrapBlock('qoder', 'zh');

    expect(codexZh).toContain('source pointer');
    expect(codexZh).not.toContain('L0 启动锚点');
    expect(codexZh).toContain('skills/using-spec-first/SKILL.md');
    expect(codexZh).not.toContain('Codex：顶层 orchestrator');
    expect(codexZh).not.toContain('spec-first startup-reminder --codex');
    expect(codexZh).not.toContain('只提示终端运行 `spec-first update`');
    expect(codexZh).not.toContain('失败/空输出不阻塞');
    expect(codexZh).not.toContain('bounded subagents、leaf reviewers、worker agents 不运行');
    expect(codexZh).not.toContain('公开 `spec-*` workflow 只授权 workflow 本身');
    expect(codexZh).not.toContain('不自动授权 `spawn_agent`');
    expect(codexZh).not.toContain('subagents/personas/delegated/parallel');
    expect(codexZh).not.toContain('`dispatch_authorization_missing`');
    expect(codexZh).not.toContain('`spec-doc-review` 默认多 persona dispatch');
    expect(codexZh).not.toContain('仅 report-only/no-agents、dispatch/runtime 缺失或安全边界不满足时降级');
    expect(codexZh).not.toContain('公开 `spec-*` workflow 调用即授权该 workflow 文档化的只读 reviewer/researcher phase');
    expect(codexZh.split('\n').length).toBeGreaterThanOrEqual(5);
    expect(codexZh.split('\n').length).toBeLessThan(8);
    expect(codexEn).toContain('source pointer');
    expect(codexEn).not.toContain('L0 startup anchor');
    expect(codexEn).not.toContain('a top-level orchestrator');
    expect(codexEn).not.toContain('failure/empty output must not block routing');
    expect(codexEn).not.toContain('worker agents do not run it');
    expect(codexEn).not.toContain('`spawn_agent`');
    expect(codexEn).not.toContain('without explicit subagents/personas/delegated/parallel wording');
    expect(codexEn).not.toContain('`dispatch_authorization_missing`');
    expect(codexEn).not.toContain('`spec-doc-review` defaults to multi-persona dispatch');
    expect(codexEn).not.toContain('falls back only for report-only/no-agents, missing dispatch/runtime, or unmet safety boundaries');
    expect(codexEn).not.toContain('that workflow\'s documented read-only reviewer/researcher phase');
    expect(codexEn.split('\n').length).toBeGreaterThanOrEqual(5);
    expect(codexEn.split('\n').length).toBeLessThan(8);
    expect(claudeZh).not.toContain('startup-reminder --codex');
    expect(claudeZh).not.toContain('$spec-update');
    expect(claudeZh).not.toContain('默认多 persona dispatch');
    expect(claudeZh).not.toContain('dispatch_authorization_missing');
    for (const sharedAgentsBlock of [cursorZh, kiroZh, qoderZh]) {
      expect(sharedAgentsBlock).toContain('source pointer');
      expect(sharedAgentsBlock).not.toContain('L0 启动锚点');
      expect(sharedAgentsBlock).not.toContain('startup-reminder --codex');
      expect(sharedAgentsBlock).not.toContain('dispatch_authorization_missing');
    }
  });

  test('Qoder bootstrap uses the same single pointer as shared AGENTS hosts', () => {
    const qoderZh = buildBootstrapBlock('qoder', 'zh');
    const qoderEn = buildBootstrapBlock('qoder', 'en');

    expect(qoderZh).toContain('source pointer');
    expect(qoderZh).not.toContain('L0 启动锚点');
    expect(qoderZh).toContain('skills/using-spec-first/SKILL.md');
    expect(qoderZh).not.toContain('Workflow 入口统一使用同名 `spec-*`');
    expect(qoderZh).not.toContain('公开 `spec-*` workflow');
    expect(qoderZh).not.toContain('`using-spec-first` 不是 command-backed workflow');
    expect(qoderZh).not.toContain('setup/runtime→`spec-mcp-setup`');
    expect(qoderZh).not.toContain('计划/执行→`spec-plan`/`spec-work`');
    expect(qoderZh).not.toContain('Codex workflow 入口使用 `$spec-*`');
    expect(qoderZh).not.toContain('Codex：进入公开 `$spec-*` 前');
    expect(qoderZh).not.toContain('$spec-mcp-setup');

    expect(qoderEn).toContain('source pointer');
    expect(qoderEn).not.toContain('L0 startup anchor');
    expect(qoderEn).toContain('skills/using-spec-first/SKILL.md');
    expect(qoderEn).not.toContain('Workflow entrypoints use the same `spec-*` names');
    expect(qoderEn).not.toContain('public `spec-*` workflow');
    expect(qoderEn).not.toContain('setup/runtime→`spec-mcp-setup`');
    expect(qoderEn).not.toContain('Codex workflow entrypoints use `$spec-*`');
    expect(qoderEn).not.toContain('before entering public `$spec-*`');
  });

  // U3: source pointer + R2 哲学守护(AE1/AE2)
  test('bootstrap carries only the source pointer without 1% coercion (AE1/AE2)', () => {
    for (const host of ['claude', 'codex', 'cursor', 'kiro', 'qoder']) {
      for (const lang of ['zh', 'en']) {
        const block = buildBootstrapBlock(host, lang);
        if (lang === 'zh') {
          expect(block).toContain('source pointer');
          expect(block).toContain('完整入口路由与边界在 `skills/using-spec-first/SKILL.md`');
          expect(block).not.toContain('L0 启动锚点');
          expect(block).not.toContain('substantial work 前先判断');
          expect(block).not.toContain('可直接回答、bounded read 或正常执行');
          expect(block).not.toContain('明确单点低风险小改动');
          expect(block).not.toContain('不默认进入 `spec-brainstorm`');
          expect(block).not.toContain('source/runtime 边界');
          expect(block).not.toContain('target_repo');
          expect(block).not.toContain('scripts/tools 只产 deterministic facts');
          expect(block).not.toContain('最小入口锚点');
          expect(block).not.toContain('外部 issue/PR 输入');
          expect(block).not.toContain('反合理化红旗');
          expect(block).not.toContain('setup/runtime→');
        } else {
          expect(block).toContain('source pointer');
          expect(block).toContain('full entry routing map and boundaries live in `skills/using-spec-first/SKILL.md`');
          expect(block).not.toContain('L0 startup anchor');
          expect(block).not.toContain('Before substantial work');
          expect(block).not.toContain('executed directly');
          expect(block).not.toContain('clearly scoped low-risk small edits');
          expect(block).not.toContain('do not default to `spec-brainstorm`');
          expect(block).not.toContain('source/runtime boundaries');
          expect(block).not.toContain('target_repo');
          expect(block).not.toContain('scripts/tools produce deterministic facts');
          expect(block).not.toContain('Minimal entry anchors');
          expect(block).not.toContain('External issue/PR inputs');
          expect(block).not.toContain('Anti-rationalization red flags');
          expect(block).not.toContain('setup/runtime→');
        }
        // R2: 严禁 1% 强制全拦截语义
        expect(block).not.toMatch(/1%/);
        expect(block).not.toMatch(/any chance.*must invoke/i);
        expect(block).not.toMatch(/任何可能.*必须/);
        expect(block).not.toContain('spec-intake');
        expect(block.toLowerCase()).not.toContain('bounded subagent');
      }
    }
  });

  // U3: drift 不变量 — bootstrap identifier 子集(P1-④, AE4/R6)
  // L0 bootstrap 是启动锚点,不是 route map。它不应直接列出任何公开 workflow 菜单。
  test('drift invariant: bootstrap identifiers stay tiny and do not copy the SKILL route map (AE4/R6)', () => {
    const skillPath = path.join(__dirname, '..', '..', 'skills', 'using-spec-first', 'SKILL.md');
    const skill = fs.readFileSync(skillPath, 'utf8');
    // 从 SKILL 的入口路由区提取公开 workflow identifier(`spec-NAME` 形式)
    const routeStart = skill.indexOf('## Flow Map');
    const routeEnd = skill.indexOf('## Direct Outcomes');
    expect(routeStart).not.toBe(-1);
    expect(routeEnd).toBeGreaterThan(routeStart);
    const routeMapSection = skill.slice(routeStart, routeEnd);
    const skillIds = new Set(
      [...routeMapSection.matchAll(/`spec-([a-z-]+)`/g)].map((m) => m[1]),
    );
    expect(skillIds.size).toBeGreaterThan(10); // SKILL 入口路由区应有充足条目(防提取失败)

    const ROUTE_MENU_IDS_THAT_MUST_STAY_OUT = [
      'mcp-setup', 'debug', 'code-review', 'doc-review', 'prd', 'optimize',
      'plan', 'work', 'compound', 'compound-refresh', 'brainstorm',
    ];

    for (const host of ['claude', 'codex', 'cursor', 'kiro', 'qoder']) {
      for (const lang of ['zh', 'en']) {
        const block = buildBootstrapBlock(host, lang);
        const blockIds = new Set([...block.matchAll(/`spec-([a-z-]+)`/g)]
          .map((m) => m[1])
          .filter((id) => !NON_WORKFLOW_SPEC_IDS.has(id)));
        // block ⊆ SKILL:不得含 SKILL 入口路由区之外的入口(防自造入口/drift)
        for (const id of blockIds) {
          expect(skillIds.has(id)).toBe(true);
        }
        expect(blockIds.size).toBe(0);
        for (const id of ROUTE_MENU_IDS_THAT_MUST_STAY_OUT) {
          expect(blockIds.has(id)).toBe(false);
        }
        expect(block).toContain('`using-spec-first`');
        expect(block).not.toContain('`spec-*`');
        expect(block).not.toContain('`spec-worktree`');
        expect(block).not.toContain(lang === 'zh' ? '入口映射(意图→入口)' : 'Entry map (intent→entrypoint)');
        expect(block).not.toContain(lang === 'zh' ? '完整 map 查 SKILL' : 'read the SKILL for the complete map');
      }
    }
  });

  // U3: R8 双宿主对齐 — claude 与 codex 共享同一 source pointer(AE5)
  test('dual-host alignment: claude and codex blocks share core decision semantics (AE5)', () => {
    for (const lang of ['zh', 'en']) {
      const claude = buildBootstrapBlock('claude', lang);
      const codex = buildBootstrapBlock('codex', lang);
      const cursor = buildBootstrapBlock('cursor', lang);
      const kiro = buildBootstrapBlock('kiro', lang);
      const qoder = buildBootstrapBlock('qoder', lang);
      const segmentProbes = lang === 'zh'
        ? ['source pointer', 'skills/using-spec-first/SKILL.md']
        : ['source pointer', 'skills/using-spec-first/SKILL.md'];
      for (const probe of segmentProbes) {
        expect(claude).toContain(probe);
        expect(codex).toContain(probe);
        expect(cursor).toContain(probe);
        expect(kiro).toContain(probe);
        expect(qoder).toContain(probe);
      }
      for (const block of [claude, codex, cursor, kiro, qoder]) {
        expect(block).not.toContain(lang === 'zh' ? 'substantial work 前先判断' : 'Before substantial work');
        expect(block).not.toContain('target_repo');
        expect(block).not.toContain('bounded subagent');
        expect(block).not.toContain('startup-reminder --codex');
        expect(block).not.toContain('dispatch_authorization_missing');
      }
    }
  });

  test('detailed routing and red flags stay deferred to using-spec-first (R-10)', () => {
    for (const host of ['claude', 'codex', 'cursor', 'kiro', 'qoder']) {
      for (const lang of ['zh', 'en']) {
        const block = buildBootstrapBlock(host, lang);
        if (lang === 'en') {
          expect(block).toContain('the full entry routing map and boundaries live in `skills/using-spec-first/SKILL.md`');
          expect(block).not.toContain('Minimal entry anchors');
          expect(block).not.toContain('External issue/PR inputs');
          expect(block).not.toContain('Anti-rationalization red flags');
          expect(block).not.toMatch(/setup\/runtime→/i);
          expect(block).not.toMatch(/unclear WHAT→/i);
        } else {
          expect(block).toContain('完整入口路由与边界在 `skills/using-spec-first/SKILL.md`');
          expect(block).not.toContain('最小入口锚点');
          expect(block).not.toContain('外部 issue/PR 输入');
          expect(block).not.toContain('反合理化红旗');
          expect(block).not.toMatch(/setup\/runtime→/i);
          expect(block).not.toMatch(/WHAT 不清→/i);
        }
      }
    }
  });
});
