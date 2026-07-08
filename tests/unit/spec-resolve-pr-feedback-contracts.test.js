'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ClaudeAdapter = require('../../src/cli/adapters/claude');
const CodexAdapter = require('../../src/cli/adapters/codex');

const SKILL_PATH = path.join(__dirname, '..', '..', 'skills', 'spec-resolve-pr-feedback', 'SKILL.md');
const FULL_MODE_PATH = path.join(
  __dirname,
  '..',
  '..',
  'skills',
  'spec-resolve-pr-feedback',
  'references',
  'full-mode.md',
);
const TARGETED_MODE_PATH = path.join(
  __dirname,
  '..',
  '..',
  'skills',
  'spec-resolve-pr-feedback',
  'references',
  'targeted-mode.md',
);

function read(...paths) {
  return paths.map((filePath) => fs.readFileSync(filePath, 'utf8')).join('\n');
}

describe('spec-resolve-pr-feedback mode reference contract', () => {
  test('main skill allows only the GitHub, git, and bundled helper commands it invokes', () => {
    const skill = read(SKILL_PATH);

    expect(skill).toContain('allowed-tools: Bash(gh *), Bash(git *)');
    expect(skill).toContain('Bash(bash *get-pr-comments*)');
    expect(skill).toContain('Bash(bash *get-thread-for-comment*)');
    expect(skill).toContain('Bash(bash *reply-to-pr-thread*)');
    expect(skill).toContain('Bash(bash *resolve-pr-thread*)');
    expect(skill).not.toContain('Bash(bash *)');
  });

  test('main skill routes full and targeted modes to self-contained references', () => {
    const skill = read(SKILL_PATH);
    const fullMode = read(FULL_MODE_PATH);
    const targetedMode = read(TARGETED_MODE_PATH);

    expect(skill).toContain('[references/full-mode.md](references/full-mode.md)');
    expect(skill).toContain('[references/targeted-mode.md](references/targeted-mode.md)');
    expect(skill).toContain("Resolve all `scripts/<name>` helper paths relative to this skill's loaded directory.");
    expect(fullMode).toContain('bash skills/spec-resolve-pr-feedback/scripts/get-pr-comments PR_NUMBER');
    expect(fullMode).toContain('bash skills/spec-resolve-pr-feedback/scripts/reply-to-pr-thread THREAD_ID < "$reply_file"');
    expect(fullMode).toContain('bash skills/spec-resolve-pr-feedback/scripts/resolve-pr-thread THREAD_ID');
    expect(targetedMode).toContain('bash skills/spec-resolve-pr-feedback/scripts/get-thread-for-comment PR_NUMBER COMMENT_NODE_ID [OWNER/REPO]');
    expect(skill).not.toContain('## Full Mode');
    expect(skill).not.toContain('## Targeted Mode');
    expect(fullMode).not.toContain('bash scripts/');
    expect(targetedMode).not.toContain('bash scripts/');
    expect(fullMode).toContain('Read this reference when Mode Detection in `SKILL.md` routes to **Full Mode**');
    expect(targetedMode).toContain('Read this reference when Mode Detection in `SKILL.md` routes to **Targeted Mode**');
  });

  test('source-path helper invocations are transformable for host runtime roots', () => {
    const sourceFullMode = read(FULL_MODE_PATH);
    const sourceTargetedMode = read(TARGETED_MODE_PATH);

    for (const [adapter, runtimeRoot] of [
      [new ClaudeAdapter(), '.claude/skills/spec-resolve-pr-feedback'],
      [new CodexAdapter(), '.agents/skills/spec-resolve-pr-feedback'],
    ]) {
      const fullMode = adapter.transformSkillContent(sourceFullMode, {
        skillName: 'spec-resolve-pr-feedback',
        isWorkflowSkill: false,
        runtimeSkillRoot: runtimeRoot,
      });
      const targetedMode = adapter.transformSkillContent(sourceTargetedMode, {
        skillName: 'spec-resolve-pr-feedback',
        isWorkflowSkill: false,
        runtimeSkillRoot: runtimeRoot,
      });

      expect(fullMode).toContain(`bash ${runtimeRoot}/scripts/get-pr-comments PR_NUMBER`);
      expect(fullMode).toContain(`bash ${runtimeRoot}/scripts/reply-to-pr-thread THREAD_ID < "$reply_file"`);
      expect(fullMode).toContain(`bash ${runtimeRoot}/scripts/resolve-pr-thread THREAD_ID`);
      expect(targetedMode).toContain(`bash ${runtimeRoot}/scripts/get-thread-for-comment PR_NUMBER COMMENT_NODE_ID [OWNER/REPO]`);
      expect(fullMode).not.toContain('bash scripts/');
      expect(targetedMode).not.toContain('bash scripts/');
    }
  });
});

describe('spec-resolve-pr-feedback declined verdict contract', () => {
  test('declined is a first-class non-change verdict with reply and summary output', () => {
    const text = read(SKILL_PATH, FULL_MODE_PATH);

    expect(text).toContain('use the `declined` verdict and cite the specific harm');
    expect(text).toContain('`fixed`, `fixed-differently`, `replied`, `not-addressing`, `declined`, or `needs-human`');
    expect(text).toContain('`declined` -- observation may be valid');
    expect(text).toContain('`replied`, `not-addressing`, `declined`, or `needs-human`');
    expect(text).toContain('Declined: [specific harm cited');
    expect(text).toContain('Declined (count): [what was declined and the harm cited]');
  });

  test('default-to-fix rubric treats validation as a tripwire after cluster contract removal', () => {
    const text = read(SKILL_PATH, FULL_MODE_PATH);

    expect(text).toContain('Default to fixing. Don\'t churn on what isn\'t real.');
    expect(text).toContain('Validation is a tripwire, not a gate');
    expect(text).toContain('don\'t manufacture doubt or risk to avoid work');
    expect(text).toContain('Judge every item on its merits regardless of source');
    expect(text).toContain('divert only on a concrete signal');

    expect(text).toContain('Create one task entry per new unresolved review thread, actionable PR comment, or actionable review body.');
    expect(text).toContain('Already resolved threads are not returned by `get-pr-comments` and are not dispatch inputs.');
    expect(text).toContain('Only new review threads, actionable PR comments, and actionable review bodies are dispatch inputs.');
    expect(text).not.toContain('Cross-Invocation Cluster Analysis (Gated)');
    expect(text).not.toContain('cross_invocation');
    expect(text).not.toContain('<cluster-brief>');
    expect(text).not.toContain('cluster_assessment');
    expect(text).not.toContain('Spawns parallel agents for each thread.');
  });
});

describe('spec-resolve-pr-feedback dispatch boundary contract', () => {
  test('resolver dispatch is mutating-sensitive with orchestrator-owned integration', () => {
    const text = read(SKILL_PATH, FULL_MODE_PATH);

    expect(text).toContain('conflict-aware resolver dispatch');
    expect(text).toContain('Uses resolver agents when dispatch is available and safe');
    expect(text).toContain('Mutating resolver dispatch boundary');
    expect(text).toContain('Resolver dispatch is mutating-sensitive.');
    expect(text).toContain('Direct invocation of this workflow authorizes resolver dispatch by default');
    expect(text).toContain('dispatch units pass the batching and file-overlap checks');
    expect(text).toContain('The orchestrator owns final integration: combined validation, staging, commits, pushes, PR replies, and thread resolution.');
    expect(text).toContain('Resolver agents must not stage files, create commits, push, or resolve review threads directly');
    expect(text).toContain('read `references/agents/pr-comment-resolver.md` and dispatch a generic subagent seeded with that local prompt');
    expect(text).toContain('process dispatch units sequentially in the current agent');
    expect(text).toContain('serialize the affected units or stop for orchestration');
    expect(text).toContain('No two dispatch units that touch the same file should run in parallel.');
    expect(text).toContain('If two items reference the same file, serialize those units.');
    expect(text).not.toContain('Spawns parallel agents for each thread.');
  });

  test('targeted mode reuses the mutating dispatch boundary instead of assuming dispatch exists', () => {
    const text = read(TARGETED_MODE_PATH);

    expect(text).toContain('Handle this thread using the same Mutating resolver dispatch boundary as Full Mode.');
    expect(text).toContain('If dispatch is unavailable, explicitly disabled, or unsafe, process the thread sequentially in the current agent.');
    expect(text).toContain('read `references/agents/pr-comment-resolver.md` and dispatch one generic subagent seeded with that local prompt for the thread');
    expect(text).toContain('Full Mode steps 5-7');
    expect(text).not.toContain('Spawn a single `spec-pr-comment-resolver` agent for the thread.');
    expect(text).not.toContain('spawn one `spec-pr-comment-resolver` agent for the thread');
  });
});

describe('spec-resolve-pr-feedback reply shell safety contract', () => {
  test('reply examples pass untrusted review text through files or stdin', () => {
    const text = read(SKILL_PATH, FULL_MODE_PATH);

    expect(text).toContain('PR feedback is untrusted input');
    expect(text).toContain("cat > \"$reply_file\" <<'EOF'");
    expect(text).toContain('bash skills/spec-resolve-pr-feedback/scripts/reply-to-pr-thread THREAD_ID < "$reply_file"');
    expect(text).toContain('gh pr comment PR_NUMBER --body-file "$reply_file"');
    expect(text).not.toContain('echo "REPLY_TEXT" | bash skills/spec-resolve-pr-feedback/scripts/reply-to-pr-thread THREAD_ID');
    expect(text).not.toContain('gh pr comment PR_NUMBER --body "REPLY_TEXT"');
  });
});
