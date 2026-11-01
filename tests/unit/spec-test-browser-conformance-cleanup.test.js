'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const producer = path.resolve(__dirname, '../../skills/spec-test-browser/scripts/agent-browser-exact-origin-conformance.cjs');

// This fake exercises producer lifecycle and receipts, not browser enforcement.
describe('browser conformance cleanup receipts', () => {
  let root;
  beforeEach(() => { root = fs.mkdtempSync(path.join(os.tmpdir(), 'browser-cleanup-test-')); });
  afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

  test.each([0, 9])('close exit %s controls the overall result and diagnostic retention', (closeExit) => {
    const binary = path.join(root, 'fake-browser');
    fs.writeFileSync(binary, `#!${process.execPath}\n` + String.raw`
const fs = require('node:fs');
const args = process.argv.slice(2);
const origin = args[args.indexOf('--exact-origin') + 1];
const config = args[args.indexOf('--config') + 1];
fs.writeFileSync(process.env.BROWSER_CAPTURE, JSON.stringify({ config, args }));
const actionIndex = args.findIndex((value) => ['open', 'get', 'click', 'close'].includes(value));
const action = args[actionIndex];
const tail = args.slice(actionIndex + 1);
if (action === 'close') { process.stderr.write('cleanup diagnostic'); process.exit(Number(process.env.BROWSER_CLOSE_EXIT)); }
if ((action === 'open' && (!tail[0].startsWith(origin + '/') || tail[0].includes('redirect-cross'))) || (action === 'click' && tail[0] !== '#same-link')) {
  process.stderr.write('ERR_BLOCKED_BY_CLIENT'); process.exit(1);
}
if (action === 'get') process.stdout.write(tail[0] === 'text' ? 'ALLOWED ORIGIN' : origin + '/ok');
`, { mode: 0o700 });
    const expectedHash = `sha256:${crypto.createHash('sha256').update(fs.readFileSync(binary)).digest('hex')}`;
    const capture = path.join(root, 'capture.json');
    const result = spawnSync(process.execPath, [producer, '--binary', binary, '--expected-sha256', expectedHash], {
      encoding: 'utf8', timeout: 15000,
      env: { ...process.env, TMPDIR: root, BROWSER_CAPTURE: capture, BROWSER_CLOSE_EXIT: String(closeExit) },
    });
    const payload = JSON.parse(result.stdout);
    const runRoot = path.dirname(JSON.parse(fs.readFileSync(capture, 'utf8')).config);
    expect(payload.positive_control.status).toBe('passed');
    expect(payload.cases.every((item) => item.status === 'passed')).toBe(true);
    expect(payload.cleanup).toMatchObject({ status: closeExit === 0 ? 'passed' : 'failed', exit_code: closeExit });
    expect(result.status).toBe(closeExit === 0 ? 0 : 1);
    expect(payload.status).toBe(closeExit === 0 ? 'passed' : 'failed');
    expect(fs.existsSync(runRoot)).toBe(closeExit !== 0);
    if (closeExit !== 0) {
      expect(payload.recovery.run_root).toBe(runRoot);
      const receipt = path.join(runRoot, 'conformance-result.json');
      expect(JSON.parse(fs.readFileSync(receipt, 'utf8')).cleanup.stderr).toBe('cleanup diagnostic');
      if (process.platform !== 'win32') expect(fs.statSync(receipt).mode & 0o777).toBe(0o600);
    }
  });
});
