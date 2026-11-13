import hashlib
import json
import re
import subprocess
from pathlib import Path
from urllib.parse import unquote

root = Path(__file__).resolve().parents[4]
repair = Path(__file__).resolve().parent
manifest = json.loads((repair / 'final-source-manifest.json').read_text())
errors = []
for name, expected in manifest['source_hashes'].items():
    if hashlib.sha256((root / name).read_bytes()).hexdigest() != expected:
        errors.append('source drift: ' + name)
ledger = json.loads((repair.parent / 'u9/finding-ledger.json').read_text())
assert len(ledger['findings']) == 8
for finding in ledger['findings']:
    if finding['status'] != 'fixed' or finding['fix_status'] != 'fixed':
        errors.append('unfixed: ' + finding['id'])
    for ref in finding['repair_evidence']:
        if not (repair.parent / 'u9' / ref).is_file():
            errors.append('missing evidence: ' + ref)
source_paths = list(manifest['source_hashes'])
result = subprocess.run(['git', 'diff', '--check', '--', *source_paths, 'CHANGELOG.md', str(repair.parent), 'docs/plans/2026-09-18-001-project-lead-cycle-1-plan.md'], cwd=root, capture_output=True, text=True)
if result.returncode:
    errors.append(result.stdout + result.stderr)
docs = [root / p for p in source_paths if p.endswith('.md')]
docs += list(repair.glob('*.md'))
docs += [repair.parent / '2026-09-18-cycle-1-execution-evidence.md', root / 'docs/plans/2026-09-18-001-project-lead-cycle-1-plan.md']
links = 0
for doc in docs:
    for value in re.findall(r'\[[^\]\n]+\]\(([^)\n]+)\)', doc.read_text()):
        if value.startswith(('http:', 'https:', '#', 'mailto:')):
            continue
        target = unquote(value.split('#', 1)[0].strip('<>'))
        if not target or '<' in target or '>' in target:
            continue
        links += 1
        if not (doc.parent / target).exists():
            errors.append(f'missing link: {doc.relative_to(root)} -> {target}')
print(json.dumps({'source_files': len(source_paths), 'fixed_findings': len(ledger['findings']), 'markdown_files': len(docs), 'link_targets_checked': links, 'anchor_validation': 'not-run', 'errors': errors}, ensure_ascii=False, indent=2))
raise SystemExit(bool(errors))
