import hashlib
import json
import subprocess
from pathlib import Path

root = Path(__file__).resolve().parents[4]
folder = root / 'docs/validation/ce-localization'
def snapshot():
    return {str(p.relative_to(root)): hashlib.sha256(p.read_bytes()).hexdigest()
            for p in folder.rglob('*') if p.is_file() and not p.is_symlink()}
before = snapshot()
result = subprocess.run(['node', 'scripts/check-ce-localization-review.cjs', '--verify-closeout'], cwd=root, capture_output=True, text=True)
unchanged = snapshot() == before
print(json.dumps({'command_exit_code': result.returncode, 'stdout': result.stdout, 'stderr': result.stderr,
                  'historical_artifacts_unchanged': unchanged, 'claim': '当前source漂移时拒绝current closeout，且校验不改历史证据'}, ensure_ascii=False, indent=2))
assert result.returncode != 0 and 'is stale' in result.stderr
assert unchanged
