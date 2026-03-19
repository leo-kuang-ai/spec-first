# Spec-First Skill 节点冗余与合并建议

> 分析日期: 2026-03-19  
> 分析范围: `skills/spec-first/*/SKILL.md`、`skills/spec-first/README.md`、`skills/spec-first/SHARED.md`

## 结论先行

1. 当前 `spec-first` 一共有 **20 个 skill 节点**，没有发现“完全同义、完全重复”的双胞胎节点。
2. 真正重复的主要不是“节点职责”，而是 **模板骨架**：`Feature 定位规则`、`执行阶段`、`输出路径`、`确认策略`、`成功标准` 这些段落在多个 skill 中反复出现。
3. 若以“缩减节点数”为目标，**最明确的合并候选**是：
   - `08-review` + `20-spec-review`
   - `11-plan` + `13-orchestrate`
4. 若以“减少认知负担”为目标，**更优先的动作不是删节点，而是抽公共底座**：
   - 统一 `featureId` 解析 / `.spec-first/current` 定位逻辑
   - 统一 `findings.md` 计划/证据写盘结构
   - 统一背景质量与风险字段契约
   - 统一“状态快照”类输出格式
5. `00-first`、`00-onboarding`、`01-init`、`15-doctor`、`17-feature` 这几个节点 **不建议合并**，它们虽然都在入口/治理层，但面向的用户意图不同。

## 分析依据

本次判断主要基于三层信息：

1. 目录分层：`skills/spec-first/README.md` 中把 skill 明确分成项目认知、核心工作流、编排与验证、会话管理、Feature 管理、扩展六类。
2. 公共约束：`skills/spec-first/SHARED.md` 已经把 skill 分成产物生成型、只读诊断型、路由控制型、宿主修复型，但各节点仍保留了大量重复骨架。
3. 具体实现：逐个对照各 `SKILL.md` 的 `name / description / 触发条件 / 执行阶段 / 输出路径 / 确认策略 / 成功标准`，看职责是否真的重叠。

## 重复热区

下面这些不是“语义重复”，但它们是 **代码级重复**，说明当前 skill 文档仍然很依赖复制粘贴。

| 重复项 | 出现范围 | 含义 |
|---|---:|---|
| `Feature 定位规则` | 11 个节点 | 说明 feature 解析逻辑已经是共用能力，应该抽成共享块，而不是每个 skill 再写一遍 |
| `执行阶段` | 15 个节点 | 说明很多 skill 都在描述同一类生命周期 runner，适合抽“阶段执行骨架” |
| `输出路径` | 16 个节点 | 说明结果落盘模式高度统一，适合做路径/产物模板化 |
| `确认策略` | 16 个节点 | 说明 confirm policy 已经是平台级概念，不该继续在每个 skill 里各自定义语义 |
| `成功标准` | 20 个节点 | 这是正常的统一收尾结构，不代表冗余，但说明文档还没有形成更细粒度的成功标准复用层 |
| `When to Use` | 7 个节点 | 多数出现在治理/入口类 skill，说明这类节点的“触发判断”可进一步抽象 |
| `背景质量` | 9 个节点 | 背景质量契约已经是跨 skill 公共语义，应继续收敛到共享 contract，而不是散落在单个 skill 里 |

结论：当前更明显的是 **模板冗余**，不是 **节点冗余**。

## 节点级合并建议

### 1. `08-review` + `20-spec-review`

**建议级别**：高，可合并

**原因**

- 两者都是“审查”节点。
- 都依赖自动 Feature 定位、都要输出审查结果、都需要人工确认。
- 当前差异主要是检查清单来源不同：
  - `08-review` 面向代码变更，强调合规审查 + 质量审查。
  - `20-spec-review` 面向 `spec.md`，强调规格质量与 C10。

**怎么合并**

- 保留一个统一的 `review` 节点。
- 通过 `mode=code|spec` 或 `--kind code|spec` 区分审查对象。
- checklist、输出路径、评分方式保留 mode 分支，不要硬混成一套。

**风险**

- 如果不做 mode 隔离，spec 审查的质量分与 code 审查的 two-stage review 会互相污染。

### 2. `11-plan` + `13-orchestrate`

**建议级别**：中，高度相邻，可考虑合并

**原因**

- `11-plan` 的职责是给出下一步、风险、阻塞项和建议命令。
- `13-orchestrate` 的职责是根据当前状态选择下一步动作，并推进 `plan -> skill -> verify -> advance`。
- 两者都读 `findings.md`、都依赖 feature 定位、都对“下一步”负责。

**怎么合并**

- 让 `orchestrate` 支持 `--plan-only` 或 `--dry-run`。
- `plan` 可以退化为 `orchestrate` 的一个模式，而不是独立的一级节点。

**风险**

- `plan` 现在承担的是低成本决策入口，如果直接删掉，用户会失去一个“只看计划、不推进阶段”的轻量入口。
- 所以这类合并应以 **减少节点数** 为目标，而不是以 **消灭 plan 能力** 为目标。

### 3. `16-sync` + `21-analyze`

**建议级别**：中，可做能力合并，不建议直接硬删

**原因**

- 两者都要读 `spec / design / task_plan / matrix` 这一组核心产物。
- 两者都要识别 orphan、缺口、状态不同步等问题。
- 区别在于：
  - `21-analyze` 是只读一致性分析。
  - `16-sync` 是基于分析结果做回填和审计落盘。

**怎么合并**

- 最合理的做法不是“删一个”，而是建立一个统一的分析核心：
  - `analyze` 负责发现问题
  - `sync` 负责应用修正
- 如果要减少节点，可以把 `sync` 变成 `analyze --apply` 或 `analyze --sync` 模式。

**风险**

- `sync` 一旦被完全并入 `analyze`，很容易把只读分析和写回操作混在一起，增加误操作风险。

## 应升级而不是合并的节点

### `14-status`

**现状**

- 当前 `status` 不只是状态快照，还承担了风险识别、健康分解释、TDD 状态展示和下一步建议。

**问题**

- 它已经部分侵入 `21-analyze` 的一致性分析职责。
- 也与 `02-catchup` 的恢复报告产生内容重叠。

**建议升级**

- `status` 应该回到“当前状态快照”定位：
  - 阶段
  - 覆盖率
  - 健康分
  - 任务进度
  - 下一步建议
- 更深的冲突分析交给 `analyze`。
- 断点恢复交给 `catchup`。

### `21-analyze`

**现状**

- `analyze` 是最适合做“跨产物一致性分析”的节点，但现在它还没有成为其他节点可消费的统一问题模型源。

**建议升级**

- 让 `analyze` 输出更稳定的机器可读问题结构：
  - 严重度
  - 位置
  - 证据
  - 建议动作
  - 是否需要回写到 matrix / findings
- 这样 `sync`、`verify`、`status` 都可以复用同一套问题模型，而不是各自再做一次判断。

### `15-doctor`

**现状**

- `doctor` 负责宿主配置、MCP、skills、runtime/docs 健康检查。

**问题**

- 它和 `status` / `analyze` 在 runtime/docs 健康上存在概念重叠。
- 其中 `runtime/docs` 的健康更偏项目态，`MCP/skills/config` 更偏宿主态。

**建议升级**

- 把 `doctor` 明确收缩为 **宿主修复型**：
  - Node / Git / 配置 / MCP / skills / hook
- `runtime/docs` 健康建议更多交给 `status` 与 `analyze`。

### `02-catchup`

**现状**

- `catchup` 是会话恢复节点，内容比 `status` 更重，包含恢复报告、5-question reboot test 和信息缺口标记。

**建议升级**

- 不合并，但要复用 `status` / `analyze` 的快照底座。
- 让 `catchup` 保持“恢复上下文”的唯一职责，不要再长出新的分析口径。

### `17-feature`

**现状**

- 它是 `.spec-first/current` 的读写入口，不是普通展示命令。

**建议升级**

- 保留为共享基础设施。
- 将“自动定位 / current pointer / switch 回退”这套逻辑从其他 skill 里抽掉，统一由 `feature` + 共享 helper 解决。

## 不建议合并的节点

这些节点虽然看起来接近，但职责边界是真实存在的，不建议为了缩减数量硬合并：

- `00-first`：项目认知真源生成与投影，不是 onboarding。
- `00-onboarding`：新手学习路径生成，是面向用户教育的导览层。
- `01-init`：项目/Feature 初始化路由，不是认知生成器。
- `03-spec`、`04-design`、`05-research`、`06-task`、`07-code`、`12-verify`、`10-archive`：这些是真正的阶段边界 skill，职责各自独立。
- `11-plan` 与 `13-orchestrate`：有重叠，但如果直接合并，容易把“轻量计划”入口吞掉。

## 推荐的优化顺序

### P0: 先抽公共底座

- 抽 `featureId` 解析与 `.spec-first/current` 定位逻辑。
- 抽 `findings.md` 写盘骨架。
- 抽 `背景质量 / 风险 / 健康分` 的共享字段契约。

### P1: 再处理 review 家族

- 优先评估 `08-review` + `20-spec-review` 是否并入统一 `review` 节点。

### P2: 再处理 plan / orchestrate

- 如果要继续瘦身，再讨论 `11-plan` 是否并入 `13-orchestrate` 的 `plan-only` 模式。

### P3: 最后决定 sync / analyze

- 如果平台愿意引入“读写分离的分析核心”，再考虑把 `16-sync` 收到 `21-analyze` 的模式体系里。

## 最终判断

`spec-first` 目前的问题不是“节点太多所以冗余”，而是“共享语义已经出现，但还没有充分抽成共享底座”。

因此更准确的结论是：

- **节点级**：只有少数可合并，最明确的是 review 家族；plan/orchestrate 属于可选合并。
- **能力级**：status / analyze / sync / doctor / catchup / feature 这些节点应该继续拆开，但共享同一套基础数据契约。
- **模板级**：Feature 定位、执行阶段、输出路径、确认策略等重复项应该优先抽公共层。

如果目标是降低维护成本，推荐先做 **共享底座抽取**，再决定是否真的删节点。
