'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const REPO_ROOT = path.join(__dirname, '..', '..');
const SCRIPTS = path.join(REPO_ROOT, 'skills', 'spec-project-rules', 'scripts');

function makeRepo(build) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pr-scripts-'));
  const w = (relative, content) => {
    const filePath = path.join(root, relative);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content);
    return filePath;
  };
  if (build === 'npm') {
    w('package.json', JSON.stringify({ name: 'root', workspaces: ['apps/*', 'packages/*'] }));
    w('packages/shared/package.json', JSON.stringify({ name: '@x/shared' }));
    w('apps/web/package.json', JSON.stringify({ name: 'web', dependencies: { '@x/shared': '*' } }));
    w('apps/admin/package.json', JSON.stringify({ name: 'admin' }));
  } else if (build === 'gradle') {
    w('settings.gradle', "include ':app'\ninclude ':core', ':biz'\n");
    w('app/build.gradle', "dependencies { implementation project(':biz') }");
    w('biz/build.gradle', "dependencies { api project(':core') }");
    w('core/build.gradle', "dependencies { }");
  } else if (build === 'gradle-alias') {
    w('settings.gradle', "include ':shell'\n");
    w('shell/build.gradle', "dependencies { implementation Deps.Lib.core_lib\n implementation Deps.Business.biz }");
    w('Deps.kt', 'object Deps { const val core_lib = "com.x:core-lib:1.0"\n const val biz = "com.x:biz:1.0" }');
  }
  return { root, w };
}

function runCli(script, args) {
  return execFileSync('node', [path.join(SCRIPTS, script), ...args], { encoding: 'utf8' });
}

describe('spec-project-rules deterministic scripts', () => {
  test('extract-deps resolves npm workspaces edges', () => {
    const { root } = makeRepo('npm');
    const out = JSON.parse(runCli('extract-deps.cjs', [root]));
    expect(out.build_kind).toBe('npm-workspaces');
    expect(out.modules).toEqual(['apps/admin', 'apps/web', 'packages/shared']);
    expect(out.edges).toEqual([['apps/web', 'packages/shared']]);
  });

  test('extract-deps resolves gradle project refs and alias tables', () => {
    const aliasRepo = makeRepo('gradle-alias');
    const out = JSON.parse(runCli('extract-deps.cjs', [aliasRepo.root, '--alias-file', path.join(aliasRepo.root, 'Deps.kt')]));
    expect(out.build_kind).toBe('gradle');
    expect(out.edges).toContainEqual(['shell', 'core-lib']);
    expect(out.edges).toContainEqual(['shell', 'biz']);
    expect(out.unresolved_alias_count).toBe(0);

    const gradleRepo = makeRepo('gradle');
    const direct = JSON.parse(runCli('extract-deps.cjs', [gradleRepo.root]));
    expect(direct.edges).toEqual([['app', 'biz'], ['biz', 'core']]);
  });

  test('extract-deps exits 2 for unsupported layouts', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pr-empty-'));
    let status = 0;
    try {
      runCli('extract-deps.cjs', [root]);
    } catch (error) {
      status = error.status;
    }
    expect(status).toBe(2);
  });

  test('verify-deps flags violations and missing refs, routes class-level rows to manual check', () => {
    const { root, w } = makeRepo('npm');
    w('docs/architecture/dependency-rules.md', [
      '| 规则 id | from | to | 允许方向 | grade | source refs | 例外 | status |',
      '| --- | --- | --- | --- | --- | --- | --- | --- |',
      '| DEP-001 | web | admin | 禁止引入 | inferred | `packages/shared/package.json` | 无 | active |',
      '| DEP-002 | web | shared | 允许引入 | inferred | `apps/web/package.json` | 无 | active |',
      '| DEP-003 | 业务模块 | admin | 禁止引入 | confirmed | `apps/gone/package.json` | 无 | active |',
    ].join('\n'));
    let out;
    try {
      out = JSON.parse(runCli('verify-deps.cjs', [root]));
    } catch (error) {
      // missing refs are findings, so exit 1 with a report is expected here
      out = JSON.parse(error.stdout);
    }
    // web -> admin: no such edge in fixture, so DEP-001 has no violation;
    // the forbidden-edge detector is exercised via DEP-002-style check below.
    expect(out.dep_rows).toBe(3);
    expect(out.violations).toEqual([]);
    expect(out.absent_allowed).toEqual([]);
    expect(out.manual_check).toEqual([{ id: 'DEP-003', reason: expect.stringContaining('not a concrete module') }]);
    expect(out.missing_refs).toEqual([{ id: 'DEP-003', ref: 'apps/gone/package.json' }]);
  });

  test('verify-deps does not flag npm scoped package names as missing refs', () => {
    const { root, w } = makeRepo('npm');
    w('docs/architecture/dependency-rules.md', [
      '| 规则 id | from | to | 允许方向 | grade | source refs | 例外 | status |',
      '| --- | --- | --- | --- | --- | --- | --- | --- |',
      '| DEP-001 | web | packages/shared | 允许引入 | inferred | `@x/shared`、`apps/web/package.json` | 无 | active |',
    ].join('\n'));
    let out;
    try {
      out = JSON.parse(runCli('verify-deps.cjs', [root]));
    } catch (error) {
      out = JSON.parse(error.stdout);
    }
    expect(out.missing_refs).toEqual([]);
    expect(out.absent_allowed).toEqual([]);
  });

  test('verify-deps detects a present forbidden edge', () => {
    const { root, w } = makeRepo('npm');
    w('docs/architecture/dependency-rules.md', [
      '| 规则 id | from | to | 允许方向 | grade | source refs | 例外 | status |',
      '| --- | --- | --- | --- | --- | --- | --- | --- |',
      '| DEP-001 | web | shared | 禁止引入 | inferred | `apps/web/package.json` | 无 | active |',
    ].join('\n'));
    let out;
    let status = 0;
    try {
      out = JSON.parse(runCli('verify-deps.cjs', [root]));
    } catch (error) {
      status = error.status;
      out = JSON.parse(error.stdout);
    }
    expect(status).toBe(1);
    expect(out.violations).toEqual([{
      id: 'DEP-001', from: 'web', to: 'shared',
      note: expect.stringContaining('forbidden edge currently present'),
    }]);
  });
});
