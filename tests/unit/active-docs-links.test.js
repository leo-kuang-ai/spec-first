'use strict';

const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.join(__dirname, '..', '..');

// Root documents and skill prose that this contract keeps link-reachable.
const ROOT_DOCUMENTS = ['README.md', 'README.en.md', 'README.zh-CN.md'];

// Known historical exemptions: relative links that are intentionally kept
// even though their target is absent from the repo. Add an entry only with a
// reason the plan/source owner would defend; the allowlist is reviewed, not
// a dumping ground for new breakage. Each entry matches `<file> -> <target>`
// where <target> is the link destination after angle-bracket stripping and
// before any `#fragment` is removed.
const KNOWN_EXEMPT_LINKS = [
  // { file: 'skills/example/SKILL.md', target: 'does/not/exist.md', reason: '...' },
];

// Links whose destination carries a URL scheme (http:, https:, mailto:, ...) or
// is a pure in-document anchor are out of scope: only repo-relative paths are
// checked. Protocol-relative targets (//host/path) count as external too.
const URI_SCHEME_RE = /^[a-zA-Z][a-zA-Z0-9+.-]*:/;

// Inline markdown links and images: [text](target "title") or [text](<target> "title").
// Lazy bracket matching keeps nested-bracket link text (rare in this repo) readable.
const INLINE_LINK_RE = /(!?)\[((?:[^\[\]]|\[[^\[\]]*\])*)\]\(\s*(<[^>]*>|[^)\s]+)(?:\s+"[^"]*")?\s*\)/g;

// Directories whose name contains `-workspace` are excluded from discovery:
// eval/workflow fixture trees may embed skill or reference copies whose links
// only resolve inside their own fixture context.
function isExcludedDirName(name) {
  return name.includes('-workspace');
}

function collectSkillDocuments() {
  const results = [];
  const walk = (dir) => {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (isExcludedDirName(entry.name)) continue;
      const fullPath = path.join(dir, entry.name);
      // Skip symlinks: they can point outside the repo or create cycles.
      if (entry.isSymbolicLink()) continue;
      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }
      if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
      const rel = path.relative(REPO_ROOT, fullPath).split(path.sep).join('/');
      // skills/**/SKILL.md and skills/**/references/**/*.md
      if (/^skills\/(?:.+\/)?SKILL\.md$/.test(rel) || /^skills\/(?:.+\/)?references\/.+\.md$/.test(rel)) {
        results.push(fullPath);
      }
    }
  };
  walk(path.join(REPO_ROOT, 'skills'));
  return results;
}

function collectScopedDocuments() {
  const files = ROOT_DOCUMENTS.map((name) => path.join(REPO_ROOT, name))
    .filter((file) => fs.existsSync(file));
  return files.concat(collectSkillDocuments());
}

// Returns [{ file, line, target }] for every markdown link, with the target
// stripped of angle brackets and kept otherwise verbatim (fragments intact).
function extractMarkdownLinks(file) {
  const rel = path.relative(REPO_ROOT, file).split(path.sep).join('/');
  const text = fs.readFileSync(file, 'utf8');
  const links = [];
  let match;
  INLINE_LINK_RE.lastIndex = 0;
  while ((match = INLINE_LINK_RE.exec(text)) !== null) {
    let target = match[3].trim();
    if (target.startsWith('<') && target.endsWith('>')) {
      target = target.slice(1, -1).trim();
    }
    const line = text.slice(0, match.index).split('\n').length;
    links.push({ file: rel, line, target });
  }
  return links;
}

function isRelativePathTarget(target) {
  if (target === '' || target.startsWith('#')) return false;
  if (URI_SCHEME_RE.test(target) || target.startsWith('//')) return false;
  return true;
}

function collectBrokenRelativeLinks() {
  const exempt = new Set(KNOWN_EXEMPT_LINKS.map((e) => `${e.file} -> ${e.target}`));
  const broken = [];
  for (const file of collectScopedDocuments()) {
    for (const link of extractMarkdownLinks(file)) {
      if (!isRelativePathTarget(link.target)) continue;
      const targetPath = link.target.split('#')[0];
      if (targetPath === '') continue; // pure fragment on a compound target
      const resolved = path.resolve(path.dirname(file), targetPath);
      if (fs.existsSync(resolved)) continue;
      if (exempt.has(`${link.file} -> ${link.target}`)) continue;
      broken.push({
        ...link,
        resolved: path.relative(REPO_ROOT, resolved).split(path.sep).join('/'),
      });
    }
  }
  return broken;
}

describe('active docs links', () => {
  test('scoped documents are discovered', () => {
    const files = collectScopedDocuments().map((f) =>
      path.relative(REPO_ROOT, f).split(path.sep).join('/')
    );
    for (const root of ROOT_DOCUMENTS) {
      expect(files).toContain(root);
    }
    expect(files.filter((f) => /^skills\/(?:.+\/)?SKILL\.md$/.test(f)).length).toBeGreaterThan(0);
    expect(files.filter((f) => /^skills\/(?:.+\/)?references\/.+\.md$/.test(f)).length).toBeGreaterThan(0);
  });

  test('allowlist entries still match their documented form', () => {
    // An allowlist entry that no longer corresponds to a real link in its file
    // is stale and must be removed, otherwise it silently widens the contract.
    const present = new Set();
    for (const file of collectScopedDocuments()) {
      for (const link of extractMarkdownLinks(file)) {
        if (isRelativePathTarget(link.target)) {
          present.add(`${link.file} -> ${link.target}`);
        }
      }
    }
    const stale = KNOWN_EXEMPT_LINKS.filter((e) => !present.has(`${e.file} -> ${e.target}`));
    expect(stale.map((e) => `${e.file} -> ${e.target}`)).toEqual([]);
  });

  test('every relative markdown link in scoped docs resolves to an existing path', () => {
    const broken = collectBrokenRelativeLinks();
    const rendered = broken.map(
      (b) => `  ${b.file}:${b.line} -> ${JSON.stringify(b.target)} (resolved: ${b.resolved})`
    );
    expect(
      `broken relative links (${broken.length}):\n${rendered.join('\n')}`
    ).toBe(`broken relative links (0):\n`);
  });
});
