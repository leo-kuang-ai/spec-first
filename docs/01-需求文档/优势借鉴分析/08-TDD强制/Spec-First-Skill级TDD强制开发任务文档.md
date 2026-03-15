# Spec-First Skill 级 TDD 强制开发任务文档

> 面向：在现有 Spec-First 架构上，以最小改动方式强化基于 Skill 的 TDD 强制
>
> 范围：任务清单 + 文件级改造说明 + 验收标准 + 验证命令
>
> 约束：不新增 CLI 命令、不新增 Gate registry、不新增 runtime schema，以 `07-code` 及其 `references/` 为真理源

---

## 当前进展（2026-03-15）

### 总体状态

- 本轮最小改动方案已完成落地
- Skill / references / 消费侧口径已同步
- 额外完成 3 处代码级 lint warning 清理
- 当前未进入 runtime 强校验改造阶段

### 完成度概览

| 任务 | 状态 | 说明 |
|------|------|------|
| Task 1 收敛 `tdd-guard.md` | 已完成 | 已补齐 policy resolution、WAIVER 口径、多端矩阵 |
| Task 2 更新 `test-template.md` | 已完成 | 已补 `RED First` 与不同端参考 |
| Task 3 更新 `report-template.md` | 已完成 | 已补 runtime 边界说明与 TDD blocked 解读 |
| Task 4 更新 `07-code/SKILL.md` | 已完成 | 已接入变更类型优先、WAIVER 规则、反合理化 |
| Task 5 统一 `findings.md` 写法 | 已完成 | 已固化 `[TDD-RED] / [TDD-WAIVER] / [TDD-GREEN]` |
| Task 6 更新 `02-catchup/SKILL.md` | 已完成 | 已新增 TDD 证据快照与恢复期风险识别 |
| Task 7 更新 `14-status/SKILL.md` | 已完成 | 已新增独立 TDD 状态卡片 |
| Task 8 更新 `08-review` / `12-verify` | 已完成 | 已新增 TDD 审查问题单与 verify 边界说明 |
| Task 9 references 一致性审查 | 已完成 | 已完成主 skill / references / 消费侧口径对照 |

### 实际落地文件

- `skills/spec-first/07-code/SKILL.md`
- `skills/spec-first/07-code/references/tdd-guard.md`
- `skills/spec-first/07-code/references/test-template.md`
- `skills/spec-first/07-code/references/report-template.md`
- `skills/spec-first/02-catchup/SKILL.md`
- `skills/spec-first/08-review/SKILL.md`
- `skills/spec-first/12-verify/SKILL.md`
- `skills/spec-first/14-status/SKILL.md`
- `src/cli/commands/gate.ts`
- `src/cli/commands/metrics.ts`
- `src/core/metrics-engine/core-metric-thresholds.ts`

### 已完成验证

- `git diff --check` 通过
- `pnpm lint` 通过，warning 已清零
- `pnpm test` 通过：`160` 个测试文件，`1478` 个测试通过，`7` 个跳过

### 偏差说明

与原任务文档相比，本轮有两点调整：

1. Task 3 未把 “WAIVER 理由不合规” 写成 runtime 已阻断
   - 原因：当前 `src/core/batch-executor/guards.ts` 只检查 `[TDD-RED]` / `[TDD-WAIVER]` 字符串，不解析结构化字段
   - 处理：改为在 `report-template.md` 中明确区分“runtime 已检查”和“review/status 可补充审查”

2. 额外补做了 3 处代码级类型清理
   - `src/cli/commands/gate.ts`
   - `src/cli/commands/metrics.ts`
   - `src/core/metrics-engine/core-metric-thresholds.ts`
   - 原因：`pnpm lint` 存在 3 个 `no-explicit-any` warning，已顺手收口

### 当前剩余项

本轮“最小改动”范围内无未完成项。  
下一阶段候选工作：

- 把 skill 级 TDD 口径下沉到 runtime / Gate / report generator
- 为 `findings.md` TDD 标记增加自动解析与展示
- 设计真正的 system-enforced TDD artifact，而不是只靠 skill 约束

---

## 一、目标

在不改动底层 CLI / Gate / Hook / runtime schema 的前提下，完成以下目标：

1. 强化 `07-code` skill 的 TDD policy 判定
2. 明确并收敛 `07-code/references/tdd-guard.md` 为 TDD 真理源
3. 统一 `findings.md` 中的 TDD 标记与字段格式
4. 让 `status / catchup / review / verify` 能读取并暴露 TDD 风险
5. 形成一套适用于 `app / h5 / admin / backend / 多端共享层` 的最小可行 TDD policy matrix

---

## 二、设计边界

### 本次明确要做

- 修改 Skill 文档
- 修改 Skill references 文档
- 统一 TDD 标记协议
- 输出可执行的审查与恢复规范

### 本次明确不做

- 不实现新的 `spec-first tdd ...` CLI
- 不改 `src/core/batch-executor/guards.ts`
- 不改 Gate condition registry
- 不新增 `specs/{featureId}/tdd/` 目录
- 不改 `stage-state.json`
- 不新增 git hooks 逻辑

---

## 三、交付物

本次开发应交付以下结果：

### 文档交付物

- 更新 `skills/spec-first/07-code/SKILL.md`
- 更新 `skills/spec-first/07-code/references/tdd-guard.md`
- 更新 `skills/spec-first/07-code/references/test-template.md`
- 更新 `skills/spec-first/07-code/references/report-template.md`
- 更新 `skills/spec-first/02-catchup/SKILL.md`
- 更新 `skills/spec-first/14-status/SKILL.md`
- 视需要更新 `skills/spec-first/08-review/SKILL.md`
- 视需要更新 `skills/spec-first/12-verify/SKILL.md`

### 规范交付物

- 明确 TDD policy resolution 规则
- 明确多端 TDD policy matrix
- 明确允许的 WAIVER reason code
- 明确 `findings.md` 中 `[TDD-RED] / [TDD-WAIVER] / [TDD-GREEN]` 的推荐写法

### 验证交付物

- 至少 1 份文档审查记录，证明主 skill 与 references 口径一致
- 至少 1 份示例 findings 片段，证明新格式可操作

---

## 四、实施总顺序

建议按以下顺序执行：

1. 先收敛 `07-code/references/` 真理源
2. 再修改 `07-code/SKILL.md`
3. 再改 `catchup / status`
4. 最后补 `review / verify`
5. 收尾做一次“主文档 vs references”一致性审查

原因：

- `references/` 是技能细则真理源
- 主 skill 应该引用并放大已有规则，而不是另起一套
- `catchup/status/review` 只能消费统一后的口径

---

## 五、任务清单

## Task 1：收敛 `07-code/references/tdd-guard.md`

**目标**  
把 `tdd-guard.md` 明确为当前 Skill 级 TDD 强制的真理源，并补足 WAIVER 与多端 policy 的最小口径。

**文件**

- 修改：[tdd-guard.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/07-code/references/tdd-guard.md)

**改造内容**

1. 在开头明确：
   - 当前真理源是 `src/core/batch-executor/guards.ts`
   - 当前文档是 `07-code` TDD 守卫的 references 真源
2. 补充 `TDD Policy Resolution` 小节
3. 引入多端 / 多变更类型矩阵的精简版
4. 明确允许的 WAIVER reason code
5. 明确禁止的模糊 WAIVER 理由
6. 统一 `[TDD-RED] / [TDD-WAIVER] / [TDD-GREEN]` 的字段建议

**验收标准**

- 文档中明确写出 `required / conditional_waiver / waived`
- 文档中明确写出允许的 WAIVER reason code
- 文档中不再出现“覆盖率可替代 TDD”暗示

**验证方式**

- 人工审查文档结构是否完整
- 与 [07-code/SKILL.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/07-code/SKILL.md) 对照，不允许冲突

**进展更新（2026-03-15）**

- 已完成
- 已在 `tdd-guard.md` 中补齐 `TDD Policy Resolution`、多端 / 多变更类型矩阵、`WAIVER` 最低内容、反合理化清单
- 已明确写出：结构化字段是 skill 约束，不是 runtime 已强制解析

---

## Task 2：更新 `07-code/references/test-template.md`

**目标**  
让测试模板显式体现 “先 RED，后 GREEN” 的顺序要求。

**文件**

- 修改：[test-template.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/07-code/references/test-template.md)

**改造内容**

1. 增加 “First Step Must Produce RED” 小节
2. 增加不同端类型的 RED 证据示例
   - app：ViewModel / state
   - h5/admin：hook / form / component behavior
   - backend：service / handler
3. 增加 “如果只能做高层测试，如何写 RED 说明”

**验收标准**

- 模板不再只给“测试样例”，而是给“RED 起手动作”
- 示例覆盖至少前端和后端两类

**验证方式**

- 人工阅读检查

**进展更新（2026-03-15）**

- 已完成
- 已新增 `RED First 要求`
- 已补 `app / h5-admin / backend / shared` 四类参考
- 已明确 WAIVER 不能伪装成测试完成

---

## Task 3：更新 `07-code/references/report-template.md`

**目标**  
让批量报告模板对 TDD blocked 的表达更具体、更可执行。

**文件**

- 修改：[report-template.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/07-code/references/report-template.md)

**改造内容**

1. 对 `blocked - 缺少 TDD RED 证据` 增加下一步建议模板
2. 区分：
   - 缺少 `[TDD-RED]`
   - 存在 `[TDD-WAIVER]` 但理由不合规
3. 增加“建议回写 findings.md 指定区块”的文案

**验收标准**

- blocked 类别对 TDD 问题至少有 2 种明确描述
- next step 具备可执行性

**验证方式**

- 人工审查模板内容

**进展更新（2026-03-15）**

- 已完成
- 已新增 `TDD 相关解读`
- 已显式限制：不得把结构化字段缺失描述成 runtime 已阻断
- 原任务中“区分 WAIVER 理由不合规并阻断”已下调为 review/status 风险，不伪造 runtime 能力

---

## Task 4：更新 `07-code/SKILL.md`

**目标**  
把主 skill 的 TDD 规则升级为可执行协议，并与 `references/tdd-guard.md` 完全对齐。

**文件**

- 修改：[07-code/SKILL.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/07-code/SKILL.md)

**改造内容**

1. 增加 `TDD Policy Resolution` 小节
2. 明确按“变更类型优先、端类型辅助”判断 policy
3. 增加 `RED Evidence Minimum Bar`
4. 增加 `WAIVER Rules`
5. 增加 `Anti-rationalization` 清单
6. 明确引用：
   - `references/tdd-guard.md`
   - `references/test-template.md`
   - `references/report-template.md`

**要求**

- 主 skill 不能定义与 references 冲突的第二套规则
- 主 skill 负责“执行指令”，references 负责“细节真理源”

**验收标准**

- 文档中出现 `required / conditional_waiver / waived`
- 文档中明确 `[TDD-RED] / [TDD-WAIVER] / [TDD-GREEN]`
- 文档中明确禁止：
  - “改动太小”
  - “先做再补”
  - “覆盖率够了”

**验证方式**

- 人工对照 [tdd-guard.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/07-code/references/tdd-guard.md)
- 检查不存在冲突描述

**进展更新（2026-03-15）**

- 已完成
- 已新增变更类型优先的 policy 判定、WAIVER 规则、反合理化清单
- 已与 `tdd-guard.md` 对齐，没有定义第二套独立规则

---

## Task 5：为 `findings.md` 约定标准写法

**目标**  
不新增 artifact，仅通过 `findings.md` 承载最小 TDD 证据，并保证与现有 guard 兼容。

**文件**

- 修改：[07-code/SKILL.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/07-code/SKILL.md)
- 修改：[tdd-guard.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/07-code/references/tdd-guard.md)

**改造内容**

1. 固定写法为：
   - `### [TDD-RED] TASK-XXX`
   - `### [TDD-WAIVER] TASK-XXX`
   - `### [TDD-GREEN] TASK-XXX`
2. 每种标记下推荐字段：
   - Test / Exit / Failure / Time
   - Scope / Reason / Approver / Time
   - Result / Time
3. 明确说明：
   - 允许追加字段
   - 但不得改变标记头格式

**验收标准**

- 至少 1 处文档示例展示完整 RED / WAIVER / GREEN 写法
- 主文档与 references 使用同一格式

**验证方式**

- 人工审查示例区块

**进展更新（2026-03-15）**

- 已完成
- 已固定保留 `[TDD-RED] / [TDD-WAIVER] / [TDD-GREEN]` 标记头
- 已补 `Policy / Change-Type / Alternative Verification / Notes` 等推荐字段
- 当前仍与 `guards.ts` 的字符串匹配实现兼容

---

## Task 6：更新 `02-catchup/SKILL.md`

**目标**  
让会话恢复阶段显式检查 TDD 风险，而不是只恢复任务与文件缺失。

**文件**

- 修改：[02-catchup/SKILL.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/02-catchup/SKILL.md)

**改造内容**

1. 增加恢复时的 TDD 检查步骤
2. 明确：
   - 当前 TASK 缺 `[TDD-RED]` 时应提示补证据
   - 存在 `[TDD-WAIVER]` 时应显示 reason
3. 在恢复报告模板中增加一小段 TDD 状态

**验收标准**

- `catchup` skill 文档中出现对 TDD Evidence 的显式检查要求
- 与 `07-code/references/tdd-guard.md` 口径一致

**验证方式**

- 人工审查 `catchup` 文档

**进展更新（2026-03-15）**

- 已完成
- 已增加 `TDD 证据快照`
- 已增加恢复期 TDD 风险项与 `TDD evidence gap` 阻塞说明

---

## Task 7：更新 `14-status/SKILL.md`

**目标**  
让状态面板中的 TDD 风险展示更明确，不再只是笼统提到“补齐 TDD 证据”。

**文件**

- 修改：[14-status/SKILL.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/14-status/SKILL.md)

**改造内容**

1. 新增 `TDD 状态` 卡片模板
2. 显示以下字段：
   - 当前实现任务是否要求 TDD
   - 是否存在 `[TDD-RED]`
   - 是否存在 `[TDD-GREEN]`
   - 是否存在 `[TDD-WAIVER]`
   - 风险等级
3. 风险文案要对齐 `tdd-guard.md`

**验收标准**

- 状态技能中有独立 TDD 卡片，而不是只在风险提示里顺带提到
- 不与当前 coverage 风险混淆

**验证方式**

- 人工审查状态模板

**进展更新（2026-03-15）**

- 已完成
- 已新增独立 `TDD 状态` 卡片
- 已把 TDD 风险与 coverage 风险分开表述

---

## Task 8：更新 `08-review/SKILL.md` 与/或 `12-verify/SKILL.md`

**目标**  
把 TDD 从“实现阶段自觉”升级为“审查阶段显式检查项”。

**文件**

- 修改：[08-review/SKILL.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/08-review/SKILL.md)
- 可选修改：[12-verify/SKILL.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/12-verify/SKILL.md)

**改造内容**

新增固定检查项：

1. 当前任务是否 required TDD？
2. 是否存在 `[TDD-RED]`？
3. `[TDD-RED]` 和 `[TDD-GREEN]` 是否针对同一测试目标？
4. 若 `[TDD-WAIVER]` 存在，理由是否在允许清单内？
5. 是否出现“先实现后补测”的合理化迹象？

**验收标准**

- 审查文档中存在专门的 TDD 检查问题
- 不再把覆盖率当作 TDD 过程替代证据

**验证方式**

- 人工审查 review/verify 文档

**进展更新（2026-03-15）**

- 已完成
- `08-review/SKILL.md` 已新增 `TDD 审查问题单`
- `12-verify/SKILL.md` 已新增 `TDD 与覆盖率的边界`
- 已明确 verify 不得把 coverage 达标表述成遵守 TDD

---

## Task 9：做一次 references 一致性审查

**目标**  
确保 `07-code/SKILL.md` 与 `references/*.md` 之间没有新的规则漂移。

**文件**

- 审查：
  - [07-code/SKILL.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/07-code/SKILL.md)
  - [tdd-guard.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/07-code/references/tdd-guard.md)
  - [report-template.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/07-code/references/report-template.md)
  - [test-template.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/07-code/references/test-template.md)

**审查清单**

1. TDD 标记格式是否完全一致
2. WAIVER 口径是否一致
3. blocked 描述是否一致
4. 主文档是否引用 references，而不是复制冲突规则

**验收标准**

- 不存在同一概念两套定义
- 不存在 references 与主文档冲突

**验证方式**

- 人工 checklist 审查

**进展更新（2026-03-15）**

- 已完成
- 已完成主文档、references、catchup/status/review/verify 的交叉检查
- 已确认不存在“文档宣称 runtime 已解析结构化 TDD 字段”的漂移

---

## 六、文件级改造说明

## 6.1 `07-code/SKILL.md`

**新增章节**

- `TDD Policy Resolution`
- `RED Evidence Minimum Bar`
- `WAIVER Rules`
- `Anti-rationalization`
- `Reference Truth Sources`

**重点文案要求**

- 先按变更类型判断，再结合端类型修正
- 必须引用 `tdd-guard.md`
- 不得直接用 coverage 替代 TDD

## 6.2 `07-code/references/tdd-guard.md`

**新增/强化内容**

- policy resolution
- multi-end matrix（精简版）
- waiver reason code
- findings 标记头格式

**必须保留**

- 当前真理源：`src/core/batch-executor/guards.ts`
- 批量预检依赖 `findings.md`

## 6.3 `07-code/references/test-template.md`

**新增/强化内容**

- RED 起手动作
- 前后端不同示例

## 6.4 `07-code/references/report-template.md`

**新增/强化内容**

- TDD blocked 的更清晰描述
- next step 模板

## 6.5 `02-catchup/SKILL.md`

**新增/强化内容**

- 当前 TASK 的 TDD 恢复提示

## 6.6 `14-status/SKILL.md`

**新增/强化内容**

- TDD 状态卡片

## 6.7 `08-review/SKILL.md` / `12-verify/SKILL.md`

**新增/强化内容**

- TDD 固定审查项

---

## 七、建议提交顺序

建议分 3 轮提交：

### Commit 1：TDD 真理源收敛

- `07-code/references/tdd-guard.md`
- `07-code/references/test-template.md`
- `07-code/references/report-template.md`

建议提交信息：

```text
docs(skill): 收敛 07-code TDD references 真理源
```

### Commit 2：主 skill 接入

- `07-code/SKILL.md`

建议提交信息：

```text
docs(skill): 强化 code skill 的 TDD policy 与 waiver 规则
```

### Commit 3：消费侧展示与审查

- `02-catchup/SKILL.md`
- `14-status/SKILL.md`
- `08-review/SKILL.md`
- `12-verify/SKILL.md`（如改）

建议提交信息：

```text
docs(skill): 在 catchup status review 中显式展示 TDD 风险
```

---

## 八、验证命令

本轮是 Skill/文档改造，验证重点是**一致性**和**可读性**，不是运行时代码行为。

### 基础检查

```bash
rg -n "TDD-RED|TDD-WAIVER|TDD-GREEN" skills/spec-first/07-code
```

目的：

- 确认主 skill 与 references 使用同一标记口径

**结果（2026-03-15）**

- 已完成，口径一致

### 交叉检查

```bash
rg -n "waiver|doc_only|conditional_waiver|required|waived" skills/spec-first/07-code skills/spec-first/02-catchup skills/spec-first/14-status skills/spec-first/08-review skills/spec-first/12-verify
```

目的：

- 确认 policy / waiver 口径一致

**结果（2026-03-15）**

- 已完成，`required / conditional_waiver / waived` 与替代验证口径已对齐

### 手工审查清单

1. `07-code/SKILL.md` 是否引用 references 真理源
2. `tdd-guard.md` 是否仍与当前 runtime 描述一致
3. `catchup` 是否能明确读出 TDD 风险
4. `status` 是否有独立 TDD 状态卡片
5. `review/verify` 是否不再混淆 coverage 与 TDD

**结果（2026-03-15）**

- 5 项均已完成检查
- 额外完成：
  - `git diff --check`
  - `pnpm lint`
  - `pnpm test`

---

## 九、验收标准

本开发任务完成后，应满足以下验收标准：

### 文档层

- `07-code` 主文档与 references 无冲突
- TDD policy / waiver / 标记格式清晰可执行
- 多端策略已写入，不是一刀切规则

### 恢复与展示层

- `catchup` 明确知道要检查 TDD 标记
- `status` 明确展示 TDD 状态
- `review/verify` 明确审查 TDD 风险

### 治理层

- 不再把 coverage gate 误写成 TDD gate
- 不再允许模糊 WAIVER 理由
- `findings.md` 成为当前最小 TDD 证据承载点

---

## 十、风险与注意事项

### 风险 1：references 与主 skill 再次漂移

缓解：

- 把 references 真理源放在第一轮提交
- 最后一轮做一次一致性审查

### 风险 2：文档过重、执行者读不懂

缓解：

- 主 skill 只保留策略和动作
- 细节放 references

### 风险 3：多端策略写得太复杂

缓解：

- 只保留最小矩阵
- 不做端特定长篇例外表

### 风险 4：被误认为已实现系统级硬强制

缓解：

- 在文档中反复明确：
  - 这是 skill 级增强
  - 不是 CLI/Gate 级硬门禁

---

## 十一、最终建议

这份开发任务文档对应的是：

> **“基于 Skill 的 TDD 强制最小改动方案”的落地执行版本**

最重要的执行原则只有两条：

1. **先收敛 `07-code/references/` 真理源，再改主 skill**
2. **所有新增约束都必须兼容当前 `[TDD-RED] / [TDD-WAIVER] / [TDD-GREEN]` 口径**

只要这两条守住，这次改造就能做到：

- 改动小
- 收益快
- 不破坏现有 runtime
- 为后续升级到完整 TDD 强制方案留足余地
