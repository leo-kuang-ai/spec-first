import sys,subprocess,json,datetime
from pathlib import Path
root=Path(__file__).resolve().parents[4]
evidence=root/'docs/validation/project-lead-cycle-1/repairs'
name,expected,*argv=sys.argv[1:]
start=datetime.datetime.now(datetime.timezone.utc).isoformat()
r=subprocess.run(argv,cwd=root,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True)
log=evidence/'logs'/f'{name}.log'; log.write_text(r.stdout)
row={'check_id':name,'command_argv':argv,'started_at':start,'finished_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'exit_code':r.returncode,'expected':expected,'status':'passed' if r.returncode==0 else 'failed','log_path':str(log.relative_to(root))}
with (evidence/'checks.jsonl').open('a') as f: f.write(json.dumps(row,ensure_ascii=False)+'\n')
print(json.dumps(row,ensure_ascii=False)); print(r.stdout[-5500:])
