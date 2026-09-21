#!/bin/bash
# 断言:create 经 writer 产出唯一 spec-handoff/v1 artifact；验证真实
# frontmatter、artifact 内容 SHA-256 与指向同一文件的精确 resume 调用。
set -euo pipefail

message="${EVAL_FINAL_MESSAGE:-}"
[[ -z "$message" ]] && { echo '最终输出为空'; exit 1; }

# 该 fixture 初始不存在受管 artifact，create 必须产生恰好一个普通文件。
artifacts=$(find .spec-first/workflows/spec-handoff -type f -name '*.md' 2>/dev/null)
[[ "$(printf '%s\n' "$artifacts" | sed '/^$/d' | wc -l | tr -d ' ')" == '1' ]] || { echo 'create 必须产出唯一 artifact'; exit 1; }
art="$artifacts"
[[ ! -L "$art" ]] || { echo 'artifact 不得是符号链接'; exit 1; }

artifact_sha256=$(if command -v sha256sum >/dev/null 2>&1; then sha256sum "$art" | cut -d' ' -f1; else shasum -a 256 "$art" | cut -d' ' -f1; fi)

grep -q 'spec-handoff/v1' "$art" || { echo 'artifact 缺 artifact_contract: spec-handoff/v1'; exit 1; }

# handoff gate 四字段非空(空数组或空值视为缺失)
for field in summary source_refs freshness limitations; do
  line=$(grep -E "^${field}:" "$art" | head -1)
  [[ -n "$line" ]] || { echo "缺少字段 ${field}"; exit 1; }
  val=$(printf '%s' "${line#*:}" | tr -d '"' | tr -d ' ')
  if [[ -z "$val" || "$val" == "[]" ]]; then echo "字段 ${field} 为空"; exit 1; fi
done

node - "$art" <<'NODE'
const fs=require('fs');
const text=fs.readFileSync(process.argv[2],'utf8');
const match=text.match(/^---\n([\s\S]*?)\n---\n/);
if(!match) throw new Error('artifact frontmatter missing');
const data={};
for(const line of match[1].split('\n')) {
  const m=line.match(/^([a-z_]+):\s*(.+)$/);
  if(!m) throw new Error('malformed frontmatter');
  data[m[1]]=JSON.parse(m[2]);
}
if(data.artifact_contract!=='spec-handoff/v1') throw new Error('wrong artifact contract');
if(typeof data.summary!=='string'||!data.summary.trim()) throw new Error('summary must be non-empty string');
for(const key of ['summary','source_refs','freshness','limitations']) {
  const value=data[key];
  if((typeof value==='string' && !value.trim()) || (Array.isArray(value) && value.length===0)) throw new Error(`empty ${key}`);
}
for(const key of ['source_refs','freshness','limitations']) if(!Array.isArray(data[key])||data[key].some(value=>typeof value!=='string'||!value.trim())) throw new Error(`${key} must contain non-empty strings`);
NODE

python3 - "$message" "$artifact_sha256" "$art" <<'PY'
import re,sys
message,digest,path=sys.argv[1:]
if not re.search(r'(?<![0-9a-f])'+re.escape(digest)+r'(?![0-9a-f])', message, re.I):
    raise SystemExit('汇报未包含实际 artifact SHA-256')
if not re.search(r'(?<![\w-])spec-handoff resume '+re.escape(path)+r'(?=$|[\s`])', message):
    raise SystemExit('汇报未包含指向实际 artifact 的精确 resume 调用')
PY
exit 0
