#!/usr/bin/env node
'use strict';
/*
 * Deterministic dependency-facts extractor for spec-project-rules.
 *
 * Usage:
 *   node extract-deps.cjs <repoRoot> [--alias-file <path>] [--verify] [--freshness] [--pretty]
 * Exit codes: 0 facts extracted / verify clean; 1 usage/IO error or any verify
 * finding (violations, missing refs, alias scan errors); 2 unsupported build
 * layout (deterministic directory-sampling payload on stdout; dependency
 * edges unavailable in that mode). --freshness
 * is advisory payload only (clean/dirty/unavailable per source refs vs the
 * frontmatter source_commit git baseline) and never flips the exit code;
 * dirty refs are handed to LLM re-verification.
 */

const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

function parseArgs(argv) {
  const args = { repoRoot: null, aliasFile: null, verify: false, freshness: false, pretty: false };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--alias-file') {
      const value = argv[i + 1];
      if (!value) throw new Error('--alias-file requires a path');
      args.aliasFile = path.resolve(value);
      i += 1;
    } else if (token === '--verify') {
      args.verify = true;
    } else if (token === '--freshness') {
      args.freshness = true;
    } else if (token === '--pretty') {
      args.pretty = true;
    } else if (!args.repoRoot) {
      args.repoRoot = path.resolve(token);
    } else {
      throw new Error(`Unknown argument: ${token}`);
    }
  }
  if (!args.repoRoot) throw new Error('Usage: extract-deps.cjs <repoRoot> [--alias-file <path>] [--verify] [--freshness] [--pretty]');
  return args;
}

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function readJson(filePath) {
  return JSON.parse(readText(filePath));
}

function globToRegExp(glob) {
  const escaped = glob.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*\*/g, '\u0000').replace(/\*/g, '[^/]*').replace(/\u0000/g, '.*');
  return new RegExp(`^${escaped}/?$`);
}

function listDir(root) {
  try { return fs.readdirSync(root, { withFileTypes: true }); } catch (_error) { return []; }
}

function walkDirs(root, maxDepth = 3) {
  const results = [];
  const walk = (rel, depth) => {
    if (depth >= maxDepth) return;
    for (const entry of listDir(path.join(root, rel))) {
      if (!entry.isDirectory()) continue;
      const child = rel ? `${rel}/${entry.name}` : entry.name;
      results.push(child);
      walk(child, depth + 1);
    }
  };
  walk('', 0);
  return results;
}

function extractNpmWorkspaces(root) {
  const rootManifestPath = path.join(root, 'package.json');
  if (!fs.existsSync(rootManifestPath)) return null;
  let rootManifest;
  try { rootManifest = readJson(rootManifestPath); } catch (_error) { return null; }
  const globs = Array.isArray(rootManifest.workspaces)
    ? rootManifest.workspaces
    : rootManifest.workspaces && Array.isArray(rootManifest.workspaces.packages)
      ? rootManifest.workspaces.packages
      : null;
  if (!globs) return null;
  const globRegexes = globs.map((glob) => globToRegExp(glob));

  const modules = [];
  const nameToModule = new Map();
  for (const relativeDir of walkDirs(root)) {
    const manifestPath = path.join(root, relativeDir, 'package.json');
    if (!fs.existsSync(manifestPath)) continue;
    if (!globRegexes.some((regex) => regex.test(relativeDir) || regex.test(`${relativeDir}/`))) continue;
    let manifest;
    try { manifest = readJson(manifestPath); } catch (_error) { continue; }
    const name = manifest.name || relativeDir;
    modules.push(relativeDir);
    nameToModule.set(name, relativeDir);
  }
  if (modules.length === 0) return null;

  const edges = [];
  for (const mod of modules) {
    const manifestPath = path.join(root, mod, 'package.json');
    let manifest;
    try { manifest = readJson(manifestPath); } catch (_error) { continue; }
    const depNames = [
      ...Object.keys(manifest.dependencies || {}),
      ...Object.keys(manifest.devDependencies || {}),
    ];
    for (const depName of depNames) {
      const target = nameToModule.get(depName);
      if (target && target !== mod) edges.push([mod, target]);
    }
  }
  const uniqueEdges = [...new Set(edges.map(([a, b]) => `${a}\u0000${b}`))]
    .sort().map((key) => key.split('\u0000'));
  return { kind: 'npm-workspaces', modules: modules.sort(), edges: uniqueEdges };
}

function parseAliasTable(aliasFilePath) {
  const aliases = new Map();
  if (!aliasFilePath) return aliases;
  const text = readText(aliasFilePath)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((line) => !/^\s*\/\//.test(line))
    .join('\n');
  // Only dependency-like group:artifact values count. Removing comment-only
  // text first lets declarations share a line with `object {` while avoiding
  // commented examples; the optional type covers `const val foo: String`.
  const pattern = /\bconst\s+val\s+([A-Za-z0-9_]+)(?:\s*:\s*[A-Za-z0-9_.<>?]+)?\s*=\s*["']([^"']+)["']/g;
  let match = pattern.exec(text);
  while (match) {
    if (match[2].split(':').length >= 2) aliases.set(match[1], match[2]);
    match = pattern.exec(text);
  }
  return aliases;
}

function gradleAliasReferences(root) {
  const references = new Set();
  for (const entry of listDir(root)) {
    if (!entry.isDirectory()) continue;
    const buildPath = path.join(root, entry.name, 'build.gradle');
    if (!fs.existsSync(buildPath)) continue;
    let text;
    try { text = readText(buildPath); } catch (_error) { continue; }
    for (const match of text.matchAll(/Deps\.([A-Za-z0-9_.]+)/g)) {
      references.add(match[1].split('.').pop());
    }
  }
  return references;
}

function findGradleAliasTable(root, maxDepth = 6) {
  const candidates = [];
  const scanErrors = [];
  const referencedAliases = gradleAliasReferences(root);
  const walk = (relative, depth) => {
    if (depth > maxDepth) return;
    const absoluteDir = path.join(root, relative);
    let entries;
    try {
      entries = fs.readdirSync(absoluteDir, { withFileTypes: true });
    } catch (error) {
      scanErrors.push({ path: relative || '.', code: error.code || 'read-error' });
      return;
    }
    for (const entry of entries) {
      if (entry.name === '.git' || entry.name === 'build' || entry.name === 'node_modules'
        || entry.name === '.worktrees' || entry.name === 'evals' || entry.name === 'fixtures') continue;
      const child = relative ? `${relative}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        walk(child, depth + 1);
      } else if (entry.name === 'Deps.kt' && (entry.isFile() || entry.isSymbolicLink())) {
        try {
          const aliases = parseAliasTable(path.join(root, child));
          if (aliases.size > 0) {
            const referencedCount = [...aliases.keys()].filter((name) => referencedAliases.has(name)).length;
            candidates.push({ path: child, aliases, referencedCount });
          }
        } catch (error) {
          scanErrors.push({ path: child, code: error.code || 'read-error' });
        }
      }
    }
  };
  walk('', 0);
  candidates.sort((left, right) => right.referencedCount - left.referencedCount
    || right.aliases.size - left.aliases.size
    || left.path.localeCompare(right.path));
  const selected = candidates[0] || null;
  return {
    selected,
    candidate_count: candidates.length,
    referenced_alias_count: selected ? selected.referencedCount : 0,
    scan_errors: scanErrors,
  };
}

function artifactOf(gav) {
  const parts = gav.split(':');
  return parts.length >= 2 ? parts[1] : gav;
}

function extractGradle(root, aliases) {
  const settingsPath = path.join(root, 'settings.gradle');
  const settingsKtsPath = path.join(root, 'settings.gradle.kts');
  const settingsFile = fs.existsSync(settingsPath) ? settingsPath
    : fs.existsSync(settingsKtsPath) ? settingsKtsPath : null;
  if (!settingsFile) return null;

  const settingsText = readText(settingsFile);
  const includeLines = settingsText.split('\n').filter((line) => /^\s*include\s/.test(line));
  const declared = new Set();
  for (const line of includeLines) {
    for (const m of line.matchAll(/['"]:([A-Za-z0-9_-]+)['"]/g)) declared.add(m[1]);
  }
  // Directory-level modules: module dirs carrying a build.gradle, because
  // settings.gradle may register modules dynamically (gradle plugins).
  const dirModules = listDir(root)
    .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(root, entry.name, 'build.gradle')))
    .map((entry) => entry.name);
  for (const mod of dirModules) declared.add(mod);
  if (declared.size === 0) return null;

  const edges = [];
  const unresolvedAliases = new Set();
  for (const mod of declared) {
    const buildPath = path.join(root, mod, 'build.gradle');
    if (!fs.existsSync(buildPath)) continue;
    const text = readText(buildPath);
    for (const m of text.matchAll(/project\s*\(\s*['"]:([A-Za-z0-9_-]+)['"]\s*\)/g)) {
      if (m[1] !== mod) edges.push([mod, m[1]]);
    }
    for (const m of text.matchAll(/Deps\.([A-Za-z0-9_.]+)/g)) {
      const name = m[1].split('.').pop();
      const gav = aliases.get(name);
      if (gav && gav.includes(':')) {
        const artifact = artifactOf(gav);
        if (artifact !== mod) edges.push([mod, artifact]);
      } else if (!aliases.has(name)) {
        unresolvedAliases.add(name);
      }
    }
  }
  const uniqueEdges = [...new Set(edges.map(([a, b]) => `${a}\u0000${b}`))]
    .sort().map((key) => key.split('\u0000'));
  return {
    kind: 'gradle',
    modules: [...declared].sort(),
    edges: uniqueEdges,
    unresolved_alias_count: unresolvedAliases.size,
  };
}

function buildDependencyFacts(repoRoot, explicitAliasFile = null) {
  const npm = extractNpmWorkspaces(repoRoot);
  if (npm) {
    return {
      ...npm,
      alias_file: null,
      alias_count: 0,
      alias_discovery: 'not-applicable',
      alias_candidate_count: 0,
      referenced_alias_count: 0,
      alias_scan_errors: [],
    };
  }

  const discovery = explicitAliasFile ? null : findGradleAliasTable(repoRoot);
  const selected = discovery && discovery.selected;
  const aliasFile = explicitAliasFile || (selected && path.join(repoRoot, selected.path));
  const aliases = explicitAliasFile
    ? parseAliasTable(explicitAliasFile)
    : selected ? selected.aliases : new Map();
  const gradle = extractGradle(repoRoot, aliases);
  if (!gradle) return null;
  return {
    ...gradle,
    alias_file: aliasFile ? path.relative(repoRoot, aliasFile).replace(/\\/g, '/') : null,
    alias_count: aliases.size,
    alias_discovery: explicitAliasFile ? 'explicit' : selected ? 'auto' : 'not-found',
    alias_candidate_count: explicitAliasFile ? 1 : discovery.candidate_count,
    referenced_alias_count: explicitAliasFile
      ? [...aliases.keys()].filter((name) => gradleAliasReferences(repoRoot).has(name)).length
      : discovery.referenced_alias_count,
    alias_scan_errors: explicitAliasFile ? [] : discovery.scan_errors,
  };
}

function computeChurn(repoRoot, modules, maxCommits = 500) {
  const churn = {};
  for (const mod of modules) {
    churn[mod] = 0;
  }
  try {
    const output = execSync(
      `git log --format= --name-only -${maxCommits}`,
      // stderr silenced: churn is advisory; a non-git target must not surface raw git errors.
      { cwd: repoRoot, encoding: 'utf8', timeout: 15000, stdio: ['ignore', 'pipe', 'ignore'] },
    );
    for (const line of output.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const top = trimmed.split('/')[0];
      if (churn[top] !== undefined) churn[top] += 1;
    }
  } catch (_error) {
    // git unavailable or shallow clone — churn is advisory, not blocking
  }
  return churn;
}

function normalizeModuleName(name) {
  return String(name).trim().replace(/^:|:$/g, '').replace(/_/g, '-').toLowerCase();
}

function runVerify(repoRoot, facts) {
  const kbPath = path.join(repoRoot, 'docs/architecture.md');
  if (!fs.existsSync(kbPath)) {
    return { verify_status: 'no-kb', note: 'docs/architecture.md not found; nothing to verify' };
  }
  const kbText = fs.readFileSync(kbPath, 'utf8');
  const depSection = kbText.split(/\n## /).find((s) => s.startsWith('依赖方向')) || '';
  const edgeSet = new Set(facts.edges.map(([a, b]) => `${normalizeModuleName(a)}\u0000${normalizeModuleName(b)}`));
  const violations = [];
  for (const line of depSection.split('\n')) {
    if (!line.startsWith('- ')) continue;
    const text = line.slice(2);
    // Direction syntax: modules named before the forbidding verb are the "from"
    // side, modules after it the "to" side (per knowledge-format.md). Only the
    // conclusion field (before the first ` | ` separator) is parsed, so
    // backtick path refs in later fields cannot skew module positions.
    const conclusion = text.split(' | ')[0];
    const verbMatch = conclusion.match(/禁止|不得|不允许/);
    if (!verbMatch) continue;
    const verbIndex = verbMatch.index;
    const matched = facts.modules
      .map((mod) => {
        const fullPath = conclusion.indexOf(mod);
        if (fullPath >= 0) return { mod, pos: fullPath };
        const short = mod.split('/').pop();
        if (!short) return null;
        const shortMatch = conclusion.match(new RegExp(`\\b${short.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`));
        return shortMatch ? { mod, pos: shortMatch.index } : null;
      })
      .filter(Boolean);
    const froms = matched.filter((m) => m.pos < verbIndex).map((m) => m.mod);
    const tos = matched.filter((m) => m.pos > verbIndex + verbMatch[0].length).map((m) => m.mod);
    for (const from of froms) {
      for (const to of tos) {
        if (from === to) continue;
        if (edgeSet.has(`${normalizeModuleName(from)}\u0000${normalizeModuleName(to)}`)) {
          violations.push({ rule: text.slice(0, 100), from, to, note: 'forbidden edge present' });
        }
      }
    }
  }
  // source refs liveness — same collector as freshness (source_refs field
  // backticks plus reuse 住址 homes), so prose backticks in conclusion fields
  // cannot surface as phantom refs. Escaping refs are flagged, not probed.
  const missingRefs = [];
  for (const [normalized, meta] of collectSourceRefs(kbText)) {
    if (normalized.startsWith('../') || normalized.includes('/../') || path.isAbsolute(normalized)) {
      missingRefs.push({ ref: meta.raw, line: meta.line, reason: 'ref escapes repo root' });
    } else if (!fs.existsSync(path.join(repoRoot, normalized))) {
      missingRefs.push({ ref: meta.raw, line: meta.line });
    }
  }
  const scanErrors = facts.alias_scan_errors || [];
  const findings = violations.length + missingRefs.length + scanErrors.length;
  return {
    verify_status: findings === 0 ? 'clean' : `${findings} finding(s)`,
    violations,
    missing_refs: missingRefs,
    alias_scan_errors: scanErrors,
    dep_section_lines: depSection.split('\n').filter((l) => l.startsWith('- ')).length,
  };
}

function runFreshness(repoRoot) {
  const kbPath = path.join(repoRoot, 'docs/architecture.md');
  if (!fs.existsSync(kbPath)) return { status: 'no-kb' };
  const kbText = readText(kbPath);
  const commitMatch = kbText.match(/^source_commit:\s*(\S+)/m);
  if (!commitMatch) return { status: 'unavailable', reason: 'frontmatter missing source_commit baseline' };
  const sourceCommit = commitMatch[1];
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(sourceCommit)) {
    return { status: 'unavailable', reason: `unresolvable source_commit: ${sourceCommit}` };
  }
  let changed;
  try {
    changed = gitChangedPaths(repoRoot, sourceCommit);
  } catch (_error) {
    return {
      status: 'unavailable',
      source_commit: sourceCommit,
      reason: 'git baseline unavailable (no git history / shallow clone / commit not resolvable)',
    };
  }
  const refs = collectSourceRefs(kbText);
  // Directory refs (e.g. a reuse 住址 pointing at a package dir) count as dirty
  // when any file underneath them changed.
  const dirtyRefs = [...refs.keys()]
    .filter((ref) => [...changed].some((c) => c === ref || c.startsWith(`${ref}/`)))
    .sort();
  return {
    status: dirtyRefs.length === 0 ? 'clean' : 'dirty',
    source_commit: sourceCommit,
    ref_count: refs.size,
    dirty_count: dirtyRefs.length,
    dirty_refs: dirtyRefs,
  };
}

function collectSourceRefs(kbText) {
  // One collector serves both --verify liveness and --freshness dirty
  // detection, so the scanners cannot disagree on what counts as a declared
  // ref: backtick tokens in the source_refs field (third ` | ` field) plus
  // the reuse 住址 home in the conclusion. Backtick prose elsewhere in the
  // conclusion (e.g. `net/`) is not a declared ref. Quoted search patterns,
  // regex escapes, glob characters, and multi-word command snippets are
  // retrieval syntax, not paths — rejected on the raw token, because
  // normalizing `\` first would fake a path separator out of an escape.
  const filePattern = /^[A-Za-z][A-Za-z0-9_.-]*\.[A-Za-z0-9]+$/;
  const refs = new Map();
  const addRef = (raw, line) => {
    const ref = String(raw).trim().replace(/[，,。;；）)]+$/, '').trim();
    if (!ref || ref.startsWith('rg ') || ref.startsWith('@') || /^https?:\/\//.test(ref)) return;
    if (/^["']/.test(ref) || /[\\*?]/.test(ref) || /\s/.test(ref)) return;
    const normalized = ref.replace(/:\d+$/, '');
    if (!normalized.includes('/') && !filePattern.test(normalized)) return;
    const existing = refs.get(normalized);
    if (existing) {
      existing.count += 1;
    } else {
      refs.set(normalized, { count: 1, raw: ref, line: line.slice(0, 100) });
    }
  };
  for (const line of kbText.split('\n')) {
    if (!line.startsWith('- ')) continue;
    const fields = line.slice(2).split(' | ');
    if (fields.length < 3) continue;
    for (const m of fields[2].matchAll(/`([^`]+)`/g)) addRef(m[1], line);
    const home = fields[0].match(/住址\s+`?([^\s，,；;（）()]+)`?/);
    if (home) addRef(home[1], line);
  }
  return refs;
}

function gitChangedPaths(repoRoot, sourceCommit) {
  const git = (args) => execSync(`git ${args}`, {
    cwd: repoRoot,
    encoding: 'utf8',
    timeout: 15000,
    stdio: ['ignore', 'pipe', 'ignore'],
  });
  git(`rev-parse --verify ${sourceCommit}^{commit}`);
  const paths = new Set();
  for (const args of [
    `diff --name-only ${sourceCommit}..HEAD`,
    'diff --name-only',
    'diff --name-only --cached',
  ]) {
    for (const line of git(args).split('\n')) {
      const trimmed = line.trim();
      if (trimmed) paths.add(trimmed);
    }
  }
  return paths;
}

const SAMPLING_SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.kt', '.kts', '.java', '.swift', '.m', '.mm', '.py', '.rb', '.go', '.rs', '.c', '.cc', '.cpp', '.h', '.hpp', '.cs', '.vue', '.svelte']);
const SAMPLING_SKIP_DIRS = new Set(['.git', 'node_modules', 'build', 'dist', 'out', 'generated', 'vendor', '.worktrees', 'evals', 'fixtures', 'docs', '.gradle', 'Pods', 'DerivedData', '.graphify', 'graphify-out']);

function walkSourceFiles(root, rel = '', depth = 0) {
  const files = [];
  if (depth > 8) return files;
  for (const entry of listDir(path.join(root, rel))) {
    const child = rel ? `${rel}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      if (SAMPLING_SKIP_DIRS.has(entry.name)) continue;
      files.push(...walkSourceFiles(root, child, depth + 1));
    } else if (entry.isFile() && SAMPLING_SOURCE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      files.push(child);
    }
  }
  return files;
}

function fileChurnCounts(repoRoot, files) {
  const counts = new Map(files.map((f) => [f, 0]));
  try {
    const output = execSync('git log --format= --name-only -500', {
      cwd: repoRoot,
      encoding: 'utf8',
      timeout: 15000,
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    for (const line of output.split('\n')) {
      const trimmed = line.trim();
      if (counts.has(trimmed)) counts.set(trimmed, counts.get(trimmed) + 1);
    }
  } catch (_error) {
    // churn stays all-zero without git history; sampling falls back to entry-first + path order
  }
  return counts;
}

// Deterministic directory-ratio sampling for unsupported build layouts: the
// LLM never picks which files to read — it consumes this list as-is. Modules
// over their quota rotate picks across second-level sub-directories so larger
// sub-domains cannot crowd out the rest (each sub-domain gets a seat while
// quota lasts; when sub-domains outnumber the quota, the smallest lose out).
function buildSourceSampling(repoRoot, perModuleCap = 8, totalBudget = 60) {
  const files = walkSourceFiles(repoRoot).sort();
  const byModule = new Map();
  for (const file of files) {
    const topDir = file.includes('/') ? file.split('/')[0] : '.';
    if (!byModule.has(topDir)) byModule.set(topDir, []);
    byModule.get(topDir).push(file);
  }
  const churn = fileChurnCounts(repoRoot, files);
  const hasChurn = [...churn.values()].some((c) => c > 0);
  const entryFirst = (f) => (/^(\.\/)?(index|main|app)\.[a-z]+$/i.test(f.split('/').pop()) ? 0 : 1);
  const withinSort = (list) => [...list].sort((a, b) => entryFirst(a) - entryFirst(b)
    || churn.get(b) - churn.get(a)
    || a.localeCompare(b));
  const allocateAcrossSubdirs = (moduleFiles, quota) => {
    const subdirs = new Map();
    for (const f of moduleFiles) {
      const segs = f.split('/');
      const sub = segs.length > 2 ? segs[1] : '.';
      if (!subdirs.has(sub)) subdirs.set(sub, []);
      subdirs.get(sub).push(f);
    }
    const ordered = [...subdirs.entries()]
      .map(([sub, list]) => ({ sub, files: withinSort(list), size: list.length, assigned: 0 }))
      .sort((a, b) => b.size - a.size || a.sub.localeCompare(b.sub));
    for (let i = 0; i < quota && i < ordered.length; i += 1) ordered[i].assigned = 1;
    let left = quota - Math.min(quota, ordered.length);
    while (left > 0) {
      const next = ordered
        .filter((g) => g.assigned < g.size)
        .sort((a, b) => (b.size - b.assigned) - (a.size - a.assigned) || a.sub.localeCompare(b.sub))[0];
      if (!next) break;
      next.assigned += 1;
      left -= 1;
    }
    return ordered.flatMap((g) => g.files.slice(0, g.assigned));
  };
  const total = files.length;
  const modules = [...byModule.entries()]
    .map(([dir, moduleFiles]) => {
      const quota = Math.min(perModuleCap, Math.max(2, Math.ceil((totalBudget * moduleFiles.length) / Math.max(total, 1))));
      const sample_files = moduleFiles.length > quota
        ? allocateAcrossSubdirs(moduleFiles, quota)
        : withinSort(moduleFiles);
      return { dir, file_count: moduleFiles.length, sample_files: sample_files.sort() };
    })
    .sort((a, b) => b.file_count - a.file_count || a.dir.localeCompare(b.dir));
  return {
    kind: 'unsupported-layout',
    total_source_files: total,
    module_count: modules.length,
    sampled_file_count: modules.reduce((sum, m) => sum + m.sample_files.length, 0),
    per_module_cap: perModuleCap,
    total_budget: totalBudget,
    churn_available: hasChurn,
    skipped_dirs: [...SAMPLING_SKIP_DIRS].sort(),
    modules,
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!fs.existsSync(args.repoRoot)) throw new Error(`repo root not found: ${args.repoRoot}`);
  const result = buildDependencyFacts(args.repoRoot, args.aliasFile);
  if (!result) {
    // Unsupported layout still yields deterministic sampling facts; the exit
    // code keeps signaling the degraded mode (no dependency graph available).
    const samplingPayload = {
      source: 'skills/spec-project-rules/scripts/extract-deps.cjs',
      repo_root: args.repoRoot,
      build_kind: 'unsupported-layout',
      sampling: buildSourceSampling(args.repoRoot),
      note: 'no npm workspaces and no gradle settings; dependency edges unavailable; mine along sampling.modules[].sample_files and disclose the sampled/total ratio in closeout',
    };
    if (args.freshness) samplingPayload.freshness = runFreshness(args.repoRoot);
    process.stdout.write(`${JSON.stringify(samplingPayload, null, args.pretty ? 2 : 0)}\n`);
    process.stderr.write('unsupported build layout: no npm workspaces and no gradle settings; '
      + 'deterministic directory sampling payload emitted (consume as-is, exit 2)\n');
    process.exit(2);
  }
  const payload = {
    source: 'skills/spec-project-rules/scripts/extract-deps.cjs',
    repo_root: args.repoRoot,
    build_kind: result.kind,
    module_count: result.modules.length,
    modules: result.modules,
    edge_count: result.edges.length,
    edges: result.edges,
    unresolved_alias_count: result.unresolved_alias_count || 0,
    alias_file: result.alias_file,
    alias_count: result.alias_count,
    alias_discovery: result.alias_discovery,
    alias_candidate_count: result.alias_candidate_count,
    referenced_alias_count: result.referenced_alias_count,
    alias_scan_errors: result.alias_scan_errors,
    churn: computeChurn(args.repoRoot, result.modules),
    note: 'facts only; infra/biz classification and rule synthesis belong to the LLM',
  };
  // Freshness first: it must still land in the payload when verify findings
  // short-circuit the process with exit 1.
  if (args.freshness) {
    payload.freshness = runFreshness(args.repoRoot);
  }
  if (args.verify) {
    payload.verify = runVerify(args.repoRoot, result);
    const verifyFindings = (payload.verify.violations || []).length
      + (payload.verify.missing_refs || []).length
      + (payload.verify.alias_scan_errors || []).length;
    if (verifyFindings > 0) {
      process.stdout.write(`${JSON.stringify(payload, null, args.pretty ? 2 : 0)}\n`);
      process.exit(1);
    }
  }
  process.stdout.write(`${JSON.stringify(payload, null, args.pretty ? 2 : 0)}\n`);
}

if (require.main === module) main();

module.exports = { extractNpmWorkspaces, extractGradle, parseAliasTable, findGradleAliasTable, buildDependencyFacts, computeChurn, runVerify, runFreshness, collectSourceRefs, gitChangedPaths, buildSourceSampling, artifactOf, globToRegExp };
