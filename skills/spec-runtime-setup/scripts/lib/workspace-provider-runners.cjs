'use strict';

// U2 — Real provider runners for the workspace graph build orchestrator.
//
// Bridges `buildWorkspaceGraphs`'s injected-runner contract to the actual
// codegraph / graphify CLIs. Command + env construction MIRRORS the verified
// single-repo provider invocations in providers/graphify.cjs (extract <src>
// --out <dest> --code-only with GRAPHIFY_OUT=.graphify; verify reads
// .graphify/graph.json) rather than inventing new CLI semantics.
//
// `exec` is injected so command/env/result mapping is unit-testable without
// real binaries. The real caller passes a spawnSync-backed exec.

const path = require('node:path');

const GRAPHIFY_OUT_ENV = '.graphify';
const SUBGRAPH_BASENAME = 'graph.json';

// exec(command, args, { cwd, env }) -> { status:number, stdout, stderr }
function makeWorkspaceRunners({ exec, codegraphCommand = 'codegraph', graphifyCommand = 'graphify', baseEnv = {} } = {}) {
  if (typeof exec !== 'function') throw new Error('makeWorkspaceRunners requires an exec function');

  function ok(result) {
    return result && result.status === 0;
  }

  return {
    codegraphInstallGlobal() {
      const result = exec(codegraphCommand, ['install', '--yes'], { env: baseEnv });
      return ok(result) ? { ok: true } : { ok: false, reason_code: 'codegraph-install-failed', stderr: result && result.stderr };
    },

    codegraphInit(repoRoot) {
      // `codegraph init [path]` builds the initial index in-place at repoRoot.
      const result = exec(codegraphCommand, ['init', repoRoot], { cwd: repoRoot, env: baseEnv });
      return ok(result) ? { ok: true } : { ok: false, reason_code: 'codegraph-init-failed', stderr: result && result.stderr };
    },

    graphifyExtract(repoRoot, outDir) {
      // Mirror the verified provider pattern: extract <src> --out <dest> --code-only,
      // with GRAPHIFY_OUT naming the artifact dir (.graphify) under <dest>.
      const env = { ...baseEnv, GRAPHIFY_OUT: GRAPHIFY_OUT_ENV };
      const result = exec(graphifyCommand, ['extract', repoRoot, '--out', outDir, '--code-only'], { cwd: repoRoot, env });
      if (!ok(result)) {
        return { ok: false, reason_code: 'graphify-extract-failed', stderr: result && result.stderr };
      }
      const graphPath = path.join(outDir, GRAPHIFY_OUT_ENV, SUBGRAPH_BASENAME);
      return { ok: true, graphPath };
    },

    graphifyMerge(inputGraphPaths, outPath) {
      const result = exec(graphifyCommand, ['merge-graphs', ...inputGraphPaths, '--out', outPath], { env: baseEnv });
      return ok(result) ? { ok: true, mergedPath: outPath } : { ok: false, reason_code: 'graphify-merge-failed', stderr: result && result.stderr };
    },
  };
}

module.exports = {
  makeWorkspaceRunners,
  GRAPHIFY_OUT_ENV,
  SUBGRAPH_BASENAME,
};
