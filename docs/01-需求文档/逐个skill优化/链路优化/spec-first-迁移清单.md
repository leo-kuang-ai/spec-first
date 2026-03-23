# spec-first 可直接迁移的借鉴清单

> 基于 `get-shit-done` 当前实现整理。
>
> 目标不是“照搬全部流程”，而是筛出那些对 `spec-first` 真正有价值、且能直接落地的设计模式。

## 1. 先给结论

最值得迁移的不是命令数量，而是这 6 个机制：

1. **文件即真相源**
2. **主链与旁路分层**
3. **需求 / 阶段 / 计划 / 版本分层**
4. **wave 化并行执行**
5. **摘要文件与归档文件分离**
6. **临时想法先进入缓冲层**

这几项和 `spec-first` 的目标非常一致，而且不会破坏现有的需求、设计、任务、验证链条。

---

## 2. 可以直接迁移的点

### 2.1 文件即真相源

`get-shit-done` 的核心状态不是存在对话里，而是写进：

- `PROJECT.md`
- `REQUIREMENTS.md`
- `ROADMAP.md`
- `STATE.md`
- `SUMMARY.md`

### 迁移到 spec-first 的方式

`spec-first` 已经有类似思想，但可以进一步收紧：

- `spec.md` 作为需求真相源
- `design.md` 作为设计真相源
- `task_plan.md` 作为任务真相源
- `findings.md` 作为运行态/审计真相源

### 为什么值得迁移

- 避免对话上下文成为唯一记忆
- 让审查、回溯、归档更容易
- 让 gate 可以基于文件而不是印象做判断

---

### 2.2 主链与旁路分层

GSD 把主链和旁路分得很清楚：

- 主链：`PROJECT -> REQUIREMENTS -> ROADMAP -> PLAN -> SUMMARY -> MILESTONE`
- 旁路：`todo / quick / workstream / note`

### 迁移到 spec-first 的方式

`spec-first` 可以采用同样的分层思路：

- 主链只保留：
  - `Feature`
  - `REQ`
  - `FR`
  - `DS`
  - `TASK`
  - `TC`
- 旁路保留：
  - `Defect`
  - `RFC`
  - `EX`
  - `todo`
  - `quick capture`

### 为什么值得迁移

- 主链更稳定
- 旁路更灵活
- 不会把所有信息都硬塞进一个 ID 图

---

### 2.3 需求 / 阶段 / 计划 / 版本分层

GSD 的层级很清晰：

- `REQ` 代表需求项
- `Phase` 代表阶段
- `PLAN` 代表执行切片
- `milestone` 代表发布版本

### 迁移到 spec-first 的方式

建议保持同样的思路：

- `REQ`：需求项
- `FR`：功能需求
- `DS`：设计约束
- `TASK`：执行切片
- `TC`：测试追踪

同时避免把“需求项”与“功能需求”混写成同一层。

### 为什么值得迁移

- 减少语义污染
- 阶段边界更清晰
- 更容易做 traceability

---

### 2.4 wave 化并行执行

GSD 的计划执行不是纯顺序，而是按 `wave` 执行。

### 迁移到 spec-first 的方式

`spec-first` 的 `06-task` / `07-code` / `12-verify` 很适合借鉴这个机制：

- 独立任务并行
- 有依赖的任务顺序执行
- 每个 wave 用 fresh context 或至少隔离的执行上下文

### 为什么值得迁移

- 提升并行效率
- 减少上下文污染
- 更适合大范围改造

---

### 2.5 摘要文件与归档文件分离

GSD 把“当前状态”和“历史记录”分开：

- `STATE.md` 是短期摘要
- `PROJECT.md` 是长期上下文
- `SUMMARY.md` 是阶段结果
- `MILESTONES.md` 是归档历史

### 迁移到 spec-first 的方式

可以直接对齐成：

- `findings.md`：短期运行态
- `spec.md / design.md / task_plan.md`：长期交付态
- `archive/`：阶段归档

### 为什么值得迁移

- 当前信息保持小而快
- 历史信息可追溯
- 避免一个文件无限膨胀

---

### 2.6 临时想法先进入缓冲层

GSD 用 `todo` 和 `note` 把会话里的零散想法先接住。

### 迁移到 spec-first 的方式

`spec-first` 可以把会话中突然冒出的点先落到一个缓冲层：

- `findings.md` 中的临时观察
- 独立的 `todo` 或 `parking lot`
- `defect` / `RFC` 作为结构化升级入口

### 为什么值得迁移

- 避免打断主流程
- 避免遗漏边界问题
- 避免临时想法污染正式文档

---

## 3. 对 spec-first 最值得直接借鉴的具体做法

### 3.1 主链只认少数核心 ID

建议严格限制主链：

```text
Feature -> REQ -> FR -> DS -> TASK -> TC
```

旁路只做补充：

```text
Defect / RFC / EX / todo / quick capture
```

### 3.2 每层只做一件事

借鉴 GSD 的做法，把职责切清楚：

| 层 | 只负责什么 |
|---|---|
| REQ | 需求项 |
| FR | 功能需求 |
| DS | 设计约束 |
| TASK | 执行切片 |
| TC | 测试追踪 |
| RFC | 明确偏离 / 豁免 |
| Defect | 缺陷回流 |

### 3.3 用摘要文件承接运行态

不要把运行时噪音塞进正式需求文档。

建议：

- 需求类变化进 `spec.md`
- 设计类变化进 `design.md`
- 执行类变化进 `task_plan.md`
- 运行观察进 `findings.md`
- 不确定事项进 `todo` 或单独缓冲区

### 3.4 让 gate 看文件，不看记忆

GSD 很多 gate 都是根据文件是否存在、内容是否覆盖来判断。

spec-first 可以继续强化：

- `document-links`
- `gate check`
- `task-plan` 解析
- `defect` / `RFC` 的结构化校验

这样可以减少“我觉得已经做了”的误判。

---

## 4. 不建议直接迁移的点

### 4.1 不建议直接搬命令海

GSD 的命令很多，功能很细。

spec-first 不需要先复制全部命令数量，应该先保留主链命令：

- `spec`
- `design`
- `task`
- `code`
- `verify`
- `sync`
- `review`

### 4.2 不建议直接搬全量 ceremony

GSD 对讨论、规划、执行、归档都很细。

如果照搬，spec-first 可能会变重。

更合理的是：

- 保留必要 gate
- 保留必要归档
- 去掉不必要的仪式感

### 4.3 不建议把 todo / quick 直接当主链

它们应该是缓冲和旁路，而不是主交付层的一部分。

---

## 5. spec-first 可以落地的迁移顺序

如果要迁移，建议按这个顺序：

### 第一批

1. 强化文件即真相源
2. 收紧主链 ID
3. 把旁路从主链中剥离

### 第二批

4. 引入 wave 化执行视图
5. 明确摘要文件与归档文件分离
6. 把临时想法先落缓存层

### 第三批

7. 用 gate 校验文件一致性
8. 强化 Defect / RFC / EX 的结构化回流

---

## 6. 迁移后的目标形态

可以把目标形态压成这句话：

```text
主链负责交付，旁路负责缓冲，文件负责真相，gate 负责质量。
```

如果这句话成立，`spec-first` 的复杂度会比现在更可控，但不会丢掉高质量交付能力。

