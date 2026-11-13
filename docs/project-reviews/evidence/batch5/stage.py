#!/usr/bin/env python3
"""生成并校验四个双组评测配置；不运行模型，不读取凭证。"""
import argparse
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
REPO = HERE.parents[3]
parser = argparse.ArgumentParser()
parser.add_argument('target', type=Path)
target = parser.parse_args().target.resolve()
target.mkdir(parents=True, exist_ok=False)
(target / 'evals/cases').mkdir(parents=True)
(target / 'evals/fixtures').mkdir()
spec = importlib.util.spec_from_file_location('prepare', HERE / 'work/prepare.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
module.prepare(target / 'evals/fixtures/work')
review = target / 'evals/fixtures/review'
shutil.copytree(HERE / 'review/fixture', review)
for args in (['init', '-b', 'eval-review'], ['add', '.'],
             ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid',
              '-c', 'commit.gpgsign=false', 'commit', '-m', 'test: 初始化合成审查基线']):
    subprocess.run(['git', '-C', str(review), *args], check=True, capture_output=True)
shutil.copy2(HERE / 'review/candidate.patch', target / 'evals/candidate.patch')
prompts = {
    'work': '请完成 docs/plans/cancel-invoice.md 的已定实施计划。若当前环境安装了 spec-work，请显式读取其 SKILL.md，并以 mode:return-to-caller docs/plans/cancel-invoice.md 执行；未安装时直接按同一计划实施并本地验证。当前 fixture 仓库是唯一 target_repo，所有本地业务取舍已在计划中闭合；自主完成，不提交、不推送，不访问真实项目或用户配置，不调用外部服务。报告真实测试和未完成项。',
    'review': '请审查当前仓库相对 HEAD 的未提交改动，判断是否可合入。若当前环境安装了 spec-code-review，请显式读取其 SKILL.md 后执行；未安装时直接审查。结合合同和实际消费者，给出可定位的问题、触发条件及影响，也说明验证范围。不修改实现，不提交、不推送，不访问真实项目或用户配置，不调用外部服务。',
}
records = []
for name, skill in [('work', 'spec-work'), ('review', 'spec-code-review')]:
    fixture = target / 'evals/fixtures' / name
    case_path = target / f'evals/cases/{name}.yaml'
    patch = f'    apply_diff: {json.dumps("evals/candidate.patch")}\n' if name == 'review' else ''
    case_path.write_text(f'''id: batch5-{name}
title: 第五批{name}有效行为对照
description: 独立判据在评测工作目录之外；exit_code仅表示运行结束，不代表业务合格。
input:
  prompt: {json.dumps(prompts[name], ensure_ascii=False)}
context:
  repo_fixture: {json.dumps(f"evals/fixtures/{name}")}
  git:
    init: true
    checkout: eval-{name}
{patch}judge:
  type: rule_based
  success:
    - exit_code: 0
''')
    for engine in ('claude_code', 'codex'):
        config = target / f'evals/{name}-{engine}.yaml'
        config.write_text(f'''schema_version: v1alpha1
environment:
  type: none
skills:
  - source: local_path
    path: {json.dumps(os.path.relpath(REPO / "skills" / skill, target))}
engine:
  name: {engine}
cases:
  files: [{json.dumps(f"evals/cases/{name}.yaml")}]
  defaults:
    timeout_seconds: 1500
    max_turns: 50
    collect_artifacts: ["**"]
  parallelism: 1
benchmark:
  enabled: true
report:
  formats: [json]
  artifacts: [transcript]
''')
        result = subprocess.run(['skill-up', 'validate', str(config)], capture_output=True, text=True)
        records.append({'config': str(config), 'exit_code': result.returncode,
                        'stdout': result.stdout, 'stderr': result.stderr})
manifest = {'stage': str(target), 'model_calls': 0, 'configs': records,
            'input_sha256': {str(p.relative_to(target)): hashlib.sha256(p.read_bytes()).hexdigest()
                             for p in sorted(target.rglob('*')) if p.is_file() and '.git' not in p.parts}}
(HERE / 'staging-validation.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'stage': str(target), 'validated': sum(x['exit_code'] == 0 for x in records), 'total': 4, 'model_calls': 0}))
raise SystemExit(0 if all(x['exit_code'] == 0 for x in records) else 1)
