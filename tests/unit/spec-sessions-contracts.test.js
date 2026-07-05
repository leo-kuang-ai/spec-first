'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ClaudeAdapter = require('../../src/cli/adapters/claude');
const CodexAdapter = require('../../src/cli/adapters/codex');
const SESSIONS_SKILL = path.join(__dirname, '..', '..', 'skills', 'spec-sessions', 'SKILL.md');
const COMPOUND_SKILL = path.join(__dirname, '..', '..', 'skills', 'spec-compound', 'SKILL.md');
const HISTORIAN_AGENT = path.join(__dirname, '..', '..', 'agents', 'spec-session-historian.agent.md');
const { buildFilteredAssetSet, planBundledAssetSync } = require('../../src/cli/plugin');

function plannedRuntimeContent(adapter, targetPath) {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-sessions-runtime-'));

  try {
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

describe('spec session history contracts', () => {
  test('usage uses current-host workflow entrypoint wording', () => {
    const text = fs.readFileSync(SESSIONS_SKILL, 'utf8');

    expect(text).toContain('current host\'s sessions entrypoint [question or topic]');
    expect(text).toContain('current host\'s sessions entrypoint');
    expect(text).not.toContain('# Claude Code');
    expect(text).not.toContain('/spec:sessions [question or topic]');
    expect(text).not.toContain('# Codex');
    expect(text).not.toContain('$spec-sessions [question or topic]');
  });

  test('pre-resolved branch avoids shell forms blocked by skill-load permissions', () => {
    const text = fs.readFileSync(SESSIONS_SKILL, 'utf8');
    const historian = fs.readFileSync(HISTORIAN_AGENT, 'utf8');

    expect(text).toContain('git rev-parse --abbrev-ref HEAD 2>/dev/null || true');
    expect(text).toContain('basename "$(git rev-parse --show-toplevel 2>/dev/null)"');
    expect(text).toContain('plain branch name');
    expect(text).not.toContain('git rev-parse --path-format=absolute --git-common-dir');
    expect(text).not.toContain('basename "$(dirname "$common")"');
    expect(text).not.toContain('case "$common" in /*)');
    expect(text).not.toContain('if [ "$common" = ".git" ]');

    expect(historian).toContain('The orchestrator (`spec-sessions`) handles discovery');
    expect(historian).toContain('Standalone fallback');
    expect(historian).not.toContain('git rev-parse --path-format=absolute --git-common-dir');
    expect(historian).not.toContain('Guard against empty output');
    expect(historian).not.toContain('case "$common" in /*)');
  });

  test('spec-sessions owns discovery, keyword ranking, scratch extraction, and synthesis dispatch', () => {
    const text = fs.readFileSync(SESSIONS_SKILL, 'utf8');

    expect(text).toContain('bash skills/spec-sessions/scripts/discover-sessions.sh <repo> <days>');
    expect(text).toContain('xargs -0 python3 skills/spec-sessions/scripts/extract-metadata.py --cwd-filter <repo>');
    expect(text).toContain('--keyword K1,K2,...');
    expect(text).toContain('match_count');
    expect(text).toContain('keyword_matches');
    expect(text).toContain('files_matched');
    expect(text).toContain('SCRATCH=$(mktemp -d -t spec-sessions-XXXXXX)');
    expect(text).toContain('python3 skills/spec-sessions/scripts/extract-skeleton.py --output');
    expect(text).toContain('python3 skills/spec-sessions/scripts/extract-errors.py --output');
    expect(text).toContain('Dispatch the `spec-session-historian` subagent');
    expect(text).toContain('scratch_dir');
    expect(text).toContain('sessions');
    expect(text).toContain('`.cursor/skills/**`');
    expect(text).toContain('`.cursor/agents/**`');
  });

  test('spec-sessions returns distilled replay refs instead of full history', () => {
    const text = fs.readFileSync(SESSIONS_SKILL, 'utf8');

    expect(text).toContain('Distilled Replay References');
    expect(text).toContain('Return distilled replay references, not full session replays.');
    expect(text).toContain('A useful replay ref names the prior session or scratch extract, the decision or failed attempt, the evidence path, and why it is relevant now.');
    expect(text).toContain('Include rejected or out-of-scope rationale when it explains current scope');
    expect(text).toContain('label it as prior rationale rather than workflow status');
    expect(text).toContain('Use checkpoint-style summaries first when the caller provides them');
    expect(text).toContain('Do not create a durable replay index or require every future workflow to read complete history.');
  });

  test('spec-sessions can use CONCEPTS.md only as advisory vocabulary context', () => {
    const text = fs.readFileSync(SESSIONS_SKILL, 'utf8');

    expect(text).toContain('Advisory Vocabulary Hook');
    expect(text).toContain('repo-root `CONCEPTS.md` exists');
    expect(text).toContain('current vocabulary context for term normalization');
    expect(text).toContain('align terminology in keywords, `problem_topic`, and final prose');
    expect(text).toContain('Do not treat `CONCEPTS.md` as session evidence');
    expect(text).toContain('do not use it to replace extracted session snippets');
    expect(text).toContain('do not let it override timestamped prior decisions or current source evidence');
    expect(text).toContain('must not create, update, require, or bootstrap `CONCEPTS.md`');
    expect(text).toContain('if it is absent, continue with session metadata and extracted scratch files only');
    expect(text).not.toContain('The current year is 2026');
    expect(text).not.toContain('ce-session-historian');
    expect(text).not.toContain('ce-sessions-XXXX');
  });

  test('runtime projection rewrites session helper scripts to bundled workflow paths', () => {
    for (const [adapter, targetPath, runtimeScriptRoot] of [
      [new ClaudeAdapter(), '.claude/spec-first/workflows/spec-sessions/SKILL.md', '.claude/spec-first/workflows/spec-sessions/scripts'],
      [new CodexAdapter(), '.agents/skills/spec-sessions/SKILL.md', '.agents/skills/spec-sessions/scripts'],
    ]) {
      const content = plannedRuntimeContent(adapter, targetPath);

      expect(content).toContain(`bash ${runtimeScriptRoot}/discover-sessions.sh <repo> <days>`);
      expect(content).toContain(`xargs -0 python3 ${runtimeScriptRoot}/extract-metadata.py --cwd-filter <repo>`);
      expect(content).toContain(`python3 ${runtimeScriptRoot}/extract-skeleton.py --output`);
      expect(content).toContain(`python3 ${runtimeScriptRoot}/extract-errors.py --output`);
      expect(content).not.toContain('bash scripts/discover-sessions.sh');
      expect(content).not.toContain('python3 scripts/extract-metadata.py');
      expect(content).not.toContain('python3 scripts/extract-skeleton.py');
      expect(content).not.toContain('python3 scripts/extract-errors.py');
    }
  });

  test('historian only synthesizes extracted scratch files and never invokes primitive skills', () => {
    const text = fs.readFileSync(HISTORIAN_AGENT, 'utf8');

    expect(text).toContain('Read only the paths the orchestrator gave you');
    expect(text).toContain('Never invoke the Skill tool');
    expect(text).toContain('Do not attempt to discover or extract sessions on your own');
    expect(text).toContain('no relevant prior sessions');
    expect(text).toContain('**`sessions`** — an array of objects (5 max)');
    expect(text).not.toContain('session-inventory');
    expect(text).not.toContain('session-extract');
  });

  test('spec-compound routes optional session enrichment through spec-sessions', () => {
    const text = fs.readFileSync(COMPOUND_SKILL, 'utf8');

    expect(text).toContain('invoke `spec-sessions`');
    expect(text).toContain('If the user opted into session history, invoke `spec-sessions` in foreground');
    expect(text).toContain('Problem topic');
    expect(text).toContain('Only surface findings directly relevant to this specific problem.');
    expect(text).not.toContain('Dispatch the Session Historian in Phase 1');
    expect(text).not.toContain('Dispatched as `spec-session-historian`');
    expect(text).not.toContain('Then dispatch `spec-session-historian` in foreground');
  });

  test('session primitive source directories are retired from runtime delivery', () => {
    const repoRoot = path.join(__dirname, '..', '..');

    expect(fs.existsSync(path.join(repoRoot, 'skills', 'spec-session-inventory'))).toBe(false);
    expect(fs.existsSync(path.join(repoRoot, 'skills', 'spec-session-extract'))).toBe(false);

    for (const platform of ['claude', 'codex']) {
      const assets = buildFilteredAssetSet(platform);

      expect(assets.internalSkills).toContain('git-worktree');
      expect(assets.internalSkills).not.toContain('spec-session-extract');
      expect(assets.internalSkills).not.toContain('spec-session-inventory');
      expect(assets.skills).not.toContain('spec-session-extract');
      expect(assets.skills).not.toContain('spec-session-inventory');
    }
  });
});

describe('spec-sessions Windows degraded mode contract', () => {
  test('SKILL documents Windows degraded mode for the bash discovery pipeline', () => {
    const text = fs.readFileSync(SESSIONS_SKILL, 'utf8');
    expect(text).toContain('**Windows degraded mode:**');
    expect(text).toMatch(/Git Bash.*WSL|WSL.*Git Bash/);
  });
});
