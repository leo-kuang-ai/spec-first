# Agent Skill Bundle 自动选择方案

> **版本**: 1.0
> **日期**: 2026-03-26
> **定位**: 面向后续单独开发的扩展方案，解决“不同 agent 节点如何按环境自动选中 skill bundle 并执行”

---

## 1. 方案目标

本方案解决的问题不是“如何让 agent 自己去发现 skill”，而是：

> 如何让系统根据任务环境、phase、技术栈和执行模式，自动为 agent 选中一组最相关的 skill，并注入给 agent 使用，从而提升执行质量。

核心目标：

1. 不让 agent 自己搜索整个 skill 库
2. 让 skill 选择可预测、可复盘、可调试
3. 让不同 phase 可以拿到不同的 skill bundle
4. 让不同语言、框架、端类型使用不同执行规范
5. 与当前 `workflow / decision_hints / runtime hooks` 架构兼容

---

## 2. 核心原则

### 2.1 agent 不负责发现 skill

agent 的职责是：

- 在既定 skill bundle 内执行任务
- 结合 task context、spec、policy 完成实现/检查/修复

agent 不负责：

- 遍历 skill 目录
- 自己猜该用哪个 skill
- 自己拼装 skill 组合

### 2.2 skill 选择由系统完成

skill 选择应由：

- `task creation / plan`
- `runtime hook`
- `skill selector`

共同完成。

### 2.3 只注入小而准的 bundle

不要一次给 agent 注入大量 skill。

推荐每个 phase 最多注入：

1. 1 个 base skill
2. 1 个 language skill
3. 1 个 framework / surface skill
4. 1 个 task-mode skill

也就是总量控制在 2 到 4 个 skill。

### 2.4 选择规则必须显式

不依赖“名字看起来像什么”或“agent 临场理解 skill 含义”。

必须建立：

- 可机读 metadata
- 明确的路由规则
- 固定优先级

---

## 3. 现状问题

以 `/Users/kuang/xiaobu/everything-claude-code/skills` 为例，当前 skill 库的主要问题是：

1. 人类可读性强，但机器可路由性弱
2. 大多数 skill 只有：
   - `name`
   - `description`
3. 缺少统一 metadata，例如：
   - `language`
   - `framework`
   - `surface`
   - `phase`
   - `task_mode`
4. skill 分类主要靠命名和描述隐式表达

这意味着当前 skill 库更像：

- 知识文档集合

而不是：

- 可稳定自动路由的 skill registry

---

## 4. 目标架构

## 4.1 总体流程

```text
用户需求
   │
   ▼
task creation / plan
   │
   ├── 生成 execution_profile
   ├── 生成 workflow / preset / decision_hints
   └── 记录任务环境信息
   │
   ▼
skill selector
   │
   ├── 读取 execution_profile
   ├── 查询 skills registry
   └── 选出 skill bundle
   │
   ▼
runtime hook
   │
   ├── 注入 task context
   ├── 注入 selected skill docs
   └── 构造 phase-specific prompt
   │
   ▼
phase agent
   │
   └── 在已选中的 skill bundle 内执行
```

## 4.2 分层职责

| 层 | 职责 |
|----|------|
| `execution_profile` | 描述当前任务的环境画像 |
| `skills registry` | 提供 skill 的机器可读 metadata |
| `skill selector` | 按规则选 bundle |
| `runtime hook` | 注入 bundle 给 agent |
| `phase agent` | 执行 bundle 内的规范和知识 |

---

## 5. execution_profile 设计

## 5.1 最小画像

推荐最小结构：

```json
{
  "execution_profile": {
    "surface": "frontend",
    "language": "typescript",
    "framework": "react",
    "runtime": "node",
    "task_mode": "tdd",
    "phase": "implement"
  }
}
```

## 5.2 字段说明

| 字段 | 说明 |
|------|------|
| `surface` | 端类型，例如 `frontend/backend/mobile/infra` |
| `language` | 主语言，例如 `typescript/python/go/java/rust` |
| `framework` | 主框架，例如 `react/django/springboot/nextjs` |
| `runtime` | 运行环境，例如 `node/python/jvm/go` |
| `task_mode` | 执行模式，例如 `tdd/debug/verification/default` |
| `phase` | 当前节点，例如 `implement/check/debug/finish` |

## 5.3 数据来源优先级

按以下顺序推导：

1. 用户显式输入
2. task metadata
   - `dev_type`
   - `workflow_type`
   - `preset`
3. repo 文件检测
   - `package.json`
   - `pyproject.toml`
   - `go.mod`
   - `pom.xml`
   - `Cargo.toml`
4. 包/目录路径特征
5. fallback 默认值

---

## 6. skills registry 设计

## 6.1 为什么必须有 registry

不能只靠 skill 名称或描述做自动选择。

例如：

- `python-patterns`
- `python-testing`
- `springboot-tdd`
- `frontend-patterns`

人类能大致理解，但机器无法稳定判断：

- 适用于哪个 phase
- 是语言 skill 还是 task-mode skill
- 是否应与其他 skill 同时注入
- 哪个优先级更高

因此，必须建立独立 registry。

## 6.2 推荐结构

推荐单独维护：

- `skills-registry.json`

示例：

```json
{
  "python-patterns": {
    "path": "/Users/kuang/xiaobu/everything-claude-code/skills/python-patterns/SKILL.md",
    "category": "language",
    "language": ["python"],
    "surface": ["backend", "script", "service"],
    "phases": ["implement", "check", "debug"],
    "priority": 80
  },
  "python-testing": {
    "path": "/Users/kuang/xiaobu/everything-claude-code/skills/python-testing/SKILL.md",
    "category": "task_mode",
    "language": ["python"],
    "modes": ["tdd", "testing", "verification"],
    "phases": ["implement", "check"],
    "priority": 90
  },
  "frontend-patterns": {
    "path": "/Users/kuang/xiaobu/everything-claude-code/skills/frontend-patterns/SKILL.md",
    "category": "framework",
    "language": ["typescript", "javascript"],
    "surface": ["frontend", "web"],
    "framework": ["react", "nextjs"],
    "phases": ["implement", "check"],
    "priority": 85
  }
}
```

## 6.3 最小 metadata 字段

| 字段 | 说明 |
|------|------|
| `path` | skill 文件路径 |
| `category` | `base/language/framework/task_mode` |
| `language` | 适用语言 |
| `framework` | 适用框架 |
| `surface` | 适用端 |
| `phases` | 适用 phase |
| `modes` | 适用执行模式 |
| `priority` | 冲突时排序 |

---

## 6.4 `skills-registry.json` 推荐 schema

推荐把 registry 控制在“轻量可路由资产”级别，而不是演化成完整插件清单。

建议结构：

```json
{
  "version": 1,
  "generated_at": "2026-03-26T12:00:00Z",
  "skill_roots": [
    "/Users/kuang/xiaobu/everything-claude-code/skills",
    ".agents/skills"
  ],
  "skills": {
    "python-testing": {
      "path": "/Users/kuang/xiaobu/everything-claude-code/skills/python-testing/SKILL.md",
      "metadata_source": "skill_json",
      "category": "task_mode",
      "language": ["python"],
      "framework": [],
      "surface": ["backend", "service", "script"],
      "phases": ["implement", "check"],
      "modes": ["tdd", "testing", "verification"],
      "priority": 90,
      "requires": [],
      "conflicts_with": [],
      "tags": ["testing", "unit-test"]
    }
  }
}
```

### 顶层字段

| 字段 | 说明 |
|------|------|
| `version` | registry schema 版本 |
| `generated_at` | 生成时间 |
| `skill_roots` | 本次扫描的根目录 |
| `skills` | 所有已发现 skill 的映射 |

### 单个 skill 字段

| 字段 | 必填 | 说明 |
|------|------|------|
| `path` | 是 | `SKILL.md` 的绝对路径 |
| `metadata_source` | 是 | `skill_json/frontmatter/fallback` |
| `category` | 是 | `base/language/framework/task_mode` |
| `language` | 否 | 适用语言列表 |
| `framework` | 否 | 适用框架列表 |
| `surface` | 否 | 适用端类型列表 |
| `phases` | 否 | 适用 phase 列表 |
| `modes` | 否 | 适用模式列表 |
| `priority` | 是 | 选择优先级 |
| `requires` | 否 | 依赖的 skill id 列表 |
| `conflicts_with` | 否 | 冲突的 skill id 列表 |
| `tags` | 否 | 辅助检索和治理标签 |

### schema 约束

1. `skills` 的 key 必须稳定，推荐使用目录名
2. `priority` 必须是整数，默认值建议为 `50`
3. `category` 必须是枚举值，不允许自由文本
4. `requires` 和 `conflicts_with` 只接受已存在的 skill id
5. `metadata_source=fallback` 的 skill 应在 lint 报告中被标记

---

## 6.5 扩展性与自动发现机制

为了让新 skill 能快速、轻量地集成进系统，registry 不能只靠手工维护。

目标是让新增 skill 尽量满足：

1. 新增目录即可被扫描到
2. 补 metadata 后即可进入候选集
3. 不需要每新增一个 skill 就修改 selector 核心逻辑
4. 发现、注册、选择、注入彼此解耦

### 自动发现流程

推荐增加：

- `discover_skills(skill_roots)`

扫描来源：

1. 外部 skill 根目录，例如：
   - `/Users/kuang/xiaobu/everything-claude-code/skills`
2. 项目内 skill 根目录，例如：
   - `.agents/skills`

发现规则：

1. 扫描所有包含 `SKILL.md` 的目录
2. 优先读取显式 metadata
3. 缺失时允许用目录名和 `description` 做轻量 fallback
4. 生成统一 registry 结果

### 推荐的 skill 自描述方式

为了降低新增 skill 的接入成本，推荐支持两种 metadata 来源：

1. `SKILL.md` frontmatter
2. 同目录下的 `skill.json`

推荐优先级：

- `skill.json` > `SKILL.md` frontmatter > 目录名/description fallback

这样做的原因是：

1. 对现有 skill 库兼容性更好
2. 新 skill 可以渐进补齐 metadata
3. 不要求一开始就改造所有 `SKILL.md`

### fallback 规则

当前 skill 库里很多 skill 只有：

- `name`
- `description`

因此 discovery 需要允许最小 fallback，但要明确这只是兜底，不是主路径。

可接受的 fallback 包括：

1. 目录名包含 `python` -> `language=["python"]`
2. 目录名包含 `testing` / `tdd` -> `modes=["testing"]` 或 `["tdd"]`
3. 目录名包含 `frontend` / `backend` -> `surface=["frontend"]` 或 `["backend"]`

不应做的事：

1. 不使用 LLM 理解 skill 含义
2. 不在 runtime 临时遍历整个 skill 库
3. 不把目录名猜测当成长期主路径

### registry 输出结果

自动发现后，应生成统一结构，例如：

```json
{
  "skills": {
    "python-testing": {
      "path": ".../skills/python-testing/SKILL.md",
      "metadata_source": "skill_json",
      "category": "task_mode",
      "language": ["python"],
      "modes": ["tdd", "testing", "verification"],
      "phases": ["implement", "check"],
      "priority": 90
    }
  }
}
```

其中建议保留：

- `metadata_source`

用于标记该 skill 的 metadata 是来自：

- `skill_json`
- `frontmatter`
- `fallback`

这样后续更容易治理质量较低的 skill 定义。

### 新增 skill 的理想接入流程

后续新增一个 skill，理想流程应收敛为：

1. 新建 skill 目录
2. 写 `SKILL.md`
3. 补 `frontmatter` 或 `skill.json`
4. 被 discovery 自动扫描
5. 被 registry 自动纳入候选
6. 在匹配场景中被 selector 自动选中

这才算真正做到“快速轻便集成”。

---

## 7. skill selector 设计

## 7.1 选择原则

skill selector 不应是 LLM 推理器，而应是：

- 规则优先
- 轻量打分
- 结果可解释

## 7.2 选择流程

### Step 1: 选 base skill

例如：

- `coding-standards`
- `verification-loop`

### Step 2: 选 language skill

例如：

- Python -> `python-patterns`
- Go -> `golang-patterns`
- Java -> `java-coding-standards`

### Step 3: 选 framework / surface skill

例如：

- React -> `frontend-patterns`
- Django -> `django-patterns`
- Spring Boot -> `springboot-patterns`

### Step 4: 选 task-mode skill

例如：

- TDD -> `python-testing` / `springboot-tdd` / `tdd-workflow`
- Verification -> `springboot-verification` / `verification-loop`
- Debug -> 后续专用 debug skill

## 7.3 打分规则

推荐简单规则：

- phase match: +30
- language match: +30
- framework match: +20
- surface match: +10
- mode match: +20

然后每类只取优先级最高的 1 个。

## 7.4 输出结构

```json
{
  "selected_skill_bundle": {
    "base": ["coding-standards"],
    "language": ["python-patterns"],
    "framework": ["django-patterns"],
    "task_mode": ["django-tdd"]
  }
}
```

## 7.5 override 机制

为了保证自动选择可控，必须提供 override。

推荐支持两类：

### task override

用于某个任务临时指定偏好。

示例：

```json
{
  "skill_overrides": {
    "prefer": ["django-tdd"],
    "exclude": ["python-testing"]
  }
}
```

### repo override

用于某个仓库统一声明偏好或禁用项。

适合放在：

- `.spec-first/worktree.yaml`
- 或后续独立的 skill config 文件

### override 原则

1. override 只影响选择结果，不改变 registry 定义
2. override 只做增删和优先级偏移，不重写 selector 主逻辑
3. 没有 override 时，系统应靠 metadata 和规则稳定工作

---

## 7.6 `resolve_skill_bundle()` 伪代码

推荐采用“规则优先 + 轻量打分 + 小 bundle 限额”的实现。

```python
def resolve_skill_bundle(
    profile: dict,
    phase: str,
    preset: str | None,
    registry: dict,
    overrides: dict | None = None,
) -> dict:
    candidates = list(registry["skills"].items())

    # 1. phase 过滤
    candidates = [
        (skill_id, meta)
        for skill_id, meta in candidates
        if not meta.get("phases") or phase in meta["phases"]
    ]

    # 2. 按 profile 打分
    scored = []
    for skill_id, meta in candidates:
        score = meta.get("priority", 50)

        if profile.get("language") in meta.get("language", []):
            score += 30
        if profile.get("framework") in meta.get("framework", []):
            score += 20
        if profile.get("surface") in meta.get("surface", []):
            score += 10
        if profile.get("task_mode") in meta.get("modes", []):
            score += 20

        scored.append((skill_id, meta, score))

    # 3. 应用 override
    scored = apply_overrides(scored, overrides)

    # 4. 分类取 Top 1
    bundle = {
        "base": top_one(scored, category="base"),
        "language": top_one(scored, category="language"),
        "framework": top_one(scored, category="framework"),
        "task_mode": top_one(scored, category="task_mode"),
    }

    # 5. 处理 requires/conflicts_with
    bundle = expand_requires(bundle, registry)
    bundle = remove_conflicts(bundle, registry)

    # 6. 控制注入上限
    bundle = limit_bundle_size(bundle, max_skills=4)

    return bundle
```

### 关键实现原则

1. 先过滤 phase，再打分，减少无关候选
2. 分类只取 Top 1，避免 context 膨胀
3. `requires` 和 `conflicts_with` 在选中后统一处理
4. override 只做偏好修正，不替代主算法
5. 最终返回结构必须可解释，方便日志和调试

### 推荐输出结构

```json
{
  "selected_skill_bundle": {
    "base": ["coding-standards"],
    "language": ["python-patterns"],
    "framework": ["django-patterns"],
    "task_mode": ["django-tdd"]
  },
  "selection_reason": {
    "python-patterns": ["language=python", "phase=implement"],
    "django-patterns": ["framework=django", "surface=backend"],
    "django-tdd": ["task_mode=tdd", "phase=implement"]
  }
}
```

这样后续在 hook 或日志里可以直接看到“为什么选中了这个 skill”。

---

## 8. agent 如何执行 skill bundle

## 8.1 执行模式

agent 不做 skill 搜索，而是直接收到：

1. task context
2. spec / requirements
3. selected skill docs
4. phase policy

然后按这些信息执行任务。

## 8.2 注入方式

推荐由 `inject-subagent-context.py` 完成：

1. 读取 `execution_profile`
2. 调用 `resolve_skill_bundle(profile, phase, preset)`
3. 读取对应 `SKILL.md`
4. 将 skill 内容注入 implement/check/debug prompt

## 8.3 注入内容

注入时不需要把整个 skill 仓库都塞进去，只注入：

1. skill 名称
2. 激活原因
3. 核心规则
4. 必要示例

避免 context 爆炸。

---

## 9. 典型示例

## 9.1 React 前端 + TDD

画像：

```json
{
  "surface": "frontend",
  "language": "typescript",
  "framework": "react",
  "task_mode": "tdd",
  "phase": "implement"
}
```

选择结果：

- `coding-standards`
- `frontend-patterns`
- `tdd-workflow`

## 9.2 Python Django 后端

画像：

```json
{
  "surface": "backend",
  "language": "python",
  "framework": "django",
  "task_mode": "tdd",
  "phase": "implement"
}
```

选择结果：

- `python-patterns`
- `django-patterns`
- `django-tdd`

check 阶段可切到：

- `django-verification`

## 9.3 Java Spring Boot

画像：

```json
{
  "surface": "backend",
  "language": "java",
  "framework": "springboot",
  "task_mode": "tdd",
  "phase": "implement"
}
```

选择结果：

- `java-coding-standards`
- `springboot-patterns`
- `springboot-tdd`

check 阶段：

- `springboot-verification`

## 9.4 Go 服务

画像：

```json
{
  "surface": "backend",
  "language": "go",
  "task_mode": "testing",
  "phase": "implement"
}
```

选择结果：

- `golang-patterns`
- `golang-testing`

---

## 10. 与当前总方案的关系

这套 skill bundle 方案不应打断当前主线：

- `workflow_type`
- `decision_hints`
- runtime enforcement

它更适合作为后续独立开发的增强层。

推荐关系：

| 层 | 当前主方案 | skill bundle 方案 |
|----|------------|------------------|
| Workflow Topology | `next_action` | 不参与 |
| Phase Policy | `decision_hints` | 可参考 `preset/task_mode` |
| Runtime Enforcement | hooks / gate | 负责注入选中的 skill bundle |
| LLM Autonomy | phase agents | 在 bundle 内执行 |

也就是说：

> skill bundle 方案是 Layer 4 的质量增强机制，不替代 workflow/policy/runtime 主干架构。

---

## 11. 分阶段实施建议

## Phase A：建立 registry

目标：

- 先让 skill 从“文档集合”变成“可路由资产”

工作：

1. 实现 `discover_skills(skill_roots)`
2. 建 `skills-registry.json`
3. 支持 `skill.json` / frontmatter / fallback 三层 metadata 来源
4. 给常用 skill 补 metadata
5. 只覆盖最常见的前后端/语言组合

## Phase B：建立 execution_profile

目标：

- 让任务拥有可稳定推导的环境画像

工作：

1. 定义 `execution_profile`
2. 从 `dev_type/package/repo files/preset` 推导

## Phase C：实现 selector

目标：

- 根据画像稳定产出 bundle

工作：

1. 写 `resolve_skill_bundle()`
2. 先支持 implement / check 两个 phase

## Phase D：hook 注入

目标：

- 让 agent 真正收到选中的 skill

工作：

1. `inject-subagent-context.py` 注入 skill bundle
2. 控制注入内容长度

## Phase E：扩展

目标：

- 支持更多语言、框架、phase

工作：

1. 支持 debug bundle
2. 支持 review/research 辅助能力
3. 增加冲突规则和 override
4. 增加 registry 质量检查和 metadata lint

---

## 12. 不做什么

本方案明确不做：

1. 不让 agent 自己遍历 skill 目录
2. 不只靠 skill 名字字符串匹配
3. 不一次注入大量 skill
4. 不让 skill bundle 取代 `decision_hints`
5. 不把 skill 选择逻辑放回 `dispatch`
6. 不做重量级插件平台

---

## 13. 最终结论

这套方案的核心不是“自动发现 skill”，而是：

> 先把 skill 从文档集合变成可路由资产，再用 execution profile + registry + selector 选出一个小而准的 skill bundle，由 runtime 注入给各 phase agent 执行。

一句话总结：

> agent 不负责发现 skill，agent 负责执行已选中的 skill bundle；环境识别、路由和注入应由系统完成，而不是交给 agent 临场搜索。
