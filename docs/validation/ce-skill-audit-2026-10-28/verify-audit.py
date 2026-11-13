#!/usr/bin/env python3
"""复核审查产物的一致性及被审工作区保护，不验证模型阅读或语义结论。"""
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import sys

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
PLAN = ROOT / 'docs/plans/2026-10-28-001-ce-all-skills-source-audit-plan.md'
EXCLUDED = {'spec-app-consistency-audit', 'spec-project-rules', 'spec-rule-miner', 'spec-write-skill'}


def git(root, *args):
    env = {k: v for k, v in os.environ.items() if not k.startswith('GIT_')}
    return subprocess.check_output(['git', '-C', str(root), *args], env=env).decode().strip()


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    baseline = json.loads((HERE / 'baseline.json').read_text())
    ledger = json.loads((HERE / 'full-asset-ledger.json').read_text())
    coverage = json.loads((HERE / 'coverage.json').read_text())
    ce = Path(baseline['ce_repo'])
    errors = []
    included = [x for x in coverage if x.get('scope_status') != 'excluded_by_user']
    excluded = [x for x in coverage if x.get('scope_status') == 'excluded_by_user']
    source_skills = {x.name for x in (ROOT / 'skills').iterdir() if (x / 'SKILL.md').is_file()}
    if source_skills != {x['skill'] for x in coverage} or len(coverage) != 38:
        errors.append('source skill mapping differs')
    if len(included) != 34 or {x['skill'] for x in excluded} != EXCLUDED:
        errors.append('included/excluded scope differs')
    if any(x['status'] != 'skipped_by_user' or x.get('full_review_complete') for x in excluded):
        errors.append('excluded skill counted complete')
    for x in included:
        if x['status'] != 'source_review_complete' or not x.get('full_review_complete'):
            errors.append('incomplete skill: ' + x['skill'])
        if x.get('integration_status') != 'source_decisions_recorded' or not x.get('capability_comparisons'):
            errors.append('missing integration decisions: ' + x['skill'])
        note = HERE / x.get('note', 'missing')
        if not note.is_file() or not (HERE / 'file-tables' / (x['skill'] + '.md')).is_file():
            errors.append('missing note/table: ' + x['skill'])
        for side, name, root in [('spec-first', x['skill'], ROOT), ('ce', x.get('ce_skill'), ce)]:
            if not name:
                continue
            actual = {str(p) for p in (root / 'skills' / name).rglob('*') if p.is_file()}
            recorded = {p['path'] for p in ledger if p['skill'] == x['skill'] and p['side'] == side and not p['relative_path'].startswith('@dependency/')}
            if actual != recorded:
                errors.append({'inventory': x['skill'], 'side': side, 'missing': sorted(actual - recorded), 'extra': sorted(recorded - actual)})
    entries = [x for x in ledger if x.get('scope_status') != 'excluded_by_user']
    for x in entries:
        path = Path(x['path'])
        if not path.is_file() or sha(path) != x['sha256']:
            errors.append({'source_hash_drift': x['path']})
            continue
        if x['kind'] != 'text':
            continue
        count = len(path.read_bytes().decode('utf-8').splitlines())
        end = 0
        for lo, hi in sorted(x['read_ranges']):
            if lo > end + 1 or lo < 1 or hi < lo or hi > count:
                errors.append({'invalid_read_range': x['path'], 'range': [lo, hi], 'lines': count})
            end = max(end, hi)
        if end != count or count != x['lines'] or x['read_status'] != 'complete':
            errors.append({'incomplete_recorded_read': x['path']})
        if x['comparison_status'] not in ('source_comparison_complete', 'direct_contract_reviewed'):
            errors.append({'comparison_not_closed': x['path']})
    dirty_drift = [rel for rel, expected in baseline['source_hashes'].items() if not (ROOT / rel).is_file() or sha(ROOT / rel) != expected]
    if dirty_drift:
        errors.append({'original_dirty_drift': dirty_drift})
    identities = {'head': git(ROOT, 'rev-parse', 'HEAD'), 'branch': git(ROOT, 'branch', '--show-current'), 'ce_head': git(ce, 'rev-parse', 'HEAD')}
    for key, value in identities.items():
        if value != baseline[key]:
            errors.append({'identity_drift': key, 'actual': value, 'expected': baseline[key]})
    others = git(ROOT, 'ls-files', '--others', '--exclude-standard', '-z').split('\0')
    allowed_prefix = str(HERE.relative_to(ROOT)) + '/'
    unexpected = [x for x in others if x and x not in baseline['source_hashes'] and x != str(PLAN.relative_to(ROOT)) and not x.startswith(allowed_prefix)]
    if unexpected:
        errors.append({'unexpected_new_untracked': unexpected})
    plan_text = PLAN.read_text()
    mapped_rows = re.findall(r'^\| \d+ \| `([^`]+)` \|.*$', plan_text, re.MULTILINE)
    if len(mapped_rows) != 38 or set(mapped_rows) != source_skills:
        errors.append('plan mapping differs')
    if plan_text.count('| 已完成源码审查 |') != 34 or plan_text.count('| 用户指定跳过 |') != 4:
        errors.append('plan states differ')
    if '- [ ]' in plan_text:
        errors.append('plan still contains incomplete review step')
    for required in ['report.md', 'file-review-index.md']:
        if not (HERE / required).is_file():
            errors.append('missing deliverable: ' + required)
    scope = json.loads((HERE / 'scope-final.json').read_text())
    if scope.get('status') != 'complete' or scope.get('mutation_detected') is not False or scope.get('observed_diff_sha256') != scope.get('expected_diff_sha256'):
        errors.append({'review_scope_snapshot': scope})
    documents = [HERE / 'report.md', PLAN, HERE / 'file-review-index.md', *sorted((HERE / 'skills').glob('*.md')), *sorted((HERE / 'file-tables').glob('*.md'))]
    broken_links = []
    for doc in documents:
        for link in re.findall(r'\]\(([^)]+)\)', doc.read_text()):
            if link.startswith(('http:', 'https:', '#')) or '<' in link:
                continue
            target = re.sub(r':\d+$', '', link.split('#', 1)[0])
            if not (doc.parent / target).exists():
                broken_links.append({'file': str(doc.relative_to(ROOT)), 'link': link})
    if broken_links:
        errors.append({'broken_links': broken_links})
    package = [x for x in entries if not x['relative_path'].startswith('@dependency/')]
    dependencies = [x for x in entries if x['relative_path'].startswith('@dependency/')]
    result = {
        'kind': 'audit-record-and-source-preservation-check',
        'status': 'passed' if not errors else 'failed',
        'included_skills': len(included),
        'source_reviews_complete': sum(x.get('full_review_complete', False) for x in included),
        'direct_ce_mappings': sum(bool(x.get('ce_skill')) for x in included),
        'excluded_skills': sorted(EXCLUDED),
        'package_text_files': sum(x['kind'] == 'text' for x in package),
        'package_generated_binary_caches': [x['path'] for x in package if x['kind'] != 'text'],
        'direct_dependency_entries': len(dependencies),
        'direct_dependency_unique_paths': len({x['path'] for x in dependencies}),
        'all_included_unique_text_paths': len({x['path'] for x in entries if x['kind'] == 'text'}),
        'capability_comparisons_recorded': sum(len(x.get('capability_comparisons', [])) for x in included),
        'original_dirty_files_checked': len(baseline['source_hashes']),
        'original_dirty_drift': dirty_drift,
        'identity': identities,
        'review_scope_snapshot': scope,
        'unexpected_new_untracked': unexpected,
        'documents_link_checked': len(documents),
        'broken_links': broken_links,
        'errors': errors,
        'limitations': [
            '确定性校验只证明目录/hash/区间/台账和产物一致，不证明实际阅读、语义正确或审查质量；语义裁定由逐项笔记承担。',
            '全文区间包含既有同hash文本阅读记录的复用；不承诺整个代码库所有递归依赖均已全文阅读。',
            '产品建议尚未实施；无独立reviewer、fresh-model/真实宿主、视觉或field outcome验收。',
        ],
    }
    (HERE / 'final-verification.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if not errors else 1


if __name__ == '__main__':
    sys.exit(main())
