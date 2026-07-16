'use strict';

const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '../..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

describe('spec-work feedback and implementation quality contracts', () => {
  const skill = read('skills/spec-work/SKILL.md');
  const feedback = read('skills/spec-work/references/feedback-and-tests.md');
  const quality = read('skills/spec-work/references/implementation-quality.md');

  test('front-controller spine has two triggered STOP anchors and a quiet trivial path', () => {
    expect(skill).toContain('STOP — before the first behavior-bearing mutation');
    expect(skill).toContain('references/feedback-and-tests.md');
    expect(skill).toContain('STOP — before adding or materially changing a durable surface');
    expect(skill).toContain('references/implementation-quality.md');
    expect(skill).toMatch(/trivial non-behavioral edit.*do not load|trivial non-behavioral edit.*不加载/is);
    expect(skill).toMatch(/ordinary bounded edits.*do not emit.*architecture matrix|ordinary bounded edits.*不输出.*architecture matrix/is);
  });

  test('feedback owner covers smallest loops, vertical slices, discovery, system checks, and replacement evidence', () => {
    for (const marker of [
      'Smallest Feedback Loop',
      'Vertical Slices',
      'Proof / Characterization Strategy',
      'Test Discovery',
      'Scenario Completeness',
      'System-Wide Check',
      'Not-Run And Replacement Evidence',
      'feedback_loop_not_possible',
      'missing_dependency',
      'schedulable',
    ]) {
      expect(feedback).toContain(marker);
    }
    expect(feedback).toMatch(/Fallback.*最窄已知验证/is);
    expect(feedback).toMatch(/LLM.*选择哪些 checks.*语义充分/is);
  });

  test('implementation owner rechecks all four postures against current source', () => {
    for (const posture of ['`reuse`', '`extend`', '`compose / thin-glue`', '`new`']) {
      expect(quality).toContain(posture);
    }
    expect(quality).toContain('Current-Source Capability Inventory');
    expect(quality).toMatch(/generated runtime mirror.*不是 candidate owner/is);
    expect(quality).toMatch(/wrong owner.*不得/is);
    expect(quality).toMatch(/单一.*nearby pattern.*不能.*授权/is);
    expect(quality).toMatch(/imagined future consumer.*不能.*授权/is);
  });

  test('thin glue owns coordination and exposes failure without copying truth', () => {
    expect(quality).toContain('Thin-Glue Boundary');
    expect(quality).toMatch(/translation.*sequencing.*failure propagation/is);
    expect(quality).toMatch(/partial failure.*degradation/is);
    expect(quality).toMatch(/observability.*evidence aggregation/is);
    expect(quality).toMatch(/duplicated domain truth/is);
    expect(quality).toMatch(/validation rule.*复制/is);
    expect(quality).toMatch(/parallel durable state/is);
    expect(quality).toMatch(/没有增加真实 translation.*不创建/is);
  });

  test('scope-changing architecture is returned to the planning owner', () => {
    expect(quality).toContain('Scope And Authorization Stop-Back');
    expect(quality).toMatch(/public API\/contract.*schema\/runtime\/config.*provider\/repo boundary/is);
    expect(quality).toContain('spec-plan');
    expect(quality).toContain('spec-write-tasks');
    expect(quality).toMatch(/不在实现阶段临场设计/is);
  });

  test('simplification classifies deletion, debt, protected behavior, and wrong-layer work', () => {
    for (const classification of ['`remove-now`', '`minimality-debt`', '`protected`', '`architecture-mismatch`']) {
      expect(quality).toContain(classification);
    }
    for (const protectedSurface of ['security', 'data integrity', 'a11y', 'observability', 'required verification']) {
      expect(quality).toContain(protectedSurface);
    }
    expect(quality).toMatch(/Extract helper.*不是默认答案/is);
    expect(quality).toContain('deferred_follow_up[]');
  });

  test('source-only examples cover architecture, feedback, and cross-workflow anti-shortcuts', () => {
    const workCases = new Set(readJson('skills/spec-work/evals/examples.json').cases.map((entry) => entry.id));
    const debugCases = new Set(readJson('skills/spec-debug/evals/examples.json').cases.map((entry) => entry.id));
    const reviewCases = new Set(readJson('skills/spec-code-review/evals/examples.json').cases.map((entry) => entry.id));

    for (const id of [
      'reuse-existing-capability',
      'extend-canonical-owner',
      'compose-thin-glue',
      'justified-new-boundary',
      'future-only-wrapper-rejected',
      'wrong-owner-reuse-rejected',
      'trivial-non-trigger',
      'docs-only-feedback',
    ]) expect(workCases).toContain(id);

    expect(debugCases).toContain('root-cause-shortcut-rejected');
    expect(reviewCases).toContain('advisory-evidence-not-confirmed');
  });
});
