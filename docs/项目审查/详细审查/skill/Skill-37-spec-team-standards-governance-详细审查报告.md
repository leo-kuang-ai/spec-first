# Skill-37 `spec-team-standards-governance` 详细审查报告

## 1. 基本信息

| 项 | 内容 |
|---|---|
| Skill 名称 | `spec-team-standards-governance` |
| 文件路径 | `skills/spec-team-standards-governance/SKILL.md` |
| 当前行数 | 90 行 |
| entry surface | standalone skill |
| 当前 source 证据 | `docs/catalog/runtime-capabilities.md` 将其列为 standalone skill；`skills/spec-team-standards-governance/SKILL.md` 声明不可恢复 `spec-standards` |

## 2. 职责定位

该 skill 负责 source-backed team standards governance：查询 confirmed standards、初始化/提议候选、准备 promotion/deprecation、做健康审计和 eval/replay。它不是 public workflow，不生成 `spec-standards`，也不把 advisory candidates 当 hard context。

## 3. 适用与不适用场景

| 类型 | 结论 |
|---|---|
| 适用 | `docs/contracts/team-standards.md`、`docs/standards/**`、candidate evidence、standards health audit、promotion/deprecation proposal |
| 不适用 | 普通 code/doc review、implementation、PRD/plan、workflow execution、恢复 retired standards workflow |
| 边界质量 | 清晰；When To Use / When Not To Use、Hard Boundaries、Modes 三处形成 defense-in-depth |

## 4. 输入契约

输入契约较完整。source 要求读取 `docs/contracts/team-standards.md`，并在 standards selection 时先读 `docs/standards/index.md`，再按 mode-specific references 读取。缺口是 standalone direct use 默认 report/proposal-only，source mutation 必须由外层 source-edit workflow 授权，这一点依赖调用者遵循。

## 5. 执行步骤

Workflow 6 步：解析 mode、读取 team standards contract、读取 index、读取 mode references、按 Output Contract 输出、在授权时写 source。执行顺序符合“脚本准备事实、LLM 判断语义适用性”的项目角色契约。

## 6. 输出产物

Output Contract 是本 skill 的单一输出字段真相源，所有 mode 都必须输出 `mode/status/source_refs_used/fallback_mode/limitations/next_action`，并按 `query/audit`、`init/propose`、`promote/deprecate`、`eval/replay` 补充字段。质量较高。

## 7. 上下游关系

| 上游 | 下游 |
|---|---|
| 用户 standards query / audit / proposal 请求；`docs/contracts/team-standards.md`；`docs/standards/index.md` | ordinary workflow 的 standards consumption；source-edit workflow；team standards health artifacts |

## 8. 成熟度评分

| 评分项 | 分数 | 依据 |
|---|---:|---|
| 目标与边界 | 10/10 | retired workflow 禁止项明确 |
| 输入契约 | 8/10 | mode-specific reference loading 明确 |
| 执行逻辑 | 17/20 | 6 步流程清楚 |
| 判断规则 | 13/15 | confirmed active 才可 hard context |
| 输出产物 | 14/15 | Output Contract 集中 |
| 上下游衔接 | 8/10 | standalone 与 source-edit workflow 边界清楚 |
| 失败处理 | 5/5 | failure modes 表完整 |
| 证据要求 | 4/5 | `source_refs_used` 要求明确 |
| 文档化程度 | 5/5 | references map 完整 |
| 可复用与治理 | 5/5 | evals/references/source governance 完整 |
| 总分 | 89/100 | A-，团队标准 skill，仍需 outcome/eval 样例补强 |

## 9. 核心优点

- Retired workflow 边界强：明确不得恢复 `spec-standards`、`skills/spec-standards/`。
- 不把 confidence、observed、suggested、replay result 当 authority。
- Reference Loading Map 做到了 progressive disclosure。
- Output Contract 集中，避免字段散落。

## 10. 核心问题

| 问题 | 影响 | 优先级 |
|---|---|---|
| 旧详细审查未覆盖该 current source skill，本报告已补齐 | 若后续不刷新索引，历史“全量 skill 审查”结论会再次失真 | 已关闭；后续按 P1 freshness 守护 |
| standalone report/proposal-only 到 source mutation 的 handoff 依赖外层 workflow 自觉 | 可能被误用为直接改 standards 的入口 | P2 |
| eval/replay mode 有结构，但缺真实 pilot 样例在本报告中确认 | replay 可信度仍偏机制层 | P2 |

## 11. 优化建议

1. 保持本报告纳入详细审查索引后的 current coverage 口径，后续新增/删除 skill 时同步刷新。
2. 给 `audit` 和 `query` 增加最小 output eval：一个 confirmed active 命中、一个 conflict/advisory 不可 hard context、一个 index missing fallback。
3. 在 standards source-edit 工作流中复用本 skill 输出字段，确保 `source_refs_used` 与 patch preview 一一对应。

## 12. 是否建议重构

不建议重构。建议保持现有 standalone skill 形态，补 eval 和 detailed review coverage。

## 13. 最终结论

`spec-team-standards-governance` 已达到团队标准 skill 的主要结构要求。它最大的历史风险不是 source 质量，而是旧审查体系漏纳入；本报告已关闭该覆盖缺口，后续风险转为 coverage freshness 维护。
