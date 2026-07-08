'use strict';

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ClaudeAdapter = require('../../src/cli/adapters/claude');
const CodexAdapter = require('../../src/cli/adapters/codex');
const {
  buildFilteredAssetSet,
  inspectInstalledAssets,
  planBundledAssetSync,
  syncBundledAssets,
} = require('../../src/cli/plugin');
const {
  planObsoleteManagedAssetRemoval,
} = require('../../src/cli/state');

const REPO_ROOT = path.join(__dirname, '..', '..');
const SKILL_PATH = path.join(REPO_ROOT, 'skills', 'spec-worktree', 'SKILL.md');
const SCRIPT_PATH = path.join(REPO_ROOT, 'skills', 'spec-worktree', 'scripts', 'worktree-manager.sh');

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-spec-worktree-'));
}

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    throw new Error([
      `${command} ${args.join(' ')} failed with status ${result.status}`,
      `stdout:\n${result.stdout}`,
      `stderr:\n${result.stderr}`,
    ].join('\n'));
  }
  return result;
}

function initGitRepoAt(repo, options = {}) {
  fs.mkdirSync(repo, { recursive: true });
  run('git', ['init', '-b', 'main'], repo);
  fs.writeFileSync(path.join(repo, 'README.md'), '# fixture\n');
  if (options.trackEnv) {
    fs.writeFileSync(path.join(repo, '.env'), 'tracked_secret=do-not-print\n');
  }
  run('git', ['add', '.'], repo);
  run('git', [
    '-c', 'core.hooksPath=/dev/null',
    '-c', 'user.name=Spec Test',
    '-c', 'user.email=spec@example.test',
    'commit',
    '-m', 'init',
  ], repo);
  return repo;
}

function initGitRepo(options = {}) {
  return initGitRepoAt(makeTempDir(), options);
}

function runWorktreeManager(repo, args) {
  return spawnSync('bash', [SCRIPT_PATH, ...args], {
    cwd: repo,
    encoding: 'utf8',
  });
}

function runWorktreeCreate(repo, args) {
  return runWorktreeManager(repo, ['create', ...args]);
}

function parseJson(stdout) {
  return JSON.parse(stdout);
}

function plannedRuntimeContent(platform, targetPath) {
  const projectRoot = makeTempDir();

  try {
    const adapter = platform === 'claude' ? new ClaudeAdapter() : new CodexAdapter();
    const { plan } = planBundledAssetSync(projectRoot, adapter);
    const operation = plan.operations.find((entry) => entry.path === targetPath);
    if (!operation) {
      throw new Error(`Missing planned runtime operation for ${targetPath}`);
    }
    return operation.contents;
  } finally {
    fs.rmSync(projectRoot, { recursive: true, force: true });
  }
}

describe('spec-worktree runtime delivery contracts', () => {
  test('source uses a narrow Bash allow pattern and no bare bundled script path', () => {
    const skill = read(SKILL_PATH);

    expect(skill).toContain('allowed-tools: Bash(bash *worktree-manager.sh*)');
    expect(skill).toContain('user-invocable: false');
    expect(skill).toContain('Internal helper for public workflows');
    expect(skill).not.toContain('allowed-tools: Bash(bash *)');
    expect(skill).toContain('`bash -c` wrapper whose command text includes `exec bash ...worktree-manager.sh`');
    expect(skill).toContain('exec bash "$CLAUDE_SKILL_DIR/scripts/worktree-manager.sh" "$@"');
    expect(skill).toContain('exec bash "$(git rev-parse --show-toplevel)"/"skills/spec-worktree/scripts/worktree-manager.sh" "$@"');
    expect(skill).toContain("' _ detect --json");
    expect(skill).toContain("' _ create [--copy-env] <branch-name> [from-branch]");
    expect(skill).toContain("' _ create feat/login");
    expect(skill).toContain("' _ create --copy-env feat/local-env");
    expect(skill).not.toContain('\nif [ -n "${CLAUDE_SKILL_DIR:-}" ]; then');
    expect(skill).not.toContain('bash "${CLAUDE_SKILL_DIR}/scripts/worktree-manager.sh"');
    expect(skill).not.toContain('bash scripts/worktree-manager.sh create');
  });

  test('env file copying is explicit opt-in and audited without contents', () => {
    const skill = read(SKILL_PATH);
    const script = read(SCRIPT_PATH);

    expect(skill).toContain('Does not copy `.env*` files by default');
    expect(skill).toContain('Use `--copy-env` only when the workflow explicitly needs local environment files');
    expect(skill).toContain('except `.env.example`, `.env.template`, and `.env.sample`');
    expect(skill).toContain('appends `.env-copy.log` with timestamp, source path, destination path, byte size, and an 8-character content fingerprint');
    expect(skill).toContain('The log does not include file contents');
    expect(skill).toContain('Even when env files were copied intentionally, downstream staging must still treat them as denied by default');
    expect(skill).not.toContain('Copies `.env`, `.env.local`, `.env.test`, etc. from the main repo');
    expect(skill).not.toContain('for env_file in .env .env.*');

    expect(script).toContain('worktree-manager.sh create [--copy-env] <branch-name> [from-branch]');
    expect(script).toContain('local copy_env="false"');
    expect(script).toContain('if [[ "${1:-}" == "--copy-env" ]]');
    expect(script).toContain('Not copied by default. Re-run create with --copy-env to opt in.');
    expect(script).toContain('.env.example|.env.template|.env.sample');
    expect(script).toContain('ensure_env_copy_log_excluded');
    expect(script).toContain('.env-copy.log');
    expect(script).toContain('git -C "$worktree_path" rev-parse --git-path info/exclude');
    expect(script).toContain('shasum -a 256 "$source"');
    expect(script).toContain('sha256sum "$source"');
    expect(script).toContain('timestamp=%s source_path=%s destination_path=%s size_bytes=%s sha256_8=%s');
    expect(script).toContain('>> "$log_file"');
    expect(script).not.toContain('cat "$source"');
  });

  test('detect --json exposes deterministic checkout state facts', () => {
    const skill = read(SKILL_PATH);
    const script = read(SCRIPT_PATH);

    expect(skill).toContain('Step 0: Detect existing isolation');
    expect(skill).toContain('detect --json');
    expect(skill).toContain('spec-worktree-detect.v1');
    expect(skill).toContain('not-git-repo');
    expect(skill).toContain('output-contract-failed');

    expect(script).toContain('detect --json');
    expect(script).toContain('spec-worktree-detect.v1');
    expect(script).toContain('ordinary-checkout | linked-worktree | submodule | unknown');
    expect(script).toContain('same-git-dir | linked-worktree | submodule-superproject | not-git-repo | git-query-failed | output-contract-failed');
  });

  test('detect --json reports ordinary checkout from root and subdirectories', () => {
    const repo = initGitRepo();
    try {
      const repoReal = fs.realpathSync(repo);
      const rootResult = runWorktreeManager(repo, ['detect', '--json']);
      expect(rootResult.status).toBe(0);
      const rootFacts = parseJson(rootResult.stdout);
      expect(rootFacts).toMatchObject({
        schema_version: 'spec-worktree-detect.v1',
        state: 'ordinary-checkout',
        reason_code: 'same-git-dir',
        worktree_root: repoReal,
        main_worktree_root: repoReal,
      });
      expect(rootFacts.git_dir).toBe(fs.realpathSync(path.join(repo, '.git')));
      expect(rootFacts.common_dir).toBe(fs.realpathSync(path.join(repo, '.git')));
      expect(rootFacts.branch).toBe('main');

      const subdir = path.join(repo, 'nested', 'path');
      fs.mkdirSync(subdir, { recursive: true });
      const subdirResult = runWorktreeManager(subdir, ['detect', '--json']);
      expect(subdirResult.status).toBe(0);
      expect(parseJson(subdirResult.stdout)).toMatchObject({
        state: 'ordinary-checkout',
        reason_code: 'same-git-dir',
        worktree_root: repoReal,
        main_worktree_root: repoReal,
      });
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  test('detect --json reports linked worktrees and create refuses nested worktrees', () => {
    const repo = initGitRepo();
    const linkedPath = path.join(repo, '.worktrees', 'linked-existing');
    try {
      run('git', ['worktree', 'add', '-b', 'linked-existing', linkedPath, 'main'], repo);
      const repoReal = fs.realpathSync(repo);
      const linkedReal = fs.realpathSync(linkedPath);

      const detectResult = runWorktreeManager(linkedPath, ['detect', '--json']);
      expect(detectResult.status).toBe(0);
      expect(parseJson(detectResult.stdout)).toMatchObject({
        schema_version: 'spec-worktree-detect.v1',
        state: 'linked-worktree',
        reason_code: 'linked-worktree',
        worktree_root: linkedReal,
        main_worktree_root: repoReal,
        branch: 'linked-existing',
      });

      const createResult = runWorktreeCreate(linkedPath, ['nested-from-linked', 'main']);
      expect(createResult.status).not.toBe(0);
      expect(createResult.stderr).toContain('already in an isolated worktree');
      expect(createResult.stderr).toContain('reason_code=linked-worktree');
      expect(fs.existsSync(path.join(repo, '.worktrees', 'nested-from-linked'))).toBe(false);
      expect(fs.existsSync(path.join(linkedPath, '.worktrees', 'nested-from-linked'))).toBe(false);
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  test('detect --json reports submodules without classifying them as linked worktrees', () => {
    const parent = makeTempDir();
    const superRepo = path.join(parent, 'super');
    const childRepo = path.join(parent, 'child');
    try {
      initGitRepoAt(superRepo);
      initGitRepoAt(childRepo);
      run('git', ['-c', 'protocol.file.allow=always', 'submodule', 'add', childRepo, 'modules/child'], superRepo);
      run('git', [
        '-c', 'core.hooksPath=/dev/null',
        '-c', 'user.name=Spec Test',
        '-c', 'user.email=spec@example.test',
        'commit',
        '-m', 'add submodule',
      ], superRepo);

      const submodulePath = path.join(superRepo, 'modules', 'child');
      const result = runWorktreeManager(submodulePath, ['detect', '--json']);
      expect(result.status).toBe(0);
      const facts = parseJson(result.stdout);
      // Load-bearing invariant: a submodule must never be misclassified as a
      // linked-worktree (that is the whole point of the superproject check).
      // Both ordinary-checkout and submodule are acceptable: a submodule at its
      // own root has git_dir == common_dir, so it correctly resolves to
      // ordinary-checkout; the `submodule` state only fires for the rarer case
      // where git_dir != common_dir AND a superproject is present. Do not
      // tighten this to require `submodule` — that would fail on the normal
      // submodule-at-root topology.
      expect(facts.state).not.toBe('linked-worktree');
      expect(['ordinary-checkout', 'submodule']).toContain(facts.state);
      if (facts.state === 'submodule') {
        expect(facts.reason_code).toBe('submodule-superproject');
      }
    } finally {
      fs.rmSync(parent, { recursive: true, force: true });
    }
  });

  test('detect --json reports a real branch name verbatim and detached HEAD as null', () => {
    // Regression: the emitter must not collapse a real branch (even one that
    // looks like an internal sentinel) to null, and must report detached HEAD
    // as null branch.
    const repo = initGitRepo();
    try {
      run('git', ['branch', '-m', '__SPEC_FIRST_NULL__'], repo);
      const named = parseJson(runWorktreeManager(repo, ['detect', '--json']).stdout);
      expect(named.branch).toBe('__SPEC_FIRST_NULL__');

      run('git', ['checkout', '--detach'], repo);
      const detached = parseJson(runWorktreeManager(repo, ['detect', '--json']).stdout);
      expect(detached.branch).toBeNull();
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  test('detect --json reports non-git directories as unknown with a reason code', () => {
    const dir = makeTempDir();
    try {
      const result = runWorktreeManager(dir, ['detect', '--json']);
      expect(result.status).not.toBe(0);
      expect(parseJson(result.stdout)).toMatchObject({
        schema_version: 'spec-worktree-detect.v1',
        state: 'unknown',
        reason_code: 'not-git-repo',
      });

      const createResult = runWorktreeCreate(dir, ['should-not-create']);
      expect(createResult.status).not.toBe(0);
      expect(createResult.stderr).toContain('reason_code=not-git-repo');
      expect(fs.existsSync(path.join(dir, '.worktrees', 'should-not-create'))).toBe(false);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  test('create anchors .worktrees on the working tree, not the git dir, for --separate-git-dir repos', () => {
    // Regression for the separate-git-dir clash: `git worktree list` reports the
    // external git dir as the first entry, so anchoring on main_worktree_root
    // would drop .worktrees/.gitignore inside the git dir instead of the working
    // tree. create must anchor on --show-toplevel (the working tree).
    const parent = makeTempDir();
    const workTree = path.join(parent, 'wt');
    const gitDir = path.join(parent, 'extgit');
    try {
      fs.mkdirSync(workTree, { recursive: true });
      run('git', ['init', '-b', 'main', '--separate-git-dir', gitDir, workTree], parent);
      fs.writeFileSync(path.join(workTree, 'README.md'), '# fixture\n');
      run('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', 'add', '.'], workTree);
      run('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-m', 'init'], workTree);

      const detect = parseJson(runWorktreeManager(workTree, ['detect', '--json']).stdout);
      expect(detect).toMatchObject({
        state: 'ordinary-checkout',
        reason_code: 'same-git-dir',
        worktree_root: fs.realpathSync(workTree),
        main_worktree_root: fs.realpathSync(workTree),
        git_dir: fs.realpathSync(gitDir),
        common_dir: fs.realpathSync(gitDir),
      });

      const result = runWorktreeCreate(workTree, ['probe', 'main']);
      expect(result.status).toBe(0);
      expect(fs.existsSync(path.join(workTree, '.worktrees', 'probe'))).toBe(true);
      expect(fs.existsSync(path.join(gitDir, '.worktrees', 'probe'))).toBe(false);
      expect(read(path.join(workTree, '.gitignore'))).toContain('.worktrees');
      expect(fs.existsSync(path.join(gitDir, '.gitignore'))).toBe(false);
    } finally {
      fs.rmSync(parent, { recursive: true, force: true });
    }
  });

  test('default create does not copy untracked env files', () => {
    const repo = initGitRepo();
    try {
      fs.writeFileSync(path.join(repo, '.env'), 'secret=not-copied\n');
      fs.writeFileSync(path.join(repo, '.env.local'), 'local_secret=not-copied\n');
      fs.writeFileSync(path.join(repo, '.env.example'), 'example=not-secret\n');

      const result = runWorktreeCreate(repo, ['no-env-copy', 'main']);

      expect(result.status).toBe(0);
      expect(result.stdout).toContain('Not copied by default. Re-run create with --copy-env to opt in.');
      const worktreePath = path.join(repo, '.worktrees', 'no-env-copy');
      expect(fs.existsSync(path.join(worktreePath, '.env'))).toBe(false);
      expect(fs.existsSync(path.join(worktreePath, '.env.local'))).toBe(false);
      expect(fs.existsSync(path.join(worktreePath, '.env-copy.log'))).toBe(false);
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  test('create refuses to append .worktrees through a symlinked .gitignore', () => {
    const repo = initGitRepo();
    const outsideFile = path.join(os.tmpdir(), `spec-first-gitignore-outside-${process.pid}.txt`);

    try {
      fs.writeFileSync(outsideFile, 'outside\n', 'utf8');
      fs.symlinkSync(outsideFile, path.join(repo, '.gitignore'));

      const result = runWorktreeCreate(repo, ['gitignore-symlink', 'main']);

      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain('refusing to modify symlinked .gitignore');
      expect(fs.readFileSync(outsideFile, 'utf8')).toBe('outside\n');
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
      fs.rmSync(outsideFile, { force: true });
    }
  });

  test('--copy-env copies only real env files and keeps audit log out of git', () => {
    const repo = initGitRepo();
    try {
      fs.writeFileSync(path.join(repo, '.env'), 'secret=super-secret-value\n');
      fs.writeFileSync(path.join(repo, '.env.local'), 'local_secret=another-secret\n');
      fs.writeFileSync(path.join(repo, '.env.example'), 'example=not-secret\n');
      fs.writeFileSync(path.join(repo, '.env.template'), 'template=not-secret\n');
      fs.writeFileSync(path.join(repo, '.env.sample'), 'sample=not-secret\n');

      const result = runWorktreeCreate(repo, ['--copy-env', 'with-env-copy', 'main']);

      expect(result.status).toBe(0);
      expect(result.stdout).toContain('Copying env files by explicit --copy-env opt-in:');
      expect(result.stdout).toContain('- .env');
      expect(result.stdout).toContain('- .env.local');
      expect(result.stdout).not.toContain('.env.example');
      expect(result.stdout).not.toContain('.env.template');
      expect(result.stdout).not.toContain('.env.sample');
      expect(result.stdout).not.toContain('super-secret-value');

      const worktreePath = path.join(repo, '.worktrees', 'with-env-copy');
      expect(fs.readFileSync(path.join(worktreePath, '.env'), 'utf8')).toBe('secret=super-secret-value\n');
      expect(fs.readFileSync(path.join(worktreePath, '.env.local'), 'utf8')).toBe('local_secret=another-secret\n');
      expect(fs.existsSync(path.join(worktreePath, '.env.example'))).toBe(false);
      expect(fs.existsSync(path.join(worktreePath, '.env.template'))).toBe(false);
      expect(fs.existsSync(path.join(worktreePath, '.env.sample'))).toBe(false);

      const logPath = path.join(worktreePath, '.env-copy.log');
      const log = fs.readFileSync(logPath, 'utf8');
      expect(log).toContain('source_path=');
      expect(log).toContain('destination_path=');
      expect(log).toContain('size_bytes=');
      expect(log).toMatch(/sha256_8=[a-f0-9]{8}/);
      expect(log).not.toContain('super-secret-value');
      expect(log).not.toContain('another-secret');

      run('git', ['-C', worktreePath, 'check-ignore', '.env-copy.log'], repo);
      const status = run('git', ['-C', worktreePath, 'status', '--short', '--', '.env-copy.log'], repo);
      expect(status.stdout).toBe('');
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  test('--copy-env refuses to overwrite symlinked env destinations', () => {
    const repo = initGitRepo();
    const outsideFile = path.join(os.tmpdir(), `spec-first-env-outside-${process.pid}.txt`);

    try {
      fs.writeFileSync(outsideFile, 'outside-before\n', 'utf8');
      fs.symlinkSync(outsideFile, path.join(repo, '.env'));
      run('git', ['add', '.env'], repo);
      run('git', [
        '-c', 'core.hooksPath=/dev/null',
        '-c', 'user.name=Spec Test',
        '-c', 'user.email=spec@example.test',
        'commit',
        '-m', 'track env symlink',
      ], repo);
      run('git', ['branch', 'symlink-base'], repo);
      fs.rmSync(path.join(repo, '.env'), { force: true });
      fs.writeFileSync(path.join(repo, '.env'), 'main-secret=do-not-leak\n', 'utf8');

      const result = runWorktreeCreate(repo, ['--copy-env', 'env-symlink', 'symlink-base']);

      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain('refusing to copy env file through symlink destination: .env');
      expect(fs.readFileSync(outsideFile, 'utf8')).toBe('outside-before\n');
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
      fs.rmSync(outsideFile, { force: true });
    }
  });

  test('--copy-env refuses symlinked env copy logs before writing outside the worktree', () => {
    const repo = initGitRepo();
    const outsideFile = path.join(os.tmpdir(), `spec-first-env-log-outside-${process.pid}.txt`);

    try {
      fs.writeFileSync(outsideFile, 'outside-before\n', 'utf8');
      try {
        fs.symlinkSync(outsideFile, path.join(repo, '.env-copy.log'));
      } catch (error) {
        if (error.code === 'EPERM' || error.code === 'EACCES' || error.code === 'ENOSYS') return;
        throw error;
      }
      run('git', ['add', '.env-copy.log'], repo);
      run('git', [
        '-c', 'core.hooksPath=/dev/null',
        '-c', 'user.name=Spec Test',
        '-c', 'user.email=spec@example.test',
        'commit',
        '-m', 'track env copy log symlink',
      ], repo);
      fs.writeFileSync(path.join(repo, '.env'), 'secret=do-not-leak\n', 'utf8');

      const result = runWorktreeCreate(repo, ['--copy-env', 'env-log-symlink', 'main']);

      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain('refusing to write env copy log through symlink destination');
      expect(fs.readFileSync(outsideFile, 'utf8')).toBe('outside-before\n');
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
      fs.rmSync(outsideFile, { force: true });
    }
  });

  test('destination env backups only happen on explicit opt-in path', () => {
    const repo = initGitRepo({ trackEnv: true });
    try {
      const defaultResult = runWorktreeCreate(repo, ['tracked-default', 'main']);
      expect(defaultResult.status).toBe(0);
      expect(fs.existsSync(path.join(repo, '.worktrees', 'tracked-default', '.env.backup'))).toBe(false);

      const optInResult = runWorktreeCreate(repo, ['--copy-env', 'tracked-opt-in', 'main']);
      expect(optInResult.status).toBe(0);
      expect(fs.existsSync(path.join(repo, '.worktrees', 'tracked-opt-in', '.env.backup'))).toBe(true);
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  test('spec-worktree is the only delivered agent-facing internal skill', () => {
    for (const platform of ['claude', 'codex']) {
      const assets = buildFilteredAssetSet(platform);

      expect(assets.internalSkills).toEqual(['spec-worktree']);
      expect(assets.skills).not.toContain('spec-worktree');
      expect(assets.workflowSkills).not.toContain('spec-worktree');
    }
  });

  test('runtime sync rewrites internal skill source paths and inspect sees no drift', () => {
    for (const [adapter, runtimeSkillPath, rewrittenScriptPath] of [
      [new ClaudeAdapter(), '.claude/skills/spec-worktree/SKILL.md', '.claude/skills/spec-worktree/scripts/worktree-manager.sh'],
      [new CodexAdapter(), '.agents/skills/spec-worktree/SKILL.md', '.agents/skills/spec-worktree/scripts/worktree-manager.sh'],
    ]) {
      const projectRoot = makeTempDir();

      try {
        syncBundledAssets(projectRoot, adapter);

        const content = read(path.join(projectRoot, runtimeSkillPath));
        expect(content).toContain('user-invocable: false');
        expect(content).toContain(rewrittenScriptPath);
        expect(content).toContain(`exec bash "$(git rev-parse --show-toplevel)"/"${path.dirname(rewrittenScriptPath)}/worktree-manager.sh" "$@"`);
        expect(content).not.toContain('bash skills/spec-worktree/scripts/worktree-manager.sh');
        expect(content).not.toContain('bash scripts/worktree-manager.sh create');
        expect(fs.existsSync(path.join(projectRoot, path.dirname(runtimeSkillPath), 'scripts', 'worktree-manager.sh'))).toBe(true);
        expect(fs.existsSync(path.join(projectRoot, adapter.skillsRoot, 'spec-session-inventory'))).toBe(false);
        expect(fs.existsSync(path.join(projectRoot, adapter.skillsRoot, 'spec-session-extract'))).toBe(false);

        const status = inspectInstalledAssets(projectRoot, adapter).skills;
        const gitWorktreeDrift = status.drifted.find((entry) => entry.skillName === 'spec-worktree');
        expect(gitWorktreeDrift).toBeUndefined();
      } finally {
        fs.rmSync(projectRoot, { recursive: true, force: true });
      }
    }
  });

  test('dry-run projection uses the same internal skill runtime paths as sync', () => {
    expect(plannedRuntimeContent('claude', '.claude/skills/spec-worktree/SKILL.md')).toContain(
      '.claude/skills/spec-worktree/scripts/worktree-manager.sh',
    );
    expect(plannedRuntimeContent('codex', '.agents/skills/spec-worktree/SKILL.md')).toContain(
      '.agents/skills/spec-worktree/scripts/worktree-manager.sh',
    );
  });

  test('obsolete managed session primitive runtime skills are removed on next init', () => {
    for (const [adapter, prefix] of [
      [new ClaudeAdapter(), '.claude/skills'],
      [new CodexAdapter(), '.agents/skills'],
    ]) {
      const projectRoot = makeTempDir();
      const previousState = {
        manifestVersion: '1.8.1',
        platform: adapter.id,
        developer: null,
        commands: [],
        skills: ['spec-session-extract', 'spec-session-inventory', 'using-spec-first'],
        workflowSkills: ['spec-work'],
        agents: [],
        agentSupportFiles: [],
      };
      const nextState = {
        ...previousState,
        skills: ['spec-worktree', 'using-spec-first'],
      };

      try {
        const removal = planObsoleteManagedAssetRemoval(projectRoot, previousState, nextState, adapter);
        const paths = removal.operations.map((operation) => operation.path);

        expect(paths).toEqual(expect.arrayContaining([
          `${prefix}/spec-session-extract`,
          `${prefix}/spec-session-inventory`,
        ]));
        expect(paths).not.toContain(`${prefix}/spec-worktree`);
      } finally {
        fs.rmSync(projectRoot, { recursive: true, force: true });
      }
    }
  });
});
