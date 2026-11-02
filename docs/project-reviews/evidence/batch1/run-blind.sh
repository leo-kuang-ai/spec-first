#!/bin/bash
# 第一批盲评：GLM 组输出由 gpt-6-astra（codex exec）评判，gpt 组输出由 GLM（claude -p）评判。
# 评判调用在隔离环境中运行，不加载 skill、不使用工具；材料只含 fixture 派生的计划与回复。
# 提示语以参数传入：isolated-run.sh 内部的 heredoc 会占用 stdin。
# 用法：bash run-blind.sh <skill-up 输出根目录，如 /tmp/batch1> <结果目录>
set -euo pipefail
RUNS="$1"; OUT="$2"
HERE="$(cd "$(dirname "$0")" && pwd)"
ISO="$HERE/../_shared/isolated-run.sh"
mkdir -p "$OUT" "$RUNS/blind-cwd"
seed=20261101
judge() {  # $1=id $2=case $3=A outputs $4=B outputs $5=judge(gpt|glm)
  local id="$1" json="$OUT/$1.json" raw="$OUT/$1.raw.txt"
  seed=$((seed + 1))
  python3 "$HERE/blind.py" prepare "$json" "$seed" "$2" "$3" "$4"
  python3 -c "import json,sys;print(json.load(open(sys.argv[1]))['prompt'])" "$json" > "$OUT/$1.prompt.txt"
  if [ "$5" = gpt ]; then
    (cd "$RUNS/blind-cwd" && bash "$ISO" "$RUNS/iso-blind-gpt" codex exec --skip-git-repo-check --sandbox read-only --ephemeral -o "$raw" "$(cat "$OUT/$1.prompt.txt")" < /dev/null > "$OUT/$1.log" 2>&1) || true
  else
    (cd "$RUNS/blind-cwd" && bash "$ISO" "$RUNS/iso-blind-glm" claude -p --tools "" --disable-slash-commands --output-format text "$(cat "$OUT/$1.prompt.txt")" < /dev/null > "$raw" 2> "$OUT/$1.log") || true
  fi
  python3 "$HERE/blind.py" parse "$json" "$raw"
}
for c in s04-p1-reuse s04-p2-implicit-consumer s04-p3-unverified-dependency s04-p4-vague; do
  judge "glm-$c" "$c" "$RUNS/s04-glm/iteration-1/$c/with_skill/outputs" "$RUNS/s04-glm/iteration-1/$c/without_skill/outputs" gpt
  judge "gpt-$c" "$c" "$RUNS/s04-gpt/iteration-1/$c/with_skill/outputs" "$RUNS/s04-gpt/iteration-1/$c/without_skill/outputs" glm
done
for c in s20-r3-pr-feedback s20-r8-env; do
  judge "glm-$c" "$c" "$RUNS/s20a-glm/iteration-1/$c/with_skill/outputs" "$RUNS/s20b-glm/iteration-1/$c/with_skill/outputs" gpt
  judge "gpt-$c" "$c" "$RUNS/s20a-gpt2/iteration-1/$c/with_skill/outputs" "$RUNS/s20b-gpt/iteration-1/$c/with_skill/outputs" glm
done
