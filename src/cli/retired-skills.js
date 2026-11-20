'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const known = require('./contracts/retired-skill-projections.json');

const retiredSkills = new Set(['spec-app-consistency-audit', 'spec-project-rules', 'spec-rule-miner']);

function projectionDigest(target) {
  const stat = fs.lstatSync(target);
  const hash = createHash('sha256');
  if (stat.isFile()) return hash.update('file\0').update(fs.readFileSync(target)).digest('hex');
  if (!stat.isDirectory()) return null;
  hash.update('dir\0');
  for (const name of fs.readdirSync(target).sort()) {
    const digest = projectionDigest(path.join(target, name));
    if (!digest) return null;
    hash.update(JSON.stringify([name, digest]));
  }
  return hash.digest('hex');
}

function isRetiredAsset(name) {
  return retiredSkills.has(name) || ['spec-app-consistency-audit.md', 'app-consistency-audit.md'].includes(name);
}

function matchesRetiredProjection(root, relative) {
  const expected = known.paths[relative];
  if (!expected) return false;
  let target = root;
  for (const segment of relative.split('/')) {
    target = path.join(target, segment);
    const stat = fs.lstatSync(target, { throwIfNoEntry: false });
    if (!stat || stat.isSymbolicLink()) return false;
  }
  return expected.includes(projectionDigest(target));
}

function findPreservedRetiredAssets(root, adapter, plan) {
  const removed = new Set(plan.operations.filter(operation => operation.verifyRetiredProjection).map(operation => operation.path));
  return Object.keys(known.paths).filter(relative =>
    (relative.startsWith(`.${adapter.id}/`) || path.posix.dirname(relative) === adapter.skillsRoot)
    && !removed.has(relative)
    && fs.lstatSync(path.join(root, relative), { throwIfNoEntry: false }));
}

module.exports = { findPreservedRetiredAssets, isRetiredAsset, matchesRetiredProjection, projectionDigest, retiredSkills };
