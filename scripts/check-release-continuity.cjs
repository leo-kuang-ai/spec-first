#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { runNpm } = require('./lib/npm-cli.cjs');
const {
  DEFAULT_OUTPUT_PATH,
  buildRuntimeCapabilityCatalog,
} = require('./generate-runtime-capability-catalog');
const { getSupportedPlatforms } = require('../src/cli/adapters');

const REPO_ROOT = path.resolve(__dirname, '..');
const PACKAGE_JSON_PATH = path.join(REPO_ROOT, 'package.json');
const GOVERNANCE_PATH = path.join(
  REPO_ROOT,
  'src',
  'cli',
  'contracts',
  'dual-host-governance',
  'skills-governance.json',
);
const GOVERNANCE_SCHEMA_PATH = path.join(
  REPO_ROOT,
  'src',
  'cli',
  'contracts',
  'dual-host-governance',
  'skills-governance.schema.json',
);
const REQUIRED_STANDALONE_SUMMARIES = ['using-spec-first', 'spec-write-tasks'];

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function readJson(filePath) {
  return JSON.parse(read(filePath));
}

function repoPath(...segments) {
  return path.join(REPO_ROOT, ...segments);
}

function hasContractSummary(skillName) {
  const skillPath = repoPath('skills', skillName, 'SKILL.md');
  if (!fs.existsSync(skillPath)) return false;
  const firstHundredTwentyLines = read(skillPath).split(/\r?\n/).slice(0, 120).join('\n');
  return /## (Workflow )?Contract Summary/.test(firstHundredTwentyLines);
}

function guard({ guardId, classification, artifactPath, checkedSources, ok, passReason, failReason }) {
  return {
    guard_id: guardId,
    result: ok ? 'pass' : 'fail',
    reason_code: ok ? passReason : failReason,
    classification,
    artifact_path: artifactPath,
    checked_sources: checkedSources,
  };
}

function checkRuntimeCatalogFresh(options = {}) {
  const outputPath = options.runtimeCatalogPath || DEFAULT_OUTPUT_PATH;
  const artifactPath = path.relative(REPO_ROOT, outputPath);
  let actual;
  try {
    actual = read(outputPath);
  } catch (error) {
    return guard({
      guardId: 'runtime-capability-catalog-fresh',
      classification: 'blocking',
      artifactPath,
      checkedSources: [
        'scripts/generate-runtime-capability-catalog.js',
        'src/cli/plugin.js',
        'src/cli/contracts/dual-host-governance/skills-governance.json',
        'docs/contracts/workflows/*.schema.json',
        'docs/catalog/runtime-capabilities.md',
      ],
      ok: false,
      passReason: 'runtime-catalog-current',
      failReason: error && error.code === 'ENOENT' ? 'runtime-catalog-missing' : 'runtime-catalog-unreadable',
    });
  }
  const expected = buildRuntimeCapabilityCatalog();
  return guard({
    guardId: 'runtime-capability-catalog-fresh',
    classification: 'blocking',
    artifactPath,
    checkedSources: [
      'scripts/generate-runtime-capability-catalog.js',
      'src/cli/plugin.js',
      'src/cli/contracts/dual-host-governance/skills-governance.json',
      'docs/contracts/workflows/*.schema.json',
      'docs/catalog/runtime-capabilities.md',
    ],
    ok: actual === expected,
    passReason: 'runtime-catalog-current',
    failReason: 'runtime-catalog-stale',
  });
}

function checkPublicWorkflowSummaries() {
  const governance = readJson(GOVERNANCE_PATH);
  const workflowSkills = governance.skills
    .filter((skill) => skill.entry_surface === 'workflow_command')
    .map((skill) => skill.skill_name)
    .sort((a, b) => a.localeCompare(b));
  const coveredSkills = [...workflowSkills, ...REQUIRED_STANDALONE_SUMMARIES];
  const missing = coveredSkills.filter((skillName) => !hasContractSummary(skillName));

  return guard({
    guardId: 'public-workflow-contract-summary-coverage',
    classification: 'blocking',
    artifactPath: 'src/cli/contracts/dual-host-governance/skills-governance.json',
    checkedSources: [
      'src/cli/contracts/dual-host-governance/skills-governance.json',
      ...coveredSkills.map((skillName) => `skills/${skillName}/SKILL.md`),
    ],
    ok: missing.length === 0,
    passReason: 'public-workflow-summaries-current',
    failReason: `public-workflow-summaries-missing:${missing.join(',')}`,
  });
}

function checkSupportedHostGovernanceCoherence() {
  const supportedHosts = [...getSupportedPlatforms()].sort();
  const governance = readJson(GOVERNANCE_PATH);
  const schema = readJson(GOVERNANCE_SCHEMA_PATH);
  const hostSchema = schema.$defs && schema.$defs.host;
  const recordSchema = schema.$defs && schema.$defs.skillGovernanceRecord;
  const deliverySchema = recordSchema
    && recordSchema.properties
    && recordSchema.properties.host_delivery;
  const ownerHostValues = recordSchema
    && recordSchema.properties
    && recordSchema.properties.owner_host
    && recordSchema.properties.owner_host.enum;
  const schemaHostSets = [
    Array.isArray(hostSchema && hostSchema.enum) ? [...hostSchema.enum].sort() : [],
    Array.isArray(deliverySchema && deliverySchema.required) ? [...deliverySchema.required].sort() : [],
    deliverySchema && deliverySchema.properties
      ? Object.keys(deliverySchema.properties).sort()
      : [],
    Array.isArray(ownerHostValues)
      ? ownerHostValues.filter((value) => value !== null).sort()
      : [],
  ];
  const mismatchedRecords = (governance.skills || [])
    .filter((record) => (
      JSON.stringify(Object.keys(record.host_delivery || {}).sort()) !== JSON.stringify(supportedHosts)
    ))
    .map((record) => record.skill_name);
  const schemaMatches = schemaHostSets.every((hostSet) => (
    JSON.stringify(hostSet) === JSON.stringify(supportedHosts)
  ));
  const ok = schemaMatches && mismatchedRecords.length === 0;

  return guard({
    guardId: 'supported-host-governance-coherence',
    classification: 'blocking',
    artifactPath: 'src/cli/contracts/dual-host-governance/skills-governance.json',
    checkedSources: [
      'src/cli/adapters/index.js',
      'src/cli/contracts/dual-host-governance/skills-governance.json',
      'src/cli/contracts/dual-host-governance/skills-governance.schema.json',
    ],
    ok,
    passReason: 'supported-host-governance-current',
    failReason: schemaMatches
      ? `supported-host-governance-record-mismatch:${mismatchedRecords.join(',')}`
      : 'supported-host-governance-schema-mismatch',
  });
}

function checkPackageDeliverySurface() {
  const pkg = readJson(PACKAGE_JSON_PATH);
  const requiredFiles = [
    'docs/catalog/runtime-capabilities.md',
    'docs/contracts/workflows/',
    'scripts/check-release-continuity.cjs',
    'scripts/check-website-sync.cjs',
    'scripts/generate-runtime-capability-catalog.js',
    'scripts/run-test-suite.cjs',
    'src/',
    'skills/',
    'templates/',
  ];
  const declaredFiles = Array.isArray(pkg.files) ? pkg.files : [];
  const missing = requiredFiles.filter((entry) => !declaredFiles.includes(entry));
  const tarball = readPackageDryRunFiles();
  const missingFromTarball = tarball.ok
    ? requiredFiles
      .filter((entry) => !entry.endsWith('/'))
      .filter((entry) => !tarball.files.has(entry))
    : requiredFiles;
  const ok = declaredFiles.length > 0 && missing.length === 0 && tarball.ok && missingFromTarball.length === 0;

  return guard({
    guardId: 'package-delivery-surface',
    classification: 'blocking',
    artifactPath: 'package.json',
    checkedSources: [
      'package.json',
      'npm pack --dry-run --json',
    ],
    ok,
    passReason: 'package-delivery-surface-current',
    failReason: declaredFiles.length === 0
      ? 'package-delivery-surface-missing-files-field'
      : missing.length > 0
        ? `package-delivery-surface-missing:${missing.join(',')}`
        : tarball.ok
          ? `package-delivery-tarball-missing:${missingFromTarball.join(',')}`
          : `package-delivery-tarball-unavailable:${tarball.reason}`,
  });
}

function readPackageDryRunFiles() {
  const cacheRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-release-continuity-npm-cache-'));
  let result;
  try {
    result = runNpm(['pack', '--dry-run', '--json'], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
      env: {
        ...process.env,
        npm_config_cache: cacheRoot,
      },
    });
  } catch (error) {
    return { ok: false, reason: error.message, files: new Set() };
  } finally {
    fs.rmSync(cacheRoot, { recursive: true, force: true });
  }
  if (result.error) {
    return { ok: false, reason: result.error.message, files: new Set() };
  }
  if (result.status !== 0) {
    return { ok: false, reason: `exit-${result.status}`, files: new Set() };
  }
  try {
    const payload = JSON.parse(result.stdout);
    const entries = Array.isArray(payload) && payload[0] && Array.isArray(payload[0].files)
      ? payload[0].files
      : [];
    return {
      ok: entries.length > 0,
      reason: entries.length > 0 ? null : 'empty-pack-file-list',
      files: new Set(entries.map((entry) => entry.path).filter(Boolean)),
    };
  } catch (error) {
    return { ok: false, reason: `invalid-json:${error.message}`, files: new Set() };
  }
}

function checkWebsiteGatePreserved() {
  const pkg = readJson(PACKAGE_JSON_PATH);
  const publisher = read(repoPath('scripts', 'release-publish.cjs'));
  const scripts = pkg.scripts && typeof pkg.scripts === 'object' ? pkg.scripts : {};
  const ok = (
    scripts['test:release:website'] === 'node scripts/check-website-sync.cjs --required'
    && publisher.includes("runNpmChecked(['run', 'test:release:website'])")
  );

  return guard({
    guardId: 'website-sync-release-gate-preserved',
    classification: 'blocking',
    artifactPath: 'docs/contracts/website-sync-contract.md',
    checkedSources: [
      'package.json',
      'scripts/release-publish.cjs',
      'scripts/check-website-sync.cjs',
      'docs/contracts/website-sync-contract.md',
    ],
    ok,
    passReason: 'website-sync-release-gate-preserved',
    failReason: 'website-sync-release-gate-missing',
  });
}

function checkReadmeBoundaryLinks() {
  const readme = read(repoPath('README.md'));
  const readmeZh = read(repoPath('README.zh-CN.md'));
  const target = 'docs/contracts/source-runtime-customization-boundary.md';
  const ok = readme.includes(target) && readmeZh.includes(target);

  return guard({
    guardId: 'readme-source-runtime-boundary-links',
    classification: 'docs-only-no-impact',
    artifactPath: 'docs/contracts/source-runtime-customization-boundary.md',
    checkedSources: ['README.md', 'README.zh-CN.md', target],
    ok,
    passReason: 'readme-boundary-links-current',
    failReason: 'readme-boundary-links-missing',
  });
}

function checkOpenCodeReleaseSurface() {
  const pkg = readJson(PACKAGE_JSON_PATH);
  const surfaces = [
    {
      path: 'README.md',
      tokens: [
        'Claude Code, Codex, Kiro, Qoder, Cursor, and OpenCode',
        'spec-first init --opencode',
        '.opencode/commands/spec/**',
        'generated_runtime_preview',
        'The `init -y` default host set remains Claude Code + Codex',
        'opencode.jsonc',
      ],
    },
    {
      path: 'README.zh-CN.md',
      tokens: [
        'Claude Code、Codex、Kiro、Qoder、Cursor 和 OpenCode',
        'spec-first init --opencode',
        '.opencode/commands/spec/**',
        'generated_runtime_preview',
        '`init -y` 默认宿主集合仍只有 Claude Code + Codex',
        'opencode.jsonc',
      ],
    },
    {
      path: 'CLAUDE.md',
      tokens: ['.opencode/commands/spec/', '.opencode/skills/', '.opencode/spec-first/'],
    },
    {
      path: 'AGENTS.md',
      tokens: ['.opencode/commands/spec/', '.opencode/skills/', '.opencode/spec-first/'],
    },
    {
      path: 'docs/contracts/context-governance.md',
      tokens: ['.opencode/commands/spec/**', '.opencode/skills/**', 'opencode.jsonc'],
    },
    {
      path: 'docs/contracts/source-runtime-customization-boundary.md',
      tokens: ['spec-first init --opencode', 'doctor --opencode', '${XDG_CONFIG_HOME}/opencode/opencode.json'],
    },
    {
      path: 'skills/spec-runtime-setup/SKILL.md',
      tokens: ['Kiro/Qoder/Cursor/OpenCode', 'opencode-governed-assets-v1', 'host-config-jsonc-precedence-blocked'],
    },
    {
      path: 'src/cli/brand.js',
      tokens: ['OpenCode preview'],
    },
  ];
  const missing = [];
  for (const surface of surfaces) {
    const content = read(repoPath(surface.path));
    for (const token of surface.tokens) {
      if (!content.includes(token)) missing.push(`${surface.path}:${token}`);
    }
  }
  if (!String(pkg.description || '').includes('OpenCode')) {
    missing.push('package.json:description:OpenCode');
  }
  if (!Array.isArray(pkg.keywords) || !pkg.keywords.includes('opencode')) {
    missing.push('package.json:keywords:opencode');
  }

  return guard({
    guardId: 'opencode-release-surface',
    classification: 'blocking',
    artifactPath: 'README.md',
    checkedSources: [...surfaces.map((surface) => surface.path), 'package.json'],
    ok: missing.length === 0,
    passReason: 'opencode-release-surface-current',
    failReason: `opencode-release-surface-missing:${missing.join(',')}`,
  });
}

function guardException(check, error) {
  return {
    guard_id: check.guardId,
    result: 'fail',
    reason_code: `${check.guardId}-exception`,
    classification: check.classification,
    artifact_path: check.artifactPath,
    checked_sources: check.checkedSources,
    diagnostic: error && error.message ? error.message : String(error),
  };
}

function runChecks(options = {}) {
  const checks = [
    {
      guardId: 'runtime-capability-catalog-fresh',
      classification: 'blocking',
      artifactPath: 'docs/catalog/runtime-capabilities.md',
      checkedSources: [
        'scripts/generate-runtime-capability-catalog.js',
        'src/cli/plugin.js',
        'src/cli/contracts/dual-host-governance/skills-governance.json',
        'docs/contracts/workflows/*.schema.json',
        'docs/catalog/runtime-capabilities.md',
      ],
      run: () => checkRuntimeCatalogFresh(options),
    },
    {
      guardId: 'supported-host-governance-coherence',
      classification: 'blocking',
      artifactPath: 'src/cli/contracts/dual-host-governance/skills-governance.json',
      checkedSources: [
        'src/cli/adapters/index.js',
        'src/cli/contracts/dual-host-governance/skills-governance.json',
        'src/cli/contracts/dual-host-governance/skills-governance.schema.json',
      ],
      run: checkSupportedHostGovernanceCoherence,
    },
    {
      guardId: 'public-workflow-contract-summary-coverage',
      classification: 'blocking',
      artifactPath: 'src/cli/contracts/dual-host-governance/skills-governance.json',
      checkedSources: ['src/cli/contracts/dual-host-governance/skills-governance.json'],
      run: checkPublicWorkflowSummaries,
    },
    {
      guardId: 'package-delivery-surface',
      classification: 'blocking',
      artifactPath: 'package.json',
      checkedSources: ['package.json', 'npm pack --dry-run --json'],
      run: checkPackageDeliverySurface,
    },
    {
      guardId: 'website-sync-release-gate-preserved',
      classification: 'blocking',
      artifactPath: 'docs/contracts/website-sync-contract.md',
      checkedSources: ['package.json', 'scripts/release-publish.cjs', 'scripts/check-website-sync.cjs'],
      run: checkWebsiteGatePreserved,
    },
    {
      guardId: 'readme-source-runtime-boundary-links',
      classification: 'docs-only-no-impact',
      artifactPath: 'docs/contracts/source-runtime-customization-boundary.md',
      checkedSources: ['README.md', 'README.zh-CN.md'],
      run: checkReadmeBoundaryLinks,
    },
    {
      guardId: 'opencode-release-surface',
      classification: 'blocking',
      artifactPath: 'README.md',
      checkedSources: [
        'README.md',
        'README.zh-CN.md',
        'CLAUDE.md',
        'AGENTS.md',
        'docs/contracts/context-governance.md',
        'docs/contracts/source-runtime-customization-boundary.md',
        'skills/spec-runtime-setup/SKILL.md',
        'src/cli/brand.js',
        'package.json',
      ],
      run: checkOpenCodeReleaseSurface,
    },
  ];
  const guards = checks.map((check) => {
    try {
      return check.run();
    } catch (error) {
      return guardException(check, error);
    }
  });
  const blockingFailures = guards.filter((entry) => (
    entry.result === 'fail' && entry.classification === 'blocking'
  ));
  const advisoryFailures = guards.filter((entry) => (
    entry.result === 'fail' && entry.classification !== 'blocking'
  ));

  return {
    schema_version: 'release-continuity-guard/v1',
    status: blockingFailures.length === 0 ? 'passed' : 'failed',
    generated_at: new Date().toISOString(),
    guards,
    blocking_failures: blockingFailures,
    advisory_failures: advisoryFailures,
  };
}

function renderText(result) {
  const lines = [
    `release continuity guard: ${result.status}`,
    ...result.guards.map((entry) => (
      `- ${entry.guard_id}: ${entry.result} ${entry.classification} ${entry.reason_code} (${entry.artifact_path})`
    )),
  ];
  return `${lines.join('\n')}\n`;
}

function main(argv = process.argv.slice(2)) {
  const json = argv.includes('--json');
  const result = runChecks({
    runtimeCatalogPath: process.env.SPEC_FIRST_RUNTIME_CATALOG_PATH || DEFAULT_OUTPUT_PATH,
  });
  process.stdout.write(json ? `${JSON.stringify(result, null, 2)}\n` : renderText(result));
  return result.status === 'passed' ? 0 : 1;
}

if (require.main === module) {
  process.exitCode = main();
}

module.exports = {
  main,
  runChecks,
};
