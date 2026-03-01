# 检查验证命令详解

> 本文档详细分析 Trellis 的检查验证命令

---

## 1. `/trellis:finish-work` - 完成前检查清单

### 1.1 功能概述

**核心职责**: 在提交或交付前确保工作完整性

**触发时机**: 代码编写并测试完成后，提交前

### 1.2 检查清单

#### 1. 代码质量

```bash
# 必须通过
pnpm lint
pnpm type-check
pnpm test
```

| 检查项 | 说明 |
|--------|------|
| `pnpm lint` 通过且 0 错误 | 代码风格检查 |
| `pnpm type-check` 通过且无类型错误 | TypeScript 类型检查 |
| 测试通过 | 单元测试、集成测试 |
| 无 `console.log` 语句 | 使用 logger 替代 |
| 无非空断言 (`x!` 操作符) | 安全的类型处理 |
| 无 `any` 类型 | 明确的类型定义 |

#### 1.5 测试覆盖

参考 `.trellis/spec/unit-test/conventions.md` "When to Write Tests"：

| 场景 | 测试要求 |
|------|----------|
| 新纯函数 | 需要添加单元测试 |
| Bug 修复 | 需要在 `test/regression.test.ts` 添加回归测试 |
| 更改 init/update 行为 | 需要添加/更新集成测试 |
| 无逻辑变更（仅文本/数据） | 无需测试 |

#### 2. Code-Spec 同步

**Code-Spec 文档检查**:
- `.trellis/spec/backend/` 是否需要更新？
  - 新模式、新模块、新约定
- `.trellis/spec/frontend/` 是否需要更新？
  - 新组件、新 hooks、新模式
- `.trellis/spec/guides/` 是否需要更新？
  - 新跨层流程、bug 教训

**关键问题**:
> "如果我修复了一个 bug 或发现了一些非显而易见的东西，我应该文档化它以便未来我（或其他人）不会遇到同样的问题吗？"

如果 YES → 更新相关 code-spec 文档。

#### 2.5 Code-Spec 硬阻断（基础设施/跨层）

如果变更涉及基础设施或跨层契约，这是阻塞性检查清单：

| 检查项 | 说明 |
|--------|------|
| Spec 内容可执行 | 真实签名/契约，非仅原则文本 |
| 包含文件路径 + 命令/API 名称 + 载荷字段名 | 具体可追溯 |
| 包含验证和错误矩阵 | 所有错误场景覆盖 |
| 包含 Good/Base/Bad 案例 | 示例完整 |
| 包含必需测试和断言点 | 测试要求明确 |

**阻断规则**:
- 在管道模式中，finish agent 会自动检测并在发现差距时执行 spec 更新
- 如果手动运行此检查清单，确保在提交前完成 spec 同步 — 如需要运行 `/trellis:update-spec`

#### 3. API 变更

如果修改了 API 端点：

| 检查项 | 说明 |
|--------|------|
| 输入 schema 更新 | 请求体结构 |
| 输出 schema 更新 | 响应体结构 |
| API 文档更新 | OpenAPI/文档 |
| 客户端代码更新 | 前端调用匹配 |

#### 4. 数据库变更

如果修改了数据库 schema：

| 检查项 | 说明 |
|--------|------|
| Migration 文件创建 | 版本化迁移 |
| Schema 文件更新 | 类型定义 |
| 相关查询更新 | 查询适配 |
| Seed 数据更新（如适用） | 测试数据 |

#### 5. 跨层验证

如果变更跨多个层：

| 检查项 | 说明 |
|--------|------|
| 数据正确流过所有层 | 端到端数据流 |
| 错误处理在各边界工作 | 异常传播 |
| 类型在各层一致 | 类型契约 |
| 加载状态处理 | UI 反馈 |

#### 6. 手动测试

| 检查项 | 说明 |
|--------|------|
| 功能在浏览器/应用中工作 | 实际运行验证 |
| 边界情况测试 | 极端输入 |
| 错误状态测试 | 失败场景 |
| 页面刷新后仍工作 | 状态持久化 |

### 1.3 快速检查流程

```bash
# 1. 代码检查
pnpm lint && pnpm type-check

# 2. 查看变更
git status
git diff --name-only

# 3. 根据变更文件，检查上述相关项
```

### 1.4 常见疏忽

| 疏忽 | 后果 | 检查 |
|------|------|------|
| Code-spec 文档未更新 | 其他人不知道变更 | 检查 .trellis/spec/ |
| Spec 文本仅抽象 | 基础设施/跨层变更容易回退 | 要求签名/契约/矩阵/案例/测试 |
| Migration 未创建 | Schema 不同步 | 检查 db/migrations/ |
| 类型未同步 | 运行时错误 | 检查共享类型 |
| 测试未更新 | 虚假信心 | 运行完整测试套件 |
| Console.log 遗留 | 生产日志噪音 | 搜索 console.log |

### 1.5 与其他命令的关系

```
Development Flow:
  Write code -> Test -> /trellis:finish-work -> git commit -> /trellis:record-session
                          |                              |
                   Ensure completeness              Record progress

Debug Flow:
  Hit bug -> Fix -> /trellis:break-loop -> Knowledge capture
                       |
                  Deep analysis
```

### 1.6 核心原则

> **交付不仅包括代码，还包括文档、验证和知识捕获。**
>
> Complete work = Code + Docs + Tests + Verification

---

## 2. `/trellis:break-loop` - 深度 Bug 分析

### 2.1 功能概述

**核心职责**: 在 debug 完成后进行深度分析，打破"修复 bug → 忘记 → 重复"循环

**触发时机**: Debug 完成后

### 2.2 分析框架

#### 1. 根因分类

| 类别 | 特征 | 示例 |
|------|------|------|
| **A. 缺少 Spec** | 没有文档说明如何做 | 新功能没有 checklist |
| **B. 跨层契约** | 层间接口不清楚 | API 返回格式与预期不同 |
| **C. 变更传播失败** | 改了一处，漏了其他 | 更改函数签名，漏掉调用点 |
| **D. 测试覆盖缺口** | 单元测试通过，集成失败 | 单独工作，组合失败 |
| **E. 隐式假设** | 代码依赖未文档化的假设 | 时间戳秒 vs 毫秒 |

#### 2. 为什么修复失败（如适用）

如果尝试多次修复才成功，分析每次失败：

| 失败类型 | 说明 |
|----------|------|
| **表面修复** | 修复症状，非根因 |
| **不完整范围** | 找到根因，未覆盖所有情况 |
| **工具限制** | grep 漏掉，类型检查不够严格 |
| **心智模型** | 在同一层持续查找，未考虑跨层 |

#### 3. 预防机制

| 类型 | 描述 | 示例 |
|------|------|------|
| **文档** | 写下来让人知道 | 更新思考指南 |
| **架构** | 结构上使错误不可能 | 类型安全包装 |
| **编译时** | TypeScript strict，无 any | 签名变更导致编译错误 |
| **运行时** | 监控、警报、扫描 | 检测孤立实体 |
| **测试覆盖** | E2E 测试、集成测试 | 验证完整流程 |
| **代码审查** | Checklist、PR 模板 | "你检查了 X 吗？" |

#### 4. 系统性扩展

这个 bug 揭示了哪些更广泛的问题？

| 扩展维度 | 问题 |
|----------|------|
| **类似问题** | 其他地方可能存在这个问题吗？ |
| **设计缺陷** | 是否存在根本性的架构问题？ |
| **流程缺陷** | 开发流程是否有改进空间？ |
| **知识缺口** | 团队是否缺少某些理解？ |

#### 5. 知识捕获

- [ ] 更新 `.trellis/spec/guides/` 思考指南
- [ ] 更新 `.trellis/spec/backend/` 或 `frontend/` 文档
- [ ] 创建问题记录（如适用）
- [ ] 为根因修复创建功能工单
- [ ] 如需要更新检查命令

### 2.3 输出格式

```markdown
## Bug Analysis: [Short Description]

### 1. Root Cause Category
- **Category**: [A/B/C/D/E] - [Category Name]
- **Specific Cause**: [Detailed description]

### 2. Why Fixes Failed (if applicable)
1. [First attempt]: [Why it failed]
2. [Second attempt]: [Why it failed]
...

### 3. Prevention Mechanisms
| Priority | Mechanism | Specific Action | Status |
|----------|-----------|-----------------|--------|
| P0 | ... | ... | TODO/DONE |

### 4. Systematic Expansion
- **Similar Issues**: [List places with similar problems]
- **Design Improvement**: [Architecture-level suggestions]
- **Process Improvement**: [Development process suggestions]

### 5. Knowledge Capture
- [ ] [Documents to update / tickets to create]
```

### 2.4 核心哲学

> **调试的价值不在于修复 bug，而在于使这类 bug 永远不再发生。**

三个层次的洞察：
1. **战术层**: 如何修复这个 bug
2. **战略层**: 如何预防这类 bug
3. **哲学层**: 如何扩展思考模式

30 分钟分析节省 30 小时未来调试。

### 2.5 分析后：立即行动

**重要**: 完成上述分析后，必须立即：

1. **更新 spec/guides** - 不要只列出 TODO，实际更新相关文件：
   - 如果是跨平台问题 → 更新 `cross-platform-thinking-guide.md`
   - 如果是跨层问题 → 更新 `cross-layer-thinking-guide.md`
   - 如果是代码复用问题 → 更新 `code-reuse-thinking-guide.md`
   - 如果是领域特定 → 更新 `backend/*.md` 或 `frontend/*.md`

2. **同步模板** - 更新 `.trellis/spec/` 后，同步到 `src/templates/markdown/spec/`

3. **提交 spec 更新** - 这是主要输出，不只是分析文本

> **如果分析留在聊天中是毫无价值的。价值在于更新的 spec。**

---

## 3. `/trellis:check-frontend` - 前端代码检查

### 3.1 功能概述

**核心职责**: 检查刚写的前端代码是否遵循前端开发规范

### 3.2 执行流程

```
┌─────────────────────────────────────────────────────────────┐
│                  Check Frontend Flow                         │
├─────────────────────────────────────────────────────────────┤
│  Step 1: 查看修改文件                                        │
│          git status                                          │
│                                                              │
│  Step 2: 读取前端规范索引                                    │
│          cat .trellis/spec/frontend/index.md                 │
│                                                              │
│  Step 3: 根据变更读取相关规范文件                            │
│          组件变更 → component-guidelines.md                  │
│          Hook 变更 → hook-guidelines.md                      │
│          状态变更 → state-management.md                      │
│          类型变更 → type-safety.md                           │
│          任何变更 → quality-guidelines.md                    │
│                                                              │
│  Step 4: 对照规范审查代码                                    │
│                                                              │
│  Step 5: 报告违规并修复                                      │
└─────────────────────────────────────────────────────────────┘
```

### 3.3 规范文件映射

| 变更类型 | 规范文件 |
|----------|----------|
| 组件变更 | `.trellis/spec/frontend/component-guidelines.md` |
| Hook 变更 | `.trellis/spec/frontend/hook-guidelines.md` |
| 状态变更 | `.trellis/spec/frontend/state-management.md` |
| 类型变更 | `.trellis/spec/frontend/type-safety.md` |
| 任何变更 | `.trellis/spec/frontend/quality-guidelines.md` |

---

## 4. `/trellis:check-backend` - 后端代码检查

### 4.1 功能概述

**核心职责**: 检查刚写的后端代码是否遵循后端开发规范

### 4.2 执行流程

```
┌─────────────────────────────────────────────────────────────┐
│                  Check Backend Flow                          │
├─────────────────────────────────────────────────────────────┤
│  Step 1: 查看修改文件                                        │
│          git status                                          │
│                                                              │
│  Step 2: 读取后端规范索引                                    │
│          cat .trellis/spec/backend/index.md                  │
│                                                              │
│  Step 3: 根据变更读取相关规范文件                            │
│          数据库变更 → database-guidelines.md                 │
│          错误处理 → error-handling.md                        │
│          日志变更 → logging-guidelines.md                    │
│          任何变更 → quality-guidelines.md                    │
│                                                              │
│  Step 4: 检查是否需要添加或更新测试                          │
│          参考 .trellis/spec/unit-test/conventions.md         │
│          "When to Write Tests" 部分                          │
│          新纯函数 → 需要单元测试                             │
│          Bug 修复 → 需要回归测试                             │
│          更改 init/update 行为 → 需要集成测试更新           │
│                                                              │
│  Step 5: 对照规范审查代码                                    │
│                                                              │
│  Step 6: 报告违规并修复                                      │
└─────────────────────────────────────────────────────────────┘
```

### 4.3 规范文件映射

| 变更类型 | 规范文件 |
|----------|----------|
| 数据库变更 | `.trellis/spec/backend/database-guidelines.md` |
| 错误处理 | `.trellis/spec/backend/error-handling.md` |
| 日志变更 | `.trellis/spec/backend/logging-guidelines.md` |
| 类型问题 | `.trellis/spec/backend/type-safety.md` |
| 添加平台 | `.trellis/spec/backend/platform-integration.md` |
| 任何变更 | `.trellis/spec/backend/quality-guidelines.md` |

---

## 5. `/trellis:check-cross-layer` - 跨层检查

### 5.1 功能概述

**核心职责**: 检查变更是否考虑了所有维度

**核心理念**: 大多数 bug 来自"没想到"，而非缺乏技术能力

> **注意**: 这是**实现后**的安全网。理想情况下，在写代码**前**阅读预实现检查清单。

### 5.2 相关文档

| 文档 | 目的 | 时机 |
|------|------|------|
| [预实现检查清单](.trellis/spec/guides/pre-implementation-checklist.md) | 编码前的问题 | **写代码前** |
| [代码复用思考指南](.trellis/spec/guides/code-reuse-thinking-guide.md) | 模式识别 | 实现过程中 |
| **`/trellis:check-cross-layer`** (本命令) | 验证检查 | **实现后** |

### 5.3 执行流程

#### Step 1: 识别变更范围

```bash
git status
git diff --name-only
```

#### Step 2: 选择适用的检查维度

---

## 维度 A: 跨层数据流（3+ 层必需）

**触发**: 变更涉及 3 个或更多层

| 层 | 常见位置 |
|----|----------|
| API/Routes | `routes/`, `api/`, `handlers/`, `controllers/` |
| Service/业务逻辑 | `services/`, `lib/`, `core/`, `domain/` |
| Database/存储 | `db/`, `models/`, `repositories/`, `schema/` |
| UI/展示 | `components/`, `views/`, `templates/`, `pages/` |
| Utility | `utils/`, `helpers/`, `common/` |

**检查清单**:
- [ ] 读取流: Database -> Service -> API -> UI
- [ ] 写入流: UI -> API -> Service -> Database
- [ ] 类型/schema 正确在层间传递？
- [ ] 错误正确传播到调用者？
- [ ] 加载/等待状态在各层处理？

**详细指南**: `.trellis/spec/guides/cross-layer-thinking-guide.md`

---

## 维度 B: 代码复用（修改常量/配置必需）

**触发**:
- 修改 UI 常量（标签、图标、颜色）
- 修改任何硬编码值
- 在多处看到类似代码
- 创建新的工具/辅助函数
- 刚完成跨文件批量修改

**检查清单**:
- [ ] 先搜索：有多少地方定义了这个值？
  ```bash
  grep -r "value-to-change" src/
  ```
- [ ] 如果 2+ 个地方定义相同值 → 应该提取到共享常量
- [ ] 修改后，所有使用点都更新了？
- [ ] 如果创建工具：类似工具是否已存在？

**详细指南**: `.trellis/spec/guides/code-reuse-thinking-guide.md`

---

## 维度 B2: 新工具函数

**触发**: 即将创建新的工具/辅助函数

**检查清单**:
- [ ] 先搜索现有类似工具
  ```bash
  grep -r "functionNamePattern" src/
  ```
- [ ] 如果类似存在，能扩展它吗？
- [ ] 如果创建新的，是否在正确位置（共享 vs 领域特定）？

---

## 维度 B3: 批量修改后

**触发**: 刚在多个文件中修改了类似模式

**检查清单**:
- [ ] 检查所有有类似模式的文件了吗？
  ```bash
  grep -r "patternYouChanged" src/
  ```
- [ ] 有遗漏的文件应该也更新吗？
- [ ] 这个模式应该抽象化以防止未来重复吗？

---

## 维度 C: 导入/依赖路径（创建新文件必需）

**触发**: 创建新的源文件

**检查清单**:
- [ ] 使用正确的导入路径（相对 vs 绝对）？
- [ ] 无循环依赖？
- [ ] 与项目模块组织一致？

---

## 维度 D: 同层一致性

**触发**:
- 修改显示逻辑或格式化
- 同一领域概念在多处使用

**检查清单**:
- [ ] 搜索其他使用相同概念的地方
  ```bash
  grep -r "ConceptName" src/
  ```
- [ ] 这些使用一致吗？
- [ ] 应该共享配置/常量吗？

---

### 5.4 常见问题快速参考

| 问题 | 根因 | 预防 |
|------|------|------|
| 改了一处，漏了其他 | 未搜索影响范围 | 修改前 `grep` |
| 数据在某层丢失 | 未检查数据流 | 追踪数据源到目的地 |
| 类型/schema 不匹配 | 跨层类型不一致 | 使用共享类型定义 |
| UI/输出不一致 | 同一概念在多处 | 提取共享常量 |
| 类似工具已存在 | 未先搜索 | 创建前搜索 |
| 批量修复不完整 | 未验证所有出现 | 修复后 grep |

### 5.5 输出格式

报告：
1. 变更涉及哪些维度
2. 每个维度的检查结果
3. 发现的问题和修复建议

---

## 6. `/trellis:improve-ut` - 改进单元测试

### 6.1 功能概述

**核心职责**: 在代码变更后改进测试覆盖

### 6.2 真理来源

按顺序阅读和遵循：
1. `.trellis/spec/unit-test/index.md`
2. `.trellis/spec/unit-test/conventions.md`
3. `.trellis/spec/unit-test/integration-patterns.md`
4. `.trellis/spec/unit-test/mock-strategies.md`

> 如果此命令与单元测试规范冲突，以规范为准。

### 6.3 执行流程

```
1. 检查变更:
   git diff --name-only

2. 使用单元测试规范决定测试范围:
   - 什么必须是单元 vs 集成 vs 回归
   - 什么必须 mock vs 真实文件系统流

3. 添加/更新测试（镜像现有测试结构）

4. 运行验证:
   pnpm lint
   pnpm typecheck
   pnpm test

5. 报告覆盖决策和剩余缺口
```

### 6.4 输出格式

```markdown
## UT Coverage Plan
- Changed areas: ...
- Test scope (unit/integration/regression): ...

## Test Updates
- Added: ...
- Updated: ...

## Validation
- pnpm lint: pass/fail
- pnpm typecheck: pass/fail
- pnpm test: pass/fail

## Gaps / Follow-ups
- <none or explicit rationale>
```

---

## 7. `/trellis:before-frontend-dev` - 前端开发前

### 7.1 功能概述

**核心职责**: 在开始前端开发任务前读取前端开发规范

### 7.2 执行流程

```
Step 1: 读取 .trellis/spec/frontend/index.md 了解可用规范
Step 2: 根据任务读取相关规范文件:
        组件工作 → component-guidelines.md
        Hook 工作 → hook-guidelines.md
        状态管理 → state-management.md
        类型问题 → type-safety.md
Step 3: 理解需要遵循的编码标准和模式
Step 4: 然后继续开发计划
```

> 此步骤在编写任何前端代码**前**是**强制的**。

---

## 8. `/trellis:before-backend-dev` - 后端开发前

### 8.1 功能概述

**核心职责**: 在开始后端开发任务前读取后端开发规范

### 8.2 执行流程

```
Step 1: 读取 .trellis/spec/backend/index.md 了解可用规范
Step 2: 根据任务读取相关规范文件:
        数据库工作 → database-guidelines.md
        错误处理 → error-handling.md
        日志 → logging-guidelines.md
        类型问题 → type-safety.md
        添加平台 → platform-integration.md
Step 3: 读取 .trellis/spec/unit-test/conventions.md —
        特别是 "When to Write Tests" 部分，
        理解变更需要什么测试
Step 4: 理解需要遵循的编码标准和模式
Step 5: 然后继续开发计划
```

> 此步骤在编写任何后端代码**前**是**强制的**。
