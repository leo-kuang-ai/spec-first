const {buildActionPlan}=require(process.cwd()+'/skills/spec-runtime-setup/scripts/lib/mode-policy.cjs');
const ids=['codegraph','graphify'];
for(const argv of [[],['--repo','/fixture'],['--plan'],['--plan','--only','codegraph,graphify']]){
 const p=buildActionPlan({argv,knownIds:ids,defaultIds:ids});
 console.log(JSON.stringify({argv,mode:p.mode,selected_ids:p.selected_ids,installationOnly:p.args.installationOnly,mutation:p.mutation,capabilities:p.capabilities}));
}
