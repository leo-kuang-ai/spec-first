'use strict';

const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '../..');

function frontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  return match ? match[1] : '';
}

function parseReferencedReviews(content) {
  const metadata = frontmatter(content);
  const block = metadata.match(/^referenced_reviews:\s*\n((?:[ \t]+.*\n?)*)/m);
  if (!block) return [];
  const entries = [];
  let current = null;
  for (const line of block[1].split('\n')) {
    const start = line.match(/^\s*-\s+path:\s*(.+)$/);
    if (start) {
      current = { path: start[1].replace(/^['"]|['"]$/g, '') };
      entries.push(current);
      continue;
    }
    const field = line.match(/^\s+([a-z_]+):\s*(.*)$/);
    if (current && field) current[field[1]] = field[2].trim();
  }
  return entries;
}

function validateReferencedReviews(content) {
  const date = frontmatter(content).match(/^date:\s*(\d{4}-\d{2}-\d{2})\s*$/m);
  if (date && date[1] < '2026-06-14') return [];
  return parseReferencedReviews(content)
    .filter((entry) => entry.role === 'origin' && entry.scope === 'in')
    .filter((entry) => !entry.addresses_findings && !entry.deferred_findings)
    .map((entry) => ({
      reason_code: 'referenced-review-missing-finding-ids',
      path: entry.path,
    }));
}

describe('plan status and review-closure taxonomy', () => {
  test('current plans do not use readiness fields as progress state', () => {
    const invalid = [];
    for (const name of fs.readdirSync(path.join(repoRoot, 'docs/plans'))) {
      if (!name.endsWith('.md')) continue;
      const metadata = frontmatter(fs.readFileSync(path.join(repoRoot, 'docs/plans', name), 'utf8'));
      if (/^artifact_readiness:\s*(?:active|in_progress|completed|done)\s*$/m.test(metadata)) invalid.push(name);
    }
    expect(invalid).toEqual([]);
  });

  test('origin review links declare addressed or deferred finding ids', () => {
    const invalid = [];
    for (const name of fs.readdirSync(path.join(repoRoot, 'docs/plans'))) {
      if (!name.endsWith('.md')) continue;
      const content = fs.readFileSync(path.join(repoRoot, 'docs/plans', name), 'utf8');
      for (const error of validateReferencedReviews(content)) invalid.push(`${name}: ${error.path}`);
    }
    expect(invalid).toEqual([]);
  });

  test('reports the weak closure reason code without rejecting legacy plans', () => {
    expect(validateReferencedReviews('# Legacy plan\n')).toEqual([]);
    expect(validateReferencedReviews('---\nreferenced_reviews:\n  - path: docs/项目审查/report.md\n    role: origin\n    scope: in\n---\n'))
      .toEqual([{
        reason_code: 'referenced-review-missing-finding-ids',
        path: 'docs/项目审查/report.md',
      }]);
  });
});
