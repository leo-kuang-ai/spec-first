'use strict';

const fs = require('node:fs');
const path = require('node:path');

function assertManagedRunCliContainment(options = {}) {
  const prefix = options.reasonPrefix || 'managed_run';
  const realRepo = fs.realpathSync(options.repoRoot);
  const managedRoot = path.join(realRepo, '.spec-first', 'app-audit', 'runs');
  if (!fs.existsSync(managedRoot) || !fs.existsSync(options.runDir) || fs.lstatSync(options.runDir).isSymbolicLink()) {
    throw new Error(`${prefix}_run_boundary_invalid: managed run directory must exist and not be a symlink.`);
  }
  const realManaged = fs.realpathSync(managedRoot);
  const realRun = fs.realpathSync(options.runDir);
  if (!isInside(realRepo, realManaged) || realManaged === realRepo || !isInside(realManaged, realRun) || realRun === realManaged) {
    throw new Error(`${prefix}_run_boundary_escape: run directory resolves outside the managed root.`);
  }
  const inputRootPath = path.join(realRun, 'input');
  if (!fs.existsSync(inputRootPath) || fs.lstatSync(inputRootPath).isSymbolicLink()) {
    throw new Error(`${prefix}_input_root_invalid: run input directory must exist and not be a symlink.`);
  }
  const inputRoot = fs.realpathSync(inputRootPath);
  if (!isInside(realRun, inputRoot) || inputRoot === realRun) throw new Error(`${prefix}_input_root_escape: input directory resolves outside the run.`);

  for (const inputPath of options.ephemeralInputs || []) {
    if (!inputPath) continue;
    const realInput = fs.realpathSync(inputPath);
    if (!isInside(inputRoot, realInput) || realInput === inputRoot) {
      throw new Error(`${prefix}_input_outside_ephemeral_boundary: raw input must be staged under run-dir/input.`);
    }
  }
  for (const artifactPath of options.runArtifacts || []) {
    if (!artifactPath) continue;
    const realArtifact = fs.realpathSync(artifactPath);
    if (!isInside(realRun, realArtifact) || isInside(inputRoot, realArtifact)) {
      throw new Error(`${prefix}_artifact_outside_run_boundary: normalized input artifacts must be run-local and outside input/.`);
    }
  }
  if (fs.existsSync(options.outputPath) && fs.lstatSync(options.outputPath).isSymbolicLink()) {
    throw new Error(`${prefix}_output_symlink_rejected: output must not be a symlink.`);
  }
  const outputParent = realParent(options.outputPath);
  if (!isInside(realRun, outputParent) || isInside(inputRoot, outputParent)) {
    throw new Error(`${prefix}_output_outside_run_boundary: output must be run-local and outside input/.`);
  }
  return { realRun, inputRoot };
}

function isInside(parent, child) {
  const relative = path.relative(parent, child);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function realParent(filePath) {
  let current = path.resolve(filePath);
  while (!fs.existsSync(current)) current = path.dirname(current);
  return fs.realpathSync(fs.statSync(current).isDirectory() ? current : path.dirname(current));
}

module.exports = { assertManagedRunCliContainment };
