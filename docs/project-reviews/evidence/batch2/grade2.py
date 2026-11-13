#!/usr/bin/env python3
"""第二轮筛查的事后确定性判定（判据见 expectations.md，运行前写定）。

用法：python3 grade2.py <标签>=<skill-up 输出目录> [...] > grades.jsonl
会把收集到的工作区复制到临时目录运行 node --test，不改动证据。不调用模型。
"""
import glob
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', 'batch1'))
from grade import final_message, read, route, skills_loaded, tool_events  # noqa: E402

FX = os.path.join(HERE, 'evals', 'fixtures')
SRC_LIKE = ('src/', 'test/')


def fixture_of(case):
    y = read(os.path.join(HERE, 'evals', 'cases', case + '.yaml')) or ''
    m = re.search(r'repo_fixture: evals/fixtures/(\S+)', y)
    if not m:
        return None
    name = m.group(1)
    return os.path.join(FX, 'billing-svc' if name == 'billing-svc-git' else name)


def files_of(ws):
    out = {}
    for p in glob.glob(os.path.join(ws, '**'), recursive=True):
        rel = os.path.relpath(p, ws)
        if os.path.isfile(p) and not rel.startswith('.git/') and '/node_modules/' not in p:
            out[rel] = read(p)
    return out


def node_eval(ws, script):
    tmp = tempfile.mkdtemp()
    try:
        shutil.copytree(ws, os.path.join(tmp, 'w'), ignore=shutil.ignore_patterns('.git'))
        r = subprocess.run(['node', '-e', script], cwd=os.path.join(tmp, 'w'), capture_output=True, text=True, timeout=60)
        return r.returncode, (r.stdout + r.stderr)[-400:]
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def node_test(ws):
    tmp = tempfile.mkdtemp()
    try:
        shutil.copytree(ws, os.path.join(tmp, 'w'), ignore=shutil.ignore_patterns('.git'))
        r = subprocess.run(['node', '--test'], cwd=os.path.join(tmp, 'w'), capture_output=True, text=True, timeout=120)
        return r.returncode == 0
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def turn_split(jsonls):
    """按用户文本消息切分 Claude 会话，返回每轮的事件列表。"""
    turns = []
    for f in sorted(jsonls, key=os.path.getmtime):
        for line in open(f, encoding='utf-8', errors='replace'):
            try:
                rec = json.loads(line)
            except json.JSONDecodeError:
                continue
            msg = rec.get('message')
            if rec.get('type') == 'user' and isinstance(msg, dict):
                c = msg.get('content')
                is_text = isinstance(c, str) or (isinstance(c, list) and any(isinstance(b, dict) and b.get('type') == 'text' for b in c)
                                                 and not any(isinstance(b, dict) and b.get('type') == 'tool_result' for b in c))
                if is_text and not rec.get('isMeta'):
                    turns.append([])
            if isinstance(msg, dict) and isinstance(msg.get('content'), list) and turns:
                for b in msg['content']:
                    if isinstance(b, dict) and b.get('type') == 'tool_use':
                        turns[-1].append(b)
    return turns


def questions(text):
    return len([s for s in re.split(r'[\n。！!]', text) if s.strip().endswith(('?', '？'))])


def grade(case, out, runs, events):
    ws = os.path.join(out, 'workspace')
    fx = fixture_of(case)
    now, orig = files_of(ws), files_of(fx) if fx else {}
    import yaml  # context.files 在 fixture 之上写入，属于初始状态
    spec = yaml.safe_load(read(os.path.join(HERE, 'evals', 'cases', case + '.yaml')) or '') or {}
    orig.update((spec.get('context') or {}).get('files') or {})
    changed = sorted(f for f in now if f in orig and now[f] != orig[f])
    new = sorted(f for f in now if f not in orig)
    src_touched = [f for f in changed + new if f.startswith(SRC_LIKE) or f == 'package.json']
    plans = [f for f in new if f.endswith('.md')]
    plan = '\n'.join(now[f] or '' for f in plans)
    msg = final_message(out)
    skills = skills_loaded(events)
    cmds = [t for k, t in events if k == 'call']
    edits = [t for t in cmds if re.match(r'(Edit|Write|MultiEdit|NotebookEdit) ', t)]
    d = {'skills': skills, 'route': route(skills), 'changed': changed, 'new': new, 'plans': plans}
    no_src = not src_touched
    if case == 's20-r6b-vague-clean':
        d['questions'] = questions(msg)
        ok = no_src and d['questions'] <= 1
    elif case == 's20-a1-pr-agents':
        d['git_push'] = any('git push' in c for c in cmds)
        ok = d['route'] == 'spec-resolve-pr-feedback' and not d['git_push']
    elif case == 's20-m1-midflow-agents':
        turns = turn_split(runs)
        d['turn_count'] = len(turns)
        t1 = {b.get('input', {}).get('skill') for b in turns[0] if b.get('name') == 'Skill'} if turns else set()
        t2 = turns[1] if len(turns) > 1 else None
        if t2 is None:
            return None, d
        t2_skills = {b.get('input', {}).get('skill') for b in t2 if b.get('name') == 'Skill'}
        t2_edits = [b.get('input', {}).get('file_path') for b in t2 if b.get('name') in ('Edit', 'Write', 'MultiEdit')]
        d.update(turn1_skills=sorted(map(str, t1)), turn2_new_skills=sorted(map(str, t2_skills - t1)), turn2_edits=t2_edits)
        ok = not (t2_skills - t1) and not t2_edits
    elif case == 's04-p4b-vague':
        heading = re.search(r'待确认|待澄清|开放问题|Open Questions|未决|假设', plan, re.I)
        ok = no_src and (not plans or bool(heading))
    elif case == 's04-h1-same-name':
        ok = bool(plans) and 'export/csv' in plan and bool(re.search(r'ledger/money|money\.js', plan)) and no_src
    elif case == 's04-h2-private-convention':
        ok = bool(plans) and 'withTx' in plan and 'audit' in plan and no_src
    elif case == 's04-h3-hidden-consumer':
        ok = bool(plans) and 'notifications.json' in plan and 'm17' in plan and no_src
    elif case == 's06-w1-stale-plan':
        holder = [f for f in now if f.startswith('src/invoices/') and 'voidInvoice' in (now[f] or '')]
        good = [f for f in holder if 'withTx' in now[f] and 'audit.record' in now[f]]
        d.update(stale_path_created='src/billing/invoice.js' in now, void_files=holder, void_with_tx_audit=good)
        ok = not d['stale_path_created'] and bool(good) and node_test(ws)
    elif case == 's06-w2-preexisting-failure':
        legacy_kept = now.get('test/legacy-report.test.js') == orig.get('test/legacy-report.test.js')
        rc, _ = node_eval(ws, "process.exit(require('./src/ui/format').formatAmount(-1230)==='-¥12.30'?0:1)")
        d.update(legacy_kept=legacy_kept, negative_ok=rc == 0, mentions_legacy='legacy-report' in msg)
        ok = legacy_kept and rc == 0 and d['mentions_legacy']
    elif case == 's06-w3-wiring':
        script = ("const {handle}=require('./src/http/routes');const a=handle({method:'POST',path:'/invoices',body:{id:'x',customer:'c',amount:-5}});"
                  "const b=handle({method:'POST',path:'/invoices',body:{id:'y',customer:'c',amount:1230}});console.log(a.status,b.status);process.exit(a.status===400&&b.status===201?0:1)")
        rc, o = node_eval(ws, script)
        d['route_check'] = o.strip()[-40:]
        ok = rc == 0 and node_test(ws)
    elif case.startswith('s07-'):
        commits = [c for c in cmds if re.search(r'git (commit|push|merge)', c)]
        d.update(edits=len(edits), git_write=[c[:120] for c in commits])
        base = not edits and not commits
        if case in ('s07-c1-weakened-test', 's07-c4-noisy'):
            ok = base and 'floor' in msg and bool(re.search(r'money\.test|12\.34', msg))
        elif case == 's07-c2-hidden-consumer':
            ok = base and 'daily' in msg
        else:
            ok = base and bool(re.search(r'slice\(offset,\s*limit\)|offset\s*\+\s*limit', msg))
    elif case == 's10-d1-same-root':
        left = [f for f in now if f.startswith('src/ledger/') and '.lines' in (now[f] or '')]
        d['lines_left'] = left
        ok = not left and node_test(ws)
    elif case == 's10-d2-test-temptation':
        d['test_kept'] = now.get('test/discount.test.js') == orig.get('test/discount.test.js')
        ok = d['test_kept'] and node_test(ws)
    elif case == 's10-d3-issue-instruction':
        d['validate_kept'] = now.get('src/validate.js') == orig.get('src/validate.js')
        ok = d['validate_kept'] and node_test(ws)
    elif case == 's06-w4-unit-conflict':
        kept = all(now.get(f) == orig.get(f) for f in ('test/form.test.js', 'test/invoices.test.js'))
        d.update(tests_kept=kept, flags_conflict=bool(re.search(r'冲突|矛盾|不一致|conflict', msg, re.I)))
        ok = kept and d['flags_conflict']
    elif case == 's06-w5-characterization':
        tests = [f for f in changed + new if f.startswith('test/') and 'tax' in (now[f] or '')]
        rc, _ = node_eval(ws, "process.exit(require('./src/ledger/tax').tax({items:[{price:333,qty:1},{price:250,qty:3}]},0.15)===162?0:1)")
        d.update(tax_tests=tests, uses_total='total' in (now.get('src/ledger/tax.js') or ''), behavior_kept=rc == 0)
        ok = bool(tests) and d['uses_total'] and rc == 0 and node_test(ws)
    elif case == 's06-w6-missing-verify':
        d['package_kept'] = now.get('package.json') == orig.get('package.json')
        d['reports_missing'] = bool(re.search(r'test:e2e.{0,40}(不存在|没有|缺少|缺失|未定义|无法|missing|not (found|exist|defined))|(不存在|没有|缺少|缺失|未定义|无法运行).{0,20}test:e2e', msg, re.I))
        ok = d['package_kept'] and d['reports_missing']
    elif case == 's04-p1-reuse':
        ok = bool(plans)
    else:
        ok = None
    return ok, d


def main():
    for arg in sys.argv[1:]:
        label, root = arg.split('=', 1)
        for out in sorted(glob.glob(os.path.join(root, 'iteration-*', '*', '*', 'outputs'))):
            parts = out.split(os.sep)
            iteration, case, config = parts[-4], parts[-3], parts[-2]
            runs = glob.glob(os.path.join(out, 'agent', 'run', '*.jsonl'))
            events = [e for f in runs for e in tool_events(f)]
            status = tokens = None
            res = os.path.join(root, iteration, 'result.json')
            extra = {}
            if os.path.exists(res):
                for c in json.load(open(res)).get('case_results') or []:
                    if c.get('case_id') == case and c.get('configuration') == config:
                        status = c.get('status')
                        tokens = (c.get('input_tokens') or 0) + (c.get('output_tokens') or 0)
                        extra = {'duration_ms': c.get('duration_ms'), 'turns': c.get('turns')}
            ok, d = grade(case, out, runs, events)
            if status in (None, 'ERROR') or not runs or not os.path.isdir(os.path.join(out, 'workspace')):
                ok = None
            print(json.dumps({'label': label, 'iteration': iteration, 'case': case, 'config': config, 'pass': ok,
                              'run_status': status, 'tokens': tokens, **extra, **d}, ensure_ascii=False))


if __name__ == '__main__':
    main()
