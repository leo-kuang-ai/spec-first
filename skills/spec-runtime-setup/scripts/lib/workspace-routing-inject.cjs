'use strict';

// U5 — Inject the cwd-aware routing block into the workspace's host entry docs.
//
// The routing guidance (A2/CR10) belongs in the instruction file the agent
// reads when launched from the requirement workspace root — CLAUDE.md for
// Claude, AGENTS.md for Codex/Cursor/Kiro/Qoder (the shared agent instruction
// file). This upserts the managed routing block (idempotent, self-only) into
// those files in the workspace root, containment-checked. Creating the file when
// absent is allowed (the workspace root is a non-Git parent the workspace owns).

const fs = require('node:fs');
const path = require('node:path');
const { assertContainedPath } = require('./path-safety.cjs');
const { CANONICAL_HOSTS } = require('./host-authority.cjs');
const {
  renderRoutingInstruction,
  upsertRoutingBlock,
  stripRoutingBlock,
} = require('./workspace-routing-instruction.cjs');

// Host → workspace-root entry file. Claude reads CLAUDE.md; the others read the
// shared AGENTS.md. Both are written when hosts span the two families.
const HOST_ENTRY_FILE = Object.freeze({
  claude: 'CLAUDE.md',
  codex: 'AGENTS.md',
  cursor: 'AGENTS.md',
  kiro: 'AGENTS.md',
  opencode: 'AGENTS.md',
  qoder: 'AGENTS.md',
});

function entryFilesForHosts(hosts) {
  return entryTargetsForHosts(hosts).map((entry) => entry.entry_file);
}

function entryTargetsForHosts(hosts) {
  const targets = new Map();
  for (const host of hosts) {
    const normalizedHost = String(host).toLowerCase();
    const file = HOST_ENTRY_FILE[normalizedHost];
    if (!file) continue;
    if (!targets.has(file)) targets.set(file, []);
    targets.get(file).push(normalizedHost);
  }
  return [...targets.entries()].map(([entryFile, entryHosts]) => ({
    entry_file: entryFile,
    hosts: [...new Set(entryHosts)],
  }));
}

function injectRoutingInstruction({
  workspaceRoot,
  repos = [],
  hosts = [...CANONICAL_HOSTS],
  createIfAbsent = true,
} = {}) {
  const targets = entryTargetsForHosts(hosts);
  const results = [];

  for (const target of targets) {
    const relFile = target.entry_file;
    const block = renderRoutingInstruction({ workspaceRoot, repos, hosts: target.hosts });
    const abs = path.join(workspaceRoot, relFile);
    const entry = { entry_file: relFile, hosts: target.hosts, status: 'skipped', reason_code: '' };
    try {
      assertContainedPath(workspaceRoot, abs, { reasonCode: 'routing-entry-escapes-workspace' });
    } catch (error) {
      entry.status = 'failed';
      entry.reason_code = error.reason_code || 'routing-entry-escapes-workspace';
      results.push(entry);
      continue;
    }
    try {
      const exists = fs.existsSync(abs);
      if (!exists && !createIfAbsent) {
        entry.status = 'skipped';
        entry.reason_code = 'entry-file-absent';
        results.push(entry);
        continue;
      }
      const existing = exists ? fs.readFileSync(abs, 'utf8') : '';
      const next = upsertRoutingBlock(existing, block);
      if (next !== existing) {
        fs.writeFileSync(abs, next, 'utf8');
        entry.status = exists ? 'updated' : 'created';
      } else {
        entry.status = 'unchanged';
      }
    } catch (error) {
      entry.status = 'failed';
      entry.reason_code = error.reason_code || 'routing-entry-update-failed';
    }
    results.push(entry);
  }

  return {
    schema_version: 'workspace-routing-inject.v1',
    workspace_root: workspaceRoot,
    hosts,
    entries: results,
  };
}

// U6 clean counterpart: strip the managed routing block from workspace host entry
// docs. Idempotent and self-only — user content outside the managed markers is kept.
// Does not delete the entry file even if it becomes empty (the workspace may own it).
function stripRoutingInstruction({
  workspaceRoot,
  hosts = [...CANONICAL_HOSTS],
} = {}) {
  const targets = entryFilesForHosts(hosts);
  const results = [];

  for (const relFile of targets) {
    const abs = path.join(workspaceRoot, relFile);
    const entry = { entry_file: relFile, status: 'skipped', reason_code: '' };
    try {
      assertContainedPath(workspaceRoot, abs, { reasonCode: 'routing-entry-escapes-workspace' });
    } catch (error) {
      entry.status = 'failed';
      entry.reason_code = error.reason_code || 'routing-entry-escapes-workspace';
      results.push(entry);
      continue;
    }
    if (!fs.existsSync(abs)) {
      entry.status = 'absent';
      results.push(entry);
      continue;
    }
    try {
      const existing = fs.readFileSync(abs, 'utf8');
      const next = stripRoutingBlock(existing);
      if (next !== existing) {
        fs.writeFileSync(abs, next, 'utf8');
        entry.status = 'stripped';
      } else {
        entry.status = 'unchanged';
      }
    } catch (error) {
      entry.status = 'failed';
      entry.reason_code = error.reason_code || 'routing-entry-strip-failed';
    }
    results.push(entry);
  }

  return {
    schema_version: 'workspace-routing-strip.v1',
    workspace_root: workspaceRoot,
    hosts,
    entries: results,
  };
}

module.exports = {
  injectRoutingInstruction,
  stripRoutingInstruction,
  entryFilesForHosts,
  entryTargetsForHosts,
  HOST_ENTRY_FILE,
};
