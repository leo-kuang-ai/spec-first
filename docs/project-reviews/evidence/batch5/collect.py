#!/usr/bin/env python3
"""从本批机器本地产物提取白名单指标并运行独立业务验收；不调用模型。"""
import hashlib
import json
from pathlib import Path
import subprocess

HERE = Path(__file__).resolve().parent
ROOT = Path('/tmp/spec-first-batch5-runs')
records = []
for run in sorted(ROOT.glob('*/iteration-*/batch5-*/*/outputs/agent/run')):
    group = run.parents[2].name
    case = run.parents[3].name
    record = {'run': str(run), 'group': group, 'case': case, 'trace_sha256': {}, 'model': None,
              'effort': None, 'usage': None, 'cwd': None, 'commands': [], 'final': None}
    for trace in sorted(run.glob('*.jsonl')):
        record['trace_sha256'][trace.name] = hashlib.sha256(trace.read_bytes()).hexdigest()
        for line in trace.read_text().splitlines():
            try:
                event = json.loads(line)
            except ValueError:
                continue
            payload = event.get('payload', {})
            if event.get('type') == 'session_meta':
                record['cwd'] = payload.get('cwd')
                record['cli_version'] = payload.get('cli_version')
            if event.get('type') == 'turn_context':
                record['model'] = payload.get('model')
                record['effort'] = payload.get('effort')
            if event.get('type') == 'event_msg' and payload.get('type') == 'token_count':
                record['usage'] = (payload.get('info') or {}).get('total_token_usage')
            if event.get('type') == 'response_item' and payload.get('type') in ('function_call', 'custom_tool_call'):
                record['commands'].append(str(payload.get('arguments', payload.get('input', ''))))
            if event.get('type') == 'assistant':
                message = event.get('message', {})
                record['model'] = message.get('model', record['model'])
                for content in message.get('content', []):
                    if content.get('type') == 'tool_use':
                        record['commands'].append(json.dumps({'name': content.get('name'), 'input': content.get('input')}, ensure_ascii=False))
    last = run / 'last-message.txt'
    if last.exists():
        record['final'] = last.read_text()
    stdout = run / 'stdout.json'
    if stdout.exists():
        for line in stdout.read_text().splitlines():
            try:
                item = json.loads(line)
            except ValueError:
                continue
            if item.get('type') == 'result':
                record['final'] = item.get('result')
                record['usage'] = item.get('usage')
                record['duration_ms'] = item.get('duration_ms')
                record['num_turns'] = item.get('num_turns')
    workspace = run.parents[1] / 'workspace'
    if case == 'batch5-work' and workspace.exists():
        result = subprocess.run(['node', str(HERE / 'work/grade.cjs'), str(workspace)], capture_output=True, text=True)
        record['oracle'] = {'exit_code': result.returncode, 'stdout': result.stdout, 'stderr': result.stderr}
        result = subprocess.run(['npm', 'test'], cwd=workspace, capture_output=True, text=True)
        record['regression'] = {'exit_code': result.returncode, 'stdout': result.stdout, 'stderr': result.stderr}
    record['skill_read_candidate_commands'] = [x for x in record['commands'] if 'SKILL.md' in x]
    records.append(record)
(HERE / 'observations.json').write_text(json.dumps(records, ensure_ascii=False, indent=2) + '\n')
print(json.dumps([{'case': x['case'], 'group': x['group'], 'model': x['model'],
                   'final': bool(x['final']), 'oracle': x.get('oracle', {}).get('exit_code'),
                   'usage': x['usage']} for x in records], ensure_ascii=False))
