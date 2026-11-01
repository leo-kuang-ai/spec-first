"""仅临时目录内运行真实状态引擎；不读连接器、不进行Git/外部写入。"""
import contextlib, io, json, tempfile, types
from pathlib import Path
ROOT = Path(__file__).resolve().parents[3]
SOURCE = ROOT / 'skills/spec-sweep/scripts/sweep-state.py'
m = types.ModuleType('sweep_probe')
exec(compile(SOURCE.read_text(), str(SOURCE), 'exec'), m.__dict__)
def run(*args):
    out = io.StringIO()
    with contextlib.redirect_stdout(out):
        code = m.main(['sweep-state.py', *map(str, args)])
    return {'exit': code, 'stdout': out.getvalue().strip()}
results = {}
with tempfile.TemporaryDirectory(prefix='sweep-review-') as value:
    root = Path(value)
    future = root / 'future.yml'
    future.write_text('schema_version: 2\nsources: {}\nitems: {}\nfuture_field: "keep"\n')
    r = run('run-record', '--state', future, '--writer', 'probe', '--outcome', 'completed', '--counts', '{}', '--timestamp', '2026-10-28T00:00:00Z')
    results['future_schema'] = {**r, 'after': m.load_state(future)[1]}
    state = root / 'unavailable-lock.yml'
    Path(str(state)+'.lock').mkdir()
    results['unavailable_lock'] = run('lease-acquire','--state',state,'--writer','probe')
    results['unavailable_lock']['state_created'] = state.exists()
    sentinel = root / 'only-temporary-sentinel.txt';sentinel.write_text('KEEP')
    symlink_state = root / 'symlink-lock.yml'
    Path(str(symlink_state)+'.lock').symlink_to(sentinel)
    results['lock_symlink'] = run('lease-acquire','--state',symlink_state,'--writer','probe')
    results['lock_symlink']['temporary_sentinel_after'] = sentinel.read_text()
    fresh = root / 'previously-missing-parent' / 'state.yml'
    results['first_run_lock'] = run('lease-acquire','--state',fresh,'--writer','probe')
    results['first_run_lock']['state_created'] = fresh.exists()
    results['first_run_lock']['lock_created'] = Path(str(fresh)+'.lock').exists()
    results['closed_without_evidence'] = run('upsert-item','--state',fresh,'--writer','probe','--source','fixture','--id','1','--json','{"status":"closed"}')
    results['closed_without_evidence']['status_before_validate'] = m.load_state(fresh)[1]['items']['fixture:1']['status']
    results['closed_without_evidence']['validate'] = run('validate','--state',fresh)
print(json.dumps(results,ensure_ascii=False,indent=2))
