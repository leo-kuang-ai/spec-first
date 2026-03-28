# Skill 集成与使用两步方案

这份文档把 skill 集成到 `spec-first` 的过程拆成两个大步骤：

1. **skill 列表集成 + 同步更新 + manifest 维护**
2. **skill 的任务内使用与自动选择**

这两个步骤对应三层实现：

- 同步层
- 解析层
- 消费层

---

## 1. 第一步：skill 集成与同步

这一层只做**资产接入**，不做任务决策。

### 1.1 目标

- 把 ECC 的 skill 纳入 `spec-first` 的可管理资产
- 后续 ECC skill 更新后，可以自动同步到本地
- 同步后自动更新 manifest 和 catalog

### 1.2 推荐 source of truth

- ECC 源码：`/Users/kuang/xiaobu/everything-claude-code/skills`
- `spec-first` 本地基线：`/Users/kuang/xiaobu/spec-first/packages`
- `spec-first` skill 登记：`.spec-first/config/`

### 1.3 同步内容

建议同步三类内容：

1. `SKILL.md` 正文
2. 可选的辅助文件
3. 元数据和分类结果

### 1.4 生成文件

建议生成两份核心文件：

- `skill-catalog.json`
  - 目录级归类
  - 负责 `family / id / description / modules`
- `skill-manifest.json`
  - 单 skill 元数据
  - 负责 `activation_kind / node_targets / stack_targets / explicit_only / priority`

### 1.5 同步脚本职责

同步脚本建议负责：

- 扫描 ECC `skills/*/SKILL.md`
- 读取 frontmatter
- 计算 hash / 版本
- 同步 skill 镜像
- 重新生成 catalog 和 manifest
- 输出变更报告

### 1.6 同步策略

建议采用：

- ECC 作为 source of truth
- `spec-first` 保留镜像
- 本地自定义不直接改镜像，改 overlay 或规则层

这样 ECC 更新时，只需要重新执行同步脚本。

---

## 2. 第二步：skill 的使用

这一层才是“按场景自动选 skill 并执行”。

### 2.1 目标

- 在任务创建时自动选出当前节点需要的 skill
- `implement / check / start / finish` 这些节点可以消费 skill
- agent 不负责策略选择，只负责执行

### 2.2 推荐流程

```text
task create
  -> 读取 task context
  -> 结合 skill-catalog / skill-manifest 解析
  -> 写入 selected_skills
  -> implement / check / start / finish agent 启动
  -> hook 注入对应 skill
  -> agent 消费 skill 执行
```

### 2.3 选择优先级

建议按这个顺序选：

1. `node skill`
2. `language / framework context skill`
3. `explicit override`
4. `default`

### 2.4 推荐映射

#### `implement`

- `before-dev`
- `tdd-workflow`
- `frontend-patterns`
- `backend-patterns`
- `python-testing`
- `django-patterns`
- `springboot-patterns`
- `golang-patterns`
- `kotlin-patterns`

#### `check`

- `check-cross-layer`
- `security-review`
- `security-scan`

#### `start`

- `codebase-onboarding`
- `brainstorm`

#### `finish`

- `finish-work`
- `deployment-patterns`

---

## 3. 三层实现

### 3.1 同步层

负责：

- skill 镜像
- catalog
- manifest

### 3.2 解析层

负责：

- 根据 `action / task_mode / package / language / framework`
- 选出 `selected_skills`

### 3.3 消费层

负责：

- hook 注入 skill
- agent 执行 skill

---

## 4. 不要做什么

为了避免把系统做重，第一阶段不要做：

- 运行时评分器
- LLM 自动裁决
- 让 skill 反向决定 workflow
- 把所有 skill 自动挂到所有节点

---

## 5. 最终建议

如果你的目标是“ECC skill 能同步进来，并在任务执行时自动选对 skill”，最小可行方案就是：

1. 先把 skill 资产接进来
2. 再在任务创建期解析出 `selected_skills`
3. 最后让 hook 消费结果

这三层分开后，系统既能保持灵活，又不会变成重型调度器。

