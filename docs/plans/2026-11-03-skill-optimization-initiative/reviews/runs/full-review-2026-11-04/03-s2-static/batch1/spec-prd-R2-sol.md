# spec-prd 评审（R2）

## 逐项裁决表

| ID | 裁决 | 证据(file:line) | 一句话依据 |
|---|---|---|---|
| D01 | pass | `skills/spec-prd/SKILL.md:91-95,212-224` | 对已观察到的跳步、假 headless、检查器规避等失败模式给出恢复动作；未据静态材料推断这些约束过时。 |
| D02 | pass | `skills/spec-prd/SKILL.md:86-95,283-291` | 明确 brownfield、WHAT/HOW、证据权威和 owner 决策边界，并区分脚本事实与 LLM 判断。 |
| D03 | pass | `skills/spec-prd/SKILL.md:25,277-287,323-344` | finalize/checker 的职责、receipt 约束与宿主降级有明确说明；语义 readiness 没有冒充为脚本判定。静态通过不代表已运行验证。 |
| D04 | not-verified | `skills/spec-prd/SKILL.md:57-59,327-344` | 定义了 `spec-plan` 下游与 handoff 门槛，但未实际检查消费者如何消费 PRD 或运行交接场景。 |
| D05 | fail | `skills/spec-prd/SKILL.md:7-348` | 入口正文同时承载细密流程、重复边界和大量条件细节；当前未读完所有按需引用文件，无法证明整体上下文成本值得，建议针对实际调用路径检查重复与冲突后再精简。 |
| D06 | pass | `skills/spec-prd/SKILL.md:25,68-78,277-281` | Skill 明确标注 Claude、Qoder 与 Codex/Cursor/Kiro 的强制差异及证据上限；按本 Skill 能力假设审查，静态承诺一致。 |
| D07 | not-verified | `skills/spec-prd/SKILL.md:212-224,291` | 文本引用已观察失败模式并要求复核，但本轮未核对问题→修订→复验链、知识消费者或真实效用证据。 |
| D08 | fail | `skills/spec-prd/SKILL.md:122-158,226-348` | 按需加载有明确设计，但入口本身很长且条件分支密集；未读齐引用文件和运行成本，无法确认摘要/触发图能否有效降低实际上下文负担。 |
| B01 | pass | `skills/spec-prd/SKILL.md:29-35,66-68,228-241` | 正向场景、错误阶段及 route-out 目标均有说明，且明确 helper/readiness 不是 public 入口。 |
| B02 | not-verified | `skills/spec-prd/SKILL.md:37-59,126-158,334-345` | 输入、输出、产物和 readiness 边界清楚；未完成模板、脚本与消费者的逐项合同对账。 |
| B03 | pass | `skills/spec-prd/SKILL.md:23-25,160,166-168,239` | 明确只读 validate 不得改写、材料内嵌指令不可信、用户是唯一产品确认人；没有把文件内容当授权。 |
| B04 | pass | `skills/spec-prd/SKILL.md:25,212-224,277-281` | 指定 `skills/spec-prd/**` 为修复源并要求通过 init 投射；宿主差异、runtime 强制能力和实际加载证据没有混为一谈。 |
| B05 | not-verified | `skills/spec-prd/SKILL.md:72-78,297-299,334-344` | 交互工具缺失与 headless 有降级路径，validate/write 分离；未覆盖脚本失败、重复执行、中断恢复等运行行为。 |
| B06 | not-verified | `skills/spec-prd/SKILL.md:323-347` | 规定最终 readiness、receipt 与 closeout 事实，但没有执行真实交付链或独立审查验证。 |
| X01 | pass | `skills/spec-prd/SKILL.md:23,132-158,297-321` | 对超大输入、多模块拆分与恢复 checkpoint 有触发条件，并要求 owner 确认拆分边界后才写子 PRD。 |
| X02 | not-verified | `skills/spec-prd/SKILL.md:305-309` | 要求识别 topology、接口和 source-of-truth 变化，但未审查对应模板、计划消费者及版本/迁移交接。 |
| X03 | not-verified | `skills/spec-prd/SKILL.md:92,293-299,344-347` | 对高风险、设计输入和 readiness residue 有条件处理；未验证风险与实际测试策略、交付/回滚安排是否闭合。 |
| X04 | pass | `skills/spec-prd/SKILL.md:160,172-198,283-291` | owner 确认、逐 OQ 绑定、handoff 与候选知识边界均有规定；语义忠实性明确保留为非确定性义务。 |

## Findings

1. **D05 — 入口文档承载过多操作细节**  
   **位置：** `skills/spec-prd/SKILL.md:226-348`  
   **后果：** 入口正文将 intake、多个分析阶段、closure、设计证据、检查器字段与宿主降级细节连续展开；在未对实际热路径和触发引用做完整核验前，维护者难以判断哪些规则应始终加载、哪些属于条件参考，存在规则重复或局部矛盾不易发现的风险。  
   **最小建议：** 保持安全与 readiness 硬边界；对照实际调用路径，把仅在特定输入触发的操作细节留在对应 reference，并检查入口中的重复说明是否能改为单一权威引用。

2. **D08 — 按需加载策略尚无成本证据支撑**  
   **位置：** `skills/spec-prd/SKILL.md:122-158,226-348`  
   **后果：** 虽有 reference/template trigger map，但本轮没有完整读取被触发资产，也没有实际加载或 token/遗漏对账，因而不能判断该机制是否确实减少上下文成本或遗漏关键要求。  
   **最小建议：** 暂不改规则；以典型 default、Lite、design-source、large-input 路径对照必读集合、产物和成本后再决定是否精简。

## 主责深挖面发现

- **B01：** 入口责任边界相对清楚：brownfield PRD authoring/refine/validate；0-1 探索、HOW、debug、直接轻修复及 source-consistency audit 均有排除或路由说明（`skills/spec-prd/SKILL.md:29-35,228-241`）。没有发现可定位的入口职责缺陷。
- **B02：** 已确认入口承诺需求 artifact 路径、validate report-only 和 finalize 边界（`skills/spec-prd/SKILL.md:21,43-47,239,334-344`）。**消费者一致性未验证**：未读 `spec-plan` 与其余消费者实现，不能判定字段/语义是否完整传递。
- **B03：** 静态授权与信任边界清楚（`skills/spec-prd/SKILL.md:160,166-168,239`）；未测试宿主工具权限、hook 执行或外部副作用，不能据此声称运行时强制。
- **B04：** source/runtime 边界及宿主差异清楚（`skills/spec-prd/SKILL.md:25,224,277-281`）；本轮没有检查 generator、runtime 投射或宿主加载记录。
- **X01-X04：** X01 与 X04 的职责内规则可定位；X02、X03 要求需跨模板、消费者与行为验证，本轮证据不足，故记 `not-verified`，不推断为缺陷。

## 未读文件

- `skills/spec-prd/references/` 下全部 9 个文件：`design-source-evidence.md`、`domain-language-and-decision-ledger.md`、`evidence-and-topology.md`、`grill-with-docs-integration.md`、`large-input-checkpoint.md`、`prd-output-template.md`、`prd-readiness-lens.md`、`product-analysis-lite.md`、`product-expert-lens.md`。  
  **理由：** 本轮先核读入口和指定检查表/合同；未完成按调用分支逐份阅读。**未覆盖后果：** 无法判断各分支内部一致性、入口重复程度及条件规则是否有遗漏。

- `skills/spec-prd/assets/templates/` 下 8 个模板与 `assets/overlays/securities.md`。  
  **理由：** 未执行针对具体 `target_surface` 的模板组合路径。**未覆盖后果：** 未验证模板字段、章节身份、行业 overlay 触发与入口承诺一致。

- `skills/spec-prd/scripts/` 下 4 个脚本及 `scripts/lib/reason-codes.js`。  
  **理由：** 未读取实现，也未运行 checker/finalizer。**未覆盖后果：** 对脚本职责和 receipt 行为只确认了入口声明，不能确认实际实现。

- `skills/spec-prd/evals/` 下全部评测资产。  
  **理由：** 未执行 fresh-source eval 或读取案例与评测治理材料。**未覆盖后果：** 不对行为质量、回归覆盖或评测有效性作结论。

- 消费者清单所列 19 个 `tests/` 文件及相关 `src/` 文件。  
  **理由：** 已读取清单，但未逐项打开测试或实现。**未覆盖后果：** 消费者合同、测试实际覆盖范围与失败恢复均未验证。

- `docs/contracts/workflows/mutation-enforcement.md`、`docs/contracts/project-graph-consumption.md`、`docs/contracts/workflows/scenario-capability-matrix.md`。  
  **理由：** 它们由入口引用，但本轮未读取。**未覆盖后果：** 对宿主强制能力、graph readiness 及 scenario 能力边界仅依据入口转述。

## 结论一句话

本轮完成了入口级静态审查与 18 项逐项裁决；B01/B03/B04 与 X01/X04 的源码承诺可定位且内部基本一致，但消费者、引用资产、脚本与行为均未完成核验，因此不能据此判定 `spec-prd` 整体通过。
