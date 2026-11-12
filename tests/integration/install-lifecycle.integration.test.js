'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const crypto = require('node:crypto');
const { spawn } = require('node:child_process');
const { resolveNpmCliPath } = require('../../scripts/lib/npm-cli.cjs');
const pkg = require('../../package.json');

const repoRoot = path.resolve(__dirname, '../..');

// 使用真实 npm 和安装后的 CLI；本地 registry 仅提供当前 tarball，不模拟安装或来源判定。
test('真实隔离 prefix 的升级、本地副本、开发链接和 PATH 启动提醒', async () => {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-lifecycle-')));
  const prefix = path.join(root, 'prefix');
  const home = path.join(root, 'home');
  const project = path.join(root, 'project');
  for (const dir of [home, project, path.join(root, 'pack')]) fs.mkdirSync(dir, { recursive: true });
  const env = {
    ...process.env,
    HOME: home,
    USERPROFILE: home,
    npm_config_prefix: prefix,
    npm_config_cache: path.join(root, 'cache'),
    npm_config_userconfig: path.join(root, 'npmrc'),
    npm_config_globalconfig: path.join(root, 'global-npmrc'),
    npm_config_audit: 'false',
    npm_config_fund: 'false',
    NODE_OPTIONS: '',
    SPEC_FIRST_NO_UPDATE_NOTIFIER: '1',
  };
  const npmCli = resolveNpmCliPath();
  expect(npmCli).toBeTruthy();
  const commands = [];
  async function run(args, extra = {}) {
    const result = await new Promise((resolve, reject) => {
      const child = spawn(process.execPath, args, { cwd: project, env: { ...env, ...extra }, stdio: ['pipe', 'pipe', 'pipe'] });
      let stdout = '';
      let stderr = '';
      child.stdout.on('data', (data) => { stdout += data; });
      child.stderr.on('data', (data) => { stderr += data; });
      child.on('error', reject);
      child.on('close', (status) => resolve({ status, stdout, stderr }));
      child.stdin.end('{}');
    });
    commands.push({ args, ...result, stdout: args.includes('pack') ? `tarball: ${JSON.parse(result.stdout)[0].filename}` : result.stdout });
    if (result.status !== 0) throw new Error(JSON.stringify({ args, ...result }));
    return result;
  }
  let server;
  try {
    const packed = await run([npmCli, 'pack', repoRoot, '--json', '--pack-destination', path.join(root, 'pack')]);
    const filename = JSON.parse(packed.stdout)[0].filename;
    const tarball = fs.readFileSync(path.join(root, 'pack', filename));
    let registry;
    server = http.createServer((req, res) => {
      if (req.url.startsWith('/archive.tgz')) {
        res.setHeader('content-type', 'application/octet-stream');
        return res.end(tarball);
      }
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ name: pkg.name, 'dist-tags': { latest: pkg.version }, versions: {
        [pkg.version]: { name: pkg.name, version: pkg.version, bin: pkg.bin, dist: {
          tarball: `${registry}/archive.tgz`, integrity: `sha512-${crypto.createHash('sha512').update(tarball).digest('base64')}`,
        } },
      } }));
    });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    registry = `http://127.0.0.1:${server.address().port}`;
    env.npm_config_registry = registry;
    await run([npmCli, 'install', '-g', path.join(root, 'pack', filename)]);
    const globalRoot = (await run([npmCli, 'root', '-g'])).stdout.trim();
    const packageRoot = path.join(globalRoot, pkg.name);
    const entry = path.join(packageRoot, 'bin/spec-first.js');
    const trace = path.join(root, 'trace.jsonl');
    const preload = path.join(root, 'observe.cjs');
    fs.writeFileSync(preload, `const fs = require('node:fs');
const os = require('node:os');
const userInfo = os.userInfo;
os.userInfo = function() { return { ...userInfo(), homedir: ${JSON.stringify(home)} }; };
const cp = require('node:child_process');
const original = cp.spawnSync;
cp.spawnSync = function(command, args, options) {
  fs.appendFileSync(${JSON.stringify(trace)}, JSON.stringify({command, args}) + '\\n');
  return original.call(this, command, args, options);
};
if ((process.argv[1] || '').endsWith('spec-first.js')) {
  const path = require('node:path');
  const source = require(path.join(path.dirname(process.argv[1]), '../src/cli/install-origin'));
  fs.appendFileSync(${JSON.stringify(trace)}, JSON.stringify({entry: process.argv[1], evidence: source.detectInstallOrigin()}) + '\\n');
}
`);
    const observation = { NODE_OPTIONS: `--require=${preload}` };
    const globalRun = await run([entry, 'update'], observation);
    let rows = fs.readFileSync(trace, 'utf8').trim().split('\n').map(JSON.parse);
    expect(rows.some((row) => row.evidence && row.evidence.origin === 'npm-global')).toBe(true);
    expect(rows.some((row) => row.args && row.args.slice(1).join(' ') === 'install -g spec-first@latest')).toBe(true);
    expect(globalRun.stdout).toMatch(/升级|upgraded/);
    const local = path.join(root, 'local');
    fs.cpSync(packageRoot, local, { recursive: true });
    const localEntry = path.join(local, 'bin/spec-first.js');
    fs.writeFileSync(trace, '');
    await run([localEntry, 'update'], observation);
    rows = fs.readFileSync(trace, 'utf8').trim().split('\n').map(JSON.parse);
    expect(rows.find((row) => row.evidence).evidence.origin).toBe('unknown');
    expect(rows.some((row) => row.args && row.args.includes('install'))).toBe(false);

    // hook 实际经过 PATH 调用正式全局 CLI；项目旧投射不可因此取得 npm-global 渠道身份。
    fs.mkdirSync(path.join(project, '.codex/spec-first'), { recursive: true });
    fs.writeFileSync(path.join(project, '.codex/spec-first/state.json'), JSON.stringify({ manifestVersion: '1.0.0' }));
    const hook = await run([path.join(packageRoot, 'templates/codex/hooks/session-start')], {
      ...observation,
      SPEC_FIRST_NO_UPDATE_NOTIFIER: '',
      SPEC_FIRST_VERSION_REMINDER_LATEST: '9.9.9',
      PATH: `${process.platform === 'win32' ? prefix : path.join(prefix, 'bin')}${path.delimiter}${process.env.PATH}`,
      CODEX_PROJECT_DIR: project,
    });
    const context = JSON.parse(hook.stdout).hookSpecificOutput.additionalContext;
    expect(context).toContain('1.0.0 -> npm latest 9.9.9');
    expect(context).toContain('runtime 安装渠道未确认');
    expect(context).not.toContain('spec-first update');

    fs.rmSync(packageRoot, { recursive: true });
    fs.symlinkSync(local, packageRoot, 'junction');
    fs.writeFileSync(trace, '');
    await run([localEntry, 'update'], observation);
    rows = fs.readFileSync(trace, 'utf8').trim().split('\n').map(JSON.parse);
    expect(rows.find((row) => row.evidence).evidence).toMatchObject({ origin: 'local', reason_code: 'global-package-linked' });
    expect(rows.some((row) => row.args && row.args.includes('install'))).toBe(false);
    console.log(JSON.stringify({ platform: process.platform, node: process.version, globalRoot, entry, commands, linkedEvidence: rows }, null, 2));
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    fs.rmSync(root, { recursive: true, force: true });
  }
}, 120000);
