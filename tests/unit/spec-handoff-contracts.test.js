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
  test('distinguishes orientation from explicitly authorized continuation', () => {
    const skill = read('skills/spec-handoff/SKILL.md');
    const evals = JSON.parse(read('skills/spec-handoff/evals/examples.json'));
    expect(skill).toContain('current user explicitly requests completion of the selected task');
    expect(skill).toContain('source-plan-non-active');
    expect(skill).toContain('verify the target repo, current HEAD/dirty state, task scope, source refs, and existing completion evidence');
    expect(skill).not.toContain('Then **stop without acting** until the user chooses.');
    expect(evals.cases.some((entry) => entry.id === 'explicit-resume-and-continue')).toBe(true);
    expect(evals.cases.some((entry) => entry.id === 'continue-does-not-reopen-stale-plan')).toBe(true);
    expect(skill).toContain('During read-only resume, report these issues and recommendations without invoking revision or execution owners');
    expect(skill).toContain('Report an unreachable explicit source; never turn that path into a keyword search');
    expect(evals.cases.find((entry) => entry.id === 'continue-unreachable-source').must_not)
      .toContain('不得调用 discovery，也不得把指定路径转换为关键词搜索');
    expect(evals.cases.find((entry) => entry.id === 'continue-stale-completion-and-dirty-tree').must_not)
      .toContain('不能继承旧测试通过结论');
    expect(evals.cases.find((entry) => entry.id === 'readonly-completed-plan').must_not)
      .toContain('不能调用 spec-plan 修改状态');
  });
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

  test('discovery stops reading at metadata boundaries and retains unindexed candidates', () => {
    const target = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-handoff-metadata-'));
    const input = path.join(target, 'payload.json');
    try {
      fs.writeFileSync(input, JSON.stringify(payload(target)));
      const written = handoffArtifact.writeArtifact({ inputPath: input, targetRepo: target });
      const directory = path.dirname(path.join(target, written.artifact_path));
      fs.rmSync(path.join(target, written.artifact_path));
      const prefixes = {
        'plain.md': '# Plain handoff\n',
        'indexed.md': '---\ntitle: "Indexed"\n---\n',
        'crlf.md': '---\r\ntitle: "CRLF"\r\n---\r\n',
        'yaml.md': '---\ntitle: Bare YAML\n---\n',
        'long.md': `---\n${'title: "Long"\n'.repeat(63)}`,
        'bytes.md': `---\n${'x'.repeat(16 * 1024 - 4)}`,
      };
      for (const [name, prefix] of Object.entries(prefixes)) {
        fs.writeFileSync(path.join(directory, name), `${prefix}PRIVATE_BODY_SENTINEL\n`);
      }
      const originalRead = fs.readSync;
      const readChunks = [];
      const spy = jest.spyOn(fs, 'readSync').mockImplementation((fd, buffer, offset, length, position) => {
        const count = originalRead(fd, buffer, offset, length, position);
        readChunks.push(buffer.subarray(offset, offset + count).toString());
        return count;
      });
      let result;
      try {
        result = handoffArtifact.discoverArtifacts({ targetRepo: target, limit: 10 });
      } finally {
        spy.mockRestore();
      }
      expect(readChunks.join('')).not.toContain('PRIVATE_BODY_SENTINEL');
      expect(result.candidates).toHaveLength(6);
      expect(result.candidates.find((entry) => entry.title === 'Indexed').indexed).toBe(true);
      expect(result.candidates.find((entry) => entry.title === 'CRLF').indexed).toBe(true);
      for (const name of ['plain.md', 'long.md', 'bytes.md', 'yaml.md']) {
        expect(result.candidates.find((entry) => entry.artifact_path.endsWith(name)).indexed).toBe(false);
      }
      expect(result.candidates.every((entry) => !Object.hasOwn(entry, 'body'))).toBe(true);
    } finally {
      fs.rmSync(target, { recursive: true, force: true });
    }
  });

  test('an explicit discovery folder is bounded and never follows symlink candidates', () => {
    const target = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-handoff-folder-'));
    const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-handoff-foreign-'));
    try {
      fs.writeFileSync(path.join(outside, 'selected-notes.md'), '# Untyped notes\nprivate body');
      fs.symlinkSync(path.join(outside, 'selected-notes.md'), path.join(outside, 'linked.md'));
      const result = handoffArtifact.run(['discover', '--target-repo', target, '--source-dir', outside, '--keywords', 'selected']);
      expect(result.status).toBe('discovered');
      expect(result.candidates).toEqual([expect.objectContaining({
        artifact_path: path.join(outside, 'selected-notes.md'),
        indexed: false,
      })]);
      expect(result.searched_root).toBe(outside);
      expect(fs.existsSync(path.join(target, '.spec-first'))).toBe(false);
      expect(handoffArtifact.run(['discover', '--target-repo', target, '--source-dir']).status).toBe('rejected');
      expect(handoffArtifact.run(['write', '--target-repo', target, '--source-dir', outside]).status).toBe('rejected');
      const linkedRoot = path.join(target, 'linked-root');
      fs.symlinkSync(outside, linkedRoot);
      expect(handoffArtifact.run(['discover', '--target-repo', target, '--source-dir', linkedRoot]).reason_code).toBe('source-directory-unsafe');
    } finally {
      fs.rmSync(target, { recursive: true, force: true });
      fs.rmSync(outside, { recursive: true, force: true });
    }
  });

  test('discovery reports an entry cap without reading beyond it', () => {
    const target = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-handoff-cap-'));
    try {
      for (let index = 0; index < 205; index += 1) {
        fs.writeFileSync(path.join(target, `${index}.md`), '# Notes\n');
      }
      const result = handoffArtifact.discoverArtifacts({ targetRepo: target, sourceDir: target, limit: 1000 });
      expect(result.scanned_entries).toBe(200);
      expect(result.scan_truncated).toBe(true);
      expect(result.candidates).toHaveLength(20);
      expect(result.candidates.every((entry) => entry.indexed === false)).toBe(true);
    } finally {
      fs.rmSync(target, { recursive: true, force: true });
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
          'references/create.md',
          'references/resume.md',
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
