'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  inspectMarkdownFrontmatter,
  parseFrontmatterScalarOccurrences,
} = require('../../src/cli/helpers/markdown-frontmatter');
const {
  CANONICAL_PLAN_STATUSES,
  completePlanStatus,
  inspectPlanStatus,
  runCli,
} = require('../../src/cli/helpers/plan-status');
const { computeSourcePlanHash } = require('../../src/cli/task-pack');

function createRepo() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-plan-status-'));
  fs.mkdirSync(path.join(root, 'docs/plans'), { recursive: true });
  return root;
}

function writePlan(root, name, content) {
  const plan = `docs/plans/${name}`;
  fs.writeFileSync(path.join(root, plan), content, 'utf8');
  return plan;
}

function captureCli(args, dependencies) {
  let stdout = '';
  const exitCode = runCli(args, {
    stdout: { write(chunk) { stdout += chunk; } },
    dependencies,
  });
  return { exitCode, payload: JSON.parse(stdout) };
}

describe('markdown frontmatter scalar helper', () => {
  test('preserves original text and reports quoted/commented scalar occurrences', () => {
    const content = '---\r\nstatus: "active" # lifecycle\r\nstatus: completed\r\n---\r\n# Body\r\n';
    const parsed = inspectMarkdownFrontmatter(content);

    expect(parsed.text).toBe(content);
    expect(parsed.error).toBeNull();
    expect(parsed.frontmatter).toBe('status: "active" # lifecycle\r\nstatus: completed\r\n');
    expect(parsed.occurrences.filter((entry) => entry.key === 'status')).toEqual([
      expect.objectContaining({ value: 'active', quote: '"', comment: '# lifecycle' }),
      expect.objectContaining({ value: 'completed', quote: null, comment: null }),
    ]);
  });

  test('does not treat a hash inside quotes as an inline comment', () => {
    expect(parseFrontmatterScalarOccurrences('title: "A # title" # note\n')[0]).toEqual(
      expect.objectContaining({ value: 'A # title', comment: '# note' }),
    );
    expect(parseFrontmatterScalarOccurrences('status: active # lifecycle\n')[0]).toEqual(
      expect.objectContaining({ value: 'active', quote: null, comment: '# lifecycle' }),
    );
    expect(parseFrontmatterScalarOccurrences('status: # lifecycle\n')[0]).toEqual(
      expect.objectContaining({ value: '', quote: null, comment: '# lifecycle' }),
    );
    expect(parseFrontmatterScalarOccurrences('status:#value\n')[0]).toEqual(
      expect.objectContaining({ value: '#value', quote: null, comment: null }),
    );
  });
});

describe('plan status helper', () => {
  let root;

  beforeEach(() => {
    root = createRepo();
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  test('inspect recognizes all canonical statuses, including quoted inline-comment scalars', () => {
    expect([...CANONICAL_PLAN_STATUSES]).toEqual([
      'active',
      'partially-shipped',
      'completed',
      'superseded',
    ]);

    for (const status of CANONICAL_PLAN_STATUSES) {
      const plan = writePlan(root, `${status}.md`, `---\nstatus: "${status}" # lifecycle\n---\n# Plan\n`);
      expect(inspectPlanStatus({ targetRepo: root, plan })).toEqual(expect.objectContaining({
        ok: true,
        reason_code: 'plan-status-inspected',
        status,
        changed: false,
      }));
    }
  });

  test('duplicate, missing, and invalid statuses fail closed', () => {
    const duplicate = writePlan(root, 'duplicate.md', '---\nstatus: active\nstatus: completed\n---\n# Plan\n');
    const missing = writePlan(root, 'missing.md', '---\ntitle: Plan\n---\n# Plan\n');
    const invalid = writePlan(root, 'invalid.md', '---\nstatus: done\n---\n# Plan\n');

    expect(inspectPlanStatus({ targetRepo: root, plan: duplicate }).reason_code)
      .toBe('plan-status-status-duplicate');
    expect(inspectPlanStatus({ targetRepo: root, plan: missing }).reason_code)
      .toBe('plan-status-status-missing');
    expect(inspectPlanStatus({ targetRepo: root, plan: invalid }).reason_code)
      .toBe('plan-status-status-invalid');
  });

  test('malformed frontmatter fails closed without changing file bytes', () => {
    const plan = writePlan(root, 'malformed.md', '---\nstatus: active\n# missing closing delimiter\n');
    const absolute = path.join(root, plan);
    const before = fs.readFileSync(absolute, 'utf8');

    for (const action of ['inspect', 'complete']) {
      const result = captureCli([action, '--target-repo', root, '--plan', plan, '--json']);
      expect(result.exitCode).toBe(2);
      expect(result.payload).toEqual(expect.objectContaining({
        ok: false,
        reason_code: 'plan-status-frontmatter-invalid',
        changed: false,
      }));
      expect(fs.readFileSync(absolute, 'utf8')).toBe(before);
    }
  });

  test('complete re-reads current disk content, preserves CRLF/body bytes, and keeps source-plan-body-v1 hash', () => {
    const plan = writePlan(
      root,
      'current.md',
      '---\r\ntitle: Plan\r\nstatus: "active" # lifecycle\r\n---\r\n# Original\r\n',
    );
    const absolute = path.join(root, plan);
    const staleSnapshot = fs.readFileSync(absolute, 'utf8');
    fs.writeFileSync(absolute, staleSnapshot.replace('# Original', '# Current disk body'), 'utf8');
    const beforeHash = computeSourcePlanHash(absolute);

    const result = completePlanStatus({ targetRepo: root, plan });
    const after = fs.readFileSync(absolute, 'utf8');
    const afterHash = computeSourcePlanHash(absolute);

    expect(result).toEqual(expect.objectContaining({
      ok: true,
      reason_code: 'plan-status-completed',
      previous_status: 'active',
      status: 'completed',
      changed: true,
    }));
    expect(after).toBe(
      '---\r\ntitle: Plan\r\nstatus: "completed" # lifecycle\r\n---\r\n# Current disk body\r\n',
    );
    expect(after).not.toContain('# Original');
    expect(beforeHash.canonicalization_version).toBe('source-plan-body-v1');
    expect(afterHash.hash).toBe(beforeHash.hash);
    expect(afterHash.canonical_body_bytes).toBe(beforeHash.canonical_body_bytes);
  });

  test('already-completed is an idempotent no-op and non-active canonical states are rejected', () => {
    const completed = writePlan(root, 'completed.md', '---\nstatus: completed\n---\n# Plan\n');
    const partiallyShipped = writePlan(root, 'partial.md', '---\nstatus: partially-shipped\n---\n# Plan\n');
    const superseded = writePlan(root, 'superseded.md', '---\nstatus: superseded\n---\n# Plan\n');
    let writes = 0;

    expect(completePlanStatus({ targetRepo: root, plan: completed }, {
      writeFileAtomic() { writes += 1; },
    })).toEqual(expect.objectContaining({
      ok: true,
      reason_code: 'plan-status-already-completed',
      changed: false,
    }));
    expect(writes).toBe(0);
    for (const plan of [partiallyShipped, superseded]) {
      const before = fs.readFileSync(path.join(root, plan), 'utf8');
      expect(completePlanStatus({ targetRepo: root, plan }).reason_code)
        .toBe('plan-status-status-not-active');
      expect(fs.readFileSync(path.join(root, plan), 'utf8')).toBe(before);
    }
  });

  test('rejects path escape, nested plan paths, and symlinks', () => {
    const outside = path.join(root, 'outside.md');
    fs.writeFileSync(outside, '---\nstatus: active\n---\n', 'utf8');
    const link = path.join(root, 'docs/plans/link.md');
    fs.symlinkSync(outside, link);

    for (const plan of ['../outside.md', 'docs/plans/nested/plan.md', 'docs/plans/link.md']) {
      expect(inspectPlanStatus({ targetRepo: root, plan }).reason_code)
        .toBe('plan-status-unsafe-path');
    }
  });

  test('returns stable read/write failure reason codes and CLI exit codes', () => {
    const plan = writePlan(root, 'io.md', '---\nstatus: active\n---\n# Plan\n');
    expect(inspectPlanStatus({ targetRepo: root, plan }, {
      readFileSync() { throw new Error('read denied'); },
    }).reason_code).toBe('plan-status-read-failed');
    expect(completePlanStatus({ targetRepo: root, plan }, {
      writeFileAtomic() { throw new Error('write denied'); },
    }).reason_code).toBe('plan-status-write-failed');

    const readFailure = captureCli(
      ['inspect', '--target-repo', root, '--plan', plan, '--json'],
      { readFileSync() { throw new Error('read denied'); } },
    );
    expect(readFailure.exitCode).toBe(2);
    expect(readFailure.payload.reason_code).toBe('plan-status-read-failed');
    const writeFailure = captureCli(
      ['complete', '--target-repo', root, '--plan', plan, '--json'],
      { writeFileAtomic() { throw new Error('write denied'); } },
    );
    expect(writeFailure.exitCode).toBe(2);
    expect(writeFailure.payload.reason_code).toBe('plan-status-write-failed');

    expect(captureCli(['inspect', '--target-repo', root, '--plan', plan, '--json']).exitCode).toBe(0);
    const complete = captureCli(['complete', '--target-repo', root, '--plan', plan, '--json']);
    expect(complete.exitCode).toBe(0);
    expect(complete.payload.reason_code).toBe('plan-status-completed');
    const noop = captureCli(['complete', '--target-repo', root, '--plan', plan, '--json']);
    expect(noop.exitCode).toBe(0);
    expect(noop.payload.reason_code).toBe('plan-status-already-completed');

    const invalid = captureCli(['complete', '--target-repo', root, '--json']);
    expect(invalid.exitCode).toBe(2);
    expect(invalid.payload.reason_code).toBe('plan-status-invalid-arguments');
  });
});
