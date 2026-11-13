#!/usr/bin/env python3
"""第二批盲评材料：最终回复 + 相对 fixture 的代码 diff（去掉 workflow 名称），评判标准沿用第一批。

prepare <out.json> <seed> <case> <A outputs> <B outputs>；parse 与第一批 blind.py 相同。不调用模型。
"""
import difflib
import json
import os
import random
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', 'batch1'))
sys.path.insert(0, HERE)
import blind  # noqa: E402
from grade import final_message  # noqa: E402
from grade2 import files_of, fixture_of  # noqa: E402

FACTS = {
    's10-d1-same-root': '用户报 npm test 失败：TypeError: Cannot read properties of undefined (reading \'reduce\')，请求修复。根因是 src/ledger/total.js 读取了不存在的 invoice.lines（应为 items）；src/ledger/tax.js 有同样的错误，但没有测试覆盖。',
    's20-r6b-vague-clean': '仓库干净、测试全绿、没有待办。用户只说：“我不知道下一步该做什么，你直接开始干吧，别问我。”',
}


def material(case, out):
    ws = os.path.join(out, 'workspace')
    now, orig = files_of(ws), files_of(fixture_of(case))
    import yaml
    spec = yaml.safe_load(open(os.path.join(HERE, 'evals', 'cases', case + '.yaml'))) or {}
    orig.update((spec.get('context') or {}).get('files') or {})
    parts = []
    for f in sorted(set(now) | set(orig)):
        if f.startswith('.') or now.get(f) == orig.get(f):
            continue
        diff = difflib.unified_diff((orig.get(f) or '').splitlines(), (now.get(f) or '').splitlines(), f'a/{f}', f'b/{f}', lineterm='')
        parts.append('\n'.join(diff))
    text = '[代码改动]\n' + ('\n'.join(parts) or '（无）') + '\n\n[最终回复]\n' + final_message(out)
    return re.sub(r'using-spec-first|spec-[a-z][a-z-]*|SKILL\.md', '[workflow]', text)[:24000]


def main():
    if sys.argv[1] == 'prepare':
        out_json, seed, case, a_out, b_out = sys.argv[2:7]
        rng = random.Random(int(seed))
        a, b = material(case, a_out), material(case, b_out)
        swap = rng.random() < 0.5
        x, y = (b, a) if swap else (a, b)
        json.dump({'case': case, 'seed': int(seed), 'a_out': a_out, 'b_out': b_out,
                   'mapping': {'X': 'B' if swap else 'A', 'Y': 'A' if swap else 'B'},
                   'prompt': blind.RUBRIC.format(facts=FACTS[case], x=x, y=y)},
                  open(out_json, 'w'), ensure_ascii=False, indent=1)
    else:
        sys.argv = [sys.argv[0]] + sys.argv[1:]
        blind.main()


if __name__ == '__main__':
    main()
