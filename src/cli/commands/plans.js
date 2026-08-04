'use strict';

const fs = require('node:fs');
const path = require('node:path');

const {
  inspectMarkdownFrontmatter,
  normalizeNewlines,
  parseFrontmatterScalarOccurrences,
} = require('../helpers/markdown-frontmatter');
const { CANONICAL_PLAN_STATUSES } = require('../helpers/plan-status');

const AUDIT_SCHEMA_VERSION = 'plan-status-audit/v1';
const CANONICAL_STATUS_SET = new Set(CANONICAL_PLAN_STATUSES);
const LEGACY_CODE_TYPES = new Set(['feat', 'fix', 'refactor']);

function runPlans(argv) {
  const args = Array.isArray(argv) ? [...argv] : [];
  const subcommand = args[0];

  if (!subcommand || subcommand === '--help' || subcommand === '-h') {
    printPlansHelp();
    return 0;
  }

  if (subcommand !== 'audit') {
    return writeError({
      json: args.includes('--json'),
      code: 'plans-subcommand-unknown',
      message: `Unknown plans subcommand: ${subcommand}`,
    });
  }

  return runAudit(args.slice(1));
}

function runAudit(args) {
  const parsed = parseAuditArgs(args);
  if (parsed.help) {
    printAuditHelp();
    return 0;
  }
  if (parsed.error) {
    return writeError({ json: parsed.json, ...parsed.error });
  }

  let plans;
  try {
    plans = auditPlans(process.cwd());
  } catch (error) {
    return writeError({
      json: parsed.json,
      code: 'plans-audit-read-failed',
      message: error instanceof Error ? error.message : String(error),
    });
  }

  if (parsed.status) {
    plans = plans.filter((plan) => plan.validity === 'valid' && plan.status === parsed.status);
  }

  const report = {
    schema_version: AUDIT_SCHEMA_VERSION,
    plans,
  };
  if (parsed.json) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    renderHuman(report);
  }
  return 0;
}

function parseAuditArgs(args) {
  const parsed = { json: false, status: null, help: false, error: null };
  let statusSeen = false;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--help' || arg === '-h') {
      parsed.help = true;
      continue;
    }
    if (arg === '--json') {
      if (parsed.json) {
        parsed.error = { code: 'plans-duplicate-option', message: '--json may be specified only once' };
        return parsed;
      }
      parsed.json = true;
      continue;
    }
    if (arg === '--status' || arg.startsWith('--status=')) {
      if (statusSeen) {
        parsed.error = { code: 'plans-duplicate-option', message: '--status may be specified only once' };
        return parsed;
      }
      statusSeen = true;
      const value = arg === '--status' ? args[index + 1] : arg.slice('--status='.length);
      if (!value || value.startsWith('-')) {
        parsed.error = { code: 'plans-status-required', message: '--status requires a value' };
        return parsed;
      }
      parsed.status = value;
      if (arg === '--status') index += 1;
      continue;
    }
    parsed.error = { code: 'plans-unknown-option', message: `unknown argument: ${arg}` };
    return parsed;
  }

  if (parsed.status && !CANONICAL_STATUS_SET.has(parsed.status)) {
    parsed.error = {
      code: 'plans-status-invalid',
      message: `--status must be one of ${CANONICAL_PLAN_STATUSES.join(', ')}`,
    };
  }
  return parsed;
}

function auditPlans(repoRoot) {
  const resolvedRepoRoot = fs.realpathSync(path.resolve(repoRoot));
  const plansDir = path.join(resolvedRepoRoot, 'docs', 'plans');
  let entries;
  try {
    const plansDirStat = fs.lstatSync(plansDir);
    if (plansDirStat.isSymbolicLink() || !plansDirStat.isDirectory()) {
      throw new Error('docs/plans must be a non-symlink directory.');
    }
    if (fs.realpathSync(plansDir) !== plansDir) {
      throw new Error('docs/plans must resolve inside the repository.');
    }
    entries = fs.readdirSync(plansDir, { withFileTypes: true });
  } catch (error) {
    if (error && error.code === 'ENOENT') return [];
    throw error;
  }

  const plans = [];
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name, 'en'))) {
    if (!entry.name.endsWith('.md') || !entry.isFile()) continue;
    const absolutePath = path.join(plansDir, entry.name);
    const stat = fs.lstatSync(absolutePath);
    if (!stat.isFile() || stat.isSymbolicLink()) continue;

    const content = fs.readFileSync(absolutePath, 'utf8');
    const record = inspectPlan(content, `docs/plans/${entry.name}`);
    if (record) plans.push(record);
  }
  return plans;
}

function inspectPlan(content, planPath) {
  const inspected = inspectMarkdownFrontmatter(content);
  const malformed = Boolean(inspected.error);
  const occurrences = malformed
    ? parseFrontmatterScalarOccurrences(malformedFrontmatter(content))
    : inspected.occurrences;
  if (!isAuditablePlan(occurrences)) return null;

  const status = uniqueReadableScalar(occurrences, 'status');
  const readiness = uniqueReadableScalar(occurrences, 'artifact_readiness');
  let validity;

  if (malformed) validity = 'invalid';
  else if (status.count === 0) validity = 'legacy-missing';
  else if (status.count !== 1 || status.value === null) validity = 'invalid';
  else if (CANONICAL_STATUS_SET.has(status.value)) validity = 'valid';
  else if (status.value === 'closed') validity = 'legacy-closed';
  else validity = 'invalid';

  return {
    path: planPath,
    status: status.value,
    readiness: readiness.value,
    validity,
  };
}

function isAuditablePlan(occurrences) {
  const artifactContract = uniqueReadableScalar(occurrences, 'artifact_contract');
  const execution = uniqueReadableScalar(occurrences, 'execution');
  const type = uniqueReadableScalar(occurrences, 'type');

  if (artifactContract.count > 0) {
    return artifactContract.count === 1
      && artifactContract.value === 'spec-unified-plan/v1'
      && execution.count === 1
      && execution.value === 'code';
  }

  return type.count === 1
    && LEGACY_CODE_TYPES.has(type.value)
    && (execution.count === 0 || (execution.count === 1 && execution.value === 'code'));
}

function uniqueReadableScalar(occurrences, key) {
  const matches = occurrences.filter((occurrence) => occurrence.key === key);
  if (matches.length !== 1) return { count: matches.length, value: null };
  return { count: 1, value: readableScalar(matches[0]) };
}

function readableScalar(occurrence) {
  const raw = occurrence.raw_value.trim();
  if (!raw || ['|', '>'].includes(raw[0]) || ['[', '{'].includes(raw[0])) return null;
  if ((raw.startsWith('"') || raw.startsWith('\'')) && occurrence.quote === null) return null;
  return occurrence.value === '' ? null : occurrence.value;
}

function malformedFrontmatter(content) {
  const text = normalizeNewlines(content);
  return text.startsWith('---\n') ? text.slice(4) : '';
}

function renderHuman(report) {
  process.stdout.write('Plan status audit (Markdown-only, read-only)\n');
  if (report.plans.length === 0) {
    process.stdout.write('No matching plans found.\n');
  } else {
    for (const plan of report.plans) {
      process.stdout.write([
        terminalSafe(plan.path),
        `status=${plan.status === null ? '-' : terminalSafe(plan.status)}`,
        `readiness=${plan.readiness === null ? '-' : terminalSafe(plan.readiness)}`,
        `validity=${plan.validity}`,
      ].join(' | '));
      process.stdout.write('\n');
    }
  }
  process.stdout.write('Note: completed is a lifecycle marker only; it is not proof of tests, CI, merge, release, or field outcome.\n');
  process.stdout.write('Degraded boundary: HTML plans are not scanned.\n');
}

function terminalSafe(value) {
  return String(value).replace(/[\u0000-\u001f\u007f-\u009f]/g, (character) => {
    if (character === '\n') return '\\n';
    if (character === '\r') return '\\r';
    if (character === '\t') return '\\t';
    const code = character.charCodeAt(0).toString(16).padStart(2, '0');
    return `\\x${code}`;
  });
}

function printPlansHelp(toError = false) {
  const output = toError ? process.stderr : process.stdout;
  output.write([
    'Usage: spec-first plans <subcommand> [options]',
    '',
    'Subcommands:',
    '  audit [--status <canonical>] [--json]  Read-only Markdown plan lifecycle audit',
    '',
  ].join('\n'));
}

function printAuditHelp() {
  process.stdout.write([
    'Usage: spec-first plans audit [--status <canonical>] [--json]',
    '',
    `Canonical statuses: ${CANONICAL_PLAN_STATUSES.join(', ')}`,
    'Scans direct regular docs/plans/*.md files only; HTML is not scanned.',
    '',
  ].join('\n'));
}

function writeError({ json, code, message }) {
  if (json) {
    process.stdout.write(`${JSON.stringify({
      schema_version: AUDIT_SCHEMA_VERSION,
      plans: [],
      error: { code, message },
    }, null, 2)}\n`);
  } else {
    process.stderr.write(`error: ${message}\n`);
  }
  return 2;
}

module.exports = {
  AUDIT_SCHEMA_VERSION,
  auditPlans,
  inspectPlan,
  runPlans,
};
