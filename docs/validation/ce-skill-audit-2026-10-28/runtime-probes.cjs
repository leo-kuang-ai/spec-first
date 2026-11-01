// 仅在临时树复现，不调用网络、模型或真实 setup。
'use strict';
const fs = require('node:fs'); const os = require('node:os'); const path = require('node:path'); const cp = require('node:child_process');
const root = path.resolve(__dirname, '../../..');
const lib = (name) => require(path.join(root, 'skills/spec-runtime-setup/scripts/lib', name));
const tmp = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'ce-runtime-audit-')));
const env = { ...process.env }; for (const k of Object.keys(env)) if (k.startsWith('GIT_')) delete env[k];
const git = (cwd, args) => cp.execFileSync('git', ['-C', cwd, ...args], { env, encoding:'utf8', stdio:['ignore','pipe','pipe'] }).trim();
const results = {};
try {
 const ws = path.join(tmp, 'ws'); const outside = path.join(tmp, 'outside'); fs.mkdirSync(ws); fs.mkdirSync(outside);
 const target = path.join(outside, 'created.md'); fs.symlinkSync(target, path.join(ws,'AGENTS.md'));
 const routing = lib('workspace-routing-inject.cjs').injectRoutingInstruction({workspaceRoot:ws,hosts:['codex'],repos:[]});
 results.routing = {routing, outside_created:fs.existsSync(target), symlink_preserved:fs.lstatSync(path.join(ws,'AGENTS.md')).isSymbolicLink()};
 const init = (name) => {const d=path.join(ws,name);fs.mkdirSync(d);git(d,['init','-q']);git(d,['config','user.name','Audit']);git(d,['config','user.email','audit@example.invalid']);fs.writeFileSync(path.join(d,'file'),name);git(d,['add','file']);git(d,['commit','-qm',name]);return d;};
 const a=init('a'), b=init('b');
 const exclude=path.join(a,'.git/info/exclude');fs.unlinkSync(exclude);const outExclude=path.join(outside,'exclude');fs.symlinkSync(outExclude,exclude);
 const excludeResult=lib('workspace-git-exclude.cjs').addManagedExclude(a,ws);
 results.exclude={result:excludeResult,outside_created:fs.existsSync(outExclude)};
 const expected=git(a,['rev-parse','HEAD']), foreign=git(b,['rev-parse','HEAD']);
 const priorDir=process.env.GIT_DIR,priorTree=process.env.GIT_WORK_TREE;
 try {process.env.GIT_DIR=path.join(b,'.git');process.env.GIT_WORK_TREE=b;
 const actual=lib('workspace-graph-state.cjs').inspectRepoSnapshot({git_root:a,repo_id:'a'});
 results.git_env={expected,foreign,actual,foreign_head_recorded:actual.head_sha===foreign};
 } finally {if(priorDir===undefined)delete process.env.GIT_DIR;else process.env.GIT_DIR=priorDir;if(priorTree===undefined)delete process.env.GIT_WORK_TREE;else process.env.GIT_WORK_TREE=priorTree;}
 results.repair_display=lib('host-config-repair-command.cjs').hostConfigRepairCommand({actionPlan:{args:{folder:'/tmp/path with spaces'},selected_ids:['graphify'],mode:'normal'}});
} finally {fs.rmSync(tmp,{recursive:true,force:true});results.temp_removed=!fs.existsSync(tmp);}
console.log(JSON.stringify(results,null,2));
