'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');
const reader = path.resolve(__dirname, '../../skills/spec-polish/scripts/read-launch-json.sh');

describe('Polish launch configuration selection', () => {
  let root;
  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'launch-selection-'));
    execFileSync('git', ['init', '-q'], { cwd: root });
    fs.mkdirSync(path.join(root, '.claude'));
  });
  afterEach(() => fs.rmSync(root, { recursive: true, force: true }));
  const run = (payload, ...args) => {
    fs.writeFileSync(path.join(root, '.claude/launch.json'), JSON.stringify(payload));
    return spawnSync('bash', [reader, ...args], { cwd: root, encoding: 'utf8', timeout: 3000 });
  };
  test('an explicit missing name cannot fall back to the only configuration', () => {
    expect(run({ configurations: [{ name: 'dev', port: 3000 }] }, 'other').stdout.trim()).toBe('__CONFIG_NOT_FOUND__');
    expect(JSON.parse(run({ configurations: [{ name: 'dev', port: 3000 }] }, 'dev').stdout)).toMatchObject({ name: 'dev', port: 3000 });
  });
  test.each(['bad', {}, 12, null])('non-array configurations produce a single missing sentinel: %j', (configurations) => {
    const result = run({ configurations });
    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe('__MISSING_CONFIGURATIONS__');
    expect(result.stderr).toBe('');
  });
  test.each([[{ name: 'dev' }, { name: 'dev' }], [null], [{}]].map((value) => [value]))('invalid or duplicate entries never emit selected configuration JSON', (configurations) => {
    const result = run({ configurations }, 'dev');
    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe('__INVALID_LAUNCH_JSON__');
  });
  test('multiple valid names retain the documented selection protocol', () => {
    const configurations = [{ name: 'api', port: 3100 }, { name: 'web', port: 3200 }];
    expect(run({ configurations }).stdout.trim()).toBe('__MULTIPLE_CONFIGS__\n["api","web"]');
    expect(JSON.parse(run({ configurations }, 'web').stdout)).toEqual(configurations[1]);
  });
});
