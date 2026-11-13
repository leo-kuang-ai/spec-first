'use strict';
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const script = path.resolve(__dirname, '../../skills/spec-sweep/scripts/analyze-sweep-media.py');

test.each(['authorized', 'missing', 'wrong-run', 'wrong-item', 'wrong-media', 'wrong-provider', 'sensitive', 'unknown'])('media %s admission uses the actual bounded command and preserves partial evidence', (scenario) => {
  const code = String.raw`
import importlib.util, json, pathlib, tempfile, hashlib, sys
from unittest.mock import patch
s=importlib.util.spec_from_file_location('gate', sys.argv[1]);m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
with tempfile.TemporaryDirectory() as directory:
    root=pathlib.Path(directory).resolve(); source=root/'clip.webm'; source.write_bytes(b'fixture media')
    digest=hashlib.sha256(source.read_bytes()).hexdigest()
    packet={'run_id':'run-1','item_id':'item-1','sensitive':False,'scratch_root':str(root),'media_path':str(source),'media_sha256':digest,'output_dir':str(root/'result'),'authorization':{'status':'authorized','source_ref':'current user request','run_id':'run-1','item_id':'item-1','media_sha256':digest,'provider':'openai-audio-transcriptions'}}
    scenario=sys.argv[2]
    if scenario=='missing': packet.pop('authorization')
    if scenario=='wrong-run': packet['authorization']['run_id']='other'
    if scenario=='wrong-item': packet['authorization']['item_id']='other'
    if scenario=='wrong-media': packet['authorization']['media_sha256']='0'*64
    if scenario=='wrong-provider': packet['authorization']['provider']='other'
    if scenario=='sensitive': packet['sensitive']=True
    calls=[]
    def analyzer():
        calls.append(list(sys.argv))
        out=pathlib.Path(sys.argv[sys.argv.index('--output-dir')+1]);out.mkdir(parents=True)
        if scenario=='unknown': raise RuntimeError('provider outcome lost')
        receipt={'provider':'openai-audio-transcriptions','provider_request_sent':'--transcribe' in sys.argv,'attempts':[{'status':'failed','provider_request_sent':True}]} if '--transcribe' in sys.argv else {'provider_request_sent':False,'attempts':[]}
        payload={'transcription_egress_receipt':receipt,'transcript':{'status':'partial' if '--transcribe' in sys.argv else 'skipped','covered_intervals':[{'start_seconds':0,'end_seconds':420}] if '--transcribe' in sys.argv else [],'missing_intervals':[{'start_seconds':420,'end_seconds':600}]}}
        (out/'analysis.json').write_text(json.dumps(payload))
        return 0
    with patch.object(m.analyzer,'main',side_effect=analyzer):
        result=m.run(packet)
    print(json.dumps({'result':result,'calls':calls,'snapshot_exists':pathlib.Path(calls[0][1]).exists()}))
`;
  const r = spawnSync('python3', ['-B', '-c', code, script, scenario], { encoding: 'utf8', timeout: 5000 });
  expect({ status: r.status, stderr: r.stderr }).toEqual({ status: 0, stderr: '' });
  const data = JSON.parse(r.stdout);
  const authorized = ['authorized', 'unknown'].includes(scenario);
  expect(data.calls).toHaveLength(1);
  expect(data.calls[0]).toContain(authorized ? '--transcribe' : '--no-transcribe');
  expect(data.snapshot_exists).toBe(false);
  expect(data.result).toMatchObject({ run_id: 'run-1', item_id: 'item-1', provider_request_sent: scenario === 'unknown' ? null : authorized });
  if (scenario === 'authorized') {
    expect(data.result.transcript_status).toBe('partial');
    expect(data.result.missing_intervals).toEqual([{ start_seconds: 420, end_seconds: 600 }]);
    expect(data.result.attempts).toHaveLength(1);
  }
});

test.each(['authorized', 'missing', 'wrong-item', 'sensitive'])('real analyzer boundary records provider calls for %s media', (scenario) => {
  const code = String.raw`
import importlib.util, json, pathlib, tempfile, hashlib, sys, subprocess, os
from unittest.mock import patch
s=importlib.util.spec_from_file_location('gate',sys.argv[1]);m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
with tempfile.TemporaryDirectory() as directory:
    root=pathlib.Path(directory).resolve();media=root/'clip.webm';media.write_bytes(b'fixture');digest=hashlib.sha256(media.read_bytes()).hexdigest()
    auth={'status':'authorized','source_ref':'fixture owner instruction','run_id':'r','item_id':'i','media_sha256':digest,'provider':'openai-audio-transcriptions'}
    scenario=sys.argv[2]
    if scenario=='missing': auth={}
    if scenario=='wrong-item': auth['item_id']='other'
    packet={'run_id':'r','item_id':'i','sensitive':scenario=='sensitive','scratch_root':str(root),'media_path':str(media),'media_sha256':digest,'output_dir':str(root/'output'),'authorization':auth}
    calls=[]
    def prepare(source_path,*args,**kwargs):
        return {'source_kind':'video','session':{'duration_seconds':10},'events':[],'duration':10,'notes_transcript':None,'transcription_path':source_path,'recording_path':None}
    def provider(command,**kwargs):
        calls.append(command[0]); return subprocess.CompletedProcess(command,0,'{"text":"reported symptom"}','')
    with patch.object(m.analyzer,'prepare_source',side_effect=prepare),patch.object(m.analyzer,'classify_source',return_value='video'),patch.object(m.analyzer.shutil,'which',side_effect=lambda name:'/fixture/curl' if name=='curl' else None),patch.object(m.analyzer.subprocess,'run',side_effect=provider),patch.dict(os.environ,{'OPENAI_API_KEY':'fixture-key'}),patch('builtins.print'):
        result=m.run(packet)
    print(json.dumps({'result':result,'calls':calls}))
`;
  const r = spawnSync('python3', ['-B', '-c', code, script, scenario], { encoding: 'utf8', timeout: 5000 });
  expect({ status: r.status, stderr: r.stderr }).toEqual({ status: 0, stderr: '' });
  const data = JSON.parse(r.stdout);
  expect(data.calls.filter(c => c === 'curl')).toHaveLength(scenario === 'authorized' ? 1 : 0);
  expect(data.result.status).toBe('analyzed');
  expect(data.result.provider_request_sent).toBe(scenario === 'authorized');
});
