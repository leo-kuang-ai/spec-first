#!/usr/bin/env python3
"""创建 S06 隔离输入；只写指定的新目录，不调用模型。"""
import argparse
import json
from pathlib import Path
import shutil
import subprocess

HERE = Path(__file__).resolve().parent
SOURCE = HERE.parents[1] / 'batch2/evals/fixtures/billing-svc'


def prepare(target):
    target.mkdir(parents=True, exist_ok=False)
    for name in ('package.json', 'README.md', 'src', 'test'):
        src = SOURCE / name
        if src.is_dir():
            shutil.copytree(src, target / name)
        else:
            shutil.copy2(src, target / name)
    # 保留真实消费者，不添加无关模块噪声。
    for path in (target / 'src/modules').glob('m*.js'):
        if path.name != 'm17.js':
            path.unlink()
    (target / 'docs/plans').mkdir(parents=True)
    shutil.copy2(HERE / 'implementation-plan.md', target / 'docs/plans/cancel-invoice.md')
    for args in (['init', '-b', 'eval-work'], ['add', '.'],
                 ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid',
                  '-c', 'commit.gpgsign=false', 'commit', '-m', 'test: 初始化合成实施基线']):
        subprocess.run(['git', '-C', str(target), *args], check=True, capture_output=True)
    head = subprocess.check_output(['git', '-C', str(target), 'rev-parse', 'HEAD'], text=True).strip()
    print(json.dumps({'fixture': str(target), 'head': head, 'model_calls': 0}))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('target', type=Path)
    prepare(parser.parse_args().target.resolve())
