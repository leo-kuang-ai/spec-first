'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..', '..');
const SCRIPT_ROOT = path.join(ROOT, 'skills/spec-app-consistency-audit/scripts');

function run(script, args) {
  return spawnSync(process.execPath, [path.join(SCRIPT_ROOT, script), ...args], { encoding: 'utf8' });
}

describe('App Assurance 当前 extractor authority characterization', () => {
  test('页面/路由抽取保持 candidate authority，不把名字匹配提升为 confirmed', () => {
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'app-assurance-extract-'));
    try {
      fs.mkdirSync(path.join(temp, 'app'), { recursive: true });
      fs.writeFileSync(path.join(temp, 'app/CheckoutScreen.kt'), 'class CheckoutScreen { fun route() = "checkout/{id}" }\n');
      const output = path.join(temp, 'codebase-contract.json');
      const result = run('extract-code-contract.js', ['--source', temp, '--output', output]);

      expect(result.status).toBe(0);
      const artifact = JSON.parse(fs.readFileSync(output, 'utf8'));
      expect(artifact.contract_status).not.toBe('confirmed');
      expect(JSON.stringify(artifact)).toContain('CheckoutScreen');
    } finally {
      fs.rmSync(temp, { recursive: true, force: true });
    }
  });

  test('截断或降级扫描信号保留在 artifact 中', () => {
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'app-assurance-degraded-'));
    try {
      fs.writeFileSync(path.join(temp, 'A.kt'), 'class A\n');
      fs.writeFileSync(path.join(temp, 'B.kt'), 'class B\n');
      const output = path.join(temp, 'codebase-contract.json');
      const result = run('extract-code-contract.js', ['--source', temp, '--max-files', '1', '--output', output]);
      expect(result.status).toBe(0);
      const artifact = JSON.parse(fs.readFileSync(output, 'utf8'));
      expect(Array.isArray(artifact.degraded_modes)).toBe(true);
    } finally {
      fs.rmSync(temp, { recursive: true, force: true });
    }
  });
});
