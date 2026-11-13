import os,json,subprocess,tempfile,shutil
from pathlib import Path
root=Path('/Users/kuang/xiaobu/spec-first');out=root/'docs/validation/ce-skill-audit-2026-10-28';results=[]
def run(label,fixture,judge,mutation):
 with tempfile.TemporaryDirectory(prefix='ce-plan-judge-') as temp:
  repo=Path(temp);shutil.copytree(root/'skills/spec-plan/evals/fixtures/repos'/fixture,repo,dirs_exist_ok=True)
  for cmd in [['git','init','-q'],['git','config','user.name','Audit Fixture'],['git','config','user.email','audit@example.invalid'],['git','add','.'],['git','commit','-qm','fixture']]:subprocess.run(cmd,cwd=repo,check=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
  mutation(repo)
  env=dict(os.environ,EVAL_FINAL_MESSAGE='已识别产品 blocker，计划保持阻断。')
  r=subprocess.run(['bash',str(root/'skills/spec-plan/evals/fixtures/scripts'/judge)],cwd=repo,env=env,text=True,capture_output=True)
  results.append(dict(label=label,fixture=fixture,judge=judge,exit_code=r.returncode,stdout=r.stdout,stderr=r.stderr,git_status=subprocess.check_output(['git','status','--porcelain'],cwd=repo,text=True)))
run('r2 untouched control','mini-ledger','check-r2-no-code.sh',lambda p:None)
run('r2 removes source yet passes','mini-ledger','check-r2-no-code.sh',lambda p:(p/'src/server.js').unlink())
run('route removes source yet passes','mini-ledger','routes-to-execution.sh',lambda p:(p/'src/server.js').unlink())
run('blocker untouched control','admin-export-blocker','check-product-blocker.sh',lambda p:None)
run('blocker adds implementation yet passes','admin-export-blocker','check-product-blocker.sh',lambda p:(p/'src/new-implementation.js').write_text('module.exports = 1;\n'))
(out/'plan-judge-probes.json').write_text(json.dumps(results,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(results,ensure_ascii=False,indent=2))
