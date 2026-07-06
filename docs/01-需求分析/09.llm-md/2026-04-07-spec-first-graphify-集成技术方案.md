# spec-first × graphify 集成技术方案

> 方案性质：技术方案 / skill 集成设计
> 撰写日期：2026-04-07
> 适用范围：`spec-first`、`graphify`、`spec-graph-bootstrap`、`spec-docs`
> 目标：将 `graphify` 作为上游结构发现引擎接入 `spec-first`，通过新 skill 编排消费，而不是将 `graphify` 代码并入 `spec-first`

---

## 1. 结论摘要

本方案的核心结论只有一条：

**`spec-first` 应正式打包 graphify 运行时入口（Claude: `spec-graphify`；Codex: `graphify` skill），并由后续 `spec-graph-bootstrap` / `spec-docs` 直接消费其 `graphify-out/` 产物；不将 `graphify` Python 代码并入 `spec-first`。**

当前推荐新增并保留的能力只有一个：

- `skills/graphify/SKILL.md`

它的定位不是替代 `spec-graph-bootstrap`，而是作为 `spec-first` 里的**上游结构发现入口**：

- `graphify` 负责把原始目录编译成“结构导航层”产物
- `spec-graph-bootstrap` 负责消费这些图谱产物并把有价值的结构信息提炼为 `spec-docs/contexts/*`
- `spec-docs` 仍然是长期知识真相层

因此，整体关系是：

```text
原始代码 / 文档 / PDF / 图片
    ↓
graphify
    ↓
graphify-out/GRAPH_REPORT.md + graph.json + wiki/
    ↓
spec-graph-bootstrap / spec-docs
```

---

## 2. 背景

当前 `spec-first` 已经具备两类能力：

1. 通过 repo-owned `skills/` 与 `agents/` 向运行时安装工作流资产
2. 通过 `spec-graph-bootstrap`、`spec-compound`、`spec-plan`、`spec-work`、`spec-code-review` 形成长期知识与执行闭环

但 `spec-graph-bootstrap` 的一个天然难点是：

- 它要先理解项目结构，才能生成 `summary.md`、`module-map.md`、`overview.md`
- 这一步通常需要大量遍历代码、读文件、手工归纳
- 在大型代码库或混合资料目录里，直接从原始文件做结构发现成本高、稳定性差

`graphify` 恰好补的是这层空缺。它已经具备：

- 多模态输入抽取（代码、文档、PDF、图片）
- 结构关系和语义关系抽取
- 社区/模块聚类
- 生成 `GRAPH_REPORT.md`、`graph.json`、`graph.html`
- 可选生成 agent 可读 `wiki/`

一句话说，`graphify` 做的是：

**先把原始目录编译成“AI 可导航的结构图谱”。**

这与 `spec-docs` 的目标并不冲突，因为 `spec-docs` 关心的是：

- 哪些知识值得长期保存
- 哪些规则必须静态在场
- 哪些页面是 agent 默认消费的真相层

因此两者天然是**上下游关系**，而不是替代关系。

---

## 3. 目标与非目标

### 3.1 目标

本方案的目标是：

1. 在 `spec-first` 中新增一个 repo-owned skill，用于接入 `graphify`
2. 让 agent 在进入项目结构分析之前，优先消费 `graphify-out/GRAPH_REPORT.md`
3. 在已有 `graphify-out/` 时直接复用；没有时通过内置 `graphify` workflow 触发一次构建
4. 把 `graphify` 的结构发现结果作为 `spec-graph-bootstrap` 上游输入，辅助生成：
   - `summary.md`
   - `module-map.md`
   - `overview.md`
5. 保持 `conventions.md`、`pitfalls/index.md`、`solutions/*` 仍由 `spec-first` 自己治理
6. 保持集成是**可选增强**，不破坏未安装 `graphify` 的既有流程

### 3.2 非目标

本方案明确不做以下事情：

1. 不将 `graphify` Python 代码复制、迁入、重写到 `spec-first`
2. 不让 `graphify` 直接产出 `spec-docs` 终稿
3. 不让 `graphify` 替代 `spec-graph-bootstrap`
4. 不在第一阶段实现 `graph.json` 的深度程序化查询集成
5. 不在第一阶段修改 `spec-first init` 或 CLI 绑定逻辑

---

## 4. 为什么不做代码级集成

### 4.1 直接调用 `graphify` 的理由

直接调用 `graphify` CLI 的收益是：

1. **边界清晰**：`graphify` 仍是外部结构分析器，`spec-first` 仍是工作流编排器
2. **维护成本低**：不需要共同维护 AST 提取、社区聚类、HTML 导出、缓存、wiki 生成
3. **升级成本低**：`graphify` 升级时不需要同步迁移大块内部实现
4. **落地速度快**：`spec-first` 只需要新增 skill 和消费 contract
5. **失败可降级**：`graphify` 不存在时，依然可以回退到当前 `spec-graph-bootstrap` 行为

### 4.2 代码并入 `spec-first` 的问题

如果把 `graphify` 代码并入 `spec-first`，会立即引入以下问题：

1. `spec-first` 的边界从“workflow CLI”膨胀为“图谱构建器 + workflow CLI”
2. 依赖栈从 Node.js 扩展为深度绑定 Python 图谱分析链
3. 发布、测试、故障定位、版本兼容的复杂度显著上升
4. `graphify` 的独立演进节奏被迫与 `spec-first` 绑定

因此本方案明确选择：

**能力编排集成，不做代码内嵌集成。**

---

## 5. 集成后的系统分层

### 5.1 分层职责

| 层 | 组件 | 职责 |
|---|---|---|
| 结构发现层 | `graphify` | 从原始目录抽取结构关系、语义关系、社区、图谱产物 |
| 图谱产物层 | `graphify-out/` | 提供 `GRAPH_REPORT.md`、`graph.json`、`wiki/` 作为可消费中间产物 |
| 运行时入口层 | `graphify` skill | 安装 graphify、执行图谱分析、生成 `graphify-out/` |
| 知识提炼层 | `spec-graph-bootstrap` | 把结构信息压缩进 `spec-docs/contexts/*` |
| 真相层 | `spec-docs` | 长期持有项目知识、规矩、陷阱、经验沉淀 |

### 5.2 权威性层级

当不同层的内容出现冲突时，权威顺序如下：

1. **人工确认后写入 `spec-docs` 的内容**
2. `graphify` 的结构导航产物（仅作为发现线索）
3. 原始代码和原始资料（最终核实来源）

注意：

- `graphify` 不是“真相层”
- `graphify` 是“结构发现层”
- `spec-docs` 才是 agent 默认消费的长期真相层

---

## 6. 技术方案总览

### 6.1 新增 skill

新增一个 repo-owned skill：

```text
skills/
└── graphify/
    ├── SKILL.md
    ├── references/
    │   └── upstream-skill-codex.md
    └── scripts/                  # 如后续需要再补
```

### 6.2 Skill 名称与定位

推荐名称：

- `graphify`

触发语义：

- 为目标目录构建或消费 `graphify-out/`
- 为 `spec-graph-bootstrap` 提供上游结构产物
- 为 agent 输出“先读结构、再读源码”的导航结果

不推荐命名为：

- `spec-graph-bootstrap`
  原因：会人为制造第二个入口，放大与 `graphify` 本身的职责重叠

### 6.3 为什么不直接复用上游 `skill-codex.md`

`graphify` 自带的 [skill-codex.md](/Users/kuang/xiaobu/graphify/graphify/skill-codex.md) 已经能够完成完整图谱构建流程，但它的目标是：

- 让 agent 独立使用 `graphify`
- 构建通用图谱
- 回答图谱级 query/path/explain 问题

而 `spec-first` 需要的不是“照搬一个外部入口”，而是：

- 将 `graphify` 纳入 `spec-first` 的知识工作流
- 形成 `graphify -> spec-graph-bootstrap -> spec-docs` 的上游编排关系

因此这里不应再额外发明第二个消费型 skill，而应保留一个**以 spec-first 为中心的 graphify 入口**，再让 `spec-graph-bootstrap` 直接消费产物。

---

## 7. 详细执行流程

### 7.1 Phase 1：最小可用流程

`graphify` 在当前落地形态下的流程如下：

```text
1. 识别 target path（默认当前目录）
2. 检查 graphify 是否已安装；缺失时自动安装
3. 执行 graphify 图谱构建或更新
4. 生成 `graphify-out/GRAPH_REPORT.md`、`graph.json`、可选 `wiki/`
5. 输出结构摘要与下一步 handoff
6. 建议后续进入 spec-graph-bootstrap
```

> **当前状态（2026-04-08）**：`spec-first` 曾短暂收敛为单一 `graphify` 入口。Claude 使用 `spec-graphify`，Codex 使用 `graphify` skill。

### 7.2 命令行为

`graphify` 负责安装、构建、更新并输出 `graphify-out/`。后续是否进入 `spec-graph-bootstrap`，由用户或上层工作流决定。

### 7.3 输入与输出 contract

#### 输入

- 目标目录路径
- 目标目录下的代码、文档、图片、PDF 等原始资料

#### 中间输出

目标目录下应生成：

```text
<target>/
└── graphify-out/
    ├── GRAPH_REPORT.md
    ├── graph.json
    ├── graph.html
    ├── manifest.json          # 文件修改时间清单，graphify --update 增量构建的依据
    └── wiki/                  # 若使用 --wiki
```

> `manifest.json` 记录每个源文件的最后修改时间，可用于判断 `graphify-out/` 是否过期、是否需要重新构建。

### 7.4 失败与降级行为

| 场景 | 行为 |
|---|---|
| `graphify-out/` 不存在 | 先执行内置 `graphify` workflow |
| `GRAPH_REPORT.md` 缺失但 `graphify-out/` 存在 | 视为崩溃残留，重新执行内置 `graphify` workflow |
| 仅有 `GRAPH_REPORT.md` 缺少 `wiki/` | 继续执行，仅读 `GRAPH_REPORT.md` |
| `graph.json` 存在但 `GRAPH_REPORT.md` 缺失 | 视为异常状态，提示重新执行内置 `graphify` workflow |
| GRAPH_REPORT.md 缺少必需章节（如无 Communities） | 降级为全文阅读模式，手动提取 |

---

## 8. 与 `spec-graph-bootstrap` 的结合方式

### 8.1 第一阶段：松耦合

Phase 1 不修改 `spec-graph-bootstrap` 默认入口，只新增 `graphify`：

```text
用户 / agent
    ↓
graphify
    ↓
graphify-out
    ↓
spec-graph-bootstrap
```

这意味着：

- 用户可以显式先运行 `spec-graphify`（Claude）或 `graphify` skill（Codex）
- 再运行 `spec-graph-bootstrap`
- `spec-graph-bootstrap` 直接读取 `graphify-out/GRAPH_REPORT.md` 与可选 `wiki/` 获取结构先验

### 8.2 第二阶段：内联到 `spec-graph-bootstrap`

Phase 2 再考虑把这个逻辑并入 `spec-graph-bootstrap` 起始流程：

```text
spec-graph-bootstrap
  ├── 如果 <target>/graphify-out/ 已存在 → 优先读取
  ├── 如果 <target>/graphify-out/ 不存在且 graphify 可用 → 询问是否先构建
  └── 如果不可用 → 继续传统分析模式
```

> 注意：`graphify-out/` 的检查路径始终相对于 `spec-graph-bootstrap` 的 target path，而非当前工作目录。

这样可以实现：

- 有图谱时优先消费
- 没图谱时不强依赖
- 保持 `spec-graph-bootstrap` 的向后兼容

---

## 9. 与 `spec-docs` 的映射关系

`graphify` 不直接生成 `spec-docs`，但能显著辅助以下页面（比例为经验估算，待实际验证）：

| `spec-docs` 页面 | `graphify` 的帮助 |
|---|---|
| `contexts/summary.md` | 提供 god nodes、主社区、核心模块初稿（~70%） |
| `contexts/architecture/module-map.md` | 提供模块关系、社区边界、连接密度（~50%） |
| `contexts/architecture/overview.md` | 提供系统主流程与关键组件连接；**Hyperedges**（组关系，如"HTTP Request/Response Cycle"）天然适合辅助生成数据流和不变式描述（~30%） |
| `index.md` | 可辅助生成关键词/触发场景 |

而以下页面不应直接从 graphify 自动生成终稿：

| 页面 | 原因 |
|---|---|
| `contexts/conventions.md` | 属于规则层，需要治理判断 |
| `contexts/pitfalls/index.md` | 属于项目特有坑点，需要经验归纳 |
| `solutions/*` | 属于团队解题经验，不是结构抽取结果 |

因此要在方案中明确：

**graphify 负责“发现结构”，spec-first 负责“固化知识”。**

---

## 10. 对 skill 的详细设计

### 10.1 `skills/graphify/SKILL.md`

该文件应包含：

1. 技能触发条件
2. 何时使用
3. 目标路径解析规则
4. `graphify` 检查规则
5. 如何执行安装前检查
6. 如何构建或更新 `graphify-out/`
7. 如何输出结构摘要
8. 什么时候交给 `spec-graph-bootstrap`
9. 什么时候降级

### 10.2 推荐 frontmatter

```yaml
---
name: graphify
description: Use when you need to install graphify if missing, turn a directory into `graphify-out` knowledge graph artifacts, or refresh an existing graph before architecture analysis and bootstrap work.
---
```

### 10.3 references 文件

建议增加：

```text
skills/graphify/references/upstream-skill-codex.md
```

内容包括：

- graphify 的安装前检查
- 完整构图流程
- 增量更新流程
- query/path/explain 等延伸能力

### 10.4 scripts 是否需要

Phase 1 不需要脚本，skill 指令本身即可驱动消费逻辑。

Phase 2 若发现以下情况反复出现，再引入脚本：

- 目标路径解析反复重写
- `graphify` 可用性检测逻辑反复重写
- 对 `GRAPH_REPORT.md` 的摘要抽取逻辑需要稳定输出

可选脚本在当前阶段不是必需。

---

## 11. 对 `spec-first` 仓库的具体改动点

### 11.1 Phase 1 必需改动

仅需新增 skill 目录与 Claude 命令模板：

```text
skills/graphify/
└── SKILL.md
templates/claude/commands/spec/graphify.md
```

由于当前 `spec-first` 通过 `src/cli/plugin.js` 动态扫描 `skills/*` 并同步安装，因此：

- 不需要修改 `src/cli/plugin.js`
- 需要在 `.claude-plugin/plugin.json` 注册 `graphify`
- 需要新增 Claude 命令模板 `templates/claude/commands/spec/graphify.md`

相关依据：

- [src/cli/plugin.js](/Users/kuang/xiaobu/spec-first/src/cli/plugin.js)
- [src/cli/skills.js](/Users/kuang/xiaobu/spec-first/src/cli/skills.js)

### 11.2 Phase 2 建议改动

若要让 `spec-graph-bootstrap` 自动消费 graphify，可改动：

```text
skills/spec-graph-bootstrap/SKILL.md
```

增加一段前置逻辑：

1. 检查 `graphify-out/GRAPH_REPORT.md`
2. 若存在则优先读取
3. 若不存在且 `graphify` 可用，视目标大小询问是否先构建
4. 再进入原有 bootstrap 分析流程

### 11.3 Phase 3 可选改动

若要做一致性与漂移检测，可扩展：

```text
src/cli/commands/doctor.js
```

增加检查项：

- `graphify-out/` 是否存在
- 最近一次 graphify 构建时间
- `graphify-out` 是否落后于代码变更
- `spec-docs` 是否与 graphify 结构差异过大

Phase 3 不属于本次最小落地范围。

---

## 12. 分阶段实施计划

### Phase 1：最小集成

目标：

- 让 `spec-first` 拥有正式的 `graphify` 入口
- 能生成和更新 `graphify-out/`
- 能消费 `GRAPH_REPORT.md`
- 能把后续流程衔接到 `spec-graph-bootstrap`

交付物：

- `skills/graphify/SKILL.md`
- `skills/graphify/references/upstream-skill-codex.md`
- `templates/claude/commands/spec/graphify.md`
- 一份示例使用文档

### Phase 2：与 `spec-graph-bootstrap` 串联

目标：

- `spec-graph-bootstrap` 在启动时优先消费 graphify 产物
- 基于 graphify 初稿提升 `summary/module-map/overview` 的稳定性

交付物：

- `skills/spec-graph-bootstrap/SKILL.md` 增补 graphify 前置消费逻辑

### Phase 3：图谱漂移检测

目标：

- 用 `graph.json` 或 `GRAPH_REPORT.md` 作为结构对比基线
- 辅助 `doctor` 发现结构漂移
- 可利用 graphify skill 的自然语言交互能力（如"查询 X 模块的依赖"、"解释 A 到 B 的连接路径"）做定向结构查询，验证 spec-docs 中的模块关系描述是否仍与图谱一致

交付物：

- `doctor` 的 graphify 检查项
- 结构变化报告策略

---

## 13. 验证方案

### 13.1 Skill 安装验证

验证点：

1. `spec-first init` 后运行时能看到 `graphify`
2. skill 被同步到目标项目的 skills 目录
3. Codex / Claude 能正确触发 skill

### 13.2 graphify 命中验证

验证场景：

1. 目标项目已有 `graphify-out/`
2. 目标项目没有 `graphify-out/`，但已安装 `graphify`
3. 目标项目没有 `graphify-out/`，且未安装 `graphify`

期望：

- 场景 1：直接消费图谱
- 场景 2：在当前会话中执行内置 `graphify` workflow，构建完成后回到本 skill 继续处理
- 场景 3：明确降级并回退至 `spec-graph-bootstrap`

### 13.3 质量验证

验证输出的结构摘要是否至少覆盖：

1. 核心社区
2. 核心模块 / god nodes
3. 高连接区域
4. 推荐阅读顺序
5. 与 `spec-docs` 的映射建议

### 13.4 人工验收标准

满足以下条件即可验收：

1. agent 能在大型项目中先读结构再读源码
2. `spec-graph-bootstrap` 生成 `summary/module-map/overview` 时明显减少盲扫
3. 未安装 `graphify` 的项目仍可正常运行
4. `conventions/pitfalls/solutions` 未被错误自动化

---

## 14. 风险与应对

### 14.1 风险：graphify 结果带噪声

问题：

- 社区聚类和语义边可能并不总是准确

应对：

- `graphify` 只作为结构发现层，不直接成为长期真相层
- 写入 `spec-docs` 前仍需 `spec-graph-bootstrap` 做二次提炼

### 14.2 风险：graphify 未安装或依赖不齐

问题：

- 用户环境中可能没有 Python 或 graphify

应对：

- Phase 1 只做显式检测和清晰降级
- 不把 graphify 设成强依赖

### 14.3 风险：skill 过重

问题：

- 如果把 graphify 的全部用法都搬入 skill，会让 skill 过长、难维护

应对：

- skill 只保留 spec-first 集成所需最小流程
- 复杂 graphify 能力引用上游文档或 reference 文件

### 14.4 风险：边界混乱

问题：

- 团队可能把 graphify 输出误当成长期知识真相

应对：

- 在 skill 与方案文档中显式写明：
  - graphify 是结构发现层
  - spec-docs 是长期真相层

---

## 15. 最终推荐方案

本项目推荐按以下方式落地：

1. 新增 repo-owned skill：`graphify`
2. skill 负责安装与构图，不并入 Python 代码
3. Phase 1 先让 `graphify` 成为稳定入口
4. Phase 2 再把 graphify 前置消费逻辑并入 `spec-graph-bootstrap`
5. Phase 3 再考虑把 `graph.json` 接到 `doctor`

最终判断：

**graphify 值得接入，但应作为 `spec-first` 的上游结构编译器，而不是替代 `spec-docs`、也不是内嵌到 `spec-first` 内部的图谱子系统。**

---

## 16. 后续实施清单

### P0：文档与命名定稿

- 确认 skill 名称为 `graphify` ✅
- 确认 Phase 1 通过打包 graphify 运行时入口编排图谱构建，不并入 Python 代码 ✅

### P1：新增 skill ✅ 已完成

- `skills/graphify/SKILL.md` 已创建
- 运行时入口已收敛为单一 `graphify`

### P2：补 reference

- 新建 `skills/graphify/references/upstream-skill-codex.md`

### P3：串联 `spec-graph-bootstrap`

- 修改 `skills/spec-graph-bootstrap/SKILL.md`
- 增加 graphify 前置消费逻辑

### P4：验证

- 选一个大型仓库
- 对比”有 graphify”与”无 graphify”两种 bootstrap 输出质量
