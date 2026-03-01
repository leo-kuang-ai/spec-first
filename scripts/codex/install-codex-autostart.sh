#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# 根据 $SHELL 环境变量选择正确的 rc 文件
case "$SHELL" in
  */zsh)
    TARGET_PROFILE="${1:-$HOME/.zshrc}"
    ;;
  */bash)
    TARGET_PROFILE="${1:-$HOME/.bashrc}"
    ;;
  *)
    echo "Unsupported shell: $SHELL"
    echo "Please manually specify target profile:"
    echo "  $0 ~/.zshrc"
    echo "  $0 ~/.bashrc"
    exit 1
    ;;
esac

START_MARK="# >>> spec-first codex stage-viewer autostart >>>"
END_MARK="# <<< spec-first codex stage-viewer autostart <<<"

mkdir -p "$(dirname "$TARGET_PROFILE")"
if [[ ! -f "$TARGET_PROFILE" ]]; then
  touch "$TARGET_PROFILE"
fi

if grep -q "$START_MARK" "$TARGET_PROFILE"; then
  echo "already installed: $TARGET_PROFILE"
  exit 0
fi

cat >> "$TARGET_PROFILE" <<EOF
$START_MARK
spec_first_codex() {
  node "$ROOT_DIR/scripts/stage-viewer/bootstrap.js" --source codex --open >/dev/null 2>&1 || true
  command codex "\$@"
}
alias codex='spec_first_codex'
$END_MARK
EOF

echo "installed codex autostart hook: $TARGET_PROFILE"
echo "run: source $TARGET_PROFILE"
