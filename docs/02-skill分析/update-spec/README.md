# Update-Spec 深度分析

> 源文件: `/packages/cli/src/templates/claude/commands/spec/update-spec.md`

---

## 1. Skill 概述

### 1.1 核心定位

**update-spec** 是 code-spec 更新命令，用于捕获可执行契约。

| 维度 | 描述 |
|------|------|
| **目标** | 将学习成果固化为 code-spec |
| **触发时机** | 完成任务、修复 Bug、发现新模式后 |
| **输出** | 更新的 spec 文档 |

### 1.2 Code-Spec 第一规则

```
┌─────────────────────────────────────────────────────────────┐
│              Code-Spec 第一规则 (CRITICAL)                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   在此项目中，实现工作的 "spec" 意味着 code-spec:           │
│                                                             │
│   ✅ 可执行契约（非仅原则性文本）                           │
│   ✅ 具体签名、负载字段、环境键、边界行为                  │
│   ✅ 可测试的验证/错误行为                                  │
│                                                             │
│   如果变更涉及基础设施或跨层契约，code-spec 深度是强制的   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. 强制触发器

### 2.1 何时应用 Code-Spec 深度

当变更包含以下任一项：

| 触发器 | 示例 |
|--------|------|
| 新/变更的命令或 API 签名 | 函数参数、返回类型 |
| 跨层请求/响应契约变更 | API payload 格式 |
| 数据库 schema/migration 变更 | 表结构、字段 |
| 基础设施集成 | 存储、队列、缓存、密钥、环境变量 |

### 2.2 强制输出（7 个部分）

对于触发的任务，必须包含：

1. **Scope / Trigger** - 范围和触发器
2. **Signatures** - 命令/API/DB 签名
3. **Contracts** - 请求/响应/环境变量
4. **Validation & Error Matrix** - 验证和错误矩阵
5. **Good/Base/Bad Cases** - 好/基/坏用例
6. **Tests Required** - 所需测试（含断言点）
7. **Wrong vs Correct** - 错误 vs 正确（至少一对）

---

## 3. 何时更新 Code-Spec

| 触发器 | 示例 | 目标 Spec |
|--------|------|-----------|
| **实现了功能** | 用 giget 添加模板下载 | 相关 `backend/` 或 `frontend/` 文件 |
| **做出了设计决策** | 使用类型字段 + 映射表实现可扩展性 | 相关 code-spec + "Design Decisions" 部分 |
| **修复了 Bug** | 发现错误处理的微妙问题 | `backend/error-handling.md` |
| **发现了模式** | 找到更好的代码结构方式 | 相关 `backend/` 或 `frontend/` 文件 |
| **遇到了陷阱** | 学到 X 必须在 Y 之前做 | 相关 code-spec + "Common Mistakes" 部分 |
| **建立了约定** | 团队同意命名模式 | `quality-guidelines.md` |
| **新的思考触发器** | "别忘了在做 Y 之前检查 X" | `guides/*.md`（作为检查项） |

**关键洞察**: Code-spec 更新不只是为了问题。每个功能实现都包含设计决策和契约，未来 AI/开发者需要安全执行。

---

## 4. Code-Spec vs Guide 区别

### 4.1 关键区分

| 类型 | 位置 | 目的 | 内容风格 |
|------|------|------|---------|
| **Code-Spec** | `backend/*.md`, `frontend/*.md` | 告诉 AI "如何安全实现" | 签名、契约、矩阵、用例、测试点 |
| **Guide** | `guides/*.md` | 帮助 AI "考虑什么" | 检查清单、问题、指向 spec 的指针 |

### 4.2 决策规则

问自己：
- "这是**如何写**代码" → 放在 `backend/` 或 `frontend/`
- "这是写代码前**考虑什么**" → 放在 `guides/`

### 4.3 示例

| 学习内容 | 错误位置 | 正确位置 |
|----------|---------|---------|
| "用 `reconfigure()` 而非 `TextIOWrapper` 处理 Windows stdout" | ❌ `guides/cross-platform-thinking-guide.md` | ✅ `backend/script-conventions.md` |
| "编写跨平台代码时记得检查编码" | ❌ `backend/script-conventions.md` | ✅ `guides/cross-platform-thinking-guide.md` |

**Guides 应该是指向 spec 的简短检查清单，而非重复详细规则。**

---

## 5. 更新流程

### 5.1 流程图

```
┌─────────────────────────────────────────────────────────────┐
│                   update-spec 执行流程                       │
└─────────────────────────────────────────────────────────────┘

  ┌─────────────────┐
  │ Step 1: 识别学  │
  │ 到了什么        │
  └────────┬────────┘
           │
           ▼
  ┌─────────────────┐
  │ Step 2: 分类更  │
  │ 新类型          │
  └────────┬────────┘
           │
           ▼
  ┌─────────────────┐
  │ Step 3: 读取目  │
  │ 标 code-spec    │
  └────────┬────────┘
           │
           ▼
  ┌─────────────────┐
  │ Step 4: 执行更新│
  └────────┬────────┘
           │
           ▼
  ┌─────────────────┐
  │ Step 5: 更新索引│
  │ (如需要)        │
  └─────────────────┘
```

### 5.2 步骤详解

#### Step 1: 识别学到了什么

回答：
1. **学到了什么？**（具体）
2. **为什么重要？**（防止什么问题）
3. **属于哪里？**（哪个 spec 文件）

#### Step 2: 分类更新类型

| 类型 | 描述 | 动作 |
|------|------|------|
| **Design Decision** | 为什么选择 X 而非 Y | 添加到 "Design Decisions" 部分 |
| **Project Convention** | 我们项目中如何做 X | 添加到相关部分，含示例 |
| **New Pattern** | 发现的可复用方法 | 添加到 "Patterns" 部分 |
| **Forbidden Pattern** | 导致问题的做法 | 添加到 "Anti-patterns" 或 "Don't" 部分 |
| **Common Mistake** | 容易犯的错误 | 添加到 "Common Mistakes" 部分 |
| **Convention** | 约定的标准 | 添加到相关部分 |
| **Gotcha** | 非显而易见的行为 | 添加警告标注 |

#### Step 3: 读取目标 Code-Spec

```bash
cat .spec-first/spec/<category>/<file>.md
```

目的：
- 理解现有结构
- 避免重复内容
- 找到正确的更新位置

#### Step 4: 执行更新

原则：
1. **具体**: 包含具体示例，不只是抽象规则
2. **解释为什么**: 说明这防止什么问题
3. **展示契约**: 添加签名、负载字段、错误行为
4. **展示代码**: 添加关键模式的代码片段
5. **保持简短**: 每部分一个概念

#### Step 5: 更新索引（如需要）

如果添加了新部分或 code-spec 状态改变，更新类别的 `index.md`。

---

## 6. 更新模板

### 6.1 基础设施/跨层工作强制模板

```markdown
## Scenario: <name>

### 1. Scope / Trigger
- Trigger: <为什么这需要 code-spec 深度>

### 2. Signatures
- Backend command/API/DB signature(s)

### 3. Contracts
- Request fields (name, type, constraints)
- Response fields (name, type, constraints)
- Environment keys (required/optional)

### 4. Validation & Error Matrix
- <condition> -> <error>

### 5. Good/Base/Bad Cases
- Good: ...
- Base: ...
- Bad: ...

### 6. Tests Required
- Unit/Integration/E2E with assertion points

### 7. Wrong vs Correct
#### Wrong
...
#### Correct
...
```

### 6.2 添加设计决策

```markdown
### Design Decision: [决策名称]

**Context**: 我们在解决什么问题？

**Options Considered**:
1. Option A - 简要描述
2. Option B - 简要描述

**Decision**: 我们选择 Option X 因为...

**Example**:
\`\`\`typescript
// 如何实现
code example
\`\`\`

**Extensibility**: 未来如何扩展...
```

### 6.3 添加项目约定

```markdown
### Convention: [约定名称]

**What**: 约定的简要描述。

**Why**: 为什么在这个项目中这样做。

**Example**:
\`\`\`typescript
// 如何遵循此约定
code example
\`\`\`

**Related**: 相关约定或 spec 的链接。
```

### 6.4 添加新模式

```markdown
### Pattern Name

**Problem**: 解决什么问题？

**Solution**: 方法的简要描述。

**Example**:
\`\`\`
// Good
code example

// Bad
code example
\`\`\`

**Why**: 解释为什么这样更好。
```

### 6.5 添加禁止模式

```markdown
### Don't: Pattern Name

**Problem**:
\`\`\`
// Don't do this
bad code example
\`\`\`

**Why it's bad**: 问题解释。

**Instead**:
\`\`\`
// Do this instead
good code example
\`\`\`
```

### 6.6 添加常见错误

```markdown
### Common Mistake: Description

**Symptom**: 出什么问题

**Cause**: 为什么发生

**Fix**: 如何修正

**Prevention**: 如何避免
```

### 6.7 添加陷阱

```markdown
> **Warning**: 非显而易见行为的简要描述。
>
> 关于何时发生以及如何处理的详细信息。
```

---

## 7. 质量检查清单

更新 spec 前：

- [ ] 内容具体可执行？
- [ ] 包含代码示例？
- [ ] 解释了 WHY，不只是 WHAT？
- [ ] 包含可执行签名/契约？
- [ ] 包含验证和错误矩阵？
- [ ] 包含 Good/Base/Bad 用例？
- [ ] 包含所需测试及断言点？
- [ ] 在正确的 code-spec 文件中？
- [ ] 是否重复现有内容？
- [ ] 新团队成员能理解吗？

---

## 8. 与其他命令的关系

```
Development Flow:
  Learn something → /spec:update-spec → Knowledge captured
       ↑                                  ↓
  /spec:break-loop ←──────────────────── Future sessions benefit
  (deep bug analysis)
```

| 命令 | 时机 | 目的 |
|------|------|------|
| `break-loop` | 调试后 | 深度分析，常揭示需要更新 spec |
| `update-spec` | 学习后 | 实际执行更新（此命令） |
| `finish-work` | 提交前 | 提醒检查是否需要更新 spec |

---

## 9. 核心哲学

> **Code-specs 是活文档。每次调试会话、每个"顿悟时刻"都是让实现契约更清晰的机会。**

目标是**制度记忆**：
- 一个人学到的，所有人受益
- AI 在一次会话中学到的，持久到未来会话
- 错误变成文档化的护栏

---

## 10. 总结

**update-spec** 是知识固化工具：

```
学习/发现 → update-spec → code-spec 更新
                │
                ├── 设计决策
                ├── 项目约定
                ├── 模式/反模式
                ├── 常见错误
                └── 陷阱警告
```

**核心价值**:
- 将学习转化为可执行契约
- 建立制度记忆
- 防止重复错误
- 提升 AI 和开发者效率
