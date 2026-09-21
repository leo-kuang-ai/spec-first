import sys,subprocess,json,datetime
from pathlib import Path
folder=Path(__file__).resolve().parent
root=folder.parents[3]
name,*argv=sys.argv[1:]
start=datetime.datetime.now(datetime.timezone.utc).isoformat()
with (folder/'logs'/f'{name}.log').open('w') as log:
 r=subprocess.run(argv,cwd=root,stdout=log,stderr=subprocess.STDOUT,text=True)
row={'id':name,'argv':argv,'started_at':start,'finished_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'exit_code':r.returncode,'log':f'logs/{name}.log'}
with (folder/'checks.jsonl').open('a') as log: log.write(json.dumps(row,ensure_ascii=False)+'\n')
print(json.dumps(row,ensure_ascii=False))
print((folder/'logs'/f'{name}.log').read_text()[-7000:])
raise SystemExit(r.returncode)
