# fast-spec Claude 集成设计

## 背景

当前仓库已经有一套完整的 `spec-first` 工作流：

- `spec-first init` 负责初始化 `.spec-first/`
- `before-dev` 负责写代码前注入规范
- `check` 负责写代码后校验
- `update-spec` 负责把新知识回写到 `.spec-first/spec/`

你现在想做的不是重建一套新体系，而是新增一个 **Claude 侧入口** `fast-spec`，让它继续驱动现有的 `spec-first` 任务体系，但对用户来说更像一个新的、更轻量的入口。

---

## 目标

| 目标 | 说明 |
|---|---|
| 新入口 | 在 `packages/cli/src/templates/claude` 下新增 `fast-spec` 命令 |
| 复用现有体系 | 继续使用现有 `.spec-first/tasks/`、`.spec-first/spec/`、`before-dev`、`check`、`update-spec` |
| 不改业务代码 | 只改 Claude 模板侧，不改项目源码 |
| 保持兼容 | 现有 `spec-first` 命令和现有工作流继续可用 |
| 降低认知负担 | 用户看到的是 `fast-spec`，不是一堆分散命令 |

---

## 非目标

| 非目标 | 说明 |
|---|---|
| 不重写 Codex 并行流水线 | 这次不动 `marketplace/skills/cc-codex-spec-bootstrap` 的整条链路 |
| 不重做 GitNexus / ABCoder 分析 | 如果以后需要再做，不放在这次最小方案里 |
| 不改业务源码 | 不改 `packages/cli/src` 的产品逻辑，只改 `templates/claude` 下的入口模板 |
| 不替换现有 `spec-first` 命令 | `fast-spec` 是新入口，不是移除旧入口 |

---

## 设计选项

### 方案 A: 只做 Claude Command 包装器

新增一个 Claude slash command，例如：

- `packages/cli/src/templates/claude/commands/spec/fast-spec.md`

这个命令本身不实现新框架，只是把现有工作流串起来：

```text
fast-spec
  -> 读当前工作区
  -> 读 .spec-first/workflow.md / 当前任务 / spec index
  -> 选择需要的 spec 文档
  -> 触发 before-dev
  -> 开始实现
  -> 触发 check
  -> 必要时触发 update-spec
```

优点：

- 改动最小
- 兼容现有体系
- 容易测试

缺点：

- 仍然依赖现有 `spec-first` 的命令语义
- `fast-spec` 更像一个“编排入口”，不是一套全新框架

### 方案 B: 新增 Command + 辅助 Agent

在方案 A 基础上，再加一个专用 agent 文本，帮助拆任务或生成 PRD。

优点：

- 对复杂项目更友好

缺点：

- 复杂度上升
- 需要更多测试和迁移考虑

### 方案 C: 全链路品牌化

把 `fast-spec` 同步扩展到更多平台和流水线。

优点：

- 品牌统一

缺点：

- 改动最大
- 和当前“只改 Claude 模板”的目标不一致

### 推荐

选 **方案 A**。  
原因：你明确要求的是“只在 `packages/cli/src/templates/claude` 里新增一个 Claude command/skill，用现有 spec-first 任务体系驱动 fast-spec”，所以最稳的是先做一个薄封装入口。

---

## 推荐架构

### 入口层

新增 `fast-spec` Claude command，负责：

1. 判断当前仓库是否已经初始化 `.spec-first/`
2. 检查当前任务 / 当前规范是否存在
3. 按任务类型读取相关 `index.md`
4. 进入 `before-dev` 阶段
5. 开发完成后进入 `check`
6. 需要补知识时进入 `update-spec`

### 复用层

继续复用现有能力：

- `workflow.md`
- `get_context.py`
- `task.py init-context`
- `task.py add-context`
- `before-dev`
- `check`
- `finish-work`
- `update-spec`

### 产物层

不新增新的产物体系，只沿用：

- `.spec-first/tasks/...`
- `.spec-first/spec/...`
- `.spec-first/workflow.md`

ASCII 流程图：

```text
用户执行 /spec:fast-spec
   │
   ├─ 读取当前 .spec-first/workflow.md
   ├─ 读取 get_context.py --mode packages
   ├─ 读取相关 spec/<package>/<layer>/index.md
   ├─ 选择/创建任务上下文
   ├─ 进入 before-dev 读取规范
   ├─ 开始开发
   ├─ 进入 check 做校验
   └─ 必要时 update-spec 回写规范
```

---

## 文件改造建议

### 必改文件

| 文件 | 动作 | 理由 |
|---|---|---|
| `packages/cli/src/templates/claude/commands/spec/fast-spec.md` | 新增 | 新入口本体 |

### 可选文件

| 文件 | 动作 | 理由 |
|---|---|---|
| `packages/cli/src/templates/claude/commands/spec/onboard.md` | 追加说明 | 让用户知道有 `fast-spec` |
| `packages/cli/src/templates/claude/commands/spec/start.md` | 追加跳转 | 让现有入口能引导到 `fast-spec` |
| `packages/cli/test/templates/claude.test.ts` | 新增/更新断言 | 确认新命令能被打包和复制 |

### 不建议改的文件

| 文件 | 为什么不动 |
|---|---|
| `packages/cli/src/templates/codex/**` | 你这次只要求 Claude 侧集成 |
| `marketplace/skills/cc-codex-spec-bootstrap/**` | 这是另一条 bootstrap pipeline，不是本次最小方案 |
| `packages/cli/src/commands/init.ts` | 这次不重写初始化逻辑 |

---

## `fast-spec` 命令职责边界

`fast-spec` 应该做的是“编排”，不是“生产知识”。

| 职责 | 是否应该由 `fast-spec` 执行 |
|---|---|
| 读取当前项目上下文 | 是 |
| 选择相关 spec index | 是 |
| 触发 `before-dev` | 是 |
| 触发 `check` | 是 |
| 触发 `update-spec` | 是，必要时 |
| 直接写大量 spec 正文 | 不建议 |
| 重建 GitNexus / ABCoder pipeline | 不建议 |
| 改业务源码 | 绝对不做 |

一句话：

```text
fast-spec 是入口和路由器，不是新的知识生产引擎
```

---

## 与现有 spec-first 体系的关系

| 现有能力 | fast-spec 的使用方式 |
|---|---|
| `spec-first init` | 先保证 `.spec-first/` 存在 |
| `task.py init-context` | 把当前任务和 `spec index` 绑起来 |
| `before-dev` | 写代码前注入相关规范 |
| `check` | 写代码后验证规范合规 |
| `update-spec` | 发现新模式后回写规范 |
| `finish-work` | 提交前做收口检查 |

`fast-spec` 的价值是把这些步骤重新包装成一个更顺手的 Claude 入口，而不是替换它们。

---

## 运行时数据流

### 1. 初始化前

```text
用户触发 fast-spec
  -> 检查 .spec-first/ 是否存在
  -> 检查 workflow / current task / packages
```

### 2. 任务选择

```text
识别当前包和层
  -> 读 spec/<package>/<layer>/index.md
  -> 按 checklist 选细则文件
```

### 3. 开发前

```text
before-dev
  -> 注入项目规范
  -> 明确本次实现边界
```

### 4. 开发后

```text
check
  -> 读取 changed files
  -> 对照 spec
  -> 运行 lint / typecheck
```

### 5. 知识回写

```text
如果发现新模式 / 新约定
  -> update-spec
  -> 回写到对应 spec 文件和 index.md
```

---

## 验收标准

| 验收点 | 判定方式 |
|---|---|
| 新入口可见 | `packages/cli/src/templates/claude/commands/spec/fast-spec.md` 被复制到项目 `.claude/commands/spec/` |
| 兼容现有体系 | 旧的 `spec-first` 工作流仍可用 |
| 不改业务源码 | 只改模板目录和相关测试 |
| 能驱动现有任务体系 | `fast-spec` 能引导到 `before-dev`、`check`、`update-spec` |
| 产物一致 | 最终仍然落在 `.spec-first/tasks/`、`.spec-first/spec/` |

---

## 风险

| 风险 | 说明 | 缓解方式 |
|---|---|---|
| 命令语义过重 | `fast-spec` 变成另一个“万能命令” | 保持其为编排器，不塞太多业务逻辑 |
| 用户混淆 | `fast-spec` 和现有 `spec-first` 命令边界不清 | 在 onboard / README 里明确说明 |
| 规范漂移 | 新入口绕过 `index.md` 和 checklist | 强制通过 `index.md` 路由 |
| 维护成本上升 | 再加一个品牌名和一套说明 | 先做单 command，避免立即扩展到全链路 |

---

## 推荐实施顺序

```text
1. 新增 Claude command: fast-spec.md
2. 在 command 内容里复用现有 spec-first 流程
3. 补最小测试，确认模板被复制到项目 `.claude/commands/spec/`
4. 如有需要，再补 onboard / start 的跳转说明
5. 稳定后再考虑是否增加辅助 agent
```

---

## 结论

如果只在 `packages/cli/src/templates/claude` 里做改造，最合理的方式不是重写体系，而是做一个 **薄封装的 `fast-spec` Claude command**：

- 它负责路由和编排
- 它继续使用现有 `spec-first` 任务体系
- 它不改 Codex 侧流水线
- 它不改业务源码

最终效果应该是：

```text
用户看到 fast-spec
底层仍然是 spec-first 的 task / spec / before-dev / check / update-spec
```
