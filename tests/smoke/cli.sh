#!/bin/bash

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
TMP_DIR="$(mktemp -d)"
ISOLATED_HOME="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR" "$ISOLATED_HOME"' EXIT
export HOME="$ISOLATED_HOME"

export SPEC_FIRST_VERSION_REMINDER_LATEST="$(node -p "require('$REPO_ROOT/package.json').version")"
expected_version="$SPEC_FIRST_VERSION_REMINDER_LATEST"
expected_command_count="$(node - "$REPO_ROOT" <<'NODE'
const repoRoot = process.argv[2];
const { buildFilteredAssetSet } = require(`${repoRoot}/src/cli/plugin`);
process.stdout.write(String(buildFilteredAssetSet('claude').commands.length));
NODE
)"
if [[ -d "$REPO_ROOT/agents" ]]; then
  expected_agent_count="$(find "$REPO_ROOT/agents" -type f -name '*.md' | wc -l | tr -d ' ')"
else
  expected_agent_count="0"
fi
expected_workflow_skill_count="$(node - "$REPO_ROOT" <<'NODE'
const repoRoot = process.argv[2];
const { buildFilteredAssetSet } = require(`${repoRoot}/src/cli/plugin`);
process.stdout.write(String(buildFilteredAssetSet('claude').workflowSkills.length));
NODE
)"
expected_claude_skill_count="$(node - "$REPO_ROOT" <<'NODE'
const repoRoot = process.argv[2];
const { buildFilteredAssetSet } = require(`${repoRoot}/src/cli/plugin`);
const claude = buildFilteredAssetSet('claude');
process.stdout.write(String(claude.skills.length + claude.internalSkills.length));
NODE
)"
expected_codex_total_skill_count="$(node - "$REPO_ROOT" <<'NODE'
const repoRoot = process.argv[2];
const { buildFilteredAssetSet } = require(`${repoRoot}/src/cli/plugin`);
const codex = buildFilteredAssetSet('codex');
process.stdout.write(String(codex.skills.length + codex.workflowSkills.length + codex.internalSkills.length));
NODE
)"
expected_kiro_total_skill_count="$(node - "$REPO_ROOT" <<'NODE'
const repoRoot = process.argv[2];
const { buildFilteredAssetSet } = require(`${repoRoot}/src/cli/plugin`);
const kiro = buildFilteredAssetSet('kiro');
process.stdout.write(String(kiro.skills.length + kiro.workflowSkills.length + kiro.internalSkills.length));
NODE
)"
expected_kiro_skill_count="$(node - "$REPO_ROOT" <<'NODE'
const repoRoot = process.argv[2];
const { buildFilteredAssetSet } = require(`${repoRoot}/src/cli/plugin`);
const kiro = buildFilteredAssetSet('kiro');
process.stdout.write(String(kiro.skills.length + kiro.internalSkills.length));
NODE
)"
expected_qoder_command_count="$(node - "$REPO_ROOT" <<'NODE'
const repoRoot = process.argv[2];
const { buildFilteredAssetSet } = require(`${repoRoot}/src/cli/plugin`);
process.stdout.write(String(buildFilteredAssetSet('qoder').commands.length));
NODE
)"
expected_qoder_total_skill_count="$(node - "$REPO_ROOT" <<'NODE'
const repoRoot = process.argv[2];
const { buildFilteredAssetSet } = require(`${repoRoot}/src/cli/plugin`);
const qoder = buildFilteredAssetSet('qoder');
process.stdout.write(String(qoder.skills.length + qoder.workflowSkills.length + qoder.internalSkills.length));
NODE
)"
expected_qoder_skill_count="$(node - "$REPO_ROOT" <<'NODE'
const repoRoot = process.argv[2];
const { buildFilteredAssetSet } = require(`${repoRoot}/src/cli/plugin`);
const qoder = buildFilteredAssetSet('qoder');
process.stdout.write(String(qoder.skills.length + qoder.internalSkills.length));
NODE
)"
expected_qoder_workflow_skill_count="$(node - "$REPO_ROOT" <<'NODE'
const repoRoot = process.argv[2];
const { buildFilteredAssetSet } = require(`${repoRoot}/src/cli/plugin`);
process.stdout.write(String(buildFilteredAssetSet('qoder').workflowSkills.length));
NODE
)"
expected_cursor_total_skill_count="$(node - "$REPO_ROOT" <<'NODE'
const repoRoot = process.argv[2];
const { buildFilteredAssetSet } = require(`${repoRoot}/src/cli/plugin`);
const cursor = buildFilteredAssetSet('cursor');
process.stdout.write(String(cursor.skills.length + cursor.workflowSkills.length + cursor.internalSkills.length));
NODE
)"
expected_cursor_skill_count="$(node - "$REPO_ROOT" <<'NODE'
const repoRoot = process.argv[2];
const { buildFilteredAssetSet } = require(`${repoRoot}/src/cli/plugin`);
const cursor = buildFilteredAssetSet('cursor');
process.stdout.write(String(cursor.skills.length + cursor.internalSkills.length));
NODE
)"

run_programmatic_init() {
  local project_root="$1"
  local platform="$2"
  local name="$3"
  local lang="$4"
  local mode="${5:-apply}"
  node - "$REPO_ROOT" "$project_root" "$platform" "$name" "$lang" "$mode" <<'NODE'
const repoRoot = process.argv[2];
const projectRoot = process.argv[3];
const platform = process.argv[4];
const name = process.argv[5];
const lang = process.argv[6];
const dryRun = process.argv[7] === 'dry-run';
const { applyInitPlan, buildInitPlan } = require(`${repoRoot}/src/cli/init-plan`);
const { printInitApplySuccess, printInitDryRun } = require(`${repoRoot}/src/cli/commands/init`);

const plan = buildInitPlan({
  projectRoot,
  workspaceRoot: projectRoot,
  platform,
  name,
  lang,
  target: { mode: 'single-repo', projectRoot },
  dryRun,
  gitRootTopology: 'single-repo',
});

if (Array.isArray(plan.errors) && plan.errors.length > 0) {
  for (const error of plan.errors) {
    console.error(error.message || String(error));
  }
  process.exit(1);
}

if (dryRun) {
  printInitDryRun({
    platform: plan.platform,
    plan: plan.operationPlan,
    untrackDiagnostic: plan.untrackDiagnostic,
    legacyStateDetected: plan.legacyStateDetected,
    destructiveResetReason: plan.destructiveResetReason,
  });
  process.exit(0);
}

const result = applyInitPlan(projectRoot, plan);
printInitApplySuccess(plan, result);
process.exit(result.exit_code);
NODE
}

echo "=== CLI smoke test ==="

echo "1. Check help and version output..."
help_output="$(node "$REPO_ROOT/bin/spec-first.js" --help)"
version_output="$(node "$REPO_ROOT/bin/spec-first.js" --version)"
grep -q "doctor" <<<"$help_output"
grep -q "init" <<<"$help_output"
grep -q "Interactively install workflows" <<<"$help_output"
grep -q "clean (--claude|--codex|--cursor|--kiro|--qoder)" <<<"$help_output"
grep -q "repair-worktree" <<<"$help_output"
grep -q "tasks <subcommand>" <<<"$help_output"
if grep -q "stage0-context" <<<"$help_output"; then
  echo "help output should not advertise stage0-context" >&2
  exit 1
fi
grep -q "Spec-First v${expected_version}" <<<"$version_output"
grep -q "Claude Code, Codex, Kiro, Qoder, and Cursor generated-runtime preview" <<<"$version_output"
unknown_output="$(node "$REPO_ROOT/bin/spec-first.js" unknown-command 2>&1 || true)"
if ! grep -Eiq "unknown command|usage" <<<"$unknown_output"; then
  echo "unknown command should use normal usage path" >&2
  exit 1
fi
echo "✓ help/version output is present"

echo "2. Check doctor output in a fresh project..."
doctor_fresh_output="$(cd "$TMP_DIR" && node "$REPO_ROOT/bin/spec-first.js" doctor)"
grep -q "No spec-first platform detected in this project." <<<"$doctor_fresh_output"
grep -q 'spec-first init' <<<"$doctor_fresh_output"
grep -q 'select Claude Code, Codex, Cursor, Kiro, and/or Qoder' <<<"$doctor_fresh_output"
doctor_fresh_json="$(cd "$TMP_DIR" && node "$REPO_ROOT/bin/spec-first.js" doctor --json)"
node - "$doctor_fresh_json" <<'NODE'
const payload = JSON.parse(process.argv[2]);
if (payload.workflow_runnability !== 'not_verified') throw new Error('fresh doctor runnability mismatch');
if (payload.runtime_asset_health !== 'not_applicable') throw new Error('fresh doctor asset health mismatch');
NODE
echo "✓ doctor reports fresh-project state"

echo "3. Check interactive init rejects non-TTY unless -y and rejects unsupported flags..."
init_stdout="$TMP_DIR/init-non-tty.stdout"
init_stderr="$TMP_DIR/init-non-tty.stderr"
init_status=0
(cd "$TMP_DIR" && node "$REPO_ROOT/bin/spec-first.js" init >"$init_stdout" 2>"$init_stderr") || init_status=$?
if [ "$init_status" -eq 0 ]; then
  echo "init should fail in non-TTY smoke context" >&2
  exit 1
fi
test "$init_status" = "2"
grep -q "requires an interactive terminal" "$init_stderr"
init_status=0
(cd "$TMP_DIR" && node "$REPO_ROOT/bin/spec-first.js" init --bogus >"$init_stdout" 2>"$init_stderr") || init_status=$?
if [ "$init_status" -eq 0 ]; then
  echo "init should reject unsupported flags" >&2
  exit 1
fi
test "$init_status" = "2"
grep -q "unknown option --bogus" "$init_stderr"
yes_dir="$TMP_DIR/init-yes"
mkdir -p "$yes_dir"
(cd "$yes_dir" && node "$REPO_ROOT/bin/spec-first.js" init --codex -y -u smoke --lang zh >"$init_stdout" 2>"$init_stderr")
test -f "$yes_dir/AGENTS.md"
test -f "$ISOLATED_HOME/.spec-first/.developer"
test ! -f "$yes_dir/.codex/spec-first/.developer"
test ! -f "$yes_dir/.claude/spec-first/.developer"
test ! -f "$yes_dir/CLAUDE.md"
echo "✓ init rejects non-TTY without -y, rejects unsupported flags, and supports explicit -y"

echo "4. Check programmatic init preview changes without writing files..."
dry_dir="$TMP_DIR/dry-init"
mkdir -p "$dry_dir/.claude/commands"
git -C "$dry_dir" init -q >/dev/null
printf 'custom command\n' > "$dry_dir/.claude/commands/spec-custom.md"
dry_output="$(run_programmatic_init "$dry_dir" claude kuang en dry-run)"
grep -q "Dry run: spec-first init (claude)" <<<"$dry_output"
grep -q "Would prune 1 unmanaged command file(s)" <<<"$dry_output"
grep -q "No managed runtime paths require untracking." <<<"$dry_output"
grep -q ".gitignore" <<<"$dry_output"
grep -q "No files were changed." <<<"$dry_output"
test -e "$dry_dir/.claude/commands/spec-custom.md"
test ! -e "$dry_dir/.claude/spec-first/state.json"
test ! -e "$dry_dir/.gitignore"
echo "✓ programmatic init preview changes without writing files"

echo "5. Initialize Claude runtime in a fresh project..."
claude_output="$(run_programmatic_init "$TMP_DIR" claude kuang en)"
grep -q "Generated ${expected_command_count} command file(s)" <<<"$claude_output"
grep -q "Generated ${expected_claude_skill_count} skill directory(ies)" <<<"$claude_output"
grep -q "Generated ${expected_agent_count} agent file(s)" <<<"$claude_output"
for file in app-consistency-audit.md brainstorm.md code-review.md compound.md compound-refresh.md debug.md doc-review.md ideate.md mcp-setup.md optimize.md plan.md polish.md prd.md skill-audit.md work.md write-skill.md write-tasks.md; do
  test -f "$TMP_DIR/.claude/commands/spec-$file"
done
test ! -e "$TMP_DIR/.claude/commands/spec-standards.md"
test -f "$TMP_DIR/.claude/spec-first/workflows/spec-mcp-setup/scripts/check-health"
grep -q 'bash .claude/spec-first/workflows/spec-mcp-setup/scripts/check-health' "$TMP_DIR/.claude/commands/spec-mcp-setup.md"
if grep -q 'bash skills/spec-mcp-setup/scripts/check-health' "$TMP_DIR/.claude/commands/spec-mcp-setup.md"; then
  echo "Claude mcp-setup command should not reference source-only skill script paths" >&2
  exit 1
fi
installed_claude_skill_count="$(find "$TMP_DIR/.claude/skills" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | wc -l | tr -d ' ')"
test "$installed_claude_skill_count" = "$expected_claude_skill_count"
test -f "$TMP_DIR/.claude/skills/using-spec-first/SKILL.md"
grep -q '^name: using-spec-first$' "$TMP_DIR/.claude/skills/using-spec-first/SKILL.md"
test -f "$TMP_DIR/.claude/skills/spec-worktree/SKILL.md"
test -f "$TMP_DIR/.claude/skills/spec-worktree/scripts/worktree-manager.sh"
grep -q '^name: spec-worktree$' "$TMP_DIR/.claude/skills/spec-worktree/SKILL.md"
grep -q '^user-invocable: false$' "$TMP_DIR/.claude/skills/spec-worktree/SKILL.md"
grep -q 'allowed-tools: Bash(bash \*worktree-manager.sh\*)' "$TMP_DIR/.claude/skills/spec-worktree/SKILL.md"
grep -q '.claude/skills/spec-worktree/scripts/worktree-manager.sh' "$TMP_DIR/.claude/skills/spec-worktree/SKILL.md"
test ! -e "$TMP_DIR/.claude/skills/spec-session-inventory"
test ! -e "$TMP_DIR/.claude/skills/spec-session-extract"
if [[ "$expected_agent_count" != "0" ]]; then
  for agent in spec-repo-research-analyst.agent.md spec-spec-flow-analyzer.agent.md; do
    test -f "$TMP_DIR/.claude/agents/$agent"
  done
fi
node - "$TMP_DIR/.claude/spec-first/state.json" "$expected_command_count" "$expected_claude_skill_count" "$expected_workflow_skill_count" "$expected_agent_count" <<'NODE'
const fs = require('node:fs');
const [statePath, commandCount, skillCount, workflowSkillCount, agentCount] = process.argv.slice(2);
const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
if (state.commands.length !== Number(commandCount)) throw new Error('command count mismatch');
if (state.skills.length !== Number(skillCount)) throw new Error('skill count mismatch');
if (state.workflowSkills.length !== Number(workflowSkillCount)) throw new Error('workflow skill count mismatch');
if (!state.workflowSkills.includes('spec-mcp-setup')) throw new Error('missing Claude mcp-setup workflow support asset');
if (state.agents.length !== Number(agentCount)) throw new Error('agent count mismatch');
if (state.developer) throw new Error('state should no longer track developer profile');
NODE
grep -q '<!-- spec-first:lang:start -->' "$TMP_DIR/CLAUDE.md"
grep -q '### Workflow Entry Governance' "$TMP_DIR/CLAUDE.md"
grep -q 'skills/using-spec-first/SKILL.md' "$TMP_DIR/CLAUDE.md"
if grep -q '<!-- spec-first:bootstrap:start -->' "$TMP_DIR/CLAUDE.md"; then
  echo "legacy standalone bootstrap block should not be injected into CLAUDE.md" >&2
  exit 1
fi
if grep -q '<!-- spec-first:coding-guidelines:start -->' "$TMP_DIR/CLAUDE.md"; then
  echo "retired coding-guidelines block should not be injected into CLAUDE.md" >&2
  exit 1
fi
test -f "$TMP_DIR/.claude/hooks/session-start"
grep -q 'startup-reminder' "$TMP_DIR/.claude/hooks/session-start"
grep -q -- '--claude' "$TMP_DIR/.claude/hooks/session-start"
test -f "$TMP_DIR/.claude/hooks/spec-plan-guard"
grep -q 'UserPromptExpansion' "$TMP_DIR/.claude/hooks/spec-plan-guard"
grep -q 'planning-only attention guard' "$TMP_DIR/.claude/hooks/spec-plan-guard"
node - "$TMP_DIR/.claude/settings.json" <<'NODE'
const fs = require('node:fs');
const settingsPath = process.argv[2];
const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
const matchers = settings.hooks?.UserPromptExpansion;
if (!Array.isArray(matchers)) throw new Error('missing UserPromptExpansion hook matchers');
const matcher = matchers.find((entry) => entry.matcher === 'spec-plan');
if (!matcher) throw new Error('missing spec-plan UserPromptExpansion matcher');
// Exec form: command is the node interpreter; the managed hook path lives in args so the
// hook runs cross-platform (Windows without Git Bash included) with no shell.
const hook = matcher.hooks?.find((entry) => entry.type === 'command');
const command = hook?.command || '';
const args = Array.isArray(hook?.args) ? hook.args : [];
if (command !== 'node' || !args.some((arg) => typeof arg === 'string' && arg.includes('.claude/hooks/spec-plan-guard'))) {
  throw new Error('spec-plan guard matcher does not invoke managed hook');
}
NODE
test -f "$TMP_DIR/.gitignore"
grep -q '# spec-first:start' "$TMP_DIR/.gitignore"
grep -q '.claude/commands/spec-\*.md' "$TMP_DIR/.gitignore"
grep -q '.codex/' "$TMP_DIR/.gitignore"
if grep -q ".spec-first/"standards"/" "$TMP_DIR/.gitignore"; then
  echo "init gitignore should not preserve retired standards artifact root" >&2
  exit 1
fi
if grep -qxF '.spec-first/' "$TMP_DIR/.gitignore" || grep -qxF '.agents/' "$TMP_DIR/.gitignore"; then
  echo "init gitignore should not hide broad source/runtime roots" >&2
  exit 1
fi
echo "✓ Claude init generated commands, skills, agents, hooks, and state"

echo "6. Run doctor after Claude initialization..."
doctor_output="$(cd "$TMP_DIR" && node "$REPO_ROOT/bin/spec-first.js" doctor --claude)"
grep -q ".claude/spec-first/state.json" <<<"$doctor_output"
grep -q ".claude/commands" <<<"$doctor_output"
grep -q ".claude/skills" <<<"$doctor_output"
grep -q ".claude/agents" <<<"$doctor_output"
doctor_json="$(cd "$TMP_DIR" && node "$REPO_ROOT/bin/spec-first.js" doctor --claude --json)"
node - "$doctor_json" <<'NODE'
const payload = JSON.parse(process.argv[2]);
if (!['simulated', 'verified', 'not_verified'].includes(payload.workflow_runnability)) {
  throw new Error(`unexpected runnability ${payload.workflow_runnability}`);
}
if (!['pass', 'warn', 'error'].includes(payload.runtime_asset_health)) {
  throw new Error(`unexpected asset health ${payload.runtime_asset_health}`);
}
if (!payload.platform_checks?.claude?.length) throw new Error('missing claude checks');
const checks = payload.platform_checks.claude;
function requireCheck(name, messageFragment) {
  const check = checks.find((entry) => entry.name === name && entry.message.includes(messageFragment));
  if (!check) throw new Error(`missing claude check ${name}: ${messageFragment}`);
  if (check.level !== 'PASS') throw new Error(`expected ${name} to pass, got ${check.level}`);
}
requireCheck('.claude/hooks/spec-plan-guard', 'managed UserPromptExpansion spec-plan guard hook present');
requireCheck('.claude/settings.json UserPromptExpansion spec-plan guard', 'managed UserPromptExpansion spec-plan guard matcher present');
NODE
echo "✓ doctor reports Claude runtime facts"

echo "7. Initialize Codex runtime and verify assets..."
codex_output="$(run_programmatic_init "$TMP_DIR" codex kuang en)"
grep -q "Generated ${expected_agent_count} agent file(s) in .codex/agents" <<<"$codex_output"
grep -q "Generated ${expected_codex_total_skill_count} skill directory(ies) in .agents/skills" <<<"$codex_output"
installed_codex_skill_count="$(find "$TMP_DIR/.agents/skills" -mindepth 1 -maxdepth 1 -type d | wc -l | tr -d ' ')"
test "$installed_codex_skill_count" = "$expected_codex_total_skill_count"
for skill in spec-plan spec-work spec-code-review spec-doc-review spec-brainstorm spec-mcp-setup spec-compound-refresh; do
  test -f "$TMP_DIR/.agents/skills/$skill/SKILL.md"
done
test ! -e "$TMP_DIR/.agents/skills/spec-"standards"/SKILL.md"
test ! -e "$TMP_DIR/.agents/skills/spec-work-beta/SKILL.md"
test -f "$TMP_DIR/.agents/skills/using-spec-first/SKILL.md"
grep -q '^name: using-spec-first$' "$TMP_DIR/.agents/skills/using-spec-first/SKILL.md"
grep -q '^name: spec-polish$' "$TMP_DIR/.agents/skills/spec-polish/SKILL.md"
test -f "$TMP_DIR/.agents/skills/spec-worktree/SKILL.md"
test -f "$TMP_DIR/.agents/skills/spec-worktree/scripts/worktree-manager.sh"
grep -q '^name: spec-worktree$' "$TMP_DIR/.agents/skills/spec-worktree/SKILL.md"
grep -q '^user-invocable: false$' "$TMP_DIR/.agents/skills/spec-worktree/SKILL.md"
grep -q 'allowed-tools: Bash(bash \*worktree-manager.sh\*)' "$TMP_DIR/.agents/skills/spec-worktree/SKILL.md"
grep -q '.agents/skills/spec-worktree/scripts/worktree-manager.sh' "$TMP_DIR/.agents/skills/spec-worktree/SKILL.md"
test ! -e "$TMP_DIR/.agents/skills/spec-session-inventory"
test ! -e "$TMP_DIR/.agents/skills/spec-session-extract"
if [[ "$expected_agent_count" != "0" ]]; then
  for agent in spec-repo-research-analyst.agent.md; do
    test -f "$TMP_DIR/.codex/agents/$agent"
  done
fi
grep -q '<!-- spec-first:lang:start -->' "$TMP_DIR/AGENTS.md"
grep -q '### Workflow Entry Governance' "$TMP_DIR/AGENTS.md"
grep -q 'skills/using-spec-first/SKILL.md' "$TMP_DIR/AGENTS.md"
if grep -q '<!-- spec-first:bootstrap:start -->' "$TMP_DIR/AGENTS.md"; then
  echo "legacy standalone bootstrap block should not be injected into AGENTS.md" >&2
  exit 1
fi
if grep -q '<!-- spec-first:coding-guidelines:start -->' "$TMP_DIR/AGENTS.md"; then
  echo "retired coding-guidelines block should not be injected into AGENTS.md" >&2
  exit 1
fi
if grep -q 'spec-first startup-reminder --codex' "$TMP_DIR/AGENTS.md"; then
  echo "Codex startup reminder prose should stay out of AGENTS.md managed language/governance block" >&2
  exit 1
fi
test -f "$TMP_DIR/.codex/hooks/session-start"
test -f "$TMP_DIR/.codex/hooks/session-start.cmd"
test -f "$TMP_DIR/.codex/hooks.json"
grep -q 'startup-reminder' "$TMP_DIR/.codex/hooks/session-start"
grep -q -- '--codex' "$TMP_DIR/.codex/hooks/session-start"
grep -q '%~dp0session-start' "$TMP_DIR/.codex/hooks/session-start.cmd"
node - "$TMP_DIR" <<'NODE'
const fs = require('node:fs');
const path = require('node:path');
const projectRoot = fs.realpathSync.native(process.argv[2]);
const hooksPath = path.join(projectRoot, '.codex', 'hooks.json');
const payload = JSON.parse(fs.readFileSync(hooksPath, 'utf8'));
const hook = payload.hooks?.SessionStart?.[0]?.hooks?.[0];
const command = hook?.command;
const commandWindows = hook?.commandWindows;
const expected = `'${process.execPath.replace(/'/g, "'\\''")}' '${path.join(projectRoot, '.codex/hooks/session-start').replace(/\\/g, '/').replace(/'/g, "'\\''")}'`;
const expectedWindows = `"${path.join(projectRoot, '.codex/hooks/session-start.cmd').replace(/"/g, '\\"')}"`;
if (command !== expected) {
  throw new Error(`unexpected codex hook command ${command}`);
}
if (commandWindows !== expectedWindows) {
  throw new Error(`unexpected codex hook commandWindows ${commandWindows}`);
}
NODE
grep -q '.agents/skills/' "$TMP_DIR/.gitignore"
echo "✓ Codex init generated skills, agents, hooks, and AGENTS.md"

echo "8. Initialize Cursor runtime and verify generated-runtime preview assets..."
cursor_output="$(run_programmatic_init "$TMP_DIR" cursor kuang en 2>&1)"
grep -q "Generated ${expected_cursor_total_skill_count} skill directory(ies) in .cursor/skills" <<<"$cursor_output"
grep -q "Cursor support is generated-runtime preview" <<<"$cursor_output"
installed_cursor_skill_count="$(find "$TMP_DIR/.cursor/skills" -mindepth 1 -maxdepth 1 -type d | wc -l | tr -d ' ')"
test "$installed_cursor_skill_count" = "$expected_cursor_total_skill_count"
for skill in spec-plan spec-work spec-code-review spec-doc-review spec-brainstorm spec-mcp-setup spec-compound-refresh; do
  test -f "$TMP_DIR/.cursor/skills/$skill/SKILL.md"
  grep -q "^name: $skill$" "$TMP_DIR/.cursor/skills/$skill/SKILL.md"
done
test ! -e "$TMP_DIR/.cursor/skills/spec-"standards"/SKILL.md"
test ! -e "$TMP_DIR/.cursor/skills/spec-work-beta/SKILL.md"
test -f "$TMP_DIR/.cursor/skills/using-spec-first/SKILL.md"
grep -q '^name: using-spec-first$' "$TMP_DIR/.cursor/skills/using-spec-first/SKILL.md"
test -f "$TMP_DIR/.cursor/skills/spec-worktree/SKILL.md"
grep -q '^name: spec-worktree$' "$TMP_DIR/.cursor/skills/spec-worktree/SKILL.md"
test -f "$TMP_DIR/.cursor/spec-first/state.json"
test ! -e "$TMP_DIR/.cursor/commands"
test ! -e "$TMP_DIR/.cursor/agents"
test ! -e "$TMP_DIR/.cursor/rules"
node - "$TMP_DIR/.cursor/spec-first/state.json" "$expected_cursor_skill_count" "$expected_workflow_skill_count" <<'NODE'
const fs = require('node:fs');
const [statePath, skillCount, workflowSkillCount] = process.argv.slice(2);
const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
if (state.commands.length !== 0) throw new Error('Cursor command count should be zero');
if (state.skills.length !== Number(skillCount)) throw new Error('Cursor skill count mismatch');
if (state.workflowSkills.length !== Number(workflowSkillCount)) throw new Error('Cursor workflow skill count mismatch');
if (!state.workflowSkills.includes('spec-mcp-setup')) throw new Error('missing Cursor mcp-setup workflow skill');
if (state.agents.length !== 0) throw new Error('Cursor agent count should be zero');
NODE
cursor_doctor_output="$(cd "$TMP_DIR" && node "$REPO_ROOT/bin/spec-first.js" doctor --cursor)"
grep -q ".cursor/spec-first/state.json" <<<"$cursor_doctor_output"
grep -q ".cursor/skills" <<<"$cursor_doctor_output"
grep -q "Cursor generated-runtime preview" <<<"$cursor_doctor_output"
if grep -q ".cursor/commands" <<<"$cursor_doctor_output"; then
  echo "Cursor doctor should not report .cursor/commands as an installed surface" >&2
  exit 1
fi
cursor_doctor_json="$(cd "$TMP_DIR" && node "$REPO_ROOT/bin/spec-first.js" doctor --cursor --json)"
node - "$cursor_doctor_json" <<'NODE'
const payload = JSON.parse(process.argv[2]);
if (!['simulated', 'verified', 'not_verified'].includes(payload.workflow_runnability)) {
  throw new Error(`unexpected Cursor runnability ${payload.workflow_runnability}`);
}
if (!['pass', 'warn', 'error'].includes(payload.runtime_asset_health)) {
  throw new Error(`unexpected Cursor asset health ${payload.runtime_asset_health}`);
}
if (!payload.platform_checks?.cursor?.length) throw new Error('missing Cursor checks');
const previewCheck = payload.platform_checks.cursor.find((entry) => entry.name === 'Cursor generated-runtime preview');
if (!previewCheck || previewCheck.level !== 'WARNING') throw new Error('missing Cursor generated-runtime preview warning');
const skillCheck = payload.platform_checks.cursor.find((entry) =>
  entry.name === '.cursor/skills/spec-work/SKILL.md' && entry.message.includes('Cursor skill frontmatter is valid')
);
if (!skillCheck || skillCheck.level !== 'PASS') throw new Error('missing passing Cursor skill check');
NODE
echo "✓ Cursor init generated Agent Skills, state, and preview doctor facts"

echo "9. Initialize Kiro runtime and verify assets..."
kiro_output="$(run_programmatic_init "$TMP_DIR" kiro kuang en)"
grep -q "Generated ${expected_agent_count} agent file(s) in .kiro/agents" <<<"$kiro_output"
grep -q "Generated ${expected_kiro_total_skill_count} skill directory(ies) in .kiro/skills" <<<"$kiro_output"
installed_kiro_skill_count="$(find "$TMP_DIR/.kiro/skills" -mindepth 1 -maxdepth 1 -type d | wc -l | tr -d ' ')"
test "$installed_kiro_skill_count" = "$expected_kiro_total_skill_count"
for skill in spec-plan spec-work spec-code-review spec-doc-review spec-brainstorm spec-mcp-setup spec-compound-refresh; do
  test -f "$TMP_DIR/.kiro/skills/$skill/SKILL.md"
  grep -q "^name: $skill$" "$TMP_DIR/.kiro/skills/$skill/SKILL.md"
done
test ! -e "$TMP_DIR/.kiro/skills/spec-"standards"/SKILL.md"
test ! -e "$TMP_DIR/.kiro/skills/spec-work-beta/SKILL.md"
test -f "$TMP_DIR/.kiro/skills/using-spec-first/SKILL.md"
grep -q '^name: using-spec-first$' "$TMP_DIR/.kiro/skills/using-spec-first/SKILL.md"
test -f "$TMP_DIR/.kiro/skills/spec-worktree/SKILL.md"
grep -q '^name: spec-worktree$' "$TMP_DIR/.kiro/skills/spec-worktree/SKILL.md"
if [[ "$expected_agent_count" != "0" ]]; then
  for agent in spec-repo-research-analyst.agent.md; do
    test -f "$TMP_DIR/.kiro/agents/$agent"
    grep -q '^tools: \["read"\]$' "$TMP_DIR/.kiro/agents/$agent"
  done
fi
test -f "$TMP_DIR/.kiro/spec-first/state.json"
test ! -e "$TMP_DIR/.kiro/commands/spec"
test ! -e "$TMP_DIR/.kiro/hooks"
test ! -e "$TMP_DIR/.kiro/steering"
node - "$TMP_DIR/.kiro/spec-first/state.json" "$expected_kiro_skill_count" "$expected_workflow_skill_count" "$expected_agent_count" <<'NODE'
const fs = require('node:fs');
const [statePath, skillCount, workflowSkillCount, agentCount] = process.argv.slice(2);
const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
if (state.commands.length !== 0) throw new Error('Kiro command count should be zero');
if (state.skills.length !== Number(skillCount)) throw new Error('Kiro skill count mismatch');
if (state.workflowSkills.length !== Number(workflowSkillCount)) throw new Error('Kiro workflow skill count mismatch');
if (!state.workflowSkills.includes('spec-mcp-setup')) throw new Error('missing Kiro mcp-setup workflow skill');
if (state.agents.length !== Number(agentCount)) throw new Error('Kiro agent count mismatch');
NODE
kiro_doctor_output="$(cd "$TMP_DIR" && node "$REPO_ROOT/bin/spec-first.js" doctor --kiro)"
grep -q ".kiro/spec-first/state.json" <<<"$kiro_doctor_output"
grep -q ".kiro/skills" <<<"$kiro_doctor_output"
if [[ "$expected_agent_count" != "0" ]]; then
  grep -q ".kiro/agents" <<<"$kiro_doctor_output"
fi
if grep -q ".kiro/commands/spec" <<<"$kiro_doctor_output"; then
  echo "Kiro doctor should not report .kiro/commands/spec as an installed surface" >&2
  exit 1
fi
kiro_doctor_json="$(cd "$TMP_DIR" && node "$REPO_ROOT/bin/spec-first.js" doctor --kiro --json)"
node - "$kiro_doctor_json" "$expected_agent_count" <<'NODE'
const payload = JSON.parse(process.argv[2]);
const expectedAgentCount = Number(process.argv[3]);
if (!['simulated', 'verified', 'not_verified'].includes(payload.workflow_runnability)) {
  throw new Error(`unexpected Kiro runnability ${payload.workflow_runnability}`);
}
if (!['pass', 'warn', 'error'].includes(payload.runtime_asset_health)) {
  throw new Error(`unexpected Kiro asset health ${payload.runtime_asset_health}`);
}
if (!payload.platform_checks?.kiro?.length) throw new Error('missing Kiro checks');
const skillCheck = payload.platform_checks.kiro.find((entry) =>
  entry.name === '.kiro/skills/spec-work/SKILL.md' && entry.message.includes('Kiro skill frontmatter is valid')
);
if (!skillCheck || skillCheck.level !== 'PASS') throw new Error('missing passing Kiro skill check');
if (expectedAgentCount > 0) {
  const agentCheck = payload.platform_checks.kiro.find((entry) =>
    entry.name === '.kiro/agents/spec-repo-research-analyst.agent.md' && entry.message.includes('read-only default tools')
  );
  if (!agentCheck || agentCheck.level !== 'PASS') throw new Error('missing passing Kiro agent check');
}
NODE
echo "✓ Kiro init generated Agent Skills, agents, state, and doctor facts"

echo "10. Initialize Qoder runtime and verify assets..."
qoder_output="$(run_programmatic_init "$TMP_DIR" qoder kuang en)"
grep -q "Generated ${expected_qoder_command_count} command file(s) in .qoder/commands" <<<"$qoder_output"
grep -q "Generated ${expected_qoder_total_skill_count} skill directory(ies) in .qoder/skills" <<<"$qoder_output"
grep -q "Generated ${expected_agent_count} agent file(s) in .qoder/agents" <<<"$qoder_output"
installed_qoder_skill_count="$(find "$TMP_DIR/.qoder/skills" -mindepth 1 -maxdepth 1 -type d | wc -l | tr -d ' ')"
test "$installed_qoder_skill_count" = "$expected_qoder_total_skill_count"
for command in plan work code-review doc-review brainstorm mcp-setup; do
  test -f "$TMP_DIR/.qoder/commands/spec-$command.md"
  grep -q "^name: spec-$command$" "$TMP_DIR/.qoder/commands/spec-$command.md"
done
for skill in spec-plan spec-work spec-code-review spec-doc-review spec-brainstorm spec-mcp-setup spec-compound-refresh; do
  test -f "$TMP_DIR/.qoder/skills/$skill/SKILL.md"
  grep -q "^name: $skill$" "$TMP_DIR/.qoder/skills/$skill/SKILL.md"
done
test -f "$TMP_DIR/.qoder/skills/using-spec-first/SKILL.md"
grep -q '^name: using-spec-first$' "$TMP_DIR/.qoder/skills/using-spec-first/SKILL.md"
test -f "$TMP_DIR/.qoder/skills/spec-worktree/SKILL.md"
grep -q '^name: spec-worktree$' "$TMP_DIR/.qoder/skills/spec-worktree/SKILL.md"
if [[ "$expected_agent_count" != "0" ]]; then
  for agent in spec-repo-research-analyst.agent.md; do
    test -f "$TMP_DIR/.qoder/agents/$agent"
    node - "$TMP_DIR/.qoder/agents/$agent" <<'NODE'
const fs = require('node:fs');
const agentPath = process.argv[2];
const content = fs.readFileSync(agentPath, 'utf8');
const match = content.match(/^---\n([\s\S]*?)\n---/);
if (!match) throw new Error(`missing frontmatter: ${agentPath}`);
const frontmatter = match[1];
const expectedTools = 'Read, Grep, Glob';
if (!new RegExp(`^tools: \\[${expectedTools.replace('*', '\\*')}\\]$`, 'm').test(frontmatter)) {
  throw new Error(`Qoder agent tools mismatch; expected [${expectedTools}]: ${agentPath}`);
}
if (/\b(Write|Edit|Bash|Agent)\b/.test(frontmatter)) {
  throw new Error(`Qoder agent should not default to write/shell/dispatch tools: ${agentPath}`);
}
NODE
  done
fi
test -f "$TMP_DIR/.qoder/spec-first/state.json"
test ! -e "$TMP_DIR/.qoder/rules"
test ! -e "$TMP_DIR/.qoder/hooks"
node - "$TMP_DIR/.qoder/spec-first/state.json" "$expected_qoder_command_count" "$expected_qoder_skill_count" "$expected_qoder_workflow_skill_count" "$expected_agent_count" <<'NODE'
const fs = require('node:fs');
const [statePath, commandCount, skillCount, workflowSkillCount, agentCount] = process.argv.slice(2);
const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
if (state.commands.length !== Number(commandCount)) throw new Error('Qoder command count mismatch');
if (state.skills.length !== Number(skillCount)) throw new Error('Qoder skill count mismatch');
if (state.workflowSkills.length !== Number(workflowSkillCount)) throw new Error('Qoder workflow skill count mismatch');
if (!state.commands.includes('spec-work.md')) throw new Error('missing Qoder work command');
if (!state.workflowSkills.includes('spec-mcp-setup')) throw new Error('missing Qoder mcp-setup workflow skill');
if (state.agents.length !== Number(agentCount)) throw new Error('Qoder agent count mismatch');
NODE
qoder_doctor_output="$(cd "$TMP_DIR" && node "$REPO_ROOT/bin/spec-first.js" doctor --qoder)"
grep -q ".qoder/spec-first/state.json" <<<"$qoder_doctor_output"
grep -q ".qoder/commands/spec" <<<"$qoder_doctor_output"
grep -q ".qoder/skills" <<<"$qoder_doctor_output"
if [[ "$expected_agent_count" != "0" ]]; then
  grep -q ".qoder/agents" <<<"$qoder_doctor_output"
fi
qoder_doctor_json="$(cd "$TMP_DIR" && node "$REPO_ROOT/bin/spec-first.js" doctor --qoder --json)"
node - "$qoder_doctor_json" "$expected_agent_count" <<'NODE'
const payload = JSON.parse(process.argv[2]);
const expectedAgentCount = Number(process.argv[3]);
if (!['simulated', 'verified', 'not_verified'].includes(payload.workflow_runnability)) {
  throw new Error(`unexpected Qoder runnability ${payload.workflow_runnability}`);
}
if (!['pass', 'warn', 'error'].includes(payload.runtime_asset_health)) {
  throw new Error(`unexpected Qoder asset health ${payload.runtime_asset_health}`);
}
if (!payload.platform_checks?.qoder?.length) throw new Error('missing Qoder checks');
const commandCheck = payload.platform_checks.qoder.find((entry) =>
  entry.name === '.qoder/commands/spec-work.md' && entry.message.includes('Qoder command frontmatter is valid')
);
if (!commandCheck || commandCheck.level !== 'PASS') throw new Error('missing passing Qoder command check');
const skillCheck = payload.platform_checks.qoder.find((entry) =>
  entry.name === '.qoder/skills/spec-work/SKILL.md' && entry.message.includes('Qoder skill frontmatter is valid')
);
if (!skillCheck || skillCheck.level !== 'PASS') throw new Error('missing passing Qoder skill check');
if (expectedAgentCount > 0) {
  const agentCheck = payload.platform_checks.qoder.find((entry) =>
    entry.name === '.qoder/agents/spec-repo-research-analyst.agent.md' && entry.message.includes('read/search default tools')
  );
  if (!agentCheck || agentCheck.level !== 'PASS') throw new Error('missing passing Qoder agent check');
}
NODE
if command -v qodercli >/dev/null 2>&1 || command -v qoder >/dev/null 2>&1; then
  qoder_loader_command="$(command -v qodercli 2>/dev/null || command -v qoder 2>/dev/null)"
  "$qoder_loader_command" --version >/dev/null 2>&1 || true
  echo "Qoder loader smoke degraded: Qoder CLI is present at $qoder_loader_command, but no non-interactive project loader probe is defined"
else
  echo "Qoder loader smoke degraded: qodercli/qoder not found on PATH"
fi
echo "✓ Qoder init generated project commands, skills, agents, state, and doctor facts"

echo "11. Verify clean dry-run and clean removal..."
clean_dry="$(cd "$TMP_DIR" && node "$REPO_ROOT/bin/spec-first.js" clean --claude --dry-run)"
grep -q "Dry run: spec-first clean (claude)" <<<"$clean_dry"
grep -q "No files were changed." <<<"$clean_dry"
test -d "$TMP_DIR/.claude/spec-first"
(cd "$TMP_DIR" && node "$REPO_ROOT/bin/spec-first.js" clean --claude >/dev/null)
test ! -d "$TMP_DIR/.claude/spec-first"
test ! -d "$TMP_DIR/.claude/commands/spec"
echo "✓ clean removes managed Claude runtime"

mkdir -p "$TMP_DIR/.cursor/rules" "$TMP_DIR/.cursor/agents"
printf '# Native Cursor rule\n' > "$TMP_DIR/.cursor/rules/product.mdc"
printf '{"custom":true}\n' > "$TMP_DIR/.cursor/mcp.json"
cursor_clean_dry="$(cd "$TMP_DIR" && node "$REPO_ROOT/bin/spec-first.js" clean --cursor --dry-run)"
grep -q "Dry run: spec-first clean (cursor)" <<<"$cursor_clean_dry"
grep -q ".cursor/skills/spec-work" <<<"$cursor_clean_dry"
grep -q ".cursor/spec-first/state.json" <<<"$cursor_clean_dry"
grep -q "No files were changed." <<<"$cursor_clean_dry"
if grep -q ".cursor/agents" <<<"$cursor_clean_dry"; then
  echo "Cursor clean dry-run should not remove user-owned .cursor/agents" >&2
  exit 1
fi
if grep -q ".cursor/rules" <<<"$cursor_clean_dry"; then
  echo "Cursor clean dry-run should not remove user-owned .cursor/rules" >&2
  exit 1
fi
if grep -q ".cursor/mcp.json" <<<"$cursor_clean_dry"; then
  echo "Cursor clean dry-run should not remove user-owned .cursor/mcp.json" >&2
  exit 1
fi
(cd "$TMP_DIR" && node "$REPO_ROOT/bin/spec-first.js" clean --cursor >/dev/null)
test ! -d "$TMP_DIR/.cursor/skills"
test ! -d "$TMP_DIR/.cursor/spec-first"
test -d "$TMP_DIR/.cursor/agents"
test -f "$TMP_DIR/.cursor/rules/product.mdc"
test -f "$TMP_DIR/.cursor/mcp.json"
echo "✓ clean removes managed Cursor runtime without touching user-owned .cursor assets"

mkdir -p "$TMP_DIR/.kiro/hooks" "$TMP_DIR/.kiro/settings" "$TMP_DIR/.kiro/specs/native"
printf 'custom hook\n' > "$TMP_DIR/.kiro/hooks/custom"
printf '{"custom":true}\n' > "$TMP_DIR/.kiro/settings/user.json"
printf '# Native Kiro spec\n' > "$TMP_DIR/.kiro/specs/native/spec.md"
kiro_clean_dry="$(cd "$TMP_DIR" && node "$REPO_ROOT/bin/spec-first.js" clean --kiro --dry-run)"
grep -q "Dry run: spec-first clean (kiro)" <<<"$kiro_clean_dry"
grep -q ".kiro/skills/spec-work" <<<"$kiro_clean_dry"
if [[ "$expected_agent_count" != "0" ]]; then
  grep -q ".kiro/agents/spec-repo-research-analyst.agent.md" <<<"$kiro_clean_dry"
fi
grep -q ".kiro/spec-first/state.json" <<<"$kiro_clean_dry"
grep -q "No files were changed." <<<"$kiro_clean_dry"
(cd "$TMP_DIR" && node "$REPO_ROOT/bin/spec-first.js" clean --kiro >/dev/null)
test ! -d "$TMP_DIR/.kiro/skills"
test ! -d "$TMP_DIR/.kiro/agents"
test ! -d "$TMP_DIR/.kiro/spec-first"
test -f "$TMP_DIR/.kiro/hooks/custom"
test -f "$TMP_DIR/.kiro/settings/user.json"
test -f "$TMP_DIR/.kiro/specs/native/spec.md"
echo "✓ clean removes managed Kiro runtime without touching user-owned .kiro assets"

mkdir -p "$TMP_DIR/.qoder/rules" "$TMP_DIR/.qoder/hooks"
printf '# Native Qoder rule\n' > "$TMP_DIR/.qoder/rules/security.md"
printf '{"custom":true}\n' > "$TMP_DIR/.qoder/settings.json"
printf '{"hooks":[]}\n' > "$TMP_DIR/.qoder/hooks/custom.json"
qoder_clean_dry="$(cd "$TMP_DIR" && node "$REPO_ROOT/bin/spec-first.js" clean --qoder --dry-run)"
grep -q "Dry run: spec-first clean (qoder)" <<<"$qoder_clean_dry"
grep -q ".qoder/commands/spec-work.md" <<<"$qoder_clean_dry"
grep -q ".qoder/skills/spec-work" <<<"$qoder_clean_dry"
if [[ "$expected_agent_count" != "0" ]]; then
  grep -q ".qoder/agents/spec-repo-research-analyst.agent.md" <<<"$qoder_clean_dry"
fi
grep -q ".qoder/spec-first/state.json" <<<"$qoder_clean_dry"
grep -q "No files were changed." <<<"$qoder_clean_dry"
(cd "$TMP_DIR" && node "$REPO_ROOT/bin/spec-first.js" clean --qoder >/dev/null)
test ! -d "$TMP_DIR/.qoder/commands/spec"
test ! -d "$TMP_DIR/.qoder/skills"
test ! -d "$TMP_DIR/.qoder/agents"
test ! -d "$TMP_DIR/.qoder/spec-first"
test -f "$TMP_DIR/.qoder/rules/security.md"
test -f "$TMP_DIR/.qoder/settings.json"
test -f "$TMP_DIR/.qoder/hooks/custom.json"
echo "✓ clean removes managed Qoder runtime without touching user-owned .qoder assets"

echo "=== CLI smoke test passed ✓ ==="
