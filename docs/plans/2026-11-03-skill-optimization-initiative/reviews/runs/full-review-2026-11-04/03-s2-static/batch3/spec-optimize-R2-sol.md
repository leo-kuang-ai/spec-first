# spec-optimize 评审（R2）

| ID | 裁决 | 证据(file:line) | 一句话依据 |
|---|---|---|---|
| D01 | pass | `skills/spec-optimize/SKILL.md:21-25,93-105` | 明确优化与普通实现、问题诊断的边界，并设有指标、范围和预算准入门。 |
| D02 | pass | `skills/spec-optimize/SKILL.md:137-156` | 区分外部证据与优化目标，并明确脚本负责数值判定、LLM/编排者负责语义与集成判断。 |
| D03 | pass | `skills/spec-optimize/SKILL.md:66-76,107-129` | 指向规范化 spec/log schema，并为 measurement-only 设置 admission、A/A、A/B 确定性门；工具保证与行为质量没有混为一谈。 |
| D04 | pass | `skills/spec-optimize/SKILL.md:158-180` | 明确阶段引用的职责划分、phase 顺序及 resume 时必须重验的边界。 |
| D05 | pass | `skills/spec-optimize/SKILL.md:11-15,141-168` | 脚本定位、holdout、dispatch 与关键决策职责可定位；开篇“parallel experiments”与后文串行默认的措辞张力见 Finding 1。 |
| D06 | pass | `skills/spec-optimize/SKILL.md:141-156,168` | 按当前能力事实限制 dispatch、隔离和并行主张；D06 按 Skill 自身能力假设评，本项没有因未运行跨模型而降级。 |
| D07 | pass | `skills/spec-optimize/SKILL.md:13-15,168-180` | 要求所有目标或明确停止、最终日志核验和未完成项披露；holdout 不自动推广旧运行证据。 |
| D08 | pass | `skills/spec-optimize/SKILL.md:11,133-139,158-180` | 按需加载阶段引用、排除常规上下文中的生成镜像与治理目录，并要求 compact 摘要。 |
| B01 | pass | `skills/spec-optimize/SKILL.md:21-25,60-65,93-105` | 正向用途、诊断/已知实现的负向路由和无输入时的澄清入口明确；内部 helper 采用 caller-owned 契约审查。 |
| B02 | fail | `skills/spec-optimize/SKILL.md:107-110`；`skills/spec-optimize/references/optimize-spec-schema.yaml:342-350` | 入口把校准模式写作 `mode:measurement-only`，但 schema 将它定义为 `measurement.calibration.mode`；按字面配置可能漏掉指定分支。 |
| B03 | pass | `skills/spec-optimize/SKILL.md:143-156,168` | 清楚写明调用不授权 dispatch、测量需独立授权、worker 不得集成/提交；上游交接也须显式请求委派。 |
| B04 | pass | `skills/spec-optimize/SKILL.md:11,133-135,158-168` | 说明源码 Skill 目录与 generated runtime 的区别及运行时上下文排除；本轮未核验宿主 runtime 投射。 |
| B05 | pass | `skills/spec-optimize/SKILL.md:107-129,154-156,172-180` | admission 拒绝、缺能力降级、resume 和日志核验都有明文处理边界。 |
| B06 | pass | `skills/spec-optimize/SKILL.md:13,168-180` | 要求 verified final log、准确报告受阻/未完事项，并将 review/knowledge 步骤与 commit/push 授权分开。 |
| X01 | pass | `skills/spec-optimize/SKILL.md:141-168,172-180` | 对并行、共享可变范围、worktree 和集成责任有显式约束；未要求另造编排能力。 |
| X02 | not-applicable | `skills/spec-optimize/SKILL.md:27-49,66-76` | 本 Skill 的职责是度量驱动优化，不负责 API/架构/版本设计；没有本次架构或版本变更对象可核。 |
| X03 | pass | `skills/spec-optimize/SKILL.md:93-105,107-129,168` | 预算、测量授权、冻结输入和候选确认边界清楚；部署/发布不在此入口的授权范围。 |
| X04 | pass | `skills/spec-optimize/SKILL.md:143-156,158-180` | 明确 worker 只能按授权启动、orchestrator 保留最终整合所有权、resume 依赖日志证据。 |

## Findings

1. **模式选择字段名不一致** — `skills/spec-optimize/SKILL.md:109-110` 与 `skills/spec-optimize/references/optimize-spec-schema.yaml:342-350`  
   Skill 写明 invocation 或 approved spec 选择 `mode:measurement-only` 时加载校准流程，但 schema 定义的字段是 `measurement.calibration.mode: measurement-only`，没有给出两种表达之间的映射。调用者若按 schema 提供配置，入口判断可能无法命中测量专用流程。  
   **最小修复建议：** 将入口描述统一为 `measurement.calibration.mode: measurement-only`，或明确 invocation 参数与 schema 字段的映射及优先级。

2. **开篇将并行表述为默认执行形态** — `skills/spec-optimize/SKILL.md:9`  
   “run parallel experiments”容易被理解为默认并行，而同一 Skill 后文要求首轮 serial，并规定并行 dispatch 需额外授权及能力事实（`skills/spec-optimize/SKILL.md:80-85,141-156`）。这会让入口承诺与实际授权/调度规则产生歧义。  
   **最小修复建议：** 将开篇改为“运行有界实验；仅在已获授权且能力满足时并行”。

## 主责深挖面发现

- **B01 入口与职责：** 正向条件和相似入口负例可定位于 `skills/spec-optimize/SKILL.md:21-25`；spec/目标输入和空输入处理见 `:60-65`。schema 字段下的 measurement-only 路由歧义已列为 Finding 1。
- **B02 输入输出：** 输入、输出、产物位置和下游消费者列于 `skills/spec-optimize/SKILL.md:27-49`；主要 schema 指针见 `:66-76`。找到的模式字段不一致已列为 Finding 1。
- **B03 授权与信任：** dispatch 授权与能力事实、测量授权、worker 与 orchestrator 分工分别可定位于 `skills/spec-optimize/SKILL.md:143-156`、`:168`。本轮只做静态审查，没有据此执行委派、测量或写操作。
- **B04 source/runtime 边界：** 上下文排除规则见 `skills/spec-optimize/SKILL.md:133-135`，bundled script 源路径约定见 `:11`。本轮没有核验 runtime 投射或 drift，因此不把它们作为已验证事实。

## 未读文件

- **消费者清单**：未能逐一读完清单中的所有文件；清单路径为 `/Users/kuang/xiaobu/spec-first/docs/plans/2026-11-03-skill-optimization-initiative/reviews/runs/full-review-2026-11-04/evidence/input-packs/spec-optimize.consumers.txt`。已用 `rg -n` 扫描其中部分测试源码，但输出过大而被截断；其余消费者内容未完整核验。**未覆盖后果：** 无法确认所有测试和生产消费者与当前 Skill 合同完全一致。
- **Skill supporting assets**：未读完 `skills/spec-optimize/README.md`、全部 evals/fixtures、全部示例 spec、`references/agents/`、`references/ce-license.txt`，以及尚未直接读完的脚本（`measurement-admission.cjs`、`parallel-probe.sh`、`experiment-worktree.sh`、`measure.sh`）。**未覆盖后果：** 无法完成所有引用资产、脚本行为、eval 预期及其与入口合同的逐项交叉核验。
- 已完整阅读入口 `skills/spec-optimize/SKILL.md`、检查表第 4 节、合同基线、消费者清单文本，以及核心 references：`spec.md`、`measurement.md`、`persistence.md`、`loop.md`、`wrap-up.md`、`measurement-only-calibration.md`、`optimize-spec-schema.yaml`、`experiment-log-schema.yaml`、`experiment-prompt-template.md`、`judge-prompt-template.md`、`usage-guide.md` 和 `decide.cjs`。`decide.cjs` 已静态阅读，未运行。

## 结论一句话

在已读的静态合同范围内，入口职责、授权边界与实验留证规则整体清晰；测量模式字段不一致和开篇并行措辞应最小修正，消费者及其余 supporting assets 尚未完成核验，结论不外推至未读范围。
