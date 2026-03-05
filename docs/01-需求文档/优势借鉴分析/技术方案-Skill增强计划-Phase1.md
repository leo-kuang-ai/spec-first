# Spec-First Skill 增强技术方案 - Phase 1

> **版本**: 1.6.0 | **日期**: 2026-03-04 | **状态**: 已评审（待实施） | **审查基线**: `技术方案审查报告-Phase1.md`

---

## 概述

本文档定义了 Spec-First 项目的 4 个高优先级 Skill 增强方案，借鉴自 Superpowers、Trellis 和 Spec Kit 项目。

### 增强项列表

| 优先级 | 增强项 | 来源 | 目标 Skill | 预估工作量 |
|--------|--------|------|-----------|-----------|
| P0 | TDD 强制铁律 | Superpowers | code | 中 |
| P0 | break-loop 深度复盘 | Trellis | archive | 低 |
| P0 | 分层检查体系 | Trellis | verify + code-review | 中 |
| P0 | Constitution 权威层 | Spec Kit | 全局 | 低 |

---

## 一、TDD 强制铁律（P0）

### 1.1 当前状态

**文件**: `skills/spec-first/07-code/SKILL.md`

**现状**:
- test Skill 在 `05_verify` 阶段，是后置验证
- code Skill 无“失败测试证据”前置约束
- 存在 3-Strike Error Protocol，但无 TDD 循环

**问题**:
- 代码写完后才发现设计缺陷
- 返工成本高
- 测试覆盖率后补，质量不可控

### 1.2 目标状态

将 Superpowers 的 TDD 铁律引入 code Skill：

```
RED（写失败测试）→ Verify RED → GREEN（最小实现）→ Verify GREEN → REFACTOR
```

**核心铁律**: 无失败测试在前，不得编写生产代码。

### 1.3 实现方案

#### 1.3.1 修改 code Skill 入口守卫

**文件**: `skills/spec-first/07-code/SKILL.md`

**新增 HARD-GATE**:

```markdown
## TDD 强制入口守卫（P1-TDD）

<HARD-GATE>
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST.

进入 code 前，当前 TASK 必须满足以下之一：
1. 已有对应失败测试证据（测试命令 + 失败输出），且失败原因为功能缺失
2. 用户明确豁免（必须记录到 findings.md，附豁免理由）

任一前置条件失败即停止：返回阻断原因，不得继续写代码。
</HARD-GATE>

### TDD 豁免场景（需用户确认）

| 场景 | 豁免条件 |
|------|---------|
| 纯配置变更 | 无业务逻辑的配置文件修改 |
| 生成的代码 | 工具自动生成的代码 |
| 抛弃式原型 | 明确标记为探索性代码 |
| 文档/注释 | 不涉及运行逻辑的变更 |
```

#### 1.3.2 新增 Red-Green-Refactor 循环

**新增执行阶段**:

~~~markdown
## TDD 执行循环

### Phase A: RED - 编写失败测试

1. 为当前 TASK 编写最小测试用例
2. 测试必须：
   - 描述单一行为
   - 测试名称清晰表达预期
   - 使用真实代码（避免过度 mock）

### Phase B: Verify RED - 验证测试失败

**强制执行**:
```bash
# Step 1: 探测可用测试命令（仅用于选择命令，不计入验证证据）
# 探测顺序: pnpm test → npm test → yarn test → pytest → go test
#
# Step 2: 选定后执行单一命令（保留完整输出与退出码，禁止 2>/dev/null）
pnpm test -- path/to/test.test.ts
```

确认：
- 测试失败（非错误）
- 失败原因正确（功能缺失，非语法错误）
- 测试通过 = 测试现有行为，需修复测试

### Phase C: GREEN - 最小实现

编写最小代码使测试通过：
- 不添加额外功能
- 不过度设计
- 不重构其他代码

### Phase D: Verify GREEN - 验证测试通过

**强制执行**:
```bash
# 使用与 RED 阶段相同的已选命令执行回归
# 保留完整输出与退出码，作为 GREEN 证据
pnpm test -- path/to/test.test.ts
```

确认：
- 测试通过
- 其他测试仍通过
- 无错误/警告输出

### Phase E: REFACTOR - 清理（可选）

测试通过后可进行：
- 消除重复
- 改进命名
- 提取辅助函数

**约束**: 保持测试绿色，不添加新行为。
~~~

#### 1.3.3 新增反合理化守卫

```markdown
## TDD 反合理化守卫

| AI 的借口 | 封堵 |
|-----------|------|
| "这个改动太小，不需要测试" | 小代码也有 bug，测试只需 30 秒 |
| "我会在写完代码后补测试" | 事后测试证明不了什么，测试应与改动配套 |
| "我已经手动测试过了" | 手动测试 != 自动化验证，无法回归 |
| "测试太难写，先写代码" | 测试难 = 设计复杂，应先简化设计 |
| "这是重构，不影响行为" | 重构不改行为 != 重构不引入 bug |
| "保留代码作为参考，重新写测试" | 保留 = 会适配，这还是测试后置 |
| "删除 X 小时的工作太浪费" | 沉没成本谬误，保留未验证代码是技术债 |

**发现以上念头时，立即停止，强制执行 TDD 流程。**
```

#### 1.3.4 TDD 证据落盘与追踪闭环（新增）

为避免“做了 TDD 但 Gate 仍失败”，新增以下硬约束：

1. **RED/GREEN 证据落盘**（必做）  
   每次 Verify RED / Verify GREEN 后，必须写入 `findings.md`：
   - 测试命令（完整）
   - 退出码
   - 关键输出摘要（失败原因或通过结论）
2. **测试追踪闭环**（必做）  
   新增测试涉及新覆盖点时，必须：
   - 注册 TC：`spec-first id next TC <abbr> --feature <featureId> --level <UT|IT|E2E|ST>`
   - 回填矩阵：`spec-first matrix update <featureId> <tcId> --upstream <frId>`
3. **阶段对齐约束**（必做）  
   `04_implement` 阶段推进前，必须确保 TDD 产出的测试已纳入矩阵；否则 C4/C5 可能不达标。
4. **豁免记录**（必做）  
   TDD 豁免必须落盘到 `findings.md`，字段至少包含：场景、理由、批准人、时间戳。

### 1.4 修改文件清单

| 文件 | 修改类型 | 说明 |
|------|---------|------|
| `skills/spec-first/07-code/SKILL.md` | 增强 | 新增 TDD 入口守卫 + 执行循环 |
| `skills/spec-first/09-test/SKILL.md` | 关联 | 说明与 code 的 TDD 联动 |
| `skills/spec-first/06-task/SKILL.md` | 关联 | TASK 规格可包含测试用例建议 |
| `src/core/skill-runtime/hard-gate.ts` | 增强 | 新增 TDD 前置证据检查（阻断型） |
| `tests/unit/hard-gate.test.ts` | 增强 | 补充无 RED 证据阻断/豁免通过用例 |

### 1.5 验证方法

1. **单元测试**: 验证 HARD-GATE 检查逻辑
2. **集成测试**: 执行 `/spec-first:code` 验证 TDD 流程
3. **回归测试**: 确保现有功能不受影响
4. **证据审计**: 抽检 `findings.md` 是否包含 RED/GREEN 命令与退出码
5. **追踪审计**: 抽检新增测试是否完成 `TC + matrix` 闭环

---

## 二、break-loop 深度复盘（P0）

### 2.1 当前状态

**文件**: `skills/spec-first/10-archive/SKILL.md`

**现状**:
- 有"经验教训"输出要求
- 有"归档组合门槛"
- 无结构化失败分析框架

**问题**:
- 失败知识沉淀浅
- 同类问题重复发生
- 无预防机制回写

### 2.2 目标状态

将 Trellis 的 break-loop 5 维度分析框架引入 archive Skill。

### 2.3 实现方案

#### 2.3.0 核心理念

> **调试的价值不在于修复 bug，而在于让这类 bug 永远不再发生。**
>
> 30 分钟分析 = 节省 30 小时未来调试。

三层洞察：
1. **战术层**: 如何修复**这个** bug
2. **战略层**: 如何预防**这类** bug
3. **哲学层**: 如何扩展思考模式

#### 2.3.1 新增 5 维度分析框架

**文件**: `skills/spec-first/10-archive/SKILL.md`

**新增内容**:

```markdown
## 5 维度失败分析（P1-BL）

归档时必须完成以下 5 维度分析（针对本 Feature 中的失败/阻塞/豁免）：

### 维度 1: 根因分类

| 类别 | 特征 | 示例 |
|------|------|------|
| **A. Missing Spec** | 无文档说明如何做 | 新功能无检查清单 |
| **B. Cross-Layer Contract** | 层间接口不清晰 | API 返回格式与预期不符 |
| **C. Change Propagation Failure** | 改了一处，漏了其他 | 函数签名变更，遗漏调用点 |
| **D. Test Coverage Gap** | 单元测试通过，集成失败 | 单独工作，组合失败 |
| **E. Implicit Assumption** | 代码依赖未文档假设 | 时间戳秒 vs 毫秒 |

**必填**: 本 Feature 遇到的根因类别及具体描述。

### 维度 2: 为何修复失败

如果尝试多次才成功，分析每次失败：

| 失败类型 | 特征 |
|---------|------|
| **表面修复** | 修复症状，非根因 |
| **不完整范围** | 找到根因，未覆盖所有场景 |
| **工具限制** | grep 漏掉，类型检查不严格 |
| **心智模型偏差** | 持续在同一层查找，未考虑跨层 |

### 维度 3: 预防机制

| 类型 | 说明 | 示例 |
|------|------|------|
| **Documentation** | 写下来让人知道 | 更新思考指南 |
| **Architecture** | 结构上使错误不可能 | 类型安全包装 |
| **Compile-time** | TypeScript strict，no any | 签名变更导致编译错误 |
| **Runtime** | 监控、告警、扫描 | 检测孤儿实体 |
| **Test Coverage** | E2E 测试、集成测试 | 验证完整流程 |
| **Code Review** | 检查清单、PR 模板 | "是否检查了 X？" |

**必填**: 至少列出 1 条预防机制。

### 维度 4: 系统性扩展

- **Similar Issues**: 类似问题可能出现在哪里？
- **Design Flaw**: 是否存在根本性架构问题？
- **Process Flaw**: 开发流程是否需要改进？
- **Knowledge Gap**: 团队是否缺少某些理解？

### 维度 5: 知识捕获

- [ ] 更新 `.spec-first/constitution.md`（如涉及全局原则，主权威）
- [ ] 更新 `specs/{featureId}/constitution.md`（仅 Feature 特例覆盖，并注明原因）
- [ ] 更新 `skills/spec-first/*/references/*.md`（如涉及检查清单）
- [ ] 创建 Issue 记录（如适用）
- [ ] 创建 Feature 工单进行根因修复（如适用）

---

## 分析后立即行动（P1-BL-ACTION）

> **重要**: 完成 5 维度分析后，必须**立即执行**以下行动。分析如果留在对话中毫无价值，价值在于**更新的规范**。

### 必做事项

1. **更新相关规范** - 不要只列 TODO，实际更新文件：
   - 跨层问题 → 更新 `cross-layer-checklist.md`
   - 代码复用问题 → 更新相关检查清单
   - 新发现的坑 → 更新 `common-pitfalls.md`（如适用）
2. **提交规范更新** - 这是**主要产出**，不只是分析文本

### 示例

~~~markdown
# ❌ 错误示例（只列 TODO）
- [ ] 需要更新跨层检查清单

# ✅ 正确示例（立即执行）
已更新 `skills/spec-first/08-code-review/references/cross-layer-checklist.md`：
- 新增 B4: "修改 API 响应格式时检查所有调用方"
~~~

#### 2.3.2 新增归档模板

**文件**: `skills/spec-first/10-archive/references/retro-template.md`（新建）

```markdown
# Feature 归档报告: {featureId}

## 一、交付物清单

| 产物 | 路径 | 状态 |
|------|------|------|
| spec.md | specs/{featureId}/spec.md | ✅/⚠️/❌ |
| design.md | specs/{featureId}/design.md | ✅/⚠️/❌ |
| task_plan.md | specs/{featureId}/task_plan.md | ✅/⚠️/❌ |
| tests/ | specs/{featureId}/tests/*.test.md | ✅/⚠️/❌ |

## 二、覆盖率报告

| 覆盖维度 | 指标 | 值 |
|---------|------|-----|
| C1: Design Coverage | FR → DS | X/Y |
| C2: API Coverage | FR → DS（当前实现与 C1 同口径） | X/Y |
| C3: Task Coverage | FR → TASK | X/Y |
| C4: Test Coverage (FR) | FR → TC | X/Y |
| C5: Test Coverage (AC) | FR → TC（当前实现暂与 C4 同口径） | X/Y |

## 三、5 维度失败分析

### 3.1 根因分类

| ID | 类别 | 具体描述 |
|----|------|---------|
| 1 | [A/B/C/D/E] | _填写_ |

### 3.2 修复失败分析

| 尝试 | 失败原因 |
|------|---------|
| 1 | _填写_ |

### 3.3 预防机制

| 优先级 | 类型 | 具体行动 | 状态 |
|--------|------|---------|------|
| P0 | _类型_ | _行动_ | TODO/DONE |

### 3.4 系统性扩展

- **Similar Issues**: _填写_
- **Design Flaw**: _填写_
- **Process Flaw**: _填写_

### 3.5 知识捕获

- [ ] 更新 `.spec-first/constitution.md`（全局原则）
- [ ] 更新 `specs/{featureId}/constitution.md`（特例覆盖）
- [ ] 更新 references/*.md
- [ ] 创建 Issue/Feature 工单

## 四、Gate 历史摘要

| Gate | 时间 | 结果 | 豁免 |
|------|------|------|------|
| 01_specify | YYYY-MM-DD | PASS/FAIL | - |

## 五、经验教训

### 做得好的
- _填写_

### 需改进的
- _填写_

### 下次避免的
- _填写_
```

### 2.4 修改文件清单

| 文件 | 修改类型 | 说明 |
|------|---------|------|
| `skills/spec-first/10-archive/SKILL.md` | 增强 | 新增 5 维度分析框架 |
| `skills/spec-first/10-archive/references/retro-template.md` | 新建 | 归档报告模板 |

### 2.5 验证方法

1. 执行 `/spec-first:archive` 验证 5 维度分析输出
2. 检查 retro.md 是否包含完整分析

---

## 三、分层检查体系（P0）

### 3.1 当前状态

**文件**:
- `skills/spec-first/08-code-review/SKILL.md`
- `skills/spec-first/12-verify/SKILL.md`

**现状**:
- code-review 有两阶段（合规 + 质量）
- verify 有五步 Gate Function
- 无统一分层术语与参数约定（single/cross/completion）
- 当前仅存在 Skill 入口 `/spec-first:code-review` 与 `/spec-first:verify`，无对应 CLI 子命令

**问题**:
- 系统级一致性检查分散
- 跨层检查无明确入口
- 完成检查与单层检查混在一起

### 3.2 目标状态

基于 Trellis 跨层检查概念，扩展为三层检查体系：

> **来源说明**:
> - **Layer 1**（单层检查）= Spec-First 原有检查项整合
> - **Layer 2**（跨层检查）= Trellis check-cross-layer 借鉴
> - **Layer 3**（完成检查）= Spec-First Gate 体系封装

```
Layer 1: 单层检查（Spec-First 原有）
Layer 2: 跨层检查（Trellis 借鉴）
Layer 3: 完成检查（Gate 体系封装）
```

### 3.3 实现方案

#### 3.3.1 定义三层检查结构

**文件**: `skills/spec-first/12-verify/SKILL.md`（增强）

```markdown
## 三层检查体系（P1-LAYER）

### Layer 1: 单层检查（Single-Layer）

**触发**: 每次代码变更后

**检查维度**:
| 维度 | 检查项 | 来源 |
|------|--------|------|
| SOLID | 单一职责/开闭/里氏/接口隔离/依赖反转 | solid-checklist.md |
| 安全 | 输入验证/认证授权/敏感数据处理 | security-checklist.md |
| 性能 | 算法复杂度/资源使用/缓存策略 | performance-checklist.md |
| 测试 | 覆盖率/边界条件/错误路径 | testing-checklist.md |

**Skill 命令**: `/spec-first:code-review --layer single`

### Layer 2: 跨层检查（Cross-Layer）

**触发**: 功能完成后、提交前

**检查维度**:

| 维度 | 触发条件 | 检查项 |
|------|---------|--------|
| **A: 跨层数据流** | 涉及 3+ 层 | 数据格式/错误处理/类型一致性 |
| **B: 代码复用** | 修改常量/配置 | 类似代码是否存在？是否可提取？ |
| **B2: 新工具函数** | 创建新函数 | 是否有类似函数？命名是否一致？ |
| **B3: 批量修改后** | 修改多个文件 | 是否有遗漏？影响范围是否完整？ |
| **C: 导入/依赖路径** | 创建新文件 | 导入路径是否正确？循环依赖？ |
| **D: 同层一致性** | 修改显示逻辑 | 与同层其他组件风格一致？ |

**Skill 命令**: `/spec-first:code-review --layer cross`

### Layer 3: 完成检查（Completion）

**触发**: 阶段推进前

**检查维度**:
| 维度 | 检查项 |
|------|--------|
| Gate 通过 | `spec-first gate check` 退出码 0 |
| 覆盖率达标 | 以 `gate check` 当前阶段阈值判定为准（不重复定义统一阈值） |
| traces 完整 | 所有代码变更有关联 TASK/FR/DS |
| 文档同步 | 新模式是否需要更新规范？ |

**Skill 命令**: `/spec-first:verify --layer completion`
```

#### 3.3.2 增强 code-review Skill

**文件**: `skills/spec-first/08-code-review/SKILL.md`

```markdown
## 执行阶段（增强）

- P0: 定位 Feature，确定检查层级（single/cross/completion）
- P1: 根据层级加载对应检查清单
- P2: 执行 Stage 1（合规）
- P3: Stage 1 通过后执行 Stage 2（质量 + 跨层检查）
- P4: 与用户确认审查发现
- P5: 审查通过则更新 TASK 状态

## 检查层级选择

| 场景 | 推荐层级 |
|------|---------|
| 单文件小改动 | single |
| 多文件/跨模块改动 | cross |
| 功能完成/阶段推进 | completion |
| 不确定 | cross（更安全） |
```

#### 3.3.3 新增跨层检查清单

**文件**: `skills/spec-first/08-code-review/references/cross-layer-checklist.md`（新建）

```markdown
# Cross-Layer 检查清单

## A. 跨层数据流（涉及 3+ 层时必做）

- [ ] 数据格式在层间转换正确
- [ ] 错误在层间正确传播
- [ ] 类型定义在各层一致
- [ ] 边界条件在各层处理一致

## B. 代码复用

### B1. 修改常量/配置时
- [ ] 检索所有使用该常量的位置
- [ ] 确认所有使用点都已更新
- [ ] 考虑是否应提取为共享配置

### B2. 创建新工具函数时
- [ ] 搜索是否已存在类似函数
- [ ] 命名与现有函数风格一致
- [ ] 放置在正确的模块位置

### B3. 批量修改后
- [ ] 确认影响范围完整
- [ ] 检查是否有遗漏的调用点
- [ ] 验证所有相关测试通过

## C. 导入/依赖路径

- [ ] 导入路径正确（相对/绝对）
- [ ] 无循环依赖
- [ ] 新文件已添加到正确的目录

## D. 同层一致性

- [ ] 命名风格与同层组件一致
- [ ] API 签名与同层组件一致
- [ ] 错误处理与同层组件一致
```

#### 3.3.4 新增层级参数运行时校验（新增）

**文件**: `src/core/skill-runtime/dispatcher.ts`（增强）

新增参数解析与校验规则：
- `code-review` 仅允许：`single | cross | completion`
- `verify` 仅允许：`completion`（本期）
- 非法值直接返回 `route=error`，禁止“静默忽略参数”
- 未传 `--layer` 时采用默认策略：
  - `code-review`: `cross`
  - `verify`: `completion`

### 3.4 修改文件清单

| 文件 | 修改类型 | 说明 |
|------|---------|------|
| `skills/spec-first/12-verify/SKILL.md` | 增强 | 新增三层检查体系定义 |
| `skills/spec-first/08-code-review/SKILL.md` | 增强 | 新增层级选择逻辑 |
| `skills/spec-first/08-code-review/references/cross-layer-checklist.md` | 新建 | 跨层检查清单 |
| `src/core/skill-runtime/dispatcher.ts` | 增强 | 新增 `--layer` 参数校验与默认值 |
| `tests/unit/skill-runtime.test.ts` | 增强 | 补充非法 layer 阻断与默认 layer 用例 |

### 3.5 验证方法

1. 执行 `/spec-first:code-review --layer cross` 验证跨层检查
2. 执行 `/spec-first:verify --layer completion` 验证完成检查
3. 确认三层检查输出格式正确
4. 执行非法参数（如 `--layer bad`）应返回明确错误

---

## 四、Constitution 权威层（P0）

### 4.1 当前状态

**文件**:
- **主模板**: `.spec-first/constitution.md`（项目级，source of truth）
- **Feature 副本**: `specs/{featureId}/constitution.md`（Feature 级，从主模板复制）

**现状**:
- constitution.md 存在
- Gate 已有 C11 合规检查（Constitution compliance）
- spec/design 已加载 constitution.md 作为输入
- init 命令从 `.spec-first/constitution.md` 复制到 `specs/{featureId}/constitution.md`

- **缺少主副本同步策略**（见下方补充）
- 规范冲突时缺少统一仲裁输出模板

**问题**:
- constitution 与 spec/design/code 的优先级未在 Skill 规范中显式固化
- 主模板更新后，已存在的 Feature 副本如何同步？
- 规范冲突时缺少统一仲裁输出模板

**主副本同步策略**（见下方表格）:

| 场景 | 同步策略 |
|------|---------|
| 新 Feature 初始化 | 从主模板复制 |
| 主模板更新 | **不同步**。需新增专用同步步骤（当前 sync skill 不支持此功能） |
| Feature 有特殊需求 | 在 Feature 副本中添加覆盖规则，并注明原因 |
| 归档知识回写 | 全局原则先写主模板；Feature 特例再写副本 |

**版本冲突仲裁**:

| 冲突场景 | 仲裁规则 |
|---------|---------|
| Spec 与 Constitution 冲突 | Spec 需修改，宪法优先 |
| Design 与 Constitution 冲突 | Design 需修改，宪法优先 |
| Code 与 Constitution 冲突 | 代码需修改，宪法优先 |

### 4.2 目标状态

借鉴 Spec Kit 的 Constitution 机制：

```
Constitution（宪法） > Spec（规格） > Design（设计） > Code（代码）
```

### 4.3 实现方案

#### 4.3.1 定义宪法权威层级

**文件**: `skills/spec-first/03-spec/references/constitution-authority.md`（新建，design/code-review 复用）

~~~markdown
# Constitution 权威层级

## 权威层级定义

```
Level 0: Constitution（宪法）     ← 最高权威，不可违反
Level 1: Spec（规格）             ← 业务需求，宪法约束下
Level 2: Design（设计）           ← 技术方案，规格约束下
Level 3: Code（代码）             ← 具体实现，设计约束下
```

## 冲突仲裁规则

| 冲突场景 | 仲裁规则 |
|---------|---------|
| Code 与 Design 冲突 | Code 错，需修改代码 |
| Design 与 Spec 冲突 | 需讨论：是否需求变更？ |
| Spec 与 Constitution 冲突 | Spec 需修改，宪法优先 |
| 任何与宪法冲突 | 宪法优先，必须修改违反项 |

## 宪法检查点

| 检查时机 | 检查内容 |
|---------|---------|
| spec 生成后 | FR 是否违反宪法原则？ |
| design 生成后 | DS 是否违反宪法约束？ |
| code-review 时 | 代码是否违反宪法规则？ |
| verify 时 | 全部交付物是否通过宪法检查？ |
~~~

#### 4.3.2 增强 spec Skill

**文件**: `skills/spec-first/03-spec/SKILL.md`

```markdown
## 宪法权威检查（P1-CON）

### P1.5: 宪法一致性检查

生成 FR 后，必须执行宪法检查：

1. 加载 `specs/{featureId}/constitution.md`
2. 检查每条 FR 是否违反宪法原则
3. 发现违反时：
   - 标记 `[CONSTITUTION_VIOLATION]`
   - 输出违反的具体宪法条款
   - 建议修改方案
4. 用户确认后继续

### 宪法违反示例

| FR 内容 | 宪法条款 | 判定 |
|---------|---------|------|
| "密码明文存储" | "敏感数据必须加密存储" | ❌ 违反 |
| "API 返回所有用户数据" | "最小权限原则" | ❌ 违反 |
| "使用 any 类型" | "类型安全优先" | ❌ 违反 |
```

#### 4.3.3 增强 design Skill

**文件**: `skills/spec-first/04-design/SKILL.md`

```markdown
## 宪法权威检查（P1-CON）

### P2.5: 设计宪法检查

生成 DS 后，必须执行宪法检查：

1. 加载 `specs/{featureId}/constitution.md`
2. 检查每条 DS 是否违反宪法约束
3. 发现违反时处理同 spec Skill
```

#### 4.3.4 增强 code-review Skill

**文件**: `skills/spec-first/08-code-review/SKILL.md`

```markdown
## Stage 1: 合规审查（增强）

### 1.1 宪法合规（最高优先级）

- [ ] 代码是否违反 constitution.md 中的原则？
- [ ] 是否使用了宪法禁止的模式？
- [ ] 是否遗漏了宪法要求的检查？

**硬规则**: 宪法违规 = CRITICAL，必须修复。
```

### 4.4 修改文件清单

| 文件 | 修改类型 | 说明 |
|------|---------|------|
| `skills/spec-first/03-spec/references/constitution-authority.md` | 新建 | 宪法权威层级定义（共享） |
| `skills/spec-first/03-spec/SKILL.md` | 增强 | 新增宪法检查步骤 |
| `skills/spec-first/04-design/SKILL.md` | 增强 | 新增宪法检查步骤 |
| `skills/spec-first/08-code-review/SKILL.md` | 增强 | Stage 1 增加宪法合规 |

### 4.5 验证方法

1. 创建违反宪法的 FR，验证 spec Skill 检出
2. 创建违反宪法的设计，验证 design Skill 检出
3. 创建违反宪法的代码，验证 code-review Skill 检出

---

## 五、实施计划

### 5.1 阶段划分

```
Phase 1A（1-2 天）: break-loop + Constitution
├── archive Skill 增强
├── 宪法权威层定义
└── 相关 Skill 宪法检查增强

Phase 1B（2-3 天）: TDD 铁律 + 分层检查
├── code Skill TDD 增强
├── 三层检查体系定义
└── code-review 跨层检查增强
```

### 5.2 依赖关系

```
Constitution ──┬──→ spec 检查
               ├──→ design 检查
               └──→ code-review 检查

TDD ───────────└──→ code 入口守卫

break-loop ────└──→ archive 模板

分层检查 ──────└──→ code-review + verify
```

### 5.3 风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| TDD 增加开发时间 | 短期变慢 | 长期质量提升，强调价值 |
| 宪法检查过于严格 | 阻塞开发 | 允许豁免，记录原因 |
| 三层检查复杂度高 | 执行成本 | 按需选择层级，默认 cross；先在 Skill 层实现，再评估是否补 CLI 子命令 |

---

## 六、验收标准

### 6.1 TDD 铁律

- [ ] code Skill 入口有 TDD HARD-GATE
- [ ] 无失败测试证据时阻止写生产代码
- [ ] 豁免场景可正常通过
- [ ] 反合理化守卫完整
- [ ] RED/GREEN 证据写入 `findings.md`（命令 + 退出码）
- [ ] 新增测试完成 `TC + matrix` 追踪闭环

### 6.2 break-loop 复盘

- [ ] archive 输出包含核心理念声明
- [ ] archive 输出包含 5 维度分析
- [ ] archive 输出包含 Immediate Actions 章节
- [ ] retro.md 模板完整
- [ ] 知识捕获强调"立即执行"而非"可选"

### 6.3 分层检查
- [ ] 三层定义清晰
- [ ] `/spec-first:code-review` 支持 `--layer` 参数约定
- [ ] `/spec-first:verify` 支持 `--layer completion` 验收
- [ ] 跨层检查清单完整
- [ ] 非法 `--layer` 参数被运行时阻断并返回错误

### 6.4 Constitution 权威

- [ ] 宪法层级定义明确
- [ ] spec/design/code-review 有宪法检查
- [ ] 违反宪法时正确阻断
- [ ] 主模板与 Feature 副本的同步/覆盖策略可执行且可审计

---

## 七、代码审查对齐（实施基线）

### 7.1 对齐范围

- 审查文档: `docs/01-需求文档/优势借鉴分析/技术方案审查报告-Phase1.md`
- 审查日期: 2026-03-04
- 审查结论: 5/5（已评审，待实施）
- 对齐目标: 将审查报告中的 12 项修复结论固化为实施阶段不可回退基线

### 7.2 审查问题落点映射

| 审查项 | 本文落点 | 基线要求 |
|-------|---------|---------|
| #1 break-loop 缺少 Immediate Actions | 2.3.1、2.3.2、6.2 | 归档输出必须包含 Immediate Actions 且可执行 |
| #2 Layer 1 来源归属错误 | 3.2、3.3.1 | Layer 1 标注为 Spec-First 原有检查项整合 |
| #3 break-loop 缺少核心理念声明 | 2.3.0 | 保留核心理念与三层洞察 |
| #4 覆盖率指标映射不一致 | 2.3.2 | 覆盖率表保持 C1=Design、C2=API |
| #5 Constitution 主副本同步策略缺失 | 4.1 | 明确“主模板更新默认不同步，需专用步骤” |
| #6 分层检查验收项不完整 | 6.3 | 验收项覆盖 single/cross/completion 约定 |
| #7 嵌套 fence 结构错误（v1.4） | 1.3.2 | 外层使用 `~~~markdown`，避免嵌套渲染断裂 |
| #8 嵌套 fence 结构错误（v1.5） | 4.3.1 | 宪法示例区块保持可渲染结构 |
| #9 sync skill 职责不匹配 | 4.1 | 文档明确当前 sync skill 不承担副本同步 |
| #10 TDD 命令通用性不足 | 1.3.2 | 保留包管理器探测策略 |
| #11 悬空引用 4.1.1 | 4.1 | 禁止悬空引用，统一改为就近说明 |
| #12 状态语义冲突 | 文档头部元数据 | 状态统一为“已评审（待实施）” |

### 7.3 实施回归约束

1. 实施任何 Skill 改动时，不得回退 7.2 表中基线项。
2. 提交前至少执行一次 `/spec-first:code-review --layer cross` 与 `/spec-first:verify --layer completion` 进行交叉验收。
3. 若实现中确需偏离基线，必须在 `findings.md` 记录偏离原因、影响范围和补救策略。

---

## 八、最小代码改动集合（实施清单）

### 8.1 P0（必须）

| 文件 | 变更 | 目的 |
|------|------|------|
| `src/core/skill-runtime/hard-gate.ts` | 新增 TDD 证据校验（无 RED 证据阻断 code） | 让“TDD 强制”从文档规则升级为运行时约束 |
| `src/core/skill-runtime/dispatcher.ts` | 新增 `code-review/verify` 的 `--layer` 参数校验 | 防止参数静默失效 |
| `skills/spec-first/07-code/SKILL.md` | 补充 TDD 证据落盘与追踪闭环约束 | 统一执行口径 |
| `skills/spec-first/12-verify/SKILL.md` | Completion 判定改为锚定 `gate check` | 避免双阈值模型冲突 |
| `skills/spec-first/10-archive/SKILL.md` | 明确 constitution 主副本回写策略 | 避免知识回写导致副本漂移 |

### 8.2 P1（建议）

| 文件 | 变更 | 目的 |
|------|------|------|
| `skills/spec-first/08-code-review/references/cross-layer-checklist.md` | 新建跨层清单 | 固化跨层审查标准 |
| `skills/spec-first/10-archive/references/retro-template.md` | 新建复盘模板（指标口径对齐实现） | 统一复盘输出质量 |
| `skills/spec-first/03-spec/references/constitution-authority.md` | 新建权威层文档 | 明确冲突仲裁规则 |

---

## 九、测试清单（最小回归）

### 9.1 单元测试

1. `hard-gate`：无 RED 证据时 `code` 返回 `BLOCKED`  
2. `hard-gate`：豁免记录存在时允许通过  
3. `dispatcher`：`/spec-first:code-review --layer bad` 返回 `route=error`  
4. `dispatcher`：`/spec-first:verify --layer single` 返回 `route=error`  
5. `dispatcher`：未传 `--layer` 时应用默认值（code-review=cross, verify=completion）

### 9.2 集成测试

1. 走 `/spec-first:code`，验证 RED/GREEN 证据写入 `findings.md`  
2. 新增测试后验证 `TC` 注册 + `matrix update` 可通过 `matrix check`  
3. `/spec-first:verify --layer completion` 与 `spec-first gate check` 结论一致  

### 9.3 回归测试

1. 全量：`pnpm -s test`  
2. 类型：`pnpm -s typecheck`  
3. 抽样运行现有 `skill-runtime`、`gate-evaluator`、`coverage` 相关测试集

---

## 十、实施进展（2026-03-05）

### 10.1 当前进度（按最小实施清单）

| 任务 | 状态 | 产出 |
|------|------|------|
| Task 1: TDD 前置证据硬门禁 | ✅ 已完成 | `src/core/skill-runtime/hard-gate.ts` + `tests/unit/hard-gate.test.ts` |
| Task 2: `--layer` 运行时参数校验 | ✅ 已完成 | `src/core/skill-runtime/dispatcher.ts` + `tests/unit/skill-runtime.test.ts` |
| Task 3: code Skill TDD 证据与追踪闭环 | ✅ 已完成 | `skills/spec-first/07-code/SKILL.md` |
| Task 4: verify/archive 文档口径对齐 | ✅ 已完成 | `skills/spec-first/12-verify/SKILL.md` + `skills/spec-first/10-archive/SKILL.md` |
| Task 5: 回归验证 | ✅ 已完成 | 单测与类型检查通过 |
| P1-1: 跨层检查清单落地 | ✅ 已完成 | `skills/spec-first/08-code-review/references/cross-layer-checklist.md` |
| P1-2: 归档模板落地 | ✅ 已完成 | `skills/spec-first/10-archive/references/retro-template.md` |
| P1-3: 宪法权威参考落地 | ✅ 已完成 | `skills/spec-first/03-spec/references/constitution-authority.md` + Skill 引用挂接 |
| P2-1: C11 自动化映射校验 | ✅ 已完成 | `src/core/gate-engine/gate-evaluator.ts` + `tests/unit/gate-evaluator.test.ts` |
| P2-2: archive 模板回归测试 | ✅ 已完成 | `tests/unit/archive-skill-docs.test.ts` |
| P2-3: C11 文件级修复提示 | ✅ 已完成 | `src/core/gate-engine/gate-evaluator.ts` + `tests/unit/gate-evaluator.test.ts` |
| P2-4: C11 CLI 可执行修复步骤输出 | ✅ 已完成 | `src/cli/commands/gate.ts` + `tests/unit/gate-cli.test.ts` |
| P2-5: 归档组合门槛集成示例测试 | ✅ 已完成 | `tests/e2e/error-paths.test.ts` |
| P2-6: 归档组合门槛负向回归 | ✅ 已完成 | `tests/e2e/error-paths.test.ts` |
| P2-7: C11 修复步骤同步 findings 审计 | ✅ 已完成 | `src/cli/commands/gate.ts` + `tests/unit/gate-cli.test.ts` |

### 10.2 剩余任务列表（本轮）

1. 无（`spec-first worktree` 命令化入口评估已按当前决策暂缓，后续按需重启；本轮优化项已完成）。

### 10.3 下一步建议（P1）

1. `spec-first worktree` 命令化入口评估（当前暂缓，后续按需恢复）。  
2. 评估是否为 `findings.md` 新增“Gate 修复建议”标准模板段，统一跨阶段落盘格式。  
3. 补充一条“已有 `findings.md` 时追加写入不破坏原内容结构”的回归测试。  

---

## 附录：参考来源

| 增强项 | 来源项目 | 参考文件 |
|--------|---------|---------|
| TDD 铁律 | Superpowers | `skills/test-driven-development/SKILL.md` |
| break-loop | Trellis | `.agents/skills/break-loop/SKILL.md` |
| 分层检查 | Trellis | `.agents/skills/check-cross-layer/SKILL.md` |
| Constitution | Spec Kit | `templates/commands/constitution.md` |
