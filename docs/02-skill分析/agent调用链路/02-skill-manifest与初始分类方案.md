# Skill Manifest 与初始分类方案

这份文档只解决第一步：

**先把 `/Users/kuang/xiaobu/everything-claude-code/skills` 里的 skill 变成 spec-first 可识别、可检索、可分类的资产清单。**

它不负责最终调度，也不负责运行时自动激活。  
最终调度仍然交给任务创建期的解析逻辑、`selected_skills` 和 hook 注入。

---

## 1. 为什么第一步必须先做 manifest

如果不先做 manifest，后面会遇到这些问题：

- 不知道有哪些 skill 可以自动挂到节点
- 不知道哪些 skill 只能显式调用
- 不知道哪些 skill 适合 `implement`
- 不知道哪些 skill 适合 `check`
- 不知道哪些 skill 只适合某个语言或技术栈

所以第一步不是接节点，而是先把 skill 资产登记成表。

---

## 2. 推荐的 manifest 位置

建议把登记结果放到：

```text
.spec-first/config/skill-manifest.json
```

这个文件只做两件事：

- 记录 skill 资产
- 记录 skill 的初始分类和适用范围

它不是执行逻辑，不承担选择器职责。

---

## 3. 推荐的 manifest schema

ECC 的实现里其实有两层结构：

- **组件/目录层**：`manifests/install-components.json`
  - `id`
  - `family`
  - `description`
  - `modules`
- **单 skill 层**：`SKILL.md` + `agents/openai.yaml`
  - `name`
  - `description`
  - `allow_implicit_invocation`
  - `default_prompt`

`spec-first` 的推荐做法是把这两层合并成一个轻量 registry，但不要把“目录分类”和“节点决策”混在一起。

```json
{
  "version": "1",
  "generated_at": "2026-03-27T10:00:00+08:00",
  "source_root": "/Users/kuang/xiaobu/everything-claude-code/skills",
  "skills": [
    {
      "id": "tdd-workflow",
      "name": "tdd-workflow",
      "path": "/Users/kuang/xiaobu/everything-claude-code/skills/tdd-workflow/SKILL.md",
      "origin": "ECC",
      "description": "Use this skill when writing new features, fixing bugs, or refactoring code. Enforces test-driven development with 80%+ coverage.",
      "activation_kind": "node",
      "node_targets": ["implement"],
      "stack_targets": ["frontend", "backend", "python"],
      "explicit_only": false,
      "priority": 90,
      "tags": ["tdd", "testing", "workflow"],
      "conflicts_with": ["fast-implement"],
      "requires": ["before-dev"]
    }
  ]
}
```

### 推荐的两层拆分

如果你想更贴近 ECC 的实现，建议把 manifest 逻辑拆成两份：

#### A. skill-catalog.json

只负责目录和归类，不负责节点选择。

```json
{
  "version": 1,
  "components": [
    {
      "id": "capability:security",
      "family": "capability",
      "description": "Security review and security-focused framework guidance.",
      "modules": ["security"]
    },
    {
      "id": "capability:database",
      "family": "capability",
      "description": "Database and persistence-oriented skills.",
      "modules": ["database"]
    }
  ]
}
```

#### B. skill-manifest.json

只负责单 skill 的可执行元数据和初始分类。

```json
{
  "id": "tdd-workflow",
  "name": "tdd-workflow",
  "path": "/Users/kuang/xiaobu/everything-claude-code/skills/tdd-workflow/SKILL.md",
  "origin": "ECC",
  "description": "Use this skill when writing new features, fixing bugs, or refactoring code.",
  "activation_kind": "node",
  "node_targets": ["implement"],
  "stack_targets": ["frontend", "backend", "python"],
  "explicit_only": false,
  "priority": 90,
  "tags": ["tdd", "testing", "workflow"],
  "conflicts_with": ["fast-implement"],
  "requires": ["before-dev"]
}
```

### 字段说明

- `id`
  - 稳定唯一标识
  - 建议直接用目录名

- `path`
  - skill 正文位置

- `activation_kind`
  - `node`：可自动挂节点
  - `context`：按技术栈或项目上下文选择
  - `explicit`：只允许用户显式调用

- `node_targets`
  - 允许挂到哪些节点
  - 例如 `implement / check / start / finish / brainstorm`

- `stack_targets`
  - 适合哪些技术栈
  - 例如 `frontend / backend / python / java / go`

- `explicit_only`
  - 如果为 `true`，禁止自动选入任何节点

- `priority`
  - 同一节点多个 skill 命中时的优先级

- `tags`
  - 用于检索和人工理解

- `conflicts_with`
  - 与哪些 skill 不应同时启用

- `requires`
  - 依赖哪些前置 skill

---

## 4. 初始分类规则

第一轮不追求完美，先把所有 skill 分成 3 类。

### 4.1 Node skill

这类 skill 直接跟执行节点绑定，适合自动挂到：

- `start`
- `brainstorm`
- `implement`
- `check`
- `finish`

典型特征：

- 描述里出现 `workflow`, `verification`, `TDD`, `security review`, `onboarding`
- 目标明确，适合某个节点

示例：

- `tdd-workflow`
- `before-dev`
- `check-cross-layer`
- `security-review`
- `security-scan`
- `codebase-onboarding`

### 4.2 Context skill

这类 skill 主要按技术栈或项目上下文选择，不一定绑定固定节点。

典型特征：

- 描述里出现 `frontend`, `backend`, `python`, `django`, `springboot`, `golang`, `kotlin`
- 更像“这个项目该遵守什么实践”

示例：

- `frontend-patterns`
- `backend-patterns`
- `python-testing`
- `django-patterns`
- `springboot-patterns`
- `golang-patterns`
- `kotlin-patterns`

如果按 ECC 的三层模型理解，这类 skill 更接近：

- `language pack` 下的语言上下文
- 或 `framework pack` 下的框架上下文

在 `spec-first` 里，建议把 `frontend/backend` 当成场景维度，
把 `python/java/go/kotlin` 当成语言维度，
把 `react/nextjs/django/springboot/gin/echo` 当成框架维度。

### 4.3 Explicit skill

这类 skill 不建议自动挂节点，只在用户显式调用时启用。

典型特征：

- 业务域很强
- 任务边界不稳定
- 容易把节点上下文撑大

示例：

- `market-research`
- `investor-outreach`
- `production-scheduling`
- `customs-trade-compliance`
- `returns-reverse-logistics`

---

## 5. 第一轮映射建议

下面是建议的初始映射，不是最终定稿。

### 5.1 `implement`

优先考虑：

- `before-dev`
- `tdd-workflow`
- `frontend-patterns`
- `backend-patterns`
- `python-testing`
- `django-patterns`
- `springboot-patterns`
- `golang-patterns`
- `kotlin-patterns`

### 5.2 `check`

优先考虑：

- `check-cross-layer`
- `security-review`
- `security-scan`
- `verification-loop`
- `django-verification`
- `springboot-verification`
- `rust-testing`
- `cpp-testing`

### 5.3 `start`

优先考虑：

- `codebase-onboarding`
- `brainstorm`
- `project-guidelines-example`
- `continuous-learning`

### 5.4 `finish`

优先考虑：

- `finish-work`
- `deployment-patterns`
- `release-skills`

### 5.5 `explicit only`

优先保留显式调用：

- `article-writing`
- `investor-outreach`
- `market-research`
- `energy-procurement`
- `customs-trade-compliance`
- `production-scheduling`

---

## 6. 生成 manifest 的方式

推荐两步：

### 6.1 自动扫描

先扫描 `skills/*/SKILL.md`，抽取：

- `name`
- `description`
- `origin`
- `tags`
- `frontmatter`

### 6.2 人工补正

自动分类只能做初筛，最后由人工补：

- `activation_kind`
- `node_targets`
- `stack_targets`
- `explicit_only`
- `priority`
- `conflicts_with`
- `requires`

这一步很重要，因为很多 skill 的边界不能完全靠描述自动推断。

---

## 7. 后续怎么接入

manifest 只负责登记，不负责执行。

下一步再做：

```text
task create
  -> 读 manifest
  -> 根据 action / package / task_mode 选 skill
  -> 写 selected_skills
  -> hook 注入
```

这条链路才是最终执行逻辑。

---

## 8. 最小原则

第一步只做：

- 资产登记
- 初始分类
- 可读 manifest

不要第一步就做：

- 运行时评分器
- LLM 决策
- 节点自动重写
- 多层策略引擎

这些都属于后续阶段。

---

## 9. 结论

如果你要把 `/Users/kuang/xiaobu/everything-claude-code/skills` 集成到 `spec-first`，第一步应该是：

**先生成一份 skill manifest，把所有 skill 变成可识别、可分类、可检索的资产。**

只有这样，后面才有可能稳定地把它们映射到 `implement / check / start / finish / brainstorm` 这些节点上。
