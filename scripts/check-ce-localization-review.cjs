#!/usr/bin/env node
'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const Ajv2020 = require('ajv/dist/2020');
const addFormats = require('ajv-formats');

const reconciliation = require('./check-ce-upstream-reconciliation.cjs');
const {
  LOCAL_CONFIG_CONSUMERS,
} = require('../skills/spec-runtime-setup/scripts/lib/project-config.cjs');

const REPO_ROOT = path.resolve(__dirname, '..');
const DEFAULT_INVENTORY_PATH = path.join(
  REPO_ROOT,
  'docs/validation/ce-localization/skill-inventory.json',
);
const DEFAULT_COVERAGE_PATH = path.join(
  REPO_ROOT,
  'docs/validation/ce-localization/review/round-3-source-coverage.json',
);
const DEFAULT_PREFLIGHT_PATH = path.join(
  REPO_ROOT,
  'docs/validation/ce-localization/ce-setup-prerequisite-preflight.json',
);
const DEFAULT_MATRIX_PATH = path.join(
  REPO_ROOT,
  'docs/validation/ce-localization/ce-setup-dependency-matrix.json',
);
const CLOSEOUT_ROOT = path.join(REPO_ROOT, 'docs/validation/ce-localization');
const CLOSEOUT_PATHS = Object.freeze({
  scenarios: path.join(CLOSEOUT_ROOT, 'skill-scenarios.json'),
  ledger: path.join(CLOSEOUT_ROOT, 'localization-ledger.json'),
  baselineRoot: path.join(CLOSEOUT_ROOT, 'baseline'),
  fieldProtocol: path.join(CLOSEOUT_ROOT, 'field-validation/protocol.json'),
  fieldTaskPairs: path.join(CLOSEOUT_ROOT, 'field-validation/task-pairs.json'),
  fieldResults: path.join(CLOSEOUT_ROOT, 'field-validation/results.json'),
  knowledgePromotion: path.join(CLOSEOUT_ROOT, 'knowledge-promotion/promotion-ledger.json'),
  upstreamAdjudication: path.join(REPO_ROOT, 'docs/validation/2026-08-19-ce-post-3-20-adjudication.json'),
  round1: path.join(CLOSEOUT_ROOT, 'review/round-1-findings.json'),
  round2: path.join(CLOSEOUT_ROOT, 'review/round-2-findings.json'),
  round3Openai: path.join(CLOSEOUT_ROOT, 'review/round-3-openai-skill-lens-final.json'),
  round3Anthropic: path.join(CLOSEOUT_ROOT, 'review/round-3-anthropic-skill-lens-final.json'),
  round3Findings: path.join(CLOSEOUT_ROOT, 'review/round-3-findings.json'),
  report: path.join(CLOSEOUT_ROOT, 'reports/2026-08-20-ce-localization-full-skill-review.md'),
});
const LOCAL_ONLY_SKILL_IDS = Object.freeze([
  'spec-app-consistency-audit',
  'spec-polish',
  'spec-prd',
  'spec-rule-miner',
  'spec-write-tasks',
  'using-spec-first',
]);
const SETUP_SCHEMA_ROOT = path.join(REPO_ROOT, 'docs/contracts/verification');
const SOURCE_ROOTS = Object.freeze([
  'skills',
  'src',
  'scripts',
  'templates',
  'tests',
  'docs/contracts',
]);
const TEXT_EXTENSIONS = new Set([
  '', '.cjs', '.html', '.js', '.json', '.jsonl', '.md', '.patch', '.py', '.sh', '.yaml', '.yml',
]);

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function artifactSha256(value) {
  return sha256(stableJson(value));
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function git(args) {
  return execFileSync('git', ['-C', REPO_ROOT, ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).replace(/\r\n/g, '\n');
}

function lineCount(buffer) {
  if (buffer.length === 0) return 0;
  const text = buffer.toString('utf8').replace(/\r\n/g, '\n');
  return text.endsWith('\n') ? text.split('\n').length - 1 : text.split('\n').length;
}

function pathRole(relativePath) {
  if (relativePath.endsWith('/SKILL.md')) return 'entry-contract';
  if (relativePath.includes('/scripts/')) return 'deterministic-helper';
  if (relativePath.includes('/evals/') || relativePath.includes('/tests/')) return 'evaluation';
  if (relativePath.includes('/schemas/') || relativePath.endsWith('.schema.json')) return 'machine-contract';
  if (relativePath.includes('/references/') || relativePath.endsWith('.md')) return 'reference-contract';
  return 'support-asset';
}

function listGitFiles(pathspecs = []) {
  const output = execFileSync('git', [
    '-C', REPO_ROOT,
    'ls-files', '-z', '--cached', '--others', '--exclude-standard', '--', ...pathspecs,
  ]);
  return output.toString('utf8').split('\0').filter(Boolean).sort((left, right) => left.localeCompare(right));
}

function regularFile(relativePath) {
  try {
    return fs.lstatSync(path.join(REPO_ROOT, relativePath)).isFile();
  } catch (_error) {
    return false;
  }
}

function fileReceipt(relativePath, extra = {}) {
  const content = fs.readFileSync(path.join(REPO_ROOT, relativePath));
  return {
    path: relativePath,
    sha256: sha256(content),
    bytes: content.length,
    line_count: lineCount(content),
    ...extra,
  };
}

function skillPackageFiles() {
  const files = listGitFiles(['skills']).filter(regularFile);
  const skillIds = [...new Set(files
    .filter((relativePath) => /^skills\/[^/]+\/SKILL\.md$/.test(relativePath))
    .map((relativePath) => relativePath.split('/')[1]))].sort();
  const skillSet = new Set(skillIds);
  return {
    skillIds,
    files: files
      .filter((relativePath) => skillSet.has(relativePath.split('/')[1]))
      .map((relativePath) => {
        const skillId = relativePath.split('/')[1];
        const role = pathRole(relativePath);
        return fileReceipt(relativePath, {
          skill_id: skillId,
          owning_skill: skillId,
          path_role: role,
          evidence_role: role === 'evaluation' ? 'behavior-eval' : 'local-contract',
          terminal_disposition: 'included-canonical-skill-source',
        });
      }),
  };
}

function excludedSkillEntries(skillIds) {
  const included = new Set(skillIds);
  const entries = [];
  for (const relativePath of listGitFiles(['skills'])) {
    const match = relativePath.match(/^skills\/([^/]+)$/);
    if (!match || included.has(match[1])) continue;
    const absolutePath = path.join(REPO_ROOT, relativePath);
    let stat;
    try { stat = fs.lstatSync(absolutePath); } catch (_error) { continue; }
    entries.push({
      path: relativePath,
      skill_id: match[1],
      path_role: stat.isSymbolicLink() ? 'tracked-symlink' : 'non-package-entry',
      terminal_disposition: 'excluded-host-owned-local-source',
      exclusion_reason: stat.isSymbolicLink()
        ? 'Tracked symlink is host-owned/local-only and is not a bundled canonical Skill package.'
        : 'Entry has no canonical regular-file SKILL.md package root.',
      governance_owner: 'src/cli/contracts/dual-host-governance/skills-governance.json',
    });
  }
  return entries.sort((left, right) => left.path.localeCompare(right.path));
}

function isSourcePath(relativePath) {
  return SOURCE_ROOTS.some((root) => relativePath === root || relativePath.startsWith(`${root}/`))
    && !reconciliation.isRunOutput(relativePath)
    && regularFile(relativePath);
}

function resolveReference(sourcePath, rawReference) {
  const withoutAnchor = rawReference.split('#')[0].split('?')[0].replace(/^['"`]|['"`]$/g, '');
  if (!withoutAnchor || /^(?:https?:|mailto:|skill:|<|\{)/.test(withoutAnchor)) return null;
  const candidate = withoutAnchor.startsWith('.')
    ? path.posix.normalize(path.posix.join(path.posix.dirname(sourcePath), withoutAnchor))
    : path.posix.normalize(withoutAnchor.replace(/^\//, ''));
  return isSourcePath(candidate) ? candidate : null;
}

function explicitReferences(sourcePath, content) {
  const references = new Set();
  const patterns = [
    /\]\(([^)\s]+)\)/g,
    /(?:require\(|from\s+|import\s+)["']([^"']+)["']/g,
    /(?:src|scripts|templates|tests|docs\/contracts)\/[A-Za-z0-9_./@-]+/g,
  ];
  for (const pattern of patterns) {
    for (const match of content.matchAll(pattern)) {
      const raw = match[1] || match[0];
      const resolved = resolveReference(sourcePath, raw.replace(/[),.;:]+$/, ''));
      if (resolved) references.add(resolved);
    }
  }
  return [...references].sort((left, right) => left.localeCompare(right));
}

function firstEvidenceLine(relativePath, needles) {
  const lines = fs.readFileSync(path.join(REPO_ROOT, relativePath), 'utf8').replace(/\r\n/g, '\n').split('\n');
  const index = lines.findIndex((line) => needles.some((needle) => line.includes(needle)));
  return {
    line: index >= 0 ? index + 1 : null,
    excerpt: index >= 0 ? lines[index].trim().slice(0, 500) : null,
  };
}

function addRelation(relations, skillId, relativePath, relationType, evidence) {
  if (!isSourcePath(relativePath) || relativePath.startsWith(`skills/${skillId}/`)) return;
  const key = `${skillId}\0${relativePath}`;
  if (!relations.has(key)) {
    relations.set(key, {
      skill_id: skillId,
      owning_skill: skillId,
      ...fileReceipt(relativePath),
      path_role: relativePath.startsWith('tests/') ? 'evaluation' : pathRole(relativePath),
      evidence_role: relativePath.startsWith('tests/') ? 'behavior-eval' : 'local-contract',
      terminal_disposition: 'included-direct-support',
      relation_types: [],
      evidence: [],
    });
  }
  const relation = relations.get(key);
  if (!relation.relation_types.includes(relationType)) relation.relation_types.push(relationType);
  const evidenceKey = JSON.stringify(evidence);
  if (!relation.evidence.some((entry) => JSON.stringify(entry) === evidenceKey)) relation.evidence.push(evidence);
}

function buildDirectSupport(skillIds, packageFiles) {
  const relations = new Map();
  const governancePath = 'src/cli/contracts/dual-host-governance/skills-governance.json';
  const governance = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, governancePath), 'utf8'));
  const governanceRecords = new Map((governance.skills || []).map((record) => [record.skill_name, record]));
  const testPaths = listGitFiles(['tests']).filter(regularFile);

  for (const skillId of skillIds) {
    const governanceRecord = governanceRecords.get(skillId);
    if (governanceRecord) {
      const anchor = firstEvidenceLine(governancePath, [`"skill_name": "${skillId}"`]);
      addRelation(relations, skillId, governancePath, 'governance-manifest', {
        source_path: governancePath,
        ...anchor,
      });
      if (governanceRecord.command_name) {
        const templatePath = `templates/claude/commands/spec/${governanceRecord.command_name}.md`;
        if (isSourcePath(templatePath)) {
          addRelation(relations, skillId, templatePath, 'template-owner', {
            source_path: governancePath,
            ...anchor,
          });
        }
      }
    }

    for (const testPath of testPaths) {
      const basenameMatch = path.posix.basename(testPath).startsWith(`${skillId}-`);
      const exactSourcePath = `skills/${skillId}/`;
      const content = TEXT_EXTENSIONS.has(path.posix.extname(testPath))
        ? fs.readFileSync(path.join(REPO_ROOT, testPath), 'utf8')
        : '';
      if (!basenameMatch && !content.includes(exactSourcePath)) continue;
      const anchor = firstEvidenceLine(testPath, [exactSourcePath, skillId]);
      addRelation(relations, skillId, testPath, basenameMatch ? 'focused-test-name' : 'focused-test-explicit-source-ref', {
        source_path: testPath,
        ...anchor,
      });
    }
  }

  for (const packageFile of packageFiles) {
    if (!TEXT_EXTENSIONS.has(path.posix.extname(packageFile.path))) continue;
    const content = fs.readFileSync(path.join(REPO_ROOT, packageFile.path), 'utf8');
    for (const targetPath of explicitReferences(packageFile.path, content)) {
      const anchor = firstEvidenceLine(packageFile.path, [targetPath, path.posix.basename(targetPath)]);
      addRelation(relations, packageFile.skill_id, targetPath, 'explicit-source-ref', {
        source_path: packageFile.path,
        ...anchor,
      });
    }
  }

  return [...relations.values()]
    .map((relation) => ({
      ...relation,
      relation_types: relation.relation_types.sort(),
      evidence: relation.evidence.sort((left, right) => (
        `${left.source_path}:${left.line}`.localeCompare(`${right.source_path}:${right.line}`)
      )),
    }))
    .sort((left, right) => `${left.skill_id}\0${left.path}`.localeCompare(`${right.skill_id}\0${right.path}`));
}

function manifestHash(receipts) {
  return sha256(receipts.map((receipt) => (
    `${receipt.path}\0${receipt.sha256}\0${receipt.bytes}\0${receipt.line_count}`
  )).join('\n'));
}

function countBy(items, selector) {
  return items.reduce((counts, item) => {
    const key = selector(item);
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function setupContract({
  contractId,
  status,
  reasonCode,
  owner,
  sourceRefs,
  testRefs,
  nextAction,
  statusAuthority = 'deterministic-source-check',
}) {
  return {
    contract_id: contractId,
    status,
    reason_code: reasonCode,
    owner,
    source_refs: sourceRefs,
    test_refs: testRefs,
    next_action: nextAction,
    status_authority: statusAuthority,
  };
}

function setupDependency({
  dependencyId,
  status,
  reasonCodes,
  owner,
  sourceRefs,
  testRefs,
  evidenceRefs,
  downstreamImpact,
  nextAction,
  terminalDisposition = null,
  statusAuthority = 'deterministic-source-check',
}) {
  return {
    dependency_id: dependencyId,
    status,
    reason_codes: reasonCodes,
    owner,
    source_refs: sourceRefs,
    test_refs: testRefs,
    evidence_refs: evidenceRefs,
    downstream_impact: downstreamImpact,
    next_action: nextAction,
    terminal_disposition: terminalDisposition,
    status_authority: statusAuthority,
  };
}

function derivePreflightStatus(contracts) {
  const nonConfirmed = contracts.filter((contract) => contract.status !== 'confirmed');
  const overallStatus = nonConfirmed.some((contract) => contract.status === 'blocked')
    ? 'blocked'
    : (nonConfirmed.length > 0 ? 'degraded' : 'confirmed');
  return {
    overall_status: overallStatus,
    blocking_reason_codes: [...new Set(nonConfirmed.map((contract) => contract.reason_code))].sort(),
  };
}

function buildConfigConsumerInventory() {
  const rows = [];
  const missingKeys = [];
  for (const [key, registration] of Object.entries(LOCAL_CONFIG_CONSUMERS).sort(([left], [right]) => left.localeCompare(right))) {
    const owner = registration.owner;
    const candidates = regularFile(owner)
      ? [owner]
      : listGitFiles([owner]).filter((relativePath) => (
        regularFile(relativePath) && TEXT_EXTENSIONS.has(path.posix.extname(relativePath))
      )).sort((left, right) => {
        const leftEntry = left.endsWith('/SKILL.md') ? 0 : 1;
        const rightEntry = right.endsWith('/SKILL.md') ? 0 : 1;
        return leftEntry - rightEntry || left.localeCompare(right);
      });
    const sourceRef = candidates.find((relativePath) => (
      fs.readFileSync(path.join(REPO_ROOT, relativePath), 'utf8').includes(key)
    ));
    if (!sourceRef) {
      missingKeys.push(key);
      continue;
    }
    const evidence = firstEvidenceLine(sourceRef, [key]);
    rows.push({
      key,
      consumer_kind: registration.kind,
      owner,
      source_ref: sourceRef,
      source_line: evidence.line,
      source_excerpt: evidence.excerpt,
      fallback_boundary: 'consumer-owned',
      blocking_scope: 'consumer-local-only',
      setup_facts_consumer: false,
    });
  }
  return {
    schema_version: 'ce-setup-config-consumer-inventory/v1',
    status: missingKeys.length === 0 ? 'confirmed' : 'partial',
    rows,
    missing_keys: missingKeys,
    global_readiness_gate: false,
    claim_ceiling: 'Exact source anchors prove declared consumer ownership, not runtime value parsing or successful field behavior.',
  };
}

function buildCeToolDispositions() {
  const registryPath = 'skills/spec-runtime-setup/setup-registry.json';
  const registry = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, registryPath), 'utf8'));
  const helpers = new Map((registry.helpers || []).map((entry) => [entry.id, entry]));
  const decisions = [
    ['agent-browser', 'reuse', 'local-required-nonblocking'],
    ['ast-grep', 'reuse', 'local-required-nonblocking'],
    ['ast-grep-skill', 'reuse', 'local-required-baseline'],
    ['ffmpeg', 'reuse', 'local-promoted-required'],
    ['gh', 'reuse', 'local-promoted-required'],
    ['jq', 'reject', 'no-active-local-consumer'],
  ];
  return decisions.map(([toolId, disposition, reasonCode]) => {
    const helper = helpers.get(toolId);
    if (toolId !== 'jq' && !helper) {
      throw new Error(`CE setup tool disposition is missing a local registry owner: ${toolId}`);
    }
    if (toolId === 'jq' && helper) {
      throw new Error('Rejected CE setup helper jq must not re-enter the local registry.');
    }
    return {
      tool_id: toolId,
      disposition,
      reason_code: reasonCode,
      local_registry_kind: helper ? 'helper' : 'not-registered',
      local_required: helper ? helper.required === true : false,
      baseline_blocking: helper ? helper.baseline_blocking === true : false,
      source_ref: helper ? registryPath : 'docs/plans/2026-08-20-002-review-ce-localization-value-plan.md',
      status_authority: 'plan-settled-and-source-checked',
    };
  });
}

function buildCeSetupArtifacts(inventory) {
  const snapshot = inventory.source_snapshot;
  const consumerInventory = buildConfigConsumerInventory();
  const ceToolDispositions = buildCeToolDispositions();
  const contracts = [
      setupContract({
        contractId: 'mode-side-effect',
        status: 'confirmed',
        reasonCode: 'mode-side-effect-contract-current',
        owner: 'skills/spec-runtime-setup',
        sourceRefs: [
          'skills/spec-runtime-setup/SKILL.md',
          'skills/spec-runtime-setup/scripts/lib/mode-policy.cjs',
          'skills/spec-runtime-setup/scripts/lib/runtime-executor.cjs',
          'docs/contracts/verification/ce-setup-side-effect.schema.json',
        ],
        testRefs: [
          'tests/unit/mcp-setup-mode-target.test.js',
          'tests/unit/mcp-setup-entrypoint.test.js',
        ],
        nextAction: 'Rerun the focused mode and side-effect tests after any Runtime Setup mode change.',
      }),
      setupContract({
        contractId: 'source-snapshot',
        status: 'confirmed',
        reasonCode: 'source-snapshot-producer-current',
        owner: 'scripts/check-ce-localization-review.cjs',
        sourceRefs: [
          'scripts/check-ce-localization-review.cjs',
          'scripts/check-ce-upstream-reconciliation.cjs',
          'docs/contracts/verification/ce-setup-snapshot.schema.json',
        ],
        testRefs: [
          'tests/unit/ce-localization-review-contracts.test.js',
          'tests/unit/ce-setup-localization-contracts.test.js',
        ],
        nextAction: 'Refresh all source-bound artifacts whenever HEAD, dirty paths, source tree, or inventory changes.',
      }),
      setupContract({
        contractId: 'project-config-validity',
        status: 'confirmed',
        reasonCode: 'local-config-structure-contract-current',
        owner: 'skills/spec-runtime-setup/scripts/lib/project-config.cjs',
        sourceRefs: [
          'skills/spec-runtime-setup/scripts/lib/project-config.cjs',
          'skills/spec-runtime-setup/references/config-template.yaml',
        ],
        testRefs: ['tests/unit/mcp-setup-project-config.test.js'],
        nextAction: 'Preserve syntax, duplicate-key, and unowned-key checks without taking over consumer-specific value validation.',
      }),
      setupContract({
        contractId: 'runtime-status-projection',
        status: 'confirmed',
        reasonCode: 'runtime-status-projection-current',
        owner: 'src/cli/commands/doctor.js',
        sourceRefs: [
          'src/cli/commands/doctor.js',
          'src/cli/helpers/setup-facts.js',
          'docs/contracts/verification/runtime-status-projection.schema.json',
        ],
        testRefs: [
          'tests/unit/doctor-output.test.js',
          'tests/unit/doctor-runtime-assets.test.js',
        ],
        nextAction: 'Preserve the versioned projection when setup or doctor adds a status or disposition.',
      }),
      setupContract({
        contractId: 'host-invocation-receipt',
        status: 'confirmed',
        reasonCode: 'host-loaded-root-binding-current',
        owner: 'skills/spec-runtime-setup/scripts/lib/host-authority.cjs',
        sourceRefs: [
          'skills/spec-runtime-setup/scripts/lib/host-authority.cjs',
          'skills/spec-runtime-setup/scripts/setup.cjs',
          'docs/contracts/verification/host-invocation-receipt.schema.json',
        ],
        testRefs: [
          'tests/unit/mcp-setup-mode-target.test.js',
          'tests/unit/host-runtime-projection-contracts.test.js',
        ],
        nextAction: 'Keep production main enforcement enabled and reject mismatched or unrecognized loaded Skill roots.',
      }),
      setupContract({
        contractId: 'consumer-inventory',
        status: consumerInventory.status,
        reasonCode: consumerInventory.status === 'confirmed'
          ? 'consumer-inventory-current'
          : 'consumer-inventory-incomplete',
        owner: 'scripts/check-ce-localization-review.cjs',
        sourceRefs: [
          'skills/spec-runtime-setup/references/config-template.yaml',
          'src/verification/profile-loader.js',
        ],
        testRefs: ['tests/unit/mcp-setup-config-consumers.test.js'],
        nextAction: consumerInventory.status === 'confirmed'
          ? 'Refresh exact source anchors after any local config key or consumer change.'
          : 'Record exact deterministic readers and Skill-native readers without creating a global readiness gate.',
      }),
    ];
  const preflightStatus = derivePreflightStatus(contracts);
  const preflight = {
    schema_version: 'ce-setup-prerequisite-preflight/v1',
    artifact_kind: 'source-bound-contract-preflight',
    producer: 'scripts/check-ce-localization-review.cjs',
    source_snapshot: snapshot,
    public_entrypoint_disposition: 'reuse-spec-runtime-setup-only',
    contracts,
    consumer_inventory: consumerInventory,
    ...preflightStatus,
    claim_ceiling: preflightStatus.overall_status === 'confirmed'
      ? 'Prerequisite contracts are current; this does not prove provider identity, downstream Skill semantics, or field value.'
      : 'One or more prerequisite contracts are not confirmed; dependent mechanism-improved claims remain unavailable.',
  };

  const preflightRef = 'docs/validation/ce-localization/ce-setup-prerequisite-preflight.json';
  const commonEvidence = [preflightRef];
  const dependencies = [
    setupDependency({
      dependencyId: 'S1', status: 'confirmed', reasonCodes: [],
      owner: 'src/cli/runtime-setup-identity.js',
      sourceRefs: ['src/cli/runtime-setup-identity.js'],
      testRefs: ['tests/unit/mcp-setup-entrypoint.test.js'], evidenceRefs: commonEvidence,
      downstreamImpact: 'All Runtime Setup routes and host projections.',
      nextAction: 'Keep forbidden executable aliases absent and rerun the entrypoint scan after projection changes.',
      terminalDisposition: 'reuse-spec-runtime-setup-only', statusAuthority: 'plan-settled-and-source-checked',
    }),
    setupDependency({
      dependencyId: 'S2', status: 'confirmed', reasonCodes: [],
      owner: 'skills/spec-runtime-setup/setup-registry.json',
      sourceRefs: ['skills/spec-runtime-setup/setup-registry.json', 'skills/spec-runtime-setup/setup-registry.schema.json'],
      testRefs: ['tests/unit/mcp-setup-registry.test.js'], evidenceRefs: commonEvidence,
      downstreamImpact: 'Provider readiness, installation advice, and explicit --only selection.',
      nextAction: 'Keep every CE tool candidate bound to the local registry decision and reject unowned additions.',
      terminalDisposition: 'confirmed-local-tool-dispositions',
    }),
    setupDependency({
      dependencyId: 'S3', status: 'confirmed', reasonCodes: [],
      owner: 'skills/spec-runtime-setup/scripts/lib/project-config.cjs',
      sourceRefs: ['skills/spec-runtime-setup/scripts/lib/project-config.cjs'],
      testRefs: ['tests/unit/mcp-setup-project-config.test.js'], evidenceRefs: commonEvidence,
      downstreamImpact: 'Project-local configuration consumers.',
      nextAction: 'Preserve syntax, structure, and consumer ownership checks while leaving value semantics with each consumer.',
      terminalDisposition: 'confirmed-current-owner',
    }),
    setupDependency({
      dependencyId: 'S4', status: 'degraded', reasonCodes: ['provider-receipt-unverified'],
      owner: 'skills/spec-runtime-setup/scripts/lib/facts.cjs',
      sourceRefs: ['skills/spec-runtime-setup/scripts/lib/facts.cjs', 'docs/contracts/verification/provider-serving-receipt.schema.json'],
      testRefs: ['tests/unit/mcp-setup-facts-renderer.test.js'], evidenceRefs: commonEvidence,
      downstreamImpact: 'Doctor and actual Skill-local readiness adapters.',
      nextAction: 'Keep missing or mismatched provider receipts degraded and prevent confirmed provider claims.',
      terminalDisposition: 'degraded-provider-unverified',
    }),
    setupDependency({
      dependencyId: 'S5', status: 'confirmed', reasonCodes: [],
      owner: 'src/cli/commands/doctor.js',
      sourceRefs: ['src/cli/commands/doctor.js', 'src/cli/helpers/setup-facts.js'],
      testRefs: ['tests/unit/doctor-output.test.js', 'tests/unit/doctor-runtime-assets.test.js'], evidenceRefs: commonEvidence,
      downstreamImpact: 'Human next actions and completion claims.',
      nextAction: 'Preserve optional, known limitation, degraded, and not-run distinctions in machine and human output.',
      terminalDisposition: 'confirmed-current-projection',
    }),
    setupDependency({
      dependencyId: 'S6', status: 'confirmed', reasonCodes: [],
      owner: 'skills/spec-runtime-setup/scripts/lib/host-authority.cjs',
      sourceRefs: ['skills/spec-runtime-setup/scripts/lib/host-authority.cjs'],
      testRefs: ['tests/unit/host-runtime-projection-contracts.test.js'], evidenceRefs: commonEvidence,
      downstreamImpact: 'Host config mutation and generated runtime readiness claims.',
      nextAction: 'Keep the production entrypoint bound to the actual loaded Skill root and reject pin/root mismatches.',
      terminalDisposition: 'confirmed-loaded-root-bound',
    }),
    setupDependency({
      dependencyId: 'S7', status: consumerInventory.status, reasonCodes: consumerInventory.status === 'confirmed' ? [] : ['consumer-inventory-incomplete'],
      owner: 'scripts/check-ce-localization-review.cjs',
      sourceRefs: ['skills/spec-runtime-setup/references/config-template.yaml', 'src/verification/profile-loader.js'],
      testRefs: ['tests/unit/mcp-setup-config-consumers.test.js'], evidenceRefs: commonEvidence,
      downstreamImpact: 'Only Skills with a confirmed facts or local-config read relationship.',
      nextAction: consumerInventory.status === 'confirmed'
        ? 'Refresh exact source anchors after consumer changes and keep setup from becoming a global gate.'
        : 'Freeze exact source anchors, fields, fallbacks, and blocking behavior for every confirmed consumer.',
      terminalDisposition: consumerInventory.status === 'confirmed' ? 'confirmed-local-consumers-only' : null,
    }),
    setupDependency({
      dependencyId: 'S8', status: consumerInventory.status, reasonCodes: consumerInventory.status === 'confirmed' ? [] : ['config-key-consumer-evidence-incomplete'],
      owner: 'each-local-config-consumer',
      sourceRefs: ['skills/spec-runtime-setup/references/config-template.yaml'],
      testRefs: ['tests/unit/mcp-setup-config-consumers.test.js'], evidenceRefs: commonEvidence,
      downstreamImpact: 'Local preference defaults, invalidation, and fallback behavior.',
      nextAction: consumerInventory.status === 'confirmed'
        ? 'Keep value validation and fallback behavior in the owning consumer.'
        : 'Close each declared key against a real reader or assign a non-implementation terminal disposition.',
      terminalDisposition: consumerInventory.status === 'confirmed' ? 'confirmed-consumer-owned-values' : null,
    }),
    setupDependency({
      dependencyId: 'S9', status: 'evidence-only', reasonCodes: ['no-local-consumer'],
      owner: 'ce-localization-review',
      sourceRefs: ['docs/plans/2026-08-20-002-review-ce-localization-value-plan.md'],
      testRefs: ['tests/unit/ce-setup-localization-contracts.test.js'], evidenceRefs: commonEvidence,
      downstreamImpact: 'No implementation-bearing downstream path.',
      nextAction: 'Keep docs_root, scratch, and CE Work engine semantics out of local config until a real consumer appears.',
      terminalDisposition: 'evidence-only', statusAuthority: 'plan-settled',
    }),
    setupDependency({
      dependencyId: 'S10', status: 'confirmed', reasonCodes: [],
      owner: 'scripts/check-ce-localization-review.cjs',
      sourceRefs: ['scripts/check-ce-localization-review.cjs', 'scripts/check-ce-upstream-reconciliation.cjs'],
      testRefs: ['tests/unit/ce-localization-review-contracts.test.js', 'tests/unit/ce-setup-localization-contracts.test.js'], evidenceRefs: commonEvidence,
      downstreamImpact: 'Every source-bound setup and localization claim.',
      nextAction: 'Invalidate and refresh artifacts after any target HEAD, dirty manifest, source tree, or inventory change.',
      terminalDisposition: 'confirmed-current-producer',
    }),
    setupDependency({
      dependencyId: 'S11', status: 'confirmed', reasonCodes: [],
      owner: 'runtime-setup-and-localization-test-owners',
      sourceRefs: ['skills/spec-runtime-setup/scripts/setup.cjs', 'scripts/check-ce-localization-review.cjs'],
      testRefs: ['tests/unit/ce-setup-localization-contracts.test.js', 'tests/unit/mcp-setup-entrypoint.test.js'], evidenceRefs: commonEvidence,
      downstreamImpact: 'Setup-related structure, behavior, runtime, and closeout claims.',
      nextAction: 'Rerun the focused setup family after any mode, config, host, facts, snapshot, or doctor change.',
      terminalDisposition: 'confirmed-focused-scenario-coverage',
    }),
  ];
  const dependencyMatrix = {
    schema_version: 'ce-setup-dependency-matrix/v1',
    artifact_kind: 'source-bound-prerequisite-matrix',
    producer: 'scripts/check-ce-localization-review.cjs',
    public_entrypoint_disposition: 'reuse-spec-runtime-setup-only',
    source_snapshot: snapshot,
    inventory_ref: 'docs/validation/ce-localization/skill-inventory.json',
    inventory_sha256: sha256(stableJson(inventory)),
    preflight_ref: preflightRef,
    preflight_sha256: sha256(stableJson(preflight)),
    ce_tool_dispositions: ceToolDispositions,
    dependencies,
    status_counts: countBy(dependencies, (entry) => entry.status),
    blocking_reason_codes: [...new Set(dependencies
      .filter((entry) => entry.status === 'blocked')
      .flatMap((entry) => entry.reason_codes))].sort(),
    overall_status: dependencies.some((entry) => entry.status === 'blocked')
      ? 'blocked'
      : (dependencies.some((entry) => ['partial', 'degraded'].includes(entry.status)) ? 'degraded' : 'confirmed'),
    claim_ceiling: 'Dependency readiness only; this artifact does not prove downstream Skill semantics or field value.',
  };
  return { preflight, dependencyMatrix };
}

function buildArtifacts() {
  const packages = skillPackageFiles();
  const excludedPaths = excludedSkillEntries(packages.skillIds);
  const directSupport = buildDirectSupport(packages.skillIds, packages.files);
  const perSkill = packages.skillIds.map((skillId) => {
    const packageFiles = packages.files.filter((file) => file.skill_id === skillId);
    const support = directSupport.filter((entry) => entry.skill_id === skillId);
    return {
      skill_id: skillId,
      package_root: `skills/${skillId}`,
      entry_path: `skills/${skillId}/SKILL.md`,
      package_path_count: packageFiles.length,
      direct_support_path_count: support.length,
      package_paths: packageFiles.map((file) => file.path),
      direct_support_paths: support.map((entry) => entry.path),
    };
  });
  const targetSnapshot = reconciliation.buildTargetSourceSnapshot(
    REPO_ROOT,
    reconciliation.buildCurrentInventory({ schemaVersion: 'spec-first-current-skill-package-inventory/v2' }),
  );
  const inventory = {
    schema_version: 'ce-localization-skill-inventory/v1',
    artifact_kind: 'deterministic-source-inventory',
    producer: 'scripts/check-ce-localization-review.cjs',
    source_snapshot: targetSnapshot,
    included_roots: ['skills/<canonical-skill-id>/**'],
    excluded_paths: excludedPaths,
    skill_count: packages.skillIds.length,
    package_path_count: packages.files.length,
    package_bytes: packages.files.reduce((sum, file) => sum + file.bytes, 0),
    package_manifest_sha256: manifestHash(packages.files),
    skills: perSkill,
    files: packages.files,
    claim_ceiling: 'Deterministic path/hash/line coverage only; no semantic, runtime, provider, or field claim.',
  };
  const uniqueSupport = [...new Map(directSupport.map((entry) => [entry.path, entry])).values()];
  const reviewInput = {
    inventory_sha256: sha256(stableJson(inventory)),
    package_manifest_sha256: inventory.package_manifest_sha256,
    direct_support_manifest_sha256: manifestHash(uniqueSupport),
    relation_manifest_sha256: sha256(stableJson(directSupport)),
  };
  const coverage = {
    schema_version: 'ce-localization-round-3-source-coverage/v2',
    artifact_kind: 'deterministic-review-source-packet',
    producer: 'scripts/check-ce-localization-review.cjs',
    source_snapshot: targetSnapshot,
    inventory_ref: 'docs/validation/ce-localization/skill-inventory.json',
    inventory_sha256: reviewInput.inventory_sha256,
    review_input: reviewInput,
    coverage_summary: {
      skill_count: packages.skillIds.length,
      package_path_count: packages.files.length,
      package_bytes: inventory.package_bytes,
      direct_support_unique_path_count: uniqueSupport.length,
      direct_support_relation_count: directSupport.length,
      excluded_path_count: excludedPaths.length,
      missing_path_count: 0,
      hash_mismatch_count: 0,
    },
    relation_policy: {
      accepted_relation_types: [
        'explicit-source-ref',
        'focused-test-explicit-source-ref',
        'focused-test-name',
        'governance-manifest',
        'template-owner',
      ],
      boundary: 'Exact current source references only; generated runtime, directory proximity, and name similarity outside focused test basenames are excluded.',
    },
    skills: perSkill,
    package_files: packages.files,
    direct_support: directSupport,
    excluded_paths: excludedPaths,
    limitations: [
      'Receipts prove deterministic file identity and input coverage, not equal semantic attention or review correctness.',
      'Dynamic references and semantic consumers without an exact source relation remain outside the deterministic roster.',
      'Provider identity, host runtime behavior, user adoption, and field outcome are not measured.',
    ],
  };
  const setup = buildCeSetupArtifacts(inventory);
  return { inventory, coverage, ...setup };
}

function parseArgs(argv) {
  const args = {
    refresh: false,
    verifyOnly: false,
    verifyCloseout: false,
    inventoryPath: DEFAULT_INVENTORY_PATH,
    coveragePath: DEFAULT_COVERAGE_PATH,
    preflightPath: DEFAULT_PREFLIGHT_PATH,
    matrixPath: DEFAULT_MATRIX_PATH,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === '--refresh') {
      args.refresh = true;
    } else if (token === '--verify-only') {
      args.verifyOnly = true;
    } else if (token === '--verify-closeout') {
      args.verifyCloseout = true;
    } else if (['--inventory', '--coverage', '--preflight', '--matrix'].includes(token)) {
      const value = argv[index + 1];
      if (!value) throw new Error(`${token} requires a path`);
      const resolved = path.resolve(value);
      if (token === '--inventory') args.inventoryPath = resolved;
      if (token === '--coverage') args.coveragePath = resolved;
      if (token === '--preflight') args.preflightPath = resolved;
      if (token === '--matrix') args.matrixPath = resolved;
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${token}`);
    }
  }
  if (args.refresh && args.verifyOnly) throw new Error('--refresh and --verify-only are mutually exclusive');
  return args;
}

function writeArtifact(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, stableJson(value), 'utf8');
}

function readSchema(fileName) {
  return JSON.parse(fs.readFileSync(path.join(SETUP_SCHEMA_ROOT, fileName), 'utf8'));
}

function schemaErrors(label, validate, artifact) {
  if (validate(artifact)) return [];
  return (validate.errors || []).map((error) => {
    const detail = error.params && error.params.additionalProperty
      ? ` (${error.params.additionalProperty})`
      : '';
    return `${label}${error.instancePath || '/'}: ${error.message}${detail}`;
  });
}

function buildSchemaValidators() {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const schemaFiles = [
    'ce-setup-snapshot.schema.json',
    'ce-setup-prerequisite-preflight.schema.json',
    'ce-setup-dependency-matrix.schema.json',
    'skill-inventory.schema.json',
    'skill-scenarios.schema.json',
    'baseline.schema.json',
    'localization-ledger.schema.json',
    'field-validation-protocol.schema.json',
    'field-validation-results.schema.json',
    'knowledge-promotion.schema.json',
    'review-findings.schema.json',
    'ce-localization-round-3-review.schema.json',
  ];
  const schemas = new Map(schemaFiles.map((fileName) => [fileName, readSchema(fileName)]));
  for (const schema of schemas.values()) ajv.addSchema(schema);
  const validator = (fileName) => ajv.getSchema(schemas.get(fileName).$id);
  return {
    inventory: validator('skill-inventory.schema.json'),
    preflight: validator('ce-setup-prerequisite-preflight.schema.json'),
    dependencyMatrix: validator('ce-setup-dependency-matrix.schema.json'),
    scenarios: validator('skill-scenarios.schema.json'),
    baseline: validator('baseline.schema.json'),
    ledger: validator('localization-ledger.schema.json'),
    fieldProtocol: validator('field-validation-protocol.schema.json'),
    fieldEvidence: validator('field-validation-results.schema.json'),
    knowledgePromotion: validator('knowledge-promotion.schema.json'),
    reviewFindings: validator('review-findings.schema.json'),
    round3Review: validator('ce-localization-round-3-review.schema.json'),
  };
}

function validateCeSetupArtifacts({ inventory, preflight, dependencyMatrix }) {
  const schemaValidators = buildSchemaValidators();
  const validators = [
    ...(inventory ? [['inventory', schemaValidators.inventory, inventory]] : []),
    ['preflight', schemaValidators.preflight, preflight],
    ['dependencyMatrix', schemaValidators.dependencyMatrix, dependencyMatrix],
  ];
  const errors = validators.flatMap(([label, validate, artifact]) => (
    schemaErrors(label, validate, artifact)
  ));
  return { valid: errors.length === 0, errors };
}

function loadCloseoutArtifacts() {
  const baselines = fs.readdirSync(CLOSEOUT_PATHS.baselineRoot)
    .filter((entry) => entry.endsWith('.json'))
    .sort()
    .map((entry) => readJson(path.join(CLOSEOUT_PATHS.baselineRoot, entry)));
  return {
    scenarios: readJson(CLOSEOUT_PATHS.scenarios),
    baselines,
    ledger: readJson(CLOSEOUT_PATHS.ledger),
    fieldProtocol: readJson(CLOSEOUT_PATHS.fieldProtocol),
    fieldTaskPairs: readJson(CLOSEOUT_PATHS.fieldTaskPairs),
    fieldResults: readJson(CLOSEOUT_PATHS.fieldResults),
    knowledgePromotion: readJson(CLOSEOUT_PATHS.knowledgePromotion),
    upstreamAdjudication: readJson(CLOSEOUT_PATHS.upstreamAdjudication),
    reviews: {
      round1: readJson(CLOSEOUT_PATHS.round1),
      round2: readJson(CLOSEOUT_PATHS.round2),
      round3Openai: readJson(CLOSEOUT_PATHS.round3Openai),
      round3Anthropic: readJson(CLOSEOUT_PATHS.round3Anthropic),
      round3Findings: readJson(CLOSEOUT_PATHS.round3Findings),
    },
    report: fs.readFileSync(CLOSEOUT_PATHS.report, 'utf8'),
  };
}

function snapshotDigest(snapshot) {
  return snapshot && {
    head: snapshot.head || snapshot.target_repo_head,
    dirty_path_manifest_sha256: snapshot.dirty_path_manifest_sha256 || snapshot.dirty_manifest_sha256,
    source_tree_hash: snapshot.source_tree_hash || snapshot.source_tree_sha256,
    inventory_hash: snapshot.inventory_hash || snapshot.inventory_join_sha256,
  };
}

function validateCloseoutArtifacts(closeout, deterministic) {
  const errors = [];
  const validators = buildSchemaValidators();
  const inventory = deterministic.inventory;
  const coverage = deterministic.coverage;
  const inventorySha = artifactSha256(inventory);
  const expectedSnapshot = inventory.source_snapshot;
  const expectedSnapshotDigest = snapshotDigest(expectedSnapshot);
  const currentSkillIds = inventory.skills.map((entry) => entry.skill_id).sort();
  const currentSkillSet = new Set(currentSkillIds);

  const schemaChecks = [
    ['scenarios', validators.scenarios, closeout.scenarios],
    ...closeout.baselines.map((baseline) => [`baseline:${baseline.skill_id || 'unknown'}`, validators.baseline, baseline]),
    ['ledger', validators.ledger, closeout.ledger],
    ['fieldProtocol', validators.fieldProtocol, closeout.fieldProtocol],
    ['fieldTaskPairs', validators.fieldEvidence, closeout.fieldTaskPairs],
    ['fieldResults', validators.fieldEvidence, closeout.fieldResults],
    ['knowledgePromotion', validators.knowledgePromotion, closeout.knowledgePromotion],
    ['review:round1', validators.reviewFindings, closeout.reviews.round1],
    ['review:round2', validators.reviewFindings, closeout.reviews.round2],
    ['review:round3Openai', validators.round3Review, closeout.reviews.round3Openai],
    ['review:round3Anthropic', validators.round3Review, closeout.reviews.round3Anthropic],
    ['review:round3Findings', validators.reviewFindings, closeout.reviews.round3Findings],
  ];
  for (const [label, validate, artifact] of schemaChecks) {
    errors.push(...schemaErrors(label, validate, artifact));
  }

  const sourceBoundArtifacts = [
    ['scenarios', closeout.scenarios],
    ...closeout.baselines.map((baseline) => [`baseline:${baseline.skill_id || 'unknown'}`, baseline]),
    ['ledger', closeout.ledger],
    ['fieldProtocol', closeout.fieldProtocol],
    ['fieldTaskPairs', closeout.fieldTaskPairs],
    ['fieldResults', closeout.fieldResults],
    ['knowledgePromotion', closeout.knowledgePromotion],
    ['review:round1', closeout.reviews.round1],
    ['review:round2', closeout.reviews.round2],
    ['review:round3Openai', closeout.reviews.round3Openai],
    ['review:round3Anthropic', closeout.reviews.round3Anthropic],
    ['review:round3Findings', closeout.reviews.round3Findings],
  ];
  for (const [label, artifact] of sourceBoundArtifacts) {
    const actual = snapshotDigest(artifact.source_snapshot);
    if (stableJson(actual) !== stableJson(expectedSnapshotDigest)) {
      errors.push(`${label}: source_snapshot does not match the current deterministic snapshot`);
    }
    if (artifact.inventory_sha256 && artifact.inventory_sha256 !== inventorySha) {
      errors.push(`${label}: inventory_sha256 does not match the current inventory artifact`);
    }
  }

  const scenarios = closeout.scenarios.scenarios || [];
  const scenarioIds = new Set();
  const scenarioSkillIds = [];
  for (const scenario of scenarios) {
    if (scenarioIds.has(scenario.scenario_id)) errors.push(`scenarios: duplicate scenario_id ${scenario.scenario_id}`);
    scenarioIds.add(scenario.scenario_id);
    if (scenario.skill_id === null) continue;
    scenarioSkillIds.push(scenario.skill_id);
    if (!currentSkillSet.has(scenario.skill_id)) errors.push(`scenarios: unknown skill_id ${scenario.skill_id}`);
  }
  if (stableJson([...scenarioSkillIds].sort()) !== stableJson(currentSkillIds)) {
    errors.push('scenarios: expected exactly one scenario for every current canonical Skill');
  }
  if (scenarios.filter((scenario) => scenario.skill_id === null).length !== 1) {
    errors.push('scenarios: expected exactly one upstream evidence-only scenario');
  }

  const expectedCoverage = new Map();
  for (const file of inventory.files) expectedCoverage.set(`${file.owning_skill}\0${file.path}`, file);
  for (const relation of coverage.direct_support) expectedCoverage.set(`${relation.owning_skill}\0${relation.path}`, relation);
  const observedCoverage = new Set();
  for (const row of closeout.scenarios.path_coverage || []) {
    const key = `${row.owning_skill}\0${row.path}`;
    const expected = expectedCoverage.get(key);
    if (observedCoverage.has(key)) errors.push(`scenarios.path_coverage: duplicate relation ${row.owning_skill}:${row.path}`);
    observedCoverage.add(key);
    if (!expected) {
      errors.push(`scenarios.path_coverage: unexpected relation ${row.owning_skill}:${row.path}`);
      continue;
    }
    if (row.source_sha256 !== expected.sha256) errors.push(`scenarios.path_coverage: source hash mismatch for ${row.owning_skill}:${row.path}`);
    if (!row.scenario_ids.every((scenarioId) => scenarioIds.has(scenarioId))) {
      errors.push(`scenarios.path_coverage: unknown scenario reference for ${row.owning_skill}:${row.path}`);
    }
  }
  for (const key of expectedCoverage.keys()) {
    if (!observedCoverage.has(key)) errors.push(`scenarios.path_coverage: missing relation ${key.replace('\0', ':')}`);
  }

  const handoffPairs = new Set((closeout.scenarios.handoff_contracts || [])
    .map((entry) => `${entry.producer_skill}->${entry.consumer_skill}`));
  for (const pair of [
    'spec-prd->spec-plan',
    'spec-plan->spec-write-tasks',
    'spec-write-tasks->spec-work',
    'spec-work->spec-code-review',
    'spec-code-review->spec-compound',
  ]) {
    if (!handoffPairs.has(pair)) errors.push(`scenarios.handoff_contracts: missing ${pair}`);
  }

  const baselineBySkill = new Map();
  for (const baseline of closeout.baselines) {
    if (baselineBySkill.has(baseline.skill_id)) errors.push(`baselines: duplicate skill_id ${baseline.skill_id}`);
    baselineBySkill.set(baseline.skill_id, baseline);
    if (baseline.improvement_contract_sha256 !== artifactSha256(baseline.improvement_contract)) {
      errors.push(`baseline:${baseline.skill_id}: improvement_contract_sha256 mismatch`);
    }
  }
  if (stableJson([...baselineBySkill.keys()].sort()) !== stableJson(currentSkillIds)) {
    errors.push('baselines: expected exactly one baseline for every current canonical Skill');
  }

  const upstreamRecords = closeout.upstreamAdjudication.records || [];
  const upstreamById = new Map(upstreamRecords.map((record) => [record.audit_id, record]));
  const upstreamEntries = (closeout.ledger.entries || []).filter((entry) => entry.ce_relation === 'upstream');
  const localEntries = (closeout.ledger.entries || []).filter((entry) => entry.ce_relation === 'local-only');
  if (closeout.ledger.upstream_adjudication_sha256 !== artifactSha256(closeout.upstreamAdjudication)) {
    errors.push('ledger: upstream_adjudication_sha256 mismatch');
  }
  if (closeout.ledger.scenarios_sha256 !== artifactSha256(closeout.scenarios)) {
    errors.push('ledger: scenarios_sha256 mismatch');
  }
  const observedUpstreamIds = new Set();
  for (const entry of upstreamEntries) {
    const record = upstreamById.get(entry.ce_record_id);
    if (observedUpstreamIds.has(entry.ce_record_id)) errors.push(`ledger: duplicate CE record ${entry.ce_record_id}`);
    observedUpstreamIds.add(entry.ce_record_id);
    if (!record) errors.push(`ledger: unknown CE record ${entry.ce_record_id}`);
    else if (record.path !== entry.ce_path) errors.push(`ledger: CE path mismatch for ${entry.ce_record_id}`);
    if (!scenarioIds.has(entry.scenario_id)) errors.push(`ledger: unknown scenario ${entry.scenario_id}`);
  }
  for (const record of upstreamRecords) {
    if (!observedUpstreamIds.has(record.audit_id)) errors.push(`ledger: missing CE record ${record.audit_id}`);
  }
  const localSkills = localEntries.map((entry) => entry.canonical_owner).sort();
  if (stableJson(localSkills) !== stableJson([...LOCAL_ONLY_SKILL_IDS].sort())) {
    errors.push('ledger: local-only entries do not match the six reviewed local-only Skills');
  }
  for (const entry of closeout.ledger.entries || []) {
    if (entry.target_repo_head !== expectedSnapshot.head
      || entry.source_tree_hash !== expectedSnapshot.source_tree_hash
      || entry.inventory_hash !== expectedSnapshot.inventory_hash) {
      errors.push(`ledger:${entry.ledger_id}: source join key does not match current snapshot`);
    }
    const baseline = baselineBySkill.get(entry.canonical_owner);
    if (baseline) {
      const expectedRef = `docs/validation/ce-localization/baseline/${entry.canonical_owner}.json`;
      if (entry.baseline_ref !== expectedRef) errors.push(`ledger:${entry.ledger_id}: baseline_ref mismatch`);
      if (entry.improvement_contract_hash !== baseline.improvement_contract_sha256) {
        errors.push(`ledger:${entry.ledger_id}: improvement contract hash mismatch`);
      }
    }
  }

  const protocolSha = artifactSha256(closeout.fieldProtocol);
  for (const [label, artifact] of [
    ['fieldTaskPairs', closeout.fieldTaskPairs],
    ['fieldResults', closeout.fieldResults],
  ]) {
    if (artifact.protocol_sha256 !== protocolSha) errors.push(`${label}: protocol_sha256 mismatch`);
  }
  if (closeout.knowledgePromotion.field_results_sha256 !== artifactSha256(closeout.fieldResults)) {
    errors.push('knowledgePromotion: field_results_sha256 mismatch');
  }
  if (closeout.fieldResults.overall_status === 'not-run') {
    if (closeout.knowledgePromotion.overall_status === 'promoted') {
      errors.push('knowledgePromotion: field not-run cannot produce promoted knowledge');
    }
    if ((closeout.knowledgePromotion.entries || []).some((entry) => entry.status === 'promoted')) {
      errors.push('knowledgePromotion: promoted entry is invalid while field validation is not-run');
    }
  }

  const uniqueSupportCount = coverage.coverage_summary.direct_support_unique_path_count;
  const packageFactsBySkill = new Map();
  for (const item of coverage.package_files) {
    if (!packageFactsBySkill.has(item.skill_id)) packageFactsBySkill.set(item.skill_id, []);
    packageFactsBySkill.get(item.skill_id).push(item);
  }
  const supportFactsBySkill = new Map();
  for (const item of coverage.direct_support) {
    if (!supportFactsBySkill.has(item.skill_id)) supportFactsBySkill.set(item.skill_id, []);
    supportFactsBySkill.get(item.skill_id).push(item);
  }
  for (const [label, review] of [
    ['review:round3Openai', closeout.reviews.round3Openai],
    ['review:round3Anthropic', closeout.reviews.round3Anthropic],
  ]) {
    const expectedCounts = [
      ['expected_skill_count', inventory.skill_count],
      ['reviewed_skill_count', inventory.skill_count],
      ['expected_package_path_count', inventory.package_path_count],
      ['reviewed_package_path_count', inventory.package_path_count],
      ['expected_direct_support_path_count', uniqueSupportCount],
      ['reviewed_direct_support_path_count', uniqueSupportCount],
      ['expected_direct_support_relation_count', coverage.coverage_summary.direct_support_relation_count],
      ['reviewed_direct_support_relation_count', coverage.coverage_summary.direct_support_relation_count],
    ];
    for (const [field, expected] of expectedCounts) {
      if (review[field] !== expected) errors.push(`${label}: ${field} expected ${expected}, got ${review[field]}`);
    }
    const reviewedSkills = (review.skill_reviews || []).map((entry) => entry.skill_id).sort();
    if (stableJson(reviewedSkills) !== stableJson(currentSkillIds)) {
      errors.push(`${label}: skill_reviews do not cover the exact current Skill set`);
    }
    for (const skillReview of review.skill_reviews || []) {
      const expectedFacts = [
        ...(packageFactsBySkill.get(skillReview.skill_id) || []),
        ...(supportFactsBySkill.get(skillReview.skill_id) || []),
      ];
      const expectedByPath = new Map(expectedFacts.map((item) => [item.path, item]));
      const receipts = skillReview.source_read_receipts || [];
      const actualPaths = [...new Set(receipts.map((item) => item.path))].sort();
      const expectedPaths = [...expectedByPath.keys()].sort();
      if (stableJson(actualPaths) !== stableJson(expectedPaths)) {
        errors.push(`${label}:${skillReview.skill_id}: source receipt paths do not match current coverage`);
      }
      for (const receipt of receipts) {
        const fact = expectedByPath.get(receipt.path);
        if (!fact) continue;
        if (receipt.sha256 !== fact.sha256 || receipt.bytes !== fact.bytes || receipt.line_count !== fact.line_count) {
          errors.push(`${label}:${skillReview.skill_id}:${receipt.path}: source receipt facts are stale`);
        }
        if (stableJson(receipt.covered_line_ranges) !== stableJson([[1, fact.line_count]])) {
          errors.push(`${label}:${skillReview.skill_id}:${receipt.path}: source receipt does not cover [1,line_count]`);
        }
      }
    }
  }
  if (!closeout.report.includes(`${inventory.package_path_count}`)) {
    errors.push(`report: does not reference the current ${inventory.package_path_count}-path inventory`);
  }

  return { valid: errors.length === 0, errors };
}

function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const artifacts = buildArtifacts();
  const schemaValidation = validateCeSetupArtifacts(artifacts);
  if (!schemaValidation.valid) {
    throw new Error(`CE setup artifact schema validation failed:\n${schemaValidation.errors.join('\n')}`);
  }
  const artifactEntries = [
    [args.inventoryPath, artifacts.inventory],
    [args.coveragePath, artifacts.coverage],
    [args.preflightPath, artifacts.preflight],
    [args.matrixPath, artifacts.dependencyMatrix],
  ];
  if (args.refresh) {
    for (const [filePath, value] of artifactEntries) writeArtifact(filePath, value);
  } else {
    for (const [filePath, value] of artifactEntries) {
      if (!fs.existsSync(filePath) || fs.readFileSync(filePath, 'utf8') !== stableJson(value)) {
        throw new Error(`${path.relative(REPO_ROOT, filePath)} is stale; run with --refresh`);
      }
    }
  }
  if (args.verifyCloseout) {
    const closeoutValidation = validateCloseoutArtifacts(loadCloseoutArtifacts(), artifacts);
    if (!closeoutValidation.valid) {
      throw new Error(`CE localization closeout validation failed:\n${closeoutValidation.errors.join('\n')}`);
    }
  }
  process.stdout.write(`${JSON.stringify({
    ok: true,
    mode: args.refresh ? 'refresh' : (args.verifyOnly ? 'verify-only' : 'verify'),
    coverage: artifacts.coverage.coverage_summary,
    inventory_sha256: artifacts.coverage.inventory_sha256,
    review_input_sha256: sha256(stableJson(artifacts.coverage.review_input)),
    ce_setup_preflight_status: artifacts.preflight.overall_status,
    ce_setup_matrix_status: artifacts.dependencyMatrix.overall_status,
    closeout_status: args.verifyCloseout ? 'valid' : 'not-requested',
  })}\n`);
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
  artifactSha256,
  buildArtifacts,
  derivePreflightStatus,
  explicitReferences,
  lineCount,
  loadCloseoutArtifacts,
  main,
  pathRole,
  resolveReference,
  validateCeSetupArtifacts,
  validateCloseoutArtifacts,
};
