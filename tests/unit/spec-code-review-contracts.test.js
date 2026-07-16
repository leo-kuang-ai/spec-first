'use strict';

const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '../..');
const skill = fs.readFileSync(path.join(repoRoot, 'skills/spec-code-review/SKILL.md'), 'utf8');
const deploymentPrompt = fs.readFileSync(
  path.join(repoRoot, 'skills/spec-code-review/references/personas/deployment-verification-agent.md'),
  'utf8',
);
const subagentTemplate = fs.readFileSync(
  path.join(repoRoot, 'skills/spec-code-review/references/subagent-template.md'),
  'utf8',
);
const outputTemplate = fs.readFileSync(
  path.join(repoRoot, 'skills/spec-code-review/references/review-output-template.md'),
  'utf8',
);
const crossModel = fs.readFileSync(
  path.join(repoRoot, 'skills/spec-code-review/references/cross-model-review.md'),
  'utf8',
);
const crossModelScript = fs.readFileSync(
  path.join(repoRoot, 'skills/spec-code-review/scripts/cross-model-adversarial-review.sh'),
  'utf8',
);

describe('spec-code-review current contracts', () => {
  test('mode:agent is JSON report-only and never applies fixes', () => {
    expect(skill).toContain('**Report-only**: return **JSON**');
    expect(skill).toContain('In **`mode:agent`** it never mutates the tree');
    expect(skill).toContain('### Stage 5c: Act on findings (explicit apply only)');
    expect(skill).toContain('**Skip entirely in `mode:agent`, `mutation_policy: report-only`');
  });

  test('ordinary review is report-only and explicit apply/commit authorization stays separate', () => {
    expect(skill).toContain('mutation_policy: report-only');
    expect(skill).toContain('mutation_policy: apply-fixes');
    expect(skill).toMatch(/ordinary.*review.*report-only/is);
    expect(skill).toMatch(/explicit.*review-and-fix|review and fix/is);
    expect(skill).toContain('commit_authorization');
    expect(skill).toMatch(/apply-fixes.*does not authorize.*commit/is);
    expect(skill).toMatch(/without commit authorization.*verified uncommitted/is);
  });

  test('reviewer dispatch requires authorization and otherwise reports inline degraded coverage', () => {
    expect(skill).toContain('review_dispatch_authorization');
    expect(skill).toContain('dispatch_authorization_missing');
    expect(skill).toContain('subagent_capability_missing');
    expect(skill).toMatch(/permission settings.*not.*dispatch authorization/is);
    expect(skill).toMatch(/inline report-only.*status: degraded/is);
    expect(skill).toMatch(/do not claim.*persona.*independent.*cross-model/is);
    expect(skill).toContain('Inline fallback output contract');
    expect(skill).toContain('`reviewers: ["inline-fallback"]`');
    expect(skill).toContain('`verdict: Not ready`');
    expect(skill).toMatch(/resolve the Stage 4 Run ID.*before synthesis/is);
  });

  test('high-risk scenario posture limits review claims before dispatch or apply', () => {
    expect(skill).toContain('## Scenario Capability');
    expect(skill).toContain('Overrides: high-risk');
    expect(skill).toContain('`foreign-residual-workspace` -> `blocked-action-required`');
    expect(skill).toContain('optional external-tool evidence unavailable -> `fallback-only`');
    expect(skill).toContain('`non-git-build-workspace` coverage gaps -> `partial`');
  });

  test('deployment verification requires executable evidence per item', () => {
    expect(deploymentPrompt).toContain(
      'Every checklist item must name the command or observable signal that proves the step succeeded.',
    );
  });

  test('prompt assets are skill-local', () => {
    expect(skill).toContain('Read the prompt file from `references/personas/`');
    expect(fs.existsSync(path.join(repoRoot, 'agents/spec-pr-comment-resolver.agent.md'))).toBe(false);
  });

  test('task review context is paired, digest-pinned, and honestly scoped', () => {
    expect(skill).toContain('`task-pack:<path>`');
    expect(skill).toContain('`task:<task_id>`');
    expect(skill).toContain('`task-context:<path>`');
    expect(skill).toContain('spec-code-review-task-context/v1');
    expect(skill).toContain('task_pack_digest');
    expect(skill).toContain('exact-file');
    expect(skill).toContain('cumulative-file');
    expect(skill).toContain('task_diff_isolation');
    expect(skill).toContain('required_gate_eligible');
    expect(skill).toContain('task-pack and task tokens must appear together');
    expect(skill).toContain('unknown task_id');
  });

  test('task mode keeps task-owned untracked files and rejects unattributed scope', () => {
    expect(skill).toContain('task_owned_untracked_files');
    expect(skill).toContain('pre_task_untracked_files');
    expect(skill).toContain('full-addition patch');
    expect(skill).toContain('task-scope-expansion');
    expect(skill).toContain('task-scope-unattributed');
  });

  test('review artifacts use one concrete portable path returned to every consumer', () => {
    for (const source of [skill, subagentTemplate, outputTemplate, crossModel]) {
      expect(source).toContain('REVIEW_ARTIFACT_DIR');
      expect(source).toContain('artifact_path');
      expect(source).not.toContain('/tmp/spec-first/spec-code-review');
    }

    expect(skill).toContain('os.tmpdir()');
    expect(skill).toContain('%TEMP%');
    expect(skill).toContain('$TMPDIR');
    expect(crossModelScript).toContain('<run-dir>');
    expect(crossModelScript).toContain('RUN_DIR=');
    expect(crossModelScript).not.toContain('/tmp/spec-first/spec-code-review');
  });

  test('mode:agent coverage exposes task scope and artifact write limitations', () => {
    expect(skill).toContain('"task_scope"');
    expect(skill).toContain('"artifact_write_status"');
    expect(skill).toContain('"artifact_path": "<absolute path or null>"');
    expect(skill).toContain('dispatch_authorization_missing');
  });
});
