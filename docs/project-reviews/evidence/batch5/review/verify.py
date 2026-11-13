#!/usr/bin/env python3
"""仅在临时目录创建 Git fixture，不改项目 Git 状态，不访问网络。"""
import hashlib
import json
import shutil
import subprocess
import tempfile
from pathlib import Path
ROOT = Path(__file__).resolve().parent

def run(args, cwd):
    result = subprocess.run(args, cwd=cwd, text=True, capture_output=True)
    if result.returncode:
        raise RuntimeError(f'{args!r}: {result.returncode}\n{result.stdout}\n{result.stderr}')
    return result.stdout.strip()

with tempfile.TemporaryDirectory(prefix='s07-contract-fixture-') as tmp:
    repo = Path(tmp) / 'repo'
    shutil.copytree(ROOT / 'fixture', repo)
    run(['git', 'init', '-q'], repo)
    run(['git', 'config', 'user.name', 'Fixture'], repo)
    run(['git', 'config', 'user.email', 'fixture@example.invalid'], repo)
    run(['git', 'add', '.'], repo)
    run(['git', '-c', 'core.hooksPath=/dev/null', 'commit', '-qm', 'fixture base'], repo)
    base_sha = run(['git', 'rev-parse', 'HEAD'], repo)
    baseline = json.loads(run(['node', str(ROOT / 'private/oracle.cjs'), str(repo)], repo))
    base_smoke = run(['node', '--test', 'test/smoke.test.cjs'], repo)
    run(['git', 'apply', '--check', str(ROOT / 'candidate.patch')], repo)
    run(['git', 'apply', str(ROOT / 'candidate.patch')], repo)
    candidate = json.loads(run(['node', str(ROOT / 'private/oracle.cjs'), str(repo)], repo))
    candidate_smoke = run(['node', '--test', 'test/smoke.test.cjs'], repo)
    diff_files = run(['git', 'diff', '--name-only'], repo).splitlines()
    assert len(diff_files) >= 3
    assert all(value['passed'] for value in baseline.values())
    assert all(not candidate[key]['passed'] for key in ['D1_amount_contract', 'D2_tenant_isolation', 'D3_retry_after_failure'])
    assert candidate['N1_formatting_preserved']['passed']
    batch = run(['node', '-e', "const assert=require('node:assert/strict'); const {createLedger}=require('./lib/ledger.cjs');const {createHandler}=require('./lib/http.cjs');(async()=>{const handle=createHandler(createLedger({charge:async()=>{}}));const results=await handle({items:[{tenantId:'a',requestId:'1',amountCents:100},{tenantId:'a',requestId:'2',amountCents:200}]});assert.equal(results.length,2);assert.ok(results.every(x=>x.status==='captured'));console.log('batch-shape-passed');})();"], repo)
    receipt = {
        'schema': 's07-batch5-fixture-check/v1', 'status': 'passed',
        'base_commit_created': base_sha, 'patch_check': 'passed',
        'changed_files': diff_files, 'baseline': baseline, 'candidate': candidate,
        'base_smoke': base_smoke, 'candidate_smoke': candidate_smoke, 'batch_shape': batch,
        'limitations': ['无模型调用；不证明审查检出率或Skill增益', '纯内存provider；无真实支付或网络', '隐藏判据不应提供给被测reviewer'],
    }
    receipt['sha256'] = {str(p.relative_to(ROOT)): hashlib.sha256(p.read_bytes()).hexdigest()
                         for p in sorted(ROOT.rglob('*')) if p.is_file() and p.name != 'verification.json'}
    (ROOT / 'verification.json').write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'status': 'passed', 'changed_files': diff_files, 'baseline_all_passed':True,
                      'candidate_defects':3, 'negative_control_passed':True}, ensure_ascii=False))
