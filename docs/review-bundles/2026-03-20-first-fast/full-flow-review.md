# First Skill 全流程最佳方案综合审查报告

> 审查日期：2026-03-20
> 审查范围：全流程各节点文档 + 两份优化方案 + 两份审查报告
> 审查方法：以终为始——从后续节点（Wave Agent、docs agent、runtime 校验）的实际消耗逆推每个上游决策的合理性
> 结论：**现有合同结构正确，Path X 已与当前实现和 live 文档对齐；Path Y 仍是需要正式审批的合同变更**

---

## 0. 审查基准

### 0.1 以终为始的分析维度

全流程的终态是：

1. `.spec-first/runtime/first/*.json` — 9 个 runtime JSON，机器可解析，字段完整
2. `docs/first/*.md` — 14 个 Markdown，中文，有证据标注
3. CLI 文件级校验通过：`spec-first first` 返回成功

逆推：任何增加 token 消耗而不直接服务于上述终态的步骤，都是可压缩的冗余。

### 0.2 已读文档列表

| 文档 | 角色 |
|------|------|
| `SKILL.md` | 全局契约入口，含 7 个全局必读 reference 约束 |
| `execution-flow.md` | 主线程执行流定义 |
| `subagent-architecture.md` | Wave 分组、前置条件、失败策略 |
| `evidence-pack-spec.md` | 证据包结构与最小必读层 |
| `main-thread-contract.md` | 主线程最小上下文约束 |
| `agent-output-schema.md` | Agent 输出格式标准 |
| `quality-assurance-rules.md` | QA 规则：证据标注、抽样验证 |
| `detection-rules.md` | 项目类型识别规范 |
| `optimization-plan-serena.md` | 方案 A：Serena 快路径（渐进优化） |
| `optimization-plan-v2-compatible.md` | 方案 B：V2 兼容优化（量化估算） |
| `optimization-plan-serena-review.md` | 方案 A 的审查报告 |
| `optimization-plan-v2-review.md` | 方案 B 的审查报告 |

---

## 1. 全流程现状诊断

### 1.1 实测基线

- 实测执行时间：**54 分 46 秒**（来源：`optimization-plan-v2-compatible.md`）
- 估算 token 消耗：**~200,000 tokens**（来源：V2 方案估算）
- `[待确认]` 频率：中等（来源：serena-review.md）

### 1.2 耗时分布（按节点）

| 节点 | 估算耗时 | 主要耗时来源 |
|------|---------|------------|
| 主线程加载 reference + 收集 evidence | ~5 分钟 | 全文读取 7 个 reference + glob/grep 扫描 |
| Wave 1（3 agents 并行） | ~10 分钟 | 每个 agent 重复读 reference + 代码全文扫描 |
| Wave 2（3 agents 并行） | ~12 分钟 | 同上，加上依赖分析 |
| Wave 3（1 agent） | ~3 分钟 | DB schema 分析 |
| Wave 4（3 agents 并行） | ~8 分钟 | Docs 生成，重复加载 reference |
| Wave 5（3 agents 并行） | ~10 分钟 | 同上 |
| 校验与收尾 | ~7 分钟 | CLI 校验 + 写盘确认 |

**瓶颈诊断**：
1. **重复读取**：13 个 subagent 每个都重新扫描代码，重叠证据收集约占总时间 60%
2. **全文代码读取**：glob/grep/Read 对大型代码库低效，无符号索引
3. **Reference 冗余加载**：docs agents 加载与其职责无关的 reference

### 1.3 从后续节点逆推的关键问题

#### 问题 A：`quality-assurance-rules.md` 对 docs agents 是否必要？

**终态要求**：docs agents 输出 `.md` 文件，需要：
- 证据标注格式（`quality-assurance-rules.md` §1）
- 抽样验证（`quality-assurance-rules.md` §2）
- 输出语言（`quality-assurance-rules.md` §0）

**结论**：docs agents **必须**加载 `quality-assurance-rules.md`，因为输出语言（中文规范）和证据标注格式直接影响终态质量门禁。

#### 问题 B：`execution-flow.md` 对每个 subagent 是否必要？

**终态要求**：subagent 只需产出自己的 runtime JSON 或 docs，不需要理解整个执行流。

**结论**：`execution-flow.md` 是**主线程合同**，描述 Skill 层如何调度 Wave。subagent 在自己的 wave 内执行，不需要理解整个执行流。**这是可优化点。**

#### 问题 C：`subagent-architecture.md` 对每个 subagent 是否必要？

**终态要求**：subagent 需要知道：
- 自己的输入边界（从 evidence pack 的哪个部分读）
- 自己的输出格式（写什么到哪里）
- 失败时怎么处理（标记 `[待确认]`）

**结论**：`subagent-architecture.md` 中的**输入/输出边界**部分对每个 subagent 是必要的，但**Wave 调度、前置条件**等章节只对主线程有用。**这是可拆分点。**

#### 问题 D：`main-thread-contract.md` 对每个 subagent 是否必要？

**终态要求**：subagent 不需要理解并发上限、重试规则等主线程调度逻辑。

**结论**：`main-thread-contract.md` 是**纯主线程契约**，subagent 完全不需要加载。**这是最大的冗余来源之一。**

---

## 2. 全局 reference 加载策略：核心矛盾

### 2.1 矛盾描述

**现有全局约束**（`SKILL.md` §Reference 读取规则）：
> 所有执行：必须加载 `execution-flow.md`、`subagent-architecture.md`、`detection-rules.md`、`quality-assurance-rules.md`、`main-thread-contract.md`、`evidence-pack-spec.md`、`agent-output-schema.md`（7 个文件）

**逆推分析**（见上节）：
- `execution-flow.md`：subagent 不需要
- `main-thread-contract.md`：subagent 不需要
- `subagent-architecture.md`：subagent 只需要边界部分
- 其余 4 个：subagent 确实需要

**矛盾**：现有约束"所有执行"包括所有 subagent，但逆推分析表明至少 2 个 reference 对 subagent 是纯冗余。

### 2.2 矛盾的影响量化

按每个 reference 约 ~1,000 tokens 估算：

| 场景 | 加载成本 | 冗余量 |
|------|---------|--------|
| 遵守现有约束（所有 subagent 加载 7 个） | 13 subagents × 7 = 91 次加载 | ~2 次纯冗余 × 13 = 26 次 |
| 按需分层（主线程 7 个，subagent 按职责） | 主线程 7 + subagent 平均 4 = 59 次 | 0 次冗余 |
| **差异** | **32 次加载** | **~32,000 tokens** |

### 2.3 正式决策建议

当前 Path X 已经选择“保留全局 7 个 reference、只优化 Serena 与共享证据包”的保守路径。
因此，下面这段“正式决策”只适用于 **Path Y**，不影响当前落地的 Path X。

**方案 X（保守，不改约束）**：
- 遵守现有全局约束，所有 13 个 subagent 加载 7 个 reference
- Token 节省：以当前 Path X 的 live 口径看，约 **17%**
- 执行时间节省：约 **60-65%**（主要来自 Serena 加速与共享证据包）
- 风险：零

**方案 Y（修改约束，分层加载）**：
- 修改 `SKILL.md` 的全局 reference 规则，拆分为：
  - 主线程：7 个（不变）
  - runtime subagent：`quality-assurance-rules.md` + `agent-output-schema.md` + `detection-rules.md` + 主题 reference（3-4 个）
  - docs subagent：`quality-assurance-rules.md` + `agent-output-schema.md` + `evidence-pack-spec.md`（3 个）
- Token 节省：约 **35-40%**
- 执行时间节省：约 **65-70%**
- 风险：需要更新 `SKILL.md` 和所有 agent 提示文件，影响面较大

**推荐**：先实施方案 X 验证 Serena 快路径的实际收益，再基于实测数据决定是否推进方案 Y。

---

## 3. 两份优化方案的综合评价

### 3.1 方案比较矩阵

| 维度 | 方案 A（Serena 快路径） | 方案 B（V2 兼容） | 综合判断 |
|------|----------------------|-----------------|---------|
| 合同遵守 | ✅ 明确保留所有约束 | ⚠️ 存在 3 处冲突 | 方案 A 更安全 |
| 执行时间估算 | 18-25 分钟（保守） | 14 分钟（激进，低估） | 方案 A 更准确 |
| Token 估算 | 125k-145k（但未考虑全局约束） | 85k（严重低估） | 两者均有偏差 |
| 量化可验证性 | ⚠️ 缺少固定测量协议 | ✅ 有具体数据 | 方案 B 更可操作 |
| 试点策略 | ✅ 渐进试点，风险低 | ⚠️ 全量修改，风险高 | 方案 A 更稳 |
| 降级策略 | ✅ 有 30 秒软阈值 | ✅ 有 glob/grep 降级 | 均可接受 |

### 3.2 方案 A 的剩余问题（已在 Path X 中收敛）

1. **`summary.json` 静态化风险**：已在当前 live 文档中改为主线程动态生成 `shared/summary.json`。
2. **降级阈值无操作定义**：已在当前 live 文档中明确 30 秒软阈值与 `serena_status` 状态写入。
3. **`[待确认]` 目标不可验证**：已在当前 live 文档中拆分为 A 类 / B 类。
4. **`SKILL.md` 改动边界模糊**：仅在 Path Y 中成立，不影响 Path X。

### 3.3 方案 B 的剩余问题（审查后）

1. **冲突 1（仅 Path Y）**（P0）：`shared/manifest.json` 与根目录 `manifest.json` 命名冲突，应改为 `shared/summary.json`。
2. **冲突 2**（P0）：`quality-assurance-rules.md` 不可由 subagent 跳过，违反全局约束。
3. **冲突 3**（P0）：docs agents 必须读取 evidence pack `shared/` 目录，不能只靠 runtime JSON。
4. **Token 估算严重低估**（P1）：遵守全局约束后节省比例从 57% 降至 17%，需更正。
5. **执行时间低估**（P2）：14 分钟应修正为 19-20 分钟。

---

## 4. 最佳方案：综合推荐

### 4.1 设计原则（以终为始）

1. **runtime JSON 是唯一终态**：所有设计决策以是否提升 runtime JSON 质量和生成速度为准。
2. **主线程职责极简化**：主线程只协调，不携带长证据。
3. **subagent 职责收敛**：每个 subagent 只加载与自己产出相关的约束。
4. **证据一次收集，多次消费**：主线程收集共享 evidence pack，subagent 只读 slice。
5. **Serena LSP 作为加速器，不作为依赖**：有 Serena 更快，无 Serena 不阻断。

### 4.2 推荐执行流（融合最优实践）

```
[主线程]
Step 0: 激活项目（Serena activate_project）
        ↓ 失败/超时(30秒) → 降级标记 evidence-pack/shared/context.json.serena_status = "unavailable"

Step 1: 加载主线程 contract（7 个全局 reference）
        主线程保留：wave 控制信息 + 契约摘要
        不保留：reference 原始正文

Step 2: 收集共享 evidence pack（主线程，一次性）
        Serena 可用：list_dir → find_symbol → get_symbols_overview → 按需 Read
        Serena 降级：Glob → Grep → Read
        输出：evidence-pack/shared/summary.json（动态生成，不手动维护）
              evidence-pack/shared/context.json（serena_status、项目类型、入口、配置）
        不输出：shared/manifest.json（与根目录冲突）

Step 3-7: 按 Wave 1-5 派发 subagent（遵守现有 wave/前置条件/并发上限）
          每个 subagent：
          - 加载 quality-assurance-rules.md + agent-output-schema.md + 主题 reference（必须）
          - 加载 detection-rules.md + evidence-pack-spec.md（必须）
          - 不加载 execution-flow.md + main-thread-contract.md（subagent 不需要）[待方案 Y 决策]
          - 读取 evidence-pack/shared/（不重复收集基础证据）
          - 使用 Serena 符号工具（可用时）替代 glob/grep/Read

Step 8: CLI 校验（runtime 结构 + docs 存在性）
```

> **注意**：Step 3-7 中"不加载 execution-flow.md + main-thread-contract.md"依赖方案 Y 的正式决策。
> 在方案 Y 决策前，应遵守现有全局约束（7 个 reference 全部加载）。

### 4.3 关键改动文件清单

| 文件 | 改动类型 | 内容 | 优先级 |
|------|---------|------|--------|
| `execution-flow.md` | 新增 Step 0 | Serena 激活 + 降级标记 | P0 |
| `execution-flow.md` | 修改 Step 1 | 收集共享 evidence，输出 `shared/summary.json` | P0 |
| `evidence-pack-spec.md` | 新增 §7 | `shared/summary.json` 动态生成规范 + 最小 schema | P0 |
| `evidence-pack-spec.md` | 修改 §2/§3 | 明确 subagent 读取 `shared/` 目录，不重复收集 | P0 |
| `SKILL.md` | 新增 Fast Path 段 | 插入 Reference 读取规则表之前，说明主线程激活顺序 | P1 |
| `subagent-architecture.md` | 新增说明 | Serena 可用时使用符号工具，降级时使用文件工具 | P1 |
| `agents-code-analysis.md` | 新增章节 | Serena 符号工具使用指引 | P1 |
| `agents-api-deps.md` | 新增章节 | 同上 | P1 |
| `agent-domain-model.md` | 新增章节 | 同上 | P1 |
| `agent-database.md` | 新增章节 | 同上 | P1 |
| `agent-guidelines-setup.md` | 新增章节 | 同上 | P1 |
| `SKILL.md` | 正式决策点 | 是否将"所有执行"的全局约束拆分为分层加载（方案 Y） | P2（需人工决策） |

### 4.4 预期效果（修正后，方案 X 基线）

| 指标 | 基线 | 方案 X（保守，不改全局约束） | 方案 Y（激进，分层加载） |
|------|------|--------------------------|----------------------|
| 执行时间 | ~55 分钟 | **19-22 分钟**（节省 60-65%） | **16-18 分钟**（节省 67-71%） |
| Token 消耗 | ~200,000 | **~165,000**（节省 17%） | **~120,000**（节省 40%） |
| `[待确认]` A 类（代码信息缺失） | 中等 | 减少 40-60%（Serena 提升符号覆盖） | 同左 |
| `[待确认]` B 类（规格不完整） | 中等 | 无变化（与 Serena 无关） | 无变化 |
| 合同破坏 | — | 无 | 需修改 SKILL.md 全局约束 |

---

## 5. 实施路线图

### Phase 1：主线程快路径（1-2 天，零合同风险）

**目标**：主线程用 Serena 收集共享 evidence pack，减少 subagent 重复收集。

**改动**：
- `execution-flow.md`：新增 Step 0（Serena 激活）+ 修改 Step 1（共享 evidence）
- `evidence-pack-spec.md`：新增 `shared/summary.json` 动态生成规范

**验证标准**：
- 主线程在 2 分钟内收集 evidence pack
- `shared/summary.json` 存在且路径可追溯到实际文件
- 降级时 `serena_status = "unavailable"` 被写入

### Phase 2：Agent 文件 Serena 指引（2-3 天，零合同风险）

**目标**：每个 runtime agent 优先使用 Serena 符号工具，降级时回退到文件工具。

**改动**：
- 5 个 `agents-*.md` 文件：新增 Serena 使用指引段落

**验证标准**：
- Wave 1 中 3 个 agent 均使用 Serena 符号工具
- 代码分析时间减少 50% 以上

### Phase 3：Wave 1 试点验收（1-2 天）

**目标**：测量 Phase 1+2 的实际效果，确认收益。

**测量指标**（固定协议）：
- 冷启动（含 Serena 首次激活）和热启动分开记录
- Token 口径：主线程 + 全部 subagent 总消耗
- 每组至少 3 次，取中位数
- 样本仓库：spec-first 本项目

**决策点**：如果 Phase 3 验收后执行时间已 ≤ 22 分钟，可暂停，等待 Phase 4 决策。

### Phase 4：全局约束分层决策（需项目负责人）

**目标**：基于实测数据决定是否推进方案 Y（修改 SKILL.md 全局约束）。

**决策依据**：
- Phase 3 实测：执行时间是否满足目标？
- Token 消耗：17% 节省是否够用？
- 团队风险承受：是否愿意修改全局约束文档？

**若推进方案 Y**：
- 修改 `SKILL.md`：全局 reference 规则拆分为主线程/runtime/docs 三层
- 更新所有 `agents-*.md`：明确各 agent 的 reference 加载清单
- 回归测试：确保所有 Wave 的质量不下降

---

## 6. 禁止操作清单

以下操作在任何情况下都不应执行：

- ❌ 删除 Wave 1-5 的编排模型
- ❌ 删除任何 subagent（13 个）
- ❌ 扁平化 `evidence-pack/` 目录结构
- ❌ 在 `shared/` 目录创建 `manifest.json`（与根目录冲突）
- ❌ 让 docs agents 跳过读取 evidence pack `shared/`
- ❌ 静态手动维护 `shared/summary.json`（必须由主线程动态生成）
- ❌ 在全局约束正式修改前，让任何 subagent 跳过 `quality-assurance-rules.md`
- ❌ 把 docs 当真源回灌主线程
- ❌ 在 Serena 降级后不记录 `serena_status`（会导致结果不可重现）
- ❌ 把性能预期写成不可验证的硬承诺

---

## 7. 结论

### 核心结论

1. **现有架构（wave + subagent + evidence-pack）是正确的**，不应重构，应优化。

2. **最大可压缩点是代码扫描效率**：从 glob/grep/Read 全文扫描切换到 Serena 符号索引，预期节省执行时间 60-65%，这是最高 ROI 的优化。

3. **全局 reference 加载策略是核心矛盾**，需要正式决策：
   - 不决策：接受 17% token 节省，执行时间节省 60-65%
   - 决策分层：额外获得 ~23% token 节省，但需修改全局约束

4. **两份优化方案互补**：
   - 方案 A（Serena）提供了正确的渐进策略和合同安全性
   - 方案 B（V2）提供了量化估算框架和具体改动文件清单
   - 综合使用，以方案 A 的渐进策略为主线，以方案 B 的量化框架为验证工具

5. **最紧迫的 P0 改动只有两处**：
   - `execution-flow.md` 新增 Serena 激活步骤
   - `evidence-pack-spec.md` 新增 `shared/summary.json` 动态生成规范

其余改动可按 Phase 分步落地，每步都可独立验收。

---

*本报告生成于 2026-03-20，基于当前版本的全部合同文档分析。*
*如 reference 文档发生变更，需重新验证本报告中引用的章节行号。*
