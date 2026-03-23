# First Skill 改造技术方案（终版）

> 版本：v1.0
> 日期：2026-03-20
> 依据：全流程合同文档审查 + 两份优化方案交叉验证
> 约束：不破坏现有 wave/subagent/evidence-pack 合同
> 目标：执行时间 55 分钟 → 19-22 分钟，token 消耗减少 17-40%

---

## 一、背景与问题定义

### 1.1 实测基线

| 指标 | 当前值 | 来源 |
| --- | --- | --- |
| 执行时间 | 54 分 46 秒 | 实测 |
| token 消耗 | ~200,000 | 估算 |
| `[待确认]` 频率 | 中等 | 观测 |

### 1.2 瓶颈根因（以终为始逆推）

全流程终态是 9 个 runtime JSON + 14 个 docs Markdown（其中 `database-er.md` 为条件性产物）+ CLI 文件级校验通过。
当前 Path X 已把共享摘要显式落到 `evidence-pack/shared/summary.json` 与 `evidence-pack/shared/context.json`。
任何不直接服务于终态的 token 消耗，都是可压缩的冗余。

逆推得到三个根因：

### 根因 1：代码扫描效率低

13 个 subagent 各自用 `Glob/Grep/Read` 全文扫描代码，无符号索引。
同一份代码被重复扫描 13 次，占总耗时约 60%。

### 根因 2：基础证据重复收集

每个 subagent 独立收集 Manifest、README、Entry、Config、Lockfile，
没有主线程统一收集后共享的机制。

### 根因 3：全局 reference 冗余加载

`SKILL.md` 要求"所有执行"加载 7 个 reference 文件（含 `execution-flow.md`、`main-thread-contract.md`）。
逆推分析表明这 2 个文件是纯主线程合同，subagent 不需要，构成 ~26,000 tokens 纯冗余。
此项是**需要正式决策的核心矛盾**，不应隐式绕过。

---

## 二、不变边界（硬约束）

以下内容在任何情况下都不得修改：

- Wave 1-5 的串行编排模型
- 13 个 subagent 的职责与产出定义
- `evidence-pack/manifest.json`、`shared/`、`runtime/`、`docs/` 目录结构
- 所有 20 个 reference 文件（只优化加载方式，不删除）
- runtime 是机器真源，docs 不得回灌为真源
- `database-er.md` 受 `databaseSchema.status` 约束
- 单波并发上限 3 个 agent

---

## 三、两条优化路径

### 路径 X：保守路径（零合同风险）

遵守现有全局约束，不修改 `SKILL.md` 的"所有执行加载 7 个 reference"规则。
仅通过 Serena LSP + 共享 evidence pack 优化代码扫描效率。

| 指标 | 基线 | 路径 X 目标 |
| --- | --- | --- |
| 执行时间 | ~55 分钟 | **19-22 分钟**（节省 60-65%） |
| token 消耗 | ~200,000 | **~165,000**（节省 17%） |
| 合同变更 | — | 无 |

### 路径 Y：激进路径（需正式决策）

在路径 X 基础上，修改 `SKILL.md` 全局约束，将 reference 加载拆分为三层。
此路径必须由项目负责人正式审批后才能实施。

| 指标 | 基线 | 路径 Y 目标 |
| --- | --- | --- |
| 执行时间 | ~55 分钟 | **16-18 分钟**（节省 67-71%） |
| token 消耗 | ~200,000 | **~120,000**（节省 40%） |
| 合同变更 | — | 修改 `SKILL.md` 全局约束 |

**推荐策略**：先完整实施路径 X，基于实测数据决定是否推进路径 Y。

---

## 四、改造执行流（路径 X）

### 4.1 新增主线程执行步骤

在现有 `execution-flow.md` 的 Step 0（load main-thread contract）之前，插入：

```text
Step -1: 激活项目（Serena LSP）

  1. 调用 mcp__serena__activate_project
  2. 若 30 秒内未收到成功响应 → 降级
     - 降级时写入 evidence-pack/shared/context.json:
      { "serena_status": "unavailable", "fallback": "glob-grep-read" }
     - 激活成功时写入 evidence-pack/shared/context.json:
      { "serena_status": "active" }
     - 降级后继续执行，不阻断流程
  3. 激活成功时读取项目 memory（architecture、project_overview、code_style）
     - 只读摘要，不保留完整正文
```

### 4.2 修改 Step 1（收集 evidence pack）

将"每个 subagent 各自收集"改为"主线程统一收集，subagent 只读 shared/"：

```text
Step 1: 收集共享 evidence pack（主线程，一次性）

  Serena 可用时：
    list_dir（递归 2 层）→ find_file（Manifest/README/Config）
    → find_symbol（Entry 入口）→ get_symbols_overview（关键文件）
    → 按需 Read（不全量读取源码）

  Serena 降级时：
    Glob → Grep → Read（现有方式，不变）

  输出到 evidence-pack/shared/：
    summary.json     ← 主线程动态生成，禁止手动维护
    context.json     ← serena_status、项目类型、入口路径、关键配置

  禁止输出：
    shared/manifest.json（与根目录 manifest.json 命名冲突）

  说明：
    shared/ 仅属于 Skill 层执行产物，CLI 不直接验收其内部内容
```

### 4.3 summary.json 字段契约（通用，跨项目）

以下定义的是**字段类型与语义契约**，不是当前仓库的具体取值。
所有字段均由主线程在 Step 1 探测后动态写入，禁止硬编码。

| 字段 | 类型 | 语义 | 允许值 / 说明 |
| --- | --- | --- | --- |
| `generated_at` | string | ISO 8601 时间戳，每次执行重新生成 | 如 `"2026-03-20T10:00:00Z"` |
| `serena_available` | boolean | 本次执行 Serena LSP 是否激活成功 | `true` \| `false`；降级时写 `false` |
| `project_type` | string | 主类型，来自 detection-rules.md §3 | `"backend"` \| `"frontend"` \| `"mobile"` \| `"cross-platform"` \| `"desktop"` \| `"monorepo"` \| `"mixed"` \| `"unknown"` |
| `subtypes` | string[] | 子类型，来自 detection-rules.md §4 | `["cli-tool"]` \| `["library"]` \| `["typescript"]` 等，允许空数组 |
| `root_manifest` | string \| null | 根 Manifest 文件的实际路径 | 不存在时写 `null` |
| `root_readme` | string \| null | 根 README 文件的实际路径 | 不存在时写 `null` |
| `entry_points` | string[] | 主启动入口的实际路径列表 | 路径必须存在；无法确定时写 `[]` 并在 `gaps` 中标记 |
| `key_configs` | string[] | 构建/类型/运行时配置文件的实际路径 | 路径必须存在；允许空数组 |
| `lockfile` | string \| null | 依赖锁文件的实际路径 | 不存在时写 `null` |
| `symbol_hints.main_symbols` | string[] | Serena 探测到的关键符号名（函数/类/入口） | `serena_available: false` 时写 `[]` |
| `symbol_hints.key_files` | string[] | 与主入口关联的关键源文件路径 | `serena_available: false` 时写 `[]` |
| `gaps` | string[] | 本次探测中无法确认的字段，需标记 `[待确认]` | 如 `["entry_points"]` |

**Serena 降级时的状态定义**：

- `serena_available` 写 `false`
- `symbol_hints.main_symbols` 和 `symbol_hints.key_files` 写空数组 `[]`
- `project_type`、`entry_points` 等仍通过 Glob/Grep/Read 探测填充，不因降级置为 `null`

**强制约束**：

- 所有路径字段必须是实际存在的路径，或写 `null` / `[]`；禁止填写推测性路径
- 写入后主线程校验 `entry_points` 非空时每个路径必须存在，不存在则移入 `gaps`
- subagent 只读此文件，不得修改

### 4.4 Subagent 代码分析方式变更

每个 runtime subagent 在自己的波次内，优先使用 Serena 符号工具：

```text
优先级顺序：
  1. find_symbol / get_symbols_overview  ← 符号索引，最快
  2. find_referencing_symbols             ← 引用链分析
  3. search_for_pattern                   ← 模式搜索
  4. Read（仅在前三步不足时）             ← 全文读取，最慢

禁止：
  - 无目的地 Read 整个目录下的所有文件
  - 用 Glob 枚举再逐一 Read（先符号索引，再按需 Read）

evidence-pack 消费规则：
  - 直接读取 shared/summary.json 和 shared/context.json
  - 不重新收集主线程已提供的基础证据
  - 需要补充证据时，只扩展到当前 wave 所需的最小 slice
```

---

## 五、路径 Y 的分层加载方案（待决策）

### 5.1 决策背景

逆推分析表明：

| Reference 文件 | 主线程需要 | runtime subagent 需要 | docs subagent 需要 | 理由 |
| --- | --- | --- | --- | --- |
| `execution-flow.md` | ✅ | ❌ | ❌ | 调度逻辑，subagent 在 wave 内执行，无需理解全局流 |
| `main-thread-contract.md` | ✅ | ❌ | ❌ | 纯主线程调度约束 |
| `subagent-architecture.md` | ✅ | ⚠️ 边界部分 | ⚠️ 边界部分 | subagent 需要输入/输出边界，不需要 wave 调度章节 |
| `quality-assurance-rules.md` | ✅ | ✅ | ✅ | 证据标注格式和输出语言规范，所有产出都需要 |
| `detection-rules.md` | ✅ | ✅ | ❌ | 类型识别只在 runtime 阶段需要 |
| `evidence-pack-spec.md` | ✅ | ✅ | ✅ | 读取 shared/ 的规范 |
| `agent-output-schema.md` | ✅ | ✅ | ✅ | 输出格式，所有 agent 都需要 |

### 5.2 分层加载规则（路径 Y 实施后）

**主线程**：加载全部 7 个（不变）

**runtime subagents（7 个）**：

- 必须加载：`quality-assurance-rules.md`、`detection-rules.md`、`evidence-pack-spec.md`、`agent-output-schema.md`
- 必须加载：主题 reference（按 SKILL.md §Reference 读取规则的"按需加载"列）
- 不加载：`execution-flow.md`、`main-thread-contract.md`

**docs subagents（6 个）**：

- 必须加载：`quality-assurance-rules.md`、`evidence-pack-spec.md`、`agent-output-schema.md`
- 不加载：`execution-flow.md`、`main-thread-contract.md`、`detection-rules.md`
- 必须读取：`evidence-pack/shared/`（项目基本信息，不能只靠 runtime JSON）

### 5.3 路径 Y 修改文件清单

| 文件 | 改动内容 |
| --- | --- |
| `SKILL.md` | 将"所有执行"拆分为主线程/runtime/docs 三层加载规则 |
| `subagent-architecture.md` | 每个 subagent 新增"必须加载/不加载 reference"说明 |
| `agents-code-analysis.md` | 明确不加载 `execution-flow.md`、`main-thread-contract.md` |
| `agents-api-deps.md` | 同上 |
| `agent-domain-model.md` | 同上 |
| `agent-database.md` | 同上 |
| `agent-guidelines-setup.md` | 同上 |

---

## 六、实施路线图

### Phase 1：主线程快路径（1-2 天）

**改动文件**：

- `execution-flow.md`：新增 Step -1（Serena 激活 + 降级标记）
- `execution-flow.md`：修改 Step 1（共享 evidence pack 收集）
- `evidence-pack-spec.md`：新增 §7（`shared/summary.json` 动态生成规范）
- `evidence-pack-spec.md`：修改 §2/§3（subagent 消费 `shared/` 说明）

**验收标准**：

- 主线程在 2 分钟内完成 evidence pack 收集
- `shared/summary.json` 存在，所有路径字段均可追溯到实际文件
- Serena 降级时 `context.json.serena_status = "unavailable"` 被写入
- 降级后流程正常完成，不阻断

> 注：以上验收主要由 Skill 层执行日志与共享文件确认，CLI 只负责最终 runtime/docs 文件的结构与存在性校验。

**回退条件**：若 Phase 1 完成后 `[待确认]` 数量增加或质量下降，恢复到原 Step 1。

### Phase 2：Subagent Serena 指引（2-3 天）

**改动文件**：

- `agents-code-analysis.md`：新增 Serena 工具优先级章节
- `agents-api-deps.md`：同上
- `agent-domain-model.md`：同上
- `agent-database.md`：同上
- `agent-guidelines-setup.md`：同上
- `subagent-architecture.md`：新增"代码分析工具选择"说明

**验收标准**：

- Wave 1 的 3 个 agent 均使用 Serena 符号工具（通过执行日志与 context.json 的 Serena 状态共同确认）
- 代码分析阶段耗时减少 ≥ 50%

**回退条件**：若某个 agent 因 Serena 工具结果不完整而产出更多 `[待确认]`，该 agent 回退到文件工具。

### Phase 3：端到端全流程验收（1-2 天）

**验收对象**：完整的 `spec-first first` 端到端执行，不限于 Wave 1。

**测量协议**（固定，不可变）：

- 样本仓库：spec-first 本项目，固定分支和变更集
- 冷启动：含 Serena 首次激活 + 符号索引建立
- 热启动：复用已存在的 Serena 项目状态
- token 口径：主线程 + 全部 subagent 总消耗
- 每组执行 3 次，取中位数
- 对比维度：执行时间、token 消耗、`[待确认]` 数量（A 类/B 类分别统计）

**`[待确认]` 分类**：

- A 类：代码信息缺失导致（Serena 优化可改善）
- B 类：规格文档不完整导致（Serena 无法改善，单独追踪）

**路径 X 达标判定（必须同时满足）**：

- 执行时间 ≤ 22 分钟（中位数）
- token 消耗 ≤ 170,000（中位数）
- `[待确认]` A 类数量相比基线减少，B 类不增加
- CLI 文件级校验通过，runtime JSON 完整，docs Markdown 存在

**决策点**：上述 4 条全部满足，路径 X 目标达成，可暂停，等待路径 Y 决策。
任一条不满足，进入 Phase 4 触发条件评估。

### Phase 4：路径 Y 决策与实施（需项目负责人，3-5 天）

**触发条件**（满足任一）：

- Phase 3 实测执行时间 > 22 分钟
- token 消耗 > 170,000（节省不足 15%）
- 团队明确需要进一步降低成本

**决策输入**：

- Phase 3 实测数据（执行时间、token、质量）
- 路径 Y 的改动影响面（7 个文件，全局约束变更）
- 团队对"修改 SKILL.md 全局约束"的风险承受

**若批准，回归验收**：

- 所有 Wave（1-5）完整执行，确认质量不下降
- CLI 文件级校验通过
- `[待确认]` A 类数量不增加

---

## 七、关键文件改动详情

### 7.1 `execution-flow.md` 变更（Phase 1）

在"### 0. load main-thread contract"之前插入新节：

```markdown
### -1. 激活项目（Serena LSP）

- 调用 `mcp__serena__activate_project`
- 超时阈值：从调用发起计时，30 秒内未收到成功响应则降级
- 降级时：写入 `evidence-pack/shared/context.json` 的 `serena_status: "unavailable"`
- 激活成功时：读取项目 memory（architecture、project_overview），只保留摘要
- 此步骤失败不阻断后续流程，降级后按 Glob/Grep/Read 方式继续
```

Step 1 修改：

```markdown
### 1. collect evidence pack（主线程，一次性）

- 主线程统一收集，结果写入 evidence-pack/shared/，所有 subagent 共享
- Serena 可用：list_dir → find_file → find_symbol → get_symbols_overview → 按需 Read
- Serena 降级：Glob → Grep → Read（原有方式）
- 输出：shared/summary.json（动态生成）、shared/context.json
- 禁止输出：shared/manifest.json（与根目录 manifest.json 冲突）
- Subagent 在自己的 wave 内直接读取 shared/，不重复收集基础证据
- shared/ 仅属于 Skill 层运行产物，不由 `spec-first first` CLI 自动验收
```

### 7.2 `evidence-pack-spec.md` 新增 §7（Phase 1）

```markdown
## 7. shared/summary.json 规范

### 7.1 生成方式

- 由主线程在 Step 1 完成后动态生成
- 禁止手动维护或静态预设路径
- 每次执行重新生成，不复用历史快照

### 7.2 写入后校验

- 主线程必须校验 entry_points 中的路径实际存在
- 路径不存在时，该字段标记 [待确认]，不得写入不存在的路径
- 校验失败不阻断流程，但必须在 context.json 中记录

### 7.3 subagent 消费规则

- subagent 只读 shared/，不得修改
- subagent 读取 shared/ 后，不再重复收集 summary.json 中已提供的基础证据
- 若 shared/ 信息不足，可在自己的 wave slice 中补充，但不得回写 shared/
- shared/ 的完整性由执行日志与人工审查确认，不作为 CLI 结构校验输入
```

### 7.3 agents-*.md 新增 Serena 章节（Phase 2，5 个文件相同结构）

```markdown
## 代码分析工具选择

优先使用 Serena 符号工具（Serena MCP 可用时）：

1. `find_symbol` / `get_symbols_overview` — 符号索引，定位类/函数/入口
2. `find_referencing_symbols` — 引用链，分析调用关系
3. `search_for_pattern` — 模式搜索，查找特定字符串或结构
4. `Read` — 全文读取，仅在前三步信息不足时使用

Serena 不可用时，回退到文件工具：

- `Glob` → `Grep` → `Read`

读取 shared/summary.json 中的 symbol_hints，作为符号分析的起点，
减少从零探索的成本。
```

---

## 八、禁止操作清单

| 操作 | 原因 |
| --- | --- |
| 删除 Wave 1-5 编排模型 | 核心合同，不可修改 |
| 删除任何 subagent | 产出定义是合同一部分 |
| 扁平化 evidence-pack/ 目录 | 破坏 manifest/shared/runtime/docs 结构 |
| 创建 shared/manifest.json | 与根目录 manifest.json 命名冲突 |
| 静态手动维护 shared/summary.json | 会静默失效，必须动态生成 |
| docs agents 跳过读取 shared/ | 违反 subagent-architecture.md §docs agents 输入约束 |
| 在路径 Y 批准前跳过 quality-assurance-rules.md | 违反 SKILL.md 全局约束 |
| docs 回灌为真源 | 核心硬约束 |
| Serena 降级后不写 serena_status | 导致结果不可重现，无法区分冷热启动 |
| 将性能目标写成硬承诺 | 实际效果取决于仓库大小和 Serena 状态 |

---

## 九、预期收益汇总

### 路径 X（Phase 1-3，零合同风险）

| 指标 | 基线 | 目标范围 | 主要来源 |
| --- | --- | --- | --- |
| 执行时间 | ~55 分钟 | 19-22 分钟 | Serena 符号工具替代全文扫描 |
| token 消耗 | ~200,000 | ~165,000 | 共享 evidence pack 减少重复收集 |
| `[待确认]` A 类 | 中等 | 减少 40-60% | Serena 提升符号覆盖精度 |
| `[待确认]` B 类 | 中等 | 无变化 | 与代码分析工具无关 |

### 路径 Y（Phase 4，需批准）

| 指标 | 路径 X 结果 | 路径 Y 目标 | 额外收益 |
| --- | --- | --- | --- |
| 执行时间 | 19-22 分钟 | 16-18 分钟 | 再省 2-4 分钟 |
| token 消耗 | ~165,000 | ~120,000 | 再省 ~45,000 tokens |

---

## 十、测量协议（固定，不可变）

每次验收必须按此协议执行，不得自定义口径：

```text
样本：spec-first 本项目，固定 commit，固定入口命令
测量次数：每组 3 次，取中位数
冷启动：完整流程含 Serena 首次激活
热启动：Serena 已激活，项目状态已缓存
token 口径：主线程 + 全部 subagent 的总输入 + 输出 token
时间口径：从 spec-first first 命令发起到 CLI 校验完成
[待确认] 口径：A 类（代码信息缺失）和 B 类（规格不完整）分别统计
对比基线：本文 §1.1 的实测值
```

---

*本文档为终版改造方案，优先级高于此前的 optimization-plan-serena.md 和 optimization-plan-v2-compatible.md。*
*如需修改本文档，必须同步更新 execution-flow.md 中引用的步骤编号。*
