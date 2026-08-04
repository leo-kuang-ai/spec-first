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
  test('macOS primitive detection distinguishes a missing sandbox from a missing helper', () => {
    const platform = Object.getOwnPropertyDescriptor(process, 'platform');
    Object.defineProperty(process, 'platform', { configurable: true, value: 'darwin' });
    const access = jest.spyOn(fs, 'accessSync');
    try {
      access.mockImplementationOnce(() => {
        const error = new Error('sandbox missing');
        error.code = 'ENOENT';
        throw error;
      });
      expect(detectIsolationPrimitive()).toEqual({
        status: 'unavailable',
        id: null,
        command: null,
        reason_code: 'hard_isolation_unavailable',
      });

      access.mockImplementationOnce(() => undefined).mockImplementationOnce(() => {
        const error = new Error('helper missing');
        error.code = 'ENOENT';
        throw error;
      });
      expect(detectIsolationPrimitive()).toEqual({
        status: 'unavailable',
        id: 'macos-sandbox-exec',
        command: '/usr/bin/sandbox-exec',
        probe_command: null,
        reason_code: 'isolation_probe_helper_unavailable',
      });
    } finally {
      access.mockRestore();
      Object.defineProperty(process, 'platform', platform);
    }
  });

  test('probe execution failure stays loudly inconclusive', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-prd-probe-failure-'));
    const namespaceRoot = path.join(root, 'namespace');
    fs.mkdirSync(namespaceRoot);
    try {
      const report = runIsolationProbe({
        namespaceRoot,
        controlPath: path.join(root, 'control'),
        siblingPath: path.join(root, 'sibling'),
        symlinkPath: path.join(namespaceRoot, 'link'),
        primitive: {
          status: 'available',
          id: 'macos-sandbox-exec',
          command: path.join(root, 'missing-sandbox-exec'),
          probe_command: '/usr/bin/perl',
        },
      });

      expect(report).toMatchObject({
        artifact_type: 'degraded',
        status: 'inconclusive',
        primitive: 'macos-sandbox-exec',
        model_invoked: false,
        reason_code: 'isolation_probe_execution_failed',
      });
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  test('probe output rejects a symlink ancestor outside the namespace', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-prd-probe-symlink-'));
    const namespaceRoot = path.join(root, 'namespace');
    const probeRoot = path.join(namespaceRoot, '.isolation-probe');
    const externalOutput = path.join(root, 'external-output');
    fs.mkdirSync(probeRoot, { recursive: true });
    fs.mkdirSync(externalOutput);
    fs.symlinkSync(externalOutput, path.join(probeRoot, 'output'));
    try {
      expect(() => runIsolationProbe({
        namespaceRoot,
        controlPath: path.join(root, 'control'),
        siblingPath: path.join(root, 'sibling'),
        symlinkPath: path.join(namespaceRoot, 'link'),
        primitive: {
          status: 'available',
          id: 'macos-sandbox-exec',
          command: '/usr/bin/sandbox-exec',
          probe_command: '/usr/bin/perl',
        },
      })).toThrow('isolation probe output has a symlink ancestor');
      expect(fs.readdirSync(externalOutput)).toEqual([]);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

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
      if (primitive.status === 'available') {
        expect(report.artifact_type).toBe('confirmed');
        expect(report.status).toBe('passed');
        expect(report.primitive).toBe(primitive.id);
        expect(Object.keys(report.probes).sort()).toEqual([...PROBE_NAMES].sort());
        expect(Object.values(report.probes).every((entry) => (
          entry.denied === true && ['EACCES', 'EPERM'].includes(entry.code)
        ))).toBe(true);
      } else {
        expect(report.status).toBe('inconclusive');
        expect(report.artifact_type).toBe('degraded');
        expect(report.reason_code).toMatch(/hard_isolation_unavailable|isolation_probe_helper_unavailable/);
      }
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  }, 30000);
});
