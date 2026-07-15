'use strict';

const fs = require('node:fs');
const crypto = require('node:crypto');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const {
  smokeTargetPayload,
} = require('../../skills/spec-write-skill/scripts/inspect-context.cjs');

const tempRoots = [];

afterEach(() => {
  for (const root of tempRoots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});

function payload() {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'spec-write-skill-payload-'));
  tempRoots.push(root);
  fs.mkdirSync(path.join(root, 'references'), { recursive: true });
  fs.mkdirSync(path.join(root, 'scripts'));
  fs.writeFileSync(path.join(root, 'SKILL.md'), [
    '---', 'name: example-skill', 'description: Use for a reusable example workflow.', '---', '',
    '[Reference](references/runtime.md)', '',
  ].join('\n'));
  fs.writeFileSync(path.join(root, 'references', 'runtime.md'), '# Runtime\n');
  fs.writeFileSync(path.join(root, 'scripts', 'check.cjs'), 'process.exitCode = 0;\n');
  return root;
}

function runtimeFiles(root) {
  return ['SKILL.md', 'references/runtime.md', 'scripts/check.cjs'].map((file, index) => ({
    path: file,
    consumer: ['host-skill-loader', 'SKILL.md-reference', 'selected-runtime-script'][index],
    expected_sha256: crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex'),
  }));
}

test('verifies declared runtime file set and actual payload closure without executing package code', () => {
  const root = payload();
  const before = fs.readFileSync(path.join(root, 'scripts', 'check.cjs'), 'utf8');
  const report = smokeTargetPayload({
    payloadDir: root,
    runtimeFileSet: {
      files: runtimeFiles(root),
      dynamic_dependencies: 'none',
    },
  });

  expect(report).toMatchObject({ result: 'pass', target_readiness: 'ready', findings: [] });
  expect(fs.readFileSync(path.join(root, 'scripts', 'check.cjs'), 'utf8')).toBe(before);
});

test('exposes payload smoke as a no-execution CLI mode', () => {
  const root = payload();
  const runtimeFileSet = path.join(path.dirname(root), `${path.basename(root)}-runtime-file-set.json`);
  tempRoots.push(runtimeFileSet);
  fs.writeFileSync(runtimeFileSet, JSON.stringify({
    files: [
      ...runtimeFiles(root),
    ], dynamic_dependencies: 'none',
  }));
  const script = path.resolve(__dirname, '../../skills/spec-write-skill/scripts/inspect-context.cjs');
  const result = spawnSync(process.execPath, [script, '--payload-smoke', root, '--runtime-file-set', runtimeFileSet, '--json'], { encoding: 'utf8' });

  expect(result.status).toBe(0);
  expect(JSON.parse(result.stdout)).toMatchObject({ result: 'pass', target_readiness: 'ready' });
  expect(result.stderr).toBe('');
});

test('fails missing reference or maintainer-only payload inclusion and degrades unknown dynamic dependencies', () => {
  const root = payload();
  fs.mkdirSync(path.join(root, 'evals'));
  fs.writeFileSync(path.join(root, 'evals', 'README.md'), '# Maintainer-only\n');
  fs.writeFileSync(path.join(root, '.env'), 'DO_NOT_EXPOSE=secret\n');
  const fail = smokeTargetPayload({
    payloadDir: root,
    runtimeFileSet: {
      files: [runtimeFiles(root)[0]],
      dynamic_dependencies: 'none',
    },
  });
  expect(fail.result).toBe('fail');
  expect(fail.findings.map((entry) => entry.reason_code)).toEqual(expect.arrayContaining([
    'runtime_reference_undeclared',
    'payload_closure_mismatch',
    'maintainer_only_payload_forbidden',
    'payload_secret_like_path_forbidden',
  ]));

  fs.rmSync(path.join(root, 'evals'), { recursive: true, force: true });
  fs.rmSync(path.join(root, '.env'));
  const degraded = smokeTargetPayload({
    payloadDir: root,
    runtimeFileSet: {
      files: runtimeFiles(root),
      dynamic_dependencies: 'unknown',
    },
  });
  expect(degraded).toMatchObject({ result: 'incomplete', target_readiness: 'degraded' });
});

test('rejects reports and content that drift from the source-derived runtime file set', () => {
  const root = payload();
  fs.mkdirSync(path.join(root, 'reports'));
  fs.writeFileSync(path.join(root, 'reports', 'run.md'), '# Maintainer evidence\n');
  const files = runtimeFiles(root);
  files.push({ path: 'reports/run.md', consumer: 'report', expected_sha256: crypto.createHash('sha256').update(fs.readFileSync(path.join(root, 'reports', 'run.md'))).digest('hex') });
  expect(smokeTargetPayload({ payloadDir: root, runtimeFileSet: { files, dynamic_dependencies: 'none' } }).result).toBe('fail');

  fs.rmSync(path.join(root, 'reports'), { recursive: true, force: true });
  const expected = runtimeFiles(root);
  fs.writeFileSync(path.join(root, 'scripts', 'check.cjs'), 'invalid metadata drift\n');
  expect(smokeTargetPayload({ payloadDir: root, runtimeFileSet: { files: expected, dynamic_dependencies: 'none' } }).findings)
    .toEqual(expect.arrayContaining([expect.objectContaining({ reason_code: 'payload_content_drift', path: 'scripts/check.cjs' })]));
});
