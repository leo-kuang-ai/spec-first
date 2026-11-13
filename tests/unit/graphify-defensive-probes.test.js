'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const provider = require('../../skills/spec-runtime-setup/scripts/providers/graphify.cjs');

describe('Graphify defensive probes', () => {
  test('unreadable descendants degrade code-file detection instead of throwing', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-graphify-probe-'));
    const blocked = path.join(root, 'blocked');
    fs.mkdirSync(blocked);
    const originalReadDir = fs.readdirSync;
    const spy = jest.spyOn(fs, 'readdirSync').mockImplementation((target, options) => {
      if (path.resolve(target) === blocked) {
        const error = new Error('permission denied');
        error.code = 'EACCES';
        throw error;
      }
      return originalReadDir.call(fs, target, options);
    });
    try {
      expect(() => provider.hasSupportedCodeFile(root)).not.toThrow();
      expect(provider.hasSupportedCodeFile(root)).toEqual({
        status: 'unknown',
        reason_code: 'graphify-source-scan-unavailable',
      });
    } finally {
      spy.mockRestore();
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  test('an unknown source scan cannot authorize an empty graph as an empty corpus', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-graphify-integrity-'));
    fs.writeFileSync(path.join(root, 'graph.json'), '{"nodes":[]}\n', 'utf8');
    try {
      expect(provider.inspectGraphIntegrity(root, {
        status: 'unknown',
        reason_code: 'graphify-source-scan-unavailable',
      })).toEqual(expect.objectContaining({
        ok: false,
        reason_code: 'graphify-source-scan-unavailable',
      }));
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  test('parses machine JSON from stdout without treating diagnostic stderr as payload', () => {
    expect(provider.parseJsonStdout({ stdout: '{"version":"0.9.12"}', stderr: 'npm WARN progress' }))
      .toEqual({ version: '0.9.12' });
    expect(provider.parseJsonStdout({ stdout: 'not json', stderr: '{"version":"0.9.12"}' })).toBeNull();
  });

  test('setup-invoked graphify processes disable provider dated backups for non-protected artifacts', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-graphify-nobackup-'));
    try {
      const context = { env: { HOME: '/home/a', PATH: '/usr/bin' }, repoRoot: root };
      const env = provider.graphifyProcessEnv(context);
      expect(env.GRAPHIFY_NO_BACKUP).toBe('1');
      const withAdditions = provider.graphifyProcessEnv(context, { GRAPHIFY_NO_BACKUP: '' });
      expect(withAdditions.GRAPHIFY_NO_BACKUP).toBe('1');
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  test('protected artifacts keep the provider backup channel as the only rollback path', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-graphify-protected-'));
    const outDir = path.join(root, 'graphify-out');
    fs.mkdirSync(outDir);
    fs.writeFileSync(path.join(outDir, 'graph.json'), '{"nodes":[]}\n', 'utf8');
    const context = { env: { HOME: '/home/a', PATH: '/usr/bin' }, repoRoot: root };
    try {
      // semantic marker -> protected
      fs.writeFileSync(path.join(outDir, '.graphify_semantic_marker'), '', 'utf8');
      expect(provider.graphifyProcessEnv(context).GRAPHIFY_NO_BACKUP).toBeUndefined();

      // curated labels (any non-default community label) -> protected
      fs.rmSync(path.join(outDir, '.graphify_semantic_marker'));
      fs.writeFileSync(path.join(outDir, '.graphify_labels.json'), JSON.stringify({ 1: 'Payments flow' }), 'utf8');
      expect(provider.graphifyProcessEnv(context).GRAPHIFY_NO_BACKUP).toBeUndefined();

      // all-default labels -> not protected
      fs.writeFileSync(path.join(outDir, '.graphify_labels.json'), JSON.stringify({ 1: 'Community 1', 2: 'Community 2' }), 'utf8');
      expect(provider.graphifyProcessEnv(context).GRAPHIFY_NO_BACKUP).toBe('1');

      // malformed labels -> conservatively protected
      fs.writeFileSync(path.join(outDir, '.graphify_labels.json'), 'not-json', 'utf8');
      expect(provider.graphifyProcessEnv(context).GRAPHIFY_NO_BACKUP).toBeUndefined();

      // no graph.json -> not protected (nothing to back up)
      fs.rmSync(path.join(outDir, 'graph.json'));
      fs.rmSync(path.join(outDir, '.graphify_labels.json'));
      expect(provider.graphifyProcessEnv(context).GRAPHIFY_NO_BACKUP).toBe('1');
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
