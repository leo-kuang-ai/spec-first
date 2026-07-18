'use strict';

const fs = require('node:fs');
const path = require('node:path');

const skill = fs.readFileSync(path.resolve(__dirname, '../../skills/spec-doc-review/SKILL.md'), 'utf8');
const subagentTemplate = fs.readFileSync(path.resolve(__dirname, '../../skills/spec-doc-review/references/subagent-template.md'), 'utf8');
const synthesis = fs.readFileSync(path.resolve(__dirname, '../../skills/spec-doc-review/references/synthesis-and-presentation.md'), 'utf8');
const walkthrough = fs.readFileSync(path.resolve(__dirname, '../../skills/spec-doc-review/references/walkthrough.md'), 'utf8');
const bulkPreview = fs.readFileSync(path.resolve(__dirname, '../../skills/spec-doc-review/references/bulk-preview.md'), 'utf8');
const openQuestions = fs.readFileSync(path.resolve(__dirname, '../../skills/spec-doc-review/references/open-questions-defer.md'), 'utf8');
const reportOnlyCases = JSON.parse(fs.readFileSync(
  path.resolve(__dirname, '../../skills/spec-doc-review/evals/report-only-cases.json'),
  'utf8',
));

// Lazy references — must exist on disk
const lazyRefs = [
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

const refsDir = path.resolve(__dirname, '../../skills/spec-doc-review/references');
const executionSpines = `${skill}\n${subagentTemplate}\n${synthesis}`;

describe('spec-doc-review current contracts', () => {
  // --- Existing assertions (preserved) ---

  test('asks for or discovers a document when none is supplied', () => {
    expect(skill).toContain('If no document is specified');
    expect(skill).toContain('Ask which document to review');
  });

  test('classifies unified requirements and plans by readiness', () => {
    expect(skill).toContain('artifact_readiness: requirements-only');
    expect(skill).toContain('classify as `unified-requirements`');
    expect(skill).toContain('artifact_readiness: implementation-ready');
    expect(skill).toContain('classify as `unified-plan`');
  });

  test('separates delivery mode from the run-local mutation policy', () => {
    expect(skill).toContain('delivery_mode');
    expect(skill).toContain('mutation_policy');
    expect(skill).toContain('markdown-write');
    expect(skill).toContain('report-only');
    expect(skill).toMatch(/Headless.*delivery.*not.*mutation policy/is);
    expect(skill).toMatch(/HTML.*report-only/is);
    expect(skill).toMatch(/conflict.*fail closed.*report-only/is);
    expect(skill).toMatch(/cannot write.*mutation_reason: write-unavailable/is);
  });

  test('parses explicit report-only and JSON tokens without treating them as paths', () => {
    expect(skill).toContain('[mutation:report-only] [output:json]');
    expect(skill).toMatch(/mode:\*.*mutation:\*.*output:\*.*flags, not file paths/is);
    expect(skill).toContain('Accept only `mutation:report-only` and `output:json`');
    expect(skill).toMatch(/duplicate token.*multiple `mutation:\*`.*multiple `output:\*`.*fails closed/is);
    expect(skill).toContain('Review failed: flag-conflict-or-unsupported');
    expect(skill).toContain('requested_mutation');
    expect(skill).toContain('output_mode');
  });

  test('caller-requested report-only overrides only ordinary writable Markdown', () => {
    expect(skill).toContain('mutation_reason: caller-requested-report-only');
    expect(skill).toMatch(/explicit caller policy overrides the ordinary Markdown default/is);
    expect(skill).toMatch(/HTML remains `html-artifact`.*write-unavailable.*format-conflict-or-ambiguous/is);
    expect(skill).toMatch(/Without the mutation token.*writable Markdown.*`markdown-write`/is);
  });

  test('requires explicit dispatch authorization and preserves the inline fallback', () => {
    expect(skill).toMatch(/direct invocation.*authorizes.*workflow.*not host-level subagent dispatch/is);
    expect(skill).toContain('dispatch_authorization_missing');
    expect(skill).toContain('subagent_capability_missing');
    expect(skill).toMatch(/selected persona prompt assets inline or serially/is);
    expect(skill).toMatch(/orthogonal to `mutation_policy`/is);
    expect(skill).toMatch(/Do not claim independent persona coverage or context isolation/);
  });

  test('report-only review blocks every Markdown mutation entrypoint', () => {
    expect(synthesis).toMatch(/mutation_policy.*report-only/is);
    expect(synthesis).toContain('fixes_applied: 0');
    expect(synthesis).toContain('producer_fix_candidates');
    expect(synthesis).toMatch(/do not.*edit.*document/is);
    for (const reference of [walkthrough, bulkPreview, openQuestions]) {
      expect(reference).toMatch(/mutation_policy.*markdown-write/is);
      expect(reference).toMatch(/report-only.*STOP|STOP.*report-only/is);
    }
  });

  test('report-only envelope preserves findings, coverage, and limitations without a walkthrough', () => {
    for (const field of [
      'delivery_mode:',
      'mutation_policy:',
      'mutation_reason:',
      'review_status:',
      'fixes_applied:',
      'producer_fix_candidates:',
      'proposed_fixes_count:',
      'decisions_count:',
      'fyi_count:',
      'p0_p1_actionable_count:',
      'Coverage:',
      'Limitations:',
    ]) {
      expect(synthesis).toContain(field);
    }
    expect(synthesis).toMatch(/report-only.*do not load.*walkthrough/is);
    expect(synthesis).toMatch(/report-only.*Open Questions/is);
  });

  test('JSON output is the existing zero-write envelope in machine-readable form', () => {
    expect(synthesis).toContain('### JSON Rendering');
    expect(synthesis).toMatch(/output_mode.*json.*JSON object/is);
    expect(skill).toMatch(/output_mode: json[\s\S]*do not print this line[\s\S]*final JSON object/is);
    expect(skill).toMatch(/JSON mode's machine-readable single-object contract overrides the normal announcement requirement/i);
    expect(synthesis).toMatch(/单对象合同覆盖[\s\S]*cost-shape[\s\S]*reviewer announcement[\s\S]*terminal_signal/is);
    expect(synthesis).toContain('"mutation_reason": "markdown-artifact|caller-requested-report-only|html-artifact|format-conflict-or-ambiguous|write-unavailable"');
    expect(synthesis).toContain('"fixes_applied": 0');
    expect(synthesis).toContain('"applied_fixes": []');
    expect(synthesis).toContain('"producer_fix_candidates": []');
    expect(synthesis).toContain('"coverage": []');
    expect(synthesis).toContain('"limitations": []');
    expect(synthesis).toMatch(/coverage.*selected\/skipped personas.*cost shape.*isolation.*reviewer outcomes/is);
    expect(synthesis).toMatch(/不得因 JSON 输出而获得 producer write authority/);
    expect(synthesis).toMatch(/`markdown-write` \+ `output:json`.*实际 `N`.*对应明细/is);
    expect(synthesis).toMatch(/`report-only`.*`0`.*`\[\]`/is);
    expect(synthesis).toMatch(/output_mode: json[\s\S]*Return only the single JSON object/);
    expect(synthesis).toMatch(/terminal signal exclusively in `terminal_signal: "Review complete"`/);
    expect(synthesis).toMatch(/do not append an object-external `Review complete`/);
    expect(synthesis).toMatch(/output_mode: text[\s\S]*return "Review complete" as the terminal signal/);
  });

  test('report-only evals contain two positive and two negative-owner cases', () => {
    expect(reportOnlyCases.cases.filter((entry) => entry.kind === 'positive')).toHaveLength(2);
    expect(reportOnlyCases.cases.filter((entry) => entry.kind === 'negative-owner')).toHaveLength(2);
    expect(reportOnlyCases.cases.map((entry) => entry.id)).toEqual(expect.arrayContaining([
      'markdown-caller-requests-json-report-only',
      'shipping-caller-detects-plan-drift',
      'default-markdown-still-writes-safe-auto',
      'html-and-format-conflict-keep-existing-reasons',
    ]));
    const markdownJsonParity = reportOnlyCases.cases.find((entry) => entry.id === 'default-markdown-still-writes-safe-auto');
    expect(markdownJsonParity.input).toContain('output:json');
    expect(markdownJsonParity.expected).toContain('applied_fixes');
  });

  test('mandatory reviewer loss fails closed instead of producing a clean verdict', () => {
    expect(skill).toMatch(/both always-on reviewers.*equivalent inline review/is);
    expect(skill).toContain('mandatory_review_coverage_missing');
    expect(synthesis).toMatch(/review_status: incomplete/);
    expect(synthesis).toMatch(/do not emit a clean verdict or execution-ready implication/);
  });

  test('does not infer document kind from path alone', () => {
    expect(skill).toMatch(/content shape.*not its file path/);
    expect(skill).toMatch(/Path is a tie-breaker hint/);
  });

  // --- U1: Subagent template spine structure ---

  test('U1: subagent template spine contains schema hard constraints', () => {
    expect(subagentTemplate).toContain('"P0"');
    expect(subagentTemplate).toContain('"P1"');
    expect(subagentTemplate).toContain('"error"');
    expect(subagentTemplate).toContain('"omission"');
    expect(subagentTemplate).toContain('"safe_auto"');
    expect(subagentTemplate).toContain('"gated_auto"');
    expect(subagentTemplate).toContain('"manual"');
    expect(subagentTemplate).toMatch(/evidence.*ARRAY/i);
    expect(subagentTemplate).toMatch(/confidence.*exactly.*0.*25.*50.*75.*100/);
  });

  test('U1: subagent template spine contains confidence anchor quick-reference table', () => {
    expect(subagentTemplate).toContain('| Anchor | Behavioral criterion | Route |');
    expect(subagentTemplate).toContain('| `0`');
    expect(subagentTemplate).toContain('| `25`');
    expect(subagentTemplate).toContain('| `50`');
    expect(subagentTemplate).toContain('| `75`');
    expect(subagentTemplate).toContain('| `100`');
  });

  test('U1: subagent template spine contains autofix_class three-tier definitions', () => {
    expect(subagentTemplate).toContain('`safe_auto`');
    expect(subagentTemplate).toContain('`gated_auto`');
    expect(subagentTemplate).toContain('`manual`');
    expect(subagentTemplate).toMatch(/One clear correct fix/);
    expect(subagentTemplate).toMatch(/Concrete fix exists but touches document meaning/);
    expect(subagentTemplate).toMatch(/Requires user judgment/);
  });

  test('U1: subagent template spine contains false-positive catalog key entries', () => {
    expect(subagentTemplate).toMatch(/pedantic style nitpick/i);
    expect(subagentTemplate).toMatch(/Issues that belong to other personas/);
    expect(subagentTemplate).toMatch(/Speculative future-work concerns/);
    expect(subagentTemplate).toMatch(/Theoretical concerns without baseline/);
    expect(subagentTemplate).toMatch(/visual-aid removal/i);
  });

  test('U1: subagent template spine contains optional detail guidance (not mandatory always-read)', () => {
    expect(subagentTemplate).toContain('subagent-confidence-rubric-detail.md');
    expect(subagentTemplate).toMatch(/If unsure about anchor selection/);
    // Must NOT contain a mandatory "STOP. Before assigning confidence, read..."
    expect(subagentTemplate).not.toMatch(/STOP.*Before.*confidence.*read/i);
  });

  // --- U2: Synthesis hot path structure ---

  test('U2: synthesis hot path contains 3.5b always-on', () => {
    expect(synthesis).toMatch(/3\.5b/);
    expect(synthesis).toMatch(/Always-on/);
    expect(synthesis).toMatch(/recommended_action/);
  });

  test('U2: synthesis hot path contains STOP anchors for cold paths', () => {
    expect(synthesis).toContain('synthesis-premise-collapse.md');
    expect(synthesis).toContain('synthesis-contradictions.md');
    expect(synthesis).toContain('synthesis-chain-linking.md');
    expect(synthesis).toContain('synthesis-restatement-suppression.md');
    expect(synthesis).toContain('synthesis-multi-round.md');
  });

  test('U2: synthesis hot path 3.5 STOP anchor semantics is unmerged opposing (not merged opposing)', () => {
    // Must reference "not yet resolved" or "intentionally kept separate" — not "merged finding already carries opposing"
    expect(synthesis).toMatch(/not yet resolved|intentionally.*separate|kept separate/);
    // The 3.5 STOP anchor text itself must not say "merged finding already carries opposing"
    const stop35Match = synthesis.match(
      /STOP\..*?(?:read\s+`references\/synthesis-contradictions\.md`)/is
    );
    expect(stop35Match).not.toBeNull();
    expect(stop35Match[0]).not.toMatch(/merged finding.*already.*opposing/);
  });

  test('U2: synthesis hot path 3.5c STOP anchor is before 3.6', () => {
    // 3.5c STOP must appear before 3.6 (Promote Auto-Eligible Findings)
    const before36 = synthesis.indexOf('synthesis-chain-linking.md');
    const promoteIndex = synthesis.indexOf('3.6 Promote Auto-Eligible');
    expect(before36).toBeGreaterThan(0);
    expect(promoteIndex).toBeGreaterThan(0);
    expect(before36).toBeLessThan(promoteIndex);
  });

  test('U2: synthesis hot path 3.5c STOP anchor references post-3.5b (not post-routing)', () => {
    expect(synthesis).toMatch(/3\.5b/);
    // Must not claim cold-path trigger is "post-routing" or "post-3.7"
    expect(synthesis).not.toMatch(/post-routing.*synthesis-chain-linking/);
    expect(synthesis).not.toMatch(/after 3\.7.*synthesis-chain-linking/);
  });

  // --- U3: SKILL.md STOP anchors and lazy references ---

  test('U3: SKILL.md contains classification STOP anchor', () => {
    expect(skill).toContain('document-classification-signals.md');
    expect(skill).toMatch(/classification is genuinely ambiguous/);
  });

  test('U3: SKILL.md contains persona activation STOP anchor', () => {
    expect(skill).toContain('persona-activation-matrix.md');
    expect(skill).toMatch(/quick-reference table does not resolve/);
  });

  test('U3: SKILL.md contains activation quick-reference table', () => {
    expect(skill).toContain('| Persona | Activate when the document... |');
    expect(skill).toContain('product-lens');
    expect(skill).toContain('design-lens');
    expect(skill).toContain('security-lens');
    expect(skill).toContain('scope-guardian');
    expect(skill).toContain('adversarial');
  });

  // --- Lazy reference existence ---

  test('all lazy reference files exist on disk', () => {
    for (const ref of lazyRefs) {
      const refPath = path.join(refsDir, ref);
      expect(fs.existsSync(refPath)).toBe(true);
    }
  });

  // --- Lazy reference content markers ---

  test('U1: confidence rubric detail reference contains full behavioral descriptions', () => {
    const detail = fs.readFileSync(path.join(refsDir, 'subagent-confidence-rubric-detail.md'), 'utf8');
    expect(detail).toContain('## Anchor Descriptions');
    expect(detail).toContain('`0`');
    expect(detail).toContain('`25`');
    expect(detail).toContain('`50`');
    expect(detail).toContain('`75`');
    expect(detail).toContain('`100`');
  });

  test('U1: why-it-matters guide reference contains weak-vs-strong example', () => {
    const guide = fs.readFileSync(path.join(refsDir, 'subagent-why-it-matters-guide.md'), 'utf8');
    expect(guide).toMatch(/WEAK/i);
    expect(guide).toMatch(/STRONG/i);
    expect(guide).toContain('observable consequence');
  });

  test('U1: why-it-matters guide is conditionally reachable from the subagent spine', () => {
    expect(subagentTemplate).toContain('subagent-why-it-matters-guide.md');
    expect(subagentTemplate).toMatch(/still leads with document structure|cannot name an observable consequence/);
    expect(subagentTemplate).toMatch(/Do not load it when the spine rules already resolve/);
  });

  test('U1: suggested-fix advanced reference contains strawman analysis', () => {
    const advanced = fs.readFileSync(path.join(refsDir, 'subagent-suggested-fix-advanced.md'), 'utf8');
    expect(advanced).toMatch(/strawman/i);
    expect(advanced).toMatch(/single.*action|multi-facet|composite/i);
  });

  test('U2: chain-linking cold path contains shape-match signal rule and worked examples', () => {
    const chain = fs.readFileSync(path.join(refsDir, 'synthesis-chain-linking.md'), 'utf8');
    expect(chain).toMatch(/shape.*match|substring.*contains|shape.*not.*exact/i);
    expect(chain).toContain('premise unsupported');
    expect(chain).toContain('do-nothing baseline');
    expect(chain).toMatch(/questions whether.*named component.*should exist/i);
    expect(chain).toContain('Example A');
    expect(chain).toContain('Example B');
  });

  test('U2: contradictions cold path references unmerged opposing actions from 3.3', () => {
    const contradictions = fs.readFileSync(path.join(refsDir, 'synthesis-contradictions.md'), 'utf8');
    expect(contradictions).toMatch(/intentionally kept separate|not merged/);
  });

  test('U3: document classification signals reference contains requirements and plan signals', () => {
    const signals = fs.readFileSync(path.join(refsDir, 'document-classification-signals.md'), 'utf8');
    expect(signals).toContain('`requirements` signals');
    expect(signals).toContain('`plan` signals');
    expect(signals).toMatch(/tie-breaker/i);
  });

  test('U3: persona activation matrix reference contains full adversarial activation rules', () => {
    const matrix = fs.readFileSync(path.join(refsDir, 'persona-activation-matrix.md'), 'utf8');
    expect(matrix).toContain('## adversarial');
    expect(matrix).toContain('high-stakes domain');
    expect(matrix).toContain('product_contract_source: spec-plan-bootstrap');
  });


  // --- Roster budget + cost-shape (002) ---

  test('002: SKILL.md defines roster profiles lite/standard/full', () => {
    expect(skill).toMatch(/roster:lite/);
    expect(skill).toMatch(/roster:standard/);
    expect(skill).toMatch(/roster:full/);
    expect(skill).toMatch(/Apply Roster Budget/);
    expect(skill).toMatch(/at most 1/i);
  });

  test('002: SKILL.md requires cost-shape advisory line before dispatch', () => {
    expect(skill).toContain('cost-shape:');
    expect(skill).toMatch(/doc_bytes/);
    expect(skill).toMatch(/isolation=\{min\|degraded_inherited\}|isolation=\{min\|degraded_inherited\}|degraded_inherited/);
  });

  test('002: SKILL.md states minimum context isolation intent', () => {
    expect(skill).toMatch(/fork_turns|minimum parent-context inheritance|Context isolation/i);
    expect(skill).toContain('degraded_inherited');
  });

  test('002: SKILL.md anti-waste rule for document slices', () => {
    expect(skill).toMatch(/Anti-waste rule/);
  });

  test('all lazy references are reachable from an execution spine', () => {
    for (const ref of lazyRefs) {
      expect(executionSpines).toContain(ref);
    }
  });
});
