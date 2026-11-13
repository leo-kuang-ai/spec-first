# spec-commit 评审（R2）

| ID | 裁决 | 证据(file:line) | 一句话依据 |
|---|---|---|---|
| D01 | not-verified | `skills/spec-commit/SKILL.md:11-28` | 源码列出授权、路径隔离和提交边界，但缺少指定 references、消费者及对照证据，无法完整判断这些约束是否过度或针对真实失败。 |
| D02 | not-verified | `skills/spec-commit/SKILL.md:71-79` | 提供提交信息约定，但其项目依据及消费者实际使用情况未核验。 |
| D03 | not-verified | `skills/spec-commit/SKILL.md:115-128` | 写明逐步暂存、提交和回读检查，但缺少关联 helper reference 与消费者证据，无法判定验证承诺是否完整、一致。 |
| D04 | not-verified | `skills/spec-commit/SKILL.md:15-28` | 规定 caller 提供授权、owned paths 和隔离策略，但未能检查 caller 实际如何传递及消费这些输入。 |
| D05 | not-verified | `skills/spec-commit/SKILL.md:11-28` | 可见入口含多项边界与约束，但 references 未读，无法完成冗余、冲突和可审计性检查。 |
| D06 | pass | `skills/spec-commit/SKILL.md:32-62` | 源码对命令失败、默认分支信息缺失和已确认非默认分支作了可定位的条件处理；此处按 Skill 自身能力假设审查，不以本轮缺少运行证据判失败。 |
| D07 | not-verified | `skills/spec-commit/SKILL.md:124-128` | 源码要求保留其他暂存状态并核验提交结果，但没有可核对的复验记录、知识消费或失效条件证据。 |
| D08 | not-verified | `skills/spec-commit/SKILL.md:32-62` | 入口列出需采集的 Git 事实和默认分支回退路径；缺少实际调用与读取范围证据，无法判断上下文利用效果。 |
| B01 | pass | `skills/spec-commit/SKILL.md:11-28` | 明确限定为内部 helper，要求可见上游 handoff 授权；并明确纯状态查询不触发提交授权门禁，也不因此写入。 |
| B02 | not-verified | `skills/spec-commit/SKILL.md:15-26` | 定义 caller 授权、owned paths、exclude paths 和隔离策略等输入，但指定消费者文件未能读取，无法验证端到端输入输出一致性。 |
| B03 | pass | `skills/spec-commit/SKILL.md:15-28` | 将提交授权与分支变更授权分开；明确工具权限、脏工作区、分支名和验证成功都不构成授权，并要求排除项不提交。 |
| B04 | not-verified | `skills/spec-commit/SKILL.md:11-13` | 可见文件位于 `skills/` 源目录，但未能读取源到 runtime 的生成/投射路径或相关消费者，无法确认完整 source/runtime 边界。 |
| B05 | not-verified | `skills/spec-commit/SKILL.md:22-26` | 对缺少隔离策略、默认分支未解析和失败分支创建有停止要求；共享 precommit/recovery reference 未读，无法完整判断部分成功、中断及重复执行处理。 |
| B06 | not-verified | `skills/spec-commit/SKILL.md:115-128` | 源码要求回读实际提交消息、路径及提交后状态，但未能检查消费者回传与闭环处理，不能据此判断整体交付可追溯。 |
| X01 | not-applicable | `skills/spec-commit/SKILL.md:81-88` | 此 helper 的职责是提交组成，不负责多模块需求分解或长任务编排；源码仅要求轻量按文件分组，未声明承担 X01 所述规划职责。 |
| X02 | not-applicable | `skills/spec-commit/SKILL.md:7-9` | 此 helper 不负责 API、架构或版本变更设计；源码将职责限定为已授权变更的提交组成。 |
| X03 | not-applicable | `skills/spec-commit/SKILL.md:28` | helper 明确不拥有 push、PR 创建/更新或发布；其范围是授权提交检查点，不承担高风险交付/部署职责。 |
| X04 | not-verified | `skills/spec-commit/SKILL.md:15-28` | caller-owned handoff 和路径范围有静态约定，但无法检查消费者是否保留授权来源、交接信息与限制；因此无法完整判定协作场景。 |

## Findings

1. **指定消费者证据未完成读取，无法确认关键合同是否被调用方正确兑现。**  
   位置：`skills/spec-commit/SKILL.md:15-26`  
   后果：入口要求上游提供 `commit_authorization`、`branch_mutation_authorization`、owned paths、排除路径及已验证的隔离策略；若调用方没有同等输入/授权约定，helper 的安全边界可能无法端到端成立。本轮无法据此确认存在实现缺陷。  
   最小修复建议：补齐消费者源文件的可读路径后，逐个核对授权来源、字段传递与 owned/excluded paths 的使用；在该证据取得前保持为未验证，不将其登记为已确认缺陷。

2. **依赖的恢复边界未完成读取，无法评价失败后的状态保全承诺。**  
   位置：`skills/spec-commit/SKILL.md:26`  
   后果：入口将隔离与恢复边界委托给 `skills/spec-commit-push-pr/references/commit-and-push.md`；该文件及同目录其他相关 references 本轮未读，故无法判断提交失败或部分成功后的恢复操作是否与入口规定一致。  
   最小修复建议：在具备文件读取条件后核对该 reference 与 `SKILL.md:115-124` 的 staging/index 保全规则，并记录一致性证据。

## 主责深挖面发现

- **B01：** 内部 helper 身份和调用边界明确；`user-invocable: false`（`skills/spec-commit/SKILL.md:4`），只允许有可见上游授权的 public workflow 委派（第 15 行）。纯状态查询与提交意图被区分（第 22 行）。消费者未读，因此只能确认入口自述，不能确认宿主或调用方路由行为。
- **B02：** 输入约定包括授权状态、owned paths、排除路径、unit context 与隔离策略（第 15-26 行）；预期输出包括阻塞原因、提交信息、提交路径与提交后状态（第 22、115-128 行）。缺消费者及相关 references，端到端合同判定未验证。
- **B03：** 授权拆分与禁止从环境事实推导授权的静态约定明确（第 15-28 行）；暂存前分支检查及提交独立授权要求可定位（第 11-13、90-104 行）。未发现源码内部直接冲突。
- **B04：** 评审对象是 `skills/spec-commit/SKILL.md` 源文件，但指定消费者清单和生成投射链未完成核查；因此无法确认 runtime 投射、新鲜源码加载或宿主支持范围。

- **X01：not-applicable。** 本 helper 不负责任务分解、依赖排序或长任务编排，依据 `skills/spec-commit/SKILL.md:7-9,81-88`。
- **X02：not-applicable。** 本 helper 不设计 API、架构或版本迁移，依据 `skills/spec-commit/SKILL.md:7-9,28`。
- **X03：not-applicable。** 本 helper 不拥有 push、PR 或发布，依据 `skills/spec-commit/SKILL.md:28`；其提交副作用仍受 B03 授权边界审查。
- **X04：not-verified。** 存在 caller-owned handoff 与已授权路径约定（`skills/spec-commit/SKILL.md:15-28`），但消费者未读，无法判定交接是否保留来源、限制和新鲜度。

## 未读文件

- `/Users/kuang/.codex/AGENTS.md` — 尝试读取时宿主未授予访问权限；未覆盖其中的用户级执行指引。
- `/Users/kuang/xiaobu/spec-first/docs/plans/2026-11-03-skill-optimization-initiative/reviews/runs/full-review-2026-11-04/evidence/input-packs/spec-commit.consumers.txt` — 尝试访问用户指定的绝对路径时未获读取权限；未覆盖清单内容及其列出的任何 `tests/`、`src/` 消费者文件，导致 B02、B04、B05、B06 及 D01–D05/D07–D08 的消费者侧证据不完整。
- `skills/spec-commit/` 同目录所有 `references/`、`scripts/`、`templates/`、`evals/` 文件 — 本轮未能枚举并读取目录内容；未覆盖被入口委托的恢复规则、脚本/template 行为与已有评测材料，因此 D01、D03–D05、D07–D08、B02、B05、B06 不能据入口文案单独判通过。
- `skills/spec-commit-push-pr/references/commit-and-push.md` — `spec-commit` 明确引用此文件作为 precommit/recovery 边界（`skills/spec-commit/SKILL.md:26,124`），但未读取；未覆盖提交隔离及失败恢复规则。

## 结论一句话

在已读入口源码范围内，内部 helper 定位与授权分层有清晰静态承诺；因消费者清单及被引用的恢复材料未能读取，本轮不能给出全覆盖通过结论，相关维度保留未验证。
