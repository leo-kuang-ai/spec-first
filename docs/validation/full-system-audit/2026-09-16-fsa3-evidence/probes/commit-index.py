import subprocess,tempfile,pathlib,json,os
with tempfile.TemporaryDirectory(prefix='fsa3-index-') as d:
 p=pathlib.Path(d)
 def git(*a):return subprocess.check_output(['git','-c','core.hooksPath=/dev/null',*a],cwd=p,text=True).strip()
 git('init','-q','-b','fixture');git('config','user.name','Audit Fixture');git('config','user.email','audit@example.invalid')
 (p/'owned.txt').write_text('baseline');(p/'unrelated.txt').write_text('baseline');git('add','owned.txt','unrelated.txt');git('commit','-qm','fixture baseline')
 (p/'unrelated.txt').write_text('pre-existing user staged work');git('add','unrelated.txt');(p/'owned.txt').write_text('authorized owned work')
 before=git('diff','--cached','--name-only');git('add','owned.txt');git('commit','-qm','fixture owned change')
 actual=git('diff-tree','--no-commit-id','--name-only','-r','HEAD').splitlines()
 print(json.dumps({'source_recipe':'skills/spec-commit/SKILL.md:103-114','pre_existing_staged':before,'authorized_paths':['owned.txt'],'actual_commit_paths':actual,'out_of_scope_committed':'unrelated.txt' in actual}))
 assert 'unrelated.txt' in actual
