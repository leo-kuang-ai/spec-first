# Trellis 借鉴实施指南（v2.5）

> 版本: v2.5
> 更新日期: 2026-03-01
> 审查状态: 已完成多 Agent 交叉审查（架构 / 代码 / 安全）
> 目标: 基于 Trellis 优势，按”补短板优先、与现有实现融合”的原则，系统增强 spec-first。
> 适用范围: spec-first 主仓（TypeScript 主栈）

---

## 0. 分析范围与方法

本次指南不是“从零重写”，而是对 v1 做校准升级：

1. 对照 Trellis 分析报告（命令、Skill、Hook、升级机制）。
2. 对照 spec-first 当前源码实态，识别“已实现能力/真实缺口”。
3. 输出优先级明确、可执行、可验收、可回滚的落地方案。

核心证据来源（本仓关键代码）：
- `src/cli/commands/update.ts`
- `src/core/ai-orchestrator/context-pack.ts`
- `src/core/skill-runtime/hard-gate.ts`
- `src/core/tool-integration/ai-runtime-hook.ts`
- `src/core/tool-integration/session-hook.ts`
- `src/core/process-engine/advance.ts`
- `src/core/tool-integration/context-sync.ts`
- `src/shared/host-paths.ts`
- `src/shared/host-bootstrap.ts`
- `src/shared/skill-commands.ts`

来自《Trellis-借鉴深度分析与实施方案.md》的有效补充（已吸收）：
- Trellis 更新分析模型：`newFiles / unchangedFiles / autoUpdateFiles / changedFiles / protectedPaths`
- Trellis 中央注册表派生规则：`AI_TOOLS -> PLATFORM_IDS -> CONFIG_DIRS -> ALL_MANAGED_DIRS`
- Trellis 迁移清单元数据：`breaking / migrationGuide / aiInstructions`

---

## 1. 结论先行

### 1.1 对旧版借鉴指南（v1）的判断

结论：**方向合理，但准确性不足，优先级需要重排**。

- 合理点：
  - 强调上下文治理、质量门禁、需求质量控制，方向正确。
- 主要问题：
  - 把部分“已实现能力”误判为“未实现”。
  - 使用了与现状不一致的路径模型（如 `.spec-first/features/...`）。
  - 优先级偏向“新增机制”，未优先处理最关键短板（升级安全与可回滚）。

### 1.2 spec-first 最值得借鉴的 Top 5（按优先级）

1. **P0: 更新引擎鲁棒性（版本语义 + 哈希分级 + 迁移清单 + 备份回滚）**
2. **P0: 迁移冲突分类与 dry-run 契约（`auto/confirm/conflict/skip`）**
3. **P0: 声明式上下文阶段覆盖闭环（`00_init`~`09_cancelled`）**
4. **P0: HostRegistry 单一真理源（含 `collectTemplates`）**
5. **P1: JSONL 声明式上下文桥接（桥接现有 context-pack，不替换）**

---

## 2. 旧指南合理性与准确性审查

## 2.1 逐条校准（合理/偏差/修正）

| 主题 | v1 判断 | 现状核对 | 结论 | 修正策略 |
|---|---|---|---|---|
| 上下文管理 | “仅 CLAUDE.md/SKILL.md 静态注入” | 已有 `context-pack`（分层/预算/摘要+细节）+ `task context hook` | 偏差 | 改为“已有动态上下文基线，缺声明式编排层” |
| 任务级上下文 | “无任务级上下文配置” | 已有 `buildTaskContextPack` 与 Hook 注入脚本体系 | 偏差 | 改为“有运行时任务上下文，缺 JSONL 可配置入口” |
| 质量门禁 | “无强制完成验证” | 已有 `hard-gate`、`gate-engine`、`advance` 校验 | 部分偏差 | 改为“阶段门禁已存在，Stop 完成门禁仍可补强” |
| 会话历史 | “无持久化日志” | 已有 `findings.md`、`gate-history.jsonl`、`ai-stats.jsonl` | 偏差 | 改为“有基础日志，缺统一 journal/index 视图” |
| 目录模型 | `.spec-first/features/{id}` | 当前主模型为 `specs/{featureId}` + `.spec-first/current` | 偏差 | 全文统一为现状路径 |
| 多宿主治理 | 建议统一平台抽象 | 当前 `host-paths` + `host-bootstrap` + `skill-commands` 分散 | 合理 | 推进 HostRegistry 收敛 |
| update 升级治理 | 仅“刷新 skills/mcp/hooks” | 缺模板哈希、迁移 manifest、更新前快照回滚 | 准确 | 提升为首要 P0 |

## 2.2 校准后的现实画像

spec-first 当前不是“能力缺失”，而是“**已有流程治理基础，缺工程升级治理与声明式扩展层**”。

---

## 3. 借鉴优先级（按补短板价值排序）

## 3.1 优先级清单（经多 Agent 审查校准）

### P0（必须先做）

1. 更新引擎鲁棒性（版本语义 + 模板哈希分级 + 迁移 manifest + 备份回滚）
2. 迁移冲突分类与 dry-run 报告契约（`auto/confirm/conflict/skip`）
3. 声明式上下文阶段覆盖闭环（`00_init`~`09_cancelled`）
4. HostRegistry 单一真理源（含 `collectTemplates`）

### P1（高价值，紧随 P0）

1. JSONL 声明式上下文桥接（覆盖层，对接 context-pack）
2. Plan Reject Guard（需求拒绝机制）
3. Workspace Journal 索引增强
4. Stop 终止门禁增强（已有基础实现 `stop-guard.sh`，增强审计深度）

### P2（按需推进）

1. Worktree 流水线命令化增强
2. 多平台模板深度同构扩展

### 3.2 优先级调整说明

| 原优先级 | 调整后 | 项目 | 调整原因 |
|---------|--------|------|----------|
| P0-3 | **P1-4** | Stop Gate | 已有 `stop-guard.sh` 基础实现，降级为增强 |
| P1-1 | **P0-2** | HostRegistry | 架构短板，影响可维护性，升级为 P0 |

## 3.3 为什么是这个顺序

- P0 直接降低事故概率与返工成本（更新覆盖、上下文漂移、假完成）。
- P1 主要提升长期可维护性与协作稳定性。
- P2 是规模化优化，不应抢占 P0/P1 资源。

---

## 4. 融合设计原则（取长补短，不照搬）

1. **Extend，不 Replace**
- 不替换现有阶段机、GateEngine、追踪矩阵。
- 在既有入口上增量扩展。

2. **机制借鉴，不迁移主栈**
- 借 Trellis 的治理机制，不迁移到 Python 主栈。

3. **声明式单路径**
- 新增 JSONL/Manifest 声明层，按阶段直接替换静态映射，不保留运行时兜底分支。

4. **默认安全**
- 升级前备份、冲突可见、失败可回滚。

---

## 5. 与当前实现的融合方案（逐项）

## 5.1 P0-1 更新引擎鲁棒性

### 现有基线
- `update.ts` 目前侧重 skills/MCP/hooks 刷新，不管理模板变更冲突与迁移编排。

### 借鉴目标（来自 Trellis）
- 版本语义门禁：`CLI version vs project version` + `allow-downgrade` 策略
- 迁移元数据聚合：`changelog / breaking / migrationGuide / aiInstructions`
- 模板哈希分类：`new / unchanged / auto-update / user-modified`
- 变更分析分区：`newFiles / unchangedFiles / autoUpdateFiles / changedFiles / protectedPaths`
- 迁移清单：`rename / rename-dir / delete`
- 迁移冲突分类：`auto / confirm / conflict / skip`
- 更新前快照：托管目录备份 + 失败回滚

### spec-first 落地
- 扩展/新增模块：
  - `src/core/update-engine/version.ts`
  - `src/core/update-engine/metadata.ts`
  - `src/core/update-engine/hash.ts`
  - `src/core/update-engine/migration-list.ts`（遵循 kebab-case.ts 命名规范）
  - `src/core/update-engine/backup.ts`
  - `src/core/update-engine/apply.ts`
  - `src/cli/commands/update.ts`（接入引擎）
- 备份策略约束：
  - 目录：`.spec-first/backups/backup-YYYYMMDD-HHMMSS/`
  - 权限：`0700`
  - 排除：`specs/`、`tasks/`、`node_modules/`、`.git/` 等用户与大体量目录

### 验收标准
- 升级前会输出 `cliVersion/projectVersion` 对比与降级判定。
- `--dry-run` 会输出 breaking 变更摘要与迁移指南提示。
- 用户改动文件不会被静默覆盖。
- `--dry-run` 可展示 `auto/confirm/conflict/skip` 分类与逐项迁移计划。
- 失败后可一键回滚到更新前快照。

---

## 5.2 P1-1 JSONL 声明式上下文桥接

### 现有基线
- `context-pack.ts` 已具备阶段分层、摘要/细节、预算控制。
- `ai-runtime-hook.ts` 已有 PreToolUse 注入链路。

### 借鉴目标
- 让“阶段/任务上下文来源”从硬编码映射扩展为可声明配置。

### spec-first 落地
- 约定新目录（保持现有 `specs/{featureId}` 模型）：
  - `specs/{featureId}/contexts/00_init.jsonl`
  - `specs/{featureId}/contexts/01_specify.jsonl`
  - `specs/{featureId}/contexts/02_design.jsonl`
  - `specs/{featureId}/contexts/03_plan.jsonl`
  - `specs/{featureId}/contexts/04_implement.jsonl`
  - `specs/{featureId}/contexts/05_verify.jsonl`
  - `specs/{featureId}/contexts/06_wrap_up.jsonl`
  - `specs/{featureId}/contexts/07_release.jsonl`
  - `specs/{featureId}/contexts/08_done.jsonl`
  - `specs/{featureId}/contexts/09_cancelled.jsonl`
- 新增解析器：`src/core/ai-orchestrator/declarative-context.ts`（遵循 kebab-case.ts 命名规范）
- 在 `context-pack.ts` 中改为”声明式单路径”策略：
  - **构建策略**：`buildReferences()` 仅消费当前阶段的 JSONL 声明文件
  - **失败策略**：阶段上下文文件缺失/非法时返回结构化错误并阻断本次 context 构建
  - **迁移策略**：在 `init` 和升级迁移中自动生成默认 `contexts/*.jsonl` 骨架
- **范围约束（v2.5）**：第一阶段仅支持 JSONL，避免多格式解析带来的复杂度与攻击面扩大
- **阶段覆盖策略（v2.5）**：采用“全阶段覆盖”单路径，不保留 06+ 阶段隐式兜底分支

### 验收标准
- 声明式上下文按阶段稳定生效，并记录来源（reason/path/checksum）。
- `context-pack.ts` 不再维护 `STAGE_LAYERS` 静态映射逻辑。
- 阶段上下文配置缺失时给出可执行修复提示（文件路径 + 生成命令）。
- `00_init/06_wrap_up/07_release/08_done/09_cancelled` 均有声明式上下文定义。
- 测试覆盖：`tests/unit/declarative-context.test.ts` + `tests/integration/context-pack-bridge.test.ts`

---

## 5.3 P1-4 Stop 终止门禁增强

> **注意**：此项目从 P0 降级为 P1，因为 `stop-guard.sh` 已有基础实现。

### 现有基线（已有实现）
- `ai-runtime-hook.ts` 已注册 Stop Hook，已有统计与摘要写入。
- `hard-gate.ts`/`advance.ts` 已覆盖阶段级门禁。
- **`stop-guard.sh`** 已实现未完成 TASK 检测（`STOP_GUARD_SCRIPT_CONTENT` 检测 `PENDING_IDS`）。

### 借鉴目标
- 增强 Stop Gate 审计深度（从”TASK 状态检测”扩展到”多维度完成性审计”）。

### spec-first 落地（增强现有实现）
- **集成策略**：Shell 脚本（`stop-guard.sh`）作为 TypeScript 的调用包装
- 新增 `src/core/tool-integration/stop-gate-enhanced.ts`：
  - 调用现有 `stop-guard.sh`（检测 PENDING_IDS）
  - 增加阶段完成性检测（`stage-state.json` 的 `currentStage / terminal / history` 一致性）
  - 增加关键产物存在性验证
  - 增加矩阵一致性摘要
  - 增加完整性校验（stage-state 与 featureId 一致性）
- 失败写入 findings 并给出下一步修复动作。

### 验收标准
- 对”未完成却结束”场景有可见阻断/告警（现有实现已满足基础检测）。
- Stop 结果可审计（结构化日志）。
- 测试覆盖：`tests/unit/stop-gate-enhanced.test.ts`

---

## 5.4 P0-2 HostRegistry 收敛

### 现有基线
- `host-paths.ts`、`host-bootstrap.ts`、`skill-commands.ts` 三处分散维护宿主能力。

### 借鉴目标
- 统一路径、能力、模板分发策略，减少分叉逻辑。

### spec-first 落地
- 新增 `src/shared/host-registry.ts`：
  - `id / name / pathResolver / capabilities / installers / priority / permissions / collectTemplates`
- 注册表派生规则：
  - `HOSTS -> HOST_IDS -> CONFIG_DIRS -> ALL_MANAGED_DIRS`
  - 所有“托管目录/模板目录”由同一数据源派生，避免分散常量漂移
- **分阶段迁移策略**：
  1. 阶段 B 初：HostRegistry 作为只读查询层
  2. 阶段 B 中：`host-paths.ts` 内部调用 HostRegistry
  3. 阶段 D 收尾：逐个迁移 `host-bootstrap.ts`、`skill-commands.ts`
- 让 `update.ts`、`host-bootstrap.ts`、`skill-commands.ts` 消费同一注册表，并由 `collectTemplates()` 提供模板采集能力。

### 验收标准
- 新增宿主时，仅需在注册表新增一条定义。
- claude/codex/generic 在统一注册表下行为一致且可预测。
- `update` 引擎不再维护宿主模板路径分支，统一由 HostRegistry 提供。

---

## 5.5 P1-2 Plan Reject Guard

### 现有基线
- 当前流程对“模糊/超大/高风险需求”缺正式拒绝出口。

### 借鉴目标
- 在规划入口提供拒绝/降级/拆分建议，避免坏需求进入实现阶段。

### spec-first 落地
- 接入点（与 `hard-gate` 协同）：
  - `src/core/skill-runtime/dispatcher.ts`：在 `plan/orchestrate` 路由后挂载评估上下文
  - `src/core/skill-runtime/hard-gate.ts`：执行前输出 `accept / refine / reject` 决策并阻断
  - `src/core/process-engine/*`：仅消费评估结果，不作为首入口
- 评估维度：
  - 输入完整性
  - 可拆分性
  - 规模与风险
  - 依赖清晰度
- 输出 `accept / refine / reject` 与理由模板。
- `dispatcher.ts` 负责路由与结果传递，拒绝策略由 Guard 规则集统一定义。

### 验收标准
- 对低质量输入给出结构化拒绝与补充清单。
- 评估结果可追踪到 findings 或独立日志。

---

## 5.6 P1-3 Workspace Journal 增强

### 现有基线
- 已有 `findings.md`、`gate-history.jsonl`、`ai-stats.jsonl`，但索引分散。

### 借鉴目标
- 提供统一会话索引，提升复盘和恢复效率。

### spec-first 落地
- 新增 `specs/{featureId}/workspace/`（或统一索引文件）。
- 汇总关键事件并保留原日志为事实源。

### 验收标准
- `catchup` 可基于统一索引快速恢复上下文。
- 索引与原始日志保持一致性，不引入重复事实源。

---

## 6. 分阶段执行计划（先计划，再实施）

> **时间估算调整**：阶段 B 从 1 周调整为 2 周（新增版本语义与冲突契约任务）

## 阶段 A：基线对齐与设计冻结（0.5 周）

目标：冻结“现状模型 + 借鉴边界 + 验收口径”。

执行：
1. 统一文档中的路径模型为 `specs/{featureId}`。
2. 明确“已实现能力”与“增量建设项”。
3. 产出技术设计草案（update-engine、JSONL bridge、stop-gate）。

交付：
- 本指南 v2.5（当前文档）
- 3 份简版设计说明（可附录）

---

## 阶段 B：P0-1 + P0-2（2 周）

目标：完成 P0 双核心能力：更新可审计 + 多宿主治理收敛基础。

执行：
1. 模板哈希快照与分类。
2. migration manifest 执行器。
3. 版本语义门禁（`cliVersion/projectVersion` + downgrade 策略）。
4. 迁移元数据聚合（breaking/changelog/migration guide）。
5. 更新前备份与失败回滚。
6. `--dry-run` 分类报告契约（`auto/confirm/conflict/skip`）落地。
7. HostRegistry 骨架与只读查询接入（不切主逻辑）。

变更入口：
- `src/cli/commands/update.ts`
- `src/core/update-engine/*`
- `src/shared/host-registry.ts`（新增）
- `src/shared/host-paths.ts`（接入查询层）

验收：
- 用户修改模板不会被覆盖。
- 版本语义与 breaking 变更提示可见且可追踪。
- 模拟失败可成功回滚。
- `--dry-run` 输出分类统计与逐项计划，不出现隐式覆盖。
- HostRegistry 可为 claude/codex/generic 返回一致能力描述。

回滚点：
- 使用最近一次备份快照进行数据回滚，不保留旧实现分支。

---

## 阶段 C：P1-1 + P1-4（1.5 周）

目标：降低上下文漂移与“假完成”风险。

执行：
1. JSONL 解析器 + context-pack 桥接。
2. 声明式上下文全阶段覆盖（`00/01/02/03/04/05/06/07/08/09`）。
3. Stop-gate 规则与日志落盘。
4. 与现有 hook 融合，完成单路径替换。

变更入口：
- `src/core/ai-orchestrator/context-pack.ts`
- `src/core/ai-orchestrator/declarative-context.ts`（新增）
- `src/core/process-engine/init.ts`
- `src/cli/commands/update.ts`
- `src/core/tool-integration/ai-runtime-hook.ts`
- `src/core/tool-integration/stop-gate-enhanced.ts`（新增）

验收：
- JSONL 直接驱动阶段上下文构建，缺失时显式阻断并提示修复。
- `00_init` 到 `09_cancelled` 阶段均可被声明式文件覆盖，无运行时兜底映射。
- Stop 时可稳定检测未完成项并给出修复建议。

回滚点：
- 回滚数据与产物状态，不保留双实现路径。

---

## 阶段 D：P1 收敛增强（1 周）

目标：完成 P1 核心能力，并收尾 HostRegistry 迁移。

执行：
1. Plan Reject Guard 接入。
2. Workspace Journal 索引。
3. HostRegistry 迁移收尾（清理旧分散入口，统一注册表消费）。

变更入口：
- `src/shared/host-registry.ts`（新增）
- `src/shared/host-paths.ts`
- `src/shared/host-bootstrap.ts`
- `src/shared/skill-commands.ts`
- `src/core/process-engine/*`（计划入口接入 guard）

验收：
- 宿主扩展点清晰，路径/能力不再分散。
- 低质量需求可被明确拒绝或要求补充。

回滚点：
- 通过 HostRegistry 迁移检查点与测试基线回退，不保留 legacy 分支。

---

## 7. 最佳方案推导（两轮思考结论）

### 第一轮：是否应“全量照搬 Trellis”

结论：不应照搬。

原因：
- spec-first 已有成熟阶段机与追踪治理。
- 全量替换会引入高迁移成本和稳定性风险。

### 第二轮：如何“收益最大且风险最小”

结论：采用“**治理能力插件化借鉴**”。

- 保留 spec-first 主干（阶段机、Gate、矩阵、Skill 流程）。
- 增量注入 Trellis 强项（升级治理、声明式上下文、终止门禁、多宿主收敛）。
- 用阶段化交付与测试闸门控制引入风险。

---

## 8. 本版指南相对 v1 的关键改进

1. 从”概念借鉴”升级为”代码映射型借鉴”。
2. 从”默认缺能力”修正为”先识别已实现基线，再补缺口”。
3. 从”泛优先级”改为”P0/P1/P2 + 验收 + 回滚点”执行化方案。
4. 全面纠正路径模型，统一到 `specs/{featureId}` 与 `.spec-first/current`。
5. **新增**：测试覆盖计划、开发期单路径约束、文件命名规范（遵循 kebab-case.ts）。
6. **v2.4 新增**：声明式上下文改为单路径实施（不保留 `STAGE_LAYERS` 兜底）、阶段命名与源码枚举对齐。
7. **v2.5 新增**：补齐版本语义闭环、迁移冲突契约、全阶段上下文覆盖、HostRegistry 模板采集职责。

### v2.3-v2.5 修正清单（基于多 Agent 审查）

| 修正项 | 来源 | 状态 |
|--------|------|------|
| Top 5 优先级对齐 | 架构审查 | ✅ 已修正 |
| 文件命名 `migration-list.ts` | 代码审查 | ✅ 已修正 |
| 声明式上下文单路径策略 | 架构审查 | ✅ 已明确 |
| Stop Gate 集成策略 | 代码审查 | ✅ 已明确 |
| HostRegistry 迁移路径 | 架构审查 | ✅ 已补充 |
| 更新引擎版本语义闭环 | 架构审查 | ✅ 已补充 |
| 迁移冲突分类契约 | 代码审查 | ✅ 已补充 |
| 声明式上下文全阶段覆盖 | 架构审查 | ✅ 已补充 |
| HostRegistry `collectTemplates` 职责 | 代码审查 | ✅ 已补充 |
| 开发期单路径约束 | 安全审查 | ✅ 已补充 |
| 环境变量命名统一 | 代码审查 | ✅ 已修正 |

---

## 9. 测试覆盖计划

### 9.1 更新引擎测试（P0-1）

| 测试文件 | 覆盖内容 | 阶段 |
|----------|----------|------|
| `tests/unit/update-engine/version.test.ts` | 版本比较、降级判定、allow-downgrade 行为 | B |
| `tests/unit/update-engine/metadata.test.ts` | migration metadata 聚合与 dry-run 摘要输出 | B |
| `tests/unit/update-engine/hash.test.ts` | 哈希计算、状态分类（new/unchanged/auto-update/user-modified） | B |
| `tests/unit/update-engine/backup.test.ts` | 快照创建、恢复、排除 node_modules | B |
| `tests/unit/update-engine/migration-list.test.ts` | 迁移执行、回滚、失败处理 | B |
| `tests/integration/update-flow.test.ts` | 端到端更新流程（含 dry-run） | B |

### 9.2 HostRegistry 测试（P0-2）

| 测试文件 | 覆盖内容 | 阶段 |
|----------|----------|------|
| `tests/unit/host-registry.test.ts` | 注册表查询、路径解析、能力匹配 | B-D |
| `tests/integration/host-detection.test.ts` | claude/codex/generic 宿主检测 | B-D |

### 9.3 其他模块测试

| 测试文件 | 覆盖内容 | 阶段 |
|----------|----------|------|
| `tests/unit/declarative-context.test.ts` | JSONL 解析、覆盖逻辑 | C |
| `tests/unit/declarative-stage-coverage.test.ts` | `00~09` 阶段上下文文件覆盖与错误提示 | C |
| `tests/integration/context-pack-bridge.test.ts` | context-pack 集成 | C |
| `tests/unit/plan-reject-guard.test.ts` | 4 种拒绝场景（vague/incomplete/too_large/harmful） | D |
| `tests/unit/workspace-index.test.ts` | 索引更新、快速查询、catchup 集成 | D |
| `tests/unit/stop-gate-enhanced.test.ts` | 完成标记检测、产物验证 | C |
| `tests/security/path-traversal.test.ts` | 路径遍历攻击防护 | B-D |
| `tests/security/command-injection.test.ts` | 命令注入防护（迁移清单） | B |
| `tests/security/env-injection.test.ts` | 环境变量注入防护 | D |
| `tests/security/backup-integrity.test.ts` | 备份完整性和回滚审计 | B |

### 9.4 覆盖率要求

- **Lines/Functions/Statements**: ≥75%（vitest.config.ts 阈值）
- **Branches**: ≥65%

---

## 10. 开发期实施约束（单路径）

1. 新能力按阶段直接落地到主路径，不维护 legacy 双轨实现。
2. 风险控制依赖“备份快照 + 测试闸门 + 迁移检查点”，不依赖运行时开关切流。
3. 每阶段结束必须清理临时适配代码，保持实现面收敛。
4. 阶段 C 结束后，`context-pack.ts` 中不得保留 `STAGE_LAYERS` 静态映射分支。

---

## 11. 文件命名与代码规范

### 11.1 命名规范（遵循 CLAUDE.md）

| 模块 | 正确命名 | 错误示例 |
|------|----------|----------|
| 声明式上下文 | `declarative-context.ts` | ~~`context-jsonl.ts`~~ |
| 迁移列表 | `migration-list.ts` | ~~`migrations.ts`~~ |
| 需求守卫 | `plan-reject-guard.ts` | ~~`planRejectGuard.ts`~~ |
| 工作区索引 | `workspace-index.ts` | ~~`workspace_journal.ts`~~ |

### 11.2 类型定义位置

所有新增类型定义在 `src/shared/types.ts`，使用分区注释：

```typescript
// src/shared/types.ts

// ─── 更新引擎类型 ─────────────────────────────────
export type TemplateStatus = 'new' | 'unchanged' | 'auto-update' | 'user-modified';
export interface MigrationAction { /* ... */ }

// ─── HostRegistry 类型 ─────────────────────────────
export type HostCapability = 'mcp' | 'skills' | 'hooks' | 'commands';
export interface HostDefinition { /* ... */ }

// ─── 声明式上下文类型 ─────────────────────────────
export interface DeclarativeContextEntry { /* ... */ }

// ─── 需求评估类型 ─────────────────────────────────
export type RejectionReason = 'vague' | 'incomplete' | 'too_large' | 'harmful';
export interface PlanAssessment { /* ... */ }
```

---

## 12. 安全设计（三 Agent 审查新增）

### 12.1 高危漏洞修复方案

| 漏洞 | 位置 | 修复方案 |
|------|------|----------|
| Git Clone 无校验 | `host-bootstrap.ts` | 可信 commit hash 白名单验证 |
| 迁移清单命令注入 | 5.1 节设计 | 路径安全校验 + 项目边界验证 |
| 环境变量路径注入 | `host-paths.ts` | 路径规范化 + 敏感目录黑名单 |

### 12.2 安全解析器设计

```typescript
// declarative-context.ts 中的安全解析
const MAX_LINE_LENGTH = 100_000;
const MAX_ENTRIES = 1_000;

export function parseContextFile(content: string): ContextEntry[] {
  // v2.5: 仅支持 JSONL，逐行解析并限制输入规模
  return content.split('\n')
    .filter(line => line.trim().length > 0)
    .slice(0, MAX_ENTRIES)
    .map((line, index) => {
      if (line.length > MAX_LINE_LENGTH) {
        throw new Error(`第 ${index + 1} 行超长，拒绝解析`);
      }
      const parsed = JSON.parse(line) as Record<string, unknown>;
      if (typeof parsed.file !== 'string' || typeof parsed.reason !== 'string') {
        throw new Error(`第 ${index + 1} 行字段不合法，需包含 file/reason 字符串`);
      }
      return { file: parsed.file, reason: parsed.reason } as ContextEntry;
    });
}
```

### 12.3 迁移操作安全边界

```typescript
// migration-list.ts 中的路径验证
import { isAbsolute, relative, resolve } from 'node:path';

const SAFE_PATH_PATTERN = /^[a-zA-Z0-9_\-./]+$/;
const BLOCKED_PREFIXES = ['/etc', '/sys', '/proc', '/root'];

function validateMigrationPath(path: string, projectRoot: string): void {
  if (path.length > 4096) throw new Error(`路径过长: ${path}`);
  if (!SAFE_PATH_PATTERN.test(path)) throw new Error(`路径包含非法字符: ${path}`);
  if (path.includes('..')) throw new Error(`检测到路径遍历: ${path}`);

  const root = resolve(projectRoot);
  const resolvedPath = resolve(root, path);
  for (const blocked of BLOCKED_PREFIXES) {
    if (resolvedPath === blocked || resolvedPath.startsWith(`${blocked}/`)) {
      throw new Error(`检测到敏感目录写入: ${path}`);
    }
  }
  const rel = relative(root, resolvedPath);
  if (rel.startsWith('..') || isAbsolute(rel)) {
    throw new Error(`操作超出项目边界: ${path}`);
  }
}
```

### 12.4 备份安全设计

- 备份存储在隔离目录（`.spec-first/backups/`），权限设为 0700
- 每个备份包含 manifest.json 记录文件列表和校验和
- 回滚前验证备份完整性
- 保留最近 5 个备份，自动清理过期备份

---

## 13. 风险与边界

### 13.1 主要风险

1. **复杂度上升**
   - 缓解：每个新模块都要求“可测试、可审计、可恢复”。

2. **宿主差异风险**
   - 缓解：HostRegistry 能力矩阵 + 契约测试。

3. **团队认知成本**
   - 缓解：阶段验收后立即更新文档与示例，统一单路径心智模型。

### 13.2 不照搬边界（明确）

1. 不替换 TypeScript 主栈。
2. 不替换 spec-first 阶段模型与追踪矩阵。
3. 不把未验证平台能力作为默认强依赖。
4. 不使用 default export（Named exports only）。

---

## 14. 执行清单（可直接进入排期）

### P0
- [ ] P0-1 更新引擎鲁棒性（版本语义 + 哈希分级 + manifest 迁移 + 备份回滚，含冲突分类 dry-run 契约）
- [ ] P0-2 HostRegistry 单一真理源（含 `collectTemplates`）
- [ ] P0-3 声明式上下文阶段覆盖闭环（`00_init`~`09_cancelled`）

### P1
- [ ] P1-1 JSONL 声明式上下文桥接
- [ ] P1-2 Plan Reject Guard
- [ ] P1-3 Workspace Journal 索引增强
- [ ] P1-4 Stop 终止门禁增强

### P2
- [ ] P2-1 Worktree 流水线命令化增强（按需）
- [ ] P2-2 多平台模板同构深化（按需）
