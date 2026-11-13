"""隔离复现现有 shell judge 的结果盲区；不运行模型，不修改产品 source。"""
import hashlib,json,os,shutil,subprocess,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3]
SK=ROOT/'skills/spec-work/evals/fixtures'
results=[]
def run(label,fixture,judge,mutate,message,violation):
 with tempfile.TemporaryDirectory(prefix='ce-audit-work-') as td:
  repo=Path(td)/'repo';shutil.copytree(SK/'repos'/fixture,repo)
  env={k:v for k,v in os.environ.items() if not k.startswith('GIT_')};env['EVAL_FINAL_MESSAGE']=message
  def git(*args):return subprocess.run(['git','-C',str(repo),*args],env=env,capture_output=True,check=True).stdout.decode().strip()
  git('init','-q');git('config','user.name','Audit');git('config','user.email','audit@example.invalid');git('config','core.hooksPath','/dev/null');git('add','--all');git('commit','-qm','fixture')
  before=git('rev-parse','HEAD');mutate(repo,git)
  proc=subprocess.run(['bash',str(SK/'scripts'/judge)],cwd=repo,env=env,capture_output=True,text=True)
  results.append(dict(id=label,judge=judge,contract_violation=violation,judge_exit=proc.returncode,incorrectly_accepted=proc.returncode==0,head_changed=before!=git('rev-parse','HEAD'),stdout=proc.stdout,stderr=proc.stderr))
def rename(repo,git):
 p=repo/'README.md';p.write_text(p.read_text().replace('Known rough edges','Known limitations'))
def amend(repo,git):
 rename(repo,git);git('add','README.md');git('commit','--amend','--no-edit','--quiet')
run('closeout-without-artifacts','mini-ledger-guarded2','check-closeout-order.sh',rename,'收口','仅改README，无summary、closeout verdict或顺序证据')
run('false-caller-envelope','mini-ledger-guarded2','check-return-to-caller.sh',rename,'{"status":"complete","standalone_shipping_skipped":false}','false且缺全部验证字段的envelope')
run('amended-head-accepted','mini-ledger-guarded2','check-uncommitted-handback.sh',amend,'未提交','HEAD已被amend且无验证执行，rev-list count仍为1')
run('server-deleted-accepted','reqonly-plan','check-no-implementation.sh',lambda p,g:(p/'src/server.js').unlink(),'spec-plan','要求不改实现但已删除server')
run('existing-server-deleted-accepted','mini-ledger-guarded2','check-r2-reverse-mismatch.sh',lambda p,g:(p/'src/server.js').unlink(),'mismatch','要求保留已有实现但server被删除')
output={'kind':'isolated-judge-counterexamples','model_executed':False,'product_modified':False,'cases':results}
Path(__file__).with_suffix('.json').write_text(json.dumps(output,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(output,ensure_ascii=False,indent=2))
