#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { hasSymlinkSegment, sha256File, validatePilotEvidence } = require('./validate-pilot-evidence.cjs');

function safeRelative(value) {
  return typeof value === 'string' && value && !path.isAbsolute(value)
    && !value.replace(/\\/g, '/').split('/').some((part) => part === '..' || part === '');
}

function hydrateRef(bundleRoot, value) {
  const relative = typeof value === 'string' ? value : value.path;
  if (!safeRelative(relative)) throw new Error(`pilot_ref_unsafe: ${relative || '<empty>'}`);
  const absolute = path.resolve(bundleRoot, relative);
  const rootRelative = path.relative(bundleRoot, absolute);
  if (rootRelative.startsWith('..') || path.isAbsolute(rootRelative)) throw new Error(`pilot_ref_escape: ${relative}`);
  if (hasSymlinkSegment(bundleRoot, relative)) throw new Error(`pilot_ref_symlink_rejected: ${relative}`);
  const stat = fs.lstatSync(absolute);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`pilot_ref_not_regular: ${relative}`);
  const realRelative = path.relative(fs.realpathSync(bundleRoot), fs.realpathSync(absolute));
  if (realRelative.startsWith('..') || path.isAbsolute(realRelative)) throw new Error(`pilot_ref_realpath_escape: ${relative}`);
  return { path: relative.replace(/\\/g, '/'), sha256: sha256File(absolute) };
}

function assemblePilotManifest(spec, bundleRoot) {
  const manifest = JSON.parse(JSON.stringify(spec));
  manifest.inputs.case_set = hydrateRef(bundleRoot, manifest.inputs.case_set);
  manifest.inputs.rubric = hydrateRef(bundleRoot, manifest.inputs.rubric);
  for (const sample of manifest.samples || []) {
    for (const arm of Object.values(sample.arms || {})) {
      arm.output = hydrateRef(bundleRoot, arm.output);
      arm.metrics.artifact_bytes = fs.statSync(path.resolve(bundleRoot, arm.output.path)).size;
    }
  }
  manifest.blind_review.reviewers = (manifest.blind_review.reviewers || []).map((reviewer) => ({
    ...reviewer,
    receipt: hydrateRef(bundleRoot, reviewer.receipt),
  }));
  if (manifest.independent_developer_adoption && manifest.independent_developer_adoption.receipt) {
    manifest.independent_developer_adoption.receipt = hydrateRef(bundleRoot, manifest.independent_developer_adoption.receipt);
  }
  return manifest;
}

function main(argv) {
  const bundleIndex = argv.indexOf('--bundle');
  const specIndex = argv.indexOf('--spec');
  if (bundleIndex < 0 || specIndex < 0) throw new Error('usage: run-pilot.cjs --bundle <dir> --spec <pilot-spec.json>');
  const bundleRoot = path.resolve(argv[bundleIndex + 1]);
  const specPath = path.resolve(argv[specIndex + 1]);
  const manifest = assemblePilotManifest(JSON.parse(fs.readFileSync(specPath, 'utf8')), bundleRoot);
  const result = validatePilotEvidence(manifest, bundleRoot);
  fs.writeFileSync(path.join(bundleRoot, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  fs.writeFileSync(path.join(bundleRoot, 'validation-result.json'), `${JSON.stringify(result, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (!result.valid) process.exitCode = 1;
}

if (require.main === module) {
  try { main(process.argv.slice(2)); } catch (error) { process.stderr.write(`${error.message}\n`); process.exitCode = 1; }
}

module.exports = { assemblePilotManifest, hydrateRef };
