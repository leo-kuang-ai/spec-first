'use strict';

// U2 — Real provider runners for the workspace graph build orchestrator.
//
// Bridges `buildWorkspaceGraphs`'s injected-runner contract to the actual
// codegraph / graphify CLIs. Command + env construction MIRRORS the verified
// single-repo provider invocations in providers/graphify.cjs (extract <src>
// --out <dest> --code-only; Graphify writes its native
// graphify-out/graph.json below <dest> without an environment override.
//
// `exec` is injected so command/env/result mapping is unit-testable without
// real binaries. The real caller passes a spawnSync-backed exec.

const path = require('node:path');

const GRAPHIFY_OUT_DIRNAME = 'graphify-out';
const SUBGRAPH_BASENAME = 'graph.json';
const GRAPHIFY_UNSET_ENV = ['GRAPHIFY_OUT'];

// exec(command, args, { cwd, env, unsetEnv }) -> { status:number, stdout, stderr }
function makeWorkspaceRunners({
  exec,
  codegraphCommand = 'codegraph',
  graphifyCommand = 'graphify',
  baseEnv = {},
  unsetEnv = [],
} = {}) {
  if (typeof exec !== 'function') throw new Error('makeWorkspaceRunners requires an exec function');

  function ok(result) {
    return result && result.status === 0;
  }

  return {
    codegraphInstallGlobal() {
      const result = exec(codegraphCommand, ['install', '--yes'], { env: baseEnv, unsetEnv });
      return ok(result) ? { ok: true } : { ok: false, reason_code: 'codegraph-install-failed', stderr: result && result.stderr };
    },

    codegraphInit(repoRoot) {
      // `codegraph init [path]` builds the initial index in-place at repoRoot.
      const result = exec(codegraphCommand, ['init', repoRoot], { cwd: repoRoot, env: baseEnv, unsetEnv });
      return ok(result) ? { ok: true } : { ok: false, reason_code: 'codegraph-init-failed', stderr: result && result.stderr };
    },

    codegraphSync(repoRoot) {
      const result = exec(codegraphCommand, ['sync', repoRoot], {
        cwd: repoRoot,
        env: baseEnv,
        unsetEnv,
      });
      return ok(result)
        ? { ok: true }
        : { ok: false, reason_code: 'codegraph-sync-failed', stderr: result && result.stderr };
    },

    graphifyExtract(repoRoot, outDir) {
      const result = exec(graphifyCommand, ['extract', repoRoot, '--out', outDir, '--code-only'], {
        cwd: repoRoot,
        env: baseEnv,
        unsetEnv: [...new Set([...unsetEnv, ...GRAPHIFY_UNSET_ENV])],
      });
      if (!ok(result)) {
        return { ok: false, reason_code: 'graphify-extract-failed', stderr: result && result.stderr };
      }
      const graphPath = path.join(outDir, GRAPHIFY_OUT_DIRNAME, SUBGRAPH_BASENAME);
      return { ok: true, graphPath };
    },

    graphifyMerge(inputGraphPaths, outPath) {
      const result = exec(graphifyCommand, ['merge-graphs', ...inputGraphPaths, '--out', outPath], {
        env: baseEnv,
        unsetEnv: [...new Set([...unsetEnv, ...GRAPHIFY_UNSET_ENV])],
      });
      return ok(result) ? { ok: true, mergedPath: outPath } : { ok: false, reason_code: 'graphify-merge-failed', stderr: result && result.stderr };
    },
  };
}

module.exports = {
  makeWorkspaceRunners,
  GRAPHIFY_OUT_DIRNAME,
  SUBGRAPH_BASENAME,
};
