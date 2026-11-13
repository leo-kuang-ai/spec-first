'use strict';
// 仅运行本地确定性函数与隔离评测脚本，不调用模型或服务。
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),vm=require('node:vm');
const {createRequire}=require('node:module');
const {spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'../../..');
const checker=require(path.join(root,'skills/spec-prd/scripts/check-prd-artifact.js'));
const finalizer=require(path.join(root,'skills/spec-prd/scripts/finalize-prd-artifact.js'));
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'prd-audit-'));
const results=[];
try{
 const judge=path.join(root,'skills/spec-prd/evals/fixtures/scripts/check-validate-report-only.sh');
 const target=path.join(temp,'docs/brainstorms/2026-09-01-expense-export-requirements.md');
 fs.mkdirSync(path.dirname(target),{recursive:true});
 for(const [name,body,message] of [['control','PRD-FIXTURE-ORIGIN-MARKER\n原文','发现阻塞'],['mutated-body-and-fix-claim','PRD-FIXTURE-ORIGIN-MARKER\n已覆盖全部正文','发现问题，已修复写入']]){
  fs.writeFileSync(target,body);
  const r=spawnSync('bash',[judge],{cwd:temp,encoding:'utf8',env:{...process.env,EVAL_FINAL_MESSAGE:message}});
  results.push({name,exit:r.status,stdout:r.stdout,stderr:r.stderr});
 }
 const testFile=path.join(root,'tests/unit/spec-prd-finalize-transition.test.js');
 const context={require:createRequire(testFile)};
 vm.runInNewContext(fs.readFileSync(testFile,'utf8').split("describe('spec-prd final intent")[0],context);
 const text=context.finalIntentPrd(),file=path.join(temp,'docs/brainstorms/probe-requirements.md'),input=path.join(temp,'source/input.md');
 fs.mkdirSync(path.dirname(input),{recursive:true});fs.writeFileSync(input,'source');fs.writeFileSync(file,text);
 const first=finalizer.finalizePrd(file,[input]);
 fs.appendFileSync(file,'\n变更后的产品目标\n');
 const stale=finalizer.finalizePrd(file,[input],{checkOnly:true});
 const refresh=finalizer.finalizePrd(file,[input],{refreshInputsHash:true});
 results.push({name:'refresh-inputs-hash-after-prd-body-change',first:first.status,stale:stale.blocking_reason_codes,refresh:refresh.status,verified:finalizer.verifyPrdReceipt(file,[input]).verified});
 const oq='## Outstanding Questions\n| id | question | PRD write target | blocks_planning | closure_disposition | planning_would_invent_what | closure_state | recommended default |\n| --- | --- | --- | --- | --- | --- | --- | --- |\n| OQ-01 | permission mock文件命名方式 | 测试工具 | no | implementation-only-how-pushdown | no | closed | docs/testing.md:1 |\n';
 const parsed=checker.analyzeOutstandingQuestions(oq.split('\n'),[{title:'Outstanding Questions',level:2,line:1}],{claimsReady:true});
 results.push({name:'what-keyword-on-pure-test-implementation',facts:parsed.facts,reason_codes:parsed.reasonCodes});
 console.log(JSON.stringify({model_invoked:false,results},null,2));
}finally{fs.rmSync(temp,{recursive:true,force:true});}
