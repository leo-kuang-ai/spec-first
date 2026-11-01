"""只在自动清理的临时 Git 仓库复现启动脚本边界，不起服务或外发。"""
import json
import subprocess
import tempfile
from pathlib import Path

ROOT = Path('/Users/kuang/xiaobu/spec-first')
CE = Path('/Users/kuang/xiaobu/compound-engineering-plugin')
results = []

with tempfile.TemporaryDirectory(prefix='ce-polish-audit-') as temp:
    work = Path(temp)
    subprocess.run(['git', 'init', '-q', str(work)], check=True)
    (work / '.claude').mkdir()
    for side, source in [('spec-first', ROOT / 'skills/spec-polish'), ('ce', CE / 'skills/ce-polish')]:
        for name, data, requested in [
            ('PL01-single-wrong-name', {'configurations': [{'name': 'dev', 'port': 3000}]}, 'missing'),
            ('PL02-duplicate-name', {'configurations': [{'name': 'dev', 'port': 3000}, {'name': 'dev', 'port': 4000}]}, 'dev'),
            ('PL03-wrong-shape', {'configurations': 'ab'}, ''),
        ]:
            (work / '.claude/launch.json').write_text(json.dumps(data))
            r = subprocess.run(['bash', str(source / 'scripts/read-launch-json.sh'), requested], cwd=work, text=True, capture_output=True, timeout=3)
            results.append({'id': name, 'side': side, 'returncode': r.returncode, 'stdout': r.stdout, 'stderr': r.stderr})
        for flag in ['--port', '--type']:
            try:
                r = subprocess.run(['bash', str(source / 'scripts/resolve-port.sh'), str(work), flag], cwd=work, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=0.5)
                results.append({'id': 'PL04-missing-value', 'side': side, 'flag': flag, 'returncode': r.returncode, 'timed_out': False})
            except subprocess.TimeoutExpired:
                results.append({'id': 'PL04-missing-value', 'side': side, 'flag': flag, 'timed_out': True, 'timeout_seconds': 0.5})
        (work / 'vite.config.ts').write_text('// port: 4999\nexport default {server: {port: 4300}}\n')
        r = subprocess.run(['bash', str(source / 'scripts/resolve-port.sh'), str(work), '--type', 'vite'], cwd=work, capture_output=True, text=True, timeout=3)
        results.append({'id': 'PL05-comment-port', 'side': side, 'returncode': r.returncode, 'stdout': r.stdout, 'stderr': r.stderr})
        (work / 'astro.config.mjs').write_text('export default {}\n')
        r = subprocess.run(['bash', str(source / 'scripts/detect-project-type.sh'), str(work)], cwd=work, capture_output=True, text=True, timeout=3)
        results.append({'id': 'PL06-astro-vite', 'side': side, 'returncode': r.returncode, 'stdout': r.stdout, 'stderr': r.stderr})
        (work / 'astro.config.mjs').unlink()
        (work / 'vite.config.ts').unlink()
        (work / 'Procfile').write_text('web: app --port 4300\n')
        r = subprocess.run(['bash', str(source / 'scripts/detect-project-type.sh'), str(work)], cwd=work, capture_output=True, text=True, timeout=3)
        results.append({'id': 'PL07-procfile-only', 'side': side, 'returncode': r.returncode, 'stdout': r.stdout, 'recipe_target_exists': (work / 'Procfile.dev').exists()})
        (work / 'Procfile').unlink()

print(json.dumps({'scope': '临时fixture；无真实浏览器、连接器或服务启动', 'results': results}, ensure_ascii=False, indent=2))
