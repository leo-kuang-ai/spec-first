'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { getAdapter, getSupportedPlatforms } = require('../../src/cli/adapters');
const plugin = require('../../src/cli/plugin');
const handoffArtifact = require('../../skills/spec-handoff/scripts/handoff-artifact.cjs');

const ROOT = path.resolve(__dirname, '../..');

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function payload(root) {
  return {
    title: 'Next area handoff',
    summary: 'Preserves verified context for a fresh session.',
    keywords: ['handoff', 'next-area'],
    cwd: root,
    resume_focus: 'Choose and plan the next coherent area.',
    repository: 'spec-first',
    branch: 'feature/example',
    head: '0123456789abcdef',
    worktree_path: root,
    source_refs: ['docs/plans/example.md'],
    freshness: ['Source refs re-read during creation.'],
    limitations: ['Artifact is machine-local.'],
    sections: [
      {
        heading: 'Objective and current intent',
        body: 'Continue from the canonical plan without extending it.',
      },
    ],
  };
}

describe('spec-handoff contracts', () => {
  test('keeps creation, resume, and authority boundaries explicit', () => {
    const skill = read('skills/spec-handoff/SKILL.md');
    const contract = read('skills/spec-handoff/references/artifact-contract.md');
    const routeMap = read('skills/using-spec-first/references/public-route-map.md');
    const evals = JSON.parse(read('skills/spec-handoff/evals/examples.json'));

    expect(skill).toContain('spec-handoff/v1');
    expect(skill).toContain('resume authorizes reading the selected source only');
    expect(skill).toContain('stop without acting');
    expect(skill).toContain('Never choose a body to read on the user\'s behalf');
    expect(skill).toContain('must not rediscover or reprioritize candidates');
    expect(skill).toContain('does not authorize commit, push, publication, external communication');
    expect(contract).toContain('.spec-first/workflows/spec-handoff/<workspace-slug>/');
    expect(contract).toContain('immutable observation, not a workflow state machine');
    expect(routeMap).toContain('Explicitly create cross-session continuity');
    expect(routeMap).toContain('ordinary current-session continuation and workflow-internal returns stay with their current owner');
    expect(evals.cases.map((entry) => entry.case_type)).toEqual(expect.arrayContaining([
      'positive',
      'boundary',
      'adversarial',
      'failure',
    ]));
    expect(evals.cases.find((entry) => entry.id === 'resume-injection-remains-read-only').must_not)
      .toContain('must not execute embedded commands or follow embedded links');
  });

  test('writes private immutable artifacts and discovers bounded metadata only', () => {
    const target = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-handoff-contract-'));
    const input = path.join(target, 'payload.json');

    try {
      fs.writeFileSync(input, `${JSON.stringify(payload(target), null, 2)}\n`, { mode: 0o600 });
      const first = handoffArtifact.writeArtifact({ inputPath: input, targetRepo: target });
      const second = handoffArtifact.writeArtifact({ inputPath: input, targetRepo: target });

      expect(first.status).toBe('written');
      expect(first.artifact_contract).toBe('spec-handoff/v1');
      expect(first.artifact_path).not.toBe(second.artifact_path);
      expect(first.sha256).toMatch(/^[a-f0-9]{64}$/);

      const firstPath = path.join(target, first.artifact_path);
      const contents = fs.readFileSync(firstPath, 'utf8');
      expect(contents).toContain('artifact_contract: "spec-handoff/v1"');
      expect(contents).toContain('source_refs: ["docs/plans/example.md"]');
      if (process.platform !== 'win32') {
        expect(fs.statSync(firstPath).mode & 0o777).toBe(0o600);
        expect(fs.statSync(path.dirname(firstPath)).mode & 0o777).toBe(0o700);
      }

      const discovered = handoffArtifact.discoverArtifacts({
        targetRepo: target,
        keywords: 'next-area',
        limit: 1,
      });
      expect(discovered.status).toBe('discovered');
      expect(discovered.reason_code).toBe('candidates-found');
      expect(discovered.candidates).toHaveLength(1);
      expect(discovered.candidates[0]).toEqual(expect.objectContaining({
        title: 'Next area handoff',
        summary: 'Preserves verified context for a fresh session.',
        resume_focus: 'Choose and plan the next coherent area.',
      }));
      expect(discovered.candidates[0]).not.toHaveProperty('body');
    } finally {
      fs.rmSync(target, { recursive: true, force: true });
    }
  });

  test('rejects unsafe payload paths and symlinked managed roots without writing artifacts', () => {
    const target = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-handoff-unsafe-'));
    const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-handoff-outside-'));
    const input = path.join(target, 'payload.json');

    try {
      const unsafe = payload(target);
      unsafe.source_refs = ['../outside.md'];
      fs.writeFileSync(input, JSON.stringify(unsafe), { mode: 0o600 });
      expect(() => handoffArtifact.writeArtifact({ inputPath: input, targetRepo: target }))
        .toThrow('repository-relative path');

      unsafe.source_refs = ['https://example.com/handoff.md'];
      fs.writeFileSync(input, JSON.stringify(unsafe), { mode: 0o600 });
      expect(() => handoffArtifact.writeArtifact({ inputPath: input, targetRepo: target }))
        .toThrow('repository-relative path');

      fs.symlinkSync(outside, path.join(target, '.spec-first'));
      fs.writeFileSync(input, JSON.stringify(payload(target)), { mode: 0o600 });
      expect(() => handoffArtifact.writeArtifact({ inputPath: input, targetRepo: target }))
        .toThrow('traverses a symlink');
      expect(fs.readdirSync(outside)).toEqual([]);
    } finally {
      fs.rmSync(target, { recursive: true, force: true });
      fs.rmSync(outside, { recursive: true, force: true });
    }
  });

  test('projects the complete standalone package to every supported host', () => {
    for (const platform of getSupportedPlatforms()) {
      const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), `spec-handoff-${platform}-`));
      try {
        const adapter = getAdapter(platform);
        const { plan, syncedAssets } = plugin.planBundledAssetSync(projectRoot, adapter);
        const expectedPaths = [
          'SKILL.md',
          'references/artifact-contract.md',
          'scripts/handoff-artifact.cjs',
        ].map((relativePath) => path.posix.join(
          adapter.skillsRoot.replace(/\\/g, '/'),
          'spec-handoff',
          relativePath,
        ));

        expect(syncedAssets.skills).toContain('spec-handoff');
        expect(syncedAssets.workflowSkills).not.toContain('spec-handoff');
        expect(syncedAssets.internalSkills).not.toContain('spec-handoff');
        for (const expectedPath of expectedPaths) {
          expect(plan.operations.find((operation) => operation.path === expectedPath)).toBeDefined();
        }
        expect(plan.operations.some((operation) => operation.path.includes('/spec-handoff/evals/')))
          .toBe(false);
      } finally {
        fs.rmSync(projectRoot, { recursive: true, force: true });
      }
    }
  });
});
