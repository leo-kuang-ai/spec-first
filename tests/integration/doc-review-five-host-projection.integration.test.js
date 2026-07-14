'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const { getAdapter, getSupportedPlatforms } = require('../../src/cli/adapters');

const repoRoot = path.resolve(__dirname, '..', '..');
const cliPath = path.join(repoRoot, 'bin', 'spec-first.js');
const sandboxRoots = new Set();

afterEach(() => {
  for (const root of sandboxRoots) {
    fs.rmSync(root, { recursive: true, force: true });
  }
  sandboxRoots.clear();
});

function tempSandbox(platform) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), `spec-first-${platform}-doc-review-`));
  sandboxRoots.add(root);
  const projectRoot = path.join(root, 'project');
  const home = path.join(root, 'home');
  fs.mkdirSync(projectRoot, { recursive: true });
  fs.mkdirSync(home, { recursive: true });
  return { projectRoot, home };
}

function runSpecFirst(args, sandbox) {
  return spawnSync(process.execPath, [cliPath, ...args], {
    cwd: sandbox.projectRoot,
    env: { ...process.env, HOME: sandbox.home },
    encoding: 'utf8',
    timeout: 120000,
  });
}

// New lazy references created by U1-U3 that must exist in every host's runtime
const expectedRefs = [
  'subagent-confidence-rubric-detail.md',
  'subagent-why-it-matters-guide.md',
  'subagent-suggested-fix-advanced.md',
  'synthesis-premise-collapse.md',
  'synthesis-contradictions.md',
  'synthesis-chain-linking.md',
  'synthesis-restatement-suppression.md',
  'synthesis-multi-round.md',
  'document-classification-signals.md',
  'persona-activation-matrix.md',
];

const pointerPlatforms = getSupportedPlatforms().filter((platform) =>
  Boolean(getAdapter(platform).pointerPath)
);

describe('doc-review five-host reference projection', () => {
  test.each(getSupportedPlatforms())(
    '%s init projects all doc-review lazy references to runtime',
    (platform) => {
      const sandbox = tempSandbox(platform);
      const adapter = getAdapter(platform);

      // Run spec-first init for this platform
      const initResult = runSpecFirst(['init', `--${platform}`], sandbox);

      // Init must succeed
      expect(initResult.status).toBe(0);

      // Determine the doc-review references directory in the runtime
      // Skill mirror paths (e.g., .claude/skills/spec-doc-review/references/)
      const pointerPath = adapter.pointerPath;
      const projectRoot = sandbox.projectRoot;

      // Collect all runtime paths where references could land
      const candidateRefDirs = [];

      // Workflow references path
      const workflowRefsDir = path.join(projectRoot, pointerPath, 'spec-first', 'workflows', 'spec-doc-review', 'references');
      if (fs.existsSync(workflowRefsDir)) {
        candidateRefDirs.push(workflowRefsDir);
      }

      // Skill mirror path (for platforms that mirror skills)
      const skillMirrorRefsDir = path.join(projectRoot, pointerPath, 'skills', 'spec-doc-review', 'references');
      if (fs.existsSync(skillMirrorRefsDir)) {
        candidateRefDirs.push(skillMirrorRefsDir);
      }

      // Also check .agents/skills/ path for platforms that use it
      const agentsSkillRefsDir = path.join(projectRoot, '.agents', 'skills', 'spec-doc-review', 'references');
      if (fs.existsSync(agentsSkillRefsDir)) {
        candidateRefDirs.push(agentsSkillRefsDir);
      }

      // At least one reference directory must exist
      expect(candidateRefDirs.length).toBeGreaterThan(0);

      // Every expected reference must exist in at least one of the candidate dirs
      for (const ref of expectedRefs) {
        const found = candidateRefDirs.some((dir) => fs.existsSync(path.join(dir, ref)));
        if (!found) {
          // List what we did find to help debugging
          const foundRefs = candidateRefDirs.flatMap((dir) => {
            try { return fs.readdirSync(dir); } catch { return []; }
          });
          throw new Error(
            `[${platform}] Reference file "${ref}" not found in any candidate directory.\n` +
            `Candidate dirs: ${JSON.stringify(candidateRefDirs)}\n` +
            `Found in first dir: ${JSON.stringify(foundRefs)}`
          );
        }
      }
    },
    120000
  );
});
