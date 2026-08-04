'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '..', '..');
const experimentScript = path.join(repoRoot, 'skills/spec-optimize/scripts/experiment-worktree.sh');

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function git(args, cwd) {
  execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

function initExperimentRepo(dirName = 'plain') {
  const parent = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'spec-optimize-index-')));
  const dir = path.join(parent, dirName);
  fs.mkdirSync(dir, { recursive: true });
  git(['init', '-b', 'main'], dir);
  git(['config', 'user.email', 'test@example.com'], dir);
  git(['config', 'user.name', 'Spec Test'], dir);
  fs.writeFileSync(path.join(dir, 'README.md'), '# Test\n');
  git(['add', 'README.md'], dir);
  git(['commit', '-m', 'init'], dir);
  return dir;
}

function runExperiment(dir, args) {
  const result = spawnSync('bash', [experimentScript, ...args], { cwd: dir, encoding: 'utf8' });
  return {
    ok: result.status === 0,
    stderr: String(result.stderr || ''),
    stdout: String(result.stdout || ''),
  };
}

function runCleanup(dir, specName, index) {
  const result = spawnSync('bash', [experimentScript, 'cleanup', specName, index], {
    cwd: dir,
    encoding: 'utf8',
  });
  return {
    ok: result.status === 0,
    stderr: String(result.stderr || ''),
    stdout: String(result.stdout || ''),
  };
}

// Displayed experiment indices are zero-padded (exp-008, exp-010), so users copy them straight
// back into cleanup. `printf %03d` read those as octal, which silently retargeted destructive
// cleanup at a different experiment or aborted outright.
describe('spec-optimize experiment index parsing', () => {
  test('cleanup 010 does not retarget experiment 008', () => {
    const dir = initExperimentRepo();
    const sentinelDir = path.join(dir, '.worktrees', 'optimize-myspec-exp-008');
    fs.mkdirSync(sentinelDir, { recursive: true });
    fs.writeFileSync(path.join(sentinelDir, 'uncommitted-work.txt'), 'do not delete\n');

    const result = runCleanup(dir, 'myspec', '010');

    expect(result.ok).toBe(true);
    expect(result.stderr).toContain('optimize-myspec-exp-010');
    expect(fs.existsSync(path.join(sentinelDir, 'uncommitted-work.txt'))).toBe(true);
  });

  test.each([['008'], ['009'], ['099']])('cleanup accepts the zero-padded index %s', (index) => {
    const dir = initExperimentRepo();

    const result = runCleanup(dir, 'myspec', index);

    expect(result.ok).toBe(true);
    expect(result.stderr).toContain(`optimize-myspec-exp-${index}`);
  });

  test('rejects a non-numeric experiment index', () => {
    const dir = initExperimentRepo();

    const result = runCleanup(dir, 'myspec', '1; rm -rf .');

    expect(result.ok).toBe(false);
    expect(result.stderr).toContain('exp_index must be an integer from 0 to 999');
  });

  test.each([
    ['-1'],
    ['1000'],
    ['18446744073709551616'],
  ])('rejects an experiment index outside the governed 0..999 range: %s', (index) => {
    const dir = initExperimentRepo();

    const result = runCleanup(dir, 'myspec', index);

    expect(result.ok).toBe(false);
    expect(result.stderr).toContain('exp_index must be an integer from 0 to 999');
  });

  test('accepts the maximum governed experiment index 999 without retargeting', () => {
    const dir = initExperimentRepo();

    const result = runCleanup(dir, 'myspec', '999');

    expect(result.ok).toBe(true);
    expect(result.stderr).toContain('optimize-myspec-exp-999');
  });
});

// `git worktree list --porcelain` prints `worktree <path>`; matching on awk's `$2` truncated any
// path containing a space, so a validly registered experiment worktree looked unregistered and
// the rerun aborted as "not a valid registered git worktree".
describe('spec-optimize worktree registration lookup', () => {
  test.each([['My Experiments'], ['plain']])(
    'recognizes its own registered worktree under a path segment %s',
    (dirName) => {
      const dir = initExperimentRepo(dirName);

      const first = runExperiment(dir, ['create', 'myspec', '1', 'main']);
      expect(first.ok).toBe(true);

      const second = runExperiment(dir, ['create', 'myspec', '1', 'main']);

      expect(second.stderr).not.toContain('not a valid registered git worktree');
      expect(second.stderr).toContain('Worktree already exists');
      expect(second.ok).toBe(true);
    },
  );
});

describe('spec-optimize contracts', () => {
  test('uses validation_rules as the full optimization spec validation source of truth', () => {
    const skill = read('skills/spec-optimize/SKILL.md');
    const schema = read('skills/spec-optimize/references/optimize-spec-schema.yaml');

    expect(schema).toContain('validation_rules:');
    expect(schema).toContain('If parallel.exclusive_resources is non-empty');
    expect(schema).toContain('If metric.judge.singleton_sample > 0');
    expect(schema).toContain('stopping must have at least one non-default criterion or use defaults');

    expect(skill).toMatch(/Validate the spec against \*\*every\*\* rule in the `validation_rules` section/);
    expect(skill).toContain('single source of truth');
    expect(skill).toContain('do not rely on a remembered subset');
    expect(skill).toContain('exclusive-resource serial execution');
    expect(skill).toContain('singleton-rubric requirements');
    expect(skill).toContain('stopping criteria');
  });

  test('preserves CE optimization-loop dispatch and wrap-up safeguards', () => {
    const skill = read('skills/spec-optimize/SKILL.md');
    const repoResearcher = read('skills/spec-optimize/references/agents/repo-research-analyst.md');
    const judgePrompt = read('skills/spec-optimize/references/judge-prompt-template.md');

    expect(skill).toContain('judge sub-agents using the same bounded scheduler as Phase 3.2');
    expect(skill).toContain('Otherwise evaluate the same batches serially inline');
    expect(skill).toContain('treat it as backpressure');
    expect(skill).toContain('Judge work is a separate budget from experiment worktrees in either path.');
    expect(skill).toContain('**Mechanical-apply bar:** apply any finding with a concrete `suggested_fix`');
    expect(skill).toContain('Do not commit or push from this step');
    expect(skill).toContain('spec-code-review');
    expect(skill).toContain('spec-compound');

    expect(repoResearcher).toContain('Return only findings that change the plan');
    expect(judgePrompt).toContain('High confidence (4-5) means you are very sure. Low confidence (1-2) means the item is borderline.');
    expect(judgePrompt).not.toContain('confidence-first');
  });

  test('只列出拥有真实 optimization artifact intake 的 downstream consumer', () => {
    const skill = read('skills/spec-optimize/SKILL.md');
    const consumers = skill.match(/### Downstream Consumers\n\n([\s\S]*?)(?=\n### |\n## )/);

    expect(consumers).not.toBeNull();
    expect(consumers[1]).not.toContain('`spec-work`');
    expect(consumers[1]).toContain('Code review');
  });
});
