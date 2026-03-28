# 更新 Code-Spec - 捕获可执行约定

当你学到有价值的东西（从调试、实现或讨论中），使用此命令更新相关的 code-spec 文档。

**时机**：完成任务、修复 bug 或发现新模式后

---

## Code-Spec 首要规则（关键）

在这个项目中，实现工作的"spec"意味着 **code-spec**：
- 可执行的约定（不是只有原则的文本）
- 具体的签名、负载字段、环境键和边界行为
- 可测试的验证/错误行为

如果更改涉及 infra 或跨层约定，code-spec 深度是强制性的。

### 强制触发器

当更改包含以下任何内容时应用 code-spec 深度：
- 新/更改的命令或 API 签名
- 跨层请求/响应约定更改
- 数据库 schema/迁移更改
- Infra 集成（存储、队列、缓存、密钥、环境接线）

### 强制输出（7 个部分）

对于触发的任务，包括以下所有部分：
1. Scope / Trigger
2. Signatures (command/API/DB)
3. Contracts (request/response/env)
4. Validation & Error Matrix
5. Good/Base/Bad Cases
6. Tests Required (with assertion points)
7. Wrong vs Correct (at least one pair)

---

## 何时更新 Code-Specs

| Trigger | Example | Target Spec |
|---------|---------|-------------|
| **实现了功能** | 使用 giget 添加模板下载 | 相关的 `backend/` 或 `frontend/` 文件 |
| **做出了设计决策** | 使用类型字段 + 映射表实现可扩展性 | 相关 code-spec + "Design Decisions" 部分 |
| **修复了 bug** | 发现错误处理的微妙问题 | `backend/error-handling.md` |
| **发现了模式** | 找到了更好的代码结构方式 | 相关的 `backend/` 或 `frontend/` 文件 |
| **遇到了陷阱** | 学到必须在 Y 之前做 X | 相关 code-spec + "Common Mistakes" 部分 |
| **建立了约定** | 团队同意命名模式 | `quality-guidelines.md` |
| **新思维触发器** | "不要忘记在做 Y 之前检查 X" | `guides/*.md`（作为检查清单项，不是详细规则） |

**关键见解**：Code-spec-first 更新不只是为了问题。每个功能实现都包含未来 AI/开发者需要安全执行的设计决策和约定。

---

## Spec 结构概览

```
.spec-first/spec/
├── backend/           # 后端编码标准
│   ├── index.md       # 概述和链接
│   └── *.md           # 主题特定指南
├── frontend/          # 前端编码标准
│   ├── index.md       # 概述和链接
│   └── *.md           # 主题特定指南
└── guides/            # 思维检查清单（不是编码规范！）
    ├── index.md       # 指南索引
    └── *.md           # 主题特定指南
```

### 关键：Code-Spec vs Guide - 了解区别

| Type | Location | Purpose | Content Style |
|------|----------|---------|---------------|
| **Code-Spec** | `backend/*.md`, `frontend/*.md` | 告诉 AI "如何安全实现" | 签名、约定、矩阵、案例、测试点 |
| **Guide** | `guides/*.md` | 帮助 AI "考虑什么" | 检查清单、问题、指向规范的指针 |

**决策规则**：问自己：

- "这是**如何编写**代码" → 放在 `backend/` 或 `frontend/`
- "这是编写前**考虑什么**" → 放在 `guides/`

**示例**：

| Learning | Wrong Location | Correct Location |
|----------|----------------|------------------|
| "使用 `reconfigure()` 而不是 `TextIOWrapper` 处理 Windows stdout" | ❌ `guides/cross-platform-thinking-guide.md` | ✅ `backend/script-conventions.md` |
| "编写跨平台代码时记得检查编码" | ❌ `backend/script-conventions.md` | ✅ `guides/cross-platform-thinking-guide.md` |

**指南应该是简短的检查清单，指向规范**，而不是重复详细规则。

---

## 更新流程

### 步骤 1：识别你学到了什么

回答这些问题：

1. **你学到了什么？**（要具体）
2. **为什么重要？**（它防止什么问题？）
3. **它属于哪里？**（哪个 spec 文件？）

### 步骤 2：分类更新类型

| Type | Description | Action |
|------|-------------|--------|
| **Design Decision** | 为什么我们选择方法 X 而不是 Y | 添加到 "Design Decisions" 部分 |
| **Project Convention** | 我们在这个项目中如何做 X | 添加到相关部分并带示例 |
| **New Pattern** | 发现的可复用方法 | 添加到 "Patterns" 部分 |
| **Forbidden Pattern** | 导致问题的东西 | 添加到 "Anti-patterns" 或 "Don't" 部分 |
| **Common Mistake** | 容易犯的错误 | 添加到 "Common Mistakes" 部分 |
| **Convention** | 约定的标准 | 添加到相关部分 |
| **Gotcha** | 不明显的行为 | 添加警告标注 |

### 步骤 3：读取目标 Code-Spec

编辑前，读取当前 code-spec 以：
- 了解现有结构
- 避免重复内容
- 找到正确的更新部分

```bash
cat .spec-first/spec/<category>/<file>.md
```

### 步骤 4：进行更新

遵循这些原则：

1. **要具体**：包含具体示例，不只是抽象规则
2. **解释为什么**：说明这防止的问题
3. **显示约定**：添加签名、负载字段和错误行为
4. **显示代码**：为关键模式添加代码片段
5. **保持简短**：每个部分一个概念

### 步骤 5：更新索引（如果需要）

如果你添加了新部分或 code-spec 状态更改，更新类别的 `index.md`。

---

## 更新模板

### Infra/跨层工作的强制模板

```markdown
## Scenario: <name>

### 1. Scope / Trigger
- Trigger: <why this requires code-spec depth>

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

### 添加设计决策

```markdown
### Design Decision: [决策名称]

**Context**: 我们在解决什么问题？

**Options Considered**:
1. Option A - 简要描述
2. Option B - 简要描述

**Decision**: 我们选择了 Option X 因为...

**Example**:
\`\`\`typescript
// How it's implemented
code example
\`\`\`

**Extensibility**: 将来如何扩展这个...
```

### 添加项目约定

```markdown
### Convention: [约定名称]

**What**: 约定的简要描述。

**Why**: 为什么我们在项目中这样做。

**Example**:
\`\`\`typescript
// How to follow this convention
code example
\`\`\`

**Related**: 链接到相关约定或规范。
```

### 添加新模式

```markdown
### Pattern Name

**Problem**: 这解决了什么问题？

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

### 添加禁止模式

```markdown
### Don't: Pattern Name

**Problem**:
\`\`\`
// Don't do this
bad code example
\`\`\`

**Why it's bad**: 问题的解释。

**Instead**:
\`\`\`
// Do this instead
good code example
\`\`\`
```

### 添加常见错误

```markdown
### Common Mistake: Description

**Symptom**: 出什么问题了

**Cause**: 为什么会发生

**Fix**: 如何纠正

**Prevention**: 将来如何避免
```

### 添加陷阱

```markdown
> **Warning**: 不明显行为的简要描述。
>
> 关于何时发生这种情况以及如何处理的详细信息。
```

---

## 交互模式

如果你不确定要更新什么，回答这些提示：

1. **你刚完成了什么？**
   - [ ] 修复了 bug
   - [ ] 实现了功能
   - [ ] 重构了代码
   - [ ] 进行了方法讨论

2. **你学到或决定了什么？**
   - 设计决策（为什么 X 而不是 Y）
   - 项目约定（我们如何做 X）
   - 不明显的行为（陷阱）
   - 更好的方法（模式）

3. **未来的 AI/开发者需要知道这个吗？**
   - 了解代码如何工作 → 是，更新 spec
   - 维护或扩展功能 → 是，更新 spec
   - 避免重复错误 → 是，更新 spec
   - 纯粹一次性的实现细节 → 也许跳过

4. **这与哪个领域相关？**
   - [ ] 后端代码
   - [ ] 前端代码
   - [ ] 跨层数据流
   - [ ] 代码组织/复用
   - [ ] 质量/测试

---

## 质量检查清单

在完成 spec-first 更新之前：

- [ ] 内容具体且可操作？
- [ ] 你包含代码示例了吗？
- [ ] 你解释了为什么，不只是什么？
- [ ] 你包含了可执行的签名/约定吗？
- [ ] 你包含了验证和错误矩阵吗？
- [ ] 你包含了 Good/Base/Bad 案例吗？
- [ ] 你包含了带有断言点的必需测试吗？
- [ ] 它在正确的 code-spec 文件中吗？
- [ ] 它重复了现有内容吗？
- [ ] 新团队成员会理解它吗？

---

## 与其他命令的关系

```
Development Flow:
  Learn something → /spec:update-spec → Knowledge captured
       ↑                                  ↓
  /spec:break-loop ←──────────────────── Future sessions benefit
  (deep bug analysis)
```

- `/spec:break-loop` - 深度分析 bug，经常揭示需要 spec-first 更新
- `/spec:update-spec` - 实际进行更新（此命令）
- `/spec:finish-work` - 提醒你检查规范是否需要更新

---

## 核心哲学

> **Code-specs 是活的文档。每次调试会话、每个"啊哈时刻"都是使实现约定更清晰的机会。**

目标是**机构记忆**：
- 一个人学到的，所有人受益
- AI 在一个会话中学到的，持久到未来会话
- 错误变成记录的护栏
