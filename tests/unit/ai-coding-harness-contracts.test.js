'use strict';

const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.join(__dirname, '..', '..');

function read(relativePath) {
  return fs.readFileSync(path.join(REPO_ROOT, relativePath), 'utf8');
}

describe('AI Coding Harness contract', () => {
  test('defines spec-first as a bounded AI Coding Harness, not a state machine', () => {
    const contract = read('docs/contracts/ai-coding-harness.md');

    expect(contract).toContain('AI Coding Harness for spec-driven software engineering');
    expect(contract).toContain('Codebase -> Spec -> Plan -> Tasks -> Code -> Review -> Knowledge');
    expect(contract).toContain('不是新的 workflow、command、state machine、universal schema');
    expect(contract).toContain('Scripts enforce deterministic invariants and prepare deterministic facts');
    expect(contract).toContain('LLM workflows decide semantic adequacy above that floor');
    expect(contract).toContain('External tools and providers do not own scope authority');
  });

  test('maps Harness layers to existing light contracts', () => {
    const contract = read('docs/contracts/ai-coding-harness.md');

    for (const layer of [
      'Context Harness',
      'Execution Harness',
      'Evidence Harness',
      'Evaluation Harness',
      'Governance Harness',
      'Knowledge Harness',
    ]) {
      expect(contract).toContain(layer);
    }

    for (const referenced of [
      'context-governance.md',
      'context-bundle.md',
      'artifact-summary.md',
      'project-graph-consumption.md',
      'knowledge/knowledge-harness.md',
      'workflows/spec-id-traceability.md',
      'workflows/spec-work-run-artifact.schema.json',
      'workflows/review-finding.md',
      'verifiers/verification-evidence.schema.json',
      'source-runtime-customization-boundary.md',
      'dual-host-governance/README.md',
    ]) {
      expect(contract).toContain(referenced);
    }
  });

  test('defines direct evidence lanes without promoting external tools into scope authority', () => {
    const contract = read('docs/contracts/ai-coding-harness.md');

    expect(contract).toContain('spec-first 的默认 evidence lane 是 bounded direct evidence');
    expect(contract).toContain('bounded direct evidence');
    expect(contract).toContain('| source-read | focused file reads, `rg`, ast-grep, local package/test metadata |');
    expect(contract).toContain('| verification | tests, syntax checks, CLI output, logs, deterministic validators |');
    expect(contract).toContain('| handoff-summary | artifact summaries, changed files, review/debug/work summaries |');
    expect(contract).toContain('| external-tool | browser/MCP/package manager/shell outputs when explicitly useful |');
    expect(contract).toContain('| capability-candidate | project-graph/code-graph orientation candidates, consumed through `project-graph-consumption.md` |');
    expect(contract).toContain('source reads remain the confirmation path');
    expect(contract).toContain('untrusted until validated, bounded, summarized, and confirmed against source/test/log evidence when material');
  });
});
