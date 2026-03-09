# Karpathy 优化方案待开发功能清单

> 基于 `docs/review-bundles/skill优化思考/全流程驱动优化/Karpathy优化方案-详细改动计划.md` 与当前仓库代码实现的对照审查整理。
> 审查时间：2026-03-09
> 审查结论：计划中的 Batch A / Batch B / Batch C 已落地；当前仍有少量功能处于未开发或延后状态。

---

## 1. 结论摘要

### 1.1 已完成开发

以下计划项已完成，不再纳入待开发清单：

- `07-code`：已补齐 `Simplicity First`、`Surgical Changes`、P3 `范围确认`
- `08-review`：已补齐 Stage 2 输出分级（`MUST FIX` / `SHOULD FIX` / `OUT_OF_SCOPE`）
- `03-spec`：已补齐 `隐含假设清单` 与 `[ASSUMED]` / `[NEEDS CLARIFICATION]` 规则
- 配套文档测试已补齐并通过定向验证

### 1.2 当前待开发范围

当前真正仍未完成开发的内容，主要集中在以下两类：

1. **已在计划中明确排除，但从能力角度仍属待开发的运行时功能**
2. **已被计划标记为“暂不实施”的扩展项**

---

## 2. 确认待开发项（未实现）

| ID | 功能项 | 当前状态 | 证据 | 建议落点 | 优先级 |
|----|--------|----------|------|----------|--------|
| TODO-001 | `SHARED.md` 自动拼装到 Skill Prompt | 未开发 | `skills/spec-first/SHARED.md` 已存在，但 `src/core/skill-runtime/dispatcher.ts:384` 的 `loadSkill()` 仅读取目标 `SKILL.md`，未自动拼装共享层 | `src/core/skill-runtime/dispatcher.ts`、`src/core/skill-runtime/prompt-assembler.ts`、相关测试 | 高 |
| TODO-002 | 基于 TASK 文件清单 / `code-view` 范围信号的 runtime 强制边界校验 | 未开发 | 当前文档仅将其作为参考信号，明确“不升级为 runtime 强制 allowlist”；代码中也未见对应强制校验 | `src/core/skill-runtime/dispatcher.ts`、`src/core/skill-runtime/hard-gate.ts` 或新增范围校验模块、相关测试 | 中 |

### TODO-001：`SHARED.md` 自动拼装

**现状**

- `skills/spec-first/SHARED.md` 已存在
- `skills/spec-first/README.md:65` 已将其声明为共享上下文
- 但运行时 `loadSkill()` 当前只做了：
  - 读取目标 `SKILL.md`
  - 注入 `Next Steps` 策略
  - 执行 placeholder 组装
  - 追加 hard-gate / runtime notice
- 没有任何一步会自动把 `SHARED.md` 拼到最终 prompt

**为什么仍算待开发**

这不是文档修订问题，而是明确的运行时能力缺口：共享规则已经存在，但宿主不会自动消费它。

**建议验收标准**

- 加载任意 spec-first Skill 时，可按确定顺序拼装 `SHARED.md`
- 不破坏现有 `loadSkill()` 的 hard-gate、runtime notice、prompt assembly 顺序
- 为共享层拼装补专项测试，避免重复注入或顺序漂移

---

### TODO-002：runtime 强制边界校验

**现状**

- `06-task` 已有 TASK 级 `文件清单`，可作为范围参考
- `07-code` 已要求关注 `entryPoints`、`likelyChangeAreas`、`changeHazards`
- 但这些都还只是**提示型治理**，没有升级为 runtime 强制校验

**为什么仍算待开发**

当前系统已经有“边界信号”，但还没有“边界执法”。如果未来希望把“顺手改动”从软约束升级为硬约束，这部分仍需实现。

**建议验收标准**

- 在 `code` / `review` / `verify` 至少一个关键节点，对变更文件与 TASK 文件清单 / `code-view` 范围信号做一致性校验
- 对范围外修改给出明确阻断或警告策略
- 支持例外场景的显式豁免，而不是静默放行

---

## 3. 延后候选项（计划中暂不实施）

以下内容在计划文档中被标记为“暂不实施”。它们不属于本轮漏开发，但如果继续推进 Karpathy 方向，仍可作为后续候选功能。

| ID | 功能项 | 当前状态 | 现有基础 | 是否建议立即开发 |
|----|--------|----------|----------|------------------|
| CAND-001 | `04-design` 进一步做对称治理补强 | 部分已实现 | 已有 `Simplicity First - 设计简洁性守卫` 与相关测试 | 否 |
| CAND-002 | `13-orchestrate` 增加更强的边界/范围编排治理 | 部分已实现 | 已有 `background_status` / `dependency_strength` / `risk_category` / `risk_signals` 治理口径 | 否 |

### CAND-001：`04-design` 对称治理补强

**现状**

- `04-design` 并非空白状态
- 当前已经有：
  - `## Simplicity First - 设计简洁性守卫`
  - 相关 reference 对齐
  - 相关文档测试

**判断**

这说明 `04-design` 不应被列为“完全未开发”。更准确的状态是：**已有基础能力，但未纳入本轮进一步扩展**。

**后续可选方向**

- 若希望与 `07-code` 完全对称，可继续评估是否需要补“范围确认”或更显性的边界自检
- 但当前没有足够证据证明这是本轮必须项

---

### CAND-002：`13-orchestrate` 编排治理增强

**现状**

- `13-orchestrate` 已具备背景治理口径
- 当前已覆盖：
  - `background_status`
  - `dependency_strength`
  - `risk_category`
  - `risk_signals`

**判断**

这说明 `13-orchestrate` 也不应被列为“完全未开发”。更准确的状态是：**已有风险治理框架，但未承担本轮的单 Skill 输出边界治理目标**。

**后续可选方向**

- 若后续要做更强的跨 Skill 范围治理，可评估把范围异常统一提升到 orchestrate 层做汇总或阻断
- 目前没有必要与本轮文档治理混在一起推进

---

## 4. 非功能开发项（仅待验证，不算待开发）

以下事项不是“功能未开发”，而是“本轮审查未重新确认”的验证项：

- `pnpm test` 全量回归是否仍全部通过

说明：本次审查已跑定向文档测试，但未重新执行全量测试，因此它应归类为“待验证”，而不是“待开发”。

---

## 5. 推荐开发顺序

1. **先做 `TODO-001`**：补齐 `SHARED.md` 的 runtime 自动拼装能力
2. **再做 `TODO-002`**：把 TASK 文件清单 / `code-view` 范围信号升级为可执行的边界校验
3. **最后再评估 `04-design` / `13-orchestrate` 是否需要扩展**，避免过早把治理逻辑做散

---

## 6. 一句话总结

**按当前代码实现判断，真正仍待开发的核心功能只有两项：`SHARED.md` runtime 自动拼装，以及基于 TASK 文件清单 / `code-view` 的 runtime 强制边界校验；`04-design` 与 `13-orchestrate` 更适合作为后续候选增强项，而不是当前漏开发项。**
