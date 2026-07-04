#!/bin/bash
# install-tarball.sh — 真实 tarball 安装体验回归
# 职责：npm pack → npm install -g → allowScripts clean install log → 全局 shim → 包内容校验
# 运行方式：bash tests/smoke/install-tarball.sh（不纳入默认 npm test）
# 前置：需要 npm registry 和外网可用

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
TMP_PREFIX="$(mktemp -d)/prefix"
TMP_CACHE="$(mktemp -d)"
TARBALL_DIR="$(mktemp -d)"

export npm_config_prefix="$TMP_PREFIX"
export npm_config_cache="$TMP_CACHE"
unset npm_config_allow_scripts
unset NPM_CONFIG_ALLOW_SCRIPTS

cleanup() {
  rm -rf "$TMP_PREFIX" "$TMP_CACHE" "$TARBALL_DIR"
  # 清理父目录
  rmdir "$(dirname "$TMP_PREFIX")" 2>/dev/null || true
}
trap cleanup EXIT

echo "=== install-tarball.sh — 真实 tarball 安装验证 ==="

# -------------------------------------------------------------------------
# 1. npm pack
# -------------------------------------------------------------------------
echo "1. 打包 tarball..."
cd "$REPO_ROOT"
if ! PACK_OUTPUT=$(npm pack --pack-destination "$TARBALL_DIR" 2>&1); then
  echo "$PACK_OUTPUT"
  exit 1
fi
printf '%s\n' "$PACK_OUTPUT" > "$TARBALL_DIR/npm-pack.log"
TARBALL=$(printf '%s\n' "$PACK_OUTPUT" | awk '/\.tgz$/ { name=$NF } END { print name }')
if [ -z "$TARBALL" ]; then
  echo "✗ 无法从 npm pack 输出中解析 tarball 文件名"
  echo "$PACK_OUTPUT"
  exit 1
fi
TARBALL_PATH="$TARBALL_DIR/$TARBALL"
echo "   tarball: $TARBALL_PATH"
test -f "$TARBALL_PATH"
PACK_LIST="$TARBALL_DIR/pack-list.txt"
tar -tf "$TARBALL_PATH" > "$PACK_LIST"
parser_dep="tree""-sitter"
sqlite_dep="better""-sqlite3"
retired_standards="standards"
if grep -E "$parser_dep|$sqlite_dep" "$PACK_LIST"; then
  echo "✗ tarball 文件列表包含不应打包的 native parser 依赖"
  exit 1
fi
if grep -q '^package/\.claude-plugin/' "$PACK_LIST"; then
  echo "✗ tarball 文件列表不应包含安装生成的 .claude-plugin 产物"
  exit 1
fi
if grep -E '(^|/)__pycache__/|\.py[co]$' "$PACK_LIST"; then
  echo "✗ tarball 文件列表不应包含 Python bytecode 缓存"
  exit 1
fi
if grep -q "skills/spec-"standards"/" "$PACK_LIST"; then
  echo "✗ tarball 文件列表不应包含已删除的 spec-"standards" skill"
  exit 1
fi
if grep -q "templates/claude/commands/spec/${retired_standards}.md" "$PACK_LIST"; then
  echo "✗ tarball 文件列表不应包含已删除的 spec-"standards" command template"
  exit 1
fi
grep -q "skills/spec-skill-audit/SKILL.md" "$PACK_LIST"
grep -q "skills/spec-skill-audit/scripts/write-audit-artifacts.js" "$PACK_LIST"
grep -q "templates/claude/commands/spec/skill-audit.md" "$PACK_LIST"
grep -q "skills/spec-mcp-setup/SKILL.md" "$PACK_LIST"
grep -q "templates/claude/commands/spec/mcp-setup.md" "$PACK_LIST"
grep -q "src/cli/adapters/cursor.js" "$PACK_LIST"
grep -q "src/cli/adapters/kiro.js" "$PACK_LIST"
grep -q "src/cli/adapters/qoder.js" "$PACK_LIST"
echo "   ✓ tarball 包含当前 workflow assets，且未包含 generated mirrors/native parser caches"

# -------------------------------------------------------------------------
# 2. 隔离安装
# -------------------------------------------------------------------------
echo "2. 隔离安装到临时 prefix..."
INSTALL_LOG="$TMP_CACHE/install.log"
if npm install -g "$TARBALL_PATH" >"$INSTALL_LOG" 2>&1; then
  install_rc=0
else
  install_rc=$?
  echo "   npm install failed; last install log lines:" >&2
  tail -80 "$INSTALL_LOG" >&2 || true
fi
echo "   install exit code: $install_rc"
if [ "$install_rc" -ne 0 ]; then
  exit "$install_rc"
fi

# -------------------------------------------------------------------------
# 3. 验证安装日志
# -------------------------------------------------------------------------
echo "3. 验证安装日志..."

if grep -q "npm warn allow-scripts" "$INSTALL_LOG"; then
  echo "✗ 安装日志不应出现 npm allow-scripts 警告"
  tail -80 "$INSTALL_LOG" >&2 || true
  exit 1
fi
echo "   ✓ 安装日志未出现 npm allow-scripts 警告"

if grep -E "$parser_dep|$sqlite_dep" "$INSTALL_LOG"; then
  echo "✗ 安装日志包含不应出现的 native parser 依赖"
  exit 1
fi
echo "   ✓ 安装日志未包含 native parser 依赖"

# -------------------------------------------------------------------------
# 4. 验证全局 shim
# -------------------------------------------------------------------------
echo "4. 验证全局 shim..."
SHIM="$TMP_PREFIX/bin/spec-first"
test -x "$SHIM"

# 4a. spec-first -v
VERSION_OUTPUT=$("$SHIM" -v 2>&1)
echo "   ✓ spec-first -v 可执行"
grep -q "Spec-First" <<<"$VERSION_OUTPUT"
grep -q "doctor" <<<"$VERSION_OUTPUT"
echo "   ✓ -v 输出包含 doctor"
# 确定性断言：-v 不推荐 /spec:ideate 或 /spec:brainstorm 作为安装后第一建议
if grep -q "/spec:ideate" <<<"$VERSION_OUTPUT"; then
  echo "✗ -v 输出不应推荐 /spec:ideate 作为安装后第一建议"
  exit 1
fi
if grep -q "/spec:brainstorm" <<<"$VERSION_OUTPUT"; then
  echo "✗ -v 输出不应推荐 /spec:brainstorm 作为安装后第一建议"
  exit 1
fi
echo "   ✓ -v 输出未推荐 /spec:ideate 或 /spec:brainstorm"

# 4b. spec-first doctor（在空目录）
DOCTOR_TMP="$(mktemp -d)"
DOCTOR_OUTPUT=$(cd "$DOCTOR_TMP" && "$SHIM" doctor 2>&1)
rm -rf "$DOCTOR_TMP"
grep -q "init" <<<"$DOCTOR_OUTPUT"
grep -q "spec-first init" <<<"$DOCTOR_OUTPUT"
grep -q "select Claude Code, Codex, Cursor, Kiro, and/or Qoder" <<<"$DOCTOR_OUTPUT"
echo "   ✓ doctor 在空目录输出交互式 init 指引"

# -------------------------------------------------------------------------
# 5. 验证全局包内容
# -------------------------------------------------------------------------
echo "5. 验证全局包内容..."
GLOBAL_PKG="$TMP_PREFIX/lib/node_modules/spec-first"
test -d "$GLOBAL_PKG"

node -e "
const fs = require('fs');
const path = require('path');
const root = '$GLOBAL_PKG';
const forbidden = [
  'vendor/tree-sitter-objc',
  'vendor/tree-sitter-swift',
  '.claude-plugin',
];
for (const rel of forbidden) {
  if (fs.existsSync(path.join(root, rel))) {
    console.error('forbidden package path exists: ' + rel);
    process.exit(1);
  }
}
if (!fs.existsSync(path.join(root, 'skills/spec-skill-audit/SKILL.md'))) {
  console.error('skill audit skill missing from package');
  process.exit(1);
}
if (!fs.existsSync(path.join(root, 'skills/spec-skill-audit/scripts/write-audit-artifacts.js'))) {
  console.error('skill audit artifact writer missing from package');
  process.exit(1);
}
if (!fs.existsSync(path.join(root, 'templates/claude/commands/spec/skill-audit.md'))) {
  console.error('skill audit command missing from package');
  process.exit(1);
}
if (!fs.existsSync(path.join(root, 'skills/spec-mcp-setup/SKILL.md'))) {
  console.error('mcp setup skill missing from package');
  process.exit(1);
}
if (!fs.existsSync(path.join(root, 'templates/claude/commands/spec/mcp-setup.md'))) {
  console.error('mcp setup command missing from package');
  process.exit(1);
}
if (!fs.existsSync(path.join(root, 'src/cli/adapters/cursor.js'))) {
  console.error('Cursor adapter missing from package');
  process.exit(1);
}
if (!fs.existsSync(path.join(root, 'src/cli/adapters/kiro.js'))) {
  console.error('Kiro adapter missing from package');
  process.exit(1);
}
if (!fs.existsSync(path.join(root, 'src/cli/adapters/qoder.js'))) {
  console.error('Qoder adapter missing from package');
  process.exit(1);
}
"
echo "   ✓ 全局包包含当前 setup 与 skill audit assets"

NODE_PATH="$TMP_PREFIX/lib/node_modules" node -e "
const m = require('spec-first/src/cli/init-plan');
if (typeof m.buildInitPlan !== 'function' || typeof m.applyInitPlan !== 'function') {
  process.exit(1);
}
"
echo "   ✓ published init-plan programmatic API 可通过 package exports require"

# -------------------------------------------------------------------------
# 完成
# -------------------------------------------------------------------------
echo ""
echo "=== install-tarball.sh — 全部验证通过 ✓ ==="
