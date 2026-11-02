#!/usr/bin/env python3
"""汇总 skill-up result.json 中每个用例的 token、耗时与状态。

用法：python3 tally.py <标签>=<skill-up 输出目录> [...]
输出每个标签的运行数、状态计数、input/output token 合计与耗时；最后一行为总计。
skill-up 报告的 input_tokens 对 codex 包含缓存命中的输入。错误中断的运行可能缺少 token。
"""
import glob
import json
import os
import sys


def main():
    total = {'runs': 0, 'in': 0, 'out': 0, 'ms': 0}
    for arg in sys.argv[1:]:
        label, root = arg.split('=', 1)
        row = {'runs': 0, 'in': 0, 'out': 0, 'ms': 0, 'status': {}}
        for f in sorted(glob.glob(os.path.join(root, 'iteration-*', 'result.json'))):
            r = json.load(open(f))
            for c in r.get('case_results') or []:
                row['runs'] += 1
                row['in'] += c.get('input_tokens') or 0
                row['out'] += c.get('output_tokens') or 0
                row['ms'] += c.get('duration_ms') or 0
                row['status'][c.get('status')] = row['status'].get(c.get('status'), 0) + 1
        print(json.dumps({'label': label, **row}, ensure_ascii=False))
        for k in ('runs', 'in', 'out', 'ms'):
            total[k] += row[k]
    print(json.dumps({'label': 'TOTAL', **total, 'tokens': total['in'] + total['out']}))


if __name__ == '__main__':
    main()
