#!/bin/bash
# 变异探针：验证修复后的 test/server.test.js 是否真能抓到对应缺陷。
# 每个探针改一处 src/server.js，跑 npm test，期望 FAIL；跑完恢复。
set -uo pipefail
cd /tmp/phase5-review/repo || exit 1

run_probe() {
  local name="$1" pattern="$2" replacement="$3"
  cp src/server.js /tmp/phase5-review/server.orig.js
  node -e '
    const fs=require("fs");
    const p="src/server.js";
    const src=fs.readFileSync(p,"utf8");
    const pat=process.argv[1], rep=process.argv[2];
    if(!src.includes(pat)){console.error("PATTERN_NOT_FOUND");process.exit(3);}
    fs.writeFileSync(p, src.replace(pat, rep));
  ' "$pattern" "$replacement" || { echo "$name: PATTERN_MISSING"; return; }
  local out
  out=$(npm test 2>&1 | tail -20)
  local fails
  fails=$(printf '%s' "$out" | sed -n 's/^# fail \([0-9]*\)$/\1/p' | tail -1)
  fails=${fails:-0}
  if [ "$fails" -gt 0 ]; then
    echo "$name: KILLED (failing tests: $fails)"
    printf '%s' "$out" | grep '^not ok' | head -4
  else
    echo "$name: SURVIVED (no failing test — 用例漏检)"
  fi
  cp /tmp/phase5-review/server.orig.js src/server.js
}

# M1: 列表截断（只返回末尾 2 条）
run_probe "M1-list-truncation" "const filtered = month ? entries.filter(e => new Date(e.ts).toISOString().slice(0,7) === month) : entries;" "const filtered = (month ? entries.filter(e => new Date(e.ts).toISOString().slice(0,7) === month) : entries).slice(-2);"
# M2: 忽略 month 参数
run_probe "M2-month-ignored" "const filtered = month ? entries.filter(e => new Date(e.ts).toISOString().slice(0,7) === month) : entries;" "const filtered = entries;"
# M3: 尾斜杠被归一化
run_probe "M3-trailing-slash-normalized" "const idSegment = u.pathname.slice('/entries/'.length);" "const idSegment = u.pathname.slice('/entries/'.length).replace(/\/$/, '');"
# M4: 子路径不校验方法（PUT/PATCH/DELETE 也被接受）
run_probe "M4-any-method-subpath" "if (req.method === 'GET' && req.url.startsWith('/entries/')) {" "if (req.url.startsWith('/entries/')) {"

# M5: 全有/全无月份过滤（「首条月份相同就返回全量，否则空」）
run_probe "M5-month-all-or-none" "const filtered = month ? entries.filter(e => new Date(e.ts).toISOString().slice(0,7) === month) : entries;" "const filtered = month ? (entries.length && new Date(entries[0].ts).toISOString().slice(0,7) === month ? entries : []) : entries;"

git diff --stat
