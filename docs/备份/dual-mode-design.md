# Spec-First 双模式 + 多端扩展设计方案

> **版本**: v1.0 | **日期**: 2026-02-06
> **定位**: spec-first-v2.md 的补充设计，待审阅后合并为 v2.1
> **解决的审查问题**: P0-1（Init 定位模糊）、P1-3（轻量模式过粗）、P1-4（目录结构）

---

## 设计背景

当前 v2.0 的隐含假设：单一团队、单一技术栈、单一流程路径。

实际场景：
- **多端团队**：APP（iOS/Android）、PC（桌面端）、H5（移动 Web）、Java 后端
- **两种开发模式**：新功能开发 vs 历史功能优化迭代
- **各端有独立的技术规范**，但核心流程应该通用

---

## 核心架构：三层规范体系

**不设计多套独立流程，而是在同一个 7+3 框架内引入"分层扩展"机制。**

```
┌─────────────────────────────────────────────────┐
│  Layer 0: 通用流程框架（7+3）                      │
│  所有团队、所有模式、所有规模共享                    │
│  定义：流程骨架、阶段定义、横切机制                  │
├─────────────────────────────────────────────────┤
│  Layer 1: 模式 × 规模 规则                         │
│  Mode N (New Feature) / Mode I (Iteration)       │
│  Size S / M / L                                  │
│  定义：每种组合下的阶段行为和产出物深度              │
├─────────────────────────────────────────────────┤
│  Layer 2: 端特有规范                               │
│  APP / PC / H5 / Java Backend / ...              │
│  定义：各端的技术约束、质量标准、检查清单            │
│  各端独立维护，按需补录                             │
└─────────────────────────────────────────────────┘
```

**三层关系**：
- Layer 0 定义"做什么"（流程骨架）
- Layer 1 定义"怎么做"（模式差异、产出物深度）
- Layer 2 定义"做到什么标准"（端特有质量标准）

**执行时合并**：Feature 启动时，读取 Layer 0 + 应用 Layer 1 规则 + 合并涉及端的 Layer 2 规则 = 该 Feature 的定制化流程实例。

---

## Layer 1：双模式定义

### 模式对比

| 维度 | Mode N（New Feature） | Mode I（Iteration） |
|------|----------------------|---------------------|
| **定义** | 全新功能开发，无历史产物 | 基于已有功能的变更 |
| **起点** | 从空白开始 | 从历史产物开始 |
| **产出物** | 全新创建 | 增量更新（diff 模式） |
| **子类型** | — | Enhancement / Optimization / Bug Fix / Refactoring |
| **典型场景** | 新增用户管理模块 | 给用户管理增加批量导入、查询性能优化、修复登录 Bug |

### Iteration 模式的 3 个关键增量

相比 New Feature，Iteration 模式多出 3 个必须处理的环节：

| 增量 | 说明 | 嵌入位置 |
|------|------|---------|
| **历史产物定位** | 先找到并理解已有的 spec/plan/contracts/code | 01. Specify 前置步骤 |
| **Impact Analysis** | 评估变更影响哪些产物和模块 | 01. Specify 子步骤 |
| **回归验证** | 确保变更不破坏现有功能 | 05. Verify 追加子活动 |

### 每个阶段的模式差异

#### 00. Init

| 维度 | Mode N | Mode I |
|------|--------|--------|
| **活动** | 创建 Feature 目录、读取 Constitution | 定位历史 Feature 产物、读取 Constitution + 历史 spec/plan/contracts |
| **产出物** | 新建 `specs/<feature>/` 目录 | 在历史 Feature 目录中创建变更子目录或分支 |
| **Exit Gate** | 目录结构就绪 | 历史产物已定位并理解 |

#### 01. Specify

| 维度 | Mode N | Mode I |
|------|--------|--------|
| **前置步骤** | — | **历史产物定位**：读取已有 spec.md，理解当前功能边界 |
| **活动** | 完整需求分析 → 结构化 PRD → Clarify | **Impact Analysis** → 增量 spec 编写 → Clarify |
| **产出物** | 全新 `spec.md` | `spec-delta.md`（变更增量）或直接在原 spec.md 上标注 diff |
| **Exit Gate** | DoR Sign-off，无歧义标记 | DoR Sign-off + Impact Analysis 已确认影响范围 |

**Mode I 特有活动 — Impact Analysis**：
- 输入：变更需求 + 历史 spec/plan/contracts
- 输出：影响范围清单（受影响的模块、接口、数据模型、测试用例）
- 格式：`impact-analysis.md`，包含影响矩阵和风险评估

#### 02. Design

| 维度 | Mode N | Mode I |
|------|--------|--------|
| **活动** | Research → 技术选型 → 架构设计 → API 契约 → 数据建模 | 基于 Impact Analysis，仅设计受影响部分 |
| **产出物** | 全新 `plan.md`, `contracts/`, `data-model.md`, ADR | 增量更新已有设计文档 + 新增 ADR 记录变更决策 |
| **Exit Gate** | 设计评审 + Spec-Consistency-Analysis | 增量设计评审 + 变更前后一致性校验 |

**Mode I 关键差异**：
- 不需要从零开始架构设计，而是评估现有架构能否承载变更
- 如果变更导致架构调整，需新增 ADR 记录变更理由
- Research 范围缩小为"变更相关的技术调研"

#### 03. Plan

| 维度 | Mode N | Mode I |
|------|--------|--------|
| **活动** | 全量任务拆解 → 依赖分析 → 工作量估算 | 增量任务拆解（仅变更部分）+ 回归测试任务规划 |
| **产出物** | 全新 `tasks.md` + `checklist.md` | 增量 `tasks-delta.md` + 回归测试清单 |
| **Exit Gate** | 任务评审 + 覆盖率校验 | 任务评审 + 变更覆盖率 + 回归范围确认 |

**Mode I 关键差异**：
- 任务清单中必须包含"回归测试"类型任务
- 依赖分析需考虑与现有功能的交互影响
- Checklist 需覆盖"不破坏现有功能"的验证场景

#### 04. Implement

| 维度 | Mode N | Mode I |
|------|--------|--------|
| **活动** | 按 Task 开发 → TDD → Code Review | 按增量 Task 开发 → TDD → CR + **变更影响 CR** |
| **产出物** | 代码实现、单元测试、CR Report | 增量代码、增量测试 + 回归测试补充 |
| **Exit Gate** | Code CR 通过 + 覆盖率达标 | Code CR 通过 + 覆盖率达标 + 回归测试通过 |

**Mode I 关键差异**：
- Code Review 增加"变更影响审查"维度：是否引入副作用
- 必须补充受影响路径的回归测试用例
- 如修改公共模块，需通知依赖方团队

#### 05. Verify

| 维度 | Mode N | Mode I |
|------|--------|--------|
| **活动** | 集成测试 → 安全扫描 → UAT | 增量测试 → **回归验证** → 安全扫描 → UAT |
| **产出物** | Test Report, Security Report, UAT Sign-off | 增量 Test Report + **Regression Report** + UAT Sign-off |
| **Exit Gate** | 全部 AC 通过 + 安全无高危 | 全部新增 AC 通过 + 回归测试 100% 通过 + 安全无高危 |

**Mode I 特有活动 — 回归验证**：
- 执行 Impact Analysis 中识别的所有受影响路径的回归测试
- 回归测试必须 100% 通过，任何失败都需要分析是否为变更引入的副作用
- 产出 `regression-report.md`，记录回归范围、执行结果、风险评估

#### 06. Wrap-up

| 维度 | Mode N | Mode I |
|------|--------|--------|
| **活动** | 复盘 → 文档归档 → Spec 同步 | 复盘 → 增量文档合并 → 历史 Spec 更新 |
| **产出物** | Retro Report, 完整 Spec 文档集 | Retro Report + 更新后的历史 Spec（合并增量） |
| **Exit Gate** | 文档完整性检查 | 文档完整性 + 历史产物已同步更新 |

**Mode I 关键差异**：
- 增量产物（spec-delta, tasks-delta）需合并回历史主文档
- 确保历史 Spec 反映最新实现状态，避免"文档腐化"
- Retro 需额外回顾：Impact Analysis 准确性、回归测试覆盖充分性

---

### 规模分级：S / M / L

**核心原则**：不跳过阶段，而是调节每个阶段的产出物深度（对标 SpecifyPlus 的做法）。

#### 判定标准

| 维度 | S（Small） | M（Medium） | L（Large） |
|------|-----------|------------|-----------|
| **涉及端点数** | 1-2 个 | 3-5 个 | 6+ 个 |
| **AC 数量** | ≤ 5 | 6-15 | 16+ |
| **API 变更** | 无或 1 个接口 | 2-5 个接口 | 6+ 个接口或新增服务 |
| **数据模型变更** | 无 | 字段级变更 | 表级变更或新增实体 |
| **跨团队依赖** | 无 | 1 个团队 | 2+ 个团队 |

**判定规则**：5 个维度中，取最高级别为 Feature 规模。例如 AC 数量为 M 但跨团队依赖为 L，则整体为 L。

#### 产出物深度矩阵

| 阶段 | S | M | L |
|------|---|---|---|
| **00. Init** | 读取 Constitution | 读取 Constitution | 读取 Constitution + Kickoff 会议 |
| **01. Specify** | 简版 spec（AC 列表） | 标准 spec.md | 完整 spec.md + Domain Model + Logic Flow |
| **02. Design** | 口头/简要技术方案 | 标准 plan.md + contracts | 完整 plan.md + contracts + data-model + research.md + ADR |
| **03. Plan** | 任务列表（无依赖图） | tasks.md + 依赖标注 | tasks.md + 依赖图 + checklist.md + 并行化标记 |
| **04. Implement** | TDD + 自审 | TDD + Peer CR | TDD + Peer CR + 架构师 CR |
| **05. Verify** | 单元测试 + 冒烟测试 | 集成测试 + UAT | 全量测试 + 安全扫描 + UAT + 性能测试 |
| **06. Wrap-up** | 简要 Retro 记录 | 标准 Retro Report | 完整 Retro + 文档归档 + Action Items |

#### Mode × Size 组合示例

| 组合 | 典型场景 | 流程特征 |
|------|---------|---------|
| **N-S** | 新增一个简单查询接口 | 全阶段走通，产出物精简，1-2 天完成 |
| **N-M** | 新增用户管理模块 | 标准流程，完整产出物 |
| **N-L** | 新增支付系统 | 完整流程 + Research + Checklist + 多团队协作 |
| **I-S** | 修复登录页 Bug | 定位历史产物 → 增量 spec → 修复 → 回归验证 |
| **I-M** | 给用户管理增加批量导入 | Impact Analysis → 增量设计 → 增量任务 → 回归测试 |
| **I-L** | 支付系统从同步改异步 | 完整 Impact Analysis → 架构级 ADR → 全量回归 |

---

## Layer 2：多端扩展机制

### 设计原则

1. **Layer 0/1 不感知端**：通用流程和模式规则与具体端无关
2. **Layer 2 按端独立维护**：各端团队自主维护本端规范，按需补录
3. **执行时合并**：Feature 启动时，根据涉及的端，动态合并对应的 Layer 2 规则
4. **API 契约是跨端协作锚点**：前后端通过 `contracts/` 对齐，而非流程耦合

### 端分类

| 端标识 | 团队 | 技术栈特征 |
|--------|------|-----------|
| `APP` | iOS / Android | 原生开发，关注性能、包体积、兼容性 |
| `PC` | 桌面端 | Electron / 原生，关注跨平台、内存占用 |
| `H5` | 移动 Web | 前端框架，关注首屏性能、SEO、浏览器兼容 |
| `Backend` | Java 后端 | Spring 生态，关注并发、数据一致性、API 设计 |

### 端规范扩展点

每个端在 7 个阶段中可定义 3 类扩展：

| 扩展类型 | 说明 | 示例 |
|---------|------|------|
| **Entry Criteria** | 进入该阶段前，本端需额外满足的条件 | APP: 确认最低支持 OS 版本 |
| **Deliverables** | 本端在该阶段需额外产出的产物 | H5: 浏览器兼容性矩阵 |
| **Exit Gate Items** | 本端在该阶段 Gate 中需额外检查的项 | Backend: API 性能基准测试通过 |

### 端规范文件模板：`<platform>-rules.md`

每个端维护一份 `<platform>-rules.md`，结构如下：

```markdown
# <Platform> 端规范

## 技术约束
- 支持的 OS / 浏览器 / 运行环境版本
- 框架与依赖约束
- 包体积 / 首屏性能 / 内存等硬指标

## 各阶段扩展规则

### 01. Specify 扩展
- Entry Criteria: ...
- Deliverables: ...
- Exit Gate Items: ...

### 02. Design 扩展
...（同上结构，按需填写）

## 质量检查清单
- [ ] 检查项 1
- [ ] 检查项 2
```

### 各端关键扩展规则示例

#### APP 端

| 阶段 | 扩展内容 |
|------|---------|
| **01. Specify** | 明确最低支持 OS 版本、离线场景需求、推送通知需求 |
| **02. Design** | 本地缓存策略、网络异常处理方案、包体积预算 |
| **03. Plan** | 多机型适配测试任务、App Store / 应用市场审核准备 |
| **04. Implement** | 内存泄漏检测、ANR/卡顿监控埋点 |
| **05. Verify** | 真机测试矩阵（Top 20 机型）、弱网测试、电量消耗测试 |

#### H5 端

| 阶段 | 扩展内容 |
|------|---------|
| **01. Specify** | 明确目标浏览器范围、SEO 需求、响应式断点需求 |
| **02. Design** | 首屏加载性能预算（LCP < 2.5s）、SSR/CSR 策略、CDN 方案 |
| **03. Plan** | 浏览器兼容性测试任务、无障碍（a11y）验收任务 |
| **04. Implement** | Bundle Size 监控、图片懒加载、关键 CSS 内联 |
| **05. Verify** | 浏览器兼容性矩阵测试、Lighthouse 评分达标、Core Web Vitals |

#### PC 端

| 阶段 | 扩展内容 |
|------|---------|
| **01. Specify** | 明确支持的操作系统版本、窗口尺寸范围、快捷键需求 |
| **02. Design** | 跨平台方案（Electron/原生）、自动更新策略、本地存储方案 |
| **03. Plan** | 多 OS 安装包构建任务、签名与公证任务 |
| **04. Implement** | 内存占用监控、进程管理、系统 API 调用安全审查 |
| **05. Verify** | 多 OS 兼容性测试（Win/Mac/Linux）、安装/卸载/升级流程测试 |

#### Java Backend 端

| 阶段 | 扩展内容 |
|------|---------|
| **01. Specify** | 明确 SLA 要求（可用性、响应时间）、数据一致性级别 |
| **02. Design** | API 契约先行（OpenAPI）、数据库设计评审、缓存策略、幂等性设计 |
| **03. Plan** | 数据迁移任务、灰度发布方案、监控告警配置任务 |
| **04. Implement** | SQL Review、连接池配置、日志规范、异常处理规范 |
| **05. Verify** | 压力测试（TPS 达标）、慢 SQL 扫描、API 契约一致性校验、安全扫描 |

### 跨端协作机制

#### 协作锚点：API 契约

```
          ┌──────────┐
          │ contracts/ │  ← 唯一真理源
          │ *.yaml    │
          └─────┬─────┘
                │
    ┌───────────┼───────────┐
    │           │           │
    ▼           ▼           ▼
  APP 端      H5 端     PC 端
 (消费方)    (消费方)   (消费方)
                │
                ▲
                │
          Backend 端
           (提供方)
```

**跨端协作规则**：

| 规则 | 说明 |
|------|------|
| **契约先行** | Backend 在 02. Design 阶段产出 API 契约，前端各端基于契约并行开发 |
| **契约变更通知** | API 契约变更必须通知所有消费方，走 Change-Management |
| **Mock 驱动** | 契约确定后，前端可基于 Mock Server 并行开发，不阻塞后端进度 |
| **联调窗口** | 04. Implement 阶段末尾预留跨端联调时间 |
| **端间 Gate** | 涉及多端的 Feature，Verify 阶段需各端代表共同签署 UAT |

---

## 修订后的目录结构

基于三层规范体系，重新设计目录结构（同时解决审查报告 P1-4）。

```
project-root/
├── constitution.md                    # 项目级：项目宪法（Layer 0）
├── platform-rules/                    # 项目级：各端规范（Layer 2）
│   ├── app-rules.md
│   ├── pc-rules.md
│   ├── h5-rules.md
│   └── backend-rules.md
│
└── specs/                             # Feature 级产物根目录
    ├── 001-user-auth/                 # Feature 编号 + 名称
    │   ├── spec.md                    # 需求规格
    │   ├── impact-analysis.md         # Mode I 专属：影响分析
    │   ├── research.md                # 技术调研（解决 P0-2）
    │   ├── plan.md                    # 技术设计
    │   ├── contracts/                 # API 契约
    │   │   └── *.yaml
    │   ├── data-model.md              # 数据模型
    │   ├── tasks.md                   # 任务清单
    │   ├── checklist.md               # 验证清单（解决 P1-1）
    │   ├── adr/                       # 架构决策记录
    │   │   └── *.adr.md
    │   ├── tests/                     # 测试用例
    │   │   └── *.test.md
    │   ├── rfc/                       # 变更请求
    │   │   └── *.rfc.md
    │   ├── regression-report.md       # Mode I 专属：回归报告
    │   └── retro.md                   # 复盘报告
    │
    └── 002-payment/                   # 下一个 Feature
        └── ...
```

**与 v2.0 目录结构的关键变化**：

| 变化 | v2.0 | 修订后 | 理由 |
|------|------|--------|------|
| constitution.md 位置 | Feature 目录内 | 项目根目录 | Constitution 是项目级产物（P1-4） |
| Feature 目录前缀 | `feature-name/` | `specs/NNN-feature-name/` | 对齐 Spec-Kit 规范（P1-4） |
| 新增 platform-rules/ | 无 | 项目根目录 | Layer 2 端规范存放位置 |
| 新增 research.md | 无 | Feature 目录内 | 解决 P0-2 Research 缺失 |
| 新增 checklist.md | 无 | Feature 目录内 | 解决 P1-1 Checklist 缺失 |
| 新增 impact-analysis.md | 无 | Feature 目录内 | Mode I 专属产物 |
| 新增 regression-report.md | 无 | Feature 目录内 | Mode I 专属产物 |

---

## 执行时合并流程

Feature 启动时，按以下步骤生成该 Feature 的定制化流程实例：

```
Step 1: 确定 Mode（N / I）
  └─ 新功能 → Mode N
  └─ 基于已有功能变更 → Mode I

Step 2: 确定 Size（S / M / L）
  └─ 按 5 维度判定标准取最高级别

Step 3: 确定涉及端（APP / PC / H5 / Backend）
  └─ 可涉及多端

Step 4: 合并规则
  └─ Layer 0（7+3 流程骨架）
    + Layer 1（Mode × Size 对应的产出物深度）
    + Layer 2（涉及端的扩展规则合并）
  = 该 Feature 的定制化流程实例
```

**合并示例**：

> Feature: "给用户管理增加批量导入功能"
> - Mode: I（Iteration - Enhancement）
> - Size: M（3 个接口变更 + 1 个新增表）
> - 涉及端: H5 + Backend
>
> 合并结果：
> - 走 Mode I 流程（含 Impact Analysis + 回归验证）
> - 产出物深度为 M 级（标准 spec + 标准 plan + tasks 含依赖标注）
> - 合并 H5 端规则（浏览器兼容性测试、Bundle Size 监控）
> - 合并 Backend 端规则（SQL Review、API 契约校验、压力测试）

---

## 与审查报告的关系映射

本设计方案直接回应了 `review-spec-first-v2.md` 中的以下审查问题：

| 审查编号 | 问题 | 本方案的解决方式 |
|---------|------|----------------|
| **P0-1** | Init 阶段项目级/Feature 级定位模糊 | Constitution 移至项目根目录（项目级），Feature 从 Specify 开始；Init 降级为"Feature Kickoff" |
| **P1-3** | 轻量模式定义过于粗糙 | 用 Size S/M/L 替代"跳过阶段"，每个阶段产出物深度可调 |
| **P1-4** | 目录结构与业界不一致 | 采用 `specs/<NNN-feature-name>/` 结构，对齐 Spec-Kit |
| **P0-2** | Design 缺少 Research | 目录结构中新增 `research.md`，Design 阶段增加 Research 子步骤 |
| **P1-1** | 缺少 Checklist 概念 | 目录结构中新增 `checklist.md`，Plan 阶段产出 |

**未在本方案中解决的审查问题**（需在后续版本中处理）：

| 审查编号 | 问题 | 建议处理方式 |
|---------|------|-------------|
| P0-3 | Analyze 触发时机不完整 | 在 v2.1 主文档中扩展为 5 个触发时机 |
| P1-2 | 产出物格式策略缺乏论证 | 独立设计文档，定义 Markdown vs YAML 策略 |
| P1-5 | 缺少 Git 分支管理策略 | 独立设计文档，定义分支命名与生命周期 |
| P2-1 ~ P2-5 | 5 个优化项 | 按优先级渐进引入 |

---

## 风险提醒

### 1. 三层合并的复杂度

三层规范体系的优势是灵活性，但风险是合并逻辑可能过于复杂。

**应对**：初期手动合并（人脑判断），验证模型可行后再考虑工具化自动合并。

### 2. 端规范的维护成本

各端独立维护 `<platform>-rules.md`，可能出现长期不更新导致规范腐化。

**应对**：每季度做一次端规范 Review，由各端 Tech Lead 负责。

### 3. Mode 判定的灰色地带

部分 Feature 可能同时包含新功能和迭代（如"新增模块 + 改造已有模块的交互"）。

**应对**：按主要工作量判定 Mode。如果新功能占比 > 60%，走 Mode N；否则走 Mode I。边界模糊时由 Tech Lead 裁定。

### 4. Size 判定的主观性

5 维度判定标准中，部分维度（如"跨团队依赖"）可能存在主观判断。

**应对**：Size 判定在 Init 阶段完成，由 PM + Tech Lead 共同确认，记录在 Feature 元数据中。

---

## 下一步建议

1. **审阅本方案**：确认三层架构、双模式定义、多端扩展机制是否符合团队实际
2. **合并至 v2.1**：将本方案与 v2.0 主文档合并，产出 spec-first-v2.1.md
3. **试点验证**：选择一个 Mode I + M 规模 + 多端的 Feature 试跑，验证合并流程可行性
4. **端规范补录**：各端 Tech Lead 按模板补录 `<platform>-rules.md`

---

**作者**: Leo (况雨平)
**文档版本**: v1.0
**创建日期**: 2026-02-06
**关联文档**: spec-first-v2.md, review-spec-first-v2.md

