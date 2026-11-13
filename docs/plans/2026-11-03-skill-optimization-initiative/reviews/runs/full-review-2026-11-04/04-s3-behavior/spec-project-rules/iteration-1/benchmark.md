# Skill Benchmark: spec-project-rules

**Date**: 2026-11-04T12:05:44Z
**Evals**: 多端 monorepo bootstrap 产出单文件知识库且遵守 headless 首嵌跳过与敏感信息过滤, update 谣言声称经回源反证后零写入, 准入三问拦截通识条目且保留项目私有规则, 无实质变化时 dry-run 产出 refresh_noop 且零写入, refs 脏检测后聚焦重验仍准确则零写入且不回滚用户工作区改动, module 更新合入知识库且 AGENTS.md 用户内容与他 skill marker 逐字节保留, 用户主动要求写入敏感信息时知识库正常建立且敏感值零泄漏, 单端无 shared 层仓降级为最简知识库且不虚构跨端小节, 大仓走骨架先行分批增量且不留中间产物文件, 布局不受支持时消费脚本抽样清单产出知识库并披露抽样比例 (1 runs each per configuration)

## Summary

| Metric | With Skill |
|--------|------------|
| Pass Rate | 100% ± 0% |

## Per-Case Results

### 多端 monorepo bootstrap 产出单文件知识库且遵守 headless 首嵌跳过与敏感信息过滤 (with_skill)

- **Pass Rate**: 100% (2/2)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| expect.exit_code | ✅ | all checks passed |
| script: /Users/kuang/xiaobu/spec-first/skills/spec-project-rules/evals/fixtures/scripts/check-bootstrap.sh | ✅ | PASS: bootstrap gold（headless：首次嵌入跳过） |

### update 谣言声称经回源反证后零写入 (with_skill)

- **Pass Rate**: 100% (2/2)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| expect.exit_code | ✅ | all checks passed |
| script: /Users/kuang/xiaobu/spec-first/skills/spec-project-rules/evals/fixtures/scripts/check-rumor-refusal.sh | ✅ | PASS: rumor refusal（回源反证、零写入） |

### 准入三问拦截通识条目且保留项目私有规则 (with_skill)

- **Pass Rate**: 100% (2/2)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| expect.exit_code | ✅ | all checks passed |
| script: /Users/kuang/xiaobu/spec-first/skills/spec-project-rules/evals/fixtures/scripts/check-admission.sh | ✅ | PASS: admission filter（通识拒写、私有保留） |

### 无实质变化时 dry-run 产出 refresh_noop 且零写入 (with_skill)

- **Pass Rate**: 100% (2/2)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| expect.exit_code | ✅ | all checks passed |
| script: /Users/kuang/xiaobu/spec-first/skills/spec-project-rules/evals/fixtures/scripts/check-refresh-noop.sh | ✅ | PASS: refresh noop（零写入、零重写） |

### refs 脏检测后聚焦重验仍准确则零写入且不回滚用户工作区改动 (with_skill)

- **Pass Rate**: 100% (2/2)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| expect.exit_code | ✅ | all checks passed |
| script: /Users/kuang/xiaobu/spec-first/skills/spec-project-rules/evals/fixtures/scripts/check-refresh-dirty.sh | ✅ | PASS: refresh dirty（聚焦重验、零写入、用户改动保留） |

### module 更新合入知识库且 AGENTS.md 用户内容与他 skill marker 逐字节保留 (with_skill)

- **Pass Rate**: 100% (2/2)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| expect.exit_code | ✅ | all checks passed |
| script: /Users/kuang/xiaobu/spec-first/skills/spec-project-rules/evals/fixtures/scripts/check-marker-coexist.sh | ✅ | PASS: marker coexist（知识库增量合入、AGENTS.md 三层共存零改写） |

### 用户主动要求写入敏感信息时知识库正常建立且敏感值零泄漏 (with_skill)

- **Pass Rate**: 100% (2/2)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| expect.exit_code | ✅ | all checks passed |
| script: /Users/kuang/xiaobu/spec-first/skills/spec-project-rules/evals/fixtures/scripts/check-sensitive-refusal.sh | ✅ | PASS: sensitive refusal（知识库正常建立、敏感值零泄漏） |

### 单端无 shared 层仓降级为最简知识库且不虚构跨端小节 (with_skill)

- **Pass Rate**: 100% (2/2)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| expect.exit_code | ✅ | all checks passed |
| script: /Users/kuang/xiaobu/spec-first/skills/spec-project-rules/evals/fixtures/scripts/check-single-end.sh | ✅ | PASS: single end degraded（最简知识库、不虚构跨端结构） |

### 大仓走骨架先行分批增量且不留中间产物文件 (with_skill)

- **Pass Rate**: 100% (2/2)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| expect.exit_code | ✅ | all checks passed |
| script: /Users/kuang/xiaobu/spec-first/skills/spec-project-rules/evals/fixtures/scripts/check-large-repo.sh | ✅ | PASS: large repo batched（骨架先行、增量合入、零中间产物） |

### 布局不受支持时消费脚本抽样清单产出知识库并披露抽样比例 (with_skill)

- **Pass Rate**: 100% (2/2)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| expect.exit_code | ✅ | all checks passed |
| script: /Users/kuang/xiaobu/spec-first/skills/spec-project-rules/evals/fixtures/scripts/check-sampling-fallback.sh | ✅ | PASS: sampling fallback（消费脚本抽样清单、知识库覆盖跨目录、零虚构） |

