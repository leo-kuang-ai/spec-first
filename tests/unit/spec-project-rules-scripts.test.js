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
    w('Deps.kt', [
      'object Deps {',
      ' const val core_lib = "com.x:core-lib:1.0"',
      ' const val biz = "com.x:biz:1.0"',
      '}',
    ].join('\n'));
  }
  return { root, w };
}

function runCli(script, args) {
  return execFileSync('node', [path.join(SCRIPTS, script), ...args], { encoding: 'utf8' });
}

function git(root, args) {
  return execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', ...args],
    { cwd: root, encoding: 'utf8' });
}

function makeGitRepoWithKb(build, kbLines) {
  const repo = makeRepo(build);
  git(repo.root, ['init', '-q', '-b', 'main']);
  git(repo.root, ['add', '-A']);
  git(repo.root, ['commit', '-qm', 'base']);
  const head = git(repo.root, ['rev-parse', '--short', 'HEAD']).trim();
  repo.w('docs/architecture.md', kbLines(head).join('\n'));
  return repo;
}

describe('spec-project-rules deterministic scripts', () => {
  test('extract-deps resolves npm workspaces edges', () => {
    const { root } = makeRepo('npm');
    const out = JSON.parse(runCli('extract-deps.cjs', [root]));
    expect(out.build_kind).toBe('npm-workspaces');
    expect(out.modules).toEqual(['apps/admin', 'apps/web', 'packages/shared']);
    expect(out.edges).toEqual([['apps/web', 'packages/shared']]);
    expect(out.alias_discovery).toBe('not-applicable');
    expect(out.alias_candidate_count).toBe(0);
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

  test('extract-deps auto-discovers the richest Gradle alias table', () => {
    const { root, w } = makeRepo('gradle-alias');
    w('other/Deps.kt', 'object Deps { const val unrelated = "com.x:unrelated:1.0" }');
    w('hszq-version/src/main/java/version/Deps.kt', [
      'object Deps {',
      ' const val core_lib = "com.x:core-lib:1.0"',
      ' const val biz = "com.x:biz:1.0"',
      ' const val extra = "com.x:extra:1.0"',
      '}',
    ].join('\n'));

    const out = JSON.parse(runCli('extract-deps.cjs', [root]));
    expect(out.alias_discovery).toBe('auto');
    expect(out.alias_file).toBe('hszq-version/src/main/java/version/Deps.kt');
    expect(out.alias_count).toBe(3);
    expect(out.edges).toContainEqual(['shell', 'core-lib']);
    expect(out.edges).toContainEqual(['shell', 'biz']);
    expect(out.unresolved_alias_count).toBe(0);
  });

  test('extract-deps gives an explicit alias table precedence over richer auto candidates', () => {
    const { root, w } = makeRepo('gradle-alias');
    const explicit = w('explicit/Deps.kt', [
      'object Deps {',
      ' const val core_lib: String = "com.x:explicit-core:1.0"',
      ' const val biz = "com.x:explicit-biz:1.0"',
      '}',
    ].join('\n'));
    w('rich/Deps.kt', [
      'object Deps {',
      ' const val core_lib = "com.x:auto-core:1.0"',
      ' const val biz = "com.x:auto-biz:1.0"',
      ' const val extra = "com.x:extra:1.0"',
      '}',
    ].join('\n'));

    const out = JSON.parse(runCli('extract-deps.cjs', [root, '--alias-file', explicit]));
    expect(out.alias_discovery).toBe('explicit');
    expect(out.alias_file).toBe('explicit/Deps.kt');
    expect(out.edges).toContainEqual(['shell', 'explicit-core']);
    expect(out.edges).not.toContainEqual(['shell', 'auto-core']);
  });

  test('extract-deps ignores commented aliases, parses typed constants, and follows a file symlink', () => {
    const { root, w } = makeRepo('gradle-alias');
    const target = w('shared/RealDeps.kt', [
      'object Deps {',
      ' // const val fake = "com.x:fake:1.0"',
      ' const val core_lib: String = "com.x:typed-core:1.0"',
      ' const val biz = "com.x:biz:1.0"',
      '}',
    ].join('\n'));
    fs.unlinkSync(path.join(root, 'Deps.kt'));
    fs.symlinkSync(target, path.join(root, 'Deps.kt'));

    const out = JSON.parse(runCli('extract-deps.cjs', [root]));
    expect(out.alias_discovery).toBe('auto');
    expect(out.alias_file).toBe('Deps.kt');
    expect(out.alias_count).toBe(2);
    expect(out.edges).toContainEqual(['shell', 'typed-core']);
    expect(out.edges).not.toContainEqual(['shell', 'fake']);
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

  test('extract-deps emits a deterministic sampling payload for unsupported layouts', () => {
    const { root, w } = makeRepo('npm');
    fs.rmSync(path.join(root, 'package.json'));
    for (const dir of ['lib/core', 'lib/net', 'lib/util', 'app']) {
      for (let i = 1; i <= 6; i += 1) {
        w(`${dir}/mod${i}.ts`, `export const m${i} = ${i};\n`);
      }
    }
    w('lib/net/index.ts', 'export function request(u: string) { return u; }\n');
    w('node_modules/pkg/index.js', 'export const skipped = 1;\n');
    let out;
    let status = 0;
    try {
      out = JSON.parse(runCli('extract-deps.cjs', [root]));
    } catch (error) {
      status = error.status;
      out = JSON.parse(error.stdout);
    }
    expect(status).toBe(2);
    expect(out.build_kind).toBe('unsupported-layout');
    const sampling = out.sampling;
    expect(sampling.total_source_files).toBe(25);
    // Modules sorted by file count desc; node_modules never becomes a module.
    expect(sampling.modules.map((m) => m.dir)).toEqual(['lib', 'app']);
    const net = sampling.modules.find((m) => m.dir === 'lib');
    expect(net.file_count).toBe(19);
    expect(net.sample_files.length).toBeLessThanOrEqual(sampling.per_module_cap);
    expect(net.sample_files).toContain('lib/net/index.ts');
    expect(net.sample_files.every((f) => f.startsWith('lib/'))).toBe(true);
    expect(sampling.sampled_file_count).toBe(sampling.modules.reduce((sum, m) => sum + m.sample_files.length, 0));
  });

  test('extract-deps --verify reports findings on v2 single-file architecture.md', () => {
    const { root, w } = makeRepo('npm');
    w('docs/architecture.md', [
      '# Test Architecture',
      '<!-- spec-project-rules-start -->',
      '',
      '## 依赖方向（dep）',
      '- web 禁止依赖 packages/shared | inferred | `packages/shared/package.json`',
      '',
      '## 约定（rules）',
      '- 网络请求必须走 packages/api-client | inferred | `apps/gone/package.json`',
      '',
      '<!-- spec-project-rules-end -->',
    ].join('\n'));
    let out;
    let status = 0;
    try {
      out = JSON.parse(runCli('extract-deps.cjs', [root, '--verify']));
    } catch (error) {
      status = error.status;
      out = JSON.parse(error.stdout);
    }
    expect(out.verify).toBeDefined();
    // web -> shared edge exists in fixture → forbidden edge violation
    expect(out.verify.violations.length).toBeGreaterThan(0);
    expect(out.verify.violations[0]).toMatchObject({ from: 'apps/web', to: 'packages/shared' });
    // apps/gone/package.json doesn't exist → missing ref
    expect(out.verify.missing_refs).toContainEqual(expect.objectContaining({ ref: 'apps/gone/package.json' }));
    expect(status).toBe(1);
  });

  test('extract-deps --verify reports clean when no violations and all refs exist', () => {
    const { root, w } = makeRepo('npm');
    w('docs/architecture.md', [
      '# Test Architecture',
      '<!-- spec-project-rules-start -->',
      '',
      '## 依赖方向（dep）',
      '- admin 禁止依赖 apps/web | inferred | `apps/admin/package.json`',
      '',
      '<!-- spec-project-rules-end -->',
    ].join('\n'));
    const out = JSON.parse(runCli('extract-deps.cjs', [root, '--verify']));
    expect(out.verify.verify_status).toBe('clean');
    expect(out.verify.violations).toEqual([]);
  });

  test('extract-deps --verify exits 1 on missing refs alone (no violations)', () => {
    const { root, w } = makeRepo('npm');
    w('docs/architecture.md', [
      '# Test Architecture',
      '## 依赖方向（dep）',
      '- admin 不得依赖 apps/web | inferred | `apps/gone/deep/file.json`',
    ].join('\n'));
    let out;
    let status = 0;
    try {
      out = JSON.parse(runCli('extract-deps.cjs', [root, '--verify']));
    } catch (error) {
      status = error.status;
      out = JSON.parse(error.stdout);
    }
    // 不得 is a recognized forbidding verb; no admin->web edge exists so no violation.
    expect(out.verify.violations).toEqual([]);
    expect(out.verify.missing_refs.length).toBeGreaterThan(0);
    expect(status).toBe(1);
  });

  test('extract-deps --verify flags refs escaping the repo root instead of probing them', () => {
    const { root, w } = makeRepo('npm');
    w('docs/architecture.md', [
      '# Test Architecture',
      '## 约定（rules）',
      '- 必须走封装 | inferred | `../outside/secret/path.json`',
    ].join('\n'));
    let out;
    try {
      out = JSON.parse(runCli('extract-deps.cjs', [root, '--verify']));
    } catch (error) {
      out = JSON.parse(error.stdout);
    }
    expect(out.verify.missing_refs).toContainEqual(
      expect.objectContaining({ ref: '../outside/secret/path.json', reason: 'ref escapes repo root' }),
    );
  });

  test('extract-deps --verify strips :line suffixes and skips URL citations', () => {
    const { root, w } = makeRepo('npm');
    w('docs/architecture.md', [
      '# Test Architecture',
      '## 约定（rules）',
      '- 必须走封装 | inferred | `apps/web/package.json:1`',
      '- API 文档见 `https://api.example.com/docs`，客户端走 shared | inferred | `packages/shared/package.json:3`',
      '- 反例引用不存在 | inferred | `apps/web/package.json:999` 所在文件存在但行号无效应通过',
      '- 坏引用 | inferred | `apps/missing/file.ts:12`',
    ].join('\n'));
    let out;
    let status = 0;
    try {
      out = JSON.parse(runCli('extract-deps.cjs', [root, '--verify']));
    } catch (error) {
      status = error.status;
      out = JSON.parse(error.stdout);
    }
    const refs = out.verify.missing_refs.map((item) => item.ref);
    expect(refs).toContain('apps/missing/file.ts:12');
    expect(refs).not.toContain('apps/web/package.json:1');
    expect(refs).not.toContain('apps/web/package.json:999');
    expect(refs).not.toContain('https://api.example.com/docs');
    expect(refs).not.toContain('packages/shared/package.json:3');
    expect(status).toBe(1);
  });

  test('extract-deps --freshness reports clean against the source_commit baseline', () => {
    const { root } = makeGitRepoWithKb('npm', (head) => [
      '---',
      `source_commit: ${head}`,
      '---',
      '# Test Architecture',
      '<!-- spec-project-rules-start -->',
      '',
      '## 约定（rules）',
      '- 必须走 shared 封装 | inferred | `apps/web/package.json`、`packages/shared/package.json:2`',
      '- 明文边界 | confirmed | `README.md`（架构边界节）',
      '',
      '<!-- spec-project-rules-end -->',
    ]);
    const out = JSON.parse(runCli('extract-deps.cjs', [root, '--freshness']));
    expect(out.freshness.status).toBe('clean');
    expect(out.freshness.source_commit).toBeTruthy();
    expect(out.freshness.ref_count).toBe(3);
    expect(out.freshness.dirty_refs).toEqual([]);
  });

  test('extract-deps --freshness flags dirty refs including root-file citations', () => {
    const repo = makeRepo('npm');
    repo.w('README.md', '# Shop\n\n原架构说明\n');
    git(repo.root, ['init', '-q', '-b', 'main']);
    git(repo.root, ['add', '-A']);
    git(repo.root, ['commit', '-qm', 'base']);
    const head = git(repo.root, ['rev-parse', '--short', 'HEAD']).trim();
    repo.w('docs/architecture.md', [
      '---',
      `source_commit: ${head}`,
      '---',
      '# Test Architecture',
      '<!-- spec-project-rules-start -->',
      '',
      '## 约定（rules）',
      '- 必须走 shared 封装 | inferred | `apps/web/package.json`',
      '- 明文边界 | confirmed | `README.md`（架构边界节）',
      '',
      '<!-- spec-project-rules-end -->',
    ].join('\n'));
    const { root, w } = repo;
    w('apps/web/package.json', JSON.stringify({ name: 'web', dependencies: { '@x/shared': '^2' } }));
    w('README.md', '# Shop\n\n新架构说明\n');
    const out = JSON.parse(runCli('extract-deps.cjs', [root, '--freshness']));
    expect(out.freshness.status).toBe('dirty');
    expect(out.freshness.dirty_refs).toEqual(['README.md', 'apps/web/package.json']);
  });

  test('extract-deps --freshness degrades to unavailable without git or baseline', () => {
    const { root, w } = makeRepo('npm');
    w('docs/architecture.md', [
      '---',
      'source_commit: eval0001',
      '---',
      '# Test Architecture',
      '## 约定（rules）',
      '- 必须走 shared 封装 | inferred | `apps/web/package.json`',
    ].join('\n'));
    const noGit = JSON.parse(runCli('extract-deps.cjs', [root, '--freshness']));
    expect(noGit.freshness.status).toBe('unavailable');
    expect(noGit.freshness.reason).toContain('git baseline unavailable');

    const noKb = makeRepo('npm');
    const missing = JSON.parse(runCli('extract-deps.cjs', [noKb.root, '--freshness']));
    expect(missing.freshness.status).toBe('no-kb');
  });
});
