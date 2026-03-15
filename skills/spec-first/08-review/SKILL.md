---
name: "spec-first:review"
description: "定位变更范围并执行代码审查"
version: 1.1.0
last_updated: 2026-03-05
changelog: v1.1.0 - 新增自动 Feature 定位（优先读取 .spec-first/current）
---

# Skill: review

对代码变更执行两阶段审查：先合规，再质量。

## 两阶段审查协议（P1-14）

### Stage 1: 合规审查（必须先通过）
- traces 是否完整（TASK/FR/DS 映射）
- 验证证据是否新鲜且可复现
- 变更是否符合阶段与流程守卫
- 宪法合规（是否违反 constitution 原则，违规按 CRITICAL 处理）
- TDD 流程是否自洽（RED / WAIVER / GREEN 与变更类型是否匹配）

### Stage 2: 质量审查（在 Stage 1 通过后执行）
- 4 维度：SOLID / 安全 / 性能 / 测试
- 输出风险等级与修复建议

#### Stage 2 输出分级

Stage 2 的发现必须分为以下三类：

- `MUST FIX`：违反 TASK / FR / DS / Constitution / 新鲜证据要求，或会阻断当前交付的问题
- `SHOULD FIX`：不阻断当前交付，但明显影响质量、可维护性、性能或测试完备性的事项
- `OUT_OF_SCOPE`：与本次 TASK 无直接关系、适合后续单独处理的问题

输出要求：
- 不得把 `OUT_OF_SCOPE` 问题包装成当前阻断项
- `OUT_OF_SCOPE` 问题应记录到 `findings.md` 或审查结论中
- Stage 2 结论必须可被复核为“阻断 / 建议 / 范围外”三类

硬规则：禁止跳过 Stage 1 直接进入 Stage 2。

## 审查反合理化守卫（P1-14）

| AI 的借口 | 封堵 |
|-----------|------|
| "直接看代码质量更高效" | 合规不通过时质量结论无效 |
| "这次改动小，可以省略合规检查" | 改动大小不影响流程约束 |
| "测试命令之前跑过，沿用就行" | 非新鲜证据不得用于当前结论 |

## 触发条件
- 阶段: 04_implement（code Skill 之后）
- Command: `/spec-first:review`


## Feature 定位规则

### 优先级

1. **显式参数**: 用户提供 featureId 参数时直接使用
2. **自动定位**: 读取 `.spec-first/current` 获取当前激活 Feature
3. **交互式**: 列出可用 Feature 供用户选择

### 错误处理

- `.spec-first/current` 不存在或为空 → 降级到交互式
- 指定 Feature 不存在 → 报错并终止

## 背景输入

- 优先读取 `code-view` 获取变更上下文
- 输入元数据字段使用 `backgroundInputStatus`
- 若需输出用户可见背景字段，统一使用 `background_input_status`
- 背景质量命名与枚举遵循 `../shared/background-quality-contract.md`
- 高风险场景需关注 `riskCategory` 和 `riskSignals`
- `backgroundInputStatus` 属于输入层字段，不替代文档输出字段命名

## 执行阶段（增强）
- P0: 定位 Feature，确定检查层级（single/cross/completion）
- P1: 根据层级加载对应检查清单（含 cross-layer-checklist）
- P2: 执行 Stage 1（合规）并输出结论
- P3: Stage 1 通过后执行 Stage 2（质量 + 跨层检查），并按 MUST FIX / SHOULD FIX / OUT_OF_SCOPE 分类
- P4: 与用户确认审查发现，范围外问题单独标注并写入 findings.md
- P5: 审查通过则更新 TASK 状态

## TDD 审查问题单

Stage 1 至少回答以下问题：

1. 当前变更是否本应 `required TDD`，却被写成 WAIVER？
2. `findings.md` 是否存在 `[TDD-RED]` 或 `[TDD-WAIVER]`？
3. 是否出现“只有 GREEN，没有 RED/WAIVER”的伪闭环？
4. WAIVER 是否写明 `Scope / Reason / Alternative Verification / Approver`？
5. 替代验证是否与变更类型匹配，而不是泛泛写“已人工验证”？

判定建议：

- 缺少 RED/WAIVER 且已写生产代码：`MUST FIX`
- 只有 GREEN，没有 RED：`MUST FIX`
- WAIVER 存在但理由空泛、替代验证不足：`SHOULD FIX`
- 与当前 TASK 无关的历史 TDD 欠账：`OUT_OF_SCOPE`

## Layer 参数约定

- 支持：`/spec-first:review --layer <single|cross|completion>`
- 默认：未传 `--layer` 时按 `cross` 执行
- 限制：非法 layer 值由 runtime 参数校验直接拒绝

## 检查层级选择

| 场景 | 推荐层级 |
|------|---------|
| 单文件小改动 | single |
| 多文件/跨模块改动 | cross |
| 功能完成/阶段推进 | completion |
| 不确定 | cross（更安全） |

## CLI 依赖
- `spec-first metrics coverage`
- `spec-first matrix check`

## 输出路径
- `specs/{featureId}/findings.md`

## 参考清单
- `references/solid-checklist.md`
- `references/security-checklist.md`
- `references/performance-checklist.md`
- `references/testing-checklist.md`
- `references/cross-layer-checklist.md`
- `references/review-output-template.md`
- `../03-spec/references/constitution-authority.md`

## 确认策略
- 推荐: assisted（审查发现需人工判断）

## 成功标准
- Stage 1（合规）与 Stage 2（质量）结果均已生成
- 审查顺序可复核（先合规后质量）
- 审查发现已写入 `findings.md`
- 通过审查的 TASK 状态已更新
- Stage 2 发现已按 MUST FIX / SHOULD FIX / OUT_OF_SCOPE 分类
- `OUT_OF_SCOPE` 未被包装为当前阻断项
- TDD 审查结论已明确区分流程缺口与普通测试缺口
