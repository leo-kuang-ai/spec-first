#!/usr/bin/env bash
set -euo pipefail

# 发布前冒烟测试：npm pack → 临时全局安装 → 验证 bin/npx 可用
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

echo "=== 1. npm pack ==="
TGZ=$(npm pack --pack-destination "$TMP" 2>/dev/null | tail -1)
TGZ_PATH="$TMP/$TGZ"
[ -f "$TGZ_PATH" ] || { echo "FAIL: pack 未产出 tgz"; exit 1; }
echo "OK: $TGZ"

echo "=== 2. 全局安装到临时 prefix ==="
npm install -g "$TGZ_PATH" --prefix "$TMP/global" --ignore-scripts --no-audit --no-fund 2>/dev/null
BIN="$TMP/global/bin/spec-first"
[ -f "$BIN" ] || { echo "FAIL: bin 不存在"; exit 1; }
echo "OK: $BIN"

echo "=== 3. spec-first --version ==="
VERSION=$("$BIN" --version 2>&1) || { echo "FAIL: --version 退出非零"; exit 1; }
echo "OK: $VERSION"

echo "=== 4. spec-first --help ==="
"$BIN" --help >/dev/null 2>&1 || { echo "FAIL: --help 退出非零"; exit 1; }
echo "OK"

echo ""
echo "✅ 冒烟测试全部通过"
