# Skill Catalog 与 Skill Manifest 初始样例

这份文档给出一版可以直接起步的样例，按当前要优先集成的节点 skill 和上下文 skill 先落几条：

- `tdd-workflow`
- `before-dev`
- `check-cross-layer`
- `frontend-patterns`
- `backend-patterns`

它不是最终定稿，只是第一版可用底稿。

---

## 1. `skill-catalog.json` 样例

这个文件负责“目录级归类”，对应 ECC 里的 `install-components.json` 思路。

```json
{
  "version": 1,
  "components": [
    {
      "id": "baseline:workflow",
      "family": "baseline",
      "description": "Core workflow and node-level skills used by the task pipeline.",
      "modules": ["workflow-core"]
    },
    {
      "id": "capability:testing",
      "family": "capability",
      "description": "Testing and verification skills for implementation quality.",
      "modules": ["testing"]
    },
    {
      "id": "capability:patterns",
      "family": "capability",
      "description": "Language and framework pattern skills for implementation guidance.",
      "modules": ["patterns"]
    }
  ]
}
```

### 这个 catalog 的作用

- 先告诉系统有哪些大类
- 先把 skill 按“工作流 / 测试 / 模式”分组
- 先不做节点决策

---

## 2. `skill-manifest.json` 样例

这个文件负责“单 skill 元数据 + 初始分类”，对应 ECC 里 `SKILL.md` + `agents/openai.yaml` 的合并视图。

```json
{
  "version": 1,
  "generated_at": "2026-03-27T10:00:00+08:00",
  "source_root": "/Users/kuang/xiaobu/everything-claude-code/skills",
  "skills": [
    {
      "id": "tdd-workflow",
      "name": "tdd-workflow",
      "path": "/Users/kuang/xiaobu/everything-claude-code/skills/tdd-workflow/SKILL.md",
      "origin": "ECC",
      "description": "Use this skill when writing new features, fixing bugs, or refactoring code. Enforces test-driven development with 80%+ coverage including unit, integration, and E2E tests.",
      "activation_kind": "node",
      "node_targets": ["implement"],
      "stack_targets": ["frontend", "backend", "python"],
      "explicit_only": false,
      "priority": 95,
      "tags": ["tdd", "testing", "workflow"],
      "conflicts_with": ["fast-implement"],
      "requires": ["before-dev"]
    },
    {
      "id": "before-dev",
      "name": "before-dev",
      "path": "/Users/kuang/xiaobu/everything-claude-code/skills/before-dev/SKILL.md",
      "origin": "ECC",
      "description": "Inject project-specific development guidelines before implementation begins.",
      "activation_kind": "node",
      "node_targets": ["start", "implement"],
      "stack_targets": ["frontend", "backend", "python", "java", "go", "kotlin"],
      "explicit_only": false,
      "priority": 100,
      "tags": ["guidelines", "onboarding", "context"],
      "conflicts_with": [],
      "requires": []
    },
    {
      "id": "check-cross-layer",
      "name": "check-cross-layer",
      "path": "/Users/kuang/xiaobu/everything-claude-code/skills/check-cross-layer/SKILL.md",
      "origin": "ECC",
      "description": "Cross-layer verification after implementation to catch data flow, reuse, import path, and consistency issues.",
      "activation_kind": "node",
      "node_targets": ["check"],
      "stack_targets": ["frontend", "backend", "python", "java", "go", "kotlin"],
      "explicit_only": false,
      "priority": 95,
      "tags": ["verification", "quality", "cross-layer"],
      "conflicts_with": [],
      "requires": ["before-dev"]
    },
    {
      "id": "frontend-patterns",
      "name": "frontend-patterns",
      "path": "/Users/kuang/xiaobu/everything-claude-code/skills/frontend-patterns/SKILL.md",
      "origin": "ECC",
      "description": "Frontend development patterns for React, Next.js, state management, performance optimization, and UI best practices.",
      "activation_kind": "context",
      "node_targets": ["implement"],
      "stack_targets": ["frontend"],
      "explicit_only": false,
      "priority": 80,
      "tags": ["frontend", "react", "nextjs", "ui"],
      "conflicts_with": [],
      "requires": ["before-dev"]
    },
    {
      "id": "backend-patterns",
      "name": "backend-patterns",
      "path": "/Users/kuang/xiaobu/everything-claude-code/skills/backend-patterns/SKILL.md",
      "origin": "ECC",
      "description": "Backend architecture patterns, API design, database optimization, and server-side best practices.",
      "activation_kind": "context",
      "node_targets": ["implement"],
      "stack_targets": ["backend"],
      "explicit_only": false,
      "priority": 80,
      "tags": ["backend", "api", "database", "service"],
      "conflicts_with": [],
      "requires": ["before-dev"]
    }
  ]
}
```

---

## 3. 这版样例怎么用

第一步可以直接用它做三件事：

1. 建立 skill 资产登记
2. 让任务创建期能解析出 `selected_skills`
3. 让 `explain` 能解释为什么选了这些 skill

例如：

```text
implement:
  - before-dev
  - tdd-workflow
  - frontend-patterns

check:
  - check-cross-layer
```

---

## 4. 这版样例的设计原则

- `before-dev` 是基础前置 skill，几乎所有代码任务都适合
- `tdd-workflow` 只在确实需要 TDD 时加入
- `check-cross-layer` 适合做实现后的统一验证
- `frontend-patterns` 和 `backend-patterns` 是上下文 skill，不是强制节点 skill

---

## 5. 按 ECC 思路映射到 spec-first 的三层模型

ECC 的区分方式不是单纯“前端 skill / 后端 skill / 语言 skill”，而是三层：

1. `language pack`
2. `framework pack`
3. `node skill`

如果映射到 `spec-first`，推荐这样理解：

### 5.1 Language pack

负责语言生态基础能力。

对应样例里更适合放：

- `python`
- `java`
- `go`
- `kotlin`
- `typescript`

建议在 manifest 里用 `stack_targets` 或专门的 `language_targets` 表达。

### 5.2 Framework pack

负责框架特有规则和实践。

对于当前样例，可以拆成：

- `frontend-patterns`
  - 更像 `typescript + react/nextjs/vite` 这类前端框架包的上下文 skill
- `backend-patterns`
  - 更像 `python + django/fastapi`
  - `java + springboot`
  - `go + gin/echo`

如果后面要继续细分，可以把 `frontend-patterns` 再拆成：

- `react-patterns`
- `nextjs-patterns`
- `vue-patterns`

把 `backend-patterns` 再拆成：

- `django-patterns`
- `springboot-patterns`
- `golang-patterns`

### 5.3 Node skill

直接绑定到流程节点。

对应样例里最典型的是：

- `before-dev`
  - 绑定 `start / implement`
- `tdd-workflow`
  - 绑定 `implement`
- `check-cross-layer`
  - 绑定 `check`

---

## 6. `frontend/backend/python/java/go/kotlin` 在 spec-first 里怎么落

如果按当前项目的目标，建议不要把 `frontend/backend` 当成一级语言，而是当成 **task_mode / stack scope**。

推荐表达方式：

```json
{
  "task_mode": "frontend",
  "language": "typescript",
  "framework": "nextjs",
  "selected_skills": {
    "implement": ["before-dev", "frontend-patterns", "tdd-workflow"]
  }
}
```

或者：

```json
{
  "task_mode": "backend",
  "language": "python",
  "framework": "django",
  "selected_skills": {
    "implement": ["before-dev", "backend-patterns", "tdd-workflow"]
  }
}
```

这样做的好处是：

- 语言和框架分开
- `frontend/backend` 作为场景维度
- 节点 skill 仍然保持简单
- 后续可以很容易扩展到 `java/go/kotlin`

---

## 7. 推荐的初始映射表

### 7.1 frontend

- `before-dev`
- `frontend-patterns`
- `tdd-workflow`（按需）
- `check-cross-layer`

### 7.2 backend

- `before-dev`
- `backend-patterns`
- `tdd-workflow`（按需）
- `check-cross-layer`

### 7.3 python

- `before-dev`
- `backend-patterns`
- `python-testing`
- `django-patterns`
- `check-cross-layer`

### 7.4 java

- `before-dev`
- `backend-patterns`
- `springboot-patterns`
- `springboot-verification`
- `check-cross-layer`

### 7.5 go

- `before-dev`
- `backend-patterns`
- `golang-patterns`
- `check-cross-layer`

### 7.6 kotlin

- `before-dev`
- `backend-patterns`
- `kotlin-patterns`
- `kotlin-testing`
- `check-cross-layer`

---

## 8. 结论

按 ECC 的方式来看，`frontend/backend/python/java/go/kotlin` 不应该都被当成同一种层级。

更合理的 spec-first 落法是：

- `frontend/backend` 作为场景维度
- `python/java/go/kotlin` 作为语言维度
- `react/nextjs/django/springboot/gin/echo` 作为框架维度
- `before-dev/tdd-workflow/check-cross-layer` 作为节点 skill 维度

这样能保留 ECC 的灵活性，同时不把 spec-first 做成一个重型 runtime 调度器。

---

## 9. 下一步建议

如果这版样例符合预期，下一步可以继续做两件事：

1. 把剩余 skill 继续补进 `skill-manifest.json`
2. 把 manifest 接到任务创建期的 `selected_skills` 解析逻辑里
