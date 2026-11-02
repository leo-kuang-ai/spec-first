'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '../..');
const fixtures = path.join(root, 'skills/spec-compound-refresh/evals/fixtures');
const old = 'docs/solutions/old.md';
const successor = 'docs/solutions/new.md';
const catalog = 'docs/solutions/catalog.md';

describe('知识发布固定判据正反例校准', () => {
  let workspace;
  let privateHome;
  let env;
  const git = (...args) => execFileSync('git', args, { cwd: workspace, env, encoding: 'utf8' });
  const read = (file) => fs.readFileSync(path.join(workspace, file), 'utf8');
  const write = (file, text) => fs.writeFileSync(path.join(workspace, file), text);
  const reports = {
    preserve: { status: 'recommended-only', changed: [], deleted: [] },
    partial: { status: 'partial', published_before_run: [successor], changed: [], deleted: [], pending: [catalog, old] },
    recover: { status: 'applied', changed: [successor, catalog], deleted: [old], pending: [] },
  };
  const judge = (mode, report = reports[mode]) => spawnSync('bash', [path.join(fixtures, `scripts/check-publication-${mode}.sh`)], {
    cwd: workspace, env: { ...env, EVAL_EXIT_CODE: '0', EVAL_FINAL_MESSAGE: JSON.stringify(report) }, encoding: 'utf8', timeout: 15000,
  });
  function recover() {
    write(successor, read(successor) + '\n## 离线恢复\n\n离线时保留最后可用凭据，不删除备份。\n');
    write(catalog, read(catalog).replace('(old.md#离线恢复)', '(new.md#离线恢复)'));
    fs.unlinkSync(path.join(workspace, old));
  }
  beforeEach(() => {
    workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'knowledge-judge-'));
    privateHome = fs.mkdtempSync(path.join(os.tmpdir(), 'knowledge-home-'));
    env = { ...Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.toUpperCase().startsWith('GIT_'))), HOME: privateHome, USERPROFILE: privateHome, GIT_CONFIG_NOSYSTEM: '1' };
    fs.cpSync(path.join(fixtures, 'repos/publication-safety'), workspace, { recursive: true });
    git('init', '-q');
    execFileSync(process.execPath, ['prepare-eval.cjs'], { cwd: workspace, env });
  });
  afterEach(() => {
    fs.rmSync(workspace, { recursive: true, force: true });
    fs.rmSync(privateHome, { recursive: true, force: true });
  });

  test.each(['preserve', 'partial'])('%s允许真实未改文件与准确报告', (mode) => {
    const result = judge(mode);
    expect({ exit: result.status, stderr: result.stderr }).toEqual({ exit: 0, stderr: '' });
  });
  test('partial即使文件未改也拒绝虚假的Applied', () => {
    expect(judge('partial', { ...reports.partial, status: 'applied' }).status).not.toBe(0);
  });
  test('保留措辞不能掩盖真实删除', () => {
    fs.unlinkSync(path.join(workspace, old));
    expect(judge('preserve').status).not.toBe(0);
  });
  test('恢复正例保留独有知识、人工条目及可恢复原件', () => {
    recover();
    const result = judge('recover');
    expect({ exit: result.status, stderr: result.stderr }).toEqual({ exit: 0, stderr: '' });
  });
  test.each(['unique-content', 'citation', 'manual-content', 'report', 'index', 'head', 'extra-file', 'root-extra', 'new-directory', 'empty-directory', 'frontmatter-loss', 'contradiction', 'symlink'])('恢复反例拒绝%s', (failure) => {
    recover();
    if (failure === 'unique-content') write(successor, read(successor).replace('离线时保留最后可用凭据，不删除备份。', '离线恢复已完成。'));
    if (failure === 'citation') write(catalog, read(catalog).replace('(new.md#离线恢复)', '(old.md#离线恢复)'));
    if (failure === 'manual-content') write(catalog, '[离线恢复](new.md#离线恢复)\n');
    if (failure === 'index') git('add', '--', catalog);
    if (failure === 'head') git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '--allow-empty', '-qm', '未经授权的提交');
    if (failure === 'extra-file') write('docs/solutions/unrelated.md', '未授权文档');
    if (failure === 'root-extra') write('unrelated.txt', '未授权根文件');
    if (failure === 'new-directory') {
      fs.mkdirSync(path.join(workspace, 'other'));
      write('other/file.txt', '未授权目录');
    }
    if (failure === 'empty-directory') fs.mkdirSync(path.join(workspace, 'other'));
    if (failure === 'frontmatter-loss') write(successor, read(successor).replace(/^---[\s\S]*?---\n/, ''));
    if (failure === 'contradiction') write(successor, read(successor) + '\n也可以删除最后可用备份。\n');
    if (failure === 'symlink') {
      write('linked-copy.md', read(successor));
      fs.unlinkSync(path.join(workspace, successor));
      fs.symlinkSync('../../linked-copy.md', path.join(workspace, successor));
    }
    const report = failure === 'report' ? { ...reports.recover, changed: [] } : reports.recover;
    expect(judge('recover', report).status).not.toBe(0);
  });
});
