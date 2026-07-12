# U9 Continue-Trial 收口

## 可执行裁决

- Verdict：`continue_trial`。
- 公共入口继续为 opt-in `spec-app-consistency-audit`。
- 支持路径继续为 `mode:headless base:<ref>`。
- U6 integration 未获授权；Gate C 为 `not_applicable: integration_not_authorized`。
- 收口 baseline 的 `skills/spec-code-review` tree：`ac243c4358d92bb7ccbbe9cff13b3f72408ff501`。
- 不暗示已执行 build、simulator、device、runtime verification 或产品 mutation。

## 保留的 candidate consumers

| Artifact | Producer | Consumer |
| --- | --- | --- |
| `app-behavior-model.v1` | host semantic compiler + normalizer | proof-obligation builder、counterexample stage、report context |
| `app-proof-obligations.v1` | deterministic builder + semantic assessment | counterexample stage、adjudication、verification compiler、report |
| `app-counterexamples.v1` | isolated semantic search + normalizer | fresh adjudication、verification compiler、report |
| `issues.v1` adjudication extensions | fresh adjudicator + evidence gate | verification compiler、report |
| `verification-plan.v1` | host verification compiler + validator | report 与未来独立 executor |

旧固定专家 prompts 继续作为 source-only compatibility/history 输入，由 checked-in ECC source lock 引用；它们不在公共 hot path 中，也不是 candidate artifact producer。删除这些文件需要独立的 ECC lock migration，不影响当前 candidate consumer chain 的明确性。

## 重评条件

最迟于 2026-08-12，仅在以下条件全部满足后重评：

1. 3–5 个带 materialized source 的代表性历史/真实 App 变更；
2. 三臂使用相同 evidence，且至少有两名独立盲审者；
3. 一名独立 App 开发者能调用公共入口、解释限制并采取正确后续动作；
4. 增量 confirmed/pre-runtime-fixable 价值对应可接受的审查、延迟和 token 成本；
5. 无高影响误报或 permission violation。

在此之前，不得新增默认 Code Review consumer、扩展 prompt/schema surface 或发布效果声明。
