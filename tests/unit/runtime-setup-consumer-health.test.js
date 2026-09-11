'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { computeDecisionInputHealth } = require('../../src/cli/helpers/setup-facts');

describe('setup facts 的真实消费出口', () => {
  let root;
  beforeEach(() => { root = fs.mkdtempSync(path.join(os.tmpdir(), 'setup-health-')); });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  test.each([undefined, 'invalid-time'])('缺失或非法时间 %s 不能支持 readiness pass', (generatedAt) => {
    const factsPath = path.join(root, 'facts.json');
    fs.writeFileSync(factsPath, JSON.stringify({ schema_version: 'tool-facts.v2', host: 'codex', generated_at: generatedAt, items: [] }));
    const result = computeDecisionInputHealth({ projectRoot: root, platforms: ['codex'], factsPath });
    expect(result.status).toBe('warn');
    expect(result.basis.reason_code).toBe('setup-facts-freshness-unknown');
    expect(result.basis.next_action).toContain('spec-runtime-setup');
  });
});
