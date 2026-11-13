#!/bin/bash
# 采集研发链路 Skill 审查第 3.9 节使用的确定性统计事实。
# 只读：不修改仓库内容。输出为 Markdown，结果只用于定位检查重点，不作为质量结论。
# 用法：bash docs/project-reviews/evidence/_shared/collect-skill-facts.sh [skill ...] > <输出文件>
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

DEFAULT_SKILLS=(
  spec-runtime-setup spec-ideate spec-brainstorm spec-prd spec-plan spec-write-tasks
  spec-work spec-code-review spec-compound spec-doc-review spec-debug spec-test-browser
  spec-test-xcode spec-resolve-pr-feedback spec-handoff spec-compound-refresh spec-lfg
  spec-commit spec-commit-push-pr spec-worktree using-spec-first spec-simplify-code
)
if [ "$#" -gt 0 ]; then SKILLS=("$@"); else SKILLS=("${DEFAULT_SKILLS[@]}"); fi

count_matches() {
  # $1 = 正则（ERE），其余参数 = 文件；文件不存在或无匹配时输出 0
  local pattern="$1"; shift
  local total=0 n f
  for f in "$@"; do
    [ -f "$f" ] || continue
    n=$( { grep -oE "$pattern" "$f" 2>/dev/null || true; } | wc -l | tr -d ' ')
    total=$((total + n))
  done
  echo "$total"
}

echo "# Skill 统计事实"
echo
echo "- 采集时间：$(date '+%Y-%m-%d %H:%M:%S %z')"
echo "- commit：$(git rev-parse HEAD)"
echo "- 采集命令：\`bash docs/project-reviews/evidence/_shared/collect-skill-facts.sh $*\`"
echo
echo "| Skill | skills/ 下未提交改动 | SKILL.md 行数 | SKILL.md SHA-256 | description 字符数 | references Markdown 行数 | 引用其他 .md 的 reference 文件数 | 英文强制措辞（SKILL.md / references） | 中文强制措辞（SKILL.md / references） | 推理外显措辞（全部 .md） | 提及调用策略字段的文件数 | evals 文件数 |"
echo "|---|---|---|---|---|---|---|---|---|---|---|---|"

for s in "${SKILLS[@]}"; do
  dir="skills/$s"
  md="$dir/SKILL.md"
  if [ ! -f "$md" ]; then
    echo "| $s | 缺失 | - | - | - | - | - | - | - | - | - | - |"
    continue
  fi
  dirty=$(git status --porcelain -- "$dir" | wc -l | tr -d ' ')
  lines=$(wc -l < "$md" | tr -d ' ')
  sha=$(shasum -a 256 "$md" | cut -c1-12)
  desc=$( { grep -m1 '^description:' "$md" || true; } | sed 's/^description:[[:space:]]*//' | wc -m | tr -d ' ')

  ref_files=()
  if [ -d "$dir/references" ]; then
    while IFS= read -r f; do ref_files+=("$f"); done < <(find "$dir/references" -name '*.md' -type f | sort)
  fi
  ref_lines=0; nested=0
  if [ "${#ref_files[@]}" -gt 0 ]; then
    ref_lines=$(cat "${ref_files[@]}" | wc -l | tr -d ' ')
    nested=$( { grep -lE '\]\([^)]*\.md[^)]*\)|references/[A-Za-z0-9_./-]+\.md' "${ref_files[@]}" 2>/dev/null || true; } | wc -l | tr -d ' ')
  fi

  en_pat='\b(MUST|NEVER|ALWAYS|CRITICAL|IMPORTANT)\b'
  zh_pat='必须|禁止|不得|严禁'
  en_main=$(count_matches "$en_pat" "$md")
  zh_main=$(count_matches "$zh_pat" "$md")
  en_ref=0; zh_ref=0
  if [ "${#ref_files[@]}" -gt 0 ]; then
    en_ref=$(count_matches "$en_pat" "${ref_files[@]}")
    zh_ref=$(count_matches "$zh_pat" "${ref_files[@]}")
  fi

  all_md=()
  while IFS= read -r f; do all_md+=("$f"); done < <(find "$dir" -name '*.md' -type f | sort)
  reason_pat='[Ss]how (your )?(reasoning|thinking)|[Ww]rite (out )?your reasoning|<thinking>|[Tt]hink step[- ]by[- ]step|[Cc]hain[- ]of[- ]thought|写出(你的)?(推理|思考)过程|展示(你的)?(推理|思考)过程|逐步思考'
  reason=$(count_matches "$reason_pat" "${all_md[@]}")

  policy=$( { grep -rlE 'allow_implicit_invocation|disable-model-invocation' "$dir" 2>/dev/null || true; } | wc -l | tr -d ' ')
  evals=0
  [ -d "$dir/evals" ] && evals=$(find "$dir/evals" -type f | wc -l | tr -d ' ')

  echo "| $s | $dirty | $lines | \`$sha\` | $desc | $ref_lines | $nested | $en_main / $en_ref | $zh_main / $zh_ref | $reason | $policy | $evals |"
done

echo
total_desc=0
for f in skills/*/SKILL.md; do
  n=$( { grep -m1 '^description:' "$f" || true; } | sed 's/^description:[[:space:]]*//' | wc -m | tr -d ' ')
  total_desc=$((total_desc + n))
done
skill_count=$(ls skills/*/SKILL.md | wc -l | tr -d ' ')
echo "- 全部 source skill 数：${skill_count}；description 合计字符数：${total_desc}（对照 Codex 在上下文未知时 8,000 字符的初始列表预算，见调研记录 R23）"
echo "- SHA-256 只截取前 12 位用于识别版本；作为结论依据的未提交文件须另行记录完整 hash。"
echo "- 计数只用于定位检查重点：计数高不等于写得差，计数低也不等于没有问题。"
