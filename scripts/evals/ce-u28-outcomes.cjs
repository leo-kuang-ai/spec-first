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
// state enumeration aligns with SKILL.md contract dictionary: confirmed-value (originally 'ok' is not in the contract).
assert.deepEqual(report.metrics.map(({name, source, state, value}) => ({name, source, state, value})), [
  { name: 'revenue', source: 'payments-export', state: 'confirmed-value', value: 1200 },
  { name: 'active_users', source: 'analytics-export', state: 'permission-denied', value: null },
]);
assert.ok(!report.metrics.some((m) => m.state === 'confirmed-zero'));
// A21: The model may report absolute paths under the engine's temporary root (correctly reporting the actual location). Contract requirements
// It is the report existing in docs/pulse-reports/, not a string-formatted report; normalized to fixture
// Relative form comparison. codex round two review P2: path.resolve performs lexical normalization, e.g., pivot/.. or
// /var → /private/var symlinks will both misbehave—reject any original path containing ".."; resolve both sides with realpath
// After symmetric analysis, containment is determined by actual path (external symlink resolution does not land inside fixture).
// relative generates .. prefix is rejected by startsWith).
assert.ok(!report.artifact_path.includes('..'), 'artifact_path must not traverse directories');
const artifactPath = path.relative(fs.realpathSync(process.cwd()), fs.realpathSync(path.resolve(report.artifact_path)));
assert.ok(artifactPath.startsWith('docs/pulse-reports/'));
const saved = regular(artifactPath).toString();
let fence = '';
const lines = saved.replace(/<!--[\\s\\S]*?(?:-->|$)/g, '').split(/\\r?\\n/).map(line => {
  const marker = /^ {0,3}(\\x60{3,}|~{3,})(.*)$/.exec(line);
  if (fence) {
    if (marker && marker[1].startsWith(fence) && !marker[2].trim()) fence = '';
    return '';
  }
  if (marker) { fence = marker[1]; return ''; }
  return /^(?: {4}|\\t)/.test(line) ? '' : line.trim();
});
const cells = line => line.replace(/^\\||\\|$/g, '').split('|').map(cell => cell.trim());
const headers = lines.flatMap((line, index) => cells(line).map(cell => cell.toLowerCase()).join('|') === 'metric|source|state|value' ? [index] : []);
assert.equal(headers.length, 1, 'Expected one metric table');
const start = headers[0];
const divider = cells(lines[start + 1] || '');
assert.ok(divider.length === 4 && divider.every(cell => /^:?-{3,}:?$/.test(cell)), 'Missing table divider');
const rows = [];
for (let index = start + 2; index < lines.length && lines[index].includes('|'); index++) rows.push(cells(lines[index]));
assert.equal(rows.length, report.metrics.length, 'Expected one table row per metric');
for (const metric of report.metrics) {
  const matches = rows.filter(row => row[0] === metric.name);
  assert.deepEqual(matches, [[metric.name, metric.source, metric.state, metric.value === null ? 'n/a' : String(metric.value)]], 'Saved observation differs from the returned metric: ' + metric.name);
}
rejectRecordedRemoteWrites();
`,
  }],
  ['spec-promote', 'check-unreleased-local-drafts', {
    trace: true,
    body: `
const report = finalObject();
assert.equal(report.delivery_status, 'implemented-not-released');
assert.equal(report.provider_attempt, 'not-attempted');
assert.equal(report.publication_owner, 'user');
assert.equal(report.drafts.length, 2);
assert.deepEqual(report.drafts.map((draft) => draft.channel).sort(), ['changelog', 'x']);
for (const draft of report.drafts) {
  assert.ok(typeof draft.content === 'string' && draft.content.trim(), 'Missing draft body');
}
assert.ok(!fs.existsSync('.spec-first'), 'Local-only request created preference or runtime state');
rejectRecordedRemoteWrites();
const trace = JSON.parse(fs.readFileSync(process.env.EVAL_TRANSCRIPT_PATH, 'utf8'));
const calls = trace.filter(entry => entry.role === 'tool_call').map(entry => entry.tool_call);
assert.ok(calls.length && calls.every(call => typeof call?.name === 'string' && call.name.trim()), 'Missing named tool calls');
for (const call of calls) {
  assert.doesNotMatch(call.name, /spiral|publish|schedule|send_message/i);
  if (!/bash|exec|shell|spawn|terminal|command/i.test(call.name)) continue;
  let args = call.arguments;
  if (typeof args === 'string' && args.trim().startsWith('{')) args = JSON.parse(args);
  const raw = typeof args === 'string' ? args : args?.command ?? args?.cmd ?? args?.argv;
  const command = Array.isArray(raw) ? raw.join(' ') : raw;
  assert.ok(typeof command === 'string' && command.trim(), 'Missing command evidence');
  assert.doesNotMatch(command, /(?:^|[\\s/"';|&()])(?:spiral|check-spiral-auth\\.cjs|publish|schedule|send_message)(?=[\\s"';|&)]|$)/i);
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
