'use strict';

const fs = require('node:fs');
const path = require('node:path');

const { buildManagedBlock } = require('../../src/cli/lang-policy');

const REPO_ROOT = path.join(__dirname, '..', '..');
const CONTRACT_PATH = path.join(REPO_ROOT, 'docs', 'contracts', 'context-governance.md');

function read(relativePath) {
  return fs.readFileSync(path.join(REPO_ROOT, relativePath), 'utf8');
}

function readWorkflowSurface(relativePath) {
  return read(relativePath);
}

describe('context governance runtime exclusion contract', () => {
  test('defines default runtime and generated mirror exclusions without becoming a router engine', () => {
    const contract = read('docs/contracts/context-governance.md');

    expect(contract).toContain('Default Exclusions');
    expect(contract).toContain('Host Instruction Reuse Policy');
    expect(contract).toContain('已加载的 host/project instructions');
    expect(contract).toContain('禁止把根 `AGENTS.md` / `CLAUDE.md` 当作每次 plan/work/debug/review 的普通必读上下文');
    expect(contract).toContain('`.spec-first/audits/**`');
    expect(contract).toContain('`.claude/**`');
    expect(contract).toContain('`.codex/**`');
    expect(contract).toContain('`.agents/skills/**`');
    expect(contract).toContain('`.cursor/skills/**`');
    expect(contract).toContain('`.cursor/spec-first/**`');
    expect(contract).toContain('`.cursor/mcp.json`');
    expect(contract).toContain('`.kiro/skills/**`');
    expect(contract).toContain('`.kiro/agents/**`');
    expect(contract).toContain('`.kiro/spec-first/**`');
    expect(contract).toContain('`.kiro/settings/**`');
    expect(contract).toContain('`.qoder/commands/spec-*.md`');
    expect(contract).toContain('`.qoder/commands/spec/**`');
    expect(contract).toContain('`.qoder/skills/**`');
    expect(contract).toContain('`.qoder/agents/**`');
    expect(contract).toContain('`.qoder/spec-first/**`');
    expect(contract).toContain('`.qoder/settings.local.json`');
    expect(contract).toContain('`.cursor/rules/**`、`.cursor/agents/**` 和未知 `.cursor/**` host-native/user-owned surface');
    expect(contract).toContain('`.kiro/specs/**` 是 Kiro-native advisory artifact');
    expect(contract).toContain('`.qoder/rules/**`、`.qoder/settings.json` 和 `.qoder/hooks/**` 是 Qoder-native/user-owned surface');
    expect(contract).toContain('`runtime_audit_artifact_excluded`');
    expect(contract).toContain('`runtime_governance_artifact_excluded`');
    expect(contract).toContain('`generated_runtime_mirror_excluded`');
    expect(contract).toContain('`host_local_config_excluded`');
    expect(contract).toContain('`outside_repo_context_excluded`');
    expect(contract).toContain('普通 workflow 仍可读取 checked-in source truth');
    expect(contract).toContain('禁止把 `.spec-first/audits/**`、`.spec-first/governance/**`、`.claude/**`、`.codex/**`、`.agents/skills/**`、`.cursor/skills/**`、`.cursor/spec-first/**`、`.cursor/mcp.json`、`.kiro/skills/**`、`.kiro/agents/**`、`.kiro/spec-first/**`、`.kiro/settings/**`、`.qoder/commands/spec-*.md`、`.qoder/commands/spec/**`、`.qoder/skills/**`、`.qoder/agents/**`、`.qoder/spec-first/**`、`.qoder/settings.local.json` 纳入默认');
    expect(contract).toContain('repo-relative canonical path');
    expect(contract).toContain('Changelog Consumption Policy');
    expect(contract).toContain('`CHANGELOG.md` remains mandatory for project source changes.');
    expect(contract).toContain('latest relevant dated window');
    expect(contract).toContain('compact breadcrumbs');
    expect(contract).toContain('verification status or not-run reason');
    expect(contract).toContain('Detailed design rationale belongs in requirements, plans, reviews, validation artifacts, or PR descriptions');
    expect(contract).toContain('Allowed Exceptions');
    expect(contract).toContain('`spec-mcp-setup` / `spec-first update` CLI');
    expect(contract).toContain('`spec-skill-audit`');
    expect(contract).toContain('changelog author resolution');
    expect(contract).toContain('`~/.spec-first/.developer`');
    expect(contract).toContain('user-explicit path request');
    expect(contract).toContain('不实现中心化 context router');
    expect(contract).toContain('不把 `.gitignore` 当作 LLM context policy 的唯一来源');
  });

  test('merged host governance block stays pointer-only; runtime exclusions live in contracts and workflows', () => {
    for (const lang of ['zh', 'en']) {
      const block = buildManagedBlock(lang);
      expect(block).toContain('using-spec-first');
      expect(block).toContain('skills/using-spec-first/SKILL.md');
      expect(block).not.toContain('<!-- spec-first:bootstrap:start -->');
      expect(block).not.toContain('.spec-first/audits/**');
      expect(block).not.toContain('.spec-first/governance/**');
      expect(block).not.toContain('.claude/**');
      expect(block).not.toContain('.codex/**');
      expect(block).not.toContain('.agents/skills/**');
      expect(block).not.toContain('.qoder/settings.local.json');
    }

    // Checked-in instruction files carry the merged entry pointer. Full runtime-exclusion
    // invariants remain in docs/contracts/context-governance.md and workflow source.
    for (const file of ['AGENTS.md', 'CLAUDE.md']) {
      const content = read(file);
      expect(content).toContain('<!-- spec-first:lang:start -->');
      expect(content).toContain('### Workflow 入口治理');
      expect(content).toContain('skills/using-spec-first/SKILL.md');
      expect(content).not.toContain('<!-- spec-first:bootstrap:start -->');
    }
  });

  test('high-frequency ordinary workflows carry the runtime exclusion rule', () => {
    const workflowPaths = [
      'skills/spec-optimize/SKILL.md',
    ];

    for (const relativePath of workflowPaths) {
      const content = readWorkflowSurface(relativePath);
      expect(content).toContain('docs/contracts/context-governance.md');
      if (relativePath.includes('spec-debug') || relativePath.includes('spec-code-review')) {
        expect(content).toContain('already-loaded host/project instructions');
      }
      expect(content).toContain('.spec-first/audits/**');
      expect(content).toContain('.spec-first/governance/**');
      expect(content).toContain('.claude/**');
      expect(content).toContain('.codex/**');
      expect(content).toContain('.agents/skills/**');
      expect(content).toContain('.cursor/skills/**');
      expect(content).toContain('.cursor/spec-first/**');
      expect(content).toContain('.cursor/mcp.json');
      expect(content).toContain('.kiro/skills/**');
      expect(content).toContain('.kiro/agents/**');
      expect(content).toContain('.kiro/spec-first/**');
      expect(content).toContain('.kiro/settings/**');
      expect(content).toContain('.qoder/commands/spec-*.md');
      expect(content).toContain('.qoder/commands/spec/**');
      expect(content).toContain('.qoder/skills/**');
      expect(content).toContain('.qoder/agents/**');
      expect(content).toContain('.qoder/spec-first/**');
      expect(content).toContain('.qoder/settings.local.json');
      if (relativePath === 'skills/using-spec-first/SKILL.md') {
        expect(content).toContain('latest relevant window / summary-first rules in `docs/contracts/context-governance.md`');
      }
    }

    const entryGovernor = readWorkflowSurface('skills/using-spec-first/SKILL.md');
    expect(entryGovernor).toContain('generated mirrors');
    expect(entryGovernor).toContain('skills/using-spec-first/SKILL.md');
    expect(entryGovernor).toContain('docs/contracts/context-governance.md');
    expect(entryGovernor).toContain('.spec-first/audits/**');
    expect(entryGovernor).toContain('.spec-first/governance/**');
  });

  test('skill-audit documents its bounded audit-artifact exception', () => {
    const skillAudit = read('skills/spec-skill-audit/SKILL.md');

    expect(skillAudit).toContain('explicit exception to the ordinary runtime context exclusion');
    expect(skillAudit).toContain('.spec-first/audits/skill-audit/**');
    expect(skillAudit).toContain('.spec-first/governance/rule-maturity.json');
    expect(skillAudit).toContain('Other workflows should treat `.spec-first/audits/**` and `.spec-first/governance/**` as excluded runtime artifacts');
  });

  test('user-facing docs explain context exclusion separately from gitignore', () => {
    expect(fs.existsSync(CONTRACT_PATH)).toBe(true);
    expect(read('README.md')).toContain('What is excluded from ordinary context');
    expect(read('README.zh-CN.md')).toContain('普通上下文排除什么');
    expect(read('docs/05-用户手册/05-最佳实践.md')).toContain('普通 plan/work/debug/review/compound context 默认排除');
    expect(read('docs/05-用户手册/12-gitignore参考.md')).toContain('不应作为普通 LLM 上下文扫描源');
  });
});
