# `/focus-requirements` 输出与流转说明

文档日期：2026-03-22

本文档只回答四件事：

1. `/focus-requirements` 生成的文档会写到哪里
2. 它和后续其他 skill 的文档目录有什么区别
3. 这些文档的作用域是什么
4. 生成后应该怎么继续使用

它不是需求真源本身，也不是 `/focus-requirements` 的实现说明。

## 1. `/focus-requirements` 会写入哪个目录

`/focus-requirements` 的固定输出写在**当前项目工作区**里，也就是你正在处理的仓库根目录下。

固定输出只有三份：

- `docs/requirements/focus-requirements.md`
- `handoff/side-requirements.md`
- `handoff/handoff-summary.md`

这三份文件是 `/focus-requirements` 的完整输出面，不会再额外生成别的主文档。

### 这意味着什么

- 它们属于**项目内产物**
- 它们跟着当前仓库走
- 它们不是写到 `~/.spec-first/projects/...` 的跨会话缓存目录
- 它们也不是 `focus-requirements/templates/` 里的模板文件

## 2. 和后续其他 skill 文档目录的区别

这里要把目录分成三类看：

### A. skill 源码目录：`focus-requirements/`

这个目录放的是 skill 自己的实现资源：

- `focus-requirements/SKILL.md`
- `focus-requirements/templates/`
- `focus-requirements/examples/`

它们的作用是：

- 定义 skill 怎么工作
- 提供模板
- 提供示例
- 约束输出格式

它们**不是**实际项目需求输出。

### B. 当前项目输出目录：仓库根目录下的 `docs/` 和 `handoff/`

这是 `/focus-requirements` 真正写入的地方：

- `docs/requirements/focus-requirements.md`
- `handoff/side-requirements.md`
- `handoff/handoff-summary.md`

它们是这次需求聚焦的**项目级结果**，会被后续 review 和实现流程直接读取。

### C. 下游技能的项目缓存目录：`~/.spec-first/projects/$SLUG/`

后面的 skill 不一定继续写仓库内文件，它们常会写自己的项目级中间产物，例如：

- `/plan-ceo-review` 可能写 `~/.spec-first/projects/$SLUG/*-ceo-handoff-*.md`
- `/plan-eng-review` 可能写 `~/.spec-first/projects/$SLUG/*-test-plan-*.md`
- `/qa` 和 `/qa-only` 可能写 `~/.spec-first/projects/$SLUG/*-test-outcome-*.md`

这类目录的特点是：

- 属于**跨会话辅助产物**
- 方便后续 skill 继续接力
- 不等于仓库里的需求真源

## 3. 文档作用域是什么

### `docs/requirements/focus-requirements.md`

这是 `/focus-requirements` 的**真源 PRD**，但它的真源范围只有一个：

- 当前 owner 或当前 side

它应该只回答这一个 owner 需要做什么，不回答全局产品该怎么设计。

它的职责是：

- 收口当前 owner 的边界
- 明确 In Scope / Out of Scope
- 把依赖项和 owned scope 分开
- 给后续 `/plan-ceo-review` 和 `/plan-eng-review` 提供可执行输入

它**不是**：

- 全局 PRD
- 架构方案
- 实现计划
- 跨 owner 的总汇总

### `handoff/side-requirements.md`

这是给“其他 owner / 相邻 side”看的薄摘要。

它的作用是：

- 让别人快速知道你负责什么
- 让别人快速知道你不负责什么
- 让别人快速知道有哪些依赖需要对齐

它故意保持短，只保留边界信息。

### `handoff/handoff-summary.md`

这是给下游 review 链路用的最小桥接文档。

它的作用是：

- 提供一句话级别的需求摘要
- 列出关键验收标准
- 暴露未解决问题
- 提示下一步进入 `/plan-ceo-review`，再进入 `/plan-eng-review`

它不是详细 PRD，也不是实施方案。

## 4. 后续如何使用

典型链路是：

```text
Reviewed source requirement
  -> /focus-requirements
  -> docs/requirements/focus-requirements.md
  -> handoff/side-requirements.md
  -> handoff/handoff-summary.md
  -> /plan-ceo-review
  -> /plan-eng-review
  -> implementation / QA
```

### 实际消费方式

`/focus-requirements` 之后，后续流程通常这样用：

1. 先读 `docs/requirements/focus-requirements.md`
2. 再看 `handoff/side-requirements.md`，确认边界没有串 owner
3. 再看 `handoff/handoff-summary.md`，把上下游接起来
4. 进入 `/plan-ceo-review`，从产品和范围上继续校准
5. 进入 `/plan-eng-review`，锁定架构、数据流、边界和测试

### 什么时候说明文档要重写

如果下面任一条件变化，就应该重新跑 `/focus-requirements`，而不是在旧文件上硬补：

- owner 边界变了
- workspace 项目列表变了
- reviewed source requirement 变了
- 依赖关系被重新确认了
- 原来的 In Scope / Out of Scope 已经过时

## 5. ASCII 目录图

```text
                /focus-requirements
                       |
                       v
        +----------------------------------+
        | 当前项目工作区 (仓库根目录)     |
        +----------------------------------+
             |               |              |
             v               v              v
  docs/requirements/   handoff/side-   handoff/
  focus-requirements.md requirements.md handoff-summary.md
             |
             v
   作为当前 owner 的真源 PRD
             |
             v
      /plan-ceo-review
             |
             v
      /plan-eng-review
             |
             v
            QA / 实现

------------------- 另一条目录线 -------------------

focus-requirements/
   ├─ SKILL.md
   ├─ templates/
   └─ examples/

说明:
  这条线是 skill 本身的源码和示例
  不是项目需求输出

------------------- 下游缓存目录 -------------------

~/.spec-first/projects/$SLUG/
   ├─ *-ceo-handoff-*.md
   ├─ *-test-plan-*.md
   └─ *-test-outcome-*.md

说明:
  这条线是跨会话辅助产物
  不是仓库内的需求真源
```

## 6. 一句话结论

`/focus-requirements` 的输出写在当前仓库里，核心是 `docs/requirements/focus-requirements.md`，再配两份薄 handoff；`focus-requirements/templates/` 和 `focus-requirements/examples/` 是 skill 自己的资源目录，而 `~/.spec-first/projects/$SLUG/` 是后续技能常用的跨会话缓存目录，三者不要混用。

## 7. 多个需求同时存在时会不会覆盖

默认不会以“覆盖同一个固定文件”的方式工作，更多是“同目录下追加生成多个带时间戳的文件，然后下游读取最新一份”。

### 7.1 这几个目录的行为差异

#### `ceo-handoff`

- 文件名是 `~/.spec-first/projects/$SLUG/$USER-$BRANCH-ceo-handoff-$DATETIME.md`
- 它是一次 review 中的临时上下文
- `plan-ceo-review` 完成后，会清理同 branch 的 `ceo-handoff` 文件

所以它不是长期沉淀产物，而是“本轮 review 的临时记忆”。

#### `test-plan`

- 文件名是 `~/.spec-first/projects/{slug}/{user}-{branch}-test-plan-{datetime}.md`
- `plan-eng-review` 每次产出一份新的时间戳文件
- `/qa` 和 `/qa-only` 读取时取最近的一份 `*-test-plan-*.md`

所以多个需求并存时，旧文件通常还在，但默认会被新文件影子化。

#### `test-outcome`

- 文件名是 `~/.spec-first/projects/{slug}/{user}-{branch}-test-outcome-{datetime}.md`
- `/qa` 和 `/qa-only` 也是按时间戳继续写
- 这是 QA 结果的历史记录，不是固定单文件

### 7.2 什么叫“被覆盖”

这里要区分两件事：

1. **物理覆盖**
   - 用同一个文件名反复写，后一次把前一次内容直接抹掉

2. **读取覆盖 / 影子化**
   - 文件都还在
   - 但后续 skill 按 `ls -t ... | head -1` 只取最新的一份
   - 旧文件仍然存在，只是不再是默认输入

当前这些 project-scoped artifact 主要是第二种，不是第一种。

### 7.3 对多个需求的实际影响

如果你在同一个 branch 上连续跑多个需求：

- 新的 `design`、`ceo-handoff`、`test-plan`、`test-outcome` 会继续生成
- 后续 skill 默认读最近的匹配文件
- 旧文件不会自动消失，除非 skill 明确执行清理

因此：

- 适合把它理解成“时间线记录”
- 不适合把它理解成“只有一个全局当前值”

### 7.4 对 `/focus-requirements` 的含义

`/focus-requirements` 本身的仓库输出仍然是固定三份：

- `docs/requirements/focus-requirements.md`
- `handoff/side-requirements.md`
- `handoff/handoff-summary.md`

如果同一仓库里出现多个需求，这三份文件在仓库内会被后一次运行更新成“当前这次”的结果。  
而跨会话的 project-scoped 目录则会保留多份时间戳文件，后续 review / QA 通常取最新匹配的一份。

### 7.5 具体 case

#### Case 1: 单个需求，单次流转

```text
需求 A
  -> /focus-requirements
  -> docs/requirements/focus-requirements.md
  -> handoff/side-requirements.md
  -> handoff/handoff-summary.md
  -> /plan-ceo-review
  -> /plan-eng-review
```

结果：

- 仓库内只看见这一次 `/focus-requirements` 的三份输出
- `~/.spec-first/projects/$SLUG/` 里可能出现一份 CEO handoff、一份 test plan、一份 test outcome
- 后续默认取最近的一份作为输入

#### Case 2: 同一 branch 上连续跑两个不同需求

```text
需求 A
  -> 生成一轮 focus / handoff / review artifact

需求 B
  -> 再生成一轮 focus / handoff / review artifact
```

结果：

- 仓库内 `docs/requirements/focus-requirements.md` 会变成需求 B 的结果
- `handoff/side-requirements.md` 和 `handoff/handoff-summary.md` 也会被需求 B 更新
- `~/.spec-first/projects/$SLUG/` 里会同时保留 A 和 B 的时间戳文件
- 下游 skill 默认读取最新的 B，而不是自动回看 A

#### Case 3: 同一 branch 上重复跑 `/plan-ceo-review`

```text
第一次 /plan-ceo-review
  -> 写出 $USER-$BRANCH-ceo-handoff-$DATETIME-1.md

第二次 /plan-ceo-review
  -> 写出 $USER-$BRANCH-ceo-handoff-$DATETIME-2.md

完成后
  -> 清理同 branch 的 ceo-handoff 文件
```

结果：

- `ceo-handoff` 是临时上下文，不是长期积累物
- 如果 review 还没结束就重新跑，新的文件会成为最新上下文
- review 完成后，这类 handoff 会被清掉

#### Case 4: 同一 branch 上连续跑 QA

```text
第一次 /qa
  -> 读取最近的 test plan
  -> 写出一份 test outcome

第二次 /qa
  -> 仍然读取最近的 test plan
  -> 再写出一份新的 test outcome
```

结果：

- `test-plan` 和 `test-outcome` 都是时间线上的多份记录
- 新的结果不会抹掉旧结果
- 但后续 QA 默认会把最新的 test plan 当主输入

#### Case 5: 旧需求还在磁盘上，但不是默认输入

```text
需求 A 的文件还在 ~/.spec-first/projects/$SLUG/
需求 B 的文件也已经生成
```

结果：

- A 没有被删除
- 但后续 skill 如果按 `ls -t ... | head -1` 取输入，就会先看到 B
- 这就是“影子化”，不是“物理覆盖”

#### Case 6: 不同 repo，各自有自己的项目目录

```text
repo A: /Users/kuang/work/app-a
repo B: /Users/kuang/work/app-b
```

结果：

- repo A 的仓库内产物写到 `/Users/kuang/work/app-a/docs/...` 和 `/Users/kuang/work/app-a/handoff/...`
- repo B 的仓库内产物写到 `/Users/kuang/work/app-b/docs/...` 和 `/Users/kuang/work/app-b/handoff/...`
- project-scoped 目录也会按各自的 slug 分开

所以不同 repo 之间默认不会互相覆盖。

#### Case 7: 同 repo，不同 worktree

```text
worktree 1: /Users/kuang/work/app-a
worktree 2: /Users/kuang/work/app-a-feature-x
```

结果：

- 如果这两个 worktree 属于同一个 repo / 同一个远端 slug，它们通常会共用同一个 `~/.spec-first/projects/$SLUG/`
- 真正区分它们的主要是 `branch` 和 `datetime`
- 如果 branch 相同，就会出现“最新匹配优先”的影子化效果

也就是说：

- worktree 路径本身不一定决定 project-scoped 目录
- repo slug 更关键

#### Case 8: 同 repo，不同 branch

```text
branch A: feature/login
branch B: feature/payments
```

结果：

- project-scoped 文件名里会带不同的 `{branch}`
- 例如 `alice-feature-login-test-plan-20260322-120000.md`
- 例如 `alice-feature-payments-test-plan-20260322-121500.md`

如果下游按 branch 过滤，就会优先看到同 branch 的那份；如果只按最近时间取，就会看到最新生成的那份。
