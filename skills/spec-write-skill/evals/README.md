# Trigger Eval Maintainer Guide

本目录是维护者证据，不投影到 runtime。`trigger-cases.json` 是 route cases 的唯一 source；不要复制维护第二套 cases。

- `evidence_scope: structural-only` 表示 fixture/contract 通过不等于模型行为改善。
- `node skills/spec-write-skill/evals/export-trigger-evals.cjs --format skill-creator` 可输出 `skill-creator` 的 `evals.json` 形状。
- `node skills/spec-write-skill/evals/export-trigger-evals.cjs --format yao` 可输出 Yao trigger evaluator 的三 bucket 形状。
- 导出只解决 schema portability，不产生 semantic、baseline 或 field evidence。
- 新增案例时同步检查 `expected_trigger`、`expected_effect`、`expected_layer_result`、`reason_code`、`forbidden_signals` 和 `source_refs`，运行 `npm run test:eval-fixtures`。

## Promotion Protocol

Promotion 不是 fixture pass。执行者必须分别记录：

1. retrospective native creator Gate 0；
2. `route_queries` 的 fresh host route result；
3. 8 个 behavior cases 的 fresh-source output；
4. fixed pre-candidate regression；
5. matched native/candidate-ablation output review；
6. tokens、duration、redaction 与最终 gate calculation。

Bundle root 使用 `spec-write-skill.promotion-evidence/v1` 的 `manifest.json`。三组 assembly 固定为：

- `native`：一份 `common_guardrails` + 一份 `native_creator`；
- `candidate-ablation`：一份 `common_guardrails` + 一到多份 `portable_core` slice；
- `candidate-full`：只加载一份完整 candidate source，不再次注入 common guardrails。

每个 `promotion_case=true` 的 case/arm 至少使用两个不同 repeat 编号双跑，且每个 declared arm 至少有一次 run。每次 run 保存 prompt、output、machine check、blind reviewer 四个相对路径和 SHA-256，并记录 model、host、route high-risk misroute、redaction status、input/output/total tokens、duration 与 verdict；machine/reviewer artifact 内的 verdict 必须与 manifest 一致，route high-risk misroute 必须由 machine-check artifact 携带并与 case 声明一致。Reviewer 不接收 intended fix。

验证命令：

```bash
node skills/spec-write-skill/evals/validate-promotion-evidence.cjs \
  docs/validation/<date>-spec-write-skill-promotion \
  --json
```

Manifest 缺字段、artifact hash drift、相对路径逃逸、symlink、arm 重复注入、重复 repeat、双跑缺失、artifact/manifest verdict 漂移或 gate calculation 不一致均返回 exit 1。Host dispatch 未授权或不可用时，semantic runs 记录 `not_run`；不得用本目录的 structural-only fixture 代替，也不得进入 U4 promotion。
