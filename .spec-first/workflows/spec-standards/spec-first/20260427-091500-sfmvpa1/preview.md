# Standards Proposal: spec-first

**Run ID:** 20260427-091500-sfmvpa1
**Evidence mode:** crg-first
**Graph quality:** usable (generation 20260427034128141)

## Existing Confirmed Standards (not re-proposed)

| Standard | Scope | Priority |
|---|---|---|
| architecture.md | repo/cli/crg | 90 |
| changelog-iron-law.md | repo/governance | 90 |
| governance.md | repo/workflows | 90 |
| testing-layers.md | testing/cli/crg | 85 |
| workflow-boundaries.md | workflows/standards | 90 |

## New Draft Standards (3)

| Draft | Scope | Priority | Confidence |
|---|---|---|---|
| common/cli-command-safety.md | common/cli | 80 | medium |
| common/nodejs-conventions.md | common | 75 | medium |
| common/secret-redaction.md | common/cli | 85 | high |

## Evidence Summary

- CRG graph: 1030 nodes, 2651 edges, 15 communities — usable
- Direct reads: package.json, src/cli/commands/specs.js, existing docs/specs/**
- Key patterns observed: atomic tmp-then-rename (specs.js:179-226), credential detection constant (specs.js:19-24), strict mode on all src files, Node 20+ requirement in package.json

## Limitations

- 4 files with parse errors not included in CRG evidence
- 3 sensitive files excluded from CRG
- All drafts are `inferred`; human review required before promotion
