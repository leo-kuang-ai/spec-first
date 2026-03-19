# Gate FAIL 修复技术方案

> 文档类型：技术方案（Tech Spec）
> 日期：2026-03-19
> 说明：本稿已按当前仓库代码事实修正。原始记录中的部分失败项属于历史快照，已从当前结论中剔除。

---

## 1. 问题陈述

当前需要区分两类信息：

1. 历史 gate 输出中确实出现过 FAIL。
2. 当前仓库代码里，部分“失败根因”已经被修复，不能再作为现状问题继续引用。

基于当前代码库，可确认的事实是：

- `src/core/batch-executor/plan-generator.ts` 的未使用参数问题已修复，函数签名使用了 `_projectRoot`。
- `package.json` 中已经存在 `compat-check`，并且是一个返回 `0` 的 stub script。
- `gate` 的豁免路径读取结构化 `known-exceptions.md`；`findings.md` 中的 `[TDD-WAIVER]` 只是过程记录，不是 gate 输入。
- `C4` 是由追踪矩阵与测试/TC 关系计算出来的覆盖率指标，不是豁免机制的产物。

因此，这份技术方案不应再把已修复问题当作当前待办，而应聚焦于：

- 当前 gate 是否仍有真实失败项
- 失败项是否来自追踪矩阵、阶段状态或过期配置
- 是否需要对项目类型门禁策略做正式调整

---

## 2. 根因分析

### 2.1 C4 = 0% 不是 findings 里的 waiver 标记本身能修复

**修正结论：** `C4=0%` 的根因不是 `findings.md` 与 `known-exceptions.md` 的文本内容不一致。

当前实现里：

- `getCoverage()` 会先按 `known-exceptions.md` + 已批准 RFC 过滤合法 Exception，再根据矩阵计算 `C4`
- `evaluateGate()` 在发现 blocking failure 后，才会尝试把合法 exception 匹配成 `WAIVER`
- `findings.md` 中的 `[TDD-WAIVER]` 只是过程记录，不参与 gate 计算

也就是说，`findings.md` 里的 waiver 标记不能直接影响 gate；真正能影响 `C4` 的，是被结构化豁免后从 active 矩阵中排除的 `Exception` 行，以及当前矩阵是否存在有效 FR -> TC 追踪。

**正确排查路径：**

1. 检查当前 Feature 的 `traceability-matrix.md`
2. 检查是否存在从 FR 到 TC 的有效映射
3. 检查测试用例是否真的落在当前 Feature 的追踪链上
4. 只有在确需例外时，再通过 RFC + `known-exceptions.md` 走结构化豁免

### 2.2 ESLint 问题属于历史快照

**修正结论：** `plan-generator.ts` 的 `projectRoot` 未使用问题，当前仓库里已经修复。

所以如果某个历史 gate 历史里仍显示该错误，它只能说明：

- 那是一条旧的 gate 记录
- 或者来自与当前工作区不同的旧构建产物

它不能再作为当前实施方案的修复目标。

### 2.3 compat-check 也属于历史快照

**修正结论：** 当前 `package.json` 已经包含 `compat-check` stub script。

因此，文档里“补充 compat-check script”的建议不再成立。  
如果某条历史 gate 仍然报 `compat-check` 不存在，那说明：

- gate 记录来自旧版本
- 或 feature 工作区配置未刷新到当前仓库版本

当前应做的是重新拉齐工作区状态，而不是继续把它当作仓库现状。

---

## 3. 修复方案

### Fix-1：删除已过时的 ESLint 修复项

**状态：已完成 / 不再需要执行**

当前仓库中，`src/core/batch-executor/plan-generator.ts` 已使用 `_projectRoot`，不应再以“未使用参数”为现状问题继续立项。

### Fix-2：删除已过时的 compat-check 修复项

**状态：已完成 / 不再需要执行**

当前仓库中，`package.json` 已有 `compat-check` stub script。

如果某个 Feature 仍然引用缺失脚本作为阻断项，应优先检查：

- 该 Feature 的 gate 配置是否过期
- `stage-state.json` / merged rules 是否来自旧快照
- 是否需要重新生成 feature 工作区

### Fix-3：仅在正式项目类型策略成立时，才扩展跳过规则

**状态：条件成立时才执行**

如果确实存在静态站点 / H5 类项目需要绕过 `G-IMPL-01` / `G-VERIFY-01` 的场景，不能直接把 `shouldSkipCondition()` 当成临时补丁扩展掉。

必须同时满足：

1. 该项目类型在 `constitution.md` 中被正式声明
2. 该跳过规则有明确的产品测试策略支持
3. 仍然保留等价的替代质量门禁，例如 E2E、浏览器回归、Lighthouse 或其他可验证证据

否则，不建议修改 `shouldSkipCondition()`。

---

## 4. 当前仓库的真实执行顺序

1. 先重新运行当前 Feature 的 `gate check`，确认是否真的还存在 FAIL。
2. 如果 FAIL 仍然是 `C4=0%`，优先修 `traceability-matrix.md` 与测试追踪链，而不是修 waiver 机制。
3. 如果 FAIL 来自旧的 `G-H5-LINT` 或 `G-H5-COMPAT` 记录，先判断是否为历史 gate 结果，不要当成当前代码问题。
4. 如果确实需要项目类型跳过，再走正式项目类型声明 + 替代门禁补强。

---

## 5. 变更范围

| 文件 | 变更类型 | 说明 |
|------|---------|------|
| `src/core/batch-executor/plan-generator.ts` | 无需变更 | 相关问题已修复 |
| `package.json` | 无需变更 | `compat-check` 已存在 |
| `src/core/gate-engine/condition-registry.ts` | 条件变更 | 仅在正式项目类型策略成立时才扩展 |
| `specs/{featureId}/constitution.md` | 条件变更 | 仅在目标项目确需该策略时补充 |

---

## 6. 不在本方案范围内

- 将 `findings.md` 改造成 gate 真源
- 将 `TDD-WAIVER` 直接接入 gate 计算
- 直接手动编辑 `stage-state.json`
- 把历史 gate 记录当成当前仓库事实

---

## 7. 验收标准

```bash
spec-first gate check <featureId>
```

预期：

- 如果仍有 FAIL，FAIL 必须能在当前代码库中复现
- 如果只剩历史记录冲突，应该先刷新 workspace / gate 配置，而不是继续修旧项
- 不再出现把已修复问题当作当前待办的情况
