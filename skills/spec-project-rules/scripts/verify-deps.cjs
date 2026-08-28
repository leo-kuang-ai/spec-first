#!/usr/bin/env node
'use strict';
/*
 * Cheap verify pass for an existing spec-project-rules knowledge base.
 *
 * Deterministically re-extracts the dependency graph (extract-deps.cjs),
 * parses the DEP table in docs/architecture/dependency-rules.md, and reports:
 *   - violations: a 禁止引入 rule whose from->to edge exists in the current graph
 *   - missing_refs: backticked source-ref paths that no longer exist
 *   - manual_check: rules whose from/to are not concrete module names
 *   - absent_allowed: 允许引入 rules whose edge is currently absent (info only)
 * Never writes files; semantic judgment (stale vs violated) stays with the LLM.
 *
 * Usage: node verify-deps.cjs <repoRoot> [--alias-file <path>] [--kb <dir>]
 * Exit codes: 0 clean; 1 findings found; 2 unsupported build layout.
 */

const fs = require('node:fs');
const path = require('node:path');
const extractor = require('./extract-deps.cjs');

function parseArgs(argv) {
  const args = { repoRoot: null, aliasFile: null, kbDir: 'docs/architecture' };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--alias-file') {
      args.aliasFile = path.resolve(argv[i + 1]);
      i += 1;
    } else if (token === '--kb') {
      args.kbDir = argv[i + 1];
      i += 1;
    } else if (!args.repoRoot) {
      args.repoRoot = path.resolve(token);
    } else {
      throw new Error(`Unknown argument: ${token}`);
    }
  }
  if (!args.repoRoot) throw new Error('Usage: verify-deps.cjs <repoRoot> [--alias-file <path>] [--kb <dir>]');
  return args;
}

function normalizeModule(name) {
  return String(name).trim().replace(/^:|:$/g, '').replace(/_/g, '-').toLowerCase();
}

// Resolve a rule's from/to cell to a concrete module: exact normalized match,
// or a unique module whose path ends with `/<name>` (bare-name tolerance).
function resolveModule(cell, moduleSet) {
  const normalized = normalizeModule(cell);
  if (moduleSet.has(normalized)) return normalized;
  const suffix = `/${normalized}`;
  const matches = [...moduleSet].filter((mod) => mod.endsWith(suffix));
  return matches.length === 1 ? matches[0] : null;
}

function parseDepTable(kbText) {
  const rows = [];
  for (const line of kbText.split('\n')) {
    if (!/^\|/.test(line)) continue;
    const cells = line.split('|').slice(1, -1).map((cell) => cell.trim());
    if (cells.length < 8) continue;
    if (!/^DEP-\d+$/.test(cells[0])) continue;
    rows.push({
      id: cells[0], from: cells[1], to: cells[2], direction: cells[3],
      grade: cells[4], refs: cells[5], exceptions: cells[6], status: cells[7],
    });
  }
  return rows;
}

function refPaths(refsCell) {
  const paths = [];
  for (const m of refsCell.matchAll(/`([^`]+)`/g)) {
    const value = m[1];
    if (!/[/\\]/.test(value) || value.includes(' ')) continue;
    // npm scoped package names look like paths but are not file paths
    if (/^@[^/]+\//.test(value)) continue;
    paths.push(value);
  }
  return paths;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const kbPath = path.join(args.repoRoot, args.kbDir, 'dependency-rules.md');
  if (!fs.existsSync(kbPath)) {
    process.stderr.write(`knowledge base not found: ${kbPath}\n`);
    process.exit(2);
  }
  const rows = parseDepTable(readText_(kbPath));

  const aliases = extractor.parseAliasTable(args.aliasFile);
  const facts = extractor.extractNpmWorkspaces(args.repoRoot)
    || extractor.extractGradle(args.repoRoot, aliases);
  if (!facts) {
    process.stderr.write('unsupported build layout; only source-ref liveness is checked\n');
    facts = { modules: [], edges: [] };
  }
  const moduleSet = new Set(facts.modules.map(normalizeModule));
  const edgeSet = new Set(facts.edges.map(([a, b]) => `${normalizeModule(a)}\u0000${normalizeModule(b)}`));

  const violations = [];
  const absentAllowed = [];
  const manualCheck = [];
  for (const row of rows) {
    const from = resolveModule(row.from, moduleSet);
    const to = resolveModule(row.to, moduleSet);
    if (!from || !to) {
      manualCheck.push({ id: row.id, reason: `from/to not a concrete module (${row.from} -> ${row.to})` });
      continue;
    }
    const edgeExists = edgeSet.has(`${from}\u0000${to}`);
    if (/禁止/.test(row.direction) && edgeExists) {
      violations.push({ id: row.id, from: row.from, to: row.to, note: 'forbidden edge currently present (rule violated or rule stale)' });
    }
    if (/允许/.test(row.direction) && !edgeExists) {
      absentAllowed.push({ id: row.id, from: row.from, to: row.to });
    }
  }

  const missingRefs = [];
  for (const row of rows) {
    for (const ref of refPaths(row.refs)) {
      if (!fs.existsSync(path.join(args.repoRoot, ref))) {
        missingRefs.push({ id: row.id, ref });
      }
    }
  }

  const findings = violations.length + missingRefs.length;
  const payload = {
    source: 'skills/spec-project-rules/scripts/verify-deps.cjs',
    kb_path: path.relative(args.repoRoot, kbPath),
    graph: { build_kind: facts.kind || 'unsupported', module_count: facts.modules.length, edge_count: facts.edges.length },
    dep_rows: rows.length,
    violations,
    missing_refs: missingRefs,
    manual_check: manualCheck,
    absent_allowed: absentAllowed,
    summary: findings === 0
      ? 'no deterministic findings; semantic staleness still needs LLM review'
      : `${violations.length} violation(s), ${missingRefs.length} missing ref(s)`,
  };
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  process.exit(findings > 0 ? 1 : 0);
}

function readText_(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

if (require.main === module) main();

module.exports = { parseDepTable, normalizeModule, refPaths };
