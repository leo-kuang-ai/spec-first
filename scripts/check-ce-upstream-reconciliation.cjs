#!/usr/bin/env node
'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const REPO_ROOT = path.resolve(__dirname, '..');
const BASE = '7f86be9d02679adeb93951587dee40de42c5bf82';
const HEAD = '1fac0442ee16996913dd0843a063ac279d2c32f4';
const AUDIT_PATH = 'docs/validation/2026-07-30-ce-3-20-file-by-file-diff-audit.md';
const NAME_STATUS_PATH = 'docs/validation/2026-07-30-ce-3-20-name-status.txt';
const LEDGER_PATH = 'docs/validation/2026-07-30-ce-3-20-skill-script-reconciliation.json';
const SUMMARY_PATH = 'docs/validation/2026-07-30-ce-3-20-skill-script-reconciliation.md';
const INVENTORY_PATH = 'docs/validation/2026-07-30-current-skill-package-inventory.json';

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
  'src/utils/frontmatter.ts',
  'src/utils/legacy-cleanup.ts',
  'src/utils/slash-command.ts',
]);

const SUPPORT_PATHS = new Set([
  '.compound-engineering/config.local.example.yaml',
  '.gitattributes',
  'package.json',
]);

const NO_DIRECT_COUNTERPART = new Set([
  'ce-babysit-pr',
  'ce-handoff',
  'ce-retune',
  'ce-setup',
]);

function git(repo, args) {
  return execFileSync('git', ['-C', repo, ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).replace(/\r\n/g, '\n');
}

function sha256(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function parseArgs(argv) {
  const args = { ceRepo: null, refresh: false };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === '--refresh') {
      args.refresh = true;
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
  return args;
}

function parseNameStatus(content) {
  return content.trimEnd().split('\n').filter(Boolean).map((line) => {
    const fields = line.split('\t');
    const status = fields[0];
    if (/^[RC]/.test(status)) {
      if (fields.length !== 3) throw new Error(`无效 rename/copy name-status：${line}`);
      return { status, old_path: fields[1], path: fields[2] };
    }
    if (fields.length !== 2) throw new Error(`无效 name-status：${line}`);
    return { status, path: fields[1] };
  });
}

function parseAudit(content) {
  const headings = [...content.matchAll(/^### F(\d{3})\. `([^`]+)`$/gm)];
  if (headings.length !== 422) {
    throw new Error(`逐文件审计应包含 422 条，实际 ${headings.length} 条。`);
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
      test_owner: verification[1],
    });
  });
  return records;
}

function surfaceFor(filePath) {
  const skillMatch = filePath.match(/^skills\/([^/]+)\//);
  if (skillMatch) return skillMatch[1];
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

function actionFor(verdict) {
  if (verdict.includes('不采纳')) return 'reject';
  if (verdict.includes('删除')) return 'delete-or-retire';
  if (verdict.includes('等价') || verdict.includes('无本次')) return 'regression-only';
  if (verdict.includes('证据')) return 'evidence-only';
  return 'implement-in-current-owner';
}

function buildLedger(nameStatus, auditRecords) {
  const seen = new Set();
  const records = nameStatus.map((entry) => {
    if (seen.has(entry.path)) throw new Error(`name-status 路径重复：${entry.path}`);
    seen.add(entry.path);
    const audit = auditRecords.get(entry.path);
    if (!audit) throw new Error(`name-status 路径未在逐文件审计分类：${entry.path}`);
    return {
      audit_id: audit.audit_id,
      status: entry.status,
      path: entry.path,
      ...(entry.old_path ? { old_path: entry.old_path } : {}),
      ce_skill_or_surface: surfaceFor(entry.path),
      category: categoryFor(entry.path),
      verdict: audit.verdict,
      spec_first_owner: audit.spec_first_owner,
      target_action: actionFor(audit.verdict),
      test_owner: audit.test_owner,
      ...(audit.verdict.includes('不采纳') ? { exception_reason: audit.test_owner } : {}),
    };
  });
  for (const auditPath of auditRecords.keys()) {
    if (!seen.has(auditPath)) throw new Error(`逐文件审计存在区间外路径：${auditPath}`);
  }
  return records;
}

function summarize(records) {
  const count = (predicate) => records.filter(predicate).length;
  const skillNames = new Set(records
    .filter((record) => /^skills\/[^/]+\/SKILL\.md$/.test(record.path))
    .map((record) => record.ce_skill_or_surface));
  const directSkillFiles = count((record) => record.category === 'skill-runtime'
    && !NO_DIRECT_COUNTERPART.has(record.ce_skill_or_surface));
  const noDirectSkillFiles = count((record) => record.category === 'skill-runtime'
    && NO_DIRECT_COUNTERPART.has(record.ce_skill_or_surface));
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
    direct_counterpart_skills: [...skillNames].filter((skill) => !NO_DIRECT_COUNTERPART.has(skill)).length,
    no_direct_counterpart_skills: [...skillNames].filter((skill) => NO_DIRECT_COUNTERPART.has(skill)).length,
    direct_counterpart_skill_files: directSkillFiles,
    no_direct_counterpart_skill_files: noDirectSkillFiles,
    added_skills: addedSkills,
    skill_scripts: count((record) => /^skills\/[^/]+\/scripts\//.test(record.path)),
    all_scripts: count((record) => /^skills\/[^/]+\/scripts\//.test(record.path) || record.path === 'scripts/codex-dev.ts'),
    deleted_repo_profile_cache_scripts: count((record) => /\/scripts\/repo-profile-cache\.py$/.test(record.path) && record.status === 'D'),
  };
}

function assertSummary(summary) {
  const expected = {
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
  for (const [key, value] of Object.entries(expected)) {
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

function buildCurrentInventory() {
  const sourcePaths = git(REPO_ROOT, [
    'ls-files',
    '--cached',
    '--others',
    '--exclude-standard',
    '--',
    'skills',
  ]).trimEnd().split('\n').filter(Boolean)
    .filter((relativePath) => fs.existsSync(path.join(REPO_ROOT, relativePath)))
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
    schema_version: 'spec-first-current-skill-package-inventory/v1',
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

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function writeGenerated(relativePath, content) {
  fs.writeFileSync(path.join(REPO_ROOT, relativePath), content, 'utf8');
}

function buildSummaryMarkdown(summary, inventory) {
  return `---\nartifact_type: confirmed-reconciliation-ledger\nupstream_range: ${BASE}..${HEAD}\n---\n\n# CE 3.20 Skill/Script Reconciliation\n\n该摘要由 \`scripts/check-ce-upstream-reconciliation.cjs --refresh --ce-repo <path>\` 从固定 Git objects、逐文件审计和当前 Skill source 机械生成。语义裁决仍由逐文件审计与计划拥有。\n\n## 上游区间\n\n- 全部路径：${summary.total}\n- 实施目标：${summary.implementation_targets}（Skill ${summary.skill_runtime} + CLI/runtime ${summary.cli_runtime} + 支撑 ${summary.support}）\n- evidence-only：${summary.evidence_only}\n- CE Skill：${summary.ce_skills}（直接 counterpart ${summary.direct_counterpart_skills}/${summary.direct_counterpart_skill_files} 文件；无直接 counterpart ${summary.no_direct_counterpart_skills}/${summary.no_direct_counterpart_skill_files} 文件）\n- 脚本：${summary.all_scripts}（Skill-local ${summary.skill_scripts} + root development 1）\n- 删除 repo profile cache 脚本：${summary.deleted_repo_profile_cache_scripts}\n\n## 当前 Source Inventory\n\n- canonical Skill：${inventory.skill_count}\n- package 文件：${inventory.file_count}\n- manifest SHA-256：\`${inventory.manifest_sha256}\`\n- HEAD skills tree：\`${inventory.skills_tree_oid}\`\n\n详细逐路径事实见 \`${LEDGER_PATH}\` 与 \`${INVENTORY_PATH}\`。\n`;
}

function loadSnapshotNameStatus() {
  return fs.readFileSync(path.join(REPO_ROOT, NAME_STATUS_PATH), 'utf8');
}

function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  let nameStatusContent;
  if (args.ceRepo) {
    git(args.ceRepo, ['cat-file', '-e', `${BASE}^{commit}`]);
    git(args.ceRepo, ['cat-file', '-e', `${HEAD}^{commit}`]);
    nameStatusContent = git(args.ceRepo, ['diff', '--name-status', `${BASE}..${HEAD}`]);
    if (!args.refresh && fs.existsSync(path.join(REPO_ROOT, NAME_STATUS_PATH))) {
      if (nameStatusContent !== loadSnapshotNameStatus()) {
        throw new Error('checked-in name-status 与固定 CE commit objects 不一致。');
      }
    }
  } else {
    nameStatusContent = loadSnapshotNameStatus();
  }

  const audit = parseAudit(fs.readFileSync(path.join(REPO_ROOT, AUDIT_PATH), 'utf8'));
  const records = buildLedger(parseNameStatus(nameStatusContent), audit);
  const summary = summarize(records);
  assertSummary(summary);
  const inventory = buildCurrentInventory();
  if (inventory.skill_count !== 35) {
    throw new Error(`canonical Skill 应为 35 个，实际 ${inventory.skill_count}。`);
  }

  const ledger = {
    schema_version: 'ce-upstream-reconciliation/v1',
    upstream: { repository: 'compound-engineering-plugin', base: BASE, head: HEAD },
    summary,
    records,
  };

  if (args.refresh) {
    if (!args.ceRepo) throw new Error('--refresh 必须同时提供 --ce-repo，以固定 commit objects 为输入。');
    writeGenerated(NAME_STATUS_PATH, nameStatusContent);
    writeGenerated(LEDGER_PATH, stableJson(ledger));
    writeGenerated(INVENTORY_PATH, stableJson(inventory));
    writeGenerated(SUMMARY_PATH, buildSummaryMarkdown(summary, inventory));
  } else {
    const expectedLedger = stableJson(ledger);
    const expectedInventory = stableJson(inventory);
    if (fs.readFileSync(path.join(REPO_ROOT, LEDGER_PATH), 'utf8') !== expectedLedger) {
      throw new Error(`${LEDGER_PATH} 已漂移；运行 --refresh --ce-repo <path>。`);
    }
    if (fs.readFileSync(path.join(REPO_ROOT, INVENTORY_PATH), 'utf8') !== expectedInventory) {
      throw new Error(`${INVENTORY_PATH} 已漂移；运行 --refresh --ce-repo <path>。`);
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
  BASE,
  HEAD,
  CLI_RUNTIME_PATHS,
  SUPPORT_PATHS,
  NO_DIRECT_COUNTERPART,
  parseNameStatus,
  parseAudit,
  buildLedger,
  summarize,
  assertSummary,
  buildCurrentInventory,
  main,
};
