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
3. canonical case set 中全部 behavior cases 的 fresh-source output；
4. fixed pre-candidate regression；
5. matched native/candidate-ablation output review 与固定 `old-full` regression；
6. canonical case set 中全部 fresh host route results、默认加载 Markdown bytes、tokens、duration、redaction 与最终 gate calculation。

新 promotion bundle root 使用 `spec-write-skill.promotion-evidence/v2` 的 `manifest.json`；validator 继续支持已发布的 v1 bundle，v1 固定 8 个 behavior cases 并保持原 gate 语义，不能用新规则反向改写历史证据。三组 assembly 固定为：

- `native`：一份 `common_guardrails` + 一份 `native_creator`；
- `candidate-ablation`：一份 `common_guardrails` + 一到多份 `portable_core` slice；
- `candidate-full`：只加载一份完整 candidate source，不再次注入 common guardrails。

在 v2 中，绑定 `case_set` 中的每个 behavior case 都必须由 `candidate-full` 至少使用两个不同 repeat 编号双跑，且每个 declared arm 至少有一次 run。固定 `old-full` arm 使用 `baseline_full` 单文件 assembly，承接 pre-candidate regression；它不替代 candidate-full 全覆盖或 native/candidate-ablation 对照。Manifest 的 `coverage` 必须逐字枚举绑定 `case_set` 中的全部 behavior cases 与 route queries，并标出双跑的 comparison/regression cases；v2 case set 可随 canonical fixture 增长，但必须保留至少 8 个 behavior cases 和 12–16 个 route queries 的确定性质量地板。每次 behavior run 保存 prompt、output、machine check、blind reviewer 四个相对路径和 SHA-256；reviewer artifact 必须声明 `blind=true`、`independent=true`。每条 route run 保存 prompt、output、machine check。所有 run 记录 model、host、route high-risk misroute、redaction status、input/output/total tokens、duration 与 verdict；machine/reviewer artifact 内的 verdict 必须与 manifest 一致，route high-risk misroute 必须由 machine-check artifact 携带并与 case 声明一致。Reviewer 不接收 intended fix。

Manifest 还必须：引用 Gate 0 原始 evidence，并把“candidate 是否提供额外收益”的语义裁决明确为 `pass|fail|not_run`；测量实际 default context artifact 的 Markdown bytes（不得超过 20 KiB）；由 native/candidate-ablation 的 run tokens 推导 input token delta。delta 超过 20% 时需记录可见质量或安全收益理由。`not_run` 是结构有效但不可 promotion 的结果，不能进入 U4。

`gate_calculation` 只把 `candidate-full` 的 behavior machine/reviewer failure 与 fresh route failure 计为候选 hard failure；native、candidate-ablation、old-full 的单项失败是比较输入，不直接阻断。它们必须由 `comparative_verdicts.matched_ablation` 和 `comparative_verdicts.old_regression` 两个带 hash 的语义结论收口，任一 `fail|not_run` 都使最终 gate 对应失败或未运行。

验证命令：

```bash
node skills/spec-write-skill/evals/validate-promotion-evidence.cjs \
  docs/validation/<date>-spec-write-skill-promotion \
  --json
```

Manifest 缺字段、artifact hash drift、相对路径逃逸、symlink、arm 重复注入、固定旧版 arm/完整 route 或 behavior coverage 缺失、重复 repeat、双跑缺失、非盲审 reviewer、未测 context/token countermetric、artifact/manifest verdict 漂移或 gate calculation 不一致均返回 exit 1。Host dispatch 未授权或不可用时，semantic runs 记录 `not_run`；不得用本目录的 structural-only fixture 代替，也不得进入 U4 promotion。

CLI 只有在 bundle 结构有效且最终 `result=pass` 时返回 exit 0；结构有效但语义结果为 `fail|not_run` 仍返回 exit 1。`candidate_source` 必须与 `candidate-full` assembly 内容 hash 相同，`baseline_source` 必须与 `old-full` assembly 内容 hash 相同，防止声明的 promotion source 与实际评测 source 脱节。
