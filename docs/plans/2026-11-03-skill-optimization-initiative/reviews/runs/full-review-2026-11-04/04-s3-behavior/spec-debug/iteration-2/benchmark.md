# Skill Benchmark: spec-debug

**Date**: 2026-11-04T13:06:42Z
**Evals**: Diagnosis-only requests deliver the causal chain without changing source (1 runs each per configuration)

## Summary

| Metric | With Skill |
|--------|------------|
| Pass Rate | 0% ± 0% |

## Per-Case Results

### Diagnosis-only requests deliver the causal chain without changing source (with_skill)

- **Pass Rate**: 0% (0/1)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| script: /Users/kuang/xiaobu/spec-first/skills/spec-debug/evals/fixtures/scripts/check-diagnosis-no-fix.sh | ❌ | script exited with code 1 [stderr: node:fs:1722
  const stats = binding.lstat(
                        ^

Error: ENOENT: no such file or directory, lstat '.git/eval-baseline.json'
    at Object.lstatSync (node:fs:1722:25)
    at regular ([stdin]:28:21)
    at checkFixture ([stdin]:61:31)
    at [stdin]:95:1
    at runScriptInThisContext (node:internal/vm:209:10)
    at node:internal/process/execution:446:12
    at [stdin]-wrapper:6:24
    at runScriptInContext (node:internal/process/execution:444:60)
    at evalFunction (node:internal/process/execution:279:30)
    at evalTypeScript (node:internal/process/execution:291:3) {
  errno: -2,
  code: 'ENOENT',
  syscall: 'lstat',
  path: '.git/eval-baseline.json'
}

Node.js v22.22.3] |

