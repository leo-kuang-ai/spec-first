'use strict';

// Supplemental outcome cases; U31's frozen comparison scenarios remain immutable.
const groups = [
  ['spec-strategy', 'check-owned-update', {
    options: { mutableFiles: ['STRATEGY.md'] },
    body: `
const original = execFileSync('git', ['show', 'HEAD:STRATEGY.md'], { env: cleanEnv, encoding: 'utf8' });
assert.equal(regular('STRATEGY.md').toString(), original.replace('Old approach.', 'Focus on offline reconciliation.'));
`,
  }],
  ['spec-product-pulse', 'check-source-outcomes', {
    options: { allowNewDocs: true }, trace: true,
    body: `
const report = finalObject();
// state 枚举对齐 SKILL.md 合同词表：confirmed-value（原 'ok' 不在合同中）。
assert.deepEqual(report.metrics.map(({name, source, state, value}) => ({name, source, state, value})), [
  { name: 'revenue', source: 'payments-export', state: 'confirmed-value', value: 1200 },
  { name: 'active_users', source: 'analytics-export', state: 'permission-denied', value: null },
]);
assert.ok(!report.metrics.some((m) => m.state === 'confirmed-zero'));
assert.ok(report.artifact_path.startsWith('docs/pulse-reports/'));
const saved = regular(report.artifact_path).toString();
assert.ok(saved.includes('1200') && saved.includes('permission-denied'));
rejectRecordedRemoteWrites();
`,
  }],
  ['spec-promote', 'check-unreleased-local-drafts', {
    trace: true,
    body: `
const report = finalObject();
assert.equal(report.delivery_status, 'implemented-not-released');
assert.equal(report.provider_attempt, 'not-attempted');
assert.equal(report.drafts.length, 2);
assert.deepEqual(report.drafts.map((draft) => draft.channel).sort(), ['changelog', 'x']);
for (const draft of report.drafts) {
  assert.ok(typeof draft.content === 'string' && draft.content.length > 20);
}
assert.ok(!fs.existsSync('.spec-first'), 'Local-only request created preference or runtime state');
rejectRecordedRemoteWrites();
const trace = JSON.parse(fs.readFileSync(process.env.EVAL_TRANSCRIPT_PATH, 'utf8'));
for (const entry of trace.filter((item) => item.role === 'tool_call')) {
  // 只按调用意图判 attempt：工具名，或执行类工具（bash/exec/shell/run 等）的命令文本。
  // 读取 skill 自带 references/scripts（路径含 spiral 等词）是合法尽调，不算 attempt。
  const call = entry.tool_call || {};
  const isExecution = /bash|exec|shell|spawn|terminal|run[_-]?command|command/i.test(call.name || '');
  const intent = (call.name || '') + (isExecution ? ' ' + JSON.stringify(call.arguments || {}) : '');
  assert.ok(!/spiral|check-spiral-auth|publish|schedule|send_message/i.test(intent), 'Unexpected provider/setup/publication attempt');
}
`,
  }],
  ['spec-handoff', 'check-research-continuation', {
    trace: true,
    body: `
const report = finalObject();
assert.equal(report.owner, 'research');
// remaining_fact wording is free-form; pin the fact (retry limit is 2) by tokens.
assert.ok(/(?:retr|重试)/i.test(String(report.remaining_fact)) && /(?:limit|上限)/i.test(String(report.remaining_fact)) && /2/.test(String(report.remaining_fact)));
assert.ok(report.evidence.includes('src/retry.js'));
assert.ok(transcriptCalls().some((call) => JSON.stringify(call.arguments).includes('src/retry.js')), 'No completed source-read call in runner trace');
assert.ok(!fs.existsSync('.spec-first/workflows/spec-handoff'));
rejectRecordedRemoteWrites();
`,
  }],
  ['spec-handoff', 'check-review-continuation', {
    trace: true,
    body: `
const report = finalObject();
assert.equal(report.owner, 'review');
// The case contract fixes {file, issue} shape but leaves issue wording free-form;
// match the defect semantics (permanent-error retry) by token, not exact string.
assert.ok(report.findings.some((finding) => finding.file === 'src/retry.js'
  && /permanent|永久/i.test(String(finding.issue)) && /retr|重试/i.test(String(finding.issue))));
assert.ok(transcriptCalls().some((call) => JSON.stringify(call.arguments).includes('src/retry.js')), 'No completed source-read call in runner trace');
assert.ok(!fs.existsSync('.spec-first/workflows/spec-handoff'));
rejectRecordedRemoteWrites();
`,
  }],
  ['spec-riffrec-feedback-analysis', 'check-local-evidence', {
    trace: true,
    body: `
const result = JSON.parse(regular('local-evidence/analysis.json'));
assert.equal(result.transcript.provider_request_sent, false);
assert.ok(result.event_moments.some((event) => event.reason === 'console_error event'));
const report = finalObject();
assert.equal(report.confirmed_requirements, 0);
assert.equal(report.coverage, 'events-only');
assert.equal(report.source_manifest_visibility, 'private');
assert.ok(!fs.existsSync('docs/plans'), 'Analyzer scaffold was promoted to a plan');
rejectRecordedRemoteWrites();
`,
  }],
];

module.exports = { groups };
