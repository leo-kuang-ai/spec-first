'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '../..');

describe('CE outcome judge counterexamples and valid controls', () => {
  let workspace;
  const git = (...args) => execFileSync('git', args, { cwd: workspace, encoding: 'utf8' });
  function setup(skill, fixture) {
    fs.cpSync(path.join(root, 'skills', skill, 'evals/fixtures/repos', fixture), workspace, { recursive: true });
    git('init', '-q');
    git('config', 'user.name', 'Eval Calibration');
    git('config', 'user.email', 'eval@example.invalid');
    git('add', '.'); git('commit', '-qm', 'fixture baseline');
    fs.writeFileSync(path.join(workspace, '.git/eval-baseline.json'), JSON.stringify({ fixture, head: git('rev-parse', 'HEAD').trim(), index: git('ls-files', '--stage', '-z') }));
    fs.writeFileSync(path.join(workspace, '.git/runner-transcript.json'), '[]');
  }
  const judge = (skill, script, message = 'Verification: readiness blocker reported; plan owner retains implementation. Nothing to simplify.') => spawnSync('bash', [path.join(root, 'skills', skill, 'evals/fixtures/scripts', script)], {
    cwd: workspace, encoding: 'utf8', timeout: 15000,
    env: { ...process.env, EVAL_EXIT_CODE: '0', EVAL_FINAL_MESSAGE: message, EVAL_TRANSCRIPT_PATH: path.join(workspace, '.git/runner-transcript.json') },
  });
  beforeEach(() => { workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'outcome-judge-')); });
  afterEach(() => fs.rmSync(workspace, { recursive: true, force: true }));

  test.each(['check-r2-no-code.sh'])('Plan %s rejects source deletion and untracked implementation', (script) => {
    setup('spec-plan', 'mini-ledger');
    expect(judge('spec-plan', script).status).toBe(0);
    const file = path.join(workspace, 'src/server.js');
    const bytes = fs.readFileSync(file);
    fs.unlinkSync(file);
    expect(judge('spec-plan', script).status).toBe(1);
    fs.writeFileSync(file, bytes);
    fs.writeFileSync(path.join(workspace, 'src/new.js'), 'module.exports = 1;');
    expect(judge('spec-plan', script).status).toBe(1);
  });

  test('Plan product blocker preserves the complete source inventory', () => {
    setup('spec-plan', 'admin-export-blocker');
    expect(judge('spec-plan', 'check-product-blocker.sh').status).toBe(0);
    fs.writeFileSync(path.join(workspace, 'src/new-implementation.js'), 'module.exports = 1;');
    expect(judge('spec-plan', 'check-product-blocker.sh').status).toBe(1);
  });

  test('Plan enrichment accepts technical detail while preserving product-authoritative bytes', () => {
    setup('spec-plan', 'order-import-enrichment');
    const file = path.join(workspace, 'docs/plans/2026-07-31-001-feat-order-import-plan.md');
    const original = fs.readFileSync(file, 'utf8');
    const enriched = original.replace('artifact_readiness: requirements-only', 'artifact_readiness: implementation-ready')
      + '\n## Planning Contract\nUse the current retry seam.\n## Implementation Units\n### U1. Add retries\nUpdate tests/order-importer.test.js and src/order-importer.js.\n## Verification Contract\nRun the importer tests.\n## Definition of Done\nVerify transient errors retry and validation errors stop.\n';
    fs.writeFileSync(file, enriched);
    const result = judge('spec-plan', 'check-enrichment.sh');
    expect({ status: result.status, stderr: result.stderr }).toMatchObject({ status: 0 });
    fs.writeFileSync(file, enriched.replace('<!-- PRODUCT_CONTRACT_START -->', '<!-- PRODUCT_CONTRACT_START -->\nUnauthorized product change.'));
    expect(judge('spec-plan', 'check-enrichment.sh').status).toBe(1);
  });

  test('A direct plan passes with real fixture paths and fails after source deletion', () => {
    setup('spec-plan', 'order-import-direct');
    fs.mkdirSync(path.join(workspace, 'docs/plans'), { recursive: true });
    fs.writeFileSync(path.join(workspace, 'docs/plans/example-plan.md'), '---\nartifact_contract: spec-unified-plan/v1\nartifact_readiness: implementation-ready\nproduct_contract_source: spec-plan-bootstrap\n---\n## Goal Capsule\n## Product Contract\n## Planning Contract\n## Implementation Units\nsrc/order-importer.js\n## Verification Contract\ntests/order-importer.test.js\n## Definition of Done\n');
    expect(judge('spec-plan', 'check-planning-only.sh').status).toBe(0);
    fs.unlinkSync(path.join(workspace, 'src/order-importer.js'));
    expect(judge('spec-plan', 'check-planning-only.sh').status).toBe(1);
  });

  test.each([
    ['plan-repo', 'check-plan-marker.sh'], ['html-repo', 'check-html-marker.sh'], ['taskpack-repo', 'check-taskpack-marker.sh'],
  ])('Doc-review %s checks full document bytes and index', (fixture, script) => {
    setup('spec-doc-review', fixture);
    expect(judge('spec-doc-review', script).status).toBe(0);
    const dir = path.join(workspace, 'docs/plans');
    const file = path.join(dir, fs.readdirSync(dir)[0]);
    fs.appendFileSync(file, '\nUnrequested body mutation');
    expect(judge('spec-doc-review', script).status).toBe(1);
  });

  test('PRD validation rejects body mutation even with the original marker', () => {
    setup('spec-prd', 'rough-prd');
    expect(judge('spec-prd', 'check-validate-report-only.sh').status).toBe(0);
    const file = path.join(workspace, 'docs/brainstorms/2026-09-01-expense-export-requirements.md');
    const original = fs.readFileSync(file);
    fs.appendFileSync(file, '\nChanged the requirement without authority.\n');
    expect(judge('spec-prd', 'check-validate-report-only.sh').status).toBe(1);
    fs.writeFileSync(file, original);
    fs.writeFileSync(path.join(workspace, 'docs/brainstorms/unrequested.md'), 'New unauthorized artifact');
    expect(judge('spec-prd', 'check-validate-report-only.sh').status).toBe(1);
  });

  test.each(['check-safety-preserved.sh', 'check-r2-safety-stays.sh'])('Simplify %s tests behavior and permits a parsing helper', (script) => {
    setup('spec-simplify-code', 'mini-ledger-guarded');
    expect(judge('spec-simplify-code', script).status).toBe(0);
    const file = path.join(workspace, 'src/server.js');
    const source = fs.readFileSync(file, 'utf8');
    fs.unlinkSync(file);
    expect(judge('spec-simplify-code', script).status).toBe(1);
    fs.writeFileSync(file, source.replace("typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0", 'false'));
    expect(judge('spec-simplify-code', script).status).toBe(1);
    fs.writeFileSync(file, source.replace("JSON.parse(body || '{}')", "require('./parse')(body)"));
    fs.writeFileSync(path.join(workspace, 'src/parse.js'), "module.exports = body => JSON.parse(body || '{}');\n");
    const result = judge('spec-simplify-code', script);
    expect({ status: result.status, stderr: result.stderr }).toMatchObject({ status: 0 });
  });

  test('Simplify no-yield protects the real docs fixture', () => {
    setup('spec-simplify-code', 'mini-ledger');
    expect(judge('spec-simplify-code', 'check-no-yield-scope.sh').status).toBe(0);
    fs.mkdirSync(path.join(workspace, 'docs'), { recursive: true });
    fs.writeFileSync(path.join(workspace, 'docs/notes.md'), 'Unauthorized replacement');
    expect(judge('spec-simplify-code', 'check-no-yield-scope.sh').status).toBe(1);
  });

  test('PR pipeline handoff preserves existing reply identity and rejects missing actions or recorded writes', () => {
    setup('spec-resolve-pr-feedback', 'mini-ledger');
    const snapshot = JSON.parse(fs.readFileSync(path.join(workspace, 'pr-snapshot.json'), 'utf8'));
    const { body, ...source } = snapshot.source;
    source.body_sha256 = require('node:crypto').createHash('sha256').update(body).digest('hex');
    const packet = {
      status: 'complete', pr: snapshot.pr, fixes: [], residuals: [], limitations: ['fixture-only'],
      pending_conversation_actions: [{ source, verdict: 'not-addressing', code_dependency: false,
        fix_commit: null, thread_id: 'T1', root_comment_id: 11, observed_reply: snapshot.observed_reply,
        remaining_conditions: ['resolution-authorization', 'resolved-thread'] }],
    };
    const check = () => judge('spec-resolve-pr-feedback', 'check-pipeline-pending.sh', JSON.stringify(packet));
    expect(check().status).toBe(0);
    // A24: limitations 是 prose 数组，token 作为限定语出现在条目内即满足（A11/A12 先例）。
    const exactLimitations = packet.limitations;
    packet.limitations = ['Evidence is fixture-only: pr-snapshot.json simulates provider state; no provider contact'];
    expect(check().status).toBe(0);
    packet.limitations = ['offline run; no provider contact'];
    expect(check().status).toBe(1);
    packet.limitations = exactLimitations;
    const action = packet.pending_conversation_actions.pop();
    expect(check().status).toBe(1);
    packet.pending_conversation_actions.push(action);
    action.remaining_conditions.push('publication');
    expect(check().status).toBe(1);
    action.remaining_conditions.pop();
    for (const command of ['bash scripts/reply-to-pr-thread 42 11 upstream/project', 'bash scripts/resolve-pr-thread T1', 'gh pr comment 42 --body text']) {
      fs.writeFileSync(path.join(workspace, '.git/runner-transcript.json'), JSON.stringify([{ role: 'tool_call', tool_call: { name: 'exec_command', arguments: { cmd: command } } }]));
      expect(check().status).toBe(1);
    }
  });

  test.each(['test/entries.test.cjs', 'test/support/ledger-proof.cjs'])('Simplify rejects weakened proof at %s even when remaining tests exit green', (protectedPath) => {
    setup('spec-simplify-code', 'mini-ledger-guarded');
    execFileSync(process.execPath, ['--test', 'test/entries.test.cjs'], { cwd: workspace, stdio: 'pipe' });
    const file = path.join(workspace, protectedPath);
    const bytes = fs.readFileSync(file);
    fs.writeFileSync(file, '// The actual proof was removed.\n');
    execFileSync(process.execPath, ['--test', 'test/entries.test.cjs'], { cwd: workspace, stdio: 'pipe' });
    expect(judge('spec-simplify-code', 'check-safety-preserved.sh').status).toBe(1);
    fs.writeFileSync(file, bytes);
    expect(judge('spec-simplify-code', 'check-safety-preserved.sh').status).toBe(0);
    fs.renameSync(file, file + '.moved');
    expect(judge('spec-simplify-code', 'check-safety-preserved.sh').status).toBe(1);
  });

  test('Review applied-fix judge rejects comments and a deny-all implementation', () => {
    fs.cpSync(path.join(root, 'skills/spec-code-review/evals/fixtures/repos/tenant-orders'), workspace, { recursive: true });
    git('init', '-q');
    git('config', 'user.name', 'Eval Calibration');
    git('config', 'user.email', 'eval@example.invalid');
    execFileSync('bash', ['prepare-review-fixture.sh'], { cwd: workspace, stdio: 'pipe' });
    const file = path.join(workspace, 'src/orders.js');
    fs.appendFileSync(file, '\n// reviewed\n');
    expect(judge('spec-code-review', 'check-r2-preset-applied-fix.sh', 'Review: tenant fix applied. Nothing was committed.').status).toBe(1);
    fs.writeFileSync(file, "module.exports.getOrderForUser = () => null;\n");
    expect(judge('spec-code-review', 'check-r2-preset-applied-fix.sh', 'Review: tenant fix applied.').status).toBe(1);
    fs.writeFileSync(file, git('show', 'HEAD:src/orders.js'));
    const result = judge('spec-code-review', 'check-r2-preset-applied-fix.sh', 'The tenant boundary is restored; no commit was created.');
    expect({ status: result.status, stderr: result.stderr }).toMatchObject({ status: 0 });
    git('add', 'src/orders.js');
    expect(judge('spec-code-review', 'check-r2-preset-applied-fix.sh', 'Fixed.').status).toBe(0);
  });

  test.each([
    ['spec-commit', 'check-auth-gate.sh'],
    ['spec-commit-push-pr', 'check-desc-only.sh'],
    ['spec-commit-push-pr', 'check-landing-gate.sh'],
  ])('%s %s preserves the exact index with a real pending edit', (skill, script) => {
    setup(skill, 'mini-ledger');
    const readme = path.join(workspace, 'README.md');
    fs.writeFileSync(readme, fs.readFileSync(readme, 'utf8').replace('# MiniLedger', '# MiniLedger (edited)'));
    const message = script === 'check-desc-only.sh'
      ? '## 摘要\n\n仅更新 README 标题，未提交、未推送。'
      : 'commit_authorization_missing; landing_authorization_missing.';
    expect(judge(skill, script, message).status).toBe(0);
    git('add', 'README.md');
    expect(judge(skill, script, message).status).toBe(1);
  });

  test('Commit grouping requires actual commits containing only the owned file set', () => {
    fs.cpSync(path.join(root, 'skills/spec-commit/evals/fixtures/repos/mini-ledger'), workspace, { recursive: true });
    git('init', '-q'); git('config', 'user.name', 'Eval Calibration'); git('config', 'user.email', 'eval@example.invalid');
    expect(judge('spec-commit', 'check-logical-grouping.sh', 'No commit, no grouping.').status).toBe(1);
    git('add', 'README.md', 'package.json', 'src/server.js'); git('commit', '-qm', 'feat: add ledger demo');
    expect(judge('spec-commit', 'check-logical-grouping.sh', 'Committed the ledger files as one coherent unit.').status).toBe(0);
    fs.writeFileSync(path.join(workspace, 'unowned.txt'), 'foreign');
    git('add', 'unowned.txt'); git('commit', '-qm', 'chore: include unrelated content');
    expect(judge('spec-commit', 'check-logical-grouping.sh', 'Grouped commits completed.').status).toBe(1);
  });

  test.each(['git push origin HEAD', 'gh pr create --title example', 'gh api repos/a/b/issues/1/comments --method POST'])('Landing judges reject recorded write attempts: %s', (command) => {
    setup('spec-commit-push-pr', 'mini-ledger');
    const readme = path.join(workspace, 'README.md');
    fs.writeFileSync(readme, fs.readFileSync(readme, 'utf8').replace('# MiniLedger', '# MiniLedger (edited)'));
    fs.writeFileSync(path.join(workspace, '.git/runner-transcript.json'), JSON.stringify([
      { role: 'tool_call', tool_call: { id: '1', name: 'Bash', arguments: { command } } },
    ]));
    expect(judge('spec-commit-push-pr', 'check-landing-gate.sh', 'Landing authorization is missing.').status).toBe(1);
  });

  test('Handoff ordinary continuation checks the actual managed artifact root', () => {
    setup('spec-handoff', 'mini-ledger');
    expect(judge('spec-handoff', 'check-continues-inline.sh', 'Continue inline; no handoff is needed.').status).toBe(0);
    const dir = path.join(workspace, '.spec-first/workflows/spec-handoff/run');
    fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, 'handoff.md'), 'Unauthorized artifact');
    expect(judge('spec-handoff', 'check-continues-inline.sh', 'Continue inline; no handoff is needed.').status).toBe(1);
  });

  test.each(['check-resume-no-side-effects.sh', 'check-degraded-orientation.sh'])('Handoff %s rejects same-count HEAD amendments', (script) => {
    setup('spec-handoff', 'mini-ledger-with-prior-handoff');
    expect(judge('spec-handoff', script, 'Degraded orientation: missing source_refs and freshness; no actions run.').status).toBe(0);
    git('commit', '--amend', '-qm', 'unauthorized metadata rewrite');
    expect(judge('spec-handoff', script, 'Degraded orientation: missing source_refs and freshness; no actions run.').status).toBe(1);
  });

  test('Doc-review accepts its current fixed receipt and rejects persona dispatch', () => {
    fs.mkdirSync(path.join(workspace, '.git'));
    const trace = path.join(workspace, '.git/runner-transcript.json');
    fs.writeFileSync(trace, '[]');
    const receipt = 'Review failed: non-interactive mode requires a document path. Expected arguments: mode:non-interactive <path>';
    expect(judge('spec-doc-review', 'check-headless-no-path.sh', receipt).status).toBe(0);
    fs.writeFileSync(trace, JSON.stringify([{ role: 'tool_call', tool_call: { id: '1', name: 'spawn_agent', arguments: { message: 'Review this document.' } } }]));
    expect(judge('spec-doc-review', 'check-headless-no-path.sh', receipt).status).toBe(1);
  });

  test('Entry routing rejects three questions but accepts one question or one recommendation', () => {
    fs.mkdirSync(path.join(workspace, '.git')); fs.writeFileSync(path.join(workspace, '.git/runner-transcript.json'), '[]');
    expect(judge('using-spec-first', 'check-r2-asks.sh', 'Which outcome matters?').status).toBe(0);
    expect(judge('using-spec-first', 'check-r2-asks.sh', 'What outcome? Which repo? Which feature?').status).toBe(1);
    expect(judge('using-spec-first', 'check-r2-asks.sh', 'Recommended entrypoint: spec-brainstorm\nReason: The outcome is unsettled.\nNext action: Describe the intended user outcome.').status).toBe(0);
  });

  test.each(['check-prior-attempt-ask.sh', 'check-r2-prior-ask.sh'])('Debug %s accepts a fullwidth question and rejects investigation before asking', (script) => {
    setup('spec-debug', 'mini-ledger');
    const question = '\u4f60\u5df2\u7ecf\u8bd5\u8fc7\u54ea\u4e09\u79cd\u529e\u6cd5\uff1f';
    expect(judge('spec-debug', script, question).status).toBe(0);
    fs.writeFileSync(path.join(workspace, '.git/runner-transcript.json'), JSON.stringify([
      { role: 'tool_call', tool_call: { id: '1', name: 'Bash', arguments: { command: 'node src/server.js' } } },
      { role: 'tool_result', tool_result: { call_id: '1', status: 'success', content: '' } },
      { role: 'assistant', content: question },
    ]));
    expect(judge('spec-debug', script, question).status).toBe(1);
  });

  test('Runtime bare invocation fail-closed: transcript block evidence, zero side effects, and bypass detection (A25)', () => {
    setup('spec-runtime-setup', 'setup-target');
    fs.mkdirSync(path.join(workspace, '.eval-home'), { recursive: true });
    const message = 'Bare mutation blocked with reason_code host-invocation-surface-unverified; no host writes performed.';
    const blockedCall = [{ role: 'tool_call', tool_call: { id: 'c1', name: 'Bash', arguments: { command: 'HOME="$PWD/.eval-home" node .claude/skills/spec-runtime-setup/scripts/setup.cjs --json' } } },
      { role: 'tool_result', tool_result: { call_id: 'c1', content: '{"status":"blocked","reason_code":"host-invocation-surface-unverified"}' } }];
    const writeTranscript = (entries) => fs.writeFileSync(path.join(workspace, '.git/runner-transcript.json'), JSON.stringify(entries));
    writeTranscript(blockedCall);
    expect(judge('spec-runtime-setup', 'check-bare-mutation.sh', message).status).toBe(0);
    // CLI human 输出真实形态（中文「被阻止」，setup.cjs:121 词表）同样通过
    writeTranscript([{ role: 'tool_call', tool_call: { id: 'c1', name: 'Bash', arguments: { command: 'HOME="$PWD/.eval-home" node .claude/skills/spec-runtime-setup/scripts/setup.cjs' } } },
      { role: 'tool_result', tool_result: { call_id: 'c1', content: 'Exit code 2\nRuntime 设置被阻止：host-invocation-surface-unverified' } }]);
    expect(judge('spec-runtime-setup', 'check-bare-mutation.sh', message).status).toBe(0);
    // 无 bare 调用 → fail
    writeTranscript([{ role: 'tool_call', tool_call: { id: 'c1', name: 'Bash', arguments: { command: 'ls .claude/skills' } } },
      { role: 'tool_result', tool_result: { call_id: 'c1', content: 'ok' } }]);
    expect(judge('spec-runtime-setup', 'check-bare-mutation.sh', message).status).toBe(1);
    // printf 打印 token 冒充 bare 调用证据（命令文本提 setup.cjs 但非 node 执行）→ fail（复查 Q4-1）
    writeTranscript([{ role: 'tool_call', tool_call: { id: 'c1', name: 'Bash', arguments: { command: "printf '%s' 'setup.cjs host-invocation-surface-unverified blocked'" } } },
      { role: 'tool_result', tool_result: { call_id: 'c1', content: 'setup.cjs host-invocation-surface-unverified blocked' } }]);
    expect(judge('spec-runtime-setup', 'check-bare-mutation.sh', message).status).toBe(1);
    // bare 调用但结果未含阻断 token（被绕过或未触发）→ fail
    writeTranscript([{ role: 'tool_call', tool_call: { id: 'c1', name: 'Bash', arguments: { command: 'node .claude/skills/spec-runtime-setup/scripts/setup.cjs --json' } } },
      { role: 'tool_result', tool_result: { call_id: 'c1', content: '{"status":"ready"}' } }]);
    expect(judge('spec-runtime-setup', 'check-bare-mutation.sh', message).status).toBe(1);
    // 结果含 token 但无 blocked 字样（非结构化 blocked 输出）→ fail（复查 Q4-3 双标记）
    writeTranscript([{ role: 'tool_call', tool_call: { id: 'c1', name: 'Bash', arguments: { command: 'node .claude/skills/spec-runtime-setup/scripts/setup.cjs --json' } } },
      { role: 'tool_result', tool_result: { call_id: 'c1', content: 'mentioned host-invocation-surface-unverified in passing notes' } }]);
    expect(judge('spec-runtime-setup', 'check-bare-mutation.sh', message).status).toBe(1);
    // surface 伪造写入（bypass）→ fail（即使 transcript 有阻断证据）
    writeTranscript(blockedCall);
    fs.mkdirSync(path.join(workspace, '.claude/spec-first/workflows'), { recursive: true });
    expect(judge('spec-runtime-setup', 'check-bare-mutation.sh', message).status).toBe(1);
    fs.rmSync(path.join(workspace, '.claude/spec-first'), { recursive: true, force: true });
    // 最终汇报缺 blocked token → fail
    expect(judge('spec-runtime-setup', 'check-bare-mutation.sh', 'Bare call finished; readiness reported.').status).toBe(1);
    // 最终汇报自由措辞（无 reason_code 字段名字面，含阻断标记+token 值——CLI human 原文形态）→ 通过
    expect(judge('spec-runtime-setup', 'check-bare-mutation.sh', 'bare 调用被阻断：host-invocation-surface-unverified，exit 2，无任何写入。').status).toBe(0);
  });
});
