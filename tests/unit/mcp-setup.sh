#!/bin/bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SKILL_DIR="$REPO_ROOT/skills/spec-mcp-setup"
SCRIPTS_DIR="$SKILL_DIR/scripts"
TOOLS_JSON="$SKILL_DIR/mcp-tools.json"
WRITE_SETUP_FACTS="$SCRIPTS_DIR/write-setup-facts.sh"
SPEC_FIRST_CLI="$REPO_ROOT/bin/spec-first.js"

pass_count=0

fail() {
  echo "FAIL: $1" >&2
  exit 1
}

assert_eq() {
  local label="$1"
  local expected="$2"
  local actual="$3"
  if [ "$expected" != "$actual" ]; then
    fail "$label: expected [$expected], got [$actual]"
  fi
  pass_count=$((pass_count + 1))
}

assert() {
  local label="$1"
  shift
  if ! "$@"; then
    fail "$label"
  fi
  pass_count=$((pass_count + 1))
}

command -v jq >/dev/null 2>&1 || fail "jq is required"
command -v node >/dev/null 2>&1 || fail "node is required"

assert_eq "registry schema version" "7" "$(jq -r '.schema_version' "$TOOLS_JSON")"
assert_eq "tool ids are current" "sequential-thinking,context7,codegraph" "$(jq -r '[.tools[].id] | join(",")' "$TOOLS_JSON")"
assert_eq "external dependency pins are centralized" "true" "$(jq -r '(([.external_dependencies[].id] | sort | join(",")) == "codegraph,graphify") and all(.external_dependencies[]; ((.package // "") != "" and (.version // "") != ""))' "$TOOLS_JSON")"
assert_eq "required baseline tools are current" "sequential-thinking,context7" "$(jq -r '[.tools[] | select(.required == true) | .id] | join(",")' "$TOOLS_JSON")"
assert_eq "registry categories are mcp only" "true" "$(jq -r 'all(.tools[]; .category == "mcp")' "$TOOLS_JSON")"
assert_eq "optional tools require explicit opt-in" "true" "$(jq -r 'all(.tools[]; (.required == true) or (.opt_in.explicit_consent_required == true))' "$TOOLS_JSON")"
assert_eq "codegraph is explicit opt-in" "true" "$(jq -r '.tools[] | select(.id == "codegraph") | (.required == false and .opt_in.explicit_consent_required == true and .provider_readiness.kind == "code-structure")' "$TOOLS_JSON")"
assert_eq "codegraph installs scoped package with codegraph CLI" "true" "$(jq -r '.tools[] | select(.id == "codegraph") | (.dependency_ref == "codegraph" and (.package // null) == null and (.version // null) == null and .installation.kind == "global-npm" and .installation.unix.command == "npm" and (.installation.unix.args | index("{{package}}@{{version}}") != null) and .installation.verify_command.command == "codegraph")' "$TOOLS_JSON")"
assert_eq "codegraph host config uses mcp server command" "true" "$(jq -r '.tools[] | select(.id == "codegraph") | (.host_config.codex.command == "codegraph" and (.host_config.codex.args | join(" ") == "serve --mcp"))' "$TOOLS_JSON")"
assert_eq "kiro host configs use workspace/user json targets" "true" "$(jq -r 'all(.tools[]; (.host_config.kiro.scope == "workspace") and (.host_config.kiro.targets.workspace.config_path == ".kiro/settings/mcp.json") and (.host_config.kiro.targets.workspace.config_format == "json") and (.host_config.kiro.targets.user.config_path == "$HOME/.kiro/settings/mcp.json") and (.host_config.kiro.targets.user.config_format == "json") and (.host_config.kiro.targets.user.requires_user_scope_opt_in == true) and (.host_config.kiro.fallback_order == ["workspace"]))' "$TOOLS_JSON")"
assert_eq "codegraph project bootstrap runs init and status" "true" "$(jq -r '.tools[] | select(.id == "codegraph") | (.project_bootstrap.required == true and .project_bootstrap.unix.command == "codegraph" and (.project_bootstrap.unix.args | index("init") != null) and .project_bootstrap.status_probe.command == "codegraph" and (.project_bootstrap.status_probe.args | index("status") != null))' "$TOOLS_JSON")"
assert_eq "summary includes project bootstrap column" "true" "$(jq -r '.summary_columns | index("project_bootstrap") != null' "$TOOLS_JSON")"

while IFS= read -r script_path; do
  bash -n "$script_path"
done < <(find "$SCRIPTS_DIR" -name '*.sh' -type f | sort)
pass_count=$((pass_count + 1))

assert "bash install-mcp gates optional tools" grep -q 'optional_tool_allowed' "$SCRIPTS_DIR/install-mcp.sh"
assert "bash install-mcp keeps registry_not_required for ungated optional tools" grep -q 'registry_not_required' "$SCRIPTS_DIR/install-mcp.sh"
assert "bash configure-host guards optional clobber" grep -q 'SPEC_FIRST_MCP_CONFIGURE_OVERWRITE' "$SCRIPTS_DIR/configure-host.sh"
assert "bash detect-tools branches on config format" grep -q 'host_uses_json_config' "$SCRIPTS_DIR/detect-tools.sh"
assert "bash configure-host rejects unknown host explicitly" grep -q '无法识别宿主' "$SCRIPTS_DIR/configure-host.sh"
assert "bash uninstall-mcp pre-scans user scope before host detection" grep -q 'for arg in "$@"; do' "$SCRIPTS_DIR/uninstall-mcp.sh"
assert "bash install-helpers accepts requirement workspace" grep -q -- '--requirement-workspace' "$SCRIPTS_DIR/install-helpers.sh"
assert "bash install-helpers accepts Kiro provider host" grep -q -- 'claude|codex|kiro' "$SCRIPTS_DIR/install-helpers.sh"
assert "bash install-helpers detects Kiro project Graphify skill" grep -q -- '.kiro/skills/graphify/SKILL.md' "$SCRIPTS_DIR/install-helpers.sh"
assert "bash provider readiness detects Kiro project skills" grep -q -- ".kiro', 'skills', providerId" "$SCRIPTS_DIR/provider-readiness-renderer.cjs"
assert "bash check-health detects Kiro global skills" grep -q -- '.kiro/skills/$skill_name/SKILL.md' "$SCRIPTS_DIR/check-health"
assert "bash install-helpers gates mcp-tools schema before dependency reads" grep -q -- 'require_mcp_tools_schema_version 7 "$MCP_TOOLS_JSON"' "$SCRIPTS_DIR/install-helpers.sh"
assert "bash install-helpers reads Graphify version from mcp-tools" grep -q -- 'external_dependency_field graphify version' "$SCRIPTS_DIR/install-helpers.sh"
assert "bash install-helpers installs Graphify CLI with uv tool force pin" grep -q -- 'uv tool install --force "$GRAPHIFY_PACKAGE==$GRAPHIFY_VERSION_PIN"' "$SCRIPTS_DIR/install-helpers.sh"
assert "bash install-helpers captures original PATH for Graphify visibility" grep -q -- 'SPEC_FIRST_PROVIDER_ORIGINAL_PATH' "$SCRIPTS_DIR/install-helpers.sh"
assert "bash install-helpers resolves Graphify CLI before invocation" grep -q -- 'resolve_graphify_cli' "$SCRIPTS_DIR/install-helpers.sh"
assert "bash install-helpers normalizes provider-written Graphify instructions" grep -q -- 'normalize_graphify_instruction_section "$repo_root" "$platform"' "$SCRIPTS_DIR/install-helpers.sh"
assert "bash install-helpers invokes resolved Graphify project skill install" grep -q -- 'run_graphify_with_timeout "$DEFAULT_STAGE_TIMEOUT_SECONDS" install --project --platform "$platform"' "$SCRIPTS_DIR/install-helpers.sh"
assert "bash install-helpers invokes resolved Graphify extract" grep -q -- 'run_graphify_with_timeout "$DEFAULT_STAGE_TIMEOUT_SECONDS" extract .' "$SCRIPTS_DIR/install-helpers.sh"
assert "bash install-helpers captures code-only Graphify update output" grep -q -- 'run_graphify_capture "$DEFAULT_STAGE_TIMEOUT_SECONDS" update .' "$SCRIPTS_DIR/install-helpers.sh"
assert "bash install-helpers retries Graphify force overwrite after provider hint" grep -q -- 'run_graphify_capture "$DEFAULT_STAGE_TIMEOUT_SECONDS" update . --force' "$SCRIPTS_DIR/install-helpers.sh"
assert "bash install-helpers invokes resolved Graphify hook install" grep -q -- 'run_graphify_with_timeout "$DEFAULT_STAGE_TIMEOUT_SECONDS" hook install' "$SCRIPTS_DIR/install-helpers.sh"
assert "bash install-helpers repairs off-PATH Graphify hooks before status" grep -q -- 'repair_graphify_hook_path_visibility "$repo_root"' "$SCRIPTS_DIR/install-helpers.sh"
assert "bash install-helpers invokes resolved Graphify hook status" grep -q -- 'run_graphify_with_timeout "$DEFAULT_STAGE_TIMEOUT_SECONDS" hook status' "$SCRIPTS_DIR/install-helpers.sh"
assert "bash install-helpers invokes resolved Graphify query probe" grep -q -- 'run_graphify_with_timeout "$DEFAULT_STAGE_TIMEOUT_SECONDS" query "spec-first setup readiness" --graph "$graph_json"' "$SCRIPTS_DIR/install-helpers.sh"
assert "bash install-helpers probes existing Graphify artifact before provider rendering" grep -q -- 'probe_graphify_query_for_existing_artifact_if_available' "$SCRIPTS_DIR/install-helpers.sh"
assert "bash install-helpers verify-only probe requires pinned Graphify CLI" grep -q -- 'resolve_graphify_cli_matching_pin >/dev/null 2>&1 || return 0' "$SCRIPTS_DIR/install-helpers.sh"
assert "bash install-helpers uses short Graphify query probe timeout" grep -q -- 'PROBE_TIMEOUT_SECONDS="${SPEC_FIRST_PROBE_TIMEOUT_SECONDS:-30}"' "$SCRIPTS_DIR/install-helpers.sh"
assert "bash install-helpers overrides stage timeout for verify-only Graphify probe" grep -q -- 'DEFAULT_STAGE_TIMEOUT_SECONDS="$PROBE_TIMEOUT_SECONDS" probe_graphify_query_if_available' "$SCRIPTS_DIR/install-helpers.sh"
assert "bash install-helpers preserves install-produced Graphify query fact" grep -q -- '[ -z "${SPEC_FIRST_PROVIDER_GRAPHIFY_QUERY_VERIFIED+x}" ] || return 0' "$SCRIPTS_DIR/install-helpers.sh"
assert "bash install-helpers gates hook on first generation" grep -q -- 'graphify_first_generation_ready_for_hook' "$SCRIPTS_DIR/install-helpers.sh"
assert "bash install-helpers normalizes away ordinary workflow Graphify refresh" grep -q -- 'Ordinary workflows do not refresh project graphs after code changes' "$SCRIPTS_DIR/install-helpers.sh"
for token in \
  'Use Graphify as exploration-tier orientation' \
  'architecture relationships' \
  'cross-file relationships' \
  'impact analysis' \
  'broad codebase navigation' \
  'reading source first is always valid' \
  'Use `query` for broad orientation' \
  'scoped candidate subgraph' \
  'Do not use Graphify by default' \
  'simple factual Q&A' \
  'current conversation or context summaries' \
  'single-document summarization/editing' \
  'already-scoped file reads' \
  'provider_untrusted'; do
  assert "bash install-helpers Graphify instruction contains token: $token" grep -q -- "$token" "$SCRIPTS_DIR/install-helpers.sh"
done
if grep -q 'Use Graphify first only' "$SCRIPTS_DIR/install-helpers.sh"; then
  fail "install-helpers must not normalize Graphify to hard first-call routing"
fi
if grep -q 'For codebase questions, first use Graphify' "$SCRIPTS_DIR/install-helpers.sh"; then
  fail "install-helpers must not normalize Graphify to broad all-codebase-question trigger"
fi
if grep -q 'After modifying code, run `"<resolved-graphify>" update .`' "$SCRIPTS_DIR/install-helpers.sh"; then
  fail "install-helpers must not normalize provider instructions to ordinary workflow graph refresh"
fi
assert "bash install-mcp syncs pending CodeGraph status" grep -q -- 'codegraph sync' "$SCRIPTS_DIR/install-mcp.sh"
assert "bash install-mcp detects CodeGraph full reindex advisory" grep -q -- 'codegraph_status_requests_full_reindex' "$SCRIPTS_DIR/install-mcp.sh"
assert "bash install-mcp can run bounded CodeGraph full reindex" grep -q -- 'codegraph index -f' "$SCRIPTS_DIR/install-mcp.sh"
assert "bash install-mcp treats degraded child results as partial all-repos summary" grep -q -- '.status != "ready"' "$SCRIPTS_DIR/install-mcp.sh"
assert "setup plan renderer reads registry from skill mirror" grep -q -- "const SKILL_DIR = path.resolve(__dirname, '..')" "$SCRIPTS_DIR/setup-plan-renderer.cjs"
assert "setup plan renderer discloses Graphify force repair" grep -q -- 'graphify update . --force repair' "$SCRIPTS_DIR/setup-plan-renderer.cjs"
assert "setup plan renderer discloses CodeGraph full reindex repair" grep -q -- 'one codegraph index -f repair' "$SCRIPTS_DIR/setup-plan-renderer.cjs"
if grep -q '.spec-first/workspace/providers/graphify/graphify-out' "$SCRIPTS_DIR/install-helpers.sh"; then
  fail "install-helpers must not use old .spec-first Graphify artifact root"
fi
if grep -q 'uvx --from graphifyy==' "$SCRIPTS_DIR/install-helpers.sh"; then
  fail "install-helpers must not create workspace-local uvx wrapper for Graphify"
fi

TMP_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/spec-first-mcp-setup.XXXXXX")"
trap 'rm -rf "$TMP_ROOT"' EXIT

REPO_KIRO="$TMP_ROOT/repo-kiro"
KIRO_HOME="$TMP_ROOT/home-kiro"
mkdir -p "$REPO_KIRO" "$KIRO_HOME"
printf '{"name":"repo-kiro"}\n' > "$REPO_KIRO/package.json"

kiro_detect="$(cd "$REPO_KIRO" && MCP_SETUP_HOST=kiro HOME="$KIRO_HOME" bash "$SCRIPTS_DIR/detect-host.sh")"
assert_eq "kiro detect host" "kiro" "$(jq -r '.host' <<<"$kiro_detect")"
assert_eq "kiro detect default scope" "workspace" "$(jq -r '.selected_scope' <<<"$kiro_detect")"
assert_eq "kiro detect default config format" "json" "$(jq -r '.config_format' <<<"$kiro_detect")"
assert_eq "kiro detect default workspace path" ".kiro/settings/mcp.json" "$(jq -r '.config_path' <<<"$kiro_detect")"

kiro_user_detect="$(cd "$REPO_KIRO" && MCP_SETUP_HOST=kiro KIRO_USER_SCOPE=1 HOME="$KIRO_HOME" bash "$SCRIPTS_DIR/detect-host.sh")"
assert_eq "kiro detect user-scope opt-in selects user" "user" "$(jq -r '.selected_scope' <<<"$kiro_user_detect")"
assert_eq "kiro detect user-scope path" "$KIRO_HOME/.kiro/settings/mcp.json" "$(jq -r '.config_path' <<<"$kiro_user_detect")"

kiro_configure_output="$(cd "$REPO_KIRO" && MCP_SETUP_HOST=kiro HOME="$KIRO_HOME" bash "$SCRIPTS_DIR/configure-host.sh" --tool sequential-thinking)"
assert_eq "kiro configure default selected scope" "workspace" "$(jq -r '.selected_scope' <<<"$kiro_configure_output")"
assert "kiro configure writes workspace mcp json" test -f "$REPO_KIRO/.kiro/settings/mcp.json"
assert_eq "kiro configure writes top-level mcpServers" "true" "$(jq -r 'has("mcpServers") and (.mcpServers["sequential-thinking"].command == "npx")' "$REPO_KIRO/.kiro/settings/mcp.json")"
assert "kiro configure default does not write user config" test ! -f "$KIRO_HOME/.kiro/settings/mcp.json"

jq '.mcpServers.existing = {"command":"node","args":["server.js"]}' "$REPO_KIRO/.kiro/settings/mcp.json" > "$REPO_KIRO/.kiro/settings/mcp.json.next"
mv "$REPO_KIRO/.kiro/settings/mcp.json.next" "$REPO_KIRO/.kiro/settings/mcp.json"
(cd "$REPO_KIRO" && MCP_SETUP_HOST=kiro HOME="$KIRO_HOME" bash "$SCRIPTS_DIR/configure-host.sh" --tool context7 >/dev/null)
assert_eq "kiro configure preserves unrelated servers" "true" "$(jq -r '(.mcpServers.existing.command == "node") and (.mcpServers.context7.command == "npx") and (.mcpServers["sequential-thinking"].command == "npx")' "$REPO_KIRO/.kiro/settings/mcp.json")"

kiro_detect_tools="$(cd "$REPO_KIRO" && MCP_SETUP_HOST=kiro HOME="$KIRO_HOME" bash "$SCRIPTS_DIR/detect-tools.sh" --folder "$REPO_KIRO")"
assert_eq "kiro detect-tools reads json host config" "ready,ready" "$(jq -r '[.tools["sequential-thinking"].host_config_status, .tools.context7.host_config_status] | join(",")' <<<"$kiro_detect_tools")"

REPO_KIRO_BAD="$TMP_ROOT/repo-kiro-bad"
mkdir -p "$REPO_KIRO_BAD/.kiro/settings"
printf '{"name":"repo-kiro-bad"}\n' > "$REPO_KIRO_BAD/package.json"
printf '{not-json\n' > "$REPO_KIRO_BAD/.kiro/settings/mcp.json"
set +e
bad_output="$(cd "$REPO_KIRO_BAD" && MCP_SETUP_HOST=kiro HOME="$KIRO_HOME" bash "$SCRIPTS_DIR/configure-host.sh" --tool sequential-thinking 2>&1)"
bad_status=$?
set -e
assert_eq "kiro invalid json configure fails" "1" "$bad_status"
assert_eq "kiro invalid json is not overwritten" "{not-json" "$(cat "$REPO_KIRO_BAD/.kiro/settings/mcp.json")"

REPO_KIRO_USER="$TMP_ROOT/repo-kiro-user"
KIRO_USER_HOME="$TMP_ROOT/home-kiro-user"
mkdir -p "$REPO_KIRO_USER" "$KIRO_USER_HOME"
printf '{"name":"repo-kiro-user"}\n' > "$REPO_KIRO_USER/package.json"
(cd "$REPO_KIRO_USER" && MCP_SETUP_HOST=kiro HOME="$KIRO_USER_HOME" bash "$SCRIPTS_DIR/configure-host.sh" --tool context7 --user-scope >/dev/null)
assert "kiro user-scope writes user config" test -f "$KIRO_USER_HOME/.kiro/settings/mcp.json"
assert "kiro user-scope does not write workspace config" test ! -f "$REPO_KIRO_USER/.kiro/settings/mcp.json"
(cd "$REPO_KIRO_USER" && MCP_SETUP_HOST=kiro HOME="$KIRO_USER_HOME" bash "$SCRIPTS_DIR/uninstall-mcp.sh" --tool context7 >/dev/null)
assert_eq "kiro uninstall without user-scope preserves user config" "true" "$(jq -r '.mcpServers.context7 != null' "$KIRO_USER_HOME/.kiro/settings/mcp.json")"
(cd "$REPO_KIRO_USER" && MCP_SETUP_HOST=kiro HOME="$KIRO_USER_HOME" bash "$SCRIPTS_DIR/uninstall-mcp.sh" --tool context7 --user-scope >/dev/null)
assert_eq "kiro uninstall user-scope removes user config entry" "false" "$(jq -r '.mcpServers.context7 != null' "$KIRO_USER_HOME/.kiro/settings/mcp.json")"

REPO_A="$TMP_ROOT/repo-a"
mkdir -p "$REPO_A"
printf '{"name":"repo-a"}\n' > "$REPO_A/package.json"
FACTS_FILE="$TMP_ROOT/facts.json"
cat > "$FACTS_FILE" <<JSON
{
  "repo_status": "git-repo",
  "repo_root": "$REPO_A",
  "host": "codex",
  "platform": "macos",
  "baseline_ready": true,
  "host_runtime_ready": true,
  "generated_runtime_manifest": {
    "status": "current",
    "recorded_manifest_version": "1.11.0",
    "bundled_manifest_version": "1.11.0",
    "evidence_basis": "state.manifestVersion vs bundled manifest.version"
  },
  "tools": {
    "context7": {
      "status": "ready"
    }
  },
  "helper_tools": {
    "node": {
      "status": "ready"
    }
  },
  "target": {
    "target_kind": "git-repo",
    "target_root": "$REPO_A",
    "workspace_root": "$REPO_A",
    "state_write_allowed": true,
    "reason_code": "explicit-repo-target"
  },
  "host_ledger_pointer": {
    "host": "codex",
    "path": "$TMP_ROOT/ledger.json"
  }
}
JSON

setup_output="$(bash "$WRITE_SETUP_FACTS" --facts-file "$FACTS_FILE")"
assert_eq "setup writer reason" "setup-facts-ready" "$(jq -r '.reason_code' <<<"$setup_output")"
assert "tool facts file exists" test -f "$REPO_A/.spec-first/config/tool-facts.json"
assert "runtime facts file exists" test -f "$REPO_A/.spec-first/config/runtime-capabilities.json"
assert_eq "tool facts schema" "tool-facts.v2" "$(jq -r '.schema_version' "$REPO_A/.spec-first/config/tool-facts.json")"
assert_eq "tool facts keeps legacy mcp map" "ready" "$(jq -r '.tools.context7.status' "$REPO_A/.spec-first/config/tool-facts.json")"
assert_eq "tool facts exposes items array" "true" "$(jq -r '(.items | type == "array") and any(.items[]; .id == "context7")' "$REPO_A/.spec-first/config/tool-facts.json")"
assert_eq "tool facts exposes configured dependency scan" "true" "$(jq -r '.configured_dependencies | type == "array"' "$REPO_A/.spec-first/config/tool-facts.json")"
assert_eq "tool facts exposes schema capabilities" "true" "$(jq -r '.schema_capabilities | index("items") != null and index("configured_dependencies") != null and index("tool-existence") != null' "$REPO_A/.spec-first/config/tool-facts.json")"
assert_eq "runtime facts schema" "runtime-capabilities.v1" "$(jq -r '.schema_version' "$REPO_A/.spec-first/config/runtime-capabilities.json")"
assert_eq "direct evidence facts are available" "true" "$(jq -r '.direct_evidence.bounded_source_reads and .direct_evidence.ripgrep and .direct_evidence.git_diff' "$REPO_A/.spec-first/config/runtime-capabilities.json")"
assert_eq "runtime facts preserve generated runtime manifest health" "current" "$(jq -r '.setup_summary.generated_runtime_manifest.status' "$REPO_A/.spec-first/config/runtime-capabilities.json")"

REPO_CONFLICT="$TMP_ROOT/repo-conflict"
mkdir -p "$REPO_CONFLICT"
printf '{"name":"repo-conflict"}\n' > "$REPO_CONFLICT/package.json"
CONFLICT_FACTS="$TMP_ROOT/conflict-facts.json"
cat > "$CONFLICT_FACTS" <<JSON
{
  "repo_status": "git-repo",
  "repo_root": "$REPO_CONFLICT",
  "host": "claude",
  "platform": "macos",
  "tools": {
    "context7": {
      "dependency_status": "ready",
      "host_config_status": "action-required",
      "result": "ready",
      "reason_code": "ready",
      "next_action": "configure host"
    }
  },
  "target": {
    "target_kind": "git-repo",
    "target_root": "$REPO_CONFLICT",
    "workspace_root": "$REPO_CONFLICT",
    "state_write_allowed": true,
    "reason_code": "explicit-repo-target"
  }
}
JSON
conflict_output="$(bash "$WRITE_SETUP_FACTS" --facts-file "$CONFLICT_FACTS")"
assert_eq "conflict writer reason" "setup-facts-ready" "$(jq -r '.reason_code' <<<"$conflict_output")"
assert_eq "tool facts repairs contradictory ready result" "action-required" "$(jq -r '.items[] | select(.id == "context7") | .result' "$REPO_CONFLICT/.spec-first/config/tool-facts.json")"
assert_eq "tool facts repairs contradictory ready reason" "host-config-action-required" "$(jq -r '.items[] | select(.id == "context7") | .reason_code' "$REPO_CONFLICT/.spec-first/config/tool-facts.json")"

REPO_DRIFT="$TMP_ROOT/repo-drift"
DRIFT_HOME="$TMP_ROOT/home-drift"
MANAGED_PARENT="$TMP_ROOT/managed-readonly"
MANAGED_PATH="$MANAGED_PARENT/managed-mcp.json"
mkdir -p "$REPO_DRIFT" "$DRIFT_HOME" "$MANAGED_PARENT"
printf '{"name":"repo-drift"}\n' > "$REPO_DRIFT/package.json"
git -C "$REPO_DRIFT" init >/dev/null
cat > "$DRIFT_HOME/.claude.json" <<JSON
{
  "mcpServers": {
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    },
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    }
  }
}
JSON
touch "$MANAGED_PATH"
chmod 500 "$MANAGED_PARENT"
chmod 400 "$MANAGED_PATH"
drift_output="$(MCP_SETUP_HOST=claude HOME="$DRIFT_HOME" MCP_SETUP_CLAUDE_MANAGED_PATH_OVERRIDE="$MANAGED_PATH" bash "$SCRIPTS_DIR/detect-tools.sh" --repo "$REPO_DRIFT")"
chmod 700 "$MANAGED_PARENT"
assert_eq "@latest drift is non-blocking host status" "registry-args-drift,registry-args-drift" "$(jq -r '[.tools["sequential-thinking"].host_config_status, .tools.context7.host_config_status] | join(",")' <<<"$drift_output")"
assert_eq "@latest drift is reported as degraded" "degraded,degraded" "$(jq -r '[.tools["sequential-thinking"].result, .tools.context7.result] | join(",")' <<<"$drift_output")"
assert_eq "@latest drift records version reason" "host-config-version-drift,host-config-version-drift" "$(jq -r '[.tools["sequential-thinking"].reason_code, .tools.context7.reason_code] | join(",")' <<<"$drift_output")"
assert_eq "@latest drift has no configure-host action" "true" "$(jq -r '(.tools["sequential-thinking"].next_action == "") and (.tools.context7.next_action == "")' <<<"$drift_output")"
assert_eq "optional codegraph does not request setup when unselected" "optional-capability-not-selected" "$(jq -r '.tools.codegraph.reason_code' <<<"$drift_output")"
assert_eq "optional codegraph is non-baseline-blocking" "false" "$(jq -r '.tools.codegraph.baseline_blocking' <<<"$drift_output")"

REPO_SYMLINK="$TMP_ROOT/repo-symlink"
OUTSIDE_CONFIG="$TMP_ROOT/outside-config"
mkdir -p "$REPO_SYMLINK/.spec-first" "$OUTSIDE_CONFIG"
ln -s "$OUTSIDE_CONFIG" "$REPO_SYMLINK/.spec-first/config"
SYMLINK_FACTS="$TMP_ROOT/symlink-facts.json"
cat > "$SYMLINK_FACTS" <<JSON
{
  "repo_status": "git-repo",
  "repo_root": "$REPO_SYMLINK",
  "target": {
    "target_kind": "git-repo",
    "target_root": "$REPO_SYMLINK",
    "state_write_allowed": true
  }
}
JSON
symlink_output="$(bash "$WRITE_SETUP_FACTS" --facts-file "$SYMLINK_FACTS")"
assert_eq "setup writer blocks symlinked config" "project-config-symlink-escape" "$(jq -r '.reason_code' <<<"$symlink_output")"
assert "symlink target remains empty" test ! -f "$OUTSIDE_CONFIG/tool-facts.json"

git -C "$REPO_A" init >/dev/null
git -C "$REPO_A" config user.email "test@example.com"
git -C "$REPO_A" config user.name "Spec Test"
git -C "$REPO_A" add package.json .spec-first/config/tool-facts.json .spec-first/config/runtime-capabilities.json
git -C "$REPO_A" commit --no-verify -m "initial" >/dev/null
printf 'changed\n' > "$REPO_A/src.txt"

fingerprint_output="$(node "$SPEC_FIRST_CLI" internal compute-scenario-fingerprint --layer setup --workspace-root "$REPO_A")"
assert_eq "scenario fingerprint setup schema" "developer-scenario-fingerprint-setup.v1" "$(jq -r '.schema_version' <<<"$fingerprint_output")"
assert_eq "scenario fingerprint uses source dirty field" "true" "$(jq -r '.complexity_dimensions | has("worktree_dirty_source_affecting")' <<<"$fingerprint_output")"
assert_eq "dirty path sample uses source flag" "true" "$(jq -r '([.worktree.dirty_paths_sample[]? | has("source_affecting")] | all)' <<<"$fingerprint_output")"

echo "mcp-setup unit checks passed: $pass_count"
