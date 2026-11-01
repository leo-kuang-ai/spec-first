'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '../..');
const pythonWrapper = path.join(repoRoot, 'skills/spec-code-review/scripts/run-python.sh');
const reviewScope = path.join(repoRoot, 'skills/spec-code-review/scripts/review-scope.py');
const findingsMechanics = path.join(repoRoot, 'skills/spec-code-review/scripts/findings-mechanics.py');

describe('spec-code-review mechanical floor', () => {
  test.each(['modify', 'delete', 'add', 'stage', 'outside', 'symlink', 'directory'])('任务未跟踪文件快照：%s', (action) => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-review-untracked-'));
    try {
      git(root, ['init', '-q']);
      git(root, ['config', 'user.email', 'test@example.invalid']);
      git(root, ['config', 'user.name', 'Fixture']);
      git(root, ['config', 'core.hooksPath', '/dev/null']);
      git(root, ['config', 'commit.gpgsign', 'false']);
      fs.writeFileSync(path.join(root, 'base.js'), 'module.exports = 0;\n');
      git(root, ['add', 'base.js']); git(root, ['commit', '-qm', 'base']);
      const base = git(root, ['rev-parse', 'HEAD']).stdout.trim();
      const owned = path.join(root, 'owned file.js');
      if (action !== 'add') fs.writeFileSync(owned, 'module.exports = 1;\n');
      const snapshot = path.join(root, 'snapshot.json');
      const captured = runPython(reviewScope, ['--base', base, '--include-untracked', 'owned file.js', '--snapshot-out', snapshot], { cwd: root });
      expect(captured.status).toBe(0);
      expect(JSON.parse(captured.stdout)).toMatchObject({ status: 'complete', snapshot_written: true, lite_eligible: false });
      if (action === 'modify' || action === 'add') fs.writeFileSync(owned, 'module.exports = 2;\n');
      if (action === 'delete') fs.unlinkSync(owned);
      if (action === 'stage') git(root, ['add', 'owned file.js']);
      if (action === 'outside') fs.writeFileSync(path.join(root, 'unrelated.js'), 'outside\n');
      if (action === 'symlink' || action === 'directory') {
        fs.unlinkSync(owned);
        if (action === 'symlink') fs.symlinkSync(path.join(root, 'base.js'), owned);
        else fs.mkdirSync(owned);
      }
      const verified = JSON.parse(runPython(reviewScope, ['--verify-snapshot', snapshot], { cwd: root }).stdout);
      if (action === 'symlink' || action === 'directory') {
        expect(verified).toMatchObject({ status: 'unknown', mutation_detected: null });
      } else {
        expect(verified).toMatchObject({ status: 'complete', mutation_detected: action !== 'outside' });
        if (action !== 'outside') expect(verified.mutated_paths).toContain('owned file.js');
      }
      const legacy = JSON.parse(fs.readFileSync(snapshot, 'utf8'));
      legacy.schema_version = 'spec-code-review-scope-snapshot/v1';
      fs.writeFileSync(snapshot, JSON.stringify(legacy));
      expect(JSON.parse(runPython(reviewScope, ['--verify-snapshot', snapshot], { cwd: root }).stdout)).toMatchObject({ status: 'unknown', reason_code: 'scope_snapshot_invalid' });
    } finally { fs.rmSync(root, { recursive: true, force: true }); }
  });

  test('非法 snapshot 结构与编码必须结构化 fail closed', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-invalid-snapshot-'));
    try {
      git(root, ['init', '-q']);
      git(root, ['config', 'user.email', 'test@example.invalid']);
      git(root, ['config', 'user.name', 'Fixture']);
      git(root, ['-c', 'core.hooksPath=/dev/null', '-c', 'commit.gpgsign=false', 'commit', '--allow-empty', '-qm', 'base']);
      const snapshot = path.join(root, 'snapshot.json');
      expect(runPython(reviewScope, ['--base', 'HEAD', '--snapshot-out', snapshot], { cwd: root }).status).toBe(0);
      const valid = JSON.parse(fs.readFileSync(snapshot, 'utf8'));
      for (const patch of [
        { changed_files: 1 }, { changed_files: ['x', 1] }, { changed_files: ['x', 'x'], files_changed: 2 },
        { files_changed: -1 }, { files_changed: undefined }, { files_changed: false },
        { base: [] }, { base: 'HEAD' }, { head: undefined }, { diff_sha256: 'bad' },
        { included_untracked: undefined }, { included_untracked: { x: { kind: 'file', sha256: 'bad', mode: 420 } } },
      ]) {
        fs.writeFileSync(snapshot, JSON.stringify({ ...valid, ...patch }));
        const result = runPython(reviewScope, ['--verify-snapshot', snapshot], { cwd: root });
        expect(result.status).toBe(0);
        expect(JSON.parse(result.stdout)).toMatchObject({ status: 'unknown', mutation_detected: null, reason_code: 'scope_snapshot_invalid' });
      }
      fs.writeFileSync(snapshot, Buffer.from([0xff]));
      const result = runPython(reviewScope, ['--verify-snapshot', snapshot], { cwd: root });
      expect(result.status).toBe(0);
      expect(JSON.parse(result.stdout)).toMatchObject({ status: 'unknown', mutation_detected: null, reason_code: 'scope_snapshot_unreadable' });
    } finally { fs.rmSync(root, { recursive: true, force: true }); }
  });

  test('scope helper fails closed for an invalid endpoint', () => {
    const result = runPython(reviewScope, ['--base', 'definitely-missing-ref'], { cwd: repoRoot });
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({
      status: 'unknown',
      exec_lines: null,
      uncounted_files: 1,
      lite_eligible: false,
    });
  });

  test('scope helper distinguishes a small code-only diff from uncounted prose', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-review-scope-'));
    git(root, ['init', '-q']);
    git(root, ['config', 'user.email', 'test@example.com']);
    git(root, ['config', 'user.name', 'Test']);
    fs.writeFileSync(path.join(root, 'sample.js'), 'module.exports = 1;\n');
    git(root, ['add', 'sample.js']);
    git(root, ['commit', '-qm', 'base']);
    const base = git(root, ['rev-parse', 'HEAD']).stdout.trim();
    fs.writeFileSync(path.join(root, 'sample.js'), 'module.exports = 2;\n');

    let result = runPython(reviewScope, ['--base', base], { cwd: root });
    expect(JSON.parse(result.stdout)).toMatchObject({
      status: 'complete',
      exec_lines: 2,
      uncounted_files: 0,
      lite_eligible: true,
    });

    fs.writeFileSync(path.join(root, 'README.md'), '# Changed\n');
    git(root, ['add', 'README.md']);
    result = runPython(reviewScope, ['--base', base], { cwd: root });
    expect(JSON.parse(result.stdout)).toMatchObject({
      status: 'complete',
      uncounted_files: 1,
      lite_eligible: false,
    });
  });

  test('scope helper freezes the reviewed diff and detects reviewer mutation', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-review-freeze-'));
    const snapshot = path.join(root, 'artifacts', 'scope-snapshot.json');
    git(root, ['init', '-q']);
    git(root, ['config', 'user.email', 'test@example.com']);
    git(root, ['config', 'user.name', 'Test']);
    fs.writeFileSync(path.join(root, 'orders.js'), 'module.exports = { tenantCheck: true };\n');
    git(root, ['add', 'orders.js']);
    git(root, ['commit', '-qm', 'base']);
    const base = git(root, ['rev-parse', 'HEAD']).stdout.trim();
    fs.writeFileSync(path.join(root, 'orders.js'), 'module.exports = { tenantCheck: false };\n');

    let result = runPython(reviewScope, ['--base', base, '--snapshot-out', snapshot], { cwd: root });
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({
      status: 'complete',
      files_changed: 1,
      snapshot_written: true,
    });

    result = runPython(reviewScope, ['--verify-snapshot', snapshot], { cwd: root });
    expect(JSON.parse(result.stdout)).toMatchObject({
      status: 'complete',
      mutation_detected: false,
      reason_code: null,
    });

    fs.writeFileSync(path.join(root, 'orders.js'), 'module.exports = { tenantCheck: true };\n');
    result = runPython(reviewScope, ['--verify-snapshot', snapshot], { cwd: root });
    expect(JSON.parse(result.stdout)).toMatchObject({
      status: 'complete',
      mutation_detected: true,
      reason_code: 'reviewer_mutation_detected',
      mutated_paths: ['orders.js'],
    });
  });

  test.each(['unicode', ...(process.platform === 'win32' ? [] : ['control-path']), 'rename', 'binary', 'deletion'])('scope 保留精确路径且未知计数不得走 lite：%s', (scenario) => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-review-paths-'));
    try {
      git(root, ['init', '-q']);
      git(root, ['config', 'user.email', 'test@example.invalid']);
      git(root, ['config', 'user.name', 'Fixture']);
      git(root, ['config', 'core.quotePath', 'true']);
      const name = scenario === 'unicode' || scenario === 'deletion' ? '订单.js'
        : scenario === 'control-path' ? 'order\tline\nitem.js' : 'orders.js';
      fs.writeFileSync(path.join(root, name), 'module.exports = 1;\n'.repeat(10));
      fs.writeFileSync(path.join(root, 'other.js'), 'module.exports = 0;\n');
      git(root, ['add', '--', name, 'other.js']);
      git(root, ['-c', 'core.hooksPath=/dev/null', '-c', 'commit.gpgsign=false', 'commit', '-qm', 'base']);
      let expected = name;
      if (scenario === 'rename') {
        fs.mkdirSync(path.join(root, 'new'));
        expected = 'new/订单.js';
        git(root, ['mv', '--', name, expected]);
      } else if (scenario === 'deletion') fs.unlinkSync(path.join(root, name));
      else if (scenario === 'binary') fs.writeFileSync(path.join(root, name), Buffer.from([0, 1, 2]));
      else fs.appendFileSync(path.join(root, name), 'module.exports.extra = true;\n');
      fs.writeFileSync(path.join(root, 'other.js'), 'module.exports = 2;\n');
      const snapshot = path.join(root, 'snapshot.json');
      const result = runPython(reviewScope, ['--base', 'HEAD', '--snapshot-out', snapshot], { cwd: root });
      expect(result.status).toBe(0);
      const output = JSON.parse(result.stdout);
      expect(output.status).toBe('complete');
      expect(output.changed_files).toEqual([expected, 'other.js'].sort());
      if (scenario === 'binary') expect(output).toMatchObject({ uncounted_files: 1, lite_eligible: false });
      else {
        expect(output.uncounted_files).toBe(0);
        expect(output.exec_lines).toBe(scenario === 'rename' ? 2 : scenario === 'deletion' ? 12 : 3);
      }
      if (scenario === 'deletion') expect(output.deleted_files).toEqual([name]);
      expect(JSON.parse(runPython(reviewScope, ['--verify-snapshot', snapshot], { cwd: root }).stdout))
        .toMatchObject({ status: 'complete', mutation_detected: false });
      fs.writeFileSync(path.join(root, expected), 'module.exports = 99;\n');
      const recheck = JSON.parse(runPython(reviewScope, ['--verify-snapshot', snapshot], { cwd: root }).stdout);
      expect(recheck).toMatchObject({ status: 'complete', mutation_detected: true });
      expect(recheck.mutated_paths).toContain(expected);
    } finally { fs.rmSync(root, { recursive: true, force: true }); }
  });

  test.each([0, 25, 50])('P0 confidence %s without evidence never enters primary', (confidence) => {
    const source = finding({ confidence });
    Object.assign(source.findings[0], { severity: 'P0' });
    delete source.findings[0].first_evidence;
    const output = JSON.parse(runPython(findingsMechanics, [], { input: JSON.stringify([source]) }).stdout);
    expect(output.findings).toEqual([]);
  });

  test('an evidenced P0 at anchor 50 retains its disclosed critical exception', () => {
    const source = finding({ confidence: 50 });
    source.findings[0].severity = 'P0';
    const output = JSON.parse(runPython(findingsMechanics, [], { input: JSON.stringify([source]) }).stdout);
    expect(output.findings).toHaveLength(1);
  });

  test.each([true, 'true', {}, ['claimed conflict']])('settled conflict %j cannot bypass confidence', (settled) => {
    const source = finding({ confidence: 0 });
    source.findings[0].settled_conflict = settled;
    const output = JSON.parse(runPython(findingsMechanics, [], { input: JSON.stringify([source]) }).stdout);
    expect(output.findings).toEqual([]);
  });

  test('case-distinct source paths remain separate finding identities', () => {
    const sources = ['src/A.js', 'src/a.js'].map((file) => {
      const source = finding(); source.findings[0].file = file; return source;
    });
    const output = JSON.parse(runPython(findingsMechanics, [], { input: JSON.stringify(sources) }).stdout);
    expect(output.findings).toHaveLength(2);
  });

  test.each([
    { title: '' }, { file: ' ' }, { suggested_fix: true },
    { evidence: [{}] }, { reviewers: ['correctness', 2] },
    { validation_status: 'unresolved' },
    { validation_status: 'confirmed', validation_reason: ' ', protected_subject: null },
  ])('malformed optional fields are rejected: %j', (fields) => {
    const source = finding(); Object.assign(source.findings[0], fields);
    const output = JSON.parse(runPython(findingsMechanics, [], { input: JSON.stringify([source]) }).stdout);
    expect(output.findings).toEqual([]);
    expect(output.malformed_findings).toBe(1);
    expect(output.input_status).toBe('invalid');
  });

  test('rechecking synthesis does not promote the same peer consensus twice', () => {
    const sources = [finding({ reviewer: 'correctness', confidence: 50 }), finding({ reviewer: 'adversarial-codex', confidence: 50, independence_verified: true })];
    const first = JSON.parse(runPython(findingsMechanics, [], { input: JSON.stringify(sources) }).stdout);
    const second = JSON.parse(runPython(findingsMechanics, [], { input: JSON.stringify([{ reviewer: 'synthesis', findings: first.findings, residual_risks: [], testing_gaps: [] }]) }).stdout);
    expect(second.findings[0].confidence).toBe(first.findings[0].confidence);
  });

  test('findings helper rejects malformed input and applies exact deterministic mechanics', () => {
    const exact = finding({ title: 'Missing owner check', reviewer: 'security' });
    const corroborating = finding({ title: '  missing   OWNER check ', reviewer: 'correctness' });
    const malformed = { reviewer: 'broken', findings: [{}], residual_risks: [], testing_gaps: [] };
    const result = runPython(findingsMechanics, [], {
      input: JSON.stringify([exact, corroborating, malformed]),
    });
    expect(result.status).toBe(0);
    const output = JSON.parse(result.stdout);
    expect(output.status).toBe('complete');
    expect(output.malformed_findings).toBe(1);
    expect(output.findings).toHaveLength(1);
    expect(output.findings[0]).toMatchObject({
      '#': 1,
      confidence: 75,
      reviewers: ['security', 'correctness'],
      independent_reviewers: ['security', 'correctness'],
    });
  });

  test.each([false, true])('只有已验证跨模型 peer 的共识才能提分：%s', (verified) => {
    const local = finding({ reviewer: 'correctness', confidence: 50 });
    const peer = finding({ reviewer: 'adversarial-codex', confidence: 50, independence_verified: verified });
    const output = JSON.parse(runPython(findingsMechanics, [], { input: JSON.stringify([local, peer]) }).stdout);
    expect(output.findings).toHaveLength(verified ? 1 : 0);
    if (verified) expect(output.findings[0]).toMatchObject({ confidence: 75, independent_reviewers: ['correctness', 'adversarial-codex'] });
    else expect(output.suppressed_by_confidence).toEqual({ '50': 1 });
  });

  test('两个普通 persona 的低置信度共识保留记录但不能变成 actionable finding', () => {
    const sources = ['security', 'correctness'].map(reviewer => finding({ reviewer, confidence: 50 }));
    const output = JSON.parse(runPython(findingsMechanics, [], { input: JSON.stringify(sources) }).stdout);
    expect(output.findings).toEqual([]);
    expect(output.suppressed_findings[0]).toMatchObject({ confidence: 50, reviewers: ['security', 'correctness'] });
  });

  test.each([undefined, '', '   '])('完整 evidence 首项可回填缺失引文：%j', (firstEvidence) => {
    const source = finding({ confidence: 100 });
    source.findings[0].first_evidence = firstEvidence;
    source.findings[0].evidence = ['src/orders.js:42 -- lookup(input.id)'];
    const output = JSON.parse(runPython(findingsMechanics, [], { input: JSON.stringify([source]) }).stdout);
    expect(output.first_evidence_backfilled).toBe(1);
    expect(output.findings[0]).toMatchObject({ confidence: 100, first_evidence: source.findings[0].evidence[0] });
  });

  test.each([[], ['', 'src/orders.js:42 -- lookup(input.id)'], [null], 'not-an-array'])('不能从无效或非首项 evidence 补出引文：%j', (evidence) => {
    const source = finding({ confidence: 100 });
    delete source.findings[0].first_evidence;
    source.findings[0].evidence = evidence;
    const output = JSON.parse(runPython(findingsMechanics, [], { input: JSON.stringify([source]) }).stdout);
    expect(output.first_evidence_backfilled).toBe(0);
    expect(output.findings).toEqual([]);
    expect(output.malformed_findings).toBe(1);
    expect(output.input_status).toBe('invalid');
  });

  test('回填不能修复错误字段类型或让 malformed finding 计入成功数', () => {
    const badType = finding();
    badType.findings[0].first_evidence = 42;
    badType.findings[0].evidence = ['src/orders.js:42 -- lookup(input.id)'];
    const badLine = finding();
    delete badLine.findings[0].first_evidence;
    badLine.findings[0].evidence = ['src/orders.js:42 -- lookup(input.id)'];
    badLine.findings[0].line = '42';
    const output = JSON.parse(runPython(findingsMechanics, [], { input: JSON.stringify([badType, badLine]) }).stdout);
    expect(output).toMatchObject({ findings: [], malformed_findings: 2, first_evidence_backfilled: 0 });
  });

  test('findings helper does not promote fast-pass or unverified peer independence', () => {
    const fast = finding({ reviewer: 'fast-pass', confidence: 100 });
    const peer = finding({ reviewer: 'adversarial-codex', confidence: 50, independence_verified: false });
    const result = runPython(findingsMechanics, [], { input: JSON.stringify([fast, peer]) });
    const output = JSON.parse(result.stdout);
    expect(output.findings).toHaveLength(0);
    expect(output.suppressed_by_confidence).toEqual({ '50': 1 });
  });

  test('findings helper demotes high confidence without first evidence', () => {
    const source = finding({ reviewer: 'testing', confidence: 100 });
    delete source.findings[0].first_evidence;
    const result = runPython(findingsMechanics, [], { input: JSON.stringify([source]) });
    const output = JSON.parse(result.stdout);
    expect(output.findings).toHaveLength(0);
    expect(output.suppressed_by_confidence).toEqual({ '50': 1 });
  });

  test.each(['42', 'unknown', '', 0, -1, true, 1.5])('finding 行号 %j 不能冒充正整数', (line) => {
    const source = finding();
    source.findings[0].line = line;
    const result = runPython(findingsMechanics, [], { input: JSON.stringify([source]) });
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout).findings).toEqual([]);
  });
});

function finding(overrides = {}) {
  const reviewer = overrides.reviewer || 'correctness';
  const source = {
    reviewer,
    findings: [{
      title: overrides.title || 'Missing owner check',
      severity: 'P1',
      file: 'src/orders.js',
      line: 42,
      confidence: overrides.confidence === undefined ? 75 : overrides.confidence,
      autofix_class: 'gated_auto',
      owner: 'downstream-resolver',
      requires_verification: true,
      pre_existing: false,
      first_evidence: 'src/orders.js:42 -- lookup(input.id)',
    }],
    residual_risks: [],
    testing_gaps: [],
  };
  if (overrides.independence_verified !== undefined) {
    source.independence_verified = overrides.independence_verified;
  }
  return source;
}

function runPython(script, args, options = {}) {
  return spawnSync('bash', [pythonWrapper, script, ...args], {
    cwd: options.cwd || repoRoot,
    input: options.input,
    encoding: 'utf8',
  });
}

function git(cwd, args) {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stderr);
  return result;
}
