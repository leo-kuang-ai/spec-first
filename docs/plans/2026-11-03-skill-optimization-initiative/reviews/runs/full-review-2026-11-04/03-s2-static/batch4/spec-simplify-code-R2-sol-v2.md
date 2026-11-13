# spec-simplify-code 评审（R2）

## 逐项裁决表

本轮仅裁决 `structure_contract` 静态合同，源码版本为 `5b59293bb1aecb40c4894549a89f8b045dfa40fe`。已完整读取技能包内全部 24 个受版本管理文件、指定的三个消费者测试、检查表及合同基线，并补读实际 LFG 调用方和 worker dispatch owning contract。未运行测试或行为评测；以下 pass 不代表行为质量或收益已经验证。

| ID | 裁决 | 证据(file:line) | 一句话依据 |
|---|---|---|---|
| D01 | pass | `skills/spec-simplify-code/SKILL.md:79`；`skills/spec-simplify-code/references/personas/code-quality-reviewer.md:13` | 等价性、安全检查和防过度简化约束具有明确风险依据，不是以模型能力不足为前提的无差别步骤堆叠。 |
| D02 | pass | `skills/spec-simplify-code/references/personas/code-reuse-reviewer.md:8`；`skills/spec-simplify-code/references/test-value-lens.md:5` | 提供 provider 保证、序列化等价性及测试价值等领域判断依据，工具取证与语义判断分工合理。 |
| D03 | pass | `skills/spec-simplify-code/SKILL.md:89`；`skills/spec-simplify-code/SKILL.md:91`；`skills/spec-simplify-code/SKILL.md:98` | 静态承诺明确要求实际检查、证据保鲜、失败披露及针对性修复或回退；这些是 prose 义务，不是运行时硬强制。 |
| D04 | fail | `skills/spec-simplify-code/SKILL.md:22`；`skills/spec-lfg/references/review-followup.md:14` | 默认 Git 范围只取分支提交差异，与 LFG 明确保留未提交实现的交接不匹配，可能漏掉本轮全部实现。 |
| D05 | pass | `skills/spec-simplify-code/SKILL.md:44`；`skills/spec-simplify-code/SKILL.md:65`；`skills/spec-simplify-code/SKILL.md:108` | 入口组织清晰，三类 rubric 外置，测试价值 lens 条件加载，汇总口径可定位且不以删行数代替价值。 |
| D06 | pass | `skills/spec-simplify-code/SKILL.md:57`；`skills/spec-simplify-code/SKILL.md:71` | 对能力未知、模型覆盖不支持和并发不明确均有诚实降级，不依赖固定模型或宿主 primitive 名称。 |
| D07 | pass | `skills/spec-simplify-code/evals/cases/safety-check-preserved.yaml:8`；`skills/spec-simplify-code/evals/fixtures/scripts/check-safety-preserved.sh:58` | 具有针对证明测试保护、安全行为和 Git 状态的维护用例与可定位 oracle；本技能不承担自动知识晋升职责。 |
| D08 | pass | `skills/spec-simplify-code/SKILL.md:27`；`skills/spec-simplify-code/SKILL.md:42`；`skills/spec-simplify-code/SKILL.md:67` | 先排除无收益范围，消费 caller 已有证据，并要求读取完整 rubric 而非凭记忆缩写。 |
| B01 | pass | `skills/spec-simplify-code/SKILL.md:3`；`skills/spec-simplify-code/SKILL.md:13`；`skills/spec-simplify-code/SKILL.md:17` | 简化、只读建议和缺陷请求分流清楚，caller-owned 调用返回 caller，不自行接管提交或发布。 |
| B02 | fail | `skills/spec-simplify-code/SKILL.md:19`；`skills/spec-lfg/SKILL.md:42`；`skills/spec-lfg/references/review-followup.md:14` | proof 输入与输出设计基本完整，但范围解析没有纳入实际消费者交付的未提交工作树变更。 |
| B03 | fail | `skills/spec-simplify-code/SKILL.md:57`；`skills/spec-simplify-code/SKILL.md:59`；`docs/contracts/workflows/worker-dispatch-capability.md:37` | 已区分修改授权与派发授权，但派发路径未接入独立数据授权、worker 修改禁令及调用后副作用观察要求。 |
| B04 | pass | `skills/spec-simplify-code/SKILL.md:27`；`skills/spec-simplify-code/SKILL.md:35`；`skills/spec-simplify-code/SKILL.md:37` | 排除生成资产清理，禁止跨 runtime ownership 合并，保留刻意重复的 package-local runtime 资产；不宣称已验证宿主投射。 |
| B05 | fail | `skills/spec-simplify-code/SKILL.md:69`；`docs/contracts/workflows/worker-dispatch-capability.md:106` | 容量错误后的排队重试没有次数、时间或耗尽出口，与 owning contract 的有界等待要求不一致。 |
| B06 | pass | `skills/spec-simplify-code/references/personas/code-quality-reviewer.md:17`；`skills/spec-simplify-code/SKILL.md:77`；`skills/spec-simplify-code/SKILL.md:104` | finding 定位、误报跳过、修复后验证、证明材料回传及未完成披露均有明确静态义务。 |
| X01 | fail | `skills/spec-simplify-code/SKILL.md:35`；`skills/spec-simplify-code/SKILL.md:69`；`skills/spec-simplify-code/SKILL.md:95` | 跨模块影响检查和测试扩围已有约束，但长期零容量时无有界恢复出口；未提交多模块实现也受范围遗漏影响。 |
| X02 | pass | `skills/spec-simplify-code/SKILL.md:79`；`skills/spec-simplify-code/references/personas/code-quality-reviewer.md:13` | 适用于涉及 API/架构的清理，但只允许等价变换，公共兼容面删除需要独立证据和授权；不要求该技能自行建立 ADR 或迁移体系。 |
| X03 | pass | `skills/spec-simplify-code/SKILL.md:81`；`skills/spec-simplify-code/SKILL.md:83`；`skills/spec-simplify-code/SKILL.md:98` | 高风险代码清理明确保护安全检查、证明测试及失败回退，不将清理升级为部署或发布授权。 |
| X04 | pass | `skills/spec-simplify-code/SKILL.md:11`；`skills/spec-simplify-code/SKILL.md:42`；`skills/spec-simplify-code/SKILL.md:104` | 协作交接包含 owner、来源、已定决策、证明路径、新鲜度及限制，并禁止把 inline lens 宣称为独立评审。 |

## Findings

### F1 · P1：默认分支差异遗漏 caller 留在工作树中的实现

- **位置：** `skills/spec-simplify-code/SKILL.md:22`；消费者证据为 `skills/spec-lfg/references/review-followup.md:14`。
- **事实与触发条件：** 有可用 base ref 时，入口默认采用 `git diff origin/main...` 一类分支提交差异，只有没有 upstream/base 时才使用 `git diff HEAD`。然而 LFG 明确要求前序实现和本步清理保持未提交。
- **后果：** 当实现完全位于 staged/unstaged 工作树中、当前 HEAD 与 base 相同时，默认范围为空，技能可能询问“简化什么”而不是消费已交付实现；存在历史提交时，则可能只清理历史提交而遗漏本轮修改。
- **最小修复建议：** 默认范围合并 base→HEAD 的提交差异与 HEAD→当前工作树的 staged/unstaged 差异，并保持 caller 授权路径限制；不要仅用 `git diff HEAD` 替换，否则会反向遗漏已提交变更。
- **复验建议：** 增加“base 存在且只有未提交实现”和“提交差异与工作树差异同时存在”两个消费者合同场景。

### F2 · P1：worker 派发只检查一般授权，未完整消费独立副作用边界

- **位置：** `skills/spec-simplify-code/SKILL.md:57`、`skills/spec-simplify-code/SKILL.md:59`、`skills/spec-simplify-code/SKILL.md:77`。
- **合同依据：** `docs/contracts/workflows/worker-dispatch-capability.md:37`、`:39`、`:85`、`:90`。
- **事实与触发条件：** 当前入口在用户授权派发且找到唯一 eligible generic worker 后，要求发送完整 diff/文件集；但未引用 owning contract，也未明确要求核对 provider trust domain、独立外发授权、只读 mutation scope 和调用前后状态观察。三个 persona 文件规定的是评审任务，不是可核验的副作用禁令。
- **后果：** 对符合通用 worker 能力但属于 external/unknown trust domain 的候选，一般派发授权可能被错误用于发送源码；worker 意外修改文件时，也没有规定先阻断该结果，再进入 findings 聚合。
- **最小修复建议：** 按需加载现有 worker dispatch owning contract，不重复建立协议；本步固定声明 reviewer 的 `mutation_scope: forbidden`，核对独立数据授权，观察调用前后相关状态，未证明无越界时不得消费结果。
- **复验建议：** 增加“派发获准但外发未获准”和“reviewer 返回 finding 同时修改文件”的负例。现有 `tests/unit/dispatch-authorization-matrix-contracts.test.js:308` 主要检查词汇存在，不能覆盖这两类缺口。

### F3 · P2：容量退避缺少耗尽条件

- **位置：** `skills/spec-simplify-code/SKILL.md:69`。
- **合同依据：** `docs/contracts/workflows/worker-dispatch-capability.md:106`。
- **事实与触发条件：** 指令要求容量错误时保持 reviewer 排队并等待空位重试，但没有规定等待时限、尝试次数或零容量耗尽后的处理。“Bounded dispatch”标题和同时运行数量限制，不等于重试过程有界。
- **后果：** 持续零容量或槽位不释放时，任务没有可定位的终止/降级出口，三个 lens 的完成和 caller 返回可能无限等待。
- **最小修复建议：** 复用 owning contract 的有界等待要求，给出预算耗尽条件及 `dispatch_backpressure_exhausted`，随后 serial/inline 完成尚未完成的 lens；不得伪称已获得独立评审覆盖。
- **复验建议：** 增加连续容量拒绝场景，检查能在预算内返回完整 lens 覆盖和真实降级原因。

## 主责深挖面发现

- **B01——保持现状成立。** 只读建议不产生修改授权，缺陷请求退出至 `spec-debug`，docs/generated/vendor 等无收益范围提前结束，边界见 `skills/spec-simplify-code/SKILL.md:13`、`:17`、`:27`。不应为统一流程而强制接入 PRD、Tasks 或发布尾流程。
- **B02——主要问题是范围交接，不是缺 YAML。** `proof-test:` 被明确规定为保护上下文而非新增修改范围，计划仅作决策上下文，设计成立，见 `skills/spec-simplify-code/SKILL.md:11`、`:37`。core/08 的拟议字段数量不应强套本技能；实际阻断是 F1。
- **B03——已有授权拆分值得保留，但独立副作用边界未闭合。** `skills/spec-simplify-code/SKILL.md:57` 对无授权不探测、不派发，以及 inline 覆盖不冒充独立评审的规定成立；不能因此推断 F2 中的外发与 worker mutation 边界也已满足。
- **B04——保持 source/runtime 分离成立。** `skills/spec-simplify-code/SKILL.md:35`、`:39` 明确保留 runtime ownership 与有意重复，不把“找到相似 helper”当作跨包合并授权。本轮只审 owning source，未把已安装 runtime 加载等同于 fresh-source 行为证据。
- **X01——无需新增复杂编排器。** 现有三个 lens、跨边界禁止合并、共享代码扩围验证已覆盖主要职责，见 `skills/spec-simplify-code/SKILL.md:59`、`:95`；修复 F1/F3 即可，不需要引入任务图或新状态机。
- **X02——兼容性变更应留在本技能范围外。** `skills/spec-simplify-code/references/personas/code-quality-reviewer.md:13` 要求公共兼容面删除具有独立证据与授权；不能因用户说“更优雅”而执行版本迁移。
- **X03——安全与证明保护设计成立。** `skills/spec-simplify-code/SKILL.md:81`、`:83` 明确将测试缺陷退回 owner 对账，而非弱化断言；对应 eval judge 检查证明文件字节、HEAD/index 和非法输入行为，见 `skills/spec-simplify-code/evals/fixtures/scripts/check-safety-preserved.sh:58`、`:146`。这是 oracle 存在的静态证据，不是本轮运行通过。
- **X04——交接保持轻量且信息充分。** `skills/spec-simplify-code/SKILL.md:42`、`:91`、`:104` 要求来源、命令、freshness limitation、当前树身份及 proof 结果返回 caller；无需让清理技能自行承担跨会话知识晋升或最终 closeout。

## 未读文件

- **被审范围内必读文件：无。** 已读完入口、全部四个 references、全部 eval 配置/案例/fixture/脚本、消费者清单所列三个测试、指定检查表与合同基线。
- `/Users/kuang/.codex/AGENTS.md`：读取调用未获权限，因此未读；这是全局兼容指令来源，不是被审技能材料，可能存在未能核对的附加执行约束，不能声称已遵循其未读取正文。
- `skills/spec-lfg/references/implementation-cleanup.md`：探查路径不存在，无正文可读；实际清理交接已改从存在的 `skills/spec-lfg/references/review-followup.md` 完整核对，不形成消费者覆盖缺口。

## 结论一句话

静态审查覆盖完成，但对象不通过：需优先修正未提交实现的范围遗漏、worker 独立副作用授权与观察缺口，以及容量重试无界问题；其余行为保持、证明保护和 caller-owned 交接设计应保留。
