'use strict';

// 读取提供方原始argv，在隔离本地remote验证；不运行真实宿主或发布。
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const repo = path.resolve(__dirname, '../../../../..');
const contract = fs.readFileSync(path.join(repo, 'skills/spec-commit-push-pr/references/commit-and-push.md'), 'utf8');
const command = contract.split('\n').find(line => line.startsWith('git ') && line.includes('push --no-follow-tags '));
assert.ok(command, '提供方必须有显式受控push命令');
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-push-contract-'));
const work = path.join(root, 'work');
const authorized = path.join(root, 'authorized.git');
const other = path.join(root, 'other.git');
const git = (cwd, ...args) => {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  assert.equal(result.status, 0, `${args.join(' ')}: ${result.stderr}`);
  return result.stdout.trim();
};
const refs = cwd => git(cwd, 'for-each-ref', '--format=%(refname) %(objectname)');
const controlledPush = () => {
  const urls = git(work, 'remote', 'get-url', '--push', '--all', 'publish').split('\n');
  if (urls.length !== 1 || urls[0] !== authorized) return { blocked: true };
  const args = command.split(' ').slice(1).map(arg => arg.replace('<push-remote>', 'publish').replace('<head-branch>', 'feature'));
  git(work, ...args);
  return { blocked: false };
};
try {
  for (const dir of [work, authorized, other]) fs.mkdirSync(dir);
  git(root, 'init', '-q', work);
  git(root, 'init', '--bare', '-q', authorized);
  git(root, 'init', '--bare', '-q', other);
  git(work, 'config', 'user.email', 'fixture@example.invalid');
  git(work, 'config', 'user.name', 'Fixture');
  git(work, '-c', 'core.hooksPath=/dev/null', '-c', 'commit.gpgsign=false', 'commit', '--allow-empty', '-qm', 'base');
  git(work, 'branch', '-M', 'feature');
  git(work, 'branch', 'unrelated');
  git(work, 'tag', '-a', 'must-not-publish', '-m', 'private');
  git(work, 'remote', 'add', 'publish', authorized);
  git(work, 'config', '--add', 'remote.publish.pushurl', authorized);
  git(work, 'config', '--add', 'remote.publish.pushurl', other);
  assert.deepEqual(controlledPush(), { blocked: true });
  assert.equal(refs(authorized), ''); assert.equal(refs(other), '');
  console.log('PASS: 多pushurl阻断，两端refs未变');
  git(work, 'config', '--unset-all', 'remote.publish.pushurl');
  git(work, 'config', 'remote.publish.pushurl', other);
  assert.deepEqual(controlledPush(), { blocked: true });
  assert.equal(refs(other), '');
  console.log('PASS: 唯一但非授权endpoint仍阻断');
  git(work, 'config', 'remote.publish.pushurl', authorized);
  git(work, 'config', 'push.followTags', 'true');
  git(work, 'config', 'remote.publish.mirror', 'true');
  git(work, 'config', 'remote.publish.push', 'refs/heads/*:refs/heads/*');
  assert.deepEqual(controlledPush(), { blocked: false });
  const head = git(work, 'rev-parse', 'HEAD');
  assert.equal(refs(authorized), `refs/heads/feature ${head}`);
  assert.equal(refs(other), '');
  console.log('PASS: followTags/mirror/通配push配置下仅授权分支到达，tag及无关分支未发布');
  console.log('argv:', command);
} finally { fs.rmSync(root, { recursive: true, force: true }); }
