#!/bin/bash
# 第二批盲评：GLM 组输出由 gpt-6-astra（codex exec）评判，gpt 组由 GLM（claude -p）评判；不加载 skill、不用工具。
# 用法：bash run-blind2.sh <case> <GLM 组根目录> <gpt 组根目录> [B 组根目录后缀，S20 用]
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"; ISO="$HERE/../_shared/isolated-run.sh"; OUT=/tmp/batch3/blind; mkdir -p "$OUT" /tmp/batch3/blind-cwd
case_id="$1"; glm="$2"; gpt="$3"; glm_b="${4:-$2}"; gpt_b="${5:-$3}"
pick() { [ -d "$1/iteration-1/$case_id/$2/outputs" ] && echo "$1/iteration-1/$case_id/$2/outputs"; }
cfg_a=with_skill; cfg_b=without_skill; [ "$glm_b" != "$glm" ] && cfg_b=with_skill
seed=$(( 20261200 + ${#case_id} ))
for side in glm gpt; do
  if [ $side = glm ]; then a=$(pick "$glm" $cfg_a); b=$(pick "$glm_b" $cfg_b); else a=$(pick "$gpt" $cfg_a); b=$(pick "$gpt_b" $cfg_b); fi
  id="$side-$case_id"; seed=$((seed + 1))
  python3 "$HERE/blind2.py" prepare "$OUT/$id.json" "$seed" "$case_id" "$a" "$b"
  p="$(python3 -c "import json,sys;print(json.load(open(sys.argv[1]))['prompt'])" "$OUT/$id.json")"
  if [ $side = glm ]; then
    (cd /tmp/batch3/blind-cwd && bash "$ISO" /tmp/batch3/iso-blind-gpt codex exec --skip-git-repo-check --sandbox read-only --ephemeral -o "$OUT/$id.raw.txt" "$p" < /dev/null > "$OUT/$id.log" 2>&1) || true
  else
    (cd /tmp/batch3/blind-cwd && bash "$ISO" /tmp/batch3/iso-blind-glm claude -p --tools "" --disable-slash-commands --output-format text "$p" < /dev/null > "$OUT/$id.raw.txt" 2> "$OUT/$id.log") || true
  fi
  python3 "$HERE/blind2.py" parse "$OUT/$id.json" "$OUT/$id.raw.txt"
done
