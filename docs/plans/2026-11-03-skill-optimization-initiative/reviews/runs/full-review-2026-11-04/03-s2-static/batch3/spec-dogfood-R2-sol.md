# spec-dogfood 评审（R2）

## 逐项裁决表

| ID | 裁决 | 证据(file:line) | 一句话依据 |
|---|---|---|---|
| D01 | pass | `skills/spec-dogfood/SKILL.md:46-53, 66-83`; `skills/spec-dogfood/references/phases.md:104-117, 119-142` | 浏览器执行交给既有 owner，分离分支、浏览器、副作用、修复、提交与落地授权；必要边界清楚且可定位。 |
| D02 | pass | `skills/spec-dogfood/SKILL.md:10-14, 46-63`; `skills/spec-dogfood/references/phases.md:62-66, 72-100, 113-117` | 约束针对 diff 范围、完整用户旅程、persona 与验收标准；不把通用流程冒充项目事实。 |
| D03 | pass | `skills/spec-dogfood/SKILL.md:48-53`; `skills/spec-dogfood/references/phases.md:104-117, 127-142` | owner 拒绝、未运行、外部验证缺失及测试失败均须保留为未运行或阻塞，不能伪装通过；该门槛是 prose 约定。 |
| D04 | pass | `skills/spec-dogfood/SKILL.md:28-44, 55-64`; `tests/unit/mutation-authority-contracts.test.js:40-67`; `tests/unit/plugin-modules.test.js:381-405` | 输入、产物与 `spec-worktree`、`spec-commit`、下游审查/复用关系明确，消费者测试核对授权及 caller 边。 |
| D05 | pass | `skills/spec-dogfood/SKILL.md:18-44, 66-99`; `skills/spec-dogfood/references/phases.md:19-26, 144-149` | 入口摘要将程序主体交给 phases，报告结构交给模板；关键规则引用可追踪，未发现妨碍执行的内在冲突。 |
| D06 | pass | `skills/spec-dogfood/SKILL.md:46-53, 55-64`; `skills/spec-dogfood/references/phases.md:100-117` | 能力假设明确为可调用的 `spec-test-browser` owner；缺失时停止并披露限制，没有无依据宣称跨模型能力。 |
| D07 | pass | `skills/spec-dogfood/SKILL.md:32-35, 55-64`; `skills/spec-dogfood/references/phases.md:17-26, 133-148` | 报告作为可恢复记录，修复要有回归证据，可复用学习由 `spec-compound` 决定是否收录；维护闭环可定位。 |
| D08 | pass | `skills/spec-dogfood/SKILL.md:16-20, 97-100`; `skills/spec-dogfood/references/phases.md:7-18, 24-26` | 规定参数保留、按阶段加载程序、报告增量更新；静态上能判断必要输入和恢复信息的承载位置。 |
| B01 | pass | `skills/spec-dogfood/SKILL.md:22-26, 46-64`; `skills/spec-dogfood/evals/cases/polish-request-routes-out.yaml:4-5, 18-27`; `skills/spec-dogfood/evals/cases/r2-code-review-routes-out.yaml:4-9, 17-29` | 正向适用场景、相似入口负例和内部 owner 定位明确；eval 对 UI polish 与静态审查分别要求路由到相邻入口。 |
| B02 | pass | `skills/spec-dogfood/SKILL.md:16-20, 28-44, 46-53`; `skills/spec-dogfood/references/phases.md:28-66, 68-100`; `docs/plans/2026-11-03-skill-optimization-initiative/core/08-skill-contract-protocol.md:27-29, 430-452` | 参数、前置条件、阶段产物与报告输出一致；contract 文档主要覆盖主链路，不要求 dogfood 伪造该协议。 |
| B03 | pass | `skills/spec-dogfood/SKILL.md:66-83`; `skills/spec-dogfood/references/phases.md:14-17, 104, 111, 117, 121-142`; `tests/unit/mutation-authority-contracts.test.js:40-68` | 分支、浏览器效果、修复、提交、落地授权相互独立；无授权时阻断对应副作用，并允许继续独立场景。 |
| B04 | pass | `skills/spec-dogfood/SKILL.md:46-53`; `skills/spec-dogfood/references/phases.md:14-16, 30-60, 104-111` | source skill 调用内部 browser owner，不直接操作浏览器；隔离交给 `spec-worktree`，PR base 与目标身份有明确核验规则。 |
| B05 | pass | `skills/spec-dogfood/SKILL.md:37-41, 50-53, 97-100`; `skills/spec-dogfood/references/phases.md:17-26, 104, 111, 117, 129-142` | 工具缺失、阻塞、失败、dirty 状态和中断恢复都有处理路径；阻塞场景不会在恢复时自动重排，未知副作用不盲目重试。 |
| B06 | pass | `skills/spec-dogfood/SKILL.md:10-14, 28-44`; `skills/spec-dogfood/references/phases.md:92-100, 127-149`; `skills/spec-dogfood/references/dogfood-report-template.md:31-43, 45-85` | 旅程、矩阵、修复、验证、报告及最终 readiness 有可追溯出口；未完成和测试失败需如实保留。 |
| X01 | pass | `skills/spec-dogfood/SKILL.md:40-44, 97-100`; `skills/spec-dogfood/references/phases.md:14-26, 68-100, 108-140` | 适用于多场景/长任务：先按 flow 分解并排序，维护逐场景 ledger，区分独立阻塞项并支持恢复。 |
| X02 | not-applicable | `skills/spec-dogfood/SKILL.md:28-35, 66-83`; `skills/spec-dogfood/references/phases.md:28-60, 119-138` | 本 Skill 的静态职责是现有分支的浏览器 QA 与有限小修复，不定义 API/架构/版本接口；该项不适用，不推断其覆盖此类变更。 |
| X03 | pass | `skills/spec-dogfood/SKILL.md:66-83`; `skills/spec-dogfood/references/phases.md:104, 111, 117, 121-142`; `skills/spec-dogfood/references/dogfood-report-template.md:65-77, 83-85` | 对外部交互、人类确认、高影响修复、自动测试失败均有授权、阻塞或非就绪处理；不擅自扩展到发布操作。 |
| X04 | pass | `skills/spec-dogfood/SKILL.md:32-35, 55-64`; `skills/spec-dogfood/references/phases.md:17-26, 133-148`; `skills/spec-dogfood/references/dogfood-report-template.md:79-85` | 报告携带来源、状态、验证、决策与恢复信息；可复用学习显式交接给 `spec-compound`，不自动提升为已确认知识。 |

## Findings

1. **P2 — eval 脚本的宽松字符串判定可能把错误输出判为通过。**  
   位置：`skills/spec-dogfood/evals/fixtures/scripts/check-owner-unavailable-stop.sh:7-14`、`skills/spec-dogfood/evals/fixtures/scripts/check-trunk-reject.sh:6-13`。  
   后果：owner-unavailable 检查以 `hit_rt or hit_stop` 判定，输出只提到 `spec-runtime-setup` 或单独说“停止”即可通过；trunk 检查只需包含 `main`、`diff` 等任一词即可通过。eval 因此可能接受没有表达预期拒绝/阻断语义的回答。  
   最小修复建议：收紧脚本判据，使其同时要求目标情形与对应的停止/拒绝含义，至少避免由单个泛化词命中通过。

2. **保持现状成立：**`spec-dogfood` 对浏览器动作与产品修改的授权边界静态明确；无依据把当前评审无法执行浏览器或成本未测列为缺陷。证据：`skills/spec-dogfood/SKILL.md:66-83`、`skills/spec-dogfood/references/phases.md:104-117, 121-142`。

## 主责深挖面发现

- **入口职责（B01）：**入口定义为 diff 范围的分支 dogfood，不是全应用探索或静态审查；明确列出 UI polish、普通 browser smoke、代码审查、计划等相似入口的边界。内部 browser 执行由 `spec-test-browser` 承担，隔离由 `spec-worktree` 承担。证据：`skills/spec-dogfood/SKILL.md:22-26, 46-64`。
- **输入输出（B02）：**输入含目标、diff、开发服务器惯例、persona/策略与浏览器结果；输出含报告、flow、矩阵、获授权的小修复及 readiness verdict。phase 文档把 PR 的 base/head 身份和目标 checkout 对齐要求写明。证据：`skills/spec-dogfood/SKILL.md:28-44`、`skills/spec-dogfood/references/phases.md:28-60, 144-149`。
- **授权与信任（B03）：**五种授权分开；分支选择不等于授权，dogfood 请求不等于修复授权；持久化/外部/未知浏览器效果需授权。对未授权场景要求报告阻塞并继续独立工作。证据：`skills/spec-dogfood/SKILL.md:66-83`、`skills/spec-dogfood/references/phases.md:117, 127-140`。
- **source/runtime 与宿主（B04）：**入口把浏览器控制交给 `spec-test-browser` 的 pipeline，并禁止直接调用浏览器 CLI 或另设执行路径；无 owner 时有明确停止指引。隔离通过 caller-owned `spec-worktree` 契约，且消费者测试覆盖相关投射边。证据：`skills/spec-dogfood/SKILL.md:46-53, 55-64`、`tests/unit/plugin-modules.test.js:381-405`。
- **四类扩展场景（X01-X04）：**长任务有场景 ledger 和恢复规则；架构/API 变更不属于该 Skill 的接口定义职责（X02 不适用）；高风险/外部效果由授权与验证路径控制；跨会话通过报告恢复并将候选学习交给 `spec-compound`。证据：`skills/spec-dogfood/references/phases.md:17-26, 117-142, 144-149`。

## 未读文件

- `skills/spec-dogfood/scripts/`：目录不存在；未覆盖 Skill 自有执行脚本，当前入口也未声称存在此类脚本。
- `skills/spec-dogfood/evals/fixtures/repos/mini-ledger/**`：未读取 fixture 仓库文件；因此未核验 eval 场景 fixture 本身的 git/应用结构与描述是否一致。
- `skills/spec-dogfood/evals/fixtures/scripts/` 中除 `check-owner-unavailable-stop.sh` 和 `check-trunk-reject.sh` 外的文件：未读取；无法评估其余 fixture helper 的判定逻辑。
- 消费者清单列出的四个测试文件均已读取：`tests/unit/ce-localization-round-1-remediation-contracts.test.js`、`tests/unit/dispatch-authorization-matrix-contracts.test.js`、`tests/unit/mutation-authority-contracts.test.js`、`tests/unit/plugin-modules.test.js`；第五个 `tests/unit/spec-worktree-contracts.test.js` 也已读取。
- 消费者清单未列 `src/` 文件；本轮未扩大为完整实现层调查，故不据此声称实际运行行为或 runtime 投射已独立验证。

## 结论一句话

静态合同整体可定位且边界一致；确认一项 eval oracle 过于宽松的问题，fixture 实际结构及未读 helper 的覆盖仍有限。
