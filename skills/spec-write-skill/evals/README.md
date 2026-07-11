# Trigger Eval Maintainer Guide

本目录是维护者证据，不投影到 runtime。`trigger-cases.json` 是 route cases 的唯一 source；不要复制维护第二套 cases。

- `evidence_level: L1 structural` 表示 fixture/contract 通过不等于模型行为改善。
- `node skills/spec-write-skill/scripts/export-trigger-evals.cjs --format skill-creator` 可输出 `skill-creator` 的 `evals.json` 形状。
- `node skills/spec-write-skill/scripts/export-trigger-evals.cjs --format yao` 可输出 Yao trigger evaluator 的三 bucket 形状。
- 导出只解决 schema portability，不产生 semantic、baseline 或 field evidence。
- 新增案例时同步检查 `expected_trigger`、`expected_effect`、`expected_layer_result`、`reason_code`、`forbidden_signals` 和 `source_refs`，运行 `npm run test:eval-fixtures`。
