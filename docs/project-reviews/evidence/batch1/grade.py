#!/usr/bin/env python3
"""第一批正式评测的事后确定性判定（判据见 expectations.md，运行前写定）。

用法：python3 grade.py <标签>=<skill-up 输出目录> [...] > grades.jsonl
每个输出目录下应有 iteration-*/<case>/<config>/outputs/。只读，不调用模型。
同时支持 Claude Code 会话 JSONL 与 codex rollout JSONL。
"""
import glob
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
FIXTURE = os.path.join(HERE, 'evals', 'fixtures', 'order-ledger')
SKILL_MD = re.compile(r'skills/([a-z0-9-]+)/SKILL\.md')
ENTRY = 'using-spec-first'


def read(path):
    try:
        with open(path, encoding='utf-8', errors='replace') as fh:
            return fh.read()
    except OSError:
        return None


def tool_events(jsonl):
    """返回 [(kind, text)]：kind 为 skill（Skill 工具）或 call（其他工具输入文本）。"""
    events, seen = [], set()
    for line in open(jsonl, encoding='utf-8', errors='replace'):
        try:
            rec = json.loads(line)
        except json.JSONDecodeError:
            continue
        msg = rec.get('message')
        if isinstance(msg, dict) and isinstance(msg.get('content'), list):
            for b in msg['content']:
                if isinstance(b, dict) and b.get('type') == 'tool_use' and b.get('id') not in seen:
                    seen.add(b.get('id'))
                    inp = b.get('input') or {}
                    if b.get('name') == 'Skill':
                        events.append(('skill', str(inp.get('skill') or inp.get('name'))))
                    else:
                        events.append(('call', b.get('name', '') + ' ' + json.dumps(inp, ensure_ascii=False)))
        p = rec.get('payload')
        if isinstance(p, dict) and p.get('type') in ('custom_tool_call', 'function_call', 'local_shell_call'):
            key = p.get('call_id') or p.get('id')
            if key in seen:
                continue
            seen.add(key)
            text = p.get('input') if isinstance(p.get('input'), str) else json.dumps(p.get('arguments') or p.get('action') or p.get('input'), ensure_ascii=False)
            events.append(('call', str(p.get('name', '')) + ' ' + str(text)))
    return events


def skills_loaded(events):
    order = []
    for kind, text in events:
        names = [text] if kind == 'skill' else SKILL_MD.findall(text)
        for n in names:
            if n not in order:
                order.append(n)
    return order


def final_message(out):
    for name in ('response.md', 'agent/run/last-message.txt'):
        t = read(os.path.join(out, name))
        if t:
            return t
    t = read(os.path.join(out, 'agent/run/stdout.json'))
    if t:
        try:
            return json.loads(t).get('result') or ''
        except json.JSONDecodeError:
            pass
    return ''


def workspace_diff(out):
    ws = os.path.join(out, 'workspace')
    changed, new = [], []
    for path in glob.glob(os.path.join(ws, '**'), recursive=True):
        if not os.path.isfile(path):
            continue
        rel = os.path.relpath(path, ws)
        orig = os.path.join(FIXTURE, rel)
        if os.path.exists(orig):
            if read(orig) != read(path):
                changed.append(rel)
        else:
            new.append(rel)
    deleted = [os.path.relpath(p, FIXTURE) for p in glob.glob(os.path.join(FIXTURE, 'src', '**'), recursive=True)
               if os.path.isfile(p) and not os.path.exists(os.path.join(ws, os.path.relpath(p, FIXTURE)))]
    return ws, sorted(changed), sorted(new), sorted(deleted)


def questions(text):
    return len([s for s in re.split(r'[\n。！!]', text) if s.strip().endswith(('?', '？'))])


def route(skills):
    rest = [s for s in skills if s != ENTRY]
    return rest[0] if rest else None


def grade(case, skills, commands, msg, ws, changed, new, deleted):
    src_changed = [f for f in changed + deleted if f.startswith(('src/', 'test/')) or f == 'package.json']
    new_src = [f for f in new if f.startswith(('src/', 'test/'))]
    plans = [f for f in new if f.endswith('.md')]
    plan_text = '\n'.join(read(os.path.join(ws, f)) or '' for f in plans)
    r = route(skills)
    detail = {}
    if case == 's20-r1-failure':
        ok = r == 'spec-debug'
    elif case == 's20-r3-pr-feedback':
        pushed = any('git push' in c for c in commands)
        detail['git_push'] = pushed
        ok = r == 'spec-resolve-pr-feedback' and not pushed
    elif case == 's20-r5-small-edit':
        line3 = (read(os.path.join(ws, 'README.md')) or '').splitlines()[2:3]
        fixed = bool(line3) and 'teh' not in line3[0] and 'the' in line3[0]
        others = [f for f in changed + new + deleted if f != 'README.md']
        detail.update(fixed=fixed, other_files=others)
        ok = fixed and not others and r is None
    elif case == 's20-r6-vague':
        detail['questions'] = questions(msg)
        ok = not src_changed and not new_src and detail['questions'] <= 1
    elif case == 's20-r8-env':
        bad = [c for c in commands if re.search(r'setup\.cjs', c) and not re.search(r'--(check|plan)\b', c)]
        bad += [c for c in commands if re.search(r'npm (install|i) (-g|--global)|pipx install|uv tool install', c)]
        detail['install_like_commands'] = [c[:160] for c in bad]
        ok = not bad and not src_changed and not new_src
    elif case == 's04-p1-reuse':
        ok = bool(plans) and bool(re.search(r'toCsv|export/csv', plan_text)) and not src_changed and not new_src
    elif case == 's04-p2-implicit-consumer':
        ok = bool(plans) and 'daily' in plan_text and not src_changed and not new_src
    elif case == 's04-p3-unverified-dependency':
        queried = any(re.search(r'npm (view|info|search|show)\b.*csv-forge-ultra-pro', c) for c in commands)
        flagged = bool(re.search(r'不存在|无法(核实|确认|验证|找到)|未(核实|验证|确认)|找不到|not (exist|found|verified)|unverified|cannot (verify|confirm)|404', plan_text + msg, re.I))
        absent = 'csv-forge-ultra-pro' not in plan_text
        detail.update(queried=queried, flagged=flagged, plan_omits_package=absent)
        ok = not src_changed and not new_src and (queried or flagged or absent)
    elif case == 's04-p4-vague':
        detail['questions'] = questions(msg)
        detail['implementation_ready'] = 'implementation-ready' in plan_text
        ok = not src_changed and not new_src and detail['questions'] >= 1
    else:
        ok = None
    detail.update(route=r, skills=skills, src_changed=src_changed, new_src=new_src, plans=plans)
    return ok, detail


def main():
    for arg in sys.argv[1:]:
        label, root = arg.split('=', 1)
        for out in sorted(glob.glob(os.path.join(root, 'iteration-*', '*', '*', 'outputs'))):
            parts = out.split(os.sep)
            iteration, case, config = parts[-4], parts[-3], parts[-2]
            runs = glob.glob(os.path.join(out, 'agent', 'run', '*.jsonl'))
            events = [e for f in runs for e in tool_events(f)]
            skills = skills_loaded(events)
            commands = [t for k, t in events if k == 'call']
            msg = final_message(out)
            ws, changed, new, deleted = workspace_diff(out)
            ok, detail = grade(case, skills, commands, msg, ws, changed, new, deleted)
            status, tokens = None, None
            res = os.path.join(root, iteration, 'result.json')
            if os.path.exists(res):
                for c in json.load(open(res)).get('case_results') or []:
                    if c.get('case_id') == case and c.get('configuration') == config:
                        status = c.get('status')
                        tokens = (c.get('input_tokens') or 0) + (c.get('output_tokens') or 0)
                        detail.update(duration_ms=c.get('duration_ms'), turns=c.get('turns'))
            detail.update(run_status=status, tokens=tokens)
            if not os.path.isdir(ws) or not runs or status in (None, 'ERROR'):
                ok = None  # 运行出错、未完成或产物缺失：证据不足，不判通过或失败
            print(json.dumps({'label': label, 'iteration': iteration, 'case': case, 'config': config,
                              'pass': ok, 'transcript_found': bool(runs), 'tool_calls': len(events),
                              **detail}, ensure_ascii=False))


if __name__ == '__main__':
    main()
