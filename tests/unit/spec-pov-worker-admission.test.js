'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const adapters = [
  ['spec-pov', 'cross-model-pov.sh'],
  ['spec-doc-review', 'cross-model-doc-review.sh'],
  ['spec-code-review', 'cross-model-adversarial-review.sh'],
];

describe.each(adapters)('%s dormant provider admission', (skill, script) => {
  const adapter = path.resolve(__dirname, '../../skills', skill, 'scripts', script);
  let root;
  let env;
  let marker;
  let packet;
  let output;
  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'pov-admission-'));
    const bin = path.join(root, 'bin');
    fs.mkdirSync(bin);
    marker = path.join(root, 'provider-called');
    for (const provider of ['codex', 'claude']) {
      fs.writeFileSync(path.join(bin, provider), '#!/bin/sh\nprintf called > "$POV_MARKER"\nexit 37\n', { mode: 0o700 });
    }
    packet = path.join(root, 'packet.json');
    output = path.join(root, 'result.json');
    fs.writeFileSync(packet, JSON.stringify({ prompt: 'Review synthetic fixture data.',
      review_constraints: 'Preserve generated output contracts.' }));
    fs.writeFileSync(output, 'preserve existing result');
    env = { ...process.env, HOME: root, USERPROFILE: root,
      PATH: `${bin}:${process.env.PATH}`, POV_MARKER: marker,
      SPEC_FIRST_PEER_JOBS_ROOT: path.join(root, 'jobs') };
  });
  afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

  test.each(['codex', 'claude'])('direct %s worker cannot bypass serving admission', (provider) => {
    const result = spawnSync('bash', [adapter, '__worker', provider, 'fixture-model', root, packet, output], { env, encoding: 'utf8', timeout: 5000 });
    expect(fs.existsSync(marker)).toBe(false);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('provider_serving_receipt_unverified');
    expect(fs.readFileSync(output, 'utf8')).toBe('preserve existing result');
    expect(fs.existsSync(env.SPEC_FIRST_PEER_JOBS_ROOT)).toBe(false);
  });

  test.each([
    ['missing', null],
    ['weak', { schema_version: 'provider-serving-receipt/v2', artifact_type: 'degraded', verification_status: 'unverified', reason_code: 'authenticated-producer-unavailable' }],
    ['forged', { schema_version: 'provider-serving-receipt/v2', artifact_type: 'confirmed', verification_status: 'verified' }],
    ['expired', { schema_version: 'provider-serving-receipt/v2', artifact_type: 'degraded', verification_status: 'unverified', reason_code: 'authenticated-producer-unavailable', freshness_expires_at: '2000-01-01T00:00:00Z' }],
  ])('%s receipt never starts a provider through either entrypoint', (_name, receipt) => {
    const receiptPath = path.join(root, 'serving.json');
    if (receipt) fs.writeFileSync(receiptPath, JSON.stringify(receipt));
    const start = skill === 'spec-doc-review'
      ? ['start', 'codex', 'fixture-model', packet, 'plan', 'fixture', root, receiptPath, 'a'.repeat(64), 'fixture-source', 'claude', receiptPath, 'b'.repeat(64)]
      : ['start', 'codex', 'fixture-model', packet, root, receiptPath, 'a'.repeat(64), 'fixture-source', 'claude', receiptPath, 'b'.repeat(64)];
    for (const args of [
      start,
      ['__worker', 'codex', 'fixture-model', root, packet, output, receiptPath, 'b'.repeat(64)],
    ]) {
      const result = spawnSync('bash', [adapter, ...args], { env, encoding: 'utf8', timeout: 5000 });
      expect(fs.existsSync(marker)).toBe(false);
      expect(result.status).not.toBe(0);
      expect(fs.readFileSync(output, 'utf8')).toBe('preserve existing result');
      expect(fs.existsSync(env.SPEC_FIRST_PEER_JOBS_ROOT)).toBe(false);
    }
  });
});
