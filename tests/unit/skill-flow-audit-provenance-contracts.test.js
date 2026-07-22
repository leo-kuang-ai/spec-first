'use strict';

const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..');
const auditRoot = path.join(repoRoot, 'docs', '项目审查', '2026-07-18-skill-flow-system-audit-refresh');
const calibratedHead = '27baf79f7d3bb0873deb591218c76b9c11a91bbf';
const relativeFiles = [
  'README.md',
  'optimization-issues.md',
  'review-report.md',
  'evidence/edge-ledger.md',
  'evidence/skill-graph.md',
  'evidence/validation.md',
];

function read(relativePath) {
  return fs.readFileSync(path.join(auditRoot, relativePath), 'utf8');
}

describe('Skill-flow audit provenance invariants', () => {
  test.each(relativeFiles)('%s binds the same committed calibration snapshot', (relativePath) => {
    const document = read(relativePath);
    expect(document).toContain(`current_head_at_calibration: ${calibratedHead}`);
    expect(document).toContain('working_tree_overlay: none');
    expect(document).not.toContain('247f86aeb2225641f93eb3d42f86a192e15a6d2e');
    expect(document).not.toContain('uncommitted-sf24-sf26-p3-contract-repair');
  });

  test('all summaries distinguish committed P2 pair changes from the zero-delta P3 repair', () => {
    const combined = relativeFiles.map(read).join('\n');
    expect(read('evidence/edge-ledger.md')).toContain('committed_p2_pair_delta_added: 2');
    expect(read('evidence/edge-ledger.md')).toContain('committed_p2_pair_delta_removed: 3');
    expect(read('evidence/edge-ledger.md')).toContain('p3_pair_delta_added: 0');
    expect(read('evidence/edge-ledger.md')).toContain('p3_pair_delta_removed: 0');
    expect(read('evidence/skill-graph.md')).toContain('committed_p2_pair_delta: +2/-3');
    expect(read('evidence/skill-graph.md')).toContain('p3_pair_delta: 0/0');
    expect(combined).not.toContain('overlay_pair_delta');
    expect(combined).not.toMatch(/P3 overlay 尚未提交|当前最终 overlay 仍未提交|当前 overlay pair delta/);
  });

  test('audit evidence names governance JSON as the sole internal delivery owner', () => {
    const ownerFiles = [
      'optimization-issues.md',
      'review-report.md',
      'evidence/skill-graph.md',
      'evidence/validation.md',
    ];
    const documents = ownerFiles.map((relativePath) => read(relativePath));
    for (const document of documents) {
      expect(document).toContain('skills-governance.json');
      expect(document).toContain('唯一真源');
      expect(document).not.toContain('DELIVERED_INTERNAL_SKILLS');
      expect(document).not.toContain('current allowlist');
      expect(document).not.toContain('internal delivery allowlist');
      expect(document).not.toContain('delivered internal allowlist');
    }
  });
});
