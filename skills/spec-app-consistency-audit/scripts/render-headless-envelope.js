#!/usr/bin/env node
'use strict';

const path = require('node:path');

const {
  ISSUE_SYNTHESIS_STATUSES,
  parseCommonArgs,
  readJson,
  redactForArtifactText,
  writeTextOutput,
} = require('./lib/audit-utils');

function renderHeadlessEnvelope(options = {}) {
  if (options.status === 'failed') {
    return renderHeadlessFailureEnvelope({
      reasonCode: options.reasonCode || options.reason || 'headless_failed',
      message: options.message || options.statusReason || 'Headless audit failed.',
      runId: options.runId,
    });
  }
  const metadata = options.metadata ? readJson(options.metadata) : {};
  const report = options.report ? readJson(options.report) : { issues: [], rejected_issues: [], scope_and_degraded_modes: [] };
  const issues = Array.isArray(report.issues) ? report.issues : [];
  const rejected = Array.isArray(report.rejected_issues) ? report.rejected_issues : [];
  const degradedModes = collectDegradedModes(metadata, report);
  const confirmed = issues.filter((issue) => issue.contract_status === 'confirmed');
  const candidates = issues.filter((issue) => issue.contract_status !== 'confirmed');
  const synthesisStatus = typeof report.issue_synthesis_status === 'string'
    && ISSUE_SYNTHESIS_STATUSES.has(report.issue_synthesis_status)
    ? report.issue_synthesis_status
    : 'not_run';
  const lines = [
    'App consistency audit complete (headless mode).',
    '',
    `Status: ${safeLine(metadata.status || 'complete', 120)}`,
    'Mode: headless',
    `Run: ${safeLine(metadata.run_id || options.runId || 'unknown', 120)}`,
    `Artifact: ${safePathLine(metadata.run_dir || inferRunDir(options), 240)}`,
    `Summary: ${safePathLine(metadata.summary_path || 'app-consistency-audit.summary.md', 240)}`,
    `Issues: ${safePathLine(metadata.issues_path || 'issues.json', 240)}`,
    `Issue synthesis status: ${safeLine(synthesisStatus, 60)}`,
    `Verification compiler: ${safeLine(report.verification_compiler_status || 'not_run', 60)}`,
    `Verification execution: ${safeLine(report.verification_execution_status || 'not_run', 60)}`,
    `Verification tasks: ${Number(report.verification_summary && report.verification_summary.task_count) || 0}`,
    `Blocked tasks: ${Number(report.verification_summary && report.verification_summary.blocked_count) || 0}`,
    `Human checkpoints: ${Number(report.verification_summary && report.verification_summary.human_checkpoint_count) || 0}`,
    `Verdict: ${buildVerdict(issues, rejected, degradedModes, synthesisStatus)}`,
    `Verdict scope: ${safeLine(metadata.audit_verdict_scope || 'source_only_app_static_audit', 160)}`,
  ];
  if (synthesisStatus === 'not_run') {
    lines.push('Awaiting LLM audit: no semantic issues produced; runner did not invent issues.');
  }

  renderIssues(lines, 'Confirmed issues', confirmed);
  renderIssues(lines, 'Candidate issues', candidates);
  renderRuntimeVerification(lines, issues);
  renderRejected(lines, rejected);
  renderCoverage(lines, metadata, report);

  lines.push('', 'App consistency audit complete');
  return `${lines.join('\n')}\n`;
}

function renderHeadlessFailureEnvelope(options = {}) {
  const reasonCode = safeLine(options.reasonCode || 'headless_failed', 120);
  const message = safeLine(options.message || 'Headless audit failed.', 500);
  const lines = [
    'App consistency audit failed (headless mode).',
    '',
    'Status: failed',
    'Mode: headless',
    `Run: ${safeLine(options.runId || 'unknown', 120)}`,
    `Reason code: ${reasonCode}`,
    `Reason: ${message}`,
    '',
    'App consistency audit complete',
  ];
  return `${lines.join('\n')}\n`;
}

function renderIssues(lines, title, issues) {
  if (issues.length === 0) return;
  lines.push('', `${title}:`);
  for (const issue of issues) {
    const marker = issue.static_confirmed ? 'static-confirmed' : 'candidate';
    lines.push(`[${safeLine(issue.severity || 'medium', 60)}][${marker}] ${safeLine(issue.category || 'app_consistency', 120)} -- ${safeLine(issue.title || issue.id || 'Untitled', 240)} (${safeLine(issue.expert || 'app-audit', 120)}, confidence ${safeLine(issue.confidence ?? 'unknown', 60)})`);
    const evidence = firstEvidence(issue);
    if (evidence) lines.push(`  Evidence: ${safeLine(evidence.summary || evidence.file || evidence.source, 300)}`);
    const impact = firstText(issue.impact);
    if (impact) lines.push(`  Impact: ${safeLine(impact, 300)}`);
    const recommendation = firstText(issue.recommendation);
    if (recommendation) lines.push(`  Recommendation: ${safeLine(recommendation, 300)}`);
    lines.push(`  Validation: ${safeLine(issue.validation_status || 'not_required', 120)}`);
    if (issue.code_review_handoff && issue.code_review_handoff.enabled) {
      const handoff = issue.code_review_handoff;
      lines.push(`  Code-review handoff: ${safeLine(handoff.severity, 60)}, ${safeLine(handoff.autofix_class, 80)}, ${safeLine(handoff.owner, 80)}, requires_verification=${Boolean(handoff.requires_verification)}`);
    }
  }
}

function renderRuntimeVerification(lines, issues) {
  const suggestions = issues
    .filter((issue) => issue.runtime_verification && issue.runtime_verification.required)
    .map((issue) => `- ${safeLine(issue.runtime_verification.level || 'simulator', 80)}: ${safeLine(issue.runtime_verification.reason || issue.title, 300)}`);
  if (suggestions.length === 0) return;
  lines.push('', 'Runtime verification:', ...suggestions);
}

function renderRejected(lines, rejected) {
  if (rejected.length === 0) return;
  lines.push('', 'Rejected findings:');
  for (const issue of rejected) {
    const gate = issue.evidence_gate || {};
    lines.push(`- ${safeLine(issue.title || issue.id || 'Untitled', 240)} -- ${safeLine(gate.reason || 'rejected', 160)}`);
  }
}

function renderCoverage(lines, metadata, report) {
  const degraded = collectDegradedModes(metadata, report);
  lines.push('', 'Coverage:');
  if (metadata.coverage_capabilities) {
    lines.push(`- Capability coverage: ${safeLine(Object.entries(metadata.coverage_capabilities).map(([key, value]) => `${key}=${value}`).join(', '), 500)}`);
  }
  lines.push(`- Degraded modes: ${safeLine(degraded.length > 0 ? degraded.join(', ') : 'none', 500)}`);
  lines.push(`- Evidence gate drops: ${(report.rejected_issues || []).length}`);
}

function collectDegradedModes(metadata, report) {
  return [
    ...(Array.isArray(report.scope_and_degraded_modes) ? report.scope_and_degraded_modes : []),
    ...(Array.isArray(metadata.status_reason_codes) ? metadata.status_reason_codes.map((code) => ({ code })) : []),
  ].map((entry) => entry.code || entry).filter(Boolean);
}

function buildVerdict(issues, rejected, degradedModes = [], synthesisStatus = 'not_run') {
  if (synthesisStatus === 'not_run') return 'Awaiting LLM audit';
  if (issues.some((issue) => issue.severity === 'blocker')) return 'Not ready';
  if (issues.some((issue) => ['high', 'medium'].includes(issue.severity))) return 'Ready with follow-ups';
  if (issues.length === 0 && rejected.length === 0 && degradedModes.length > 0) return 'No issues in scoped audit';
  if (issues.length === 0 && rejected.length === 0) return 'Ready';
  return 'Advisory only';
}

function firstEvidence(issue) {
  if (Array.isArray(issue.evidence)) return issue.evidence[0];
  if (!issue.evidence || typeof issue.evidence !== 'object') return null;
  for (const values of Object.values(issue.evidence)) {
    if (Array.isArray(values) && values[0]) return values[0];
  }
  return null;
}

function firstText(value) {
  if (Array.isArray(value)) return value[0];
  return typeof value === 'string' ? value : '';
}

function inferRunDir(options) {
  return '.spec-first/app-audit/runs/<run-id>/';
}

function safeLine(value, maxLength) {
  return redactForArtifactText(String(value ?? ''), { maxLength });
}

function safePathLine(value, maxLength) {
  const raw = String(value ?? '');
  if (path.isAbsolute(raw) || /^[A-Za-z]:[\\/]/.test(raw)) {
    return '<absolute-path:redacted>';
  }
  return safeLine(raw, maxLength);
}

function parseArgs(argv) {
  const options = parseCommonArgs(argv);
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--metadata') options.metadata = argv[++index];
    else if (arg === '--report') options.report = argv[++index];
    else if (arg === '--reason-code') options.reasonCode = argv[++index];
    else if (arg === '--message') options.message = argv[++index];
  }
  return options;
}

if (require.main === module) {
  try {
    const options = parseArgs(process.argv.slice(2));
    const envelope = renderHeadlessEnvelope(options);
    writeTextOutput(envelope, options.output, options);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = {
  renderHeadlessEnvelope,
  renderHeadlessFailureEnvelope,
};
