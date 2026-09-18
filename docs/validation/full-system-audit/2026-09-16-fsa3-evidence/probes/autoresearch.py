import subprocess,json,tempfile,pathlib
script='skills/autoresearch/scripts/orchestrate.sh'
def call(*args):
 r=subprocess.run(['bash',script,*args],text=True,capture_output=True);return r.returncode,r.stdout.strip()
state={'goal':'fixture','archetype':'build-feature','mode':'loop','pipeline':['fix','regression'],'hop_log':[],'cycle_count':1,'max_cycles':5,'predicate':{'command':'true','expected':'0'},'terminal_choice':'stop-at-verified','units_remaining':[1,0],'predicate_met':True,'pending_verify':True}
with tempfile.TemporaryDirectory() as d:
 p=pathlib.Path(d)/'state.json';p.write_text(json.dumps(state))
 print(json.dumps({'case':'pending-independent-verification','validate':call('validate-state',str(p)),'next_hop':call('next-hop',str(p)),'verdict':call('verdict',str(p))}))
 state['pending_verify']=False;state['hop_log']=[{'outcome':'failed'}];state['predicate_met']=True;p.write_text(json.dumps(state))
 print(json.dumps({'case':'failed-last-hop-stale-predicate','next_hop':call('next-hop',str(p)),'verdict':call('verdict',str(p))}))
secret='FAKE_AUDIT_PASSWORD_NOT_A_CREDENTIAL';code,out=call('screen-cmd','psql postgresql://audit:'+secret+'@prod.example.invalid/customer -c SELECT')
print(json.dumps({'case':'refusal-credential-echo','exit_code':code,'fake_password_echoed':secret in out,'full_url_echoed':'postgresql://audit:'+secret+'@prod.example.invalid/customer' in out,'raw_output_omitted':True}))
for goal in ['document the release process; do not deploy','what should I build next?','修复测试失败']:
 print(json.dumps({'case':'goal-classification','goal':goal,'result':call('classify',goal)},ensure_ascii=False))
