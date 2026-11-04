#!/usr/bin/env python3
"""Agreement matrix: parse per-rater 18-item rubric verdicts and compare.

Usage: matrix.py <skill> <rater-file-1> <rater-file-2> [<rater-file-3>]
Output: per-dimension verdict table + agreement summary (stdout).
"""
import re, sys, collections

PAT = re.compile(r'^\|\s*(D0[1-8]|B0[1-6]|X0[1-4])[^\n|]*\|\s*([a-z-]+)')
DIMS = ['D0%d' % i for i in range(1, 9)] + ['B0%d' % i for i in range(1, 7)] + ['X0%d' % i for i in range(1, 5)]

def parse(path):
    verdicts, cur = {}, None
    for line in open(path, encoding='utf-8', errors='replace'):
        m = PAT.match(line)
        if m:
            cur, v = m.group(1), m.group(2)
            verdicts[cur] = v
            continue
        # continuation line carrying a bare verdict for the current dim
        if cur and cur not in verdicts:
            mv = re.match(r'^\|\s*(pass|fail|not-applicable|not-verified)\s*\|', line)
            if mv:
                verdicts[cur] = mv.group(1)
    return verdicts

def main():
    skill, files = sys.argv[1], sys.argv[2:]
    parsed = [(f.split('/')[-1], parse(f)) for f in files]
    print(f'== {skill} ==')
    agree_full, agree_maj, disagree, missing = [], [], [], []
    for d in DIMS:
        row = [(name, v.get(d, '?')) for name, v in parsed]
        vs = [x[1] for x in row]
        known = [x for x in vs if x in ('pass', 'fail', 'not-applicable')]
        if '?' in vs:
            missing.append((d, row)); tag = 'MISS'
        elif len(set(vs)) == 1:
            agree_full.append((d, vs[0])); tag = 'ALL=' + vs[0]
        else:
            cnt = collections.Counter(vs)
            top, n = cnt.most_common(1)[0]
            if n > len(vs) / 2:
                agree_maj.append((d, top, dict(cnt))); tag = 'MAJ=' + top + ' ' + str(dict(cnt))
            else:
                disagree.append((d, dict(cnt))); tag = 'DISAGREE ' + str(dict(cnt))
        print(f'{d:5s} {tag:60s} ' + ' | '.join(f'{n.split("-")[0][-6:]}:{v}' for n, v in row))
    print('---')
    print(f'全一致 {len(agree_full)}  多数 {len(agree_maj)}  分歧 {len(disagree)}  缺失 {len(missing)}  总 {len(DIMS)}')
    for d, row in missing: print('  MISSING', d, row)
    for d, cnt in disagree: print('  DISAGREE', d, cnt)
    for d, top, cnt in agree_maj: print('  MAJORITY', d, '->', top, cnt)

if __name__ == '__main__':
    main()
