#!/bin/bash
# lang-policy unit tests
# Tests applyManagedBlock, buildManagedBlock (via lang-policy.js) and bootstrapChangelog

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

assert_no_blank_lines() {
  local desc="$1"
  local haystack="$2"
  if [[ "$haystack" != *$'\n\n'* ]]; then
    pass=$((pass + 1))
  else
    echo "  ✗ $desc: output contains blank lines"
    fail=$((fail + 1))
  fi
}

# Node helper: run a JS snippet and capture stdout
node_run() {
  node -e "
const {
  USER_LANGUAGE_END,
  USER_LANGUAGE_START,
  applyManagedBlock,
  buildManagedBlock,
  buildUserLanguageBlock,
  removeMarkerBlock,
  upsertMarkerBlock,
} = require('$REPO_ROOT/src/cli/lang-policy');
const { bootstrapChangelog, buildInitialChangelog } = require('$REPO_ROOT/src/cli/changelog');
$1
"
}

# ============================================================================
echo "=== lang-policy unit tests ==="
echo ""

# ============================================================================
echo "1. buildManagedBlock"
# ============================================================================

echo "1.1 zh block contains START marker"
zh_block=$(node_run "process.stdout.write(buildManagedBlock('zh'))")
assert_contains "zh block has start marker" "<!-- spec-first:lang:start -->" "$zh_block"

echo "1.2 zh block contains END marker"
assert_contains "zh block has end marker" "<!-- spec-first:lang:end -->" "$zh_block"
assert_no_blank_lines "zh project block has no blank lines" "$zh_block"

echo "1.3 zh block contains Chinese language directive"
assert_contains "zh block has Chinese directive" "中文" "$zh_block"

echo "1.4 zh block uses localized language setting label"
assert_contains "zh block uses Chinese / 中文 label" '**语言设置：** `Chinese / 中文`' "$zh_block"

echo "1.5 zh block uses clean visible heading"
zh_heading=$(printf '%s\n' "$zh_block" | sed -n '2p')
assert_output "zh block uses clean visible heading" "## 语言与治理策略" "$zh_heading"
assert_not_contains "zh block omits visible managed suffix" "## 语言与治理策略（由 spec-first 管理）" "$zh_block"

echo "1.6 zh block does not expose raw zh code in language setting"
assert_not_contains "zh block omits raw zh code" '**语言设置：** `zh`' "$zh_block"

echo "1.7 en block contains English language directive"
en_block=$(node_run "process.stdout.write(buildManagedBlock('en'))")
assert_contains "en block has English directive" "English" "$en_block"

echo "1.8 en block uses localized language setting label"
assert_contains "en block uses English / 英文 label" '**Language setting:** `English / 英文`' "$en_block"

echo "1.9 en block uses clean visible heading"
en_heading=$(printf '%s\n' "$en_block" | sed -n '2p')
assert_output "en block uses clean visible heading" "## Language and Governance Policy" "$en_heading"
assert_not_contains "en block omits visible managed suffix" "## Language and Governance Policy (managed by spec-first)" "$en_block"

echo "1.10 en block does not expose raw en code in language setting"
assert_not_contains "en block omits raw en code" '**Language setting:** `en`' "$en_block"

echo "1.11 en block contains START and END markers"
assert_contains "en block has start marker" "<!-- spec-first:lang:start -->" "$en_block"
assert_contains "en block has end marker" "<!-- spec-first:lang:end -->" "$en_block"
assert_no_blank_lines "en project block has no blank lines" "$en_block"

echo "1.12 zh block has strict generated-content language scope"
assert_contains "zh block has hard execution wording" "语言规则为绝对硬执行要求" "$zh_block"
assert_contains "zh block applies to generated docs and task prose" "生成文档、需求、计划、任务" "$zh_block"
assert_contains "zh block applies to commit and PR text" "commit message 和 PR 文案" "$zh_block"
assert_not_contains "zh block omits open-ended scope phrase" "适用范围包括但不限于" "$zh_block"
assert_not_contains "zh block omits developer profile path detail" "~/.spec-first/.developer" "$zh_block"
assert_contains "zh project block includes workflow entry heading" "### Workflow 入口治理" "$zh_block"
assert_contains "zh project block includes using-spec-first pointer" '完整入口路由与边界在 `skills/using-spec-first/SKILL.md`' "$zh_block"
assert_not_contains "zh project block does not include standalone bootstrap marker" "<!-- spec-first:bootstrap:start -->" "$zh_block"

echo "1.13 en block contains changelog governance rule"
assert_contains "en block has changelog rule" "CHANGELOG" "$en_block"

echo "1.14 zh block contains changelog governance rule"
assert_contains "zh block has changelog rule" "CHANGELOG" "$zh_block"

echo "1.15 zh block contains refusal rule"
assert_contains "zh block has refusal rule" "拒绝生成" "$zh_block"

echo "1.16 en block contains refusal rule"
assert_contains "en block has refusal rule" "refuse to generate" "$en_block"

echo "1.17 zh block does not contain governance file commit rule"
assert_not_contains "zh block omits governance file commit rule" "规范文件提交规则" "$zh_block"

echo "1.18 en block does not contain governance file commit rule"
assert_not_contains "en block omits governance file commit rule" "Governance File Commit Rule" "$en_block"

echo "1.19 en block has strict generated-content language scope"
assert_contains "en block has hard execution wording" "absolute hard-execution requirement" "$en_block"
assert_contains "en block applies to generated docs and task prose" "generated documents, requirements, plans, tasks" "$en_block"
assert_contains "en block applies to commit and PR text" "commit messages, and PR text" "$en_block"
assert_not_contains "en block omits open-ended scope phrase" "without limitation" "$en_block"
assert_not_contains "en block omits developer profile path detail" "~/.spec-first/.developer" "$en_block"
assert_contains "en project block includes workflow entry heading" "### Workflow Entry Governance" "$en_block"
assert_contains "en project block includes using-spec-first pointer" 'full entry routing map and boundaries live in `skills/using-spec-first/SKILL.md`' "$en_block"
assert_not_contains "en project block does not include standalone bootstrap marker" "<!-- spec-first:bootstrap:start -->" "$en_block"

echo "1.20 user-language blocks use separate markers"
zh_user_block=$(node_run "process.stdout.write(buildUserLanguageBlock('zh'))")
en_user_block=$(node_run "process.stdout.write(buildUserLanguageBlock('en'))")
assert_contains "zh user block has start marker" "<!-- spec-first:user-language:start -->" "$zh_user_block"
assert_contains "zh user block has end marker" "<!-- spec-first:user-language:end -->" "$zh_user_block"
assert_contains "en user block has start marker" "<!-- spec-first:user-language:start -->" "$en_user_block"
assert_contains "en user block has end marker" "<!-- spec-first:user-language:end -->" "$en_user_block"
assert_no_blank_lines "zh user block has no blank lines" "$zh_user_block"
assert_no_blank_lines "en user block has no blank lines" "$en_user_block"
assert_not_contains "zh user block excludes workflow entry governance" "Workflow 入口治理" "$zh_user_block"
assert_not_contains "zh user block excludes using-spec-first pointer" "using-spec-first" "$zh_user_block"
assert_not_contains "en user block excludes workflow entry governance" "Workflow Entry Governance" "$en_user_block"
assert_not_contains "en user block excludes using-spec-first pointer" "using-spec-first" "$en_user_block"

echo "1.21 user-language blocks exclude project governance"
assert_not_contains "zh user block excludes changelog" "CHANGELOG" "$zh_user_block"
assert_not_contains "zh user block excludes refusal rule" "拒绝生成" "$zh_user_block"
assert_not_contains "en user block excludes changelog" "CHANGELOG" "$en_user_block"
assert_not_contains "en user block excludes refusal rule" "refuse to generate" "$en_user_block"

echo "1.22 project and user blocks share normalized hard-execution prose"
zh_parity=$(node_run "
function normalize(block) {
  return block
    .replace(/<!-- spec-first:[^>]+-->/g, '')
    .replace(/^## .*$/gm, '')
    .replace(/^\\*\\*语言设置：\\*\\*.*$/gm, '')
    .replace(/^\\*\\*Language setting:\\*\\*.*$/gm, '')
    .replace(/### Workflow 入口治理[\\s\\S]*?### Changelog/m, '### Changelog')
    .replace(/### Workflow Entry Governance[\\s\\S]*?### Changelog/m, '### Changelog')
    .replace(/### Changelog[\\s\\S]*$/m, '')
    .trim();
}
process.stdout.write(normalize(buildManagedBlock('zh')) === normalize(buildUserLanguageBlock('zh')) ? 'yes' : 'no');
")
en_parity=$(node_run "
function normalize(block) {
  return block
    .replace(/<!-- spec-first:[^>]+-->/g, '')
    .replace(/^## .*$/gm, '')
    .replace(/^\\*\\*语言设置：\\*\\*.*$/gm, '')
    .replace(/^\\*\\*Language setting:\\*\\*.*$/gm, '')
    .replace(/### Workflow 入口治理[\\s\\S]*?### Changelog/m, '### Changelog')
    .replace(/### Workflow Entry Governance[\\s\\S]*?### Changelog/m, '### Changelog')
    .replace(/### Changelog[\\s\\S]*$/m, '')
    .trim();
}
process.stdout.write(normalize(buildManagedBlock('en')) === normalize(buildUserLanguageBlock('en')) ? 'yes' : 'no');
")
assert_output "zh project/user normalized prose matches" "yes" "$zh_parity"
assert_output "en project/user normalized prose matches" "yes" "$en_parity"

echo ""

# ============================================================================
echo "2. applyManagedBlock — file absent (empty string)"
# ============================================================================

echo "2.1 empty existing -> returns block only"
result=$(node_run "
const block = buildManagedBlock('zh');
process.stdout.write(applyManagedBlock('', block));
")
assert_contains "result has start marker" "<!-- spec-first:lang:start -->" "$result"
assert_contains "result has end marker" "<!-- spec-first:lang:end -->" "$result"

echo ""

# ============================================================================
echo "3. applyManagedBlock — file exists, no markers"
# ============================================================================

echo "3.1 existing content preserved when appending"
result=$(node_run "
const block = buildManagedBlock('zh');
const existing = '# My Repo\n\nSome user content here.\n';
process.stdout.write(applyManagedBlock(existing, block));
")
assert_contains "user content preserved" "My Repo" "$result"
assert_contains "user content line preserved" "Some user content here." "$result"
assert_contains "block appended with markers" "<!-- spec-first:lang:start -->" "$result"

echo "3.2 no duplicate markers when no markers in existing"
marker_count=$(printf '%s' "$result" | grep -c '<!-- spec-first:lang:start -->' || true)
assert_output "exactly one start marker" "1" "$marker_count"

echo ""

# ============================================================================
echo "4. applyManagedBlock — file exists with markers (idempotent update)"
# ============================================================================

echo "4.1 replacing zh block with en block: only one start marker remains"
result=$(node_run "
const zhBlock = buildManagedBlock('zh');
const enBlock = buildManagedBlock('en');
const after_zh = applyManagedBlock('# Repo\n', zhBlock);
process.stdout.write(applyManagedBlock(after_zh, enBlock));
")
marker_count=$(printf '%s' "$result" | grep -c '<!-- spec-first:lang:start -->' || true)
assert_output "exactly one start marker after update" "1" "$marker_count"

echo "4.2 en content present after update"
assert_contains "en content after update" "English" "$result"

echo "4.3 user content before block preserved after update"
assert_contains "user content before block preserved" "# Repo" "$result"

echo "4.4 running same lang again is idempotent"
result2=$(node_run "
const zhBlock = buildManagedBlock('zh');
const after = applyManagedBlock('# Repo\n', zhBlock);
process.stdout.write(applyManagedBlock(after, zhBlock));
")
marker_count2=$(printf '%s' "$result2" | grep -c '<!-- spec-first:lang:start -->' || true)
assert_output "idempotent: still one start marker" "1" "$marker_count2"

echo ""

# ============================================================================
echo "5. applyManagedBlock — corrupted state (START without END)"
# ============================================================================

echo "5.1 corrupted file treated as no markers: block appended"
result=$(node_run "
const block = buildManagedBlock('zh');
const corrupted = '# Repo\n<!-- spec-first:lang:start -->\nsome partial content\n';
process.stdout.write(applyManagedBlock(corrupted, block));
")
assert_contains "block appended to corrupted file" "<!-- spec-first:lang:end -->" "$result"
assert_contains "orphan project marker text preserved" "some partial content" "$result"
# At least one END marker should appear (from the appended block)
end_count=$(printf '%s' "$result" | grep -c '<!-- spec-first:lang:end -->' || true)
assert "end marker present after appending to corrupted" test "$end_count" -ge 1

echo "5.2 user-language upsert appends without deleting orphan marker"
result=$(node_run "
const block = buildUserLanguageBlock('zh');
const corrupted = '# User\n' + USER_LANGUAGE_START + '\npartial preference\n';
process.stdout.write(upsertMarkerBlock(corrupted, block, USER_LANGUAGE_START, USER_LANGUAGE_END));
")
complete_count=$(printf '%s' "$result" | grep -c '<!-- spec-first:user-language:end -->' || true)
assert_output "one complete user-language block appended" "1" "$complete_count"
assert_contains "orphan user marker content preserved" "partial preference" "$result"

echo "5.3 user-language repeated upsert replaces complete block and preserves orphan marker"
result=$(node_run "
const zhBlock = buildUserLanguageBlock('zh');
const enBlock = buildUserLanguageBlock('en');
const corrupted = '# User\n' + USER_LANGUAGE_START + '\npartial preference\n';
const withBlock = upsertMarkerBlock(corrupted, zhBlock, USER_LANGUAGE_START, USER_LANGUAGE_END);
process.stdout.write(upsertMarkerBlock(withBlock, enBlock, USER_LANGUAGE_START, USER_LANGUAGE_END));
")
complete_count=$(printf '%s' "$result" | grep -c '<!-- spec-first:user-language:end -->' || true)
assert_output "still one complete user-language block after repeated upsert" "1" "$complete_count"
assert_contains "orphan user marker still preserved" "partial preference" "$result"
assert_contains "updated complete user-language block" "English" "$result"

echo "5.4 user-language removal deletes complete block only"
result=$(node_run "
const block = buildUserLanguageBlock('zh');
const existing = '# Before\n' + block + '\n# After\n';
process.stdout.write(removeMarkerBlock(existing, USER_LANGUAGE_START, USER_LANGUAGE_END));
")
assert_contains "content before user block preserved" "# Before" "$result"
assert_contains "content after user block preserved" "# After" "$result"
assert_not_contains "complete user-language block removed" "<!-- spec-first:user-language:start -->" "$result"

echo "5.5 user-language removal is no-op for orphan marker"
result=$(node_run "
const corrupted = '# User\n' + USER_LANGUAGE_START + '\npartial preference\n';
process.stdout.write(removeMarkerBlock(corrupted, USER_LANGUAGE_START, USER_LANGUAGE_END));
")
assert_contains "orphan marker remains after remove no-op" "<!-- spec-first:user-language:start -->" "$result"
assert_contains "orphan content remains after remove no-op" "partial preference" "$result"

echo ""

# ============================================================================
echo "6. bootstrapChangelog"
# ============================================================================

echo "6.1 creates CHANGELOG.md when absent"
FAKE_ROOT1="$TMP_DIR/proj1"
mkdir -p "$FAKE_ROOT1"
node_run "bootstrapChangelog('$FAKE_ROOT1', { name: 'testuser', version: '1.4.0' })" >/dev/null
assert "CHANGELOG.md created" test -f "$FAKE_ROOT1/CHANGELOG.md"

echo "6.2 created file contains versioned entry format"
content=$(cat "$FAKE_ROOT1/CHANGELOG.md")
assert_contains "has Chinese entry format" '- 记录格式：`- v版本号 YYYY-MM-DD HH:MM:SS 作者: 变更摘要 [(user-visible)]`' "$content"

echo "6.2.1 created file contains changelog format explanation"
assert_contains "has Chinese summary guidance" '`变更摘要` 使用中文，简明说明本次改动' "$content"
assert_contains "requires full timestamp" '日期时间必须使用 `YYYY-MM-DD HH:MM:SS`' "$content"

echo "6.3 created file contains developer name in initial entry"
assert_contains "has developer name" "testuser" "$content"

echo "6.4 created file contains spec-first version in initial entry"
assert_contains "has versioned initial entry" "- v1.4.0 " "$content"
assert_contains "has Chinese initial summary" "使用 spec-first 初始化项目" "$content"

echo "6.5 no-op when file already exists"
ORIGINAL=$(cat "$FAKE_ROOT1/CHANGELOG.md")
node_run "bootstrapChangelog('$FAKE_ROOT1', { name: 'other', version: '2.0.0' })" >/dev/null
AFTER=$(cat "$FAKE_ROOT1/CHANGELOG.md")
assert_output "file unchanged on second call" "$ORIGINAL" "$AFTER"

echo "6.6 works with empty name and version"
FAKE_ROOT2="$TMP_DIR/proj2"
mkdir -p "$FAKE_ROOT2"
node_run "bootstrapChangelog('$FAKE_ROOT2', { name: '', version: '' })" >/dev/null
assert "CHANGELOG.md created with empty fields" test -f "$FAKE_ROOT2/CHANGELOG.md"

echo "6.7 entry format contains timestamp"
TODAY=$(date +%Y-%m-%d)
content2=$(cat "$FAKE_ROOT1/CHANGELOG.md")
assert_contains "entry has today's date" "$TODAY" "$content2"
assert_contains "entry has time component" ":" "$content2"

echo "6.8 no legacy Unreleased section remains"
assert_not_contains "no unreleased section" "## [Unreleased]" "$content2"

echo ""

# ============================================================================
echo "=== Results ==="
echo "  Passed: $pass"
echo "  Failed: $fail"
echo ""

if [ $fail -gt 0 ]; then
  echo "=== lang-policy tests FAILED ==="
  exit 1
else
  echo "=== lang-policy tests PASSED ==="
fi
