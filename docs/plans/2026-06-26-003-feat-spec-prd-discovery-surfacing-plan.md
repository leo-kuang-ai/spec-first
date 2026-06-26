---
spec_id: spec-prd-discovery-surfacing
title: "feat: spec-prd discovery 侧 question surfacing(dev/test 双座位 + 多义嗅探)"
type: feat
status: completed
date: 2026-06-26
plan_depth: medium
author: leokuang
target_repo: "."
related_plans:
  - docs/plans/2026-06-25-004-feat-spec-prd-closure-contract-plan.md
referenced_reviews:
  - ref: docs/项目审查/详细审查/2026-06-26-spec-prd-10轮SE深度审查.md
    role: origin
    scope: in
    addresses_findings: ["S4b-dev-test-forcing-function", "B1-referent-change-verb-ambiguity"]
---

# feat: spec-prd discovery 侧 question surfacing

## Summary

004 把 closure 侧建到结构性饱和(剃刀 + 30 个 BLOCKING + 出口闸),但 2026-06-26 16:46 真实运行暴露了 004 闸够不到的残口:模型只问 2 个 scoping 问题就写 PRD,load-bearing 的 OQ-2(接口可用性)、OQ-3(中台持仓降级)从未被 surface 出来深度 grill——product-only lens 天然欠权重"实现者/测试作者"视角的 gap。

closure 闸只能保证"**写下来的** OQ 必须真闭合";它无法保证"**所有该问的问题都被 surface 出来**"。后者是 discovery 问题,是 10 轮 SE 审查的中心论点(discovery 与 closure 机制密度结构性不对称)指向的最高 ROI 方向,也是用户诉求"需求中所有待澄清的问题都要深度压力 grill"的结构化实现。

本方案是 **Layer B(surfacing)**:在 `product-expert-lens.md` 内最小 prose 增量,逼模型用"实现者/测试作者"双座位再读同一需求 + 主动嗅 referent/change-verb 多义,把"该问没问"从静默省略变成被逼出来的、绑 PRD write target 的 gap;surface 出来后,交既有 closure 闸(Layer A,004)闭合。

## Decision Brief

- **Recommended approach:** 复用 lens 既有 `downstream_confirmation_risk -> ... -> PRD_write_target -> closure_state` Run-Local Interface,**不新增 schema/reference/closure_state/checker**。只在 lens 内加:(a) dev/test 双座位 forcing-function(每个 load-bearing 需求产出"一个绑 write target 的具体 gap 或 explicit-none-found"),(b) referent/change-verb 多义嗅探升级第 11 行 prose。
- **Key decisions:** 不碰 `spec-plan`(R1);不加 discovery 侧 checker(缺失无文本锚,deterministic 检测必假阳——10 轮审查硬红线);不新建第二 lens(踩 `product-expert-lens.md:5` 红线);不加 declare-default bullet(10 轮终轮 CUT);母方向=净 prose,非加 gate。
- **Validation focus:** contract test 锁 prose 锚点(双座位字样、嗅探维度、绑 write target 不变量)与消费方向,**不锁语义结果/问题措辞**;语义效果(模型是否真嗅出多义、真填 explicit-none 而非退化为防御性 "no gap found")只能 fresh-source eval,host 缺 dispatch 时记 `not_run` + 原因,不声称通过。
- **Largest risks / boundaries:** 本方案抬高"问全"的地板(把漏问从零成本静默变成被逼出),但**不能**密码学证明模型真的逐一深问了 owner(那是 R12 host-provenance 天花板,与 004 同);也不能强制"grill 在 write 之前"(无事件观测,同属天花板)。这两者靠 prose + 交互问答工具 forcing + doc-review/fresh-source 防御纵深兜底,不用 checker 硬 gate。

## Problem Frame

16:46 真实运行(`~/xiaobu/hsglobal/2026-06-26-164630-...txt`)的失败链:读输入 → 只问 2 个 scoping 问题(表面范围、优先级)→ 直接写完整 PRD → 出口闸拦 → 捏字段被拦 → 逆向 checker 改对值过闸。全程**没有对 OQ-2/OQ-3 这类 load-bearing 问题做任何 owner grill**,它们被标散文"非阻塞规划"。

004 的 bullet-OQ 修复(同日已落)堵住了"散文 OQ 混入 ready"的 format 逃逸,但那是 Layer A(已写下的 OQ 必须闭合)。真正的残口是 **Layer B**:OQ-2/OQ-3 是 dev/test 座位的 gap,product-only lens 权重不足,模型"想不到要问",于是要么不写、要么轻描淡写。

正确补法不是加 checker(缺失的问题无文本锚,脚本嗅不到、强做必假阳),而是在 lens 内加 forcing-function:强制模型切换到"实现者/测试作者"座位再读一遍需求,逼出"哪个未命名的接口可用性/权限边界/状态会让我发明产品行为""哪条需求没有可观测信号让我写 pass/fail 断言"。

## Requirements

- R1. 不改 `spec-plan`、不新增跨 skill 依赖、不让 spec-prd 产物形态被 spec-plan 反向耦合。
- R2. 在 `product-expert-lens.md` 内加 **dev/test 双座位 forcing-function**:对每个 load-bearing 需求,除产品视角外,必须从"实现者座位"与"测试作者座位"各读一遍,每个座位产出"一个绑 `PRD_write_target` 的具体 gap"或显式 `explicit-none-found`。复用既有 Run-Local Interface,不新增字段/维度清单副本。
- R3. 升级第 11 行 ambiguity 句,加 **referent/change-verb 多义嗅探**:命中"与 X 一致"而 repo 中 X 有多实现、"add/extend/replace/remove"未言明等 brownfield 多义时,走既有 interface 绑 write target。嗅探是召回式诱饵 prose,**不是逐需求 checklist**,无命中是合法结局。
- R4. 双座位与嗅探产出的 gap 一律走既有 `gap -> owner_question_or_assumption -> PRD_write_target -> closure_state` 管线,最终由 Layer A(004 剃刀)闭合;本方案**不新增任何 closure_state、disposition、checker、BLOCKING reason_code**。
- R5. contract test 只锁 prose 结构锚点(双座位字样、嗅探维度名、绑 write target 不变量、单 canonical lens 红线)与消费方向;**不锁语义判断、问题措辞、gap 数量**。
- R6. 语义行为效果(是否真逼出 gap、是否退化为防御性 "no gap")须 fresh-source eval 验证;host 缺 dispatch primitive 或未授权时,记 `not_run` + reason_code,不声称语义通过。

## Scope Boundaries

- 不加 discovery 侧 checker / BLOCKING reason_code / 缺失检测(缺失无文本锚,deterministic 必假阳)。
- 不新建第二 lens、不复制 dimension 清单、不新增 reference 文件。
- 不加 declare-default 责任 bullet(10 轮终轮 CUT:与 `prd-output-template.md:213` disposition 枚举逐字重叠)。
- 不把"dev/test 视角"做成逐项 checklist 或新 persona dispatch;它是 lens 内的双座位再读,复用既有 escalation。
- 不试图用 checker 强制"grill 先于 write"或"问全"(无事件观测 + 语义判断,属 R12 天花板与 KTD2 边界,硬 gate 即过度设计)。

## Implementation Units

### U1. Lens 双座位 forcing-function + 多义嗅探 prose

**Goal:** 在 `product-expert-lens.md` 内逼出 product-only 视角会漏的 load-bearing gap,全部走既有 Run-Local Interface。

**Requirements:** R1, R2, R3, R4

**Dependencies:** None

**Files:**
- Modify: `skills/spec-prd/references/product-expert-lens.md`
- Test: `tests/unit/spec-prd-contracts.test.js`

**Approach:**
- 第 11 行 ambiguity 句升级:在现有维度后补 referent-ambiguity(复用现有 X / 和 Y 一致,而 repo 里该物有多实现/分支)、change-verb-ambiguity(add/extend/replace/remove 未言明),作为召回式嗅探诱饵,命中走既有 interface 绑 write target,无命中合法。
- 在 Responsibilities 或 Product Judgment Dimensions 内加一条双座位 forcing-function:每个 load-bearing 需求,除产品视角外,从"实现者座位"(哪个未命名的接口可用性/权限边界/状态/数据权威会逼我发明产品行为)与"测试作者座位"(哪条需求没有可观测信号让我写 pass/fail 断言)各读一遍,每座位产出绑 `PRD_write_target` 的具体 gap 或 `explicit-none-found`。
- 强调:这是既有 `downstream_confirmation_risk` 引擎换座位再读,**非新维度清单、非 checklist、非新 persona**;无 gap 是合法结局,绝不退化为防御性 "no gap found"(该退化由 R6 fresh-source eval 兜底验证)。

**Patterns to follow:**
- `product-expert-lens.md` 既有 Run-Local Interface 与 Interface Invariants 措辞风格;`product-expert-lens.md:5` 单 canonical lens 红线。

**Test scenarios:**
- Happy: contract test 找到 dev/test 双座位字样 + referent/change-verb 嗅探维度 + "绑 PRD_write_target 或 explicit-none-found" 不变量。
- Edge: 不引入第二 lens、不复制 dimension 清单、不新增 closure_state/checker 字样。
- 语义: fresh-source eval(host dispatch 可用时)验证双座位真逼出 16:46 的 OQ-2/OQ-3 类 dev-座位 gap;不可用记 `not_run`。

**Verification:**
- `npx jest tests/unit/spec-prd-contracts.test.js --runInBand`
- fresh-source eval 或记 `not_run` + 原因

### U2. Docs、runtime、changelog 同步

**Goal:** 用户文档与 generated runtime 与 closure 文档保持一致;声明 Layer A/B 分工。

**Requirements:** R1, R6

**Files:**
- Modify: `docs/05-用户手册/22-PRD需求文档质量增强流程.md`(说明:grill 先于 write 为默认,双座位逼出全部 load-bearing 问题再闭合)
- Modify: `CHANGELOG.md`
- 之后 `spec-first init` 刷新 generated mirror(不手改)

**Test scenarios:**
- 文档说明双座位 surfacing 是正常路径、closure 闸是出口保险、两者分工。
- Changelog 记用户可见行为:lens 现在会从 dev/test 双座位逼出 product-only 漏掉的 load-bearing 问题。

**Verification:**
- `npx jest tests/unit/changelog-format.test.js --runInBand`
- `git diff --check`

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| 双座位退化为防御性 "no gap found" 套话 | forcing-function 要求"具体 gap 绑 write target 或 explicit-none-found",fresh-source eval 验证是否真逼出 gap;prose 非 checker |
| 多义嗅探变成逐需求 checklist 膨胀 | 明确是召回式诱饵、无命中合法、复用既有 interface,不新增 schema/小节 |
| 被误读为可加 discovery checker | Scope Boundaries 显式否决:缺失无文本锚,deterministic 必假阳 |
| 语义效果无法本仓自动验证 | R6:fresh-source eval,host 缺 dispatch 记 `not_run`,不声称通过 |
| scope 漂移回 closure 侧 | 本方案只碰 lens prose;closure 闸归 004,不重复造 gate |

## Alternative Approaches Considered

- **加 discovery 侧 checker 检测"漏问的问题":** rejected。缺失的问题无文本锚,deterministic 检测必假阳,违反 Scripts-prepare-LLM-decides。
- **新建 dev/test reviewer persona dispatch:** rejected。10 轮审查判 MERGE 进既有 lens 即可,新 persona 是 over-engineering 且依赖 host dispatch。
- **declare-default 责任 bullet:** rejected(10 轮终轮 CUT)。与 disposition 枚举逐字重叠。
- **用 checker 强制 grill 先于 write:** rejected。无事件观测能力(R12 天花板),硬 gate 即测谎仪。

## Open Questions

### Resolved During Planning

- 是否加 discovery checker?否。缺失无文本锚,归 LLM-owned。
- 是否新建第二 lens / persona?否。MERGE 进既有 product-expert-lens,守单 canonical 红线。
- 能否强制"问全"?能抬高地板(漏问从零成本变被逼出),不能证明穷尽(R12 天花板,靠 prose + 交互 + 评审兜底)。

### Deferred to Implementation

- 双座位 prose 的精确落点(Responsibilities vs Product Judgment Dimensions)在实现时按可读性定;不改变 R2 语义。

## Sources & References

- Closure-side plan (Layer A): `docs/plans/2026-06-25-004-feat-spec-prd-closure-contract-plan.md`
- 10-round SE review (origin): `docs/项目审查/详细审查/2026-06-26-spec-prd-10轮SE深度审查.md`
- Product Expert Lens source: `skills/spec-prd/references/product-expert-lens.md`
- Role contract: `docs/10-prompt/结构化项目角色契约.md`
