'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { getAdapter, getSupportedPlatforms } = require('../../src/cli/adapters');
const plugin = require('../../src/cli/plugin');

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

const brainstorm = read('skills/spec-brainstorm/SKILL.md');
const pressure = read('skills/spec-brainstorm/references/product-pressure-test.md');
const sections = read('skills/spec-brainstorm/references/brainstorm-sections.md');
const handoff = read('skills/spec-brainstorm/references/handoff.md');
const lfg = read('skills/spec-lfg/SKILL.md');

describe('spec-brainstorm clarification, scenarios, and resume contract', () => {
  test('classifies load-bearing gaps without adding a persistent state table', () => {
    expect(brainstorm).toContain('source fact');
    expect(brainstorm).toContain('current-user decision');
    expect(brainstorm).toContain('open exploration');
    expect(brainstorm).toContain('planning-owned HOW');
    expect(brainstorm).toContain('source_attempt: not-applicable');
    expect(brainstorm).toContain('Product Contract write target');
    expect(brainstorm).toContain('not a persistent gap table');
  });

  test('runs a relevance-driven scenario pass with durable landing', () => {
    expect(pressure).toContain('role/permission');
    expect(pressure).toContain('state transition');
    expect(pressure).toContain('failure/degraded');
    expect(pressure).toContain('negative acceptance');
    expect(pressure).toContain('cross-context handoff');
    expect(pressure).toContain('Acceptance Example');
    expect(pressure).toContain('Resolve Before Planning / Outstanding Question');
    expect(pressure).toContain('explicit assumption');
    expect(pressure).toContain('Non-Goal');
    expect(pressure).toContain('Do not generate a Cartesian product');
  });

  test('persists source freshness and the next question for pause or resume', () => {
    expect(sections).toContain('source snapshot or observed version');
    expect(sections).toContain('limitation');
    expect(sections).toMatch(/invalidation\s+condition/);
    expect(sections).toContain('next highest-impact question');
    expect(handoff).toContain('next highest-impact question');
    expect(handoff).toContain('source refs, snapshots, limitations, and invalidation conditions');
    expect(brainstorm).toContain('`/tmp` dossier is unavailable');
  });

  test('keeps the current user as the sole product confirmer', () => {
    expect(brainstorm).toContain('current conversation user is the only human product confirmer');
    expect(brainstorm).toContain('one highest-impact independent product question at a time');
    expect(brainstorm).toContain('specialist material is evidence, not a second confirmation route');
  });

  test('treats option 2 as explicit authorization and invokes exact spec-lfg', () => {
    expect(lfg).toMatch(/^name: spec-lfg$/m);
    expect(lfg).not.toMatch(/^disable-model-invocation: true$/m);
    expect(lfg).toContain('Use only when the current user explicitly requests spec-lfg');
    expect(lfg).toContain('仅有代码就绪、已完成计划或模型推断');
    expect(handoff).toContain('Ship it autonomously with `spec-lfg`');
    expect(handoff).toContain('委派一组独立、只读的 reviewer 执行代码审查');
    expect(handoff).toContain('不授权任意 worker dispatch');
    expect(handoff).toContain('caller-owned target origin');
    expect(handoff).toContain('does not authorize a project server command');
    expect(handoff).not.toContain('may start and clean up one project-authorized local dev server');
    expect(handoff).not.toContain('project-local runtime profile');
    expect(handoff).toContain("The current user's selection is the explicit request");
    expect(handoff).toContain('Immediately invoke the\n`spec-lfg` skill');
    expect(handoff).toContain('complete argument payload');
    expect(handoff).toMatch(/Do not\s+prepend the option number/);
    expect(handoff).toContain('never shorten it to `lfg`');
    expect(handoff).not.toContain('invoke the `lfg` skill');
    expect(handoff).not.toContain('`lfg <plan-path>`');
  });

  test('projects the exact automatic spec-lfg handoff to every supported host', () => {
    for (const platform of getSupportedPlatforms()) {
      const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), `spec-brainstorm-lfg-${platform}-`));
      try {
        const adapter = getAdapter(platform);
        const { plan } = plugin.planBundledAssetSync(projectRoot, adapter);
        const runtimeRoot = adapter.workflowsRoot || adapter.skillsRoot;
        const expectedPath = path.posix.join(
          runtimeRoot,
          'spec-brainstorm/references/handoff.md',
        );
        const operation = plan.operations.find((entry) => entry.path === expectedPath);

        expect(operation).toBeDefined();
        expect(operation.contents).toContain('Ship it autonomously with `spec-lfg`');
        expect(operation.contents).toContain('委派一组独立、只读的 reviewer 执行代码审查');
        expect(operation.contents).toContain('不授权任意 worker dispatch');
        expect(operation.contents).toContain("The current user's selection is the explicit request");
        expect(operation.contents).toContain('Immediately invoke the\n`spec-lfg` skill');
        expect(operation.contents).toContain('complete argument payload');
        expect(operation.contents).not.toContain('invoke the `lfg` skill');
      } finally {
        fs.rmSync(projectRoot, { recursive: true, force: true });
      }
    }
  });
});
