'use strict';

const path = require('node:path');
const {
  makeWorkspaceRunners,
  GRAPHIFY_OUT_DIRNAME,
} = require('../../skills/spec-runtime-setup/scripts/lib/workspace-provider-runners.cjs');
const { defaultWorkspaceExec } = require('../../skills/spec-runtime-setup/scripts/lib/workspace-exec.cjs');

function recordingExec(behavior = () => ({ status: 0, stdout: '', stderr: '' })) {
  const calls = [];
  const exec = (command, args, opts) => {
    calls.push({ command, args, opts });
    return behavior(command, args, opts);
  };
  return { exec, calls };
}

describe('makeWorkspaceRunners — command/env construction mirrors verified provider pattern', () => {
  test('codegraphInit runs `codegraph init <repoRoot>` in the repo', () => {
    const { exec, calls } = recordingExec();
    const runners = makeWorkspaceRunners({ exec });
    const res = runners.codegraphInit('/ws/工程3');
    expect(res.ok).toBe(true);
    expect(calls[0].command).toBe('codegraph');
    expect(calls[0].args).toEqual(['init', '/ws/工程3']);
    expect(calls[0].opts.cwd).toBe('/ws/工程3');
  });

  test('codegraphInstallGlobal runs once with install', () => {
    const { exec, calls } = recordingExec();
    const runners = makeWorkspaceRunners({ exec });
    expect(runners.codegraphInstallGlobal().ok).toBe(true);
    expect(calls[0].args[0]).toBe('install');
  });

  test('graphifyExtract uses the provider-native graphify-out default without an environment override', () => {
    const { exec, calls } = recordingExec();
    const runners = makeWorkspaceRunners({ exec });
    const outDir = '/ws/graphify-out/工程3';
    const res = runners.graphifyExtract('/ws/工程3', outDir);
    expect(res.ok).toBe(true);
    expect(calls[0].command).toBe('graphify');
    expect(calls[0].args).toEqual(['extract', '/ws/工程3', '--out', outDir, '--code-only']);
    expect(calls[0].opts.env).not.toHaveProperty('GRAPHIFY_OUT');
    expect(calls[0].opts.unsetEnv).toContain('GRAPHIFY_OUT');
    expect(res.graphPath).toBe(path.join(outDir, GRAPHIFY_OUT_DIRNAME, 'graph.json'));
  });

  test('graphifyMerge passes all inputs plus --out', () => {
    const { exec, calls } = recordingExec();
    const runners = makeWorkspaceRunners({ exec });
    const res = runners.graphifyMerge(['/a/graph.json', '/b/graph.json'], '/ws/graphify-out/merged-graph.json');
    expect(res.ok).toBe(true);
    expect(calls[0].args).toEqual(['merge-graphs', '/a/graph.json', '/b/graph.json', '--out', '/ws/graphify-out/merged-graph.json']);
    expect(calls[0].opts.unsetEnv).toContain('GRAPHIFY_OUT');
  });

  test('non-zero exit maps to a stable reason_code, not a throw', () => {
    const { exec } = recordingExec(() => ({ status: 1, stdout: '', stderr: 'boom' }));
    const runners = makeWorkspaceRunners({ exec });
    expect(runners.codegraphInit('/ws/x')).toEqual(expect.objectContaining({ ok: false, reason_code: 'codegraph-init-failed' }));
    expect(runners.graphifyExtract('/ws/x', '/ws/graphify-out/x')).toEqual(expect.objectContaining({ ok: false, reason_code: 'graphify-extract-failed' }));
    expect(runners.graphifyMerge(['/a'], '/o')).toEqual(expect.objectContaining({ ok: false, reason_code: 'graphify-merge-failed' }));
  });

  test('requires an exec function', () => {
    expect(() => makeWorkspaceRunners({})).toThrow(/exec/);
  });

  test('default exec can remove an inherited provider override without dropping the rest of the environment', () => {
    const previous = process.env.GRAPHIFY_OUT;
    process.env.GRAPHIFY_OUT = '.graphify';
    try {
      const result = defaultWorkspaceExec(
        process.execPath,
        ['-e', 'process.stdout.write(JSON.stringify({out:process.env.GRAPHIFY_OUT||null,path:!!process.env.PATH}))'],
        { unsetEnv: ['GRAPHIFY_OUT'] },
      );

      expect(result.status).toBe(0);
      expect(JSON.parse(result.stdout)).toEqual({ out: null, path: true });
    } finally {
      if (previous === undefined) delete process.env.GRAPHIFY_OUT;
      else process.env.GRAPHIFY_OUT = previous;
    }
  });
});

describe('makeWorkspaceRunners — integrates with buildWorkspaceGraphs', () => {
  test('runners drive the orchestrator to a complete build (fake exec + real temp repos)', () => {
    const fs = require('node:fs');
    const os = require('node:os');
    const { spawnSync } = require('node:child_process');
    const { buildWorkspaceGraphs } = require('../../skills/spec-runtime-setup/scripts/lib/workspace-graph-build.cjs');

    const ws = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-runner-int-')));
    const repos = ['api', 'web'].map((rel) => {
      const repo = path.join(ws, rel);
      fs.mkdirSync(repo, { recursive: true });
      spawnSync('git', ['-C', repo, 'init', '-q']);
      return { repo_id: rel, git_root: repo };
    });

    // Fake exec that materializes the graph files graphify/merge would produce.
    const exec = (command, args) => {
      if (command === 'graphify' && args[0] === 'extract') {
        const outDir = args[args.indexOf('--out') + 1];
        const graphPath = path.join(outDir, GRAPHIFY_OUT_DIRNAME, 'graph.json');
        fs.mkdirSync(path.dirname(graphPath), { recursive: true });
        fs.writeFileSync(graphPath, '{}');
      } else if (command === 'graphify' && args[0] === 'merge-graphs') {
        const outPath = args[args.indexOf('--out') + 1];
        fs.writeFileSync(outPath, '{}');
      } else if (command === 'codegraph' && args[0] === 'init') {
        fs.mkdirSync(path.join(args[1], '.codegraph'), { recursive: true });
        fs.writeFileSync(path.join(args[1], '.codegraph', 'db'), 'x');
      }
      return { status: 0, stdout: '', stderr: '' };
    };

    const runners = makeWorkspaceRunners({ exec });
    const result = buildWorkspaceGraphs({ workspaceRoot: ws, repos, runners });
    expect(result.status).toBe('complete');
    expect(result.merge.status).toBe('merged');
    expect(fs.existsSync(result.merge.merged_graph_path)).toBe(true);
    // git clean for both children (managed exclude applied).
    for (const repo of repos) {
      const st = spawnSync('git', ['-C', repo.git_root, 'status', '--porcelain'], { encoding: 'utf8' }).stdout;
      expect(st.trim()).toBe('');
    }
  });
});
