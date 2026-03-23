# 00-first 深挖：问题点 / 修改点 / 验证点

> 目标：只围绕 `00-first` 做进一步下钻，把它拆成更细的优化单元。
>
> 事实边界：
> - 只基于 `skills/spec-first/00-first/SKILL.md` 与 `src/core/skill-runtime/first-*.ts`
> - `docs/first/*.md` 是投影，不是真源
> - 未在代码中看到的能力，不写成现状

## 0. 00-first 的真实职责分层

```text
00-first
  ├─ 入口边界
  │   ├─ Skill 负责定义工作流 / 多 Agent 编排 / 约束 / 成功标准
  │   └─ CLI 只负责启动、校验、宿主集成
  ├─ 真源层
  │   ├─ .spec-first/runtime/first/index.json
  │   ├─ summary / steering / conventions / critical-flows / entry-guide
  │   ├─ api-contracts / structure-overview / domain-model / database-schema
  │   └─ project-cognition-updates.jsonl
  ├─ 投影层
  │   └─ docs/first/*.md
  ├─ 校验层
  │   ├─ runtime validator
  │   └─ docs existence check
  └─ 增量更新层
      ├─ change detector
      ├─ runtime rebuild decision
      └─ project cognition writeback
```

## 1. 入口边界

### 问题点

| 问题点 | 事实依据 | 影响 |
|---|---|---|
| `00-first` 的职责定义很强，但 README/SKILL 里对“Skill 负责什么、CLI 负责什么”的边界分散在多处 | `skills/spec-first/00-first/SKILL.md` 中同时写了工作流、主线程契约、正式 contract、核心硬约束 | 读者容易把“入口说明”误读成“完整执行说明” |
| `docs/first/*.md` 明确是人类输出，但如果不持续强调，容易在后续节点被当成上下文真源 | `SKILL.md` 直接写明 docs 不参与上下文注入，不承载真源语义 | 认知链可能反向污染 |
| 代码里存在多份 first 相关模块，但入口层与更新层分离较深 | `first-context.ts`、`first-change-detector.ts`、`first-runtime-store.ts`、`first-docs-check.ts`、`first-governance.ts` | 新人很难一眼看出 first 的主链路 |

### 修改点

| 修改点 | 目标 |
|---|---|
| 把入口边界再压成“一页式职责表” | 先看边界，再看细节 |
| 把 `Skill / CLI / runtime / docs` 四层固定成统一术语 | 降低概念混用 |
| 把“禁止捏造”和“docs 不回灌”放进入口首屏 | 提前封住常见误区 |

### 验证点

| 验证点 | 通过标准 |
|---|---|
| 入口页是否能在 30 秒内说明 00-first 的职责 | 能分清 Skill / CLI / runtime / docs |
| 是否能一眼识别 docs 是投影而不是真源 | 文档中明确写出 `docs/first/*.md` 的边界 |
| 是否能找到 first 的主链路模块 | 能定位到 `first-runtime-store.ts`、`first-context.ts`、`first-change-detector.ts`、`first-docs-check.ts` |

## 2. 真源层

### 问题点

| 问题点 | 事实依据 | 影响 |
|---|---|---|
| runtime 真源分散在多个文件，但索引文件是总入口 | `first-runtime-store.ts` 定义 `.spec-first/runtime/first/index.json` 与 9 个资产路径 | 如果只看单个资产，容易失去总览 |
| database schema 是条件产物，不是默认产物 | `first-runtime-types.ts` 中 `databaseSchema.status` 为 `healthy / not_applicable / degraded`；`first-runtime-validator.ts` 仅在 healthy 时要求 `database-schema.json` | 数据库模块存在误触发风险 |
| 真源与投影之间的映射是显式表驱动 | `first-artifact-mapping.ts` 维护 `FIRST_RUNTIME_TO_DOCS_PROJECTION_MAP` 与 `CANONICAL_PROJECTION_DOCS` | 映射表变更容易影响全链路 |

### 修改点

| 修改点 | 目标 |
|---|---|
| 把 9 个 runtime 资产整理成“资产清单 + 作用 + 依赖条件”表 | 让真源一眼可读 |
| 对 `databaseSchema` 额外标记“条件产物” | 防止默认消费 |
| 把映射表单独抽成“真源 -> 投影”视图 | 便于核对 docs 输出范围 |

### 验证点

| 验证点 | 通过标准 |
|---|---|
| 是否能确认 runtime 索引是唯一总入口 | `index.json` 被识别为总索引 |
| 是否能确认数据库文档是条件项 | `databaseSchema.status === healthy` 才进入 docs 校验 |
| 是否能从映射表推导出 docs 投影集合 | `CANONICAL_PROJECTION_DOCS` 与映射表一致 |

## 3. 投影层

### 问题点

| 问题点 | 事实依据 | 影响 |
|---|---|---|
| `docs/first/*.md` 的定位很清楚，但投影规则很长，容易在维护时只改 docs 不改 runtime | `first-artifact-mapping.ts` 明确写出 runtime -> docs 映射 | 产生 runtime/docs 偏差 |
| docs 健康校验是独立步骤，不等于 runtime 健康 | `first-docs-check.ts` 只检查 docs 是否存在 | 可能出现 docs 有、runtime 缺失或反之 |
| 投影文档数量较多，但有基础投影与主题投影之分 | `BASE_PROJECTION_DOCS`、`FORMAL_TOPIC_PROJECTION_DOCS`、`CONDITIONAL_PROJECTION_DOCS` | 如果不分层，维护者会把全部 docs 当平级 |

### 修改点

| 修改点 | 目标 |
|---|---|
| 把 docs 投影分成基础 / 主题 / 条件三层展示 | 让维护者知道先改哪一层 |
| 对每个投影文档增加“来源 runtime 资产”提示 | 减少误改 |
| 把 docs 健康与 runtime 健康并列输出 | 避免单看 docs 误判 |

### 验证点

| 验证点 | 通过标准 |
|---|---|
| 是否能清楚指出某个 docs 来自哪个 runtime 资产 | 可从映射表反查 |
| 是否能识别条件投影 | `database-er.md` 只在健康条件满足时出现 |
| 是否能区分 runtime 和 docs 的健康状态 | 两者分别展示，不互相替代 |

## 4. 校验层

### 问题点

| 问题点 | 事实依据 | 影响 |
|---|---|---|
| runtime 校验要求固定资产 + 条件资产 | `first-runtime-validator.ts` 中硬编码了 summary/steering/conventions/critical-flows/entry-guide/api-contracts/structure-overview/domain-model，database-schema 仅条件校验 | 如果资产缺失，会直接失败，但错误信息分散 |
| docs 校验使用 canonical 投影集合，但 database doc 有条件判断 | `first-docs-check.ts` 在 `databaseSchema.status === healthy` 时才要求 `database-er.md` | 如果不先看 runtime index，容易误判 docs 缺失 |
| 校验与更新策略并不在同一模块 | validator / docs check / change detector 分属不同文件 | 维护时容易只修一层，不修另一层 |

### 修改点

| 修改点 | 目标 |
|---|---|
| 把 runtime 校验和 docs 校验的结果合并成一张总表 | 方便人工审查 |
| 为缺失项输出“这是 runtime 缺失 / docs 缺失 / 条件缺失” | 防止信息混淆 |
| 把校验失败的提示文本统一成同一语法 | 便于后续自动化消费 |

### 验证点

| 验证点 | 通过标准 |
|---|---|
| 是否能从校验结果直接判断缺的是 runtime 还是 docs | 能明确分层 |
| 是否能识别条件缺失与真实缺失 | `database-schema.json` 与 `database-er.md` 分别处理 |
| 是否能在一个表里看全健康状态 | runtime / docs / 条件项三类都可读 |

## 5. 增量更新层

### 问题点

| 问题点 | 事实依据 | 影响 |
|---|---|---|
| 变更检测同时看工作区和提交差异 | `first-change-detector.ts` 读取 `git diff` 和 `git status --porcelain` | 如果只看一边，容易漏掉未提交变更 |
| 30% 阈值会切换到 full refresh | `CHANGE_THRESHOLD = 0.3`；`changePercentage > CHANGE_THRESHOLD` 时推荐 `full` | 阈值很明确，但容易被忽略 |
| `first-context.ts` 中有完整重建和增量重建两条路 | `_determineRebuildArtifacts()` 根据健康状态和变更文件决定是否全量刷新 | 如果没有把决策说清楚，更新行为会显得“忽大忽小” |

### 修改点

| 修改点 | 目标 |
|---|---|
| 把“变更文件数 / 总文件数 / 变更比例 / 推荐策略”显示出来 | 让 full vs incremental 可解释 |
| 把 full refresh 的触发条件写成显式规则卡片 | 减少策略误解 |
| 把工作区变更和已提交变更的来源分开标记 | 方便排查漏扫 |

### 验证点

| 验证点 | 通过标准 |
|---|---|
| 是否能说明为什么触发全量更新 | 能看到 30% 阈值或健康态失效 |
| 是否能区分工作区变更与已提交变更 | 两者在分析结果中可辨 |
| 是否能从变更文件反推出受影响产物 | `matchRuntimeArtifactsByChangedFile()` 和 `matchArtifactsByChangedFile()` 输出一致 |

## 6. 背景状态与同步写回

### 问题点

| 问题点 | 事实依据 | 影响 |
|---|---|---|
| `background_input_status` 是 first 之后所有节点都要消费的背景字段 | `00-first` 相关技能与 runtime 背景质量契约一致 | 如果 first 没把背景状态写对，下游会连续受影响 |
| project cognition writeback 只在 `WRAP_UP/DONE` 触发 | `first-governance.ts` 依据结构变更决定是否更新项目认知记忆 | 如果中间过程改动大，写回时机要被严格理解 |
| `project-cognition-updates.jsonl` 是写回痕迹，不是 docs 真源 | `first-runtime-store.ts` 定义该文件路径；`first-governance.ts` 负责写入 | 很容易把写回日志误当成认知正文 |

### 修改点

| 修改点 | 目标 |
|---|---|
| 把 `background_input_status` 的来源、传播、消费路径画成一条线 | 便于排查背景劣化 |
| 把 `project-cognition-updates.jsonl` 单独标成审计记录 | 防止误当正文 |
| 把 `WRAP_UP/DONE` 的写回时机写成明确条件 | 减少不必要的写回 |

### 验证点

| 验证点 | 通过标准 |
|---|---|
| 是否能说明 background_input_status 何时更新 | 能追到治理链路 |
| 是否能区分审计记录与正文 | `project-cognition-updates.jsonl` 不被当成 docs |
| 是否能确认写回仅发生在规定阶段 | 触发点与 `WRAP_UP/DONE` 对齐 |

## 7. 00-first 的优化顺序

```text
P0: 先把入口边界说清楚
P1: 再把 runtime 真源与 docs 投影分开
P2: 再收紧校验层的错误描述
P3: 再明确增量 / 全量更新策略
P4: 最后把 background 状态与 cognition writeback 串起来
```

## 8. 00-first 的最小改造原则

1. 不改事实边界，只改表达与校验可读性
2. 不把 docs 提升为真源
3. 不把条件产物改成默认产物
4. 不把审计日志当正文
5. 不把增量策略改写成“总是全量”

