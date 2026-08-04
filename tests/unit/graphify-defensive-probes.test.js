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
});
