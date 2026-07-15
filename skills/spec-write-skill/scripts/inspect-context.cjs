#!/usr/bin/env node
'use strict';

const crypto = require('node:crypto');
const { inspectPackage, readStableRegularFile } = require('./lib/package-inspection.cjs');

const SHA256 = /^[a-f0-9]{64}$/;

function payloadFinding(reason_code, status, path, message) {
  return { reason_code, check: 'target-payload', status, path, message };
}

function smokeTargetPayload({ payloadDir, runtimeFileSet }) {
  const facts = inspectPackage(payloadDir);
  const findings = [...facts.findings];
  let incomplete = facts.result === 'incomplete';
  const files = runtimeFileSet && runtimeFileSet.files;
  if (!runtimeFileSet || !Array.isArray(files) || files.some((entry) => !entry || typeof entry.path !== 'string' || typeof entry.consumer !== 'string' || !entry.consumer || !SHA256.test(entry.expected_sha256 || ''))) {
    findings.push(payloadFinding('runtime_file_set_invalid', 'error', null, 'runtime_file_set files require path, explicit consumer, and expected SHA-256.'));
  }
  const declared = new Set(Array.isArray(files) ? files.map((entry) => entry.path) : []);
  const actual = new Set(facts.regular_file_inventory);
  if (facts.findings.some((entry) => entry.reason_code === 'secret_like_file_not_read' || entry.reason_code === 'secret_like_directory_not_read')) {
    findings.push(payloadFinding('payload_secret_like_path_forbidden', 'error', null, 'Payload contains a secret-like path and cannot prove complete runtime closure.'));
  }
  for (const file of facts.regular_file_inventory) {
    if (file === 'evals' || file.startsWith('evals/') || file === 'docs' || file.startsWith('docs/') || file === 'reports' || file.startsWith('reports/')) {
      findings.push(payloadFinding('maintainer_only_payload_forbidden', 'error', file, 'Payload must not include maintainer-only evals or repository-local docs.'));
    }
  }
  for (const entry of files || []) {
    if (!actual.has(entry.path) || !SHA256.test(entry.expected_sha256 || '')) continue;
    try {
      const actualHash = crypto.createHash('sha256').update(readStableRegularFile(`${payloadDir}/${entry.path}`)).digest('hex');
      if (actualHash !== entry.expected_sha256) findings.push(payloadFinding('payload_content_drift', 'error', entry.path, 'Payload file differs from its source-derived expected SHA-256.'));
    } catch (error) {
      findings.push(payloadFinding('payload_file_unreadable', 'error', entry.path, error.message));
    }
  }
  for (const edge of facts.direct_reference_edges) {
    if (!declared.has(edge.target)) findings.push(payloadFinding('runtime_reference_undeclared', 'error', edge.target, `Runtime reference from ${edge.source} is absent from runtime_file_set.`));
  }
  if (declared.size !== actual.size || [...declared].some((file) => !actual.has(file)) || [...actual].some((file) => !declared.has(file))) {
    findings.push(payloadFinding('payload_closure_mismatch', 'error', null, 'runtime_file_set and actual payload files must form the same closure.'));
  }
  if (!runtimeFileSet || runtimeFileSet.dynamic_dependencies !== 'none') {
    incomplete = true;
    findings.push(payloadFinding('dynamic_dependency_unresolved', 'not_checked', null, 'Dynamic dependencies cannot be statically declared; target readiness is degraded.'));
  }
  const hasErrors = findings.some((entry) => entry.status === 'error');
  const result = hasErrors ? 'fail' : incomplete ? 'incomplete' : 'pass';
  return {
    schema_version: 'spec-write-skill.target-payload-smoke/v1',
    result,
    target_readiness: result === 'pass' ? 'ready' : result === 'incomplete' ? 'degraded' : 'not-ready',
    runtime_file_set: files || [],
    actual_payload_files: facts.regular_file_inventory,
    findings,
    limitations: [
      'This smoke check does not execute package code, host invocation, init, publish, or a target-provided validator.',
      'A complete runtime_file_set is a packaging claim, not evidence of cross-host feature parity.',
    ],
  };
}

function parseArgs(argv) {
  const args = { mode: 'context', skillDir: null, payloadDir: null, runtimeFileSetPath: null, json: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--json') args.json = true;
    else if (arg === '--payload-smoke') {
      args.mode = 'payload-smoke';
      args.payloadDir = argv[++index] || null;
    } else if (arg === '--runtime-file-set') args.runtimeFileSetPath = argv[++index] || null;
    else if (!arg.startsWith('-') && !args.skillDir) args.skillDir = arg;
    else throw new Error(`Unknown or incomplete argument: ${arg}`);
  }
  if (args.mode === 'payload-smoke') {
    if (!args.payloadDir || !args.runtimeFileSetPath) throw new Error('Usage: inspect-context.cjs --payload-smoke <payload-dir> --runtime-file-set <runtime-file-set.json> [--json]');
  } else if (!args.skillDir) throw new Error('Usage: inspect-context.cjs <skill-dir> [--json]');
  return args;
}

function inspectContext(options) {
  return inspectPackage(options.skillDir, options);
}

function renderHuman(report) {
  const lines = [
    `Skill context facts: ${report.result}`,
    `Root: ${report.skill_root}`,
    `Markdown reachable: ${report.reachable_markdown.length}`,
    `Markdown candidates: ${report.unreferenced_markdown_candidates.length}`,
  ];
  for (const finding of report.findings) lines.push(`[${finding.status}] ${finding.reason_code}${finding.path ? ` (${finding.path})` : ''}: ${finding.message}`);
  return lines.join('\n');
}

function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    return 2;
  }
  let report;
  if (args.mode === 'payload-smoke') {
    let runtimeFileSet;
    try {
      runtimeFileSet = JSON.parse(readStableRegularFile(args.runtimeFileSetPath).toString('utf8'));
    } catch (error) {
      report = {
        schema_version: 'spec-write-skill.target-payload-smoke/v1',
        result: 'fail',
        target_readiness: 'not-ready',
        runtime_file_set: [],
        actual_payload_files: [],
        findings: [payloadFinding('runtime_file_set_unreadable', 'error', null, error.message)],
        limitations: ['Payload smoke cannot proceed without a readable runtime_file_set.'],
      };
      process.stdout.write(`${args.json ? JSON.stringify(report, null, 2) : renderHuman(report)}\n`);
      return 1;
    }
    report = smokeTargetPayload({ payloadDir: args.payloadDir, runtimeFileSet });
  } else {
    report = inspectContext(args);
  }
  process.stdout.write(`${args.json ? JSON.stringify(report, null, 2) : renderHuman(report)}\n`);
  return report.result === 'pass' ? 0 : report.result === 'fail' ? 1 : 2;
}

if (require.main === module) process.exitCode = main();

module.exports = { inspectContext, parseArgs, renderHuman, smokeTargetPayload };
