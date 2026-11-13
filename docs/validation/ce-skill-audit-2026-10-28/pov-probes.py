import tempfile,os,subprocess,json
from pathlib import Path
root=Path(__file__).resolve().parents[3]
P=Path(__file__).resolve().parent
with tempfile.TemporaryDirectory(prefix='pov-audit-probe-') as t:
 d=Path(t);b=d/'bin';b.mkdir();(b/'codex').write_text('#!/usr/bin/env python3\nimport sys,os,json\nfrom pathlib import Path\nPath(os.environ["PROBE_CALLED"]).write_text("stub-only")\nPath(sys.argv[sys.argv.index("-o")+1]).write_text(json.dumps({"position":"","reasoning":"","evidence":[{}],"external_check":"unavailable","mode":"independent","movement":"initial"}))\n');(b/'codex').chmod(0o755)
 packet=d/'packet.json';packet.write_text(json.dumps({'prompt':'isolated audit fake provider only'}));out=d/'out.json';env={**os.environ,'PATH':str(b)+os.pathsep+os.environ['PATH'],'PROBE_CALLED':str(d/'called')}
 r=subprocess.run(['bash',str(root/'skills/spec-pov/scripts/cross-model-pov.sh'),'__worker','codex','fake-model',t,str(packet),str(out)],env=env,capture_output=True,text=True,timeout=20)
 j=subprocess.run(['bash',str(root/'skills/spec-pov/evals/fixtures/scripts/check-r2-verdict-given.sh')],env={**os.environ,'EVAL_FINAL_MESSAGE':'尚无结论，没有证据'},capture_output=True,text=True)
 evidence={'artifact_type':'confirmed','scope':'隔离stub与judge探针；未调用真实provider','worker_without_receipt':{'exit_code':r.returncode,'stub_called':(d/'called').exists(),'output':json.loads(out.read_text()) if out.exists() else None,'stderr':r.stderr},'judge_non_verdict':{'input':'尚无结论，没有证据','exit_code':j.returncode,'stdout':j.stdout,'stderr':j.stderr},'dormant_persona':{'configured':'references/personas/agents/pov-peer.md','configured_exists':(root/'skills/spec-pov/references/personas/agents/pov-peer.md').exists(),'actual_exists':(root/'skills/spec-pov/references/agents/pov-peer.md').exists()}}
 (P/'pov-probes.json').write_text(json.dumps(evidence,ensure_ascii=False,indent=2)+'\n');print(json.dumps(evidence,ensure_ascii=False,indent=2))
