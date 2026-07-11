'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  buildIsolationTargets,
  buildRunProbePaths,
  detectIsolationPrimitive,
  runIsolationProbe,
} = require('../../skills/spec-prd/evals/run-contract-reset-arm');

const PROBE_NAMES = [
  'absolute',
  'parent_traversal',
  'symlink',
  'control',
  'sibling',
];

describe('spec-prd Contract Reset hard isolation', () => {
  test('arm wiring uses distinct control-plane and sibling-namespace canaries', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-prd-probe-paths-'));
    const namespaceRoot = path.join(root, 'namespaces', 'ns-current');
    try {
      const paths = buildRunProbePaths(root, namespaceRoot);
      expect(paths.controlPath).toBe(path.join(root, 'control', 'owner-answer-oracle.canary'));
      expect(paths.siblingPath).toContain(path.join(root, 'namespaces'));
      expect(paths.siblingPath).not.toContain(namespaceRoot);
      expect(path.relative(namespaceRoot, paths.siblingPath).split(path.sep)).toContain('..');
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  test('active probes are actually denied or the run is explicitly inconclusive before model invocation', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-prd-isolation-'));
    const namespaceRoot = path.join(root, 'namespaces', 'case-1', 'candidate');
    const controlPath = path.join(root, 'control', 'oracle.txt');
    const siblingPath = path.join(root, 'namespaces', 'case-1', 'baseline', 'output.txt');
    const outsidePath = path.join(root, 'outside.txt');
    fs.mkdirSync(path.dirname(controlPath), { recursive: true });
    fs.mkdirSync(path.dirname(siblingPath), { recursive: true });
    fs.mkdirSync(namespaceRoot, { recursive: true });
    fs.writeFileSync(controlPath, 'oracle', 'utf8');
    fs.writeFileSync(siblingPath, 'sibling', 'utf8');
    fs.writeFileSync(outsidePath, 'outside', 'utf8');
    const symlinkPath = path.join(namespaceRoot, 'outside-link');
    fs.symlinkSync(outsidePath, symlinkPath);

    try {
      const targets = buildIsolationTargets({
        namespaceRoot,
        controlPath,
        siblingPath,
        symlinkPath,
        absolutePath: '/etc/passwd',
      });
      expect(Object.keys(targets).sort()).toEqual([...PROBE_NAMES].sort());
      expect(path.isAbsolute(targets.parent_traversal)).toBe(false);
      expect(targets.parent_traversal.split(path.sep)).toContain('..');
      expect(targets.parent_traversal).not.toBe(targets.control);

      const primitive = detectIsolationPrimitive();
      const report = runIsolationProbe({
        namespaceRoot,
        controlPath,
        siblingPath,
        symlinkPath,
        absolutePath: '/etc/passwd',
        primitive,
      });

      expect(report.schema_version).toBe('contract-reset-isolation-probe/v1');
      expect(report.model_invoked).toBe(false);
      if (report.status === 'passed') {
        expect(report.artifact_type).toBe('confirmed');
        expect(report.status).toBe('passed');
        expect(report.primitive).toBe(primitive.id);
        expect(Object.keys(report.probes).sort()).toEqual([...PROBE_NAMES].sort());
        expect(Object.values(report.probes).every((entry) => (
          entry.denied === true && ['EACCES', 'EPERM'].includes(entry.code)
        ))).toBe(true);
      } else {
        expect(['inconclusive', 'invalid']).toContain(report.status);
        expect(report.artifact_type).toBe(report.status === 'invalid' ? 'confirmed' : 'degraded');
        expect(report.reason_code).toMatch(/hard_isolation_unavailable|isolation_probe_/);
      }
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  }, 30000);
});
