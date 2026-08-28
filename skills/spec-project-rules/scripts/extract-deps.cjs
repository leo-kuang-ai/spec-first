#!/usr/bin/env node
'use strict';
/*
 * Deterministic dependency-facts extractor for spec-project-rules bootstrap/verify.
 *
 * Scope (facts only — semantic classification like infra/biz stays with the LLM
 * per references/mining-method.md):
 *   - npm/yarn/pnpm workspaces: root package.json `workspaces` globs,
 *     per-package dependencies resolved against workspace package names.
 *   - Gradle multi-module: settings.gradle includes + per-module `project(':x')`
 *     declarations; optional Kotlin const alias tables (`--alias-file`) resolve
 *     `Deps.X.Name` tokens to `group:artifact` coordinates (artifact kept).
 *
 * Usage:
 *   node extract-deps.cjs <repoRoot> [--alias-file <path>] [--pretty]
 * Exit codes: 0 facts extracted; 2 unsupported build layout (fall back to
 * bounded reads per mining-method); 1 usage/IO error.
 */

const fs = require('node:fs');
const path = require('node:path');

function parseArgs(argv) {
  const args = { repoRoot: null, aliasFile: null, pretty: false };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--alias-file') {
      const value = argv[i + 1];
      if (!value) throw new Error('--alias-file requires a path');
      args.aliasFile = path.resolve(value);
      i += 1;
    } else if (token === '--pretty') {
      args.pretty = true;
    } else if (!args.repoRoot) {
      args.repoRoot = path.resolve(token);
    } else {
      throw new Error(`Unknown argument: ${token}`);
    }
  }
  if (!args.repoRoot) throw new Error('Usage: extract-deps.cjs <repoRoot> [--alias-file <path>] [--pretty]');
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
  const text = readText(aliasFilePath);
  const pattern = /const\s+val\s+([A-Za-z0-9_]+)\s*=\s*["']([^"']+)["']/g;
  let match = pattern.exec(text);
  while (match) {
    aliases.set(match[1], match[2]);
    match = pattern.exec(text);
  }
  return aliases;
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

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!fs.existsSync(args.repoRoot)) throw new Error(`repo root not found: ${args.repoRoot}`);
  const aliases = parseAliasTable(args.aliasFile);

  const npm = extractNpmWorkspaces(args.repoRoot);
  const gradle = npm ? null : extractGradle(args.repoRoot, aliases);
  const result = npm || gradle;
  if (!result) {
    process.stderr.write('unsupported build layout: no npm workspaces and no gradle settings; '
      + 'fall back to bounded reads per mining-method\n');
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
    note: 'facts only; infra/biz classification and rule synthesis belong to the LLM',
  };
  process.stdout.write(`${JSON.stringify(payload, null, args.pretty ? 2 : 0)}\n`);
}

if (require.main === module) main();

module.exports = { extractNpmWorkspaces, extractGradle, parseAliasTable, artifactOf, globToRegExp };
