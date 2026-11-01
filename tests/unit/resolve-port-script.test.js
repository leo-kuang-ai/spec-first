'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '..', '..');
const script = path.join(repoRoot, 'skills/spec-polish/scripts/resolve-port.sh');

function resolvePort(packageJson) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-resolve-port-'));
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify(packageJson), 'utf8');
  try {
    const result = spawnSync('bash', [script, root, '--type', 'vite'], { encoding: 'utf8' });
    expect(result.status).toBe(0);
    return String(result.stdout || '').trim();
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function resolveComposePort(compose) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-resolve-compose-'));
  fs.writeFileSync(path.join(root, 'docker-compose.yml'), compose, 'utf8');
  try {
    const result = spawnSync('bash', [script, root, '--type', 'procfile'], { encoding: 'utf8' });
    expect(result.status).toBe(0);
    return String(result.stdout || '').trim();
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

describe('resolve-port package script probing', () => {
  test('uses dev before start and ignores unrelated scripts with port flags', () => {
    expect(resolvePort({
      scripts: {
        storybook: 'storybook dev -p 6006',
        start: 'vite --port 4100',
        dev: 'vite --port=4300',
      },
    })).toBe('4300');
  });

  test('falls back to the start script when dev has no explicit port', () => {
    expect(resolvePort({ scripts: { dev: 'vite', start: 'vite -p 4400' } })).toBe('4400');
  });

  test('accepts an unquoted docker-compose host-port mapping', () => {
    expect(resolveComposePort('services:\n  web:\n    ports:\n      - 4800:3000\n')).toBe('4800');
  });
});

describe('port input and configuration boundaries', () => {
  let root;
  beforeEach(() => { root = fs.mkdtempSync(path.join(os.tmpdir(), 'port-boundary-')); });
  afterEach(() => fs.rmSync(root, { recursive: true, force: true }));
  const run = (...args) => spawnSync('bash', [script, root, ...args], { encoding: 'utf8', timeout: 1000 });

  test.each([['--port'], ['--type'], ['--port', '0'], ['--port', '65536'], ['--port', 'abc'], ['--unknown'], ['--type', 'unknown']])('invalid arguments terminate with an error: %j', (...args) => {
    const result = run(...args);
    expect(result.error).toBeUndefined();
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('ERROR:');
  });

  test('framework comments and another framework config cannot override the selected server', () => {
    fs.writeFileSync(path.join(root, 'next.config.js'), 'module.exports = { port: 4998 };');
    fs.writeFileSync(path.join(root, 'vite.config.js'), '// port: 4999\nexport default { server: { port: 4300 } };\n');
    expect(run('--type', 'vite').stdout.trim()).toBe('4300');
  });

  test('comment and string decoys are ignored while an explicit literal is retained', () => {
    fs.writeFileSync(path.join(root, 'vite.config.js'), '/* port: 4999 */\nconst example = "port: 4998";\nexport default { server: { port: 4300 } };');
    expect(run('--type', 'vite').stdout.trim()).toBe('4300');
    expect(run('--port', '4444').stdout.trim()).toBe('4444');
  });

  test('a Procfile-only project uses its actual web command port', () => {
    fs.writeFileSync(path.join(root, 'Procfile'), 'web: node server.js --port 4500\n');
    expect(run('--type', 'procfile').stdout.trim()).toBe('4500');
  });
});
