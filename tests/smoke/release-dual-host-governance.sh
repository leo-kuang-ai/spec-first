#!/bin/bash
# release-dual-host-governance.sh — 双宿主治理 tarball 发布闭环验证

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
TMP_ROOT="$(mktemp -d)"
TMP_PREFIX="$TMP_ROOT/prefix"
TMP_CACHE="$TMP_ROOT/cache"
TARBALL_DIR="$TMP_ROOT/tarball"
CODEX_PROJECT="$TMP_ROOT/codex-project"
CLAUDE_PROJECT="$TMP_ROOT/claude-project"
KIRO_PROJECT="$TMP_ROOT/kiro-project"
PACKAGE_VERSION="$(node -p "require(process.argv[1]).version" "$REPO_ROOT/package.json")"

cleanup() {
  rm -rf "$TMP_ROOT"
}
trap cleanup EXIT

echo "=== release-dual-host-governance.sh — tarball 治理闭环验证 ==="

echo "1. 打包 tarball..."
cd "$REPO_ROOT"
mkdir -p "$TARBALL_DIR" "$TMP_CACHE"
export npm_config_cache="$TMP_CACHE"
npm pack --pack-destination "$TARBALL_DIR" >"$TMP_ROOT/pack.log" 2>&1
TARBALL_PATH="$(find "$TARBALL_DIR" -maxdepth 1 -type f -name '*.tgz' -print -quit)"
test -f "$TARBALL_PATH"
echo "   tarball: $TARBALL_PATH"

echo "2. 校验 tarball 包含 runtime governance assets..."
tar -tf "$TARBALL_PATH" | grep -q '^package/src/cli/contracts/dual-host-governance/skills-governance.json$'
tar -tf "$TARBALL_PATH" | grep -q '^package/src/cli/contracts/dual-host-governance/skills-governance.schema.json$'
tar -tf "$TARBALL_PATH" | grep -q '^package/src/cli/adapters/kiro.js$'
tar -tf "$TARBALL_PATH" | grep -q '^package/docs/contracts/verifiers/verification-evidence.schema.json$'
tar -tf "$TARBALL_PATH" | grep -q '^package/scripts/typecheck-js.js$'
if tar -tf "$TARBALL_PATH" | grep -q '^package/docs/contracts/dual-host-governance/skills-governance.json$'; then
  echo "✗ tarball 不应再包含 docs-side skills-governance.json"
  exit 1
fi
if tar -tf "$TARBALL_PATH" | grep -q '^package/docs/contracts/dual-host-governance/skills-governance.schema.json$'; then
  echo "✗ tarball 不应再包含 docs-side skills-governance.schema.json"
  exit 1
fi
if tar -tf "$TARBALL_PATH" | grep -q '^package/\.claude-plugin/'; then
  echo "✗ tarball 不应包含安装生成的 .claude-plugin 产物"
  exit 1
fi
if tar -tf "$TARBALL_PATH" | grep -E '(^|/)__pycache__/|\.py[co]$'; then
  echo "✗ tarball 不应包含 Python bytecode 缓存"
  exit 1
fi
echo "   ✓ tarball 已包含 runtime governance JSON/schema"

echo "3. 隔离安装 tarball..."
export npm_config_prefix="$TMP_PREFIX"
export npm_config_foreground_scripts=true
mkdir -p "$TMP_PREFIX" "$TMP_CACHE"

npm install -g --omit=optional "$TARBALL_PATH" >"$TMP_ROOT/install.log" 2>&1
SHIM="$TMP_PREFIX/bin/spec-first"
GLOBAL_PKG="$TMP_PREFIX/lib/node_modules/spec-first"
test -x "$SHIM"
test -f "$GLOBAL_PKG/src/cli/contracts/dual-host-governance/skills-governance.json"
echo "   ✓ 安装后 runtime governance 真源存在"

run_installed_programmatic_init() {
  local project_root="$1"
  local platform="$2"
  local name="$3"
  local lang="$4"
  node - "$GLOBAL_PKG" "$project_root" "$platform" "$name" "$lang" <<'NODE'
const packageRoot = process.argv[2];
const projectRoot = process.argv[3];
const platform = process.argv[4];
const name = process.argv[5];
const lang = process.argv[6];
const { applyInitPlan, buildInitPlan } = require(`${packageRoot}/src/cli/init-plan`);
const { printInitApplySuccess } = require(`${packageRoot}/src/cli/commands/init`);

const plan = buildInitPlan({
  projectRoot,
  workspaceRoot: projectRoot,
  platform,
  name,
  lang,
  target: { mode: 'single-repo', projectRoot },
  gitRootTopology: 'single-repo',
});

if (Array.isArray(plan.errors) && plan.errors.length > 0) {
  for (const error of plan.errors) {
    console.error(error.message || String(error));
  }
  process.exit(1);
}

const result = applyInitPlan(projectRoot, plan);
printInitApplySuccess(plan, result);
process.exit(result.exit_code);
NODE
}

echo "4. 验证 Codex 安装态 init / doctor..."
mkdir -p "$CODEX_PROJECT"
codex_init_output="$(
  SPEC_FIRST_VERSION_REMINDER_LATEST="$PACKAGE_VERSION" run_installed_programmatic_init "$CODEX_PROJECT" codex test en 2>&1
)"
grep -q '\$spec-\* skills' <<<"$codex_init_output"
test ! -e "$CODEX_PROJECT/.codex/commands/spec"
test -f "$CODEX_PROJECT/.agents/skills/spec-work/SKILL.md"
test ! -e "$CODEX_PROJECT/.agents/skills/spec-"standards"/SKILL.md"
test -f "$CODEX_PROJECT/.agents/skills/using-spec-first/SKILL.md"
grep -q 'spec-first startup-reminder --codex' "$CODEX_PROJECT/AGENTS.md"
grep -q 'must not block routing' "$CODEX_PROJECT/AGENTS.md"
grep -q 'bounded subagents, leaf reviewers, and worker agents' "$CODEX_PROJECT/AGENTS.md"
test -f "$CODEX_PROJECT/.codex/hooks/session-start"
test -f "$CODEX_PROJECT/.codex/hooks/session-start.cmd"
test -f "$CODEX_PROJECT/.codex/hooks.json"
grep -q 'startup-reminder' "$CODEX_PROJECT/.codex/hooks/session-start"
grep -q -- '--codex' "$CODEX_PROJECT/.codex/hooks/session-start"
grep -q '%~dp0session-start' "$CODEX_PROJECT/.codex/hooks/session-start.cmd"
node - "$CODEX_PROJECT" <<'NODE'
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
test ! -e "$CODEX_PROJECT/.agents/skills/claude-permissions-optimizer/SKILL.md"
test ! -e "$CODEX_PROJECT/.agents/skills/orchestrating-swarms/SKILL.md"

codex_doctor_output="$(
  cd "$CODEX_PROJECT"
  SPEC_FIRST_VERSION_REMINDER_LATEST="$PACKAGE_VERSION" "$SHIM" doctor --codex 2>&1
)"
grep -q '.agents/skills' <<<"$codex_doctor_output"
grep -q 'workflow skills' <<<"$codex_doctor_output"
grep -q 'standalone skills' <<<"$codex_doctor_output"
grep -q '.codex/hooks/session-start' <<<"$codex_doctor_output"
if grep -q '.codex/commands/spec' <<<"$codex_doctor_output"; then
  echo "✗ Codex doctor 不应再把 .codex/commands/spec 当作正式产品面"
  exit 1
fi
(
  cd "$CODEX_PROJECT"
  "$SHIM" clean --codex >/dev/null
)
test ! -e "$CODEX_PROJECT/.codex/hooks/session-start"
test ! -e "$CODEX_PROJECT/.codex/hooks/session-start.cmd"
test ! -e "$CODEX_PROJECT/.codex/hooks.json"
echo "   ✓ Codex 安装态闭环通过"

echo "5. 验证 Kiro 安装态 init / doctor / clean..."
mkdir -p "$KIRO_PROJECT"
kiro_init_output="$(
  SPEC_FIRST_VERSION_REMINDER_LATEST="$PACKAGE_VERSION" run_installed_programmatic_init "$KIRO_PROJECT" kiro test en 2>&1
)"
grep -q 'skill directory(ies) in .kiro/skills' <<<"$kiro_init_output"
grep -q 'agent file(s) in .kiro/agents' <<<"$kiro_init_output"
test -f "$KIRO_PROJECT/.kiro/skills/spec-work/SKILL.md"
test -f "$KIRO_PROJECT/.kiro/skills/spec-mcp-setup/SKILL.md"
test -f "$KIRO_PROJECT/.kiro/skills/using-spec-first/SKILL.md"
test -f "$KIRO_PROJECT/.kiro/agents/spec-repo-research-analyst.agent.md"
grep -q '^tools: \["read"\]$' "$KIRO_PROJECT/.kiro/agents/spec-repo-research-analyst.agent.md"
test -f "$KIRO_PROJECT/.kiro/spec-first/state.json"
test ! -e "$KIRO_PROJECT/.kiro/commands/spec"
test ! -e "$KIRO_PROJECT/.kiro/hooks"
test ! -e "$KIRO_PROJECT/.kiro/steering"

kiro_doctor_output="$(
  cd "$KIRO_PROJECT"
  SPEC_FIRST_VERSION_REMINDER_LATEST="$PACKAGE_VERSION" "$SHIM" doctor --kiro 2>&1
)"
grep -q '.kiro/skills' <<<"$kiro_doctor_output"
grep -q '.kiro/agents' <<<"$kiro_doctor_output"
grep -q '.kiro/spec-first/state.json' <<<"$kiro_doctor_output"
if grep -q '.kiro/commands/spec' <<<"$kiro_doctor_output"; then
  echo "✗ Kiro doctor 不应把 .kiro/commands/spec 当作正式产品面"
  exit 1
fi
mkdir -p "$KIRO_PROJECT/.kiro/hooks" "$KIRO_PROJECT/.kiro/settings" "$KIRO_PROJECT/.kiro/specs/native"
printf 'custom hook\n' > "$KIRO_PROJECT/.kiro/hooks/custom"
printf '{"custom":true}\n' > "$KIRO_PROJECT/.kiro/settings/user.json"
printf '# Native Kiro spec\n' > "$KIRO_PROJECT/.kiro/specs/native/spec.md"
(
  cd "$KIRO_PROJECT"
  "$SHIM" clean --kiro >/dev/null
)
test ! -e "$KIRO_PROJECT/.kiro/skills"
test ! -e "$KIRO_PROJECT/.kiro/agents"
test ! -e "$KIRO_PROJECT/.kiro/spec-first"
test -f "$KIRO_PROJECT/.kiro/hooks/custom"
test -f "$KIRO_PROJECT/.kiro/settings/user.json"
test -f "$KIRO_PROJECT/.kiro/specs/native/spec.md"
echo "   ✓ Kiro 安装态闭环通过"

echo "6. 验证 Claude 安装态 init / doctor..."
mkdir -p "$CLAUDE_PROJECT"
claude_init_output="$(
  SPEC_FIRST_VERSION_REMINDER_LATEST="$PACKAGE_VERSION" run_installed_programmatic_init "$CLAUDE_PROJECT" claude test en 2>&1
)"
grep -q '.claude/commands/spec' <<<"$claude_init_output"
test -f "$CLAUDE_PROJECT/.claude/commands/spec/brainstorm.md"
test ! -e "$CLAUDE_PROJECT/.claude/commands/spec/standards.md"
test -f "$CLAUDE_PROJECT/.claude/skills/using-spec-first/SKILL.md"
test -f "$CLAUDE_PROJECT/.claude/hooks/session-start"
grep -q 'startup-reminder' "$CLAUDE_PROJECT/.claude/hooks/session-start"
grep -q -- '--claude' "$CLAUDE_PROJECT/.claude/hooks/session-start"
test -f "$CLAUDE_PROJECT/.claude/hooks/spec-plan-guard"
grep -q 'UserPromptExpansion' "$CLAUDE_PROJECT/.claude/hooks/spec-plan-guard"
test -f "$CLAUDE_PROJECT/.claude/spec-first/workflows/spec-work/SKILL.md"
test ! -e "$CLAUDE_PROJECT/.claude/spec-first/workflows/spec-"standards"/SKILL.md"

claude_doctor_output="$(
  cd "$CLAUDE_PROJECT"
  SPEC_FIRST_VERSION_REMINDER_LATEST="$PACKAGE_VERSION" "$SHIM" doctor --claude 2>&1
)"
grep -q '.claude/commands/spec' <<<"$claude_doctor_output"
grep -q '.claude/skills' <<<"$claude_doctor_output"
grep -q 'workflow skills' <<<"$claude_doctor_output"
echo "   ✓ Claude 安装态闭环通过"

echo
echo "=== release-dual-host-governance.sh — 全部验证通过 ✓ ==="
