# 团队开发规范治理层 — 多 persona doc-review 决策清单

## 元信息

- 审查对象: `docs/plans/2026-06-21-004-feat-team-standards-governance-layer-plan.md`
- 审查方法: `spec-doc-review`（多 persona 并行，6 reviewer：coherence / feasibility / scope-guardian / adversarial / product-lens / security-lens）
- 日期: 2026-06-22
- 审查时仓 HEAD: `61c29f10`（stale snapshot；任何实现/修订前必须重新捕获 `git rev-parse --short HEAD` 与 `git status --short`）
- 状态: **决策已记录；plan 正文未改**（用户选择"决策先存档、plan 修订另起"，与上一轮 grill register 同一处理方式）。
- 性质: 本文件是 review 决策存档，供后续 plan 修订或 `spec-work` 直接消费；不是 plan 本身，不改变 source/runtime 行为。
- 直接证据: bounded 读源 + `rg` 确认 FACT-1~7（见 Coverage）；两个最强 P1（A owner-gate、F 冲突复用）经双 persona 直接读源确认，置信 100。**未做** fresh-source eval / 未做实现变更。

## 范围说明与定位

本轮与上一轮 `grill-with-docs` 互补、不重复：

- 上一轮（`2026-06-22-team-standards-governance-grill-review-decisions.md`，F1–F13）**显式把范围限定为完整性 / 内部一致性**，前提"保留完整 U1–U12"，并把 scope/过度设计问题判为越界、**显式 defer**（Grill 4：promotion-state / authority-tier / owner-queue / decision-trace / confirmed-draft 这套预层与普通 diff review 概念重叠）。
- 本轮的核心增量正是**重新打开 Grill 4**：用 6 个独立 persona 的收敛证据，评估 scope / 前提 / 可行性 / 安全 / 策略——这些是上一轮刻意未问的维度。
- F1–F13 的完整性修复经本轮抽查**大体已落到 plan 正文**（见 D 节），本轮不复述。

### 整体画像结论

- plan 在完整性、R→U 正向 / C→证据反向可追溯、trust/source-runtime 纪律上**扎实**。
- 但 **6 个 persona 高度收敛地指向同一根问题**：v1 的范围与机制重量，与 plan 自身反复声明的"轻合同 / docs-first / 薄规范 / 渐进 / 不做复杂状态机"**严重不一致**。
- 另有 **3 个具体、可验证的硬缺陷**（非主观）：owner-gate 在本仓 fail-open 且字段自相矛盾（A）、冲突解决"复用"了不具备该能力的上游（F）、隐私脱敏纯 prose（H）。
- 总建议: **进入 `spec-work` 前先做一次 scope 收敛 + 三个硬缺陷修订**，否则会实现一套"无消费者、无法 dogfood、部分机制空转"的治理层。

---

## A. 最高优先级 P1（实现前必须解决）

| # | 问题（一句） | persona / 置信 | 关键证据锚点 | 建议落点 |
|---|---|---|---|---|
| A | owner-gate 在本仓 fail-open，且 `owner` 字段自相矛盾 | feasibility 100 / security 100 / adversarial 75 | 本仓无 CODEOWNERS(FACT-6)；L463 `unresolved→defer/not-run`；L491 要求 owner 非空 vs L463 产出 unresolved；L911 high_impact 必须有效 owner；L1317 seed 规则属 architecture 却无法获 owner | `team-standards.md` + 新 owner-resolver：无 CODEOWNERS 时显式 fallback（index `OWNERS` 块 / `~/.spec-first/.developer` 作小团队 owner）；format-free 检查改 `owner ∈ {resolved-id,'unresolved'}`；`high_impact ∧ unresolved → 强制 deferred + 人工指派`（fail-closed）+ contract test |
| B | 提升预层(authority-tier/confirmed-draft/owner-queue/decision-trace)与普通 diff review 重叠（重开 Grill 4） | scope 75 / adversarial 75 / product 75 | L481/L913/L972 唯一 confirmed 路径=diff review；grill register L27 同观察 | plan 加"为什么不能只靠 diff review"小节，逐 construct 说明拦住了 diff review 拦不住的什么；说不出的折叠成二元(auto-draftable vs owner-required) |
| C | 获取层(U10–U12)对 v1 过载，且与 plan 自身 L117 deferral 矛盾 | scope P0/100 / product 75 / adversarial 75 | L117 把"自动候选挖掘"判为后续、不进 v1；U10–U12 把其完整契约面(8 阶段/18 问题表/10 维评分/source matrix/质量门/PR replay/访谈)全拉进 v1；v1 无 confirmed standards 可供质检 | U10–U12 整体降级到后续 evidence-gated 计划；v1 用 `candidates/README.md` 一段轻量 acquisition notes 替代 |
| D | ~40 新文件 vs 成功指标"5–20 条 confirmed"；空账本无 v1 生产者 | scope 100 ×2 | L1946 "5–20 条、别写巨文档"；U2 建 17 文件(8 surface 文件本仓无对应端)；`output-risk-profile`/`lineage-ledger`/`role-interview-notes` v1 是空模板却被 U13 当验证输入 | v1 只建 `team-standards.md`+`index.md`+`architecture.md`(真种子)+`candidates/README.md`；surface 文件/空账本随真实需要再加 |
| E | 校验器+owner-resolver：rule-card 解析格式未定、无归属单元/文件、违反 KTD3/KTD10 docs-first | feasibility 75 ×2 / scope 75 | L303 frontmatter 决策 defer；但要求全字段确定性校验；无单元给出 validator 文件/语言/测试；grill 自承需改写 A2 | U1 先定 rule-card 序列化格式(frontmatter / 结构化 header / 旁挂 JSON 三选一)并给 validator 明确文件+测试；或与 owner-resolver 一起 defer，v1 用 grep/string 风格轻量 contract test |
| F | 冲突解决"复用"了不具备该能力的上游（虚构 prior art） | feasibility 100 / adversarial 100（双直接读源） | L536/L1598 称复用 `evidence-and-topology.md` Contradiction Handling 的 authority-tier 优先级；实际该文件是证据标签模型(confirmed-source/user-stated/source-candidate)，无 authority_tier、无该阶梯、无出口集 | 删"复用"措辞；在 `team-standards.md` 把优先级阶梯定义为新规则；evidence-and-topology 仅作灵感引用 |
| G | v1 无可证明价值的环境；成功指标只验机制存在不验结果 | product 75 ×2 / adversarial 75 | L214 不验证团队采纳；L215 不为 hszq-app 初始化；L1939–1969 几乎全是机制存在性检查，无质量改善结果信号；角色契约要求指向 Evaluation Harness 信号 | 把 PR-replay/retrieval-eval 结果信号提为首要成功指标并给 before/after 目标；或先 U1–U5 薄路径在真实 slice 上 pilot 再决定是否建重型层 |
| H | 隐私脱敏纯 prose，无确定性 PII/secret 扫描即落库 | security 100 | 提取自 incident/postmortem/PR/访谈；唯一控制是 `privacy_review` 布尔 + `redaction_status` 枚举(LLM 判断)；`needs-redaction` 候选可带原始敏感内容写入 git 跟踪的 `candidates/**` 长期留存 | 候选写入 `candidates/**` 前必须过确定性 pattern 扫描，不过则不落盘；`needs-redaction` 定保留期 + audit 告警 |

---

## B. 次要 P2（应处理）

| # | 问题 | persona / 置信 | 建议 |
|---|---|---|---|
| P2-1 | 无绝对路径 guard 只是 prose、非 CI 强制（L815 defer 完整校验，U13 仅人工步骤） | security 75 | 加一行 `grep` CI 步骤扫 `candidates/**` 与 eval 输出，不需完整 validator |
| P2-2 | confirmed 规则正文 = prompt 注入面（被当可信指令注入下游 agent prompt） | security 75 | 合同声明规则文本按 data 处理、prompt 中与系统指令结构分隔；diff review 检查指令式标记 |
| P2-3 | `multi-source-high-confidence` tier 在 risk_domain 重叠时缺 high_impact 覆盖（"owner 可追溯"弱于"有效 owner"） | security 75 | tier 路由互斥：high_impact 永远优先，不走 fast-review |
| P2-4 | 候选分类步骤(4) 与 `candidate_type` 枚举(6) 不一致（流程图 classify 缺 conflict-record/promotion-proposal 来源） | coherence 75 | 流程图补两类来源或注明 promotion-proposal 是 promote 步骤产物而非分类产物 |

---

## C. 仅供参考 FYI（置信 50，不强制）

- L911 `high_impact ⇔ … risk_domain ≠ ∅` 与 L906 显式枚举措辞不一（语义等价；可统一为显式枚举，纯收紧）。
- 机会成本未论证 / 单条规则写作 ceremony 过高，可能导致 corpus 长期为空、团队回退到 `AGENTS.md`（product 50）——可考虑定义"最小可行规则" tier（id+rule+scope+owner+source_ref）。
- `needs-redaction` 候选无过期策略（security 50，已并入 H 建议）。
- `redaction_status: blocked` vs `needs-redaction` 的 next-action 路径不完整（coherence 50，已并入 H）。

---

## D. 已确认良好 / 无需改动（避免误伤）

- R→U 正向、C→证据反向追溯完整（上一轮已闭环，本轮抽查无孤儿）。
- `confirmed` 为唯一 hard level、source/runtime 边界、`.spec-first/standards/` 不复活——与现仓 source/tests 一致（FACT-1/2 直接确认）。
- spec-doc-review 的 F13 收窄、`promotion_state` 单 SoT 声明、U8→U13 重编号在正文中**已正确落实**（coherence 多条"verify"项经其自身证据已自证 OK，不作为 finding）。
- `imported` candidate_type 已在 L471 列出（F2 落实）。

---

## E. 落地依赖与建议顺序

- **先做范围决策（B、C、D），再修硬缺陷（A、F、H）**：范围一旦收敛，A/F/H 的修订面会显著缩小（例如 C 降级获取层后，H 的脱敏面、E 的 validator 面、G 的 eval 面都同步缩小）。
- A（owner）与 E（validator）耦合：两者都依赖"rule-card 是否机器可解析 + 字段合法值来源"，应一起定或一起 defer。
- F 是低成本高收益：删"复用"措辞 + 就地定义新规则即可，不依赖其他决策。
- 建议次序: **C/D（范围收敛）→ B（预层取舍）→ E（格式/工具取舍）→ A（owner 模型）→ F（冲突规则）→ H（隐私控制）→ G（成功指标/验证）→ P2**。

## F. Coverage / 限制

- personas: 6/6 成功返回，无超时/失败；posture=full；dispatch 经用户显式授权。
- 直接证据（HEAD `61c29f10`，bounded 读源 + `rg`）:
  - FACT-1: `.spec-first/standards/` 退役真实（`src/cli/state.js:40/44/50`）。
  - FACT-2: absence-guard 测试存在于 8 个测试文件。
  - FACT-3: `src/cli/developer.js` 已 shell git；`resolveChangelogAuthor` 存在 → owner-resolver 复用链技术成立。
  - FACT-4: `agents/spec-project-standards-reviewer.agent.md` 已有 `<standards-paths>` block + cite-exact-rule。
  - FACT-5: `skills/spec-prd/references/evidence-and-topology.md` 的 Contradiction Handling 是证据标签模型，**非** plan 声称复用的 authority-tier 优先级（→ Finding F）。
  - FACT-6: 本仓**无 CODEOWNERS**，~2 author（→ Finding A/G/H）。
  - FACT-7: U1/U3 修改目标文件均存在。
- 限制: 未 dispatch fresh-source eval；未做实现变更；本地 OpenSpec/外部实践对比为 sibling/外部材料；前提/策略类 finding（G、B、product 系列）置信上限 75，因部分依赖文档外业务上下文（是否有已承诺的真实多端 pilot）。

## G. 后续动作

1. 据本清单按 E 节顺序产出 plan 深化修订（preview-first），落到 plan + `team-standards.md` + 必要 references。
2. 修订时遵守仓规：重新捕获 HEAD/status、最窄验证、CHANGELOG、source/runtime 边界。
3. 若决定大幅收敛（C/D），考虑把 plan 拆为"v1 标准即输入(U1–U5)"+"后续获取/挖掘层"两份计划。
