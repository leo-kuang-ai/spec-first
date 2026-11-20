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
  const skill = read('skills/spec-work/SKILL.md') + '\n' + read('skills/spec-work/references/workspace-setup.md');
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
    expect(feedback).toMatch(/Fallback.*narrowest known check/is);
    expect(feedback).toMatch(/LLM determines which checks and scenarios are semantically sufficient/is);
  });

  test('feedback owner selects slices by contract and risk while keeping tests behavior-observable', () => {
    expect(feedback).toContain('## Slice Selection');
    expect(feedback).toMatch(/Default to a vertical slice: implement and verify one independently observable behavior/is);
    expect(feedback).toMatch(/contract-first.*only when multiple consumers share the same input\/output\/error contract.*early runnable feedback.*immediate transition.*vertical slice/is);
    expect(feedback).toMatch(/maximum loss, maximum uncertainty, or the most difficult-to-rollback assumption.*risk-first.*minimal proof\/characterization/is);
    expect(feedback).toMatch(/Rollback-friendly.*reversible seam.*orphans, duplicate effects, or unpredictable intermediate states/is);
    expect(feedback).toMatch(/semantic judgments, not file type or keyword classifications/is);

    expect(feedback).toContain('## Test Design Quality');
    expect(feedback).toMatch(/DAMP.*names, setup, and assertions should directly express behavior and business states/is);
    expect(feedback).toMatch(/state over interaction.*observable return values.*Only when the interaction itself constitutes the contract.*number of calls or call order/is);
    expect(feedback).toContain('real implementation -> high-fidelity fake -> stub -> mock');
    expect(feedback).toMatch(/No observed RED means no TDD-history claim.*run-local evidence prior to a production change.*RED\/TDD history/is);
    expect(feedback).toMatch(/bypasses serialization, middleware, callback, permission, retry, or error translation cannot serve as valid proof of end-to-end integration/is);
  });

  test('risk-triggered proof strength distinguishes mutation testing, coverage, baseline, and anti-gaming', () => {
    expect(feedback).toContain('## Risk-Triggered Proof Strength');
    expect(feedback).toMatch(/source mutation.*mutation testing/is);
    expect(feedback).toMatch(/equivalent mutant.*survivor.*error/is);
    expect(feedback).toMatch(/Changed-line coverage.*does not necessarily prove behavior/is);
    expect(feedback).toMatch(/pre-existing baseline.*task-introduced/is);
    expect(feedback).toMatch(/anti-gaming.*false-green/is);
    expect(feedback).toMatch(/named failure mode.*canonical command identity|canonical command identity.*named failure mode/is);
  });

  test('feedback-and-tests remains the deterministic owner for slice and test-design anchors', () => {
    const referencesRoot = path.join(repoRoot, 'skills/spec-work/references');
    const ownerFiles = fs.readdirSync(referencesRoot)
      .filter((name) => name.endsWith('.md'))
      .filter((name) => {
        const content = fs.readFileSync(path.join(referencesRoot, name), 'utf8');
        return content.includes('## Slice Selection') || content.includes('## Test Design Quality');
      });

    expect(ownerFiles).toEqual(['feedback-and-tests.md']);
    expect(skill).toContain('references/feedback-and-tests.md');
  });

  test('implementation owner rechecks all four postures against current source', () => {
    for (const posture of ['`reuse`', '`extend`', '`compose / thin-glue`', '`new`']) {
      expect(quality).toContain(posture);
    }
    expect(quality).toContain('Current-Source Capability Inventory');
    expect(quality).toMatch(/generated runtime mirror.*never the candidate owner/is);
    expect(quality).toMatch(/wrong party, business rules must not be forcibly inserted/is);
    expect(quality).toMatch(/No single.*nearby pattern.*can independently authorize/is);
    expect(quality).toMatch(/imagined future consumer can independently authorize/is);
  });

  test('thin glue owns coordination and exposes failure without copying truth', () => {
    expect(quality).toContain('Thin-Glue Boundary');
    expect(quality).toMatch(/translation.*sequencing.*failure propagation/is);
    expect(quality).toMatch(/partial failure.*degradation/is);
    expect(quality).toMatch(/observability.*evidence aggregation/is);
    expect(quality).toMatch(/duplicated domain truth/is);
    expect(quality).toMatch(/copy of the existing validation rule/is);
    expect(quality).toMatch(/parallel durable state/is);
    expect(quality).toMatch(/does not add real translation.*delete or do not create it/is);
  });

  test('scope-changing architecture is returned to the planning owner', () => {
    expect(quality).toContain('Scope And Authorization Stop-Back');
    expect(quality).toMatch(/public API\/contract.*schema\/runtime\/config.*provider\/repo boundary/is);
    expect(quality).toContain('spec-plan');
    expect(quality).toContain('spec-write-tasks');
    expect(quality).toMatch(/shall not proceed to on-the-spot design during the implementation phase/is);
  });

  test('simplification classifies deletion, debt, protected behavior, and wrong-layer work', () => {
    for (const classification of ['`remove-now`', '`minimality-debt`', '`protected`', '`architecture-mismatch`']) {
      expect(quality).toContain(classification);
    }
    for (const protectedSurface of ['security', 'data integrity', 'a11y', 'observability', 'required verification']) {
      expect(quality).toContain(protectedSurface);
    }
    expect(quality).toMatch(/Extract helper is not the default answer/is);
    expect(quality).toContain('deferred_follow_up[]');
  });

  test('source-only examples cover architecture, feedback, and cross-workflow anti-shortcuts', () => {
    const workExamples = readJson('skills/spec-work/evals/examples.json').cases;
    const workCases = new Set(workExamples.map((entry) => entry.id));
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
      'contract-first-shared-cli-contract',
      'risk-first-high-loss-parser-change',
      'docs-only-keeps-no-test-exception',
      'green-only-does-not-prove-tdd-history',
      'test-double-fidelity-does-not-prove-integration',
    ]) expect(workCases).toContain(id);

    const byId = new Map(workExamples.map((entry) => [entry.id, entry]));
    expect(byId.get('contract-first-shared-cli-contract')).toMatchObject({
      input: expect.stringContaining('shared CLI envelope'),
      expected: expect.stringMatching(/contract-first only.*input\/output\/error contract.*vertical slice/i),
      forbidden: expect.arrayContaining([
        expect.stringContaining('without a contract reason'),
        'select contract-first by file type',
      ]),
    });
    expect(byId.get('risk-first-high-loss-parser-change')).toMatchObject({
      input: expect.stringMatching(/uncertain malformed-input behavior.*high-cost rollback/i),
      expected: expect.stringMatching(/highest-loss uncertainty.*rollback-friendly.*observable parser outcomes/i),
      forbidden: expect.arrayContaining([
        'treat a green mock interaction as parser behavior proof',
        'select risk-first by keyword',
      ]),
    });
    expect(byId.get('docs-only-keeps-no-test-exception')).toMatchObject({
      expected: expect.stringMatching(/no-test exception.*docs\/diff-shape.*source wording/i),
      forbidden: expect.arrayContaining(['invent a failing runtime test', 'claim TDD history']),
    });
    expect(byId.get('green-only-does-not-prove-tdd-history')).toMatchObject({
      input: expect.stringContaining('no run-local evidence'),
      expected: expect.stringMatching(/do not claim TDD or RED history.*state\/behavior assertions.*interaction itself is the contract/i),
      forbidden: expect.arrayContaining([
        'infer RED from the final green diff',
        'prefer interaction counts over observable state by default',
      ]),
    });
    expect(byId.get('test-double-fidelity-does-not-prove-integration')).toMatchObject({
      input: expect.stringMatching(/skips serialization.*middleware.*permissions.*retry.*error translation/i),
      expected: expect.stringMatching(/Reject the integration claim.*real implementation.*high-fidelity fake.*real-object or integration check/i),
      forbidden: expect.arrayContaining([
        'call a seam-skipping mock integration evidence',
        'choose mock before a usable real implementation or fake',
      ]),
    });

    expect(debugCases).toContain('root-cause-shortcut-rejected');
    expect(reviewCases).toContain('advisory-evidence-not-confirmed');
  });
});

test('test discovery reverse-looks-up contract suites by asserted target', () => {
  const feedback = read('skills/spec-work/references/feedback-and-tests.md');
  const shipping = read('skills/spec-work/references/shipping-workflow.md');
  expect(feedback).toContain('Reverse-lookup by assertion target');
  expect(feedback).toContain('governance, byte-budget, ordering, and projection contracts typically do not import the target files');
  expect(feedback).toContain('test suites that match are included in the current check selection');
  expect(shipping).toContain('reverse-tracing touched paths in the test directory');
  expect(shipping).toContain('release governance suite');
  expect(shipping).toContain('test:release:governance');
});
