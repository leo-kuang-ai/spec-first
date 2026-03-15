# Spec-First 综合升级蓝图与实施方案

> 类型：战略级升级蓝图 + 可直接执行的实施方案
> 分析日期：2026-03-15
> 适用范围：Spec-First 产品、CLI、Skill 体系、宿主集成、执行引擎、质量治理、生态扩展

---

## 一、执行摘要

Spec-First 当前已经具备清晰的核心骨架：

- 阶段状态机
- Gate 门禁
- 追溯 ID 体系
- 覆盖率矩阵
- Skills + MCP + Hooks + Viewer 基础设施

它的问题不是“没有体系”，而是“体系强、执行层偏弱，生态层还不够厚”。

如果只维持现状，Spec-First 会继续是一个强规范、强过程、但偏工程师导向的系统。  
如果完成这一轮综合升级，Spec-First 应该进化为：

> 一个以规范驱动为核心、以自动编排为引擎、以多宿主工具集成为底座、以记忆与专项能力为扩展层的工程操作系统。

这次升级的战略目标不是简单补功能，而是完成三个转变：

1. 从“流程规范系统”升级为“流程执行系统”
2. 从“单宿主集成工具”升级为“多宿主工程平台”
3. 从“研发主流程框架”升级为“可扩展的专项能力底座”

---

## 二、升级判断

### 2.1 当前优势

Spec-First 当前最强的不是自动化，而是结构化治理能力：

- `阶段状态机`：流程边界清晰
- `Gate 条件`：质量阻断可执行
- `追溯 ID`：跨产物关系明确
- `覆盖率矩阵`：质量可量化
- `Defect / RFC`：变更管理能力优于多数同类系统

这些能力决定了 Spec-First 的升级策略不能是“推倒重来”，只能是“以现有治理骨架为核心，补执行、补集成、补生态”。

### 2.2 当前短板

从跨项目对比看，当前短板集中在 6 个通用维度和 2 个专项方向：

#### 通用短板

1. 自动化程度
2. 多运行时
3. 工具集成
4. 易用性
5. 持久记忆
6. TDD 强制

#### 专项短板

1. 安全审计深度
2. 专家角色协作

### 2.3 战略判断

因此，最佳升级路线不是平均发力，而是按“核心闭环优先、生态扩展后置”的原则推进：

- 第一优先级：让现有骨架真正自动运行起来
- 第二优先级：让系统记得、会选工具、会出证据
- 第三优先级：扩展多宿主和专项能力

---

## 三、目标愿景

### 3.1 升级后的产品定义

升级后的 Spec-First 应定义为：

> 规范驱动的工程执行平台。

它不只是：

- PRD/Design/Task 管理工具
- Skill 集合
- CLI 工具

而是同时具备以下 5 层能力：

1. `治理层`
   - 阶段、Gate、Trace、Coverage、RFC/Defect

2. `执行层`
   - Auto Loop、Wave、超时监督、快速路径

3. `集成层`
   - 多宿主、MCP、Hooks、Viewer、Browser、Fetch、Serena

4. `记忆层`
   - Steering、Session Record、Persistent Memory、Context Recovery

5. `专项层`
   - Security Audit、Expert Profiles、专项报告模板

### 3.2 产品目标

升级完成后，Spec-First 应达到以下状态：

#### 对用户

- 用户可以把任务交给系统持续推进，而不是每一步手动驱动
- 小任务不必完整走全流程
- 长任务不会频繁丢上下文
- 复杂任务能按角色和专项能力分工

#### 对团队

- 研发过程可追溯
- 质量门禁可执行
- 产物质量可审计
- 工具使用方式可标准化

#### 对生态

- 可接入更多宿主
- 可扩展更多工具能力
- 可沉淀更多专项模板与专家配置

---

## 四、升级原则

### 4.1 保留原则

以下能力应保留，不作为重构对象：

- 阶段状态机
- Gate 门禁体系
- 追溯 ID 体系
- 覆盖率矩阵
- Defect / RFC 管理

原因：

- 这些是 Spec-First 的真正护城河
- 其他项目可以提供自动化、工具、记忆、安装体验
- 但很少有项目在“工程治理闭环”上达到相同完整度

### 4.2 增强原则

以下能力应增强，而不是替换：

- orchestrate
- update / doctor
- skill runtime
- tool integration
- review / verify

### 4.3 后置原则

以下能力应后置，不应抢占核心闭环资源：

- 语音
- 过多 UI 壳层
- 过早扩展低频宿主
- 复杂 AI 代理树的重型实现

### 4.4 设计原则

整个升级应遵守 6 条设计原则：

1. `Manifest First`
   - 工具、宿主、组件、能力都应有清单定义

2. `Capability Before Execution`
   - 先定义能力抽象，再接具体宿主和工具

3. `Evidence Before Claims`
   - 工具结果必须沉淀为可追溯产物

4. `Degrade Gracefully`
   - 工具缺失时应降级，不应静默失效

5. `Keep the Governance Core Stable`
   - 不破坏 Gate / Trace / Stage 主骨架

6. `Platform, not Script Pile`
   - 不继续堆散落脚本，要形成统一能力层

---

## 五、战略蓝图

### 5.1 总体目标架构

```text
┌────────────────────────────────────────────────────────────────────┐
│                           Governance Core                         │
│  Stage Machine | Gate Engine | Trace Engine | Coverage | RFC/Defect │
└────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌────────────────────────────────────────────────────────────────────┐
│                          Execution Layer                          │
│  Auto Loop | Quick Path | Wave Scheduler | Timeout Supervisor     │
└────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌────────────────────────────────────────────────────────────────────┐
│                         Integration Layer                         │
│  Host Adapters | Skills | MCP | Hooks | Viewer | Browser | Fetch  │
└────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌────────────────────────────────────────────────────────────────────┐
│                           Memory Layer                            │
│  Steering | Session Record | Persistent Memory | Reboot Context   │
└────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌────────────────────────────────────────────────────────────────────┐
│                         Specialization Layer                      │
│  Security Audit | Expert Profiles | Reports | Templates           │
└────────────────────────────────────────────────────────────────────┘
```

### 5.2 目标能力地图

| 维度 | 当前状态 | 目标状态 |
|------|----------|----------|
| 自动化 | 有 auto-loop 基础，但深度不足 | 可稳定无人值守推进多个执行单元 |
| 易用性 | 全流程偏重 | 支持 quick path、batch discuss、场景短路径 |
| 多运行时 | 以 Claude Code / Codex 为主 | 形成宿主适配层 |
| 工具集成 | 有底座，无中台 | 有 registry、capability、selection、产物模板 |
| 持久记忆 | 零散 | 有 Steering + Session + Persistent Memory 闭环 |
| TDD 强制 | 有 verify/gate，但不够硬 | 形成实现期硬门禁之一 |
| 安全审计 | 零散 review 能力 | 有安全 checklist + 报告模板 |
| 专家协作 | 少量 skill 分工 | 有 expert profiles + orchestrator 协作模板 |

### 5.3 三阶段战略

#### Phase A：执行闭环强化

目标：

- 让 Spec-First 真正具备“自动执行引擎”特征

核心内容：

- Auto Loop
- 超时监督
- Quick Path
- TDD Gate
- Wave Scheduler

#### Phase B：能力中台建设

目标：

- 让工具、宿主、记忆成为平台能力，而不是分散能力

核心内容：

- Host Adapter
- Tool Registry
- Capability Matrix
- Tool Selection Policy
- Steering + Session Record + Persistent Memory

#### Phase C：生态与专项扩展

目标：

- 让 Spec-First 有能力承接更多宿主和更多专项场景

核心内容：

- OpenCode / Gemini / Cursor / Copilot 适配
- Browser verification
- Security audit
- Expert profiles

---

## 六、可直接执行的实施方案

### 6.1 Phase A：执行闭环强化

#### A1. Auto Loop 深化

目标：

- 从“有 auto mode”升级到“可持续推进任务链”

关键工作：

- 抽离统一 `auto-loop` 核心模块
- 增加暂停 / 恢复 / 中断原因分类
- 打通 Gate 检查与下一步调度
- 将任务状态变更标准化

建议落点：

- `src/core/ai-orchestrator/auto-loop.ts`
- `src/cli/commands/orchestrate.ts`

验收标准：

- 单个 Feature 可在无人持续确认下推进多个任务
- 阻塞原因可归类输出

#### A2. Timeout Supervisor

目标：

- 防止 auto-loop 停滞或无边界运行

关键工作：

- soft / idle / hard 三层超时
- heartbeat 与 watchdog 状态维护
- 状态输出进入 doctor / orchestrate

建议落点：

- `src/core/ai-orchestrator/watchdog.ts`
- `src/core/ai-orchestrator/timeout-supervisor.ts`

验收标准：

- 停滞任务会被识别
- 自动循环不会无反馈长期卡死

#### A3. Quick Path

目标：

- 降低 bugfix / config / docs 等轻任务的流程成本

关键工作：

- 增加 `quick` 命令
- 定义“短路径但不绕过质量门禁”的规则
- 明确与 full feature flow 的边界

建议落点：

- `src/cli/commands/quick.ts`
- `src/shared/types.ts`

验收标准：

- 小任务不需要完整走 8-stage
- quick 仍可进入 verify / wrap-up

#### A4. TDD Gate

目标：

- 把 TDD 从理念变成硬门禁

关键工作：

- 在 implement / verify 阶段增加测试证据条件
- Skill 文档明确 RED / GREEN 流程
- verify 检查测试结果而不只检查文字承诺

建议落点：

- `src/core/gate-engine/condition-registry.ts`
- `src/cli/commands/gate.ts`
- `skills/spec-first/04-code/SKILL.md`
- `skills/spec-first/12-verify/SKILL.md`

验收标准：

- 没有测试证据时 Gate 不通过

#### A5. Wave Scheduler

目标：

- 提升并行执行能力，同时保持依赖顺序正确

关键工作：

- task dependency -> waves
- 同 wave 并行、跨 wave 串行
- 失败时仅阻塞后继依赖

建议落点：

- `src/core/batch-executor/wave-scheduler.ts`
- `src/cli/commands/orchestrate.ts`

验收标准：

- 具备基础依赖感知并行

### 6.2 Phase B：能力中台建设

#### B1. Host Adapter Layer

目标：

- 把宿主差异从脚本逻辑抽离成统一能力层

关键工作：

- 定义 `adapter` 接口
- 为 Claude Code / Codex 保持现有能力
- 新增 OpenCode / Gemini / Cursor / Copilot 适配计划

建议落点：

- `src/core/agents/adapter.ts`
- `src/core/agents/<host>-adapter.ts`

验收标准：

- 不同宿主的技能、MCP、hook、viewer 支持边界可统一描述

#### B2. Tool Capability Layer

目标：

- 从“工具接入”升级到“工具调度”

关键工作：

- `tool-registry`
- `capability-matrix`
- `tool-selection-policy`
- `fallback-policy`

建议落点：

- `src/core/tool-integration/tool-registry.ts`
- `src/core/tool-integration/capability-matrix.ts`
- `src/core/tool-integration/tool-selection.ts`

验收标准：

- research / review / verify 可根据任务类型推荐工具组合

#### B3. Componentized Update / Doctor

目标：

- 把现有工程化工具升级为生态配置器雏形

关键工作：

- `update --component`
- `update --dry-run`
- doctor 输出宿主能力矩阵
- 补“安装计划”与“修复计划”

建议落点：

- `src/cli/commands/update.ts`
- `src/cli/commands/doctor.ts`

验收标准：

- 用户可按组件安装
- doctor 输出不再只做存在性检查

#### B4. Memory Layer

目标：

- 解决上下文丢失、重复分析、重复提问

关键工作：

- Steering 结构
- Session Record
- Persistent Memory provider interface
- Reboot / catchup 恢复链路

建议落点：

- `src/core/steering/*`
- `src/core/session/session-record.ts`
- `src/core/memory/*`

验收标准：

- 新会话能读取最小必要上下文
- 审查与归档能利用历史复盘

### 6.3 Phase C：生态与专项扩展

#### C1. Browser Verification

目标：

- 将浏览器能力从 manifest 配置升级为验收链路

关键工作：

- 增加 browser verification 模板
- 前端验收 / 表单验收 / UI check 场景化
- review / verify 允许明确使用浏览器能力

建议落点：

- `docs/templates/browser-verification.md`
- `skills/spec-first/08-review/SKILL.md`
- `skills/spec-first/12-verify/SKILL.md`

#### C2. Research Evidence

目标：

- 把 fetch / external research 结果固化为证据链

关键工作：

- 增加 research-evidence 模板
- 明确来源、摘要、置信度、引用方式

建议落点：

- `docs/templates/research-evidence.md`
- `skills/spec-first/05-research/SKILL.md`

#### C3. Security Audit

目标：

- 把安全审计从“泛 review”升级为“专项能力”

关键工作：

- 安全 checklist
- 审计报告模板
- 高风险结论的证据纪律

建议落点：

- `src/core/security/audit-checklist.ts`
- `docs/templates/security-audit-report.md`

#### C4. Expert Profiles

目标：

- 把 agency-agents 的角色生态简化为 Spec-First 可用的专家层

关键工作：

- 定义 expert profiles
- 建立 task type -> profile 映射
- 在 orchestrate 中引入 profile 协作模板

建议落点：

- `skills/spec-first/experts/`
- `src/core/agents/orchestrator-profiles.ts`

#### C5. Constitution + Delta Spec

目标：

- 增强规范权威性与规格变更表达能力

关键工作：

- Constitution hierarchy
- ADDED / MODIFIED / REMOVED
- 与 Gate / Spec / Design 的一致性校验

建议落点：

- `docs/constitution.md`
- `src/cli/commands/spec.ts`
- `src/cli/commands/design.ts`
- `src/core/gate-engine/condition-registry.ts`

---

## 七、组织与治理方案

### 7.1 建议组织方式

建议将升级拆成 4 个工作流并行推进：

1. `Core Execution`
   - Auto Loop / Timeout / Wave / Quick

2. `Platform Integration`
   - Host Adapter / Update / Doctor / Tool Capability

3. `Memory & Quality`
   - Steering / Memory / TDD / Session Record

4. `Specialization`
   - Browser / Security Audit / Expert Profiles / Constitution

### 7.2 建议里程碑

#### M1：执行闭环可用

完成标志：

- Auto Loop 深化
- Quick Path 可用
- TDD Gate 可阻断

#### M2：平台能力成型

完成标志：

- Host Adapter 抽象完成
- Tool Capability Layer 可工作
- update / doctor 支持组件化和 dry-run

#### M3：生态扩展可演示

完成标志：

- 至少 1 个新宿主适配可用
- Browser verification 成型
- Security audit / Expert profiles 进入实际流程

### 7.3 风险与应对

| 风险 | 影响 | 应对 |
|------|------|------|
| Auto Loop 复杂度高 | 影响核心稳定性 | 先增强现有模块，不另起新执行引擎 |
| 多宿主适配分散精力 | 影响主线进度 | 先做 adapter 抽象，再只接 1-2 个高价值宿主 |
| 工具越多越复杂 | 用户理解成本上升 | 坚持组件化、能力矩阵、dry-run |
| 专项能力碎片化 | 难以形成平台 | 所有专项能力必须模板化、产物化 |

---

## 八、成功标准

这轮综合升级成功的标志，不是“功能多了”，而是同时满足下面 4 个条件：

### 8.1 运行成功

- Feature 可以自动推进更长链路
- 小任务有短路径
- 并行任务有 wave 能力

### 8.2 平台成功

- 宿主能力可统一表达
- 工具能力可统一选择
- update / doctor 成为平台入口

### 8.3 质量成功

- TDD 门禁真正生效
- review / verify 产物更标准化
- 安全审计具备专项模板

### 8.4 生态成功

- 增加至少一个新宿主
- 增加专家 profile
- 浏览器 / research / security 结果都可沉淀为证据产物

---

## 九、最终建议

最佳实践不是“把别人的功能都抄过来”，而是按 Spec-First 的核心优势重新组织这些能力。

因此最合理的升级姿态应该是：

- 用 `GSD-2` 补执行力
- 用 `Get-Shit-Done` 补轻量体验
- 用 `cc-sdd` 补项目记忆
- 用 `Gentle-AI` 补宿主与生态配置
- 用 `Trellis` 补知识捕获与检查分层
- 用 `Superpowers` 补 TDD 与审查纪律
- 用 `OpenSpec + Spec Kit` 补规范表达能力
- 用 `code-audit` 补安全专项深度
- 用 `agency-agents` 补专家角色广度

最终形成的不是“功能拼盘”，而应是：

> 一个以治理骨架为核心、以执行引擎为推进器、以工具与记忆为中台、以专项模板和专家角色为扩展层的 Spec-First 2.0。

---

## 附：建议输出物

建议以这份蓝图为上位文档，后续拆分出以下配套文档：

- `综合升级路线图`
- `Host Adapter 设计文档`
- `Tool Capability Layer 设计文档`
- `Memory Layer 设计文档`
- `Security Audit 设计文档`
- `Expert Profiles 设计文档`
- `Phase A / B / C` 分阶段实施计划
