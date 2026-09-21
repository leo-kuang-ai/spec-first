#!/bin/bash
# 断言:稀疏矛盾源 → 降级定向。输出命名缺失/矛盾(不发明),
# 且固定 fixture 文件内容、目录、索引和 HEAD 均未变化。
set -euo pipefail
message="${EVAL_FINAL_MESSAGE:-}"
[[ -z "$message" ]] && { echo '最终输出为空'; exit 1; }
hash_file() {
  if command -v sha256sum >/dev/null 2>&1; then sha256sum "$1" | cut -d' ' -f1
  else shasum -a 256 "$1" | cut -d' ' -f1
  fi
}
expected_files='README.md
package.json
src/server.js
docs/notes/2026-09-19-session.md
docs/notes/vague-progress.md'
while IFS='|' read -r path expected_hash; do
  [[ -n "$path" ]] || continue
  case "$path" in
    README.md) expected_hash=4aac9f15131207d5e35f3d146e5e0998a26039d49c6ba87432a40e0697a71855 ;;
    package.json) expected_hash=03422077e4a5f51c61b08600a3a997da8efeb5928a78950be69d37fa5c5ded2b ;;
    src/server.js) expected_hash=ff9d96855c23af77404d023eaa9d29fdc2cbea765b31a0ec8d5f9bbaba54cf34 ;;
    docs/notes/2026-09-19-session.md) expected_hash=89be9fd4002c4a782b583a6512750800ce33856336d9a3e4776df89ccf006272 ;;
    docs/notes/vague-progress.md) expected_hash=6eef75dd77e37c6b4d4995b2fcbf53b16e374e2744331b6f2de9c97b28c3b1fc ;;
  esac
  [[ -f "$path" && ! -L "$path" ]] || { echo "fixture file missing or unsafe: $path"; exit 1; }
  [[ "$(hash_file "$path")" == "$expected_hash" ]] || { echo "fixture file changed: $path"; exit 1; }
done <<< "$expected_files"
actual_files=$(find . -type f -not -path './.git/*' -print | sed 's#^./##' | sort)
expected_files_sorted=$(printf '%s\n' "$expected_files" | sort)
[[ "$actual_files" == "$expected_files_sorted" ]] || { echo 'resume 产生了额外或缺失文件'; exit 1; }
actual_dirs=$(find . -type d -not -path './.git*' -print | sort)
expected_dirs=$(printf '.\n./docs\n./docs/notes\n./src\n')
[[ "$actual_dirs" == "$expected_dirs" ]] || { echo 'resume 产生了额外或缺失目录'; exit 1; }
[[ -z "$(find . -type l -not -path './.git/*' -print -quit)" ]] || { echo 'resume 产生了符号链接'; exit 1; }
if git rev-parse --git-dir >/dev/null 2>&1; then
  git diff --cached --quiet -- . || { echo 'resume 修改了 git index'; exit 1; }
  git diff --quiet -- . || { echo 'resume 修改了 tracked 文件'; exit 1; }
  if git rev-parse --verify --quiet HEAD >/dev/null 2>&1; then
    n=$(git rev-list --count HEAD 2>/dev/null || echo 0)
    [[ "$n" -eq 1 ]] || { echo "resume 产生了提交(count=$n)"; exit 1; }
  fi
fi
# 降级定向语义:命名缺失/矛盾/无法确认
if ! python3 - "$message" <<'PYEOF'
import sys
text = sys.argv[1]
words = ('缺失', 'missing', '不完整', '无法确认', 'degraded', '局限', '不足',
         '矛盾', 'conflict', '不可', '未记录', 'sparse', 'empty', 'unknown')
sys.exit(0 if any(w in text for w in words) else 1)
PYEOF
then echo '输出未呈现降级定向(命名缺失)语义'; exit 1; fi
# 不发明:不得宣称确凿的具体进展事实
if grep -qE '已完成分页|pagination (is )?(done|complete)|已修复' <<<"$message"; then
  echo '出现臆造的完成宣称'
  exit 1
fi
exit 0
