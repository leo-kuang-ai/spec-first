#!/bin/bash
set -euo pipefail

node - <<'NODE'
const raw = process.env.EVAL_FINAL_MESSAGE || '';
let result;
try {
  result = JSON.parse(raw);
} catch (error) {
  console.error(`冲突参数输出不是单个裸 JSON：${error.message}`);
  process.exit(1);
}

if (result.status !== 'failed') {
  console.error('冲突 scope 参数未返回 failed');
  process.exit(1);
}
if (!/(base|scope|branch|分支|冲突|cannot use)/i.test(result.reason || '')) {
  console.error('失败原因未说明 base 与 branch target 冲突');
  process.exit(1);
}
if (Array.isArray(result.findings) && result.findings.length > 0) {
  console.error('参数冲突后仍然执行了审查');
  process.exit(1);
}
NODE
