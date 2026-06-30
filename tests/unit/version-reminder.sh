#!/bin/bash
# version reminder unit tests
# Tests version comparison, reminder formatting, helper behavior, and CLI wiring

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

pass=0
fail=0

assert() {
  local desc="$1"
  shift
  if "$@" >/dev/null 2>&1; then
    pass=$((pass + 1))
  else
    echo "  ✗ $desc"
    fail=$((fail + 1))
  fi
}

assert_output() {
  local desc="$1"
  local expected="$2"
  local actual="$3"
  if [ "$expected" = "$actual" ]; then
    pass=$((pass + 1))
  else
    echo "  ✗ $desc: expected '$expected', got '$actual'"
    fail=$((fail + 1))
  fi
}

assert_contains() {
  local desc="$1"
  local needle="$2"
  local haystack="$3"
  if printf '%s' "$haystack" | grep -qF -- "$needle"; then
    pass=$((pass + 1))
  else
    echo "  ✗ $desc: '$needle' not found in output"
    fail=$((fail + 1))
  fi
}

assert_not_contains() {
  local desc="$1"
  local needle="$2"
  local haystack="$3"
  if ! printf '%s' "$haystack" | grep -qF -- "$needle"; then
    pass=$((pass + 1))
  else
    echo "  ✗ $desc: '$needle' should not be in output"
    fail=$((fail + 1))
  fi
}

echo "=== version reminder unit tests ==="
echo ""

echo "1. version comparison"
comparison_output="$(
  node - "$REPO_ROOT" <<'EOF'
const path = require('node:path');
const repoRoot = process.argv[2];
const {
  shouldNotifyVersionReminder,
} = require(path.join(repoRoot, 'src/cli/version-reminder'));

process.stdout.write(JSON.stringify({
  equal: shouldNotifyVersionReminder('1.4.0', '1.4.0'),
  older: shouldNotifyVersionReminder('1.4.0', '1.4.1'),
  prerelease: shouldNotifyVersionReminder('1.4.0-beta.1', '1.4.0'),
  invalid: shouldNotifyVersionReminder('invalid', '1.4.0'),
}));
EOF
)"
comparison_equal=$(node -e "const data = JSON.parse(process.argv[1]); process.stdout.write(String(data.equal));" "$comparison_output")
comparison_older=$(node -e "const data = JSON.parse(process.argv[1]); process.stdout.write(String(data.older));" "$comparison_output")
comparison_prerelease=$(node -e "const data = JSON.parse(process.argv[1]); process.stdout.write(String(data.prerelease));" "$comparison_output")
comparison_invalid=$(node -e "const data = JSON.parse(process.argv[1]); process.stdout.write(String(data.invalid));" "$comparison_output")
assert_output "equal versions do not notify" "false" "$comparison_equal"
assert_output "older version notifies" "true" "$comparison_older"
assert_output "prerelease notifies for release" "true" "$comparison_prerelease"
assert_output "invalid version is ignored" "false" "$comparison_invalid"

echo "1b. timeout resolution"
timeout_output="$(
  node - "$REPO_ROOT" <<'EOF'
const path = require('node:path');
const repoRoot = process.argv[2];
const {
  DEFAULT_VERSION_REMINDER_TIMEOUT_MS,
  resolveVersionReminderTimeoutMs,
} = require(path.join(repoRoot, 'src/cli/version-reminder'));

function withEnv(value, fn) {
  const had = Object.prototype.hasOwnProperty.call(process.env, 'SPEC_FIRST_VERSION_REMINDER_TIMEOUT_MS');
  const prev = process.env.SPEC_FIRST_VERSION_REMINDER_TIMEOUT_MS;
  if (value === undefined) {
    delete process.env.SPEC_FIRST_VERSION_REMINDER_TIMEOUT_MS;
  } else {
    process.env.SPEC_FIRST_VERSION_REMINDER_TIMEOUT_MS = value;
  }
  try {
    return fn();
  } finally {
    if (had) {
      process.env.SPEC_FIRST_VERSION_REMINDER_TIMEOUT_MS = prev;
    } else {
      delete process.env.SPEC_FIRST_VERSION_REMINDER_TIMEOUT_MS;
    }
  }
}

process.stdout.write(JSON.stringify({
  defaultConst: DEFAULT_VERSION_REMINDER_TIMEOUT_MS,
  unset: withEnv(undefined, () => resolveVersionReminderTimeoutMs()),
  override: withEnv('5000', () => resolveVersionReminderTimeoutMs()),
  invalid: withEnv('abc', () => resolveVersionReminderTimeoutMs()),
  zero: withEnv('0', () => resolveVersionReminderTimeoutMs()),
  negative: withEnv('-1', () => resolveVersionReminderTimeoutMs()),
}));
EOF
)"
timeout_default=$(node -e "const d = JSON.parse(process.argv[1]); process.stdout.write(String(d.defaultConst));" "$timeout_output")
timeout_unset=$(node -e "const d = JSON.parse(process.argv[1]); process.stdout.write(String(d.unset));" "$timeout_output")
timeout_override=$(node -e "const d = JSON.parse(process.argv[1]); process.stdout.write(String(d.override));" "$timeout_output")
timeout_invalid=$(node -e "const d = JSON.parse(process.argv[1]); process.stdout.write(String(d.invalid));" "$timeout_output")
timeout_zero=$(node -e "const d = JSON.parse(process.argv[1]); process.stdout.write(String(d.zero));" "$timeout_output")
timeout_negative=$(node -e "const d = JSON.parse(process.argv[1]); process.stdout.write(String(d.negative));" "$timeout_output")
assert_output "default timeout is 2000ms (not 350)" "2000" "$timeout_default"
assert_output "unset env falls back to default" "2000" "$timeout_unset"
assert_output "valid env override is used" "5000" "$timeout_override"
assert_output "invalid env falls back to default" "2000" "$timeout_invalid"
assert_output "zero env falls back to default" "2000" "$timeout_zero"
assert_output "negative env falls back to default" "2000" "$timeout_negative"

echo "2. reminder formatting"
formatted_output="$(
  node - "$REPO_ROOT" <<'EOF'
const path = require('node:path');
const repoRoot = process.argv[2];
const { formatVersionReminder } = require(path.join(repoRoot, 'src/cli/version-reminder'));

process.stdout.write(formatVersionReminder({
  packageName: 'spec-first',
  currentVersion: '1.4.0',
  latestVersion: '1.4.1',
}));
EOF
)"
assert_contains "formatted reminder names package" "spec-first" "$formatted_output"
assert_contains "formatted reminder includes current version" "1.4.0" "$formatted_output"
assert_contains "formatted reminder includes latest version" "1.4.1" "$formatted_output"
assert_contains "formatted reminder includes update command" "spec-first update" "$formatted_output"
assert_contains "formatted reminder includes opt-out env" "SPEC_FIRST_NO_UPDATE_NOTIFIER=1" "$formatted_output"
assert_not_contains "formatted reminder avoids direct npm install" "npm install -g spec-first@latest" "$formatted_output"

echo "3. maybeShowVersionReminder"
notify_output="$(
  node - "$REPO_ROOT" "$TMP_DIR" <<'EOF'
const path = require('node:path');
const repoRoot = process.argv[2];
const tmpDir = process.argv[3];
const { maybeShowVersionReminder } = require(path.join(repoRoot, 'src/cli/version-reminder'));

(async () => {
  let captured = '';
  const printed = await maybeShowVersionReminder({
    packageName: 'spec-first',
    currentVersion: '1.4.0',
    homeRoot: path.join(tmpDir, 'home-notify'),
    lookupLatestVersion: async () => '1.4.1',
    output: {
      write(chunk) {
        captured += chunk;
      },
    },
  });

  process.stdout.write(JSON.stringify({ printed, captured }));
})();
EOF
)"
notify_printed=$(node -e "const data = JSON.parse(process.argv[1]); process.stdout.write(String(data.printed));" "$notify_output")
notify_captured=$(node -e "const data = JSON.parse(process.argv[1]); process.stdout.write(data.captured);" "$notify_output")
assert_output "outdated version prints a reminder" "true" "$notify_printed"
assert_contains "outdated reminder has update text" "Update available for spec-first" "$notify_captured"
assert_contains "outdated reminder has update command" "spec-first update" "$notify_captured"
assert_contains "outdated reminder has opt-out env" "SPEC_FIRST_NO_UPDATE_NOTIFIER=1" "$notify_captured"
assert_not_contains "outdated reminder avoids direct npm install" "npm install -g spec-first@latest" "$notify_captured"

skip_output="$(
  node - "$REPO_ROOT" "$TMP_DIR" <<'EOF'
const path = require('node:path');
const repoRoot = process.argv[2];
const tmpDir = process.argv[3];
const { maybeShowVersionReminder } = require(path.join(repoRoot, 'src/cli/version-reminder'));

(async () => {
  let captured = '';
  const printed = await maybeShowVersionReminder({
    packageName: 'spec-first',
    currentVersion: '1.4.0',
    homeRoot: path.join(tmpDir, 'home-skip'),
    lookupLatestVersion: async () => '1.4.0',
    output: {
      write(chunk) {
        captured += chunk;
      },
    },
  });

  process.stdout.write(JSON.stringify({ printed, captured }));
})();
EOF
)"
skip_printed=$(node -e "const data = JSON.parse(process.argv[1]); process.stdout.write(String(data.printed));" "$skip_output")
skip_captured=$(node -e "const data = JSON.parse(process.argv[1]); process.stdout.write(data.captured);" "$skip_output")
assert_output "current version does not print a reminder" "false" "$skip_printed"
assert_output "current version prints no output" "" "$skip_captured"

cli_gate_output="$(
  node - "$REPO_ROOT" "$TMP_DIR" <<'EOF'
const fs = require('node:fs');
const path = require('node:path');
const repoRoot = process.argv[2];
const tmpDir = process.argv[3];
const { maybeShowVersionReminder } = require(path.join(repoRoot, 'src/cli/version-reminder'));

(async () => {
  const homeRoot = path.join(tmpDir, 'home-cli-gate');
  const statePath = path.join(homeRoot, '.spec-first', 'version-reminder.json');
  const nowMs = Date.parse('2026-06-21T00:00:00.000Z');
  let calls = 0;
  let captured = '';

  const firstPrinted = await maybeShowVersionReminder({
    packageName: 'spec-first',
    currentVersion: '1.4.0',
    homeRoot,
    nowMs,
    cooldownMs: 1000,
    lookupLatestVersion: async () => {
      calls += 1;
      return '1.4.1';
    },
    output: { write(chunk) { captured += chunk; return true; } },
  });

  const secondPrinted = await maybeShowVersionReminder({
    packageName: 'spec-first',
    currentVersion: '1.4.0',
    homeRoot,
    nowMs: nowMs + 500,
    cooldownMs: 1000,
    lookupLatestVersion: async () => {
      calls += 1;
      return '9.9.9';
    },
    output: { write(chunk) { captured += chunk; return true; } },
  });

  const thirdPrinted = await maybeShowVersionReminder({
    packageName: 'spec-first',
    currentVersion: '1.4.0',
    homeRoot,
    nowMs: nowMs + 1001,
    cooldownMs: 1000,
    lookupLatestVersion: async () => {
      calls += 1;
      return '1.4.1';
    },
    output: { write(chunk) { captured += chunk; return true; } },
  });

  const state = fs.existsSync(statePath) ? fs.readFileSync(statePath, 'utf8') : '';
  process.stdout.write(JSON.stringify({ firstPrinted, secondPrinted, thirdPrinted, calls, captured, state }));
})();
EOF
)"
cli_gate_first=$(node -e "const data = JSON.parse(process.argv[1]); process.stdout.write(String(data.firstPrinted));" "$cli_gate_output")
cli_gate_second=$(node -e "const data = JSON.parse(process.argv[1]); process.stdout.write(String(data.secondPrinted));" "$cli_gate_output")
cli_gate_third=$(node -e "const data = JSON.parse(process.argv[1]); process.stdout.write(String(data.thirdPrinted));" "$cli_gate_output")
cli_gate_calls=$(node -e "const data = JSON.parse(process.argv[1]); process.stdout.write(String(data.calls));" "$cli_gate_output")
cli_gate_state=$(node -e "const data = JSON.parse(process.argv[1]); process.stdout.write(data.state);" "$cli_gate_output")
assert_output "cli reminder first attempt prints" "true" "$cli_gate_first"
assert_output "cli reminder within window suppresses output" "false" "$cli_gate_second"
assert_output "cli reminder after window checks again" "true" "$cli_gate_third"
assert_output "cli reminder within window does not call lookup" "2" "$cli_gate_calls"
assert_contains "cli reminder stores package scope attempt" '"cli.package"' "$cli_gate_state"

cli_clear_gate_output="$(
  node - "$REPO_ROOT" "$TMP_DIR" <<'EOF'
const path = require('node:path');
const repoRoot = process.argv[2];
const tmpDir = process.argv[3];
const {
  clearCliVersionReminderCooldown,
  maybeShowVersionReminder,
} = require(path.join(repoRoot, 'src/cli/version-reminder'));

(async () => {
  const homeRoot = path.join(tmpDir, 'home-cli-clear-gate');
  const nowMs = Date.parse('2026-06-21T00:30:00.000Z');
  let calls = 0;

  const firstPrinted = await maybeShowVersionReminder({
    packageName: 'spec-first',
    currentVersion: '1.4.0',
    homeRoot,
    nowMs,
    cooldownMs: 1000,
    lookupLatestVersion: async () => {
      calls += 1;
      return '1.4.1';
    },
    output: { write() { return true; } },
  });

  clearCliVersionReminderCooldown({ homeRoot });

  const secondPrinted = await maybeShowVersionReminder({
    packageName: 'spec-first',
    currentVersion: '1.4.0',
    homeRoot,
    nowMs: nowMs + 100,
    cooldownMs: 1000,
    lookupLatestVersion: async () => {
      calls += 1;
      return '1.4.1';
    },
    output: { write() { return true; } },
  });

  process.stdout.write(JSON.stringify({ firstPrinted, secondPrinted, calls }));
})();
EOF
)"
cli_clear_first=$(node -e "const data = JSON.parse(process.argv[1]); process.stdout.write(String(data.firstPrinted));" "$cli_clear_gate_output")
cli_clear_second=$(node -e "const data = JSON.parse(process.argv[1]); process.stdout.write(String(data.secondPrinted));" "$cli_clear_gate_output")
cli_clear_calls=$(node -e "const data = JSON.parse(process.argv[1]); process.stdout.write(String(data.calls));" "$cli_clear_gate_output")
assert_output "cli clear starts with printed reminder" "true" "$cli_clear_first"
assert_output "cli clear re-enables reminder within window" "true" "$cli_clear_second"
assert_output "cli clear re-enables lookup within window" "2" "$cli_clear_calls"

cli_failure_gate_output="$(
  node - "$REPO_ROOT" "$TMP_DIR" <<'EOF'
const fs = require('node:fs');
const path = require('node:path');
const repoRoot = process.argv[2];
const tmpDir = process.argv[3];
const { maybeShowVersionReminder } = require(path.join(repoRoot, 'src/cli/version-reminder'));

(async () => {
  const homeRoot = path.join(tmpDir, 'home-cli-failure-gate');
  const statePath = path.join(homeRoot, '.spec-first', 'version-reminder.json');
  const nowMs = Date.parse('2026-06-21T01:00:00.000Z');
  let calls = 0;
  let stateAtLookup = '';

  const firstPrinted = await maybeShowVersionReminder({
    packageName: 'spec-first',
    currentVersion: '1.4.0',
    homeRoot,
    nowMs,
    cooldownMs: 1000,
    lookupLatestVersion: async () => {
      calls += 1;
      stateAtLookup = fs.existsSync(statePath) ? fs.readFileSync(statePath, 'utf8') : '';
      throw new Error('offline');
    },
    output: { write() { return true; } },
  });

  const secondPrinted = await maybeShowVersionReminder({
    packageName: 'spec-first',
    currentVersion: '1.4.0',
    homeRoot,
    nowMs: nowMs + 100,
    cooldownMs: 1000,
    lookupLatestVersion: async () => {
      calls += 1;
      return '9.9.9';
    },
    output: { write() { return true; } },
  });

  process.stdout.write(JSON.stringify({ firstPrinted, secondPrinted, calls, stateAtLookup }));
})();
EOF
)"
cli_failure_first=$(node -e "const data = JSON.parse(process.argv[1]); process.stdout.write(String(data.firstPrinted));" "$cli_failure_gate_output")
cli_failure_second=$(node -e "const data = JSON.parse(process.argv[1]); process.stdout.write(String(data.secondPrinted));" "$cli_failure_gate_output")
cli_failure_calls=$(node -e "const data = JSON.parse(process.argv[1]); process.stdout.write(String(data.calls));" "$cli_failure_gate_output")
cli_failure_state_at_lookup=$(node -e "const data = JSON.parse(process.argv[1]); process.stdout.write(data.stateAtLookup);" "$cli_failure_gate_output")
assert_output "cli reminder failed lookup prints nothing" "false" "$cli_failure_first"
assert_output "cli reminder failed lookup suppresses next attempt in window" "false" "$cli_failure_second"
assert_output "cli reminder failed lookup is attempted once in window" "1" "$cli_failure_calls"
assert_contains "cli reminder writes attempt before lookup failure" '"cli.package"' "$cli_failure_state_at_lookup"

echo "4. startup reminder"
startup_output="$(
  node - "$REPO_ROOT" "$TMP_DIR" <<'EOF'
const fs = require('node:fs');
const path = require('node:path');
const repoRoot = process.argv[2];
const tmpDir = process.argv[3];
const { maybeShowStartupVersionReminder } = require(path.join(repoRoot, 'src/cli/version-reminder'));

(async () => {
  const projectRoot = path.join(tmpDir, 'startup-codex');
  fs.mkdirSync(path.join(projectRoot, '.codex', 'spec-first'), { recursive: true });
  fs.writeFileSync(
    path.join(projectRoot, '.codex', 'spec-first', 'state.json'),
    `${JSON.stringify({ manifestVersion: '1.6.1' })}\n`,
    'utf8',
  );

  let captured = '';
  const printed = await maybeShowStartupVersionReminder({
    host: 'codex',
    projectRoot,
    homeRoot: path.join(tmpDir, 'home-codex'),
    lookupLatestVersion: async () => '1.6.2',
    output: {
      write(chunk) {
        captured += chunk;
        return true;
      },
    },
  });

  process.stdout.write(JSON.stringify({ printed, captured }));
})();
EOF
)"
startup_printed=$(node -e "const data = JSON.parse(process.argv[1]); process.stdout.write(String(data.printed));" "$startup_output")
startup_captured=$(node -e "const data = JSON.parse(process.argv[1]); process.stdout.write(data.captured);" "$startup_output")
assert_output "codex startup reminder prints when runtime is stale" "true" "$startup_printed"
assert_contains "codex startup reminder includes current version" "1.6.1" "$startup_captured"
assert_contains "codex startup reminder includes latest version" "1.6.2" "$startup_captured"
assert_contains "codex startup reminder points to update workflow" 'spec-first update' "$startup_captured"
assert_contains "codex startup reminder states read-only boundary" "will not install, refresh runtime assets, or restart the host" "$startup_captured"
assert_not_contains "codex startup reminder does not install directly" "npm install -g" "$startup_captured"
assert_not_contains "codex startup reminder does not call plugin update" "claude plugin update" "$startup_captured"
assert_not_contains "codex startup reminder does not refresh runtime directly" "spec-first init" "$startup_captured"

claude_startup_output="$(
  node - "$REPO_ROOT" "$TMP_DIR" <<'EOF'
const fs = require('node:fs');
const path = require('node:path');
const repoRoot = process.argv[2];
const tmpDir = process.argv[3];
const { maybeShowStartupVersionReminder } = require(path.join(repoRoot, 'src/cli/version-reminder'));

(async () => {
  const projectRoot = path.join(tmpDir, 'startup-claude');
  fs.mkdirSync(path.join(projectRoot, '.claude', 'spec-first'), { recursive: true });
  fs.writeFileSync(
    path.join(projectRoot, '.claude', 'spec-first', 'state.json'),
    `${JSON.stringify({ manifestVersion: '1.6.1' })}\n`,
    'utf8',
  );

  let captured = '';
  const printed = await maybeShowStartupVersionReminder({
    host: 'claude',
    projectRoot,
    homeRoot: path.join(tmpDir, 'home-claude'),
    lookupLatestVersion: async () => '1.6.2',
    output: {
      write(chunk) {
        captured += chunk;
        return true;
      },
    },
  });

  process.stdout.write(JSON.stringify({ printed, captured }));
})();
EOF
)"
claude_startup_printed=$(node -e "const data = JSON.parse(process.argv[1]); process.stdout.write(String(data.printed));" "$claude_startup_output")
claude_startup_captured=$(node -e "const data = JSON.parse(process.argv[1]); process.stdout.write(data.captured);" "$claude_startup_output")
assert_output "claude startup reminder prints when runtime is stale" "true" "$claude_startup_printed"
assert_contains "claude startup reminder points to update workflow" "spec-first update" "$claude_startup_captured"
assert_contains "claude startup reminder states read-only boundary" "will not install, refresh runtime assets, or restart the host" "$claude_startup_captured"
assert_not_contains "claude startup reminder does not install directly" "npm install -g" "$claude_startup_captured"
assert_not_contains "claude startup reminder does not call plugin update" "claude plugin update" "$claude_startup_captured"
assert_not_contains "claude startup reminder does not refresh runtime directly" "spec-first init" "$claude_startup_captured"

unknown_output="$(
  node - "$REPO_ROOT" "$TMP_DIR" <<'EOF'
const fs = require('node:fs');
const path = require('node:path');
const repoRoot = process.argv[2];
const tmpDir = process.argv[3];
const { maybeShowStartupVersionReminder } = require(path.join(repoRoot, 'src/cli/version-reminder'));

(async () => {
  const projectRoot = path.join(tmpDir, 'startup-unknown');
  fs.mkdirSync(path.join(projectRoot, '.codex', 'spec-first'), { recursive: true });
  fs.mkdirSync(path.join(projectRoot, '.agents', 'skills', 'spec-mcp-setup'), { recursive: true });
  fs.writeFileSync(path.join(projectRoot, '.codex', 'spec-first', 'state.json'), '{"manifestVersion":', 'utf8');

  let captured = '';
  const printed = await maybeShowStartupVersionReminder({
    host: 'codex',
    projectRoot,
    homeRoot: path.join(tmpDir, 'home-unknown'),
    lookupLatestVersion: async () => '1.6.2',
    output: {
      write(chunk) {
        captured += chunk;
        return true;
      },
    },
  });

  process.stdout.write(JSON.stringify({ printed, captured }));
})();
EOF
)"
unknown_printed=$(node -e "const data = JSON.parse(process.argv[1]); process.stdout.write(String(data.printed));" "$unknown_output")
unknown_captured=$(node -e "const data = JSON.parse(process.argv[1]); process.stdout.write(data.captured);" "$unknown_output")
assert_output "malformed runtime state still prints unknown-version reminder" "true" "$unknown_printed"
assert_contains "unknown-version reminder names unknown runtime" "runtime version is unknown" "$unknown_captured"
assert_contains "unknown-version reminder points to update workflow" 'spec-first update' "$unknown_captured"

cooldown_output="$(
  node - "$REPO_ROOT" "$TMP_DIR" <<'EOF'
const fs = require('node:fs');
const path = require('node:path');
const repoRoot = process.argv[2];
const tmpDir = process.argv[3];
const {
  clearStartupVersionReminderCooldown,
  maybeShowStartupVersionReminder,
} = require(path.join(repoRoot, 'src/cli/version-reminder'));

function writeState(projectRoot) {
  fs.mkdirSync(path.join(projectRoot, '.codex', 'spec-first'), { recursive: true });
  fs.writeFileSync(
    path.join(projectRoot, '.codex', 'spec-first', 'state.json'),
    `${JSON.stringify({ manifestVersion: '1.6.1' })}\n`,
    'utf8',
  );
}

(async () => {
  const firstProject = path.join(tmpDir, 'cooldown-a');
  const secondProject = path.join(tmpDir, 'cooldown-b');
  const homeRoot = path.join(tmpDir, 'home-cooldown');
  const nowMs = Date.parse('2026-06-21T02:00:00.000Z');
  let lookupCalls = 0;
  writeState(firstProject);
  writeState(secondProject);

  let first = '';
  const firstPrinted = await maybeShowStartupVersionReminder({
    host: 'codex',
    projectRoot: firstProject,
    homeRoot,
    nowMs,
    cooldownMs: 1000,
    lookupLatestVersion: async () => {
      lookupCalls += 1;
      return '1.6.2';
    },
    output: { write(chunk) { first += chunk; return true; } },
  });

  let second = '';
  const secondPrinted = await maybeShowStartupVersionReminder({
    host: 'codex',
    projectRoot: secondProject,
    homeRoot,
    nowMs: nowMs + 100,
    cooldownMs: 1000,
    lookupLatestVersion: async () => {
      lookupCalls += 1;
      return '1.6.2';
    },
    output: { write(chunk) { second += chunk; return true; } },
  });

  let newer = '';
  const newerPrinted = await maybeShowStartupVersionReminder({
    host: 'codex',
    projectRoot: secondProject,
    homeRoot,
    nowMs: nowMs + 200,
    cooldownMs: 1000,
    lookupLatestVersion: async () => {
      lookupCalls += 1;
      return '1.6.3';
    },
    output: { write(chunk) { newer += chunk; return true; } },
  });

  clearStartupVersionReminderCooldown({ host: 'codex', homeRoot });

  let third = '';
  const thirdPrinted = await maybeShowStartupVersionReminder({
    host: 'codex',
    projectRoot: secondProject,
    homeRoot,
    nowMs: nowMs + 300,
    cooldownMs: 1000,
    lookupLatestVersion: async () => {
      lookupCalls += 1;
      return '1.6.2';
    },
    output: { write(chunk) { third += chunk; return true; } },
  });

  process.stdout.write(JSON.stringify({
    firstPrinted,
    secondPrinted,
    newerPrinted,
    thirdPrinted,
    lookupCalls,
    first,
    second,
    newer,
    third,
  }));
})();
EOF
)"
cooldown_first=$(node -e "const data = JSON.parse(process.argv[1]); process.stdout.write(String(data.firstPrinted));" "$cooldown_output")
cooldown_second=$(node -e "const data = JSON.parse(process.argv[1]); process.stdout.write(String(data.secondPrinted));" "$cooldown_output")
cooldown_newer=$(node -e "const data = JSON.parse(process.argv[1]); process.stdout.write(String(data.newerPrinted));" "$cooldown_output")
cooldown_third=$(node -e "const data = JSON.parse(process.argv[1]); process.stdout.write(String(data.thirdPrinted));" "$cooldown_output")
cooldown_calls=$(node -e "const data = JSON.parse(process.argv[1]); process.stdout.write(String(data.lookupCalls));" "$cooldown_output")
assert_output "first host/version startup reminder prints" "true" "$cooldown_first"
assert_output "same host/version startup reminder is suppressed across projects" "false" "$cooldown_second"
assert_output "newer latest version is suppressed within attempt window" "false" "$cooldown_newer"
assert_output "reset clears startup reminder cooldown" "true" "$cooldown_third"
assert_output "startup reminder within window does not call lookup" "2" "$cooldown_calls"

startup_window_expiry_output="$(
  node - "$REPO_ROOT" "$TMP_DIR" <<'EOF'
const fs = require('node:fs');
const path = require('node:path');
const repoRoot = process.argv[2];
const tmpDir = process.argv[3];
const { maybeShowStartupVersionReminder } = require(path.join(repoRoot, 'src/cli/version-reminder'));

(async () => {
  const projectRoot = path.join(tmpDir, 'startup-window-expiry');
  const homeRoot = path.join(tmpDir, 'home-startup-window-expiry');
  const nowMs = Date.parse('2026-06-21T03:00:00.000Z');
  let calls = 0;
  fs.mkdirSync(path.join(projectRoot, '.codex', 'spec-first'), { recursive: true });
  fs.writeFileSync(
    path.join(projectRoot, '.codex', 'spec-first', 'state.json'),
    `${JSON.stringify({ manifestVersion: '1.6.1' })}\n`,
    'utf8',
  );

  const firstPrinted = await maybeShowStartupVersionReminder({
    host: 'codex',
    projectRoot,
    homeRoot,
    nowMs,
    cooldownMs: 1000,
    lookupLatestVersion: async () => {
      calls += 1;
      return '1.6.2';
    },
    output: { write() { return true; } },
  });

  const secondPrinted = await maybeShowStartupVersionReminder({
    host: 'codex',
    projectRoot,
    homeRoot,
    nowMs: nowMs + 1001,
    cooldownMs: 1000,
    lookupLatestVersion: async () => {
      calls += 1;
      return '1.6.2';
    },
    output: { write() { return true; } },
  });

  process.stdout.write(JSON.stringify({ firstPrinted, secondPrinted, calls }));
})();
EOF
)"
startup_window_expiry_first=$(node -e "const data = JSON.parse(process.argv[1]); process.stdout.write(String(data.firstPrinted));" "$startup_window_expiry_output")
startup_window_expiry_second=$(node -e "const data = JSON.parse(process.argv[1]); process.stdout.write(String(data.secondPrinted));" "$startup_window_expiry_output")
startup_window_expiry_calls=$(node -e "const data = JSON.parse(process.argv[1]); process.stdout.write(String(data.calls));" "$startup_window_expiry_output")
assert_output "startup reminder first attempt before expiry prints" "true" "$startup_window_expiry_first"
assert_output "startup reminder after attempt window checks again" "true" "$startup_window_expiry_second"
assert_output "startup reminder after window calls lookup again" "2" "$startup_window_expiry_calls"

startup_failure_gate_output="$(
  node - "$REPO_ROOT" "$TMP_DIR" <<'EOF'
const fs = require('node:fs');
const path = require('node:path');
const repoRoot = process.argv[2];
const tmpDir = process.argv[3];
const { maybeShowStartupVersionReminder } = require(path.join(repoRoot, 'src/cli/version-reminder'));

(async () => {
  const projectRoot = path.join(tmpDir, 'startup-failure-gate');
  const homeRoot = path.join(tmpDir, 'home-startup-failure-gate');
  const statePath = path.join(homeRoot, '.codex', 'spec-first', 'startup-version-reminder.json');
  const nowMs = Date.parse('2026-06-21T04:00:00.000Z');
  let calls = 0;
  let stateAtLookup = '';
  fs.mkdirSync(path.join(projectRoot, '.codex', 'spec-first'), { recursive: true });
  fs.writeFileSync(
    path.join(projectRoot, '.codex', 'spec-first', 'state.json'),
    `${JSON.stringify({ manifestVersion: '1.6.1' })}\n`,
    'utf8',
  );

  const firstPrinted = await maybeShowStartupVersionReminder({
    host: 'codex',
    projectRoot,
    homeRoot,
    nowMs,
    cooldownMs: 1000,
    lookupLatestVersion: async () => {
      calls += 1;
      stateAtLookup = fs.existsSync(statePath) ? fs.readFileSync(statePath, 'utf8') : '';
      throw new Error('offline');
    },
    output: { write() { return true; } },
  });

  const secondPrinted = await maybeShowStartupVersionReminder({
    host: 'codex',
    projectRoot,
    homeRoot,
    nowMs: nowMs + 100,
    cooldownMs: 1000,
    lookupLatestVersion: async () => {
      calls += 1;
      return '1.6.2';
    },
    output: { write() { return true; } },
  });

  process.stdout.write(JSON.stringify({ firstPrinted, secondPrinted, calls, stateAtLookup }));
})();
EOF
)"
startup_failure_first=$(node -e "const data = JSON.parse(process.argv[1]); process.stdout.write(String(data.firstPrinted));" "$startup_failure_gate_output")
startup_failure_second=$(node -e "const data = JSON.parse(process.argv[1]); process.stdout.write(String(data.secondPrinted));" "$startup_failure_gate_output")
startup_failure_calls=$(node -e "const data = JSON.parse(process.argv[1]); process.stdout.write(String(data.calls));" "$startup_failure_gate_output")
startup_failure_state_at_lookup=$(node -e "const data = JSON.parse(process.argv[1]); process.stdout.write(data.stateAtLookup);" "$startup_failure_gate_output")
assert_output "startup failed lookup prints nothing" "false" "$startup_failure_first"
assert_output "startup failed lookup suppresses next attempt in window" "false" "$startup_failure_second"
assert_output "startup failed lookup is attempted once in window" "1" "$startup_failure_calls"
assert_contains "startup writes attempt before lookup failure" '"startup.codex"' "$startup_failure_state_at_lookup"

scope_split_output="$(
  node - "$REPO_ROOT" "$TMP_DIR" <<'EOF'
const fs = require('node:fs');
const path = require('node:path');
const repoRoot = process.argv[2];
const tmpDir = process.argv[3];
const {
  clearStartupVersionReminderCooldown,
  maybeShowStartupVersionReminder,
  maybeShowVersionReminder,
} = require(path.join(repoRoot, 'src/cli/version-reminder'));

function writeRuntime(projectRoot, host) {
  fs.mkdirSync(path.join(projectRoot, `.${host}`, 'spec-first'), { recursive: true });
  fs.writeFileSync(
    path.join(projectRoot, `.${host}`, 'spec-first', 'state.json'),
    `${JSON.stringify({ manifestVersion: '1.6.1' })}\n`,
    'utf8',
  );
}

(async () => {
  const homeRoot = path.join(tmpDir, 'home-scope-split');
  const codexProject = path.join(tmpDir, 'scope-split-codex');
  const claudeProject = path.join(tmpDir, 'scope-split-claude');
  const nowMs = Date.parse('2026-06-21T05:00:00.000Z');
  let codexStartupCalls = 0;
  let claudeStartupCalls = 0;
  let cliCalls = 0;
  writeRuntime(codexProject, 'codex');
  writeRuntime(claudeProject, 'claude');

  const codexStartupPrinted = await maybeShowStartupVersionReminder({
    host: 'codex',
    projectRoot: codexProject,
    homeRoot,
    nowMs,
    cooldownMs: 1000,
    lookupLatestVersion: async () => {
      codexStartupCalls += 1;
      return '1.6.2';
    },
    output: { write() { return true; } },
  });

  const cliPrinted = await maybeShowVersionReminder({
    packageName: 'spec-first',
    currentVersion: '1.4.0',
    homeRoot,
    nowMs: nowMs + 100,
    cooldownMs: 1000,
    lookupLatestVersion: async () => {
      cliCalls += 1;
      return '1.4.1';
    },
    output: { write() { return true; } },
  });

  const claudeStartupPrinted = await maybeShowStartupVersionReminder({
    host: 'claude',
    projectRoot: claudeProject,
    homeRoot,
    nowMs: nowMs + 200,
    cooldownMs: 1000,
    lookupLatestVersion: async () => {
      claudeStartupCalls += 1;
      return '1.6.2';
    },
    output: { write() { return true; } },
  });

  clearStartupVersionReminderCooldown({ host: 'codex', homeRoot });

  const cliAfterStartupResetPrinted = await maybeShowVersionReminder({
    packageName: 'spec-first',
    currentVersion: '1.4.0',
    homeRoot,
    nowMs: nowMs + 300,
    cooldownMs: 1000,
    lookupLatestVersion: async () => {
      cliCalls += 1;
      return '1.4.1';
    },
    output: { write() { return true; } },
  });

  process.stdout.write(JSON.stringify({
    codexStartupPrinted,
    cliPrinted,
    claudeStartupPrinted,
    cliAfterStartupResetPrinted,
    codexStartupCalls,
    claudeStartupCalls,
    cliCalls,
  }));
})();
EOF
)"
scope_split_codex_startup=$(node -e "const data = JSON.parse(process.argv[1]); process.stdout.write(String(data.codexStartupPrinted));" "$scope_split_output")
scope_split_cli=$(node -e "const data = JSON.parse(process.argv[1]); process.stdout.write(String(data.cliPrinted));" "$scope_split_output")
scope_split_claude_startup=$(node -e "const data = JSON.parse(process.argv[1]); process.stdout.write(String(data.claudeStartupPrinted));" "$scope_split_output")
scope_split_cli_after_reset=$(node -e "const data = JSON.parse(process.argv[1]); process.stdout.write(String(data.cliAfterStartupResetPrinted));" "$scope_split_output")
scope_split_startup_calls=$(node -e "const data = JSON.parse(process.argv[1]); process.stdout.write([data.codexStartupCalls,data.claudeStartupCalls].join(','));" "$scope_split_output")
scope_split_cli_calls=$(node -e "const data = JSON.parse(process.argv[1]); process.stdout.write(String(data.cliCalls));" "$scope_split_output")
assert_output "startup attempt does not suppress cli reminder" "true" "$scope_split_cli"
assert_output "cli attempt does not suppress startup reminder" "true" "$scope_split_claude_startup"
assert_output "startup scope split starts with codex reminder" "true" "$scope_split_codex_startup"
assert_output "startup reset does not clear cli package gate" "false" "$scope_split_cli_after_reset"
assert_output "startup scope split calls each startup lookup once" "1,1" "$scope_split_startup_calls"
assert_output "startup reset leaves cli lookup suppressed" "1" "$scope_split_cli_calls"

future_cooldown_output="$(
  node - "$REPO_ROOT" "$TMP_DIR" <<'EOF'
const fs = require('node:fs');
const path = require('node:path');
const repoRoot = process.argv[2];
const tmpDir = process.argv[3];
const { maybeShowStartupVersionReminder } = require(path.join(repoRoot, 'src/cli/version-reminder'));

(async () => {
  const projectRoot = path.join(tmpDir, 'future-cooldown');
  const homeRoot = path.join(tmpDir, 'home-future-cooldown');
  fs.mkdirSync(path.join(projectRoot, '.codex', 'spec-first'), { recursive: true });
  fs.writeFileSync(
    path.join(projectRoot, '.codex', 'spec-first', 'state.json'),
    `${JSON.stringify({ manifestVersion: '1.6.1' })}\n`,
    'utf8',
  );
  fs.mkdirSync(path.join(homeRoot, '.codex', 'spec-first'), { recursive: true });
  fs.writeFileSync(
    path.join(homeRoot, '.codex', 'spec-first', 'startup-version-reminder.json'),
    `${JSON.stringify({
      reminders: {
        'codex|1.6.1|1.6.2': {
          host: 'codex',
          currentVersion: '1.6.1',
          latestVersion: '1.6.2',
          shownAt: '2999-01-01T00:00:00.000Z',
        },
      },
    })}\n`,
    'utf8',
  );

  let captured = '';
  const printed = await maybeShowStartupVersionReminder({
    host: 'codex',
    projectRoot,
    homeRoot,
    nowMs: Date.parse('2026-04-30T00:00:00.000Z'),
    lookupLatestVersion: async () => '1.6.2',
    output: { write(chunk) { captured += chunk; return true; } },
  });
  process.stdout.write(JSON.stringify({ printed, captured }));
})();
EOF
)"
future_cooldown_printed=$(node -e "const data = JSON.parse(process.argv[1]); process.stdout.write(String(data.printed));" "$future_cooldown_output")
future_cooldown_captured=$(node -e "const data = JSON.parse(process.argv[1]); process.stdout.write(data.captured);" "$future_cooldown_output")
assert_output "future-dated cooldown does not suppress stale reminder" "true" "$future_cooldown_printed"
assert_contains "future-dated cooldown reminder still names update workflow" 'spec-first update' "$future_cooldown_captured"

generic_host_dirs_output="$(
  node - "$REPO_ROOT" "$TMP_DIR" <<'EOF'
const fs = require('node:fs');
const path = require('node:path');
const repoRoot = process.argv[2];
const tmpDir = process.argv[3];
const { maybeShowStartupVersionReminder } = require(path.join(repoRoot, 'src/cli/version-reminder'));

(async () => {
  const codexOnly = path.join(tmpDir, 'generic-codex-only');
  const claudeOnly = path.join(tmpDir, 'generic-claude-only');
  const agentsOnly = path.join(tmpDir, 'generic-agents-only');
  fs.mkdirSync(path.join(codexOnly, '.codex'), { recursive: true });
  fs.mkdirSync(path.join(claudeOnly, '.claude'), { recursive: true });
  fs.writeFileSync(path.join(claudeOnly, '.claude', 'settings.json'), '{}\n', 'utf8');
  fs.mkdirSync(path.join(agentsOnly, '.agents', 'skills', 'custom-tool'), { recursive: true });
  fs.writeFileSync(path.join(agentsOnly, '.agents', 'skills', 'custom-tool', 'SKILL.md'), 'name: custom-tool\n', 'utf8');

  const results = [];
  for (const [host, projectRoot] of [
    ['codex', codexOnly],
    ['claude', claudeOnly],
    ['codex', agentsOnly],
  ]) {
    let captured = '';
    const printed = await maybeShowStartupVersionReminder({
      host,
      projectRoot,
      homeRoot: path.join(tmpDir, `home-${host}-${results.length}`),
      lookupLatestVersion: async () => '1.6.2',
      output: { write(chunk) { captured += chunk; return true; } },
    });
    results.push({ host, printed, captured });
  }

  process.stdout.write(JSON.stringify(results));
})();
EOF
)"
generic_host_dirs_printed=$(node -e "const data = JSON.parse(process.argv[1]); process.stdout.write(data.map((entry) => String(entry.printed)).join(','));" "$generic_host_dirs_output")
generic_host_dirs_output_text=$(node -e "const data = JSON.parse(process.argv[1]); process.stdout.write(data.map((entry) => entry.captured).join('\\n'));" "$generic_host_dirs_output")
assert_output "generic host directories do not count as spec-first runtime" "false,false,false" "$generic_host_dirs_printed"
assert_output "generic host directories produce no startup reminder" "" "$generic_host_dirs_output_text"

startup_equal_output="$(
  node - "$REPO_ROOT" "$TMP_DIR" <<'EOF'
const fs = require('node:fs');
const path = require('node:path');
const repoRoot = process.argv[2];
const tmpDir = process.argv[3];
const { maybeShowStartupVersionReminder } = require(path.join(repoRoot, 'src/cli/version-reminder'));

(async () => {
  const projectRoot = path.join(tmpDir, 'startup-equal');
  fs.mkdirSync(path.join(projectRoot, '.codex', 'spec-first'), { recursive: true });
  fs.writeFileSync(
    path.join(projectRoot, '.codex', 'spec-first', 'state.json'),
    `${JSON.stringify({ manifestVersion: '1.6.1' })}\n`,
    'utf8',
  );
  let captured = '';
  const printed = await maybeShowStartupVersionReminder({
    host: 'codex',
    projectRoot,
    homeRoot: path.join(tmpDir, 'home-equal'),
    lookupLatestVersion: async () => '1.6.1',
    output: { write(chunk) { captured += chunk; return true; } },
  });
  process.stdout.write(JSON.stringify({ printed, captured }));
})();
EOF
)"
startup_equal_printed=$(node -e "const data = JSON.parse(process.argv[1]); process.stdout.write(String(data.printed));" "$startup_equal_output")
startup_equal_captured=$(node -e "const data = JSON.parse(process.argv[1]); process.stdout.write(data.captured);" "$startup_equal_output")
assert_output "current runtime startup reminder does not print" "false" "$startup_equal_printed"
assert_output "current runtime startup reminder produces no output" "" "$startup_equal_captured"

startup_cli_output="$(
  node - "$REPO_ROOT" "$TMP_DIR" <<'EOF'
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const repoRoot = process.argv[2];
const tmpDir = process.argv[3];

(async () => {
  const projectRoot = path.join(tmpDir, 'startup-cli');
  const homeRoot = path.join(tmpDir, 'home-cli');
  fs.mkdirSync(path.join(projectRoot, '.codex', 'spec-first'), { recursive: true });
  fs.writeFileSync(
    path.join(projectRoot, '.codex', 'spec-first', 'state.json'),
    `${JSON.stringify({ manifestVersion: '1.6.1' })}\n`,
    'utf8',
  );

  let stdout = '';
  let stderr = '';
  const originalStdoutWrite = process.stdout.write.bind(process.stdout);
  const originalStderrWrite = process.stderr.write.bind(process.stderr);
  const originalCwd = process.cwd();
  const originalLatest = process.env.SPEC_FIRST_VERSION_REMINDER_LATEST;
  const originalUserInfo = os.userInfo;
  const originalHomedir = os.homedir;
  process.stdout.write = (chunk) => {
    stdout += chunk;
    return true;
  };
  process.stderr.write = (chunk) => {
    stderr += chunk;
    return true;
  };
  process.env.SPEC_FIRST_VERSION_REMINDER_LATEST = '1.6.2';
  os.userInfo = () => ({ homedir: homeRoot });
  os.homedir = () => homeRoot;
  const { runCli } = require(path.join(repoRoot, 'src/cli'));
  process.chdir(projectRoot);

  const exitCode = await runCli(['startup-reminder', '--codex']);
  const statePath = path.join(homeRoot, '.codex', 'spec-first', 'startup-version-reminder.json');
  const state = fs.existsSync(statePath) ? fs.readFileSync(statePath, 'utf8') : '';

  process.chdir(originalCwd);
  if (originalLatest === undefined) {
    delete process.env.SPEC_FIRST_VERSION_REMINDER_LATEST;
  } else {
    process.env.SPEC_FIRST_VERSION_REMINDER_LATEST = originalLatest;
  }
  os.userInfo = originalUserInfo;
  os.homedir = originalHomedir;
  process.stdout.write = originalStdoutWrite;
  process.stderr.write = originalStderrWrite;
  process.stdout.write(JSON.stringify({ exitCode, stdout, stderr, state }));
})();
EOF
)"
startup_cli_exit=$(node -e "const data = JSON.parse(process.argv[1]); process.stdout.write(String(data.exitCode));" "$startup_cli_output")
startup_cli_stdout=$(node -e "const data = JSON.parse(process.argv[1]); process.stdout.write(data.stdout);" "$startup_cli_output")
startup_cli_stderr=$(node -e "const data = JSON.parse(process.argv[1]); process.stdout.write(data.stderr);" "$startup_cli_output")
startup_cli_state=$(node -e "const data = JSON.parse(process.argv[1]); process.stdout.write(data.state);" "$startup_cli_output")
assert_output "hidden startup reminder exits successfully" "0" "$startup_cli_exit"
assert_contains "hidden startup reminder writes stdout" 'spec-first update' "$startup_cli_stdout"
assert_output "hidden startup reminder writes no stderr" "" "$startup_cli_stderr"
assert_contains "hidden startup reminder writes cooldown under HOME" '"codex|1.6.1|1.6.2"' "$startup_cli_state"
assert_not_contains "hidden startup reminder state does not persist project root" "startup-cli" "$startup_cli_state"

startup_cli_reset_output="$(
  node - "$REPO_ROOT" "$TMP_DIR" <<'EOF'
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const repoRoot = process.argv[2];
const tmpDir = process.argv[3];

function writeRuntime(projectRoot, host) {
  fs.mkdirSync(path.join(projectRoot, `.${host}`, 'spec-first'), { recursive: true });
  fs.writeFileSync(
    path.join(projectRoot, `.${host}`, 'spec-first', 'state.json'),
    `${JSON.stringify({ manifestVersion: '1.6.1' })}\n`,
    'utf8',
  );
}

(async () => {
  const projectRoot = path.join(tmpDir, 'startup-cli-reset');
  const homeRoot = path.join(tmpDir, 'home-cli-reset');
  writeRuntime(projectRoot, 'codex');
  writeRuntime(projectRoot, 'claude');

  let stdout = '';
  let stderr = '';
  const originalStdoutWrite = process.stdout.write.bind(process.stdout);
  const originalStderrWrite = process.stderr.write.bind(process.stderr);
  const originalCwd = process.cwd();
  const originalLatest = process.env.SPEC_FIRST_VERSION_REMINDER_LATEST;
  const originalUserInfo = os.userInfo;
  const originalHomedir = os.homedir;
  process.stdout.write = (chunk) => { stdout += chunk; return true; };
  process.stderr.write = (chunk) => { stderr += chunk; return true; };
  process.env.SPEC_FIRST_VERSION_REMINDER_LATEST = '1.6.2';
  os.userInfo = () => ({ homedir: homeRoot });
  os.homedir = () => homeRoot;
  const { runCli } = require(path.join(repoRoot, 'src/cli'));
  process.chdir(projectRoot);

  const firstCodex = await runCli(['startup-reminder', '--codex']);
  const suppressedCodex = await runCli(['startup-reminder', '--codex']);
  const resetCodex = await runCli(['startup-reminder', '--codex', '--reset']);
  const afterResetCodex = await runCli(['startup-reminder', '--codex']);
  const firstClaude = await runCli(['startup-reminder', '--claude']);
  const resetClaude = await runCli(['startup-reminder', '--claude', '--reset']);
  const afterResetClaude = await runCli(['startup-reminder', '--claude']);

  process.chdir(originalCwd);
  if (originalLatest === undefined) delete process.env.SPEC_FIRST_VERSION_REMINDER_LATEST;
  else process.env.SPEC_FIRST_VERSION_REMINDER_LATEST = originalLatest;
  os.userInfo = originalUserInfo;
  os.homedir = originalHomedir;
  process.stdout.write = originalStdoutWrite;
  process.stderr.write = originalStderrWrite;
  process.stdout.write(JSON.stringify({
    firstCodex,
    suppressedCodex,
    resetCodex,
    afterResetCodex,
    firstClaude,
    resetClaude,
    afterResetClaude,
    stdout,
    stderr,
  }));
})();
EOF
)"
startup_cli_reset_codes=$(node -e "const data = JSON.parse(process.argv[1]); process.stdout.write([data.firstCodex,data.suppressedCodex,data.resetCodex,data.afterResetCodex,data.firstClaude,data.resetClaude,data.afterResetClaude].join(','));" "$startup_cli_reset_output")
startup_cli_reset_stdout=$(node -e "const data = JSON.parse(process.argv[1]); process.stdout.write(data.stdout);" "$startup_cli_reset_output")
startup_cli_reset_stderr=$(node -e "const data = JSON.parse(process.argv[1]); process.stdout.write(data.stderr);" "$startup_cli_reset_output")
assert_output "hidden startup reminder reset commands exit successfully" "0,0,0,0,0,0,0" "$startup_cli_reset_codes"
assert_contains "codex reset allows reminder to print again" 'spec-first update' "$startup_cli_reset_stdout"
assert_contains "claude reset allows reminder to print again" "spec-first update" "$startup_cli_reset_stdout"
assert_output "hidden startup reminder reset writes no stderr" "" "$startup_cli_reset_stderr"

startup_cli_invalid_output="$(
  node - "$REPO_ROOT" <<'EOF'
const path = require('node:path');
const repoRoot = process.argv[2];
const { runCli } = require(path.join(repoRoot, 'src/cli'));

(async () => {
  let stderr = '';
  const originalStderrWrite = process.stderr.write.bind(process.stderr);
  process.stderr.write = (chunk) => { stderr += chunk; return true; };
  const missing = await runCli(['startup-reminder']);
  const bogus = await runCli(['startup-reminder', '--bogus']);
  const invalidHost = await runCli(['startup-reminder', '--host=bad']);
  const conflict = await runCli(['startup-reminder', '--claude', '--codex']);
  process.stderr.write = originalStderrWrite;
  process.stdout.write(JSON.stringify({ missing, bogus, invalidHost, conflict, stderr }));
})();
EOF
)"
startup_cli_invalid_codes=$(node -e "const data = JSON.parse(process.argv[1]); process.stdout.write([data.missing,data.bogus,data.invalidHost,data.conflict].join(','));" "$startup_cli_invalid_output")
startup_cli_invalid_stderr=$(node -e "const data = JSON.parse(process.argv[1]); process.stdout.write(data.stderr);" "$startup_cli_invalid_output")
assert_output "invalid startup reminder flags return usage errors" "2,2,2,2" "$startup_cli_invalid_codes"
assert_contains "invalid startup reminder flags write terse stderr" "startup-reminder:" "$startup_cli_invalid_stderr"

echo "5. runCli wiring"
help_output="$(
  SPEC_FIRST_VERSION_REMINDER_LATEST="9.9.9" node - "$REPO_ROOT" <<'EOF'
const path = require('node:path');
const repoRoot = process.argv[2];
const { runCli } = require(path.join(repoRoot, 'src/cli'));

(async () => {
  let stdout = '';
  let stderr = '';
  const originalLog = console.log;
  const originalStderrWrite = process.stderr.write.bind(process.stderr);
  console.log = (...args) => {
    stdout += `${args.join(' ')}\n`;
  };
  process.stderr.write = (chunk) => {
    stderr += chunk;
    return true;
  };

  const exitCode = await runCli(['--help']);

  console.log = originalLog;
  process.stderr.write = originalStderrWrite;
  process.stdout.write(JSON.stringify({ exitCode, stdout, stderr }));
})();
EOF
)"
help_exit=$(node -e "const data = JSON.parse(process.argv[1]); process.stdout.write(String(data.exitCode));" "$help_output")
help_stderr=$(node -e "const data = JSON.parse(process.argv[1]); process.stdout.write(data.stderr);" "$help_output")
assert_output "help exits successfully" "0" "$help_exit"
assert_output "help does not print reminder" "" "$help_stderr"

version_output="$(
  SPEC_FIRST_VERSION_REMINDER_LATEST="9.9.9" node - "$REPO_ROOT" <<'EOF'
const path = require('node:path');
const repoRoot = process.argv[2];
const { runCli } = require(path.join(repoRoot, 'src/cli'));

(async () => {
  let stdout = '';
  let stderr = '';
  const originalLog = console.log;
  const originalStderrWrite = process.stderr.write.bind(process.stderr);
  console.log = (...args) => {
    stdout += `${args.join(' ')}\n`;
  };
  process.stderr.write = (chunk) => {
    stderr += chunk;
    return true;
  };

  const exitCode = await runCli(['--version']);

  console.log = originalLog;
  process.stderr.write = originalStderrWrite;
  process.stdout.write(JSON.stringify({ exitCode, stdout, stderr }));
})();
EOF
)"
version_exit=$(node -e "const data = JSON.parse(process.argv[1]); process.stdout.write(String(data.exitCode));" "$version_output")
version_stderr=$(node -e "const data = JSON.parse(process.argv[1]); process.stdout.write(data.stderr);" "$version_output")
assert_output "version exits successfully" "0" "$version_exit"
assert_output "version does not print reminder" "" "$version_stderr"

project_dir="$TMP_DIR/project"
mkdir -p "$project_dir"

doctor_output="$(
  cd "$project_dir"
  SPEC_FIRST_VERSION_REMINDER_LATEST="9.9.9" node - "$REPO_ROOT" "$TMP_DIR" <<'EOF'
const os = require('node:os');
const path = require('node:path');
const repoRoot = process.argv[2];
const tmpDir = process.argv[3];
const { runCli } = require(path.join(repoRoot, 'src/cli'));

(async () => {
  let stdout = '';
  let stderr = '';
  const originalLog = console.log;
  const originalStderrWrite = process.stderr.write.bind(process.stderr);
  console.log = (...args) => {
    stdout += `${args.join(' ')}\n`;
  };
  process.stderr.write = (chunk) => {
    stderr += chunk;
    return true;
  };
  Object.defineProperty(process.stderr, 'isTTY', { value: true, configurable: true });
  os.userInfo = () => ({ homedir: path.join(tmpDir, 'home-runcli') });
  os.homedir = () => path.join(tmpDir, 'home-runcli');

  const exitCode = await runCli(['doctor']);

  console.log = originalLog;
  process.stderr.write = originalStderrWrite;
  process.stdout.write(JSON.stringify({ exitCode, stdout, stderr }));
})();
EOF
)"
doctor_exit=$(node -e "const data = JSON.parse(process.argv[1]); process.stdout.write(String(data.exitCode));" "$doctor_output")
doctor_stdout=$(node -e "const data = JSON.parse(process.argv[1]); process.stdout.write(data.stdout);" "$doctor_output")
doctor_stderr=$(node -e "const data = JSON.parse(process.argv[1]); process.stdout.write(data.stderr);" "$doctor_output")
assert_output "doctor exits successfully" "0" "$doctor_exit"
assert_contains "doctor still reports missing platform" "No spec-first platform detected in this project." "$doctor_stdout"
assert_contains "doctor prints reminder" "Update available for spec-first" "$doctor_stderr"

init_output="$(
  cd "$project_dir"
  SPEC_FIRST_VERSION_REMINDER_LATEST="9.9.9" node - "$REPO_ROOT" "$TMP_DIR" <<'EOF'
const os = require('node:os');
const path = require('node:path');
const repoRoot = process.argv[2];
const tmpDir = process.argv[3];
const { runCli } = require(path.join(repoRoot, 'src/cli'));

(async () => {
  let stdout = '';
  let stderr = '';
  const originalLog = console.log;
  const originalStderrWrite = process.stderr.write.bind(process.stderr);
  console.log = (...args) => {
    stdout += `${args.join(' ')}\n`;
  };
  process.stderr.write = (chunk) => {
    stderr += chunk;
    return true;
  };
  os.userInfo = () => ({ homedir: path.join(tmpDir, 'home-runcli') });
  os.homedir = () => path.join(tmpDir, 'home-runcli');

  const exitCode = await runCli(['init', '--bogus']);

  console.log = originalLog;
  process.stderr.write = originalStderrWrite;
  process.stdout.write(JSON.stringify({ exitCode, stdout, stderr }));
})();
EOF
)"
init_exit=$(node -e "const data = JSON.parse(process.argv[1]); process.stdout.write(String(data.exitCode));" "$init_output")
init_stdout=$(node -e "const data = JSON.parse(process.argv[1]); process.stdout.write(data.stdout);" "$init_output")
init_stderr=$(node -e "const data = JSON.parse(process.argv[1]); process.stdout.write(data.stderr);" "$init_output")
assert_output "init exits 2 for unsupported flags" "2" "$init_exit"
assert_not_contains "init reminder is suppressed by cli package gate" "Update available for spec-first" "$init_stderr"
assert_contains "init rejects unsupported flags" "unknown option --bogus" "$init_stderr"
assert_output "init does not generate runtime assets from unsupported flags" "" "$init_stdout"

clean_output="$(
  cd "$project_dir"
  SPEC_FIRST_VERSION_REMINDER_LATEST="9.9.9" node - "$REPO_ROOT" "$TMP_DIR" <<'EOF'
const os = require('node:os');
const path = require('node:path');
const repoRoot = process.argv[2];
const tmpDir = process.argv[3];
const { runCli } = require(path.join(repoRoot, 'src/cli'));

(async () => {
  let stdout = '';
  let stderr = '';
  const originalLog = console.log;
  const originalStderrWrite = process.stderr.write.bind(process.stderr);
  console.log = (...args) => {
    stdout += `${args.join(' ')}\n`;
  };
  process.stderr.write = (chunk) => {
    stderr += chunk;
    return true;
  };
  os.userInfo = () => ({ homedir: path.join(tmpDir, 'home-runcli') });
  os.homedir = () => path.join(tmpDir, 'home-runcli');

  const exitCode = await runCli(['clean', '--claude']);

  console.log = originalLog;
  process.stderr.write = originalStderrWrite;
  process.stdout.write(JSON.stringify({ exitCode, stdout, stderr }));
})();
EOF
)"
clean_exit=$(node -e "const data = JSON.parse(process.argv[1]); process.stdout.write(String(data.exitCode));" "$clean_output")
clean_stderr=$(node -e "const data = JSON.parse(process.argv[1]); process.stdout.write(data.stderr);" "$clean_output")
assert_output "clean exits successfully" "0" "$clean_exit"
assert_not_contains "clean reminder is suppressed by cli package gate" "Update available for spec-first" "$clean_stderr"

echo ""
echo "=== Results ==="
echo "  Passed: $pass"
echo "  Failed: $fail"
echo ""

if [ $fail -gt 0 ]; then
  echo "=== version reminder unit tests FAILED ==="
  exit 1
else
  echo "=== version reminder unit tests PASSED ==="
fi
