# Skill Benchmark: spec-doc-review

**Date**: 2026-11-04T11:46:03Z
**Evals**: 冲突 mutation token 应 fail closed 且不读文档, Non-interactive review without a path returns the fixed receipt, Default review preserves the document and Git state, Derived task packs are reviewed without direct edits, HTML review remains report-only despite an apply request, standard 预算 ≤3 且 security 信号优先选中 security-lens (1 runs each per configuration)

## Summary

| Metric | With Skill |
|--------|------------|
| Pass Rate | 83% ± 37% |

## Per-Case Results

### 冲突 mutation token 应 fail closed 且不读文档 (with_skill)

- **Pass Rate**: 100% (2/2)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| expect.must_contain | ✅ | all checks passed |
| output_contains{all:[flag-conflict-or-unsupported]} | ✅ | output satisfies all contains checks (all:[flag-conflict-or-unsupported]) |

### Non-interactive review without a path returns the fixed receipt (with_skill)

- **Pass Rate**: 0% (0/1)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| script: /Users/kuang/xiaobu/spec-first/skills/spec-doc-review/evals/fixtures/scripts/check-headless-no-path.sh | ❌ | script exited with code 1 [stderr: node:assert:150
  throw new AssertionError(obj);
  ^

AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
+ actual - expected

+ 'Review failed: non-interactive mode requires a document path. Expected arguments: mode:non-interactive <path>\n' +
+   '\n' +
+   '说明：本次调用只携带了 `mode:non-interactive` 标志，未附带任何文档路径，因此按技能契约在派遣评审前直接终止，未做任何 persona 分派或文档读取。\n' +
+   '\n' +
+   '如需继续，请在参数中附上待评审文档的可读路径，例如：\n' +
+   '- `mode:non-interactive docs/plans/my-plan.md`（默认 report-only 报告）\n' +
+   '- `mode:non-interactive mutation:apply-fixes docs/plans/my-plan.md`（生产者授权的受限 Markdown 修复评审）\n' +
+   '\n' +
+   '可选标志还包括 `roster:lite|standard|full`（默认 standard）与 `output:json`。'
- 'Review failed: non-interactive mode requires a document path. Expected arguments: mode:non-interactive <path>'

    at missingDocumentPath ([stdin]:46:10)
    at [stdin]:49:1
    at runScriptInThisContext (node:internal/vm:209:10)
    at node:internal/process/execution:446:12
    at [stdin]-wrapper:6:24
    at runScriptInContext (node:internal/process/execution:444:60)
    at evalFunction (node:internal/process/execution:279:30)
    at evalTypeScript (node:internal/process/execution:291:3)
    at node:internal/main/eval_stdin:53:5
    at ReadStream.<anonymous> (node:internal/process/execution:201:5) {
  generatedMessage: true,
  code: 'ERR_ASSERTION',
  actual: 'Review failed: non-interactive mode requires a document path. Expected arguments: mode:non-interactive <path>\n' +
    '\n' +
    '说明：本次调用只携带了 `mode:non-interactive` 标志，未附带任何文档路径，因此按技能契约在派遣评审前直接终止，未做任何 persona 分派或文档读取。\n' +
    '\n' +
    '如需继续，请在参数中附上待评审文档的可读路径，例如：\n' +
    '- `mode:non-interactive docs/plans/my-plan.md`（默认 report-only 报告）\n' +
    '- `mode:non-interactive mutation:apply-fixes docs/plans/my-plan.md`（生产者授权的受限 Markdown 修复评审）\n' +
    '\n' +
    '可选标志还包括 `roster:lite|standard|full`（默认 standard）与 `output:json`。',
  expected: 'Review failed: non-interactive mode requires a document path. Expected arguments: mode:non-interactive <path>',
  operator: 'strictEqual',
  diff: 'simple'
}

Node.js v22.22.3] |

### Default review preserves the document and Git state (with_skill)

- **Pass Rate**: 100% (1/1)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| script: /Users/kuang/xiaobu/spec-first/skills/spec-doc-review/evals/fixtures/scripts/check-plan-marker.sh | ✅ | script passed (exit code 0) |

### Derived task packs are reviewed without direct edits (with_skill)

- **Pass Rate**: 100% (1/1)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| script: /Users/kuang/xiaobu/spec-first/skills/spec-doc-review/evals/fixtures/scripts/check-taskpack-marker.sh | ✅ | script passed (exit code 0) |

### HTML review remains report-only despite an apply request (with_skill)

- **Pass Rate**: 100% (1/1)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| script: /Users/kuang/xiaobu/spec-first/skills/spec-doc-review/evals/fixtures/scripts/check-html-marker.sh | ✅ | script passed (exit code 0) |

### standard 预算 ≤3 且 security 信号优先选中 security-lens (with_skill)

- **Pass Rate**: 100% (2/2)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| expect.must_contain | ✅ | all checks passed |
| output_contains{all:[cost-shape security]} | ✅ | output satisfies all contains checks (all:[cost-shape security]) |

