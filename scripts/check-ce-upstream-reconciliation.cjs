#!/usr/bin/env node
'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const REPO_ROOT = path.resolve(__dirname, '..');
const LEGACY_BASE = '7f86be9d02679adeb93951587dee40de42c5bf82';
const LEGACY_HEAD = '1fac0442ee16996913dd0843a063ac279d2c32f4';
const BASE = '5c7cb347d0686663743b87cd7227246ba24f7fa7';
const HEAD = '956087b3e1dd7ccc03df32cee9e7c044dfbe75cf';
const AUDIT_PATH = 'docs/validation/2026-07-30-ce-3-20-file-by-file-diff-audit.md';
const NAME_STATUS_PATH = 'docs/validation/2026-07-30-ce-3-20-name-status.txt';
const LEDGER_PATH = 'docs/validation/2026-07-30-ce-3-20-skill-script-reconciliation.json';
const SUMMARY_PATH = 'docs/validation/2026-07-30-ce-3-20-skill-script-reconciliation.md';
const INVENTORY_PATH = 'docs/validation/2026-07-30-current-skill-package-inventory.json';
const V2_NAME_STATUS_PATH = 'docs/validation/2026-08-19-ce-post-3-20-full-window-name-status.md';
const V2_ADJUDICATION_INPUT_PATH = 'docs/validation/2026-08-19-ce-post-3-20-adjudication-input.json';
const V2_ADJUDICATION_PATH = 'docs/validation/2026-08-19-ce-post-3-20-adjudication.json';
const V2_LEDGER_PATH = 'docs/validation/2026-08-19-ce-post-3-20-full-window-reconciliation-v2.json';
const V2_SUMMARY_PATH = 'docs/validation/2026-08-19-ce-post-3-20-full-window-reconciliation-v2.md';
const V2_INVENTORY_PATH = 'docs/validation/2026-08-19-spec-first-current-skill-package-inventory-v2.json';
const V2_EXCEPTIONS_PATH = 'docs/validation/2026-08-19-ce-post-3-20-evidence-exceptions.json';
const V2_PATCH_DIR = 'docs/validation/2026-08-19-ce-post-3-20-ledger-patches';
const CE_LOCALIZATION_VALIDATION_DIR = 'docs/validation/ce-localization';
const V2_RUN_OUTPUTS = Object.freeze([
  V2_NAME_STATUS_PATH,
  V2_ADJUDICATION_INPUT_PATH,
  V2_ADJUDICATION_PATH,
  V2_LEDGER_PATH,
  V2_SUMMARY_PATH,
  V2_INVENTORY_PATH,
  V2_EXCEPTIONS_PATH,
]);
const CANONICAL_SOURCE_ROOTS = Object.freeze([
  'CLAUDE.md', 'AGENTS.md', 'skills', 'templates', 'src', 'scripts', 'tests', 'docs',
  'README.md', 'README.en.md', 'README.zh-CN.md', 'CHANGELOG.md', 'package.json',
]);
const ROOT_METADATA_PATHS = new Set(['AGENTS.md', 'CONCEPTS.md', 'README.md', 'package.json']);

const CLI_RUNTIME_PATHS = new Set([
  '.opencode/plugins/compound-engineering.js',
  'scripts/codex-dev.ts',
  'src/commands/convert.ts',
  'src/commands/install.ts',
  'src/converters/claude-to-copilot.ts',
  'src/converters/claude-to-droid.ts',
  'src/converters/claude-to-kiro.ts',
  'src/converters/claude-to-pi.ts',
  'src/dev/codex-dev.ts',
  'src/release/metadata.ts',
  'src/targets/codex.ts',
  'src/targets/managed-artifacts.ts',
  'src/targets/opencode.ts',
  'src/targets/pi.ts',
  'src/utils/codex-agents.ts',
  'src/utils/codex-content.ts',
  'src/utils/detect-tools.ts',
  'src/utils/frontmatter.ts',
  'src/utils/legacy-cleanup.ts',
  'src/utils/slash-command.ts',
]);

const SUPPORT_PATHS = new Set([
  '.compound-engineering/config.local.example.yaml',
  '.gitattributes',
  'package.json',
]);

const LEGACY_NO_DIRECT_COUNTERPART = new Set([
  'ce-babysit-pr',
  'ce-handoff',
  'ce-retune',
  'ce-setup',
]);
const CURRENT_NO_DIRECT_COUNTERPART = new Set([
  'ce-babysit-pr',
  'ce-prototype',
]);
const TARGET_ACTIONS = new Set([
  'implement-in-current-owner',
  'compose',
  'defer',
  'evidence-only',
  'regression-only',
  'reject',
  'delete-or-retire',
  'out-of-scope-by-product-decision',
]);
const EVIDENCE_STATUSES = new Set(['planned', 'confirmed', 'not-applicable']);
const V2_SCHEMA_VERSION = 'ce-upstream-reconciliation/v2';
const ADJUDICATION_SCHEMA_VERSION = 'ce-upstream-adjudication/v1';
const ADJUDICATION_JOIN_KEY = 'path+upstream+target-source';
const V2_TARGET_ACTIONS = new Set([
  'implement-in-current-owner',
  'compose',
  'evidence-only',
  'out-of-scope-by-product-decision',
]);
const CLOSURE_PROFILES = new Set(['source-adjudication', 'evidence-only', 'product-excluded']);
const V2_GROUPS = new Set(['G01', 'G02', 'G03', 'G04', 'G05', 'G06']);
const PACKAGE_IDS = Object.freeze(Array.from({ length: 33 }, (_, index) => `P${String(index + 1).padStart(2, '0')}`));
const PACKAGE_BY_SURFACE = Object.freeze({
  'ce-babysit-pr': 'P01',
  'ce-brainstorm': 'P02',
  'ce-code-review': 'P03',
  'ce-commit': 'P04',
  'ce-commit-push-pr': 'P05',
  'ce-compound': 'P06',
  'ce-compound-refresh': 'P07',
  'ce-debug': 'P08',
  'ce-doc-review': 'P09',
  'ce-dogfood': 'P10',
  'ce-explain': 'P11',
  'ce-handoff': 'P12',
  'ce-ideate': 'P13',
  'ce-optimize': 'P14',
  'ce-plan': 'P15',
  'ce-pov': 'P16',
  'ce-product-pulse': 'P17',
  'ce-promote': 'P18',
  'ce-proof': 'P19',
  'ce-prototype': 'P20',
  'ce-resolve-pr-feedback': 'P21',
  'ce-retune': 'P22',
  'ce-riffrec-feedback-analysis': 'P23',
  'ce-setup': 'P24',
  'ce-simplify-code': 'P25',
  'ce-strategy': 'P26',
  'ce-sweep': 'P27',
  'ce-test-browser': 'P28',
  'ce-test-xcode': 'P29',
  'ce-work': 'P30',
  'ce-worktree': 'P31',
  lfg: 'P32',
  'ce-skill-work': 'P33',
});
const SURFACE_BY_PACKAGE = Object.freeze(Object.fromEntries(
  Object.entries(PACKAGE_BY_SURFACE).map(([surface, packageId]) => [packageId, surface]),
));
const FULL_WINDOW_FACTS = Object.freeze({
  total: 517,
  name_status_sha256: 'a83371963406147ede5c9752c13b324e88d9f0eaf08af7e1239dd7e6a623d459',
  changed_path_sha256: 'bb6bb46295f75723d1030dc009d840cb93f058466649db51f4b1337d128ae05b',
  status_counts: Object.freeze({ A: 222, M: 291, D: 2, R069: 1, R074: 1 }),
  group_counts: Object.freeze({ G01: 298, G02: 95, G03: 98, G04: 6, G05: 15, G06: 5 }),
});

function git(repo, args) {
  return execFileSync('git', ['-C', repo, ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).replace(/\r\n/g, '\n');
}

function sha256(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function parseFilelist(content) {
  const paths = content.trimEnd().split('\n').filter(Boolean);
  if (paths.some((entry) => entry.includes('\t') || entry.startsWith('/') || entry.includes('..'))) {
    throw new Error('filelist 含无效或越界路径。');
  }
  const unique = new Set(paths);
  if (unique.size !== paths.length) throw new Error('filelist 存在重复路径。');
  return paths;
}

function validateSelection(filelistContent, expectedSha, nameStatus, fullNameStatus = null) {
  const actualSha = sha256(filelistContent);
  if (expectedSha && actualSha !== expectedSha) {
    throw new Error(`filelist SHA-256 不匹配：期望 ${expectedSha}，实际 ${actualSha}。`);
  }
  const selectedPaths = parseFilelist(filelistContent);
  const selectedSet = new Set(selectedPaths);
  const changedPaths = new Set(nameStatus.map((entry) => entry.path));
  const missing = selectedPaths.filter((entry) => !changedPaths.has(entry));
  const extra = [...changedPaths].filter((entry) => !selectedSet.has(entry));
  if (missing.length || extra.length) {
    throw new Error(`filelist 与窗口差异不一致：缺失 ${missing.length}，越界 ${extra.length}。`);
  }
  const statusCounts = nameStatus.reduce((counts, entry) => {
    counts[entry.status] = (counts[entry.status] || 0) + 1;
    return counts;
  }, {});
  if (statusCounts.M !== 148 || statusCounts.A !== 36 || statusCounts.R074 !== 1) {
    throw new Error(`清单状态计数不匹配：${JSON.stringify(statusCounts)}。`);
  }
  const fullPaths = fullNameStatus ? new Set(fullNameStatus.map((entry) => entry.path)) : null;
  if (fullPaths) {
    const outsideCount = [...fullPaths].filter((entry) => !selectedSet.has(entry)).length;
    if (outsideCount !== 187) throw new Error(`清单外路径应为 187 条，实际 ${outsideCount} 条。`);
  }
  return {
    selection_sha256: actualSha,
    selected_path_count: selectedPaths.length,
    selected_status_counts: statusCounts,
    ...(fullPaths ? {
      excluded_path_count: [...fullPaths].filter((entry) => !selectedSet.has(entry)).length,
      excluded_reason: 'out-of-scope-by-user-selection',
    } : {}),
  };
}

function assertRepoPath(filePath, label) {
  const relative = path.relative(REPO_ROOT, filePath);
  if (relative === '' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error(`${label} 必须位于当前仓库内：${filePath}`);
  }
}

function parseArgs(argv) {
  const pathOptions = new Set();
  const refOptions = new Set();
  const args = {
    ceRepo: null,
    refresh: false,
    verifyLegacy: false,
    fullWindow: false,
    prepareAdjudication: false,
    filelistPath: null,
    filelistSha256: null,
    adjudicationPath: null,
    adjudicationInputPath: path.join(REPO_ROOT, V2_ADJUDICATION_INPUT_PATH),
    base: BASE,
    head: HEAD,
    auditPath: path.join(REPO_ROOT, AUDIT_PATH),
    nameStatusPath: path.join(REPO_ROOT, NAME_STATUS_PATH),
    ledgerPath: path.join(REPO_ROOT, LEDGER_PATH),
    summaryPath: path.join(REPO_ROOT, SUMMARY_PATH),
    inventoryPath: path.join(REPO_ROOT, INVENTORY_PATH),
    patchDir: null,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === '--refresh') {
      args.refresh = true;
    } else if (token === '--verify-legacy') {
      args.verifyLegacy = true;
    } else if (token === '--full-window') {
      args.fullWindow = true;
    } else if (token === '--prepare-adjudication') {
      args.prepareAdjudication = true;
    } else if (['--base', '--head', '--audit', '--name-status', '--ledger', '--summary', '--inventory', '--filelist', '--filelist-sha256', '--adjudication-input'].includes(token)) {
      const value = argv[index + 1];
      if (!value) throw new Error(`${token} 需要值。`);
      if (token === '--base') { args.base = value; refOptions.add(token); }
      if (token === '--head') { args.head = value; refOptions.add(token); }
      if (token === '--audit') { args.auditPath = path.resolve(value); pathOptions.add(token); }
      if (token === '--name-status') { args.nameStatusPath = path.resolve(value); pathOptions.add(token); }
      if (token === '--ledger') { args.ledgerPath = path.resolve(value); pathOptions.add(token); }
      if (token === '--summary') { args.summaryPath = path.resolve(value); pathOptions.add(token); }
      if (token === '--inventory') { args.inventoryPath = path.resolve(value); pathOptions.add(token); }
      if (token === '--adjudication-input') { args.adjudicationInputPath = path.resolve(value); pathOptions.add(token); }
      if (token === '--filelist') args.filelistPath = path.resolve(value);
      if (token === '--filelist-sha256') args.filelistSha256 = value;
      index += 1;
    } else if (token === '--patch-dir') {
      const value = argv[index + 1];
      if (!value) throw new Error('--patch-dir 需要路径。');
      args.patchDir = path.resolve(value);
      index += 1;
    } else if (token === '--adjudication') {
      const value = argv[index + 1];
      if (!value) throw new Error('--adjudication 需要值。');
      args.adjudicationPath = path.resolve(value);
      index += 1;
    } else if (token === '--ce-repo') {
      args.ceRepo = argv[index + 1] ? path.resolve(argv[index + 1]) : null;
      index += 1;
    } else {
      throw new Error(`未知参数：${token}`);
    }
  }
  if (argv.includes('--ce-repo') && !args.ceRepo) {
    throw new Error('--ce-repo 需要路径。');
  }
  if (args.refresh && args.verifyLegacy) {
    throw new Error('--refresh 不能与 --verify-legacy 同时使用。');
  }
  if (args.refresh && !args.ceRepo) {
    throw new Error('--refresh 必须同时提供 --ce-repo，以固定 commit objects 为输入。');
  }
  if (args.adjudicationPath && !args.fullWindow) {
    throw new Error('--adjudication 必须与 --full-window 同时使用。');
  }
  if (args.prepareAdjudication && args.fullWindow) {
    throw new Error('--prepare-adjudication 不能与 --full-window 同时使用。');
  }
  if (args.prepareAdjudication && !args.ceRepo) {
    throw new Error('--prepare-adjudication 必须提供 --ce-repo。');
  }
  if (!args.verifyLegacy && !args.fullWindow && !args.prepareAdjudication && !args.filelistPath) {
    throw new Error('新窗口必须提供 --filelist。');
  }
  if (!args.verifyLegacy && !args.fullWindow && !args.prepareAdjudication && !args.filelistSha256) {
    throw new Error('新窗口必须提供 --filelist-sha256。');
  }
  if (args.filelistSha256 && !/^[a-f0-9]{64}$/i.test(args.filelistSha256)) {
    throw new Error('--filelist-sha256 必须是 64 位十六进制 SHA-256。');
  }
  if (args.fullWindow || args.prepareAdjudication) {
    if (!pathOptions.has('--name-status')) args.nameStatusPath = path.join(REPO_ROOT, V2_NAME_STATUS_PATH);
    if (!pathOptions.has('--inventory')) args.inventoryPath = path.join(REPO_ROOT, V2_INVENTORY_PATH);
    if (args.fullWindow) {
      if (!pathOptions.has('--ledger')) args.ledgerPath = path.join(REPO_ROOT, V2_LEDGER_PATH);
      if (!pathOptions.has('--summary')) args.summaryPath = path.join(REPO_ROOT, V2_SUMMARY_PATH);
    }
  }
  if (args.verifyLegacy) {
    if (!refOptions.has('--base')) args.base = LEGACY_BASE;
    if (!refOptions.has('--head')) args.head = LEGACY_HEAD;
  }
  return args;
}

function parseNameStatus(content) {
  // Accept raw git output and the checked-in Markdown snapshot wrapper.
  const fenced = content.match(/```text\n([\s\S]*?)\n```/);
  const lines = (fenced ? fenced[1] : content).trimEnd().split('\n').filter(Boolean);
  return lines.map((line) => {
    const fields = line.split('\t');
    const status = fields[0];
    if (!/^(?:[AMDTCUXB]|[RC]\d{3})$/.test(status)) {
      throw new Error(`无效 name-status 状态：${line}`);
    }
    if (/^[RC]/.test(status)) {
      if (fields.length !== 3) throw new Error(`无效 rename/copy name-status：${line}`);
      return { status, old_path: fields[1], path: fields[2] };
    }
    if (fields.length !== 2) throw new Error(`无效 name-status：${line}`);
    return { status, path: fields[1] };
  });
}

function parseAudit(content, expectedCount = 422) {
  const headings = [...content.matchAll(/^### F(\d{3})\. `([^`]+)`$/gm)];
  if (headings.length === 0) {
    const records = new Map();
    const rows = content.split('\n').filter((line) => /^\| F\d{3} \|/.test(line));
    if (rows.length !== expectedCount) {
      throw new Error(`逐文件审计应包含 ${expectedCount} 条，实际 ${rows.length} 条。`);
    }
    rows.forEach((line) => {
      const columns = line.split(' | ').map((column) => column.replace(/^\| /, '').replace(/ \|$/, '').trim());
      if (columns.length < 9) throw new Error(`逐文件审计表格行格式无效：${line}`);
      const [id, status, pathColumn, , , , owner, verdict] = columns;
      const targetAction = columns[9] || verdict;
      const evidenceStatus = columns[10] || null;
      const sourceRefs = columns[11] ? splitAuditRefs(columns[11]) : null;
      const testRefs = columns[12] ? splitAuditRefs(columns[12]) : null;
      const limitations = columns[13] ? splitAuditRefs(columns[13]) : null;
      const rename = pathColumn.match(/^`([^`]+)` -> `([^`]+)`$/);
      const filePath = rename ? rename[2] : pathColumn.replace(/^`|`$/g, '');
      records.set(filePath, {
        audit_id: id,
        spec_first_owner: owner,
        verdict,
        target_action: targetAction,
        test_owner: owner,
        ...(evidenceStatus ? { evidence_status: evidenceStatus } : {}),
        ...(sourceRefs ? { source_refs: sourceRefs } : {}),
        ...(testRefs ? { test_refs: testRefs } : {}),
        ...(limitations ? { limitations } : {}),
        ...(rename ? { old_path: rename[1] } : {}),
        status,
      });
    });
    return records;
  }
  if (headings.length !== expectedCount) {
    throw new Error(`逐文件审计应包含 ${expectedCount} 条，实际 ${headings.length} 条。`);
  }
  const records = new Map();
  headings.forEach((match, index) => {
    const id = Number.parseInt(match[1], 10);
    if (id !== index + 1) throw new Error(`审计编号不连续：F${match[1]}。`);
    const filePath = match[2];
    if (records.has(filePath)) throw new Error(`逐文件审计路径重复：${filePath}`);
    const bodyStart = match.index + match[0].length;
    const bodyEnd = index + 1 < headings.length ? headings[index + 1].index : content.length;
    const body = content.slice(bodyStart, bodyEnd);
    const ownerVerdict = body.match(/^- \*\*spec-first owner \/ 裁决：\*\* (.+?)；`([^`]+)`[。；]/m);
    const verification = body.match(/^- \*\*理由与验证面：\*\* (.+)$/m);
    if (!ownerVerdict || !verification) {
      throw new Error(`逐文件审计缺少 owner/verdict/verification：${filePath}`);
    }
    records.set(filePath, {
      audit_id: `F${match[1]}`,
      spec_first_owner: ownerVerdict[1],
      verdict: ownerVerdict[2],
      target_action: (body.match(/^- \*\*目标动作：\*\* `([^`]+)`$/m) || [])[1] || null,
      test_owner: verification[1],
    });
  });
  return records;
}

function splitAuditRefs(value) {
  return value
    .replace(/^`|`$/g, '')
    .split(/\s*;\s*|\s*,\s*/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function surfaceFor(filePath) {
  const skillMatch = filePath.match(/^skills\/([^/]+)\//);
  if (skillMatch) return skillMatch[1];
  const authoringSkillMatch = filePath.match(/^\.agents\/skills\/([^/]+)\//);
  if (authoringSkillMatch) return authoringSkillMatch[1];
  if (CLI_RUNTIME_PATHS.has(filePath)) return 'cli-runtime';
  if (SUPPORT_PATHS.has(filePath)) return 'support';
  if (filePath.startsWith('tests/')) return 'tests-fixtures';
  if (filePath.startsWith('docs/')) return 'docs-evidence';
  return 'metadata-governance';
}

function categoryFor(filePath) {
  if (filePath.startsWith('skills/')) return 'skill-runtime';
  if (CLI_RUNTIME_PATHS.has(filePath)) return 'cli-runtime';
  if (SUPPORT_PATHS.has(filePath)) return 'support';
  return 'evidence-only';
}

function buildLedger(nameStatus, auditRecords, {
  legacyTargetActions = new Map(),
  requireEvidence = false,
} = {}) {
  const seen = new Set();
  const records = nameStatus.map((entry) => {
    if (seen.has(entry.path)) throw new Error(`name-status 路径重复：${entry.path}`);
    seen.add(entry.path);
    const audit = auditRecords.get(entry.path);
    if (!audit) throw new Error(`name-status 路径未在逐文件审计分类：${entry.path}`);
    const targetAction = audit.target_action || legacyTargetActions.get(entry.path);
    return {
      audit_id: audit.audit_id,
      status: entry.status,
      path: entry.path,
      ...(entry.old_path ? { old_path: entry.old_path } : {}),
      ce_skill_or_surface: surfaceFor(entry.path),
      category: categoryFor(entry.path),
      verdict: audit.verdict,
      spec_first_owner: audit.spec_first_owner,
      ...(targetAction ? { target_action: targetAction } : {}),
      test_owner: audit.test_owner,
      ...(audit.evidence_status ? { evidence_status: audit.evidence_status } : {}),
      ...(audit.source_refs ? { source_refs: audit.source_refs } : {}),
      ...(audit.test_refs ? { test_refs: audit.test_refs } : {}),
      ...(audit.limitations ? { limitations: audit.limitations } : {}),
      ...(audit.verdict.includes('不采纳') ? { exception_reason: audit.test_owner } : {}),
    };
  });
  for (const auditPath of auditRecords.keys()) {
    if (!seen.has(auditPath)) throw new Error(`逐文件审计存在区间外路径：${auditPath}`);
  }
  const missingTargetActions = records
    .filter((record) => !record.target_action)
    .map((record) => record.path);
  if (missingTargetActions.length > 0) {
    throw new Error(`逐文件审计缺少显式 target_action：${missingTargetActions.join(', ')}`);
  }
  for (const record of records) {
    if (!TARGET_ACTIONS.has(record.target_action)) {
      throw new Error(`target_action 无效：${record.path} -> ${record.target_action}`);
    }
    if (requireEvidence) {
      if (!EVIDENCE_STATUSES.has(record.evidence_status)) {
        throw new Error(`evidence_status 无效或缺失：${record.path} -> ${record.evidence_status || '<missing>'}`);
      }
      const excluded = record.target_action === 'out-of-scope-by-product-decision';
      if (excluded && record.evidence_status !== 'not-applicable') {
        throw new Error(`产品排除项必须使用 not-applicable：${record.path}`);
      }
      if (!excluded && record.evidence_status === 'not-applicable') {
        throw new Error(`非排除项不能使用 not-applicable：${record.path}`);
      }
      if (!excluded && record.target_action === 'defer') {
        throw new Error(`新窗口禁止保留 defer：${record.path}`);
      }
      if (!excluded && (!Array.isArray(record.source_refs) || record.source_refs.length === 0
        || !Array.isArray(record.test_refs) || record.test_refs.length === 0
        || !Array.isArray(record.limitations) || record.limitations.length === 0)) {
        throw new Error(`非排除项缺少 source_refs/test_refs/limitations：${record.path}`);
      }
    }
  }
  return records;
}

function summarize(records, { noDirectCounterpart = LEGACY_NO_DIRECT_COUNTERPART } = {}) {
  const count = (predicate) => records.filter(predicate).length;
  const skillNames = new Set(records
    .filter((record) => /^skills\/[^/]+\/SKILL\.md$/.test(record.path))
    .map((record) => record.ce_skill_or_surface));
  const directSkillFiles = count((record) => record.category === 'skill-runtime'
    && !noDirectCounterpart.has(record.ce_skill_or_surface));
  const noDirectSkillFiles = count((record) => record.category === 'skill-runtime'
    && noDirectCounterpart.has(record.ce_skill_or_surface));
  const addedSkills = [...skillNames].filter((skill) => {
    const entry = records.find((record) => record.path === `skills/${skill}/SKILL.md`);
    return entry && entry.status === 'A';
  }).sort();
  return {
    total: records.length,
    implementation_targets: count((record) => record.category !== 'evidence-only'),
    evidence_only: count((record) => record.category === 'evidence-only'),
    skill_runtime: count((record) => record.category === 'skill-runtime'),
    cli_runtime: count((record) => record.category === 'cli-runtime'),
    support: count((record) => record.category === 'support'),
    ce_skills: skillNames.size,
    direct_counterpart_skills: [...skillNames].filter((skill) => !noDirectCounterpart.has(skill)).length,
    no_direct_counterpart_skills: [...skillNames].filter((skill) => noDirectCounterpart.has(skill)).length,
    direct_counterpart_skill_files: directSkillFiles,
    no_direct_counterpart_skill_files: noDirectSkillFiles,
    added_skills: addedSkills,
    skill_scripts: count((record) => /^skills\/[^/]+\/scripts\//.test(record.path)),
    all_scripts: count((record) => /^skills\/[^/]+\/scripts\//.test(record.path) || record.path === 'scripts/codex-dev.ts'),
    deleted_repo_profile_cache_scripts: count((record) => /\/scripts\/repo-profile-cache\.py$/.test(record.path) && record.status === 'D'),
  };
}

function assertSummary(summary, expected = null) {
  if (expected) {
    if (summary.total !== expected.total) {
      throw new Error(`total 应为 ${expected.total}，实际 ${summary.total}。`);
    }
    return;
  }
  const legacyExpected = {
    total: 422,
    implementation_targets: 237,
    evidence_only: 185,
    skill_runtime: 215,
    cli_runtime: 19,
    support: 3,
    ce_skills: 29,
    direct_counterpart_skills: 25,
    no_direct_counterpart_skills: 4,
    direct_counterpart_skill_files: 201,
    no_direct_counterpart_skill_files: 14,
    skill_scripts: 46,
    all_scripts: 47,
    deleted_repo_profile_cache_scripts: 9,
  };
  for (const [key, value] of Object.entries(legacyExpected)) {
    if (summary[key] !== value) throw new Error(`${key} 应为 ${value}，实际 ${summary[key]}。`);
  }
  const expectedAdded = ['ce-babysit-pr', 'ce-handoff', 'ce-retune'];
  if (JSON.stringify(summary.added_skills) !== JSON.stringify(expectedAdded)) {
    throw new Error(`新增 Skill 集合不匹配：${summary.added_skills.join(', ')}`);
  }
}

function roleFor(filePath) {
  if (filePath.endsWith('/SKILL.md')) return 'entry-contract';
  if (filePath.includes('/scripts/')) return 'deterministic-helper';
  if (filePath.includes('/evals/') || filePath.includes('/tests/')) return 'evaluation';
  if (filePath.includes('/schemas/') || filePath.endsWith('.schema.json')) return 'machine-contract';
  if (filePath.includes('/references/') || filePath.endsWith('.md')) return 'reference-contract';
  return 'support-asset';
}

function buildCurrentInventory({ schemaVersion = 'spec-first-current-skill-package-inventory/v1' } = {}) {
  const sourcePaths = git(REPO_ROOT, [
    'ls-files',
    '--cached',
    '--others',
    '--exclude-standard',
    '--',
    'skills',
  ]).trimEnd().split('\n').filter(Boolean)
    // 只纳入规范普通文件；未跟踪目录和符号链接不是包文件，不能进入哈希或文件读取。
    .filter((relativePath) => {
      try {
        return fs.lstatSync(path.join(REPO_ROOT, relativePath)).isFile();
      } catch {
        return false;
      }
    })
    .sort((left, right) => left.localeCompare(right));
  const skillDirs = [...new Set(sourcePaths
    .filter((relativePath) => /^skills\/[^/]+\/SKILL\.md$/.test(relativePath))
    .map((relativePath) => relativePath.split('/')[1]))].sort();
  const files = sourcePaths.map((relativePath) => {
    const content = fs.readFileSync(path.join(REPO_ROOT, relativePath));
    return {
      path: relativePath,
      skill: relativePath.split('/')[1],
      owner_role: roleFor(relativePath),
      bytes: content.length,
      sha256: sha256(content),
    };
  });
  const manifest = files.map((file) => `${file.path}\0${file.sha256}`).join('\n');
  const counts = Object.fromEntries(skillDirs.map((skill) => [
    skill,
    files.filter((file) => file.skill === skill).length,
  ]));
  return {
    schema_version: schemaVersion,
    source_head: git(REPO_ROOT, ['rev-parse', 'HEAD']).trim(),
    skills_tree_oid: git(REPO_ROOT, ['rev-parse', 'HEAD:skills']).trim(),
    source_mode: 'working-tree',
    manifest_sha256: sha256(manifest),
    skill_count: skillDirs.length,
    file_count: files.length,
    per_skill_counts: counts,
    files,
  };
}

function groupFor(filePath) {
  if (filePath.startsWith('skills/') || filePath.startsWith('.agents/skills/')) return 'G01';
  if (filePath.startsWith('docs/')) return 'G02';
  if (filePath.startsWith('tests/')) return 'G03';
  if (filePath.startsWith('src/')) return 'G04';
  if (filePath.startsWith('.compound-engineering/config')) return 'G06';
  if (ROOT_METADATA_PATHS.has(filePath)) return 'G06';
  if (filePath === 'plugin.json') return 'G05';
  if (filePath.startsWith('.') || filePath.startsWith('.github/')) return 'G05';
  return 'G06';
}

function v2RoleFor(filePath) {
  const groupId = groupFor(filePath);
  if (groupId === 'G01') {
    if (filePath.endsWith('/SKILL.md')) return 'entry-contract';
    if (filePath.includes('/scripts/')) return 'deterministic-helper';
    if (filePath.includes('/references/')) return 'reference-contract';
    return 'support-asset';
  }
  if (groupId === 'G02') return 'documentation-evidence';
  if (groupId === 'G03') return 'evaluation';
  if (groupId === 'G04') return 'implementation-evidence';
  if (groupId === 'G05') return 'host-metadata-evidence';
  return filePath.startsWith('.compound-engineering/config')
    ? 'config-rename-evidence'
    : 'root-metadata-evidence';
}

function countBy(items, selector) {
  return items.reduce((counts, item) => {
    const key = selector(item);
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function assertExactCounts(actual, expected, label) {
  const actualKeys = Object.keys(actual).sort();
  const expectedKeys = Object.keys(expected).sort();
  if (JSON.stringify(actualKeys) !== JSON.stringify(expectedKeys)) {
    throw new Error(`${label} keys mismatch: ${JSON.stringify(actual)}.`);
  }
  for (const [key, value] of Object.entries(expected)) {
    if (actual[key] !== value) throw new Error(`${label} ${key} must be ${value}, got ${actual[key] || 0}.`);
  }
}

function assertFullWindowFacts(nameStatus, nameStatusContent, expected = FULL_WINDOW_FACTS) {
  if (nameStatus.length !== expected.total) {
    throw new Error(`full-window path count must be ${expected.total}, got ${nameStatus.length}.`);
  }
  if (sha256(nameStatusContent) !== expected.name_status_sha256) {
    throw new Error('full-window name-status SHA-256 mismatch.');
  }
  const changedPaths = `${nameStatus.map((entry) => entry.path).sort().join('\n')}\n`;
  if (sha256(changedPaths) !== expected.changed_path_sha256) {
    throw new Error('full-window changed-path SHA-256 mismatch.');
  }
  assertExactCounts(countBy(nameStatus, (entry) => entry.status), expected.status_counts, 'full-window status count');
  assertExactCounts(countBy(nameStatus, (entry) => groupFor(entry.path)), expected.group_counts, 'full-window group count');
}

function isSafeRelativePath(value) {
  return typeof value === 'string'
    && value.length > 0
    && !path.isAbsolute(value)
    && !value.includes('\\')
    && !value.split('/').some((segment) => segment === '' || segment === '.' || segment === '..');
}

function isStringArray(value, allowEmpty = true) {
  return Array.isArray(value)
    && (allowEmpty || value.length > 0)
    && value.every((entry) => typeof entry === 'string' && entry.length > 0);
}

function isRunOutput(relativePath) {
  return V2_RUN_OUTPUTS.includes(relativePath)
    || relativePath.startsWith(`${V2_PATCH_DIR}/`)
    || relativePath === CE_LOCALIZATION_VALIDATION_DIR
    || relativePath.startsWith(`${CE_LOCALIZATION_VALIDATION_DIR}/`);
}

function canonicalSourceFiles(repoRoot = REPO_ROOT) {
  const root = path.resolve(repoRoot);
  const files = [];
  const visit = (relativePath) => {
    if (isRunOutput(relativePath)) return;
    const absolutePath = path.join(root, relativePath);
    let stat;
    try { stat = fs.lstatSync(absolutePath); } catch { return; }
    if (stat.isSymbolicLink()) return;
    if (stat.isFile()) {
      files.push(relativePath);
      return;
    }
    if (!stat.isDirectory()) return;
    for (const child of fs.readdirSync(absolutePath).sort()) {
      visit(path.posix.join(relativePath, child));
    }
  };
  for (const sourceRoot of CANONICAL_SOURCE_ROOTS) visit(sourceRoot);
  return files.sort();
}

function canonicalSourceTreeHash(repoRoot = REPO_ROOT) {
  const root = path.resolve(repoRoot);
  const manifest = canonicalSourceFiles(root).map((relativePath) => {
    const content = fs.readFileSync(path.join(root, relativePath));
    return `${relativePath}\0${sha256(content)}`;
  }).join('\n');
  return sha256(manifest);
}

function buildTargetSourceSnapshot(repoRoot = REPO_ROOT, inventory = null) {
  const root = path.resolve(repoRoot);
  const sourceInventory = inventory || buildCurrentInventory();
  const dirtyOutput = git(root, ['status', '--porcelain=v1', '--untracked-files=all']);
  const dirtyPaths = dirtyOutput
    .split('\n')
    .filter(Boolean)
    .map((line) => line.slice(3).replace(/^"|"$/g, '').split(' -> ').pop())
    .filter((relativePath) => !isRunOutput(relativePath))
    .sort();
  const dirtyPathManifest = dirtyPaths.length ? `${dirtyPaths.join('\n')}\n` : '';
  return {
    repository: path.basename(root),
    head: git(root, ['rev-parse', 'HEAD']).trim(),
    dirty: dirtyPaths.length > 0,
    dirty_paths: dirtyPaths,
    dirty_path_manifest_sha256: sha256(dirtyPathManifest),
    source_tree_hash: canonicalSourceTreeHash(root),
    inventory_hash: sha256(stableJson(sourceInventory)),
    scope_contract: {
      source_roots: [...CANONICAL_SOURCE_ROOTS],
      excluded_run_outputs: [
        ...V2_RUN_OUTPUTS,
        `${V2_PATCH_DIR}/**`,
        `${CE_LOCALIZATION_VALIDATION_DIR}/**`,
      ],
    },
    hash_algorithm: { name: 'sha256', version: 'canonical-source-manifest-v1' },
  };
}

function assertSnapshotEqual(actual, expected) {
  const fields = [
    'repository',
    'head',
    'dirty',
    'dirty_path_manifest_sha256',
    'source_tree_hash',
    'inventory_hash',
  ];
  for (const field of fields) {
    if (!actual || actual[field] !== expected[field]) {
      throw new Error(`target source snapshot mismatch: ${field}`);
    }
  }
  if (actual && expected && ('dirty_paths' in actual || 'dirty_paths' in expected)) {
    if (JSON.stringify(actual.dirty_paths || []) !== JSON.stringify(expected.dirty_paths || [])) {
      throw new Error('target source snapshot mismatch: dirty_paths');
    }
  }
  if (actual && expected && ('scope_contract' in actual || 'scope_contract' in expected)) {
    if (JSON.stringify(actual.scope_contract || null) !== JSON.stringify(expected.scope_contract || null)) {
      throw new Error('target source snapshot mismatch: scope_contract');
    }
  }
}

function validateAdjudicationArtifact(artifact, {
  nameStatus,
  upstream,
  nameStatusSha256,
  targetSourceSnapshot,
  expectedPackageIds = PACKAGE_IDS,
} = {}) {
  if (!artifact || typeof artifact !== 'object' || Array.isArray(artifact)) {
    throw new Error('adjudication artifact must be an object');
  }
  if (artifact.schema_version !== ADJUDICATION_SCHEMA_VERSION) {
    throw new Error(`adjudication schema_version must be ${ADJUDICATION_SCHEMA_VERSION}`);
  }
  if (artifact.join_key !== ADJUDICATION_JOIN_KEY) {
    throw new Error(`adjudication join_key must be ${ADJUDICATION_JOIN_KEY}`);
  }
  if (!artifact.producer || artifact.producer.kind !== 'llm-adjudication') {
    throw new Error('adjudication producer.kind must be llm-adjudication');
  }
  if (artifact.producer.status !== undefined && !['confirmed', 'degraded'].includes(artifact.producer.status)) {
    throw new Error('adjudication producer.status is invalid');
  }
  if (!artifact.upstream || artifact.upstream.repository !== upstream.repository
    || artifact.upstream.base !== upstream.base
    || artifact.upstream.head !== upstream.head
    || artifact.upstream.name_status_sha256 !== nameStatusSha256) {
    throw new Error('adjudication upstream snapshot mismatch');
  }
  assertSnapshotEqual(artifact.target_source_snapshot, targetSourceSnapshot);
  if (!Array.isArray(nameStatus) || !Array.isArray(artifact.records)
    || artifact.records.length !== nameStatus.length) {
    throw new Error(`adjudication record count must be ${nameStatus ? nameStatus.length : '<unknown>'}`);
  }

  const expectedByPath = new Map(nameStatus.map((entry) => [entry.path, entry]));
  const seen = new Set();
  const records = new Map();
  for (const record of artifact.records) {
    if (!record || typeof record !== 'object' || !isSafeRelativePath(record.path)) {
      throw new Error('adjudication record path is invalid');
    }
    if (seen.has(record.path)) throw new Error(`adjudication path duplicated: ${record.path}`);
    seen.add(record.path);
    const upstreamEntry = expectedByPath.get(record.path);
    if (!upstreamEntry) throw new Error(`adjudication path is outside name-status: ${record.path}`);
    if (record.old_path !== undefined && record.old_path !== upstreamEntry.old_path) {
      throw new Error(`adjudication old_path mismatch: ${record.path}`);
    }
    if (!V2_GROUPS.has(record.group_id) || record.group_id !== groupFor(record.path)) {
      throw new Error(`adjudication group_id mismatch: ${record.path}`);
    }
    if (record.surface !== surfaceFor(record.path) || record.role !== v2RoleFor(record.path)) {
      throw new Error(`adjudication deterministic classification mismatch: ${record.path}`);
    }
    const isG01 = record.group_id === 'G01';
    if (isG01) {
      const expectedPackageId = PACKAGE_BY_SURFACE[record.surface];
      if (!expectedPackageId || !expectedPackageIds.includes(expectedPackageId)
        || record.package_id !== expectedPackageId) {
        throw new Error(`G01 record package_id mismatch: ${record.path}`);
      }
    } else if (record.package_id !== null) {
      throw new Error(`non-G01 record package_id must be null: ${record.path}`);
    }
    if (!CLOSURE_PROFILES.has(record.closure_profile)) {
      throw new Error(`closure_profile invalid: ${record.path}`);
    }
    if (!V2_TARGET_ACTIONS.has(record.target_action)) {
      throw new Error(`v2 target_action invalid: ${record.path} -> ${record.target_action}`);
    }
    if (!EVIDENCE_STATUSES.has(record.evidence_status)) {
      throw new Error(`v2 evidence_status invalid: ${record.path}`);
    }
    if (typeof record.degraded !== 'boolean') {
      throw new Error(`degraded must be boolean: ${record.path}`);
    }
    if (!isStringArray(record.source_refs, false)
      || !isStringArray(record.test_refs, false)
      || !isStringArray(record.limitations, false)) {
      throw new Error(`source_refs/test_refs/limitations are required: ${record.path}`);
    }
    if (typeof record.test_owner !== 'string' || record.test_owner.length === 0) {
      throw new Error(`test_owner is required: ${record.path}`);
    }
    if (!isStringArray(record.implementation_targets)
      || new Set(record.implementation_targets).size !== record.implementation_targets.length
      || record.implementation_targets.some((target) => !isSafeRelativePath(target))) {
      throw new Error(`implementation_targets invalid: ${record.path}`);
    }
    const ownerPresent = typeof record.canonical_owner === 'string' && record.canonical_owner.length > 0;
    const unitPresent = typeof record.implementation_unit === 'string'
      && /^U\d+[a-z]?$/.test(record.implementation_unit);
    const expectedClosureProfile = record.target_action === 'out-of-scope-by-product-decision'
      ? 'product-excluded'
      : (isG01 ? 'source-adjudication' : 'evidence-only');
    if (record.closure_profile !== expectedClosureProfile) {
      throw new Error(`closure_profile mismatch: ${record.path}`);
    }
    if (record.closure_profile === 'source-adjudication') {
      if (!ownerPresent || !unitPresent || record.implementation_targets.length === 0) {
        throw new Error(`source-adjudication requires owner/unit/targets: ${record.path}`);
      }
      if (record.evidence_status === 'not-applicable') {
        throw new Error(`source-adjudication cannot be not-applicable: ${record.path}`);
      }
    } else if (record.closure_profile === 'evidence-only') {
      if (!ownerPresent || !unitPresent || record.implementation_targets.length !== 0) {
        throw new Error(`evidence-only requires group owner/unit and no implementation_targets: ${record.path}`);
      }
      if (record.evidence_status === 'not-applicable') {
        throw new Error(`evidence-only cannot be not-applicable: ${record.path}`);
      }
    } else {
      if (record.target_action !== 'out-of-scope-by-product-decision'
        || record.evidence_status !== 'not-applicable'
        || ownerPresent || unitPresent || record.implementation_targets.length !== 0) {
        throw new Error(`product-excluded fields are inconsistent: ${record.path}`);
      }
    }
    if (record.evidence_status === 'planned' && !record.degraded) {
      throw new Error(`planned record must be degraded: ${record.path}`);
    }
    if (record.evidence_status === 'confirmed' && record.degraded) {
      throw new Error(`confirmed record cannot be degraded: ${record.path}`);
    }
    if (record.evidence_status === 'not-applicable' && record.degraded) {
      throw new Error(`not-applicable record cannot be degraded: ${record.path}`);
    }
    records.set(record.path, record);
  }
  for (const entry of nameStatus) {
    if (!seen.has(entry.path)) throw new Error(`adjudication missing path: ${entry.path}`);
  }
  return records;
}

function validateAdjudicationInput(input, { nameStatus, upstream, nameStatusSha256, targetSourceSnapshot } = {}) {
  if (!input || input.schema_version !== 'ce-upstream-adjudication-input/v1') {
    throw new Error('adjudication input schema_version must be ce-upstream-adjudication-input/v1');
  }
  if (!input.producer || input.producer.kind !== 'deterministic-path-facts') {
    throw new Error('adjudication input producer.kind must be deterministic-path-facts');
  }
  if (input.join_key !== ADJUDICATION_JOIN_KEY) throw new Error('adjudication input join_key mismatch');
  if (!input.upstream || input.upstream.repository !== upstream.repository
    || input.upstream.base !== upstream.base || input.upstream.head !== upstream.head
    || input.upstream.name_status_sha256 !== nameStatusSha256) {
    throw new Error('adjudication input upstream snapshot mismatch');
  }
  assertSnapshotEqual(input.target_source_snapshot, targetSourceSnapshot);
  if (!Array.isArray(input.records) || input.records.length !== nameStatus.length) {
    throw new Error(`adjudication input record count must be ${nameStatus.length}`);
  }
  const expected = new Set(nameStatus.map((entry) => entry.path));
  const seen = new Set();
  for (const record of input.records) {
    if (!isSafeRelativePath(record.path) || seen.has(record.path) || !expected.has(record.path)) {
      throw new Error(`adjudication input path join mismatch: ${record.path}`);
    }
    seen.add(record.path);
    if (record.group_id !== groupFor(record.path) || record.role !== v2RoleFor(record.path)) {
      throw new Error(`adjudication input deterministic classification mismatch: ${record.path}`);
    }
  }
  if (seen.size !== expected.size) throw new Error('adjudication input missing path');
  return true;
}

function buildPackageSummary(records, expectedPackageIds = PACKAGE_IDS) {
  const grouped = new Map(expectedPackageIds.map((packageId) => [packageId, []]));
  for (const record of records) {
    if (record.group_id === 'G01') {
      if (!grouped.has(record.package_id)) throw new Error(`unknown package_id: ${record.package_id}`);
      grouped.get(record.package_id).push(record);
    }
  }
  const summary = expectedPackageIds.map((packageId) => {
    const entries = grouped.get(packageId);
    if (!entries || entries.length === 0) throw new Error(`package_summary missing ${packageId}`);
    const unique = (field) => [...new Set(entries.map((entry) => entry[field]).filter((value) => value !== null && value !== undefined))];
    const owners = unique('canonical_owner');
    const units = unique('implementation_unit');
    const actions = unique('target_action');
    const statuses = unique('evidence_status');
    const testOwners = unique('test_owner');
    const closureProfiles = unique('closure_profile');
    const surfaces = unique('surface');
    const excluded = actions.length === 1 && actions[0] === 'out-of-scope-by-product-decision';
    if (surfaces.length !== 1 || surfaces[0] !== SURFACE_BY_PACKAGE[packageId]) {
      throw new Error(`package_summary surface mismatch: ${packageId}`);
    }
    if (actions.length !== 1 || testOwners.length !== 1 || closureProfiles.length !== 1) {
      throw new Error(`package_summary semantic fields are not single-valued: ${packageId}`);
    }
    if (excluded) {
      if (owners.length !== 0 || units.length !== 0 || statuses.length !== 1 || statuses[0] !== 'not-applicable') {
        throw new Error(`package_summary product exclusion is inconsistent: ${packageId}`);
      }
    } else if (owners.length !== 1 || units.length !== 1 || statuses.includes('not-applicable')) {
      throw new Error(`package_summary owner/unit/status is inconsistent: ${packageId}`);
    }
    return {
      package_id: packageId,
      surface: surfaces[0],
      changed_path_count: entries.length,
      canonical_owner: excluded ? null : owners[0],
      implementation_unit: excluded ? null : units[0],
      implementation_targets: [...new Set(entries.flatMap((entry) => entry.implementation_targets))].sort(),
      target_action: actions[0],
      evidence_status: excluded ? 'not-applicable' : (statuses.every((status) => status === 'confirmed') ? 'confirmed' : 'planned'),
      degraded: excluded ? false : entries.some((entry) => entry.degraded),
      closure_profile: closureProfiles[0],
      source_refs: [...new Set(entries.flatMap((entry) => entry.source_refs))].sort(),
      test_owner: testOwners[0],
      test_refs: [...new Set(entries.flatMap((entry) => entry.test_refs))],
      limitations: [...new Set(entries.flatMap((entry) => entry.limitations))].sort(),
    };
  });
  const expectedPathCount = expectedPackageIds.length === PACKAGE_IDS.length
    ? FULL_WINDOW_FACTS.group_counts.G01
    : records.filter((record) => record.group_id === 'G01').length;
  const actualPathCount = summary.reduce((total, entry) => total + entry.changed_path_count, 0);
  if (summary.length !== expectedPackageIds.length || actualPathCount !== expectedPathCount) {
    throw new Error(`package_summary aggregate mismatch: ${summary.length} packages / ${actualPathCount} paths.`);
  }
  return summary;
}

const OWNER_BY_SURFACE = Object.freeze({
  'ce-brainstorm': 'skills/spec-brainstorm/SKILL.md',
  'ce-code-review': 'skills/spec-code-review/SKILL.md',
  'ce-commit': 'skills/spec-commit/SKILL.md',
  'ce-commit-push-pr': 'skills/spec-commit-push-pr/SKILL.md',
  'ce-compound': 'skills/spec-compound/SKILL.md',
  'ce-compound-refresh': 'skills/spec-compound-refresh/SKILL.md',
  'ce-debug': 'skills/spec-debug/SKILL.md',
  'ce-doc-review': 'skills/spec-doc-review/SKILL.md',
  'ce-dogfood': 'skills/spec-dogfood/SKILL.md',
  'ce-explain': 'skills/spec-explain/SKILL.md',
  'ce-handoff': 'skills/spec-handoff/SKILL.md',
  'ce-ideate': 'skills/spec-ideate/SKILL.md',
  'ce-optimize': 'skills/spec-optimize/SKILL.md',
  'ce-plan': 'skills/spec-plan/SKILL.md',
  'ce-pov': 'skills/spec-pov/SKILL.md',
  'ce-product-pulse': 'skills/spec-product-pulse/SKILL.md',
  'ce-promote': 'skills/spec-promote/SKILL.md',
  'ce-prototype': 'skills/spec-prototype/SKILL.md',
  'ce-resolve-pr-feedback': 'skills/spec-resolve-pr-feedback/SKILL.md',
  'ce-riffrec-feedback-analysis': 'skills/spec-riffrec-feedback-analysis/SKILL.md',
  'ce-setup': 'skills/spec-runtime-setup/SKILL.md',
  'ce-simplify-code': 'skills/spec-simplify-code/SKILL.md',
  'ce-strategy': 'skills/spec-strategy/SKILL.md',
  'ce-sweep': 'skills/spec-sweep/SKILL.md',
  'ce-test-browser': 'skills/spec-test-browser/SKILL.md',
  'ce-test-xcode': 'skills/spec-test-xcode/SKILL.md',
  'ce-work': 'skills/spec-work/SKILL.md',
  'ce-worktree': 'skills/spec-worktree/SKILL.md',
  lfg: 'skills/spec-lfg/SKILL.md',
  'ce-skill-work': 'skills/spec-write-skill/SKILL.md',
});

const UNIT_BY_SURFACE = Object.freeze({
  'ce-brainstorm': 'U4', 'ce-code-review': 'U3', 'ce-commit': 'U2b',
  'ce-commit-push-pr': 'U2b', 'ce-compound': 'U5a', 'ce-compound-refresh': 'U5a',
  'ce-debug': 'U2a', 'ce-doc-review': 'U3', 'ce-dogfood': 'U5c', 'ce-explain': 'U5b',
  'ce-handoff': 'U2b', 'ce-ideate': 'U4', 'ce-optimize': 'U5a', 'ce-plan': 'U4',
  'ce-pov': 'U3', 'ce-product-pulse': 'U5b', 'ce-promote': 'U5b', 'ce-prototype': 'U4',
  'ce-resolve-pr-feedback': 'U2b', 'ce-riffrec-feedback-analysis': 'U5b', 'ce-setup': 'U6',
  'ce-simplify-code': 'U5a', 'ce-strategy': 'U4', 'ce-sweep': 'U5b',
  'ce-test-browser': 'U5c', 'ce-test-xcode': 'U5c', 'ce-work': 'U2b',
  'ce-worktree': 'U2a', lfg: 'U2b', 'ce-skill-work': 'U1',
});

function buildAdjudicationInput(nameStatus, {
  upstream = { repository: 'compound-engineering-plugin', base: BASE, head: HEAD },
  targetSourceSnapshot,
  inventory,
  nameStatusContent,
} = {}) {
  if (!targetSourceSnapshot || !inventory) throw new Error('adjudication input requires target source snapshot and inventory');
  const inventoryPaths = new Set((inventory.files || []).map((entry) => entry.path));
  return {
    schema_version: 'ce-upstream-adjudication-input/v1',
    producer: { kind: 'deterministic-path-facts', version: 'v1', status: 'confirmed' },
    join_key: ADJUDICATION_JOIN_KEY,
    upstream: { ...upstream, name_status_sha256: sha256(nameStatusContent || '') },
    target_source_snapshot: targetSourceSnapshot,
    deterministic_facts: {
      path_count: nameStatus.length,
      status_counts: countBy(nameStatus, (entry) => entry.status),
      group_counts: countBy(nameStatus, (entry) => groupFor(entry.path)),
      name_status_sha256: sha256(nameStatusContent || ''),
      changed_path_sha256: sha256(`${nameStatus.map((entry) => entry.path).sort().join('\n')}\n`),
    },
    records: nameStatus.map((entry, index) => {
      const groupId = groupFor(entry.path);
      const surface = surfaceFor(entry.path);
      const packageId = groupId === 'G01' ? PACKAGE_BY_SURFACE[surface] : null;
      return {
        audit_id: `A${String(index + 1).padStart(3, '0')}`,
        path: entry.path,
        ...(entry.old_path ? { old_path: entry.old_path } : {}),
        status: entry.status,
        group_id: groupId,
        package_id: packageId,
        surface,
        role: v2RoleFor(entry.path),
        source_facts: {
          current_owner_surface_candidate: groupId === 'G01' ? OWNER_BY_SURFACE[surface] || null : null,
          owner_exists_in_inventory: Boolean(OWNER_BY_SURFACE[surface] && inventoryPaths.has(OWNER_BY_SURFACE[surface])),
        },
      };
    }),
    semantic_decisions: 'omitted: produced only by the authorized adjudication producer',
  };
}

function buildV2Ledger(nameStatus, artifact, options = {}) {
  const inventory = options.inventory || buildCurrentInventory();
  const targetSourceSnapshot = options.targetSourceSnapshot || buildTargetSourceSnapshot(REPO_ROOT, inventory);
  const upstream = options.upstream || {
    repository: 'compound-engineering-plugin',
    base: BASE,
    head: HEAD,
  };
  const nameStatusSha256 = options.nameStatusSha256 || sha256(options.nameStatusContent || '');
  const adjudications = validateAdjudicationArtifact(artifact, {
    nameStatus,
    upstream,
    nameStatusSha256,
    targetSourceSnapshot,
    expectedPackageIds: options.expectedPackageIds || PACKAGE_IDS,
  });
  const records = nameStatus.map((entry, index) => {
    const adjudication = adjudications.get(entry.path);
    return {
      audit_id: adjudication.audit_id || `A${String(index + 1).padStart(3, '0')}`,
      status: entry.status,
      path: entry.path,
      ...(entry.old_path ? { old_path: entry.old_path } : {}),
      group_id: adjudication.group_id,
      package_id: adjudication.package_id,
      surface: adjudication.surface,
      role: adjudication.role,
      canonical_owner: adjudication.canonical_owner,
      implementation_unit: adjudication.implementation_unit,
      implementation_targets: adjudication.implementation_targets,
      target_action: adjudication.target_action,
      evidence_status: adjudication.evidence_status,
      degraded: adjudication.degraded,
      source_refs: adjudication.source_refs,
      test_owner: adjudication.test_owner || adjudication.canonical_owner,
      test_refs: adjudication.test_refs,
      limitations: adjudication.limitations,
      closure_profile: adjudication.closure_profile,
    };
  });
  const packageSummary = buildPackageSummary(records, options.expectedPackageIds || PACKAGE_IDS);
  return {
    schema_version: V2_SCHEMA_VERSION,
    upstream: { ...upstream, name_status_sha256: nameStatusSha256 },
    target_source_snapshot: targetSourceSnapshot,
    adjudication: {
      schema_version: ADJUDICATION_SCHEMA_VERSION,
      join_key: ADJUDICATION_JOIN_KEY,
      artifact_sha256: sha256(stableJson(artifact)),
      producer: artifact.producer,
    },
    records,
    package_summary: packageSummary,
  };
}

function ledgerHash(ledger) {
  return sha256(stableJson(ledger));
}

const PATCH_MUTABLE_FIELDS = new Set(['evidence_status', 'degraded', 'source_refs', 'test_owner', 'test_refs', 'limitations']);
const MERGE_ORDER = Object.freeze(['U1', 'U2a', 'U3', 'U2b', 'U4', 'U5a', 'U5b', 'U5c', 'U6']);

function validateLedgerPatch(patch, currentLedger, { expectedUnit = null } = {}) {
  if (!patch || patch.schema_version !== 'ce-upstream-ledger-patch/v1') {
    throw new Error('ledger patch schema_version must be ce-upstream-ledger-patch/v1');
  }
  if (!patch.unit_id || !/^U\d+[a-z]?$/.test(patch.unit_id)) throw new Error('ledger patch unit_id is invalid');
  if (expectedUnit && patch.unit_id !== expectedUnit) throw new Error(`ledger patch unit mismatch: ${patch.unit_id}`);
  if (patch.base_ledger_sha256 !== ledgerHash(currentLedger)) throw new Error('ledger patch base ledger hash mismatch');
  assertSnapshotEqual(patch.base_target_source_snapshot, currentLedger.target_source_snapshot);
  assertSnapshotEqual(patch.result_target_source_snapshot, currentLedger.target_source_snapshot);
  if (!Array.isArray(patch.affected_paths) || patch.affected_paths.length === 0) throw new Error('ledger patch affected_paths is required');
  const seen = new Set();
  const records = new Map((currentLedger.records || []).map((record) => [record.path, record]));
  for (const delta of patch.affected_paths) {
    if (!delta || !isSafeRelativePath(delta.path) || seen.has(delta.path)) throw new Error(`ledger patch duplicate/invalid path: ${delta && delta.path}`);
    seen.add(delta.path);
    const current = records.get(delta.path);
    if (!current) throw new Error(`ledger patch path outside ledger: ${delta.path}`);
    if (delta.unit_id !== patch.unit_id) throw new Error(`ledger patch path unit mismatch: ${delta.path}`);
    if (current.implementation_unit !== patch.unit_id) throw new Error(`ledger patch path owner mismatch: ${delta.path}`);
    if (!delta.changes || typeof delta.changes !== 'object' || Array.isArray(delta.changes)) throw new Error(`ledger patch changes missing: ${delta.path}`);
    for (const field of Object.keys(delta.changes)) {
      if (!PATCH_MUTABLE_FIELDS.has(field)) throw new Error(`ledger patch unauthorized field: ${field}`);
    }
    if (delta.changes.evidence_status !== undefined && !EVIDENCE_STATUSES.has(delta.changes.evidence_status)) throw new Error(`ledger patch evidence_status invalid: ${delta.path}`);
    if (delta.changes.degraded !== undefined && typeof delta.changes.degraded !== 'boolean') throw new Error(`ledger patch degraded invalid: ${delta.path}`);
    for (const field of ['source_refs', 'test_refs', 'limitations']) {
      if (delta.changes[field] !== undefined && !isStringArray(delta.changes[field], false)) throw new Error(`ledger patch ${field} invalid: ${delta.path}`);
    }
    if (delta.changes.test_owner !== undefined && (typeof delta.changes.test_owner !== 'string' || !delta.changes.test_owner)) throw new Error(`ledger patch test_owner invalid: ${delta.path}`);
  }
  return true;
}

function mergeLedgerPatch(currentLedger, patch, options = {}) {
  validateLedgerPatch(patch, currentLedger, options);
  const allowedPaths = new Set(patch.affected_paths.map((delta) => delta.path));
  const deltaByPath = new Map(patch.affected_paths.map((delta) => [delta.path, delta.changes]));
  const records = currentLedger.records.map((record) => allowedPaths.has(record.path)
    ? { ...record, ...deltaByPath.get(record.path) }
    : record);
  const next = {
    ...currentLedger,
    target_source_snapshot: patch.result_target_source_snapshot,
    records,
    package_summary: buildPackageSummary(records, options.expectedPackageIds || PACKAGE_IDS),
  };
  for (const record of records) {
    if (!EVIDENCE_STATUSES.has(record.evidence_status)) throw new Error(`v2 evidence_status invalid: ${record.path}`);
    if (typeof record.degraded !== 'boolean') throw new Error(`degraded must be boolean: ${record.path}`);
    if (!isStringArray(record.source_refs, false)
      || !isStringArray(record.test_refs, false)
      || !isStringArray(record.limitations, false)) {
      throw new Error(`source_refs/test_refs/limitations are required: ${record.path}`);
    }
    if (typeof record.test_owner !== 'string' || record.test_owner.length === 0) {
      throw new Error(`test_owner is required: ${record.path}`);
    }
    if (record.evidence_status === 'planned' && !record.degraded) {
      throw new Error(`planned record must be degraded: ${record.path}`);
    }
    if (record.evidence_status === 'confirmed' && record.degraded) {
      throw new Error(`confirmed record cannot be degraded: ${record.path}`);
    }
    if (record.evidence_status === 'not-applicable' && record.degraded) {
      throw new Error(`not-applicable record cannot be degraded: ${record.path}`);
    }
  }
  return next;
}

function mergeLedgerPatches(initialLedger, patches, { order = MERGE_ORDER, expectedPackageIds = PACKAGE_IDS } = {}) {
  if (!Array.isArray(patches)) throw new Error('ledger patches must be an array');
  const unitCounts = countBy(patches, (patch) => patch && patch.unit_id);
  const duplicatedUnits = Object.entries(unitCounts).filter(([, count]) => count > 1).map(([unit]) => unit);
  if (duplicatedUnits.length) throw new Error(`ledger patch unit duplicated: ${duplicatedUnits.join(', ')}`);
  let current = initialLedger;
  const seenUnits = new Set();
  for (const unitId of order) {
    const patch = patches.find((entry) => entry && entry.unit_id === unitId);
    if (!patch) continue;
    if (seenUnits.has(unitId)) throw new Error(`ledger patch unit duplicated: ${unitId}`);
    seenUnits.add(unitId);
    current = mergeLedgerPatch(current, patch, { expectedUnit: unitId, expectedPackageIds });
  }
  const unexpected = patches.filter((patch) => !order.includes(patch && patch.unit_id));
  if (unexpected.length) throw new Error(`ledger patch unit out of merge order: ${unexpected.map((patch) => patch && patch.unit_id).join(', ')}`);
  return current;
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function writeGenerated(relativePath, content) {
  fs.writeFileSync(path.join(REPO_ROOT, relativePath), content, 'utf8');
}

function formatNameStatusSnapshot(content, base, head) {
  return [
    '# CE post-3.20 name-status snapshot',
    '',
    '- repository: `compound-engineering-plugin`',
    `- base: \`${base}\``,
    `- head: \`${head}\``,
    `- generated_from: \`git diff --name-status --find-renames ${base}..${head}\``,
    `- path_count: ${parseNameStatus(content).length}`,
    '',
    '```text',
    content.trimEnd(),
    '```',
    '',
  ].join('\n');
}

function buildSummaryMarkdown(summary, inventory, options = {}) {
  const base = options.base || BASE;
  const head = options.head || HEAD;
  const ledgerPath = options.ledgerPath || LEDGER_PATH;
  const inventoryPath = options.inventoryPath || INVENTORY_PATH;
  return `---\nartifact_type: confirmed-reconciliation-ledger\nupstream_range: ${base}..${head}\n---\n\n# CE 3.20 Skill/Script Reconciliation\n\n该摘要由 \`scripts/check-ce-upstream-reconciliation.cjs --refresh --ce-repo <path>\` 从固定 Git objects、逐文件审计和当前 Skill source 机械生成。语义裁决仍由逐文件审计与计划拥有。\n\n## 上游区间\n\n- 全部路径：${summary.total}\n- 实施目标：${summary.implementation_targets}（Skill ${summary.skill_runtime} + CLI/runtime ${summary.cli_runtime} + 支撑 ${summary.support}）\n- evidence-only：${summary.evidence_only}\n- CE Skill：${summary.ce_skills}（直接 counterpart ${summary.direct_counterpart_skills}/${summary.direct_counterpart_skill_files} 文件；无直接 counterpart ${summary.no_direct_counterpart_skills}/${summary.no_direct_counterpart_skill_files} 文件）\n- 脚本：${summary.all_scripts}（Skill-local ${summary.skill_scripts} + root development 1）\n- 删除 repo profile cache 脚本：${summary.deleted_repo_profile_cache_scripts}\n\n## 当前 Source Inventory\n\n- canonical Skill：${inventory.skill_count}\n- package 文件：${inventory.file_count}\n- manifest SHA-256：\`${inventory.manifest_sha256}\`\n- HEAD skills tree：\`${inventory.skills_tree_oid}\`\n\n详细逐路径事实见 \`${ledgerPath}\` 与 \`${inventoryPath}\`。\n`;
}

function buildV2SummaryMarkdown(ledger, inventory, options = {}) {
  const base = options.base || BASE;
  const head = options.head || HEAD;
  const ledgerPath = options.ledgerPath || LEDGER_PATH;
  const inventoryPath = options.inventoryPath || INVENTORY_PATH;
  const packagePathCount = ledger.package_summary.reduce((total, entry) => total + entry.changed_path_count, 0);
  const groupCounts = countBy(ledger.records, (record) => record.group_id);
  const packageRows = ledger.package_summary.map((entry) => [
    entry.package_id,
    entry.surface,
    entry.changed_path_count,
    entry.canonical_owner || 'product-excluded',
    entry.implementation_unit || 'not-applicable',
    entry.target_action,
    entry.evidence_status,
  ].join(' | '));
  return `---\nartifact_type: confirmed-reconciliation-ledger\nschema_version: ${V2_SCHEMA_VERSION}\nupstream_range: ${base}..${head}\n---\n\n# CE post-3.20 Full-Window Reconciliation\n\n该摘要由对账器消费独立的 LLM adjudication artifact 后生成。脚本只校验 Git、path、snapshot、schema 与聚合不变量，不生成 owner、action 或 limitation 语义判断。\n\n## 冻结事实\n\n- 路径：${ledger.records.length}\n- 分组：${Object.entries(groupCounts).map(([group, count]) => `${group}=${count}`).join(', ')}\n- package：${ledger.package_summary.length}\n- G01 package 路径：${packagePathCount}\n- adjudication SHA-256：\`${ledger.adjudication.artifact_sha256}\`\n- target source HEAD：\`${ledger.target_source_snapshot.head}\`\n- target source dirty：${ledger.target_source_snapshot.dirty}\n\n## Package Summary\n\npackage_id | surface | paths | canonical_owner | implementation_unit | target_action | evidence_status\n--- | --- | ---: | --- | --- | --- | ---\n${packageRows.join('\n')}\n\n详细逐路径事实见 \`${ledgerPath}\`；当前 source inventory 见 \`${inventoryPath}\`。\n`;
}

function loadSnapshotNameStatus(nameStatusPath = NAME_STATUS_PATH) {
  return fs.readFileSync(nameStatusPath, 'utf8');
}

function loadSnapshotTargetActions(ledgerPath = path.join(REPO_ROOT, LEDGER_PATH)) {
  const snapshot = JSON.parse(fs.readFileSync(ledgerPath, 'utf8'));
  return new Map((snapshot.records || []).map((record) => [record.path, record.target_action]));
}

function main(argv = process.argv.slice(2), runtime = {}) {
  const runGit = runtime.git || git;
  const buildInventory = runtime.buildCurrentInventory || buildCurrentInventory;
  const buildSnapshot = runtime.buildTargetSourceSnapshot || buildTargetSourceSnapshot;
  const expectedPackageIds = runtime.expectedPackageIds || PACKAGE_IDS;
  const fullWindowFacts = runtime.fullWindowFacts || FULL_WINDOW_FACTS;
  const args = parseArgs(argv);
  for (const [label, filePath] of [
    ['audit', args.auditPath],
    ['name-status', args.nameStatusPath],
    ['ledger', args.ledgerPath],
    ['summary', args.summaryPath],
    ['inventory', args.inventoryPath],
  ]) assertRepoPath(filePath, label);
  if (args.adjudicationPath) assertRepoPath(args.adjudicationPath, 'adjudication');
  if (args.prepareAdjudication || args.fullWindow) assertRepoPath(args.adjudicationInputPath, 'adjudication-input');
  if (args.patchDir) assertRepoPath(args.patchDir, 'patch-dir');
  if (args.refresh && !args.ceRepo) {
    throw new Error('--refresh 必须同时提供 --ce-repo，以固定 commit objects 为输入。');
  }
  if (!args.verifyLegacy && !args.fullWindow && !args.prepareAdjudication && !args.filelistPath) {
    throw new Error('新窗口必须提供 --filelist。');
  }
  let nameStatusContent;
  let fullNameStatusContent = null;
  if (args.ceRepo) {
    runGit(args.ceRepo, ['cat-file', '-e', `${args.base}^{commit}`]);
    runGit(args.ceRepo, ['cat-file', '-e', `${args.head}^{commit}`]);
    fullNameStatusContent = runGit(args.ceRepo, ['diff', '--name-status', '--find-renames', `${args.base}..${args.head}`]);
    const fullNameStatus = parseNameStatus(fullNameStatusContent);
    if (args.verifyLegacy || args.fullWindow || args.prepareAdjudication) {
      nameStatusContent = fullNameStatusContent;
    } else {
      const selectedSet = new Set(parseFilelist(fs.readFileSync(args.filelistPath, 'utf8')));
      nameStatusContent = fullNameStatus
        .filter((entry) => selectedSet.has(entry.path))
        .map((entry) => entry.old_path ? `${entry.status}\t${entry.old_path}\t${entry.path}` : `${entry.status}\t${entry.path}`)
        .join('\n') + '\n';
    }
    const legacyObjectWindow = args.base === BASE && args.head === HEAD;
    if (!args.refresh && !args.fullWindow && !args.prepareAdjudication
      && legacyObjectWindow && fs.existsSync(args.nameStatusPath)) {
      if (nameStatusContent !== loadSnapshotNameStatus(args.nameStatusPath)) {
        throw new Error('checked-in name-status 与固定 CE commit objects 不一致。');
      }
    }
  } else {
    nameStatusContent = loadSnapshotNameStatus(args.nameStatusPath);
  }

  const nameStatus = parseNameStatus(nameStatusContent);
  const selection = args.verifyLegacy || args.fullWindow || args.prepareAdjudication ? null : validateSelection(
    fs.readFileSync(args.filelistPath, 'utf8'),
    args.filelistSha256,
    nameStatus,
    fullNameStatusContent ? parseNameStatus(fullNameStatusContent) : null,
  );
  if (args.prepareAdjudication) {
    const inventory = buildInventory({ schemaVersion: 'spec-first-current-skill-package-inventory/v2' });
    const targetSourceSnapshot = buildSnapshot(REPO_ROOT, inventory);
    const upstream = {
      repository: 'compound-engineering-plugin',
      base: args.base,
      head: args.head,
    };
    assertFullWindowFacts(nameStatus, fullNameStatusContent, fullWindowFacts);
    const input = buildAdjudicationInput(nameStatus, {
      upstream,
      targetSourceSnapshot,
      inventory,
      nameStatusContent: fullNameStatusContent,
    });
    const nameStatusOutput = args.nameStatusPath.endsWith('.md')
      ? formatNameStatusSnapshot(nameStatusContent, args.base, args.head)
      : nameStatusContent;
    if (args.refresh) {
      writeGenerated(path.relative(REPO_ROOT, args.nameStatusPath), nameStatusOutput);
      writeGenerated(path.relative(REPO_ROOT, args.adjudicationInputPath), stableJson(input));
      writeGenerated(path.relative(REPO_ROOT, args.inventoryPath), stableJson(inventory));
    } else {
      validateAdjudicationInput(JSON.parse(fs.readFileSync(args.adjudicationInputPath, 'utf8')), {
        nameStatus,
        upstream,
        nameStatusSha256: sha256(fullNameStatusContent),
        targetSourceSnapshot,
      });
      if (fs.readFileSync(args.adjudicationInputPath, 'utf8') !== stableJson(input)) {
        throw new Error(`${args.adjudicationInputPath} 已漂移；运行 --refresh --prepare-adjudication --ce-repo <path>。`);
      }
      if (fs.readFileSync(args.inventoryPath, 'utf8') !== stableJson(inventory)) {
        throw new Error(`${args.inventoryPath} 已漂移；运行 --refresh --prepare-adjudication --ce-repo <path>。`);
      }
      if (fs.readFileSync(args.nameStatusPath, 'utf8') !== nameStatusOutput) {
        throw new Error(`${args.nameStatusPath} 已漂移；运行 --refresh --prepare-adjudication --ce-repo <path>。`);
      }
    }
    process.stdout.write(`${JSON.stringify({
      ok: true,
      schema_version: input.schema_version,
      records: input.records.length,
      target_source_snapshot: targetSourceSnapshot,
    })}\n`);
    return 0;
  }
  if (args.fullWindow) {
    if (!args.adjudicationPath) throw new Error('--full-window 必须提供 --adjudication。');
    if (!args.ceRepo) throw new Error('--full-window 必须提供 --ce-repo。');
    const inventory = buildInventory({ schemaVersion: 'spec-first-current-skill-package-inventory/v2' });
    const targetSourceSnapshot = buildSnapshot(REPO_ROOT, inventory);
    const upstream = {
      repository: 'compound-engineering-plugin',
      base: args.base,
      head: args.head,
    };
    const adjudicationInput = JSON.parse(fs.readFileSync(args.adjudicationInputPath, 'utf8'));
    const adjudication = JSON.parse(fs.readFileSync(args.adjudicationPath, 'utf8'));
    assertFullWindowFacts(nameStatus, fullNameStatusContent, fullWindowFacts);
    validateAdjudicationInput(adjudicationInput, {
      nameStatus,
      upstream,
      nameStatusSha256: sha256(fullNameStatusContent),
      targetSourceSnapshot,
    });
    if (adjudication.input_artifact_sha256 !== sha256(stableJson(adjudicationInput))) {
      throw new Error('adjudication input_artifact_sha256 mismatch');
    }
    let v2Ledger = buildV2Ledger(nameStatus, adjudication, {
      inventory,
      targetSourceSnapshot,
      upstream,
      nameStatusContent: fullNameStatusContent,
      expectedPackageIds,
    });
    if (args.patchDir) {
      const patches = fs.readdirSync(args.patchDir)
        .filter((entry) => entry.endsWith('.json'))
        .sort((left, right) => MERGE_ORDER.indexOf(left.replace(/\.json$/, '')) - MERGE_ORDER.indexOf(right.replace(/\.json$/, '')))
        .map((entry) => JSON.parse(fs.readFileSync(path.join(args.patchDir, entry), 'utf8')));
      v2Ledger = mergeLedgerPatches(v2Ledger, patches, { order: MERGE_ORDER, expectedPackageIds });
    }
    const nameStatusOutput = args.nameStatusPath.endsWith('.md')
      ? formatNameStatusSnapshot(nameStatusContent, args.base, args.head)
      : nameStatusContent;
    const summaryOutput = buildV2SummaryMarkdown(v2Ledger, inventory, args);
    if (args.refresh) {
      writeGenerated(path.relative(REPO_ROOT, args.nameStatusPath), nameStatusOutput);
      writeGenerated(path.relative(REPO_ROOT, args.ledgerPath), stableJson(v2Ledger));
      writeGenerated(path.relative(REPO_ROOT, args.inventoryPath), stableJson(inventory));
      writeGenerated(path.relative(REPO_ROOT, args.summaryPath), summaryOutput);
    } else {
      for (const [filePath, expected] of [
        [args.nameStatusPath, nameStatusOutput],
        [args.ledgerPath, stableJson(v2Ledger)],
        [args.inventoryPath, stableJson(inventory)],
        [args.summaryPath, summaryOutput],
      ]) {
        if (fs.readFileSync(filePath, 'utf8') !== expected) {
          throw new Error(`${filePath} 已漂移；运行 --refresh --full-window --adjudication-input <path> --adjudication <path> --ce-repo <path>。`);
        }
      }
    }
    process.stdout.write(`${JSON.stringify({
      ok: true,
      schema_version: V2_SCHEMA_VERSION,
      records: v2Ledger.records.length,
      packages: v2Ledger.package_summary.length,
      target_source_snapshot: targetSourceSnapshot,
    })}\n`);
    return 0;
  }

  const audit = parseAudit(fs.readFileSync(args.auditPath, 'utf8'), nameStatus.length);
  const legacyTargetActions = args.refresh ? new Map() : loadSnapshotTargetActions(args.ledgerPath);
  const records = buildLedger(nameStatus, audit, {
    legacyTargetActions,
    requireEvidence: !args.verifyLegacy,
  });
  const isLegacyWindow = args.base === LEGACY_BASE && args.head === LEGACY_HEAD && args.auditPath === path.join(REPO_ROOT, AUDIT_PATH);
  const summary = summarize(records, {
    noDirectCounterpart: isLegacyWindow
      ? LEGACY_NO_DIRECT_COUNTERPART
      : CURRENT_NO_DIRECT_COUNTERPART,
  });
  assertSummary(summary, isLegacyWindow ? null : { total: nameStatus.length });
  const inventory = buildInventory();
  const expectedSkillCount = isLegacyWindow ? 35 : 36;
  if (!args.verifyLegacy && inventory.skill_count !== expectedSkillCount) {
    throw new Error(`canonical Skill 应为 ${expectedSkillCount} 个，实际 ${inventory.skill_count}。`);
  }

  const ledger = {
    schema_version: 'ce-upstream-reconciliation/v1',
    upstream: { repository: 'compound-engineering-plugin', base: args.base, head: args.head },
    summary,
    ...(selection ? { selection } : {}),
    records,
  };

  if (args.refresh) {
    const nameStatusOutput = args.nameStatusPath.endsWith('.md')
      ? formatNameStatusSnapshot(nameStatusContent, args.base, args.head)
      : nameStatusContent;
    writeGenerated(path.relative(REPO_ROOT, args.nameStatusPath), nameStatusOutput);
    writeGenerated(path.relative(REPO_ROOT, args.ledgerPath), stableJson(ledger));
    writeGenerated(path.relative(REPO_ROOT, args.inventoryPath), stableJson(inventory));
    writeGenerated(path.relative(REPO_ROOT, args.summaryPath), buildSummaryMarkdown(summary, inventory, args));
  } else {
    const expectedLedger = stableJson(ledger);
    const expectedInventory = stableJson(inventory);
    if (fs.readFileSync(args.ledgerPath, 'utf8') !== expectedLedger) {
      throw new Error(`${args.ledgerPath} 已漂移；运行 --refresh --ce-repo <path>。`);
    }
    if (!args.verifyLegacy
      && fs.readFileSync(args.inventoryPath, 'utf8') !== expectedInventory) {
      throw new Error(`${args.inventoryPath} 已漂移；运行 --refresh --ce-repo <path>。`);
    }
  }
  process.stdout.write(`${JSON.stringify({ ok: true, summary, current_inventory: { skill_count: inventory.skill_count, file_count: inventory.file_count, manifest_sha256: inventory.manifest_sha256 } })}\n`);
  return 0;
}

if (require.main === module) {
  try {
    process.exitCode = main();
  } catch (error) {
    console.error(error && error.message ? error.message : String(error));
    process.exitCode = 1;
  }
}

module.exports = {
  LEGACY_BASE,
  LEGACY_HEAD,
  BASE,
  HEAD,
  CLI_RUNTIME_PATHS,
  SUPPORT_PATHS,
  LEGACY_NO_DIRECT_COUNTERPART,
  CURRENT_NO_DIRECT_COUNTERPART,
  V2_SCHEMA_VERSION,
  V2_TARGET_ACTIONS,
  ADJUDICATION_SCHEMA_VERSION,
  ADJUDICATION_JOIN_KEY,
  CANONICAL_SOURCE_ROOTS,
  PACKAGE_IDS,
  PACKAGE_BY_SURFACE,
  FULL_WINDOW_FACTS,
  CE_LOCALIZATION_VALIDATION_DIR,
  parseFilelist,
  validateSelection,
  parseNameStatus,
  parseAudit,
  buildLedger,
  summarize,
  assertSummary,
  buildCurrentInventory,
  isRunOutput,
  buildTargetSourceSnapshot,
  groupFor,
  v2RoleFor,
  assertFullWindowFacts,
  validateAdjudicationArtifact,
  validateAdjudicationInput,
  buildAdjudicationInput,
  buildPackageSummary,
  buildV2Ledger,
  ledgerHash,
  validateLedgerPatch,
  mergeLedgerPatch,
  mergeLedgerPatches,
  MERGE_ORDER,
  formatNameStatusSnapshot,
  buildV2SummaryMarkdown,
  main,
};
