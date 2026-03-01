# 质量门禁与 Hook 体系设计（M3 GateEngine）

> **版本**: v1.0 | **日期**: 2026-02-08 | **作者**: Leo (况雨平)
> **审核**: 架构专家(Arch) / 研发效能专家(DevEff) / 质量保障专家(QA) 三方会审
> **输入**: 00-概要设计.md §4.1 M3 子系统定义
> **状态**: 初稿

---

## 目录

- [1. 模块职责与边界](#1-模块职责与边界)
- [2. 双层 Hook 体系设计](#2-双层-hook-体系设计)
- [3. Gate 条件评估引擎](#3-gate-条件评估引擎)
- [4. SCA 一致性校验引擎](#4-sca-一致性校验引擎)
- [5. 阻断与放行策略](#5-阻断与放行策略)
- [6. 核心数据结构](#6-核心数据结构)
- [7. 核心接口定义](#7-核心接口定义)
- [8. 错误处理与边界场景](#8-错误处理与边界场景)
- [9. 专家会审总结](#9-专家会审总结)

---

## 1. 模块职责与边界

### 1.1 核心职责

| 职责 | 说明 |
|------|------|
| **双层 Hook 调度** | 管理 Layer A（AI Runtime）和 Layer B（Git/CI）两层 Hook 的注册、触发和结果收集 |
| **Gate 条件评估** | 接收 M1 传入的 Gate 条件列表，逐项执行校验（自动/人工/混合），返回 PASS/FAIL |
| **SCA 一致性校验** | 5 个时机的跨产物一致性校验（Spec-Consistency-Analysis），检测 ID 追踪链断裂 |
| **阻断与放行** | 根据校验结果决定阻断（拒绝操作）或放行（允许继续），支持人工终审覆盖 |
| **Gate 历史记录** | 每次 Gate 评估结果追加写入 `gate-history.jsonl`，支撑返工率统计 |

### 1.2 模块边界

```
                    ┌──────────────────────────────┐
                    │   M3 GateEngine               │
                    │                              │
  输入              │  ┌────────────────────────┐  │  输出
  ─────────────────▶│  │ Hook Dispatcher        │  │──▶ Hook 触发结果
  Gate 条件列表     │  │ (双层 Hook 调度器)      │  │
  产出物文件        │  └────────┬───────────────┘  │
  Git 事件          │           │                   │
                    │  ┌────────▼───────────────┐  │
                    │  │ Gate Evaluator          │  │──▶ Gate 评估结果
                    │  │ (Gate 条件评估器)        │  │
                    │  └────────┬───────────────┘  │
                    │           │                   │
                    │  ┌────────▼───────────────┐  │
                    │  │ SCA Engine              │  │──▶ 一致性报告
                    │  │ (一致性校验引擎)         │  │
                    │  └────────────────────────┘  │
                    └──────────────────────────────┘
```

### 1.3 与其他模块的接口

| 调用方 | 接口 | 说明 |
|--------|------|------|
| M1 → M3 | `evaluateGate(stage, featureId, conditions)` | 流程引擎触发 Gate 评估，传入条件列表 |
| M3 → M1 | `getCurrentStage(featureId)` | Gate 校验时查询当前阶段 |
| M3 → M2 | `validateId(id)` | Gate 条件中的 ID 格式校验 |
| M3 → M2 | `getCoverage(featureId, type)` | Gate 条件中的覆盖率查询 |
| M3 → M7 | `runHookScript(hookType, context)` | 调用具体的 Hook 脚本执行校验 |
| M7 → M3 | `getGateHistory(featureId)` | CI Pipeline 查询 Gate 历史，生成度量报告 |
| M6 → M3 | `getGateHistory(featureId)` | 度量采集时获取 Gate 通过率、返工率数据 |

### 1.4 专家会审记录

> **[Arch]**: M3 是「质量守门人」——所有产出物的合规性校验都经过 M3。M3 不做流程编排（M1 的职责），不做数据计算（M2 的职责），只负责「校验执行」和「结果判定」。双层 Hook 的调度是 M3 的独特能力——Layer A 和 Layer B 通过统一的 Hook Dispatcher 管理，对上层透明。
> **[DevEff]**: Hook 的执行性能是开发者体验的关键瓶颈。commit-msg Hook 必须 < 2s，pre-push Hook 必须 < 10s。超时的 Hook 会被开发者用 `--no-verify` 绕过，失去防线意义。建议 M3 内置 Hook 执行超时机制和性能监控。
> **[QA]**: Gate 历史记录（`gate-history.jsonl`）是质量度量的核心数据源——返工率、Gate 首次通过率、各阶段平均 Gate 尝试次数都从这里计算。必须确保每次 Gate 评估（无论 PASS 还是 FAIL）都有完整记录。
> **[决议]**: M3 定位为「质量守门人」，提供 Hook 调度 + Gate 评估 + SCA 校验三大能力。Hook 执行内置超时机制。Gate 历史记录完整性作为 M3 的核心不变量。

---

## 2. 双层 Hook 体系设计

### 2.1 体系总览

```
┌─────────────────────────────────────────────────────────────────┐
│                     双层 Hook 体系                                │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Layer A — AI Runtime Hook（可选，仅 AI 辅助场景）        │   │
│  │                                                         │   │
│  │  ┌──────────┐  ┌───────────┐  ┌──────────┐            │   │
│  │  │PreToolUse│  │PostToolUse│  │   Stop   │            │   │
│  │  │写操作前   │  │写操作后    │  │会话结束   │            │   │
│  │  └──────────┘  └───────────┘  └──────────┘            │   │
│  │  特点：实时反馈、柔性引导、可自动修正                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼ 产出物写入文件系统                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Layer B — Git/CI Hook（必须，所有场景均生效）             │   │
│  │                                                         │   │
│  │  ┌──────────┐  ┌───────────┐  ┌──────────────────┐    │   │
│  │  │commit-msg│  │ pre-push  │  │  CI Pipeline     │    │   │
│  │  │提交时     │  │推送前      │  │  PR 创建/更新时   │    │   │
│  │  └──────────┘  └───────────┘  └──────────────────┘    │   │
│  │  特点：刚性阻断、最终防线、不可绕过（CI 兜底）             │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

**核心设计原则**：

| 原则 | 说明 |
|------|------|
| **Layer 独立** | Layer A 不存在时，Layer B 独立承载全部 Gate 校验 |
| **Layer 叠加** | AI 场景下两层叠加，Layer A 实时反馈 + Layer B 最终防线 |
| **柔性 + 刚性** | Layer A 柔性引导（提示修正），Layer B 刚性阻断（拒绝操作） |
| **性能优先** | Hook 执行有严格超时限制，超时降级而非阻断 |

### 2.2 Layer A — AI Runtime Hook

Layer A 依赖 Claude Code Hooks 机制，仅在 AI 辅助开发场景下生效。

#### Hook 类型与触发时机

| Hook 类型 | 触发时机 | 校验内容 | 阻断行为 |
|----------|---------|---------|---------|
| **PreToolUse** | AI 执行写操作前（write_to_file, edit_file） | 当前阶段前置 Gate 是否满足；目标文件是否属于当前阶段产出物 | 柔性：提示 AI 修正操作，不强制阻断 |
| **PostToolUse** | AI 执行写操作后 | 产出物 ID 格式校验；traces/verifies 引用完整性；`[AI-GENERATED]` 标记 | 柔性：提示 AI 补充缺失项 |
| **Stop** | AI 会话结束时 | 三文件完成度校验；追踪矩阵与产出物同步；AI 统计数据采集 | 信息性：输出校验摘要，不阻断 |

#### PreToolUse 校验流程

```
AI 请求写操作（write_to_file / edit_file）
    │
    ▼
解析目标文件路径，判断所属阶段
    │
    ├── 文件属于当前阶段产出物 → 允许
    │
    ├── 文件属于已完成阶段产出物 → 警告：建议走 RFC 变更流程
    │
    └── 文件属于未来阶段产出物 → 阻断：提示当前阶段未完成
```

**文件-阶段映射表**：

| 文件路径模式 | 所属阶段 |
|------------|---------|
| `spec.md`, `research.md` | 01 Specify |
| `design.md`, `contracts/*.yaml`, `data-model.md` | 02 Design |
| `tasks.md`, `checklist.md` | 03 Plan |
| `src/**`, `tests/unit/**` | 04 Implement |
| `tests/*.test.md`, `reports/test-report.md` | 05 Verify |
| `retro.md`, `release-note.md` | 06 Wrap-up |

#### PostToolUse 校验流程

```
AI 写操作完成
    │
    ▼
读取写入内容，提取所有 ID
    │
    ├── ID 格式校验 → 调用 M2.validateId()
    │   ├── 合法 → 继续
    │   └── 不合法 → 提示 AI 修正（输出正确格式）
    │
    ├── traces/verifies 引用校验
    │   ├── 引用的 ID 存在 → 继续
    │   └── 引用的 ID 不存在 → 提示 AI 补充或修正
    │
    └── AI 标记校验
        ├── AI 生成内容含 [AI-GENERATED] → 继续
        └── 缺少标记 → 自动追加标记
```

### 2.3 Layer B — Git/CI Hook

Layer B 是所有开发场景的必备防线，不依赖 AI Runtime。

#### Hook 类型与触发时机

| Hook 类型 | 触发时机 | 校验内容 | 超时限制 | 阻断行为 |
|----------|---------|---------|---------|---------|
| **pre-commit** | `git commit` 前（暂存文件） | 暂存文件中的 ID 格式校验（Regex lint） | 2s | 刚性：拒绝提交 |
| **commit-msg** | `git commit` 时 | Commit message 含合法 ID 标签（阶段感知） | 2s | 刚性：拒绝提交 |
| **pre-push** | `git push` 前 | 增量 SCA 校验（基于 `git diff`） | 10s | 刚性：拒绝推送 |
| **CI Pipeline** | PR 创建/更新时 | 全量 SCA + 覆盖率 + Gate 条件 | 120s | 刚性：Block PR merge |

#### pre-commit ID 格式校验

pre-commit Hook 扫描 `git diff --cached` 中的暂存文件内容，校验文件内出现的 ID 引用格式是否合法。与 commit-msg 互补：pre-commit 校验**文件内容中的 ID**，commit-msg 校验**提交消息中的 ID 标签**。

**校验范围**：仅扫描以下文件类型中的 ID 引用：

| 文件类型 | 扫描的 ID 类型 | 示例 |
|---------|--------------|------|
| `*.md` | FR、NFR、DS、TASK、TC、ADR、RFC | `FR-AUTH-001`、`TASK-AUTH-002` |
| `*.yaml` / `*.yml` | API、FR（x-traces 字段） | `API-AUTH-001` |
| 源代码文件 | TASK、FR（注释中的 traces/implements） | `// implements: TASK-AUTH-001` |

**校验算法**：

```javascript
function preCommitIdLint(stagedFiles) {
  const errors = [];
  for (const file of stagedFiles) {
    const content = readStagedContent(file);
    const ids = extractAllIds(content);  // 正则提取所有疑似 ID
    for (const id of ids) {
      const result = IdRegistry.validateId(id);
      if (!result.valid) {
        errors.push({ file, id, ...result });
      }
    }
  }
  return errors;
}
```

**设计要点**：
- 仅校验 ID **格式**合法性（正则匹配），不校验 ID 是否已在矩阵中注册（避免跨文件依赖导致超时）
- 检测疑似 ID 但格式不合法时（如 `FR-auth-001` 大小写错误），输出修正建议
- 超时保护：2s 内未完成则跳过，不阻断提交（避免大文件导致卡死）

> **需求对齐**：承接 `spec-first-v5.md:2348` 中 "ID 格式校验 | Regex lint | Pre-commit" 的要求。

---

#### commit-msg 格式规则（Conventional Commits）

> **优化说明**：原阶段感知标签格式（`[SPEC-<FEAT>]`、`[DESIGN-<FEAT>]`、`[PLAN-<FEAT>]`、`[TASK-<FEAT>-NNN]`）改为 Conventional Commits 标准格式，降低开发者记忆负担。TASK ID 关联从 commit 级下沉到 PR 级（PR 描述中的 `Covers:` 区块）。

**commit-msg 格式**：

```
<type>(<scope>): <description>
```

| 字段 | 规则 | 示例 |
|------|------|------|
| `type` | `feat`, `fix`, `docs`, `refactor`, `test`, `chore` | `feat` |
| `scope` | FEAT 缩写（必须已注册） | `ADDR` |
| `description` | 简短描述，中英文均可 | `实现地址 CRUD 接口` |

**合法示例**：

```
feat(ADDR): 实现地址 CRUD 接口
docs(ADDR): 完成需求规格编写
test(ADDR): 添加地址列表 E2E 测试
fix(ADDR): 修复默认地址互斥逻辑
```

**校验算法**：

```javascript
function validateCommitMsg(message) {
  // 1. 校验 Conventional Commits 格式
  const pattern = /^(feat|fix|docs|refactor|test|chore)\(([A-Z]{2,8})\): .+/;
  const match = message.match(pattern);

  if (!match) {
    return {
      valid: false,
      hint: '期望格式: <type>(<FEAT>): <description>，如 feat(ADDR): 实现地址功能'
    };
  }

  // 2. 校验 scope 中的 FEAT 缩写是否已注册
  const feat = match[2];
  return M2.validateFeatAbbr(feat);
}
```

**TASK ID 关联方式变更**：

| 维度 | 优化前 | 优化后 |
|------|--------|--------|
| 关联粒度 | 每个 commit 必须包含 TASK ID | PR 级关联，commit 无需包含 TASK ID |
| 格式 | `[IMPL-ADDR] TASK-ADDR-001 描述` | commit: `feat(ADDR): 描述`；PR 描述: `Covers: TASK-ADDR-001, TASK-ADDR-002` |
| 校验时机 | commit-msg Hook | CI Pipeline（PR 创建/更新时） |
| 开发者摩擦 | 高（每次提交都要查 TASK ID） | 低（提交时只需 type + scope） |
| 追踪完整性 | 不变（PR 级 TASK ID 覆盖率仍为 100%） | 不变 |
```

### 2.4 Hook 性能约束与超时机制

| Hook 类型 | 超时限制 | 超时处理 | 性能优化策略 |
|----------|---------|---------|------------|
| Layer A PreToolUse | 1s | 超时跳过，允许操作 | 内存缓存阶段状态，避免文件 I/O |
| Layer A PostToolUse | 2s | 超时跳过，记录警告 | 仅校验本次写入涉及的 ID |
| Layer A Stop | 5s | 超时跳过，记录警告 | 增量校验三文件变更部分 |
| Layer B commit-msg | 2s | 超时跳过，记录警告 | 仅解析 commit message + staged files 列表 |
| Layer B pre-push | 10s | 超时跳过，记录警告 | 增量 SCA（基于 `git diff`） |
| Layer B CI Pipeline | 120s | 超时标记 FAIL | 全量校验，无优化限制 |

**超时降级策略**：

```
Hook 执行开始
    │
    ├── 正常完成（< 超时限制）→ 返回校验结果
    │
    └── 超时 → 降级处理
        ├── Layer A: 跳过校验，允许操作，输出警告
        ├── Layer B commit-msg/pre-push: 跳过校验，允许操作，输出警告
        └── Layer B CI Pipeline: 标记为 FAIL，阻断 PR merge
```

**关键约束**：本地 Hook（commit-msg / pre-push）超时时选择「放行 + 警告」而非「阻断」，原因是 CI Pipeline 作为兜底防线会做全量校验。本地 Hook 超时阻断会严重损害开发者体验。

### 2.5 专家会审记录

> **[Arch]**: 双层 Hook 的核心架构决策是「Layer 独立」——Layer B 必须能独立运行，不依赖 Layer A 的任何输出。这意味着 Layer A 和 Layer B 之间没有数据传递，各自独立校验。两层的校验范围有重叠（如 ID 格式校验），这是有意为之——冗余校验保证了任一层失效时另一层仍能兜底。
> **[DevEff]**: commit-msg Hook 的阶段感知规则是开发者体验的关键创新——不同阶段允许不同的 commit message 格式，避免了「TASK ID 在 01 阶段还不存在」的尴尬。但这也增加了 Hook 的复杂度，需要解析 staged files 列表来判断阶段。建议将阶段判断逻辑封装为独立函数，便于单元测试。
> **[QA]**: Layer A 的 PostToolUse Hook 是 AI 辅助场景下的质量第一道防线——AI 生成的内容在写入文件后立即校验，发现问题可以让 AI 自动修正。这比等到 commit-msg 时才发现问题效率高得多。但 PostToolUse 的校验范围不能太广（超时 2s），建议仅校验 ID 格式和 traces 完整性，不做覆盖率计算。
> **[决议]**: 双层 Hook 独立运行，无数据传递。commit-msg 阶段感知逻辑封装为独立可测函数。PostToolUse 仅做轻量校验（ID + traces），覆盖率留给 Gate 评估。

---

## 3. Gate 条件评估引擎

### 3.1 评估流程

```
M1 调用 evaluateGate(stage, featureId, conditions)
    │
    ▼
Gate Evaluator 接收条件列表 GateCondition[]
    │
    ▼
按条件类型分组：auto / manual / hybrid
    │
    ├── auto 条件 → 并行执行自动校验脚本
    │   ├── 覆盖率校验 → 调用 M2.getCoverage()
    │   ├── ID 格式校验 → 调用 M2.validateIds()
    │   ├── SCA 校验 → 调用 SCA Engine
    │   └── 文件存在性校验 → 检查产出物文件
    │
    ├── manual 条件 → 检查签核记录是否存在
    │   ├── 解析产出物文件中的 Sign-off 区块
    │   └── 校验签核人是否为 Gate Owner
    │
    └── hybrid 条件 → 先自动校验，通过后检查人工签核
        ├── 自动部分未通过 → 直接 FAIL
        └── 自动部分通过 → 检查人工签核记录
    │
    ▼
汇总所有条件结果 → 生成 GateResult
    │
    ├── 全部 PASS → verdict = "PASS"
    ├── 任一 FAIL → verdict = "FAIL"
    └── 超时 → verdict = "TIMEOUT"
    │
    ▼
写入 gate-history.jsonl（追加模式）
    │
    ▼
返回 GateResult 给 M1
```

### 3.2 4 道关键 Gate 条件详表

> **优化说明**：原 8 道 Gate（每阶段一道）精简为 4 道关键 Gate，减少流程摩擦。Init/Specify 的校验内联到 CLI 命令中，Plan/Wrap-up 的校验合并到相邻 Gate。

#### Gate 1: Design Ready（设计就绪 — 编码前最后关卡）

> 合并原 00 Init + 01 Specify + 02 Design 三道 Gate，在设计完成后统一校验。

| 条件 ID | 条件描述 | 类型 | 阈值/判定 | Gate Owner |
|---------|---------|------|----------|------------|
| `spec_signoff` | Spec Sign-off | manual | spec.md 末尾 Sign-off 区块存在 | Tech Lead |
| `no_clarification` | 无歧义标记 | auto | spec.md 中零 `[NEEDS CLARIFICATION]` / `[TBD]` | Tech Lead |
| `all_id_assigned` | 所有 FR/NFR 已分配 ID | auto | 提取的 FR/NFR 数量 = 矩阵行数 | Tech Lead |
| `design_review` | Design Review 通过 | manual | design.md Sign-off 区块存在 | Tech Lead / Architect |
| `api_coverage` | API 覆盖率 = 100% | auto | C2 指标 = 100% | Tech Lead / Architect |
| `sca_design` | SCA 一致性校验 | auto | 合并 SCA#1（spec 内部）+ SCA#2（spec↔design） | Tech Lead / Architect |

> **Init 阶段校验**：目录结构就绪（`dir_ready`）、FEAT 缩写注册（`feat_registered`）、Mode/Size 确认（`meta_confirmed`）改为 `spec-first init feature` 命令的内联校验，不再作为独立 Gate 条件。

#### Gate 2: Code Ready（代码就绪 — 测试前关卡）

> 合并原 03 Plan + 04 Implement 两道 Gate，在编码完成后统一校验。

| 条件 ID | 条件描述 | 类型 | 阈值/判定 | Gate Owner |
|---------|---------|------|----------|------------|
| `task_coverage` | Task 覆盖率 = 100% | auto | C1 指标 = 100% | Tech Lead |
| `task_compliance` | Task 合规率 = 100% | auto | C6 指标 = 100% | Tech Lead |
| `code_cr` | Code Review 通过 | hybrid | 自动 lint 通过 + 人工 CR Sign-off | Tech Lead / Peer |
| `pr_task_link` | PR 关联 TASK ID | auto | PR 描述中 `Covers:` 区块包含合法 TASK ID，覆盖率 = 100% | Tech Lead / Peer |
| `code_coverage` | 单元测试代码覆盖率 | auto | 行覆盖率 ≥ 80% | Tech Lead / Peer |
| `sca_code` | SCA 一致性校验 | auto | 合并 SCA#3（spec↔tasks）+ SCA#4（spec↔code） | Tech Lead / Peer |

> **变更说明**：原 `pr_compliance`（C8 commit 级 TASK ID）改为 `pr_task_link`（PR 级 TASK ID 关联），降低开发者日常摩擦。

#### Gate 3: Release Ready（发布就绪 — 上线前关卡）

> 合并原 05 Verify + 06 Wrap-up 两道 Gate，在测试验证完成后统一校验。

| 条件 ID | 条件描述 | 类型 | 阈值/判定 | Gate Owner |
|---------|---------|------|----------|------------|
| `uat_signoff` | UAT Sign-off | manual | UAT 签核记录存在 | QA Lead + PM |
| `test_coverage_fr` | Test 覆盖率(FR级) = 100% | auto | C3 指标 = 100% | QA Lead + PM |
| `security_clear` | 安全无高危漏洞 | auto | 基础：OWASP Top 10 + SCA 扫描无 High/Critical；**上浮**：当 Feature 含 NFR-SEC-* 需求时，追加 SAST 静态扫描（无论 Size） | QA Lead + PM |
| `matrix_final` | 追踪矩阵终审 | auto | 矩阵全 🎯/🚫，无 ❌ Not Implemented；C5 实现覆盖率 = 100%；C9 孤儿率 = 0% | Tech Lead |
| `sca_test` | SCA 一致性校验 | auto | SCA#5（spec↔test），所有 AC 有对应 TC 且通过 | QA Lead + PM |

#### Gate 4: Go Live（上线终审 — 发布最终关卡）

> 保留原 07 Gate 4: Go Live，精简为发布核心条件。

| 条件 ID | 条件描述 | 类型 | 阈值/判定 | Gate Owner |
|---------|---------|------|----------|------------|
| `smoke_test` | Smoke Test 通过 | hybrid | 自动执行 + 人工确认结果 | Tech Lead + Ops |
| `release_signoff` | 发布签核 | manual | 发布签核记录存在 | Tech Lead + Ops |

#### 优化前后对比

| 指标 | 优化前（8 Gate） | 优化后（4 Gate） | 变化 |
|------|-----------------|-----------------|------|
| Gate 数量 | 8 道 | 4 道 | -50% |
| Gate 条件总数 | 32 个 | 20 个 | -38% |
| SCA 校验次数 | 5 次独立触发 | 3 次合并触发 | -40% |
| 人工签核次数 | 8 次 | 4 次 | -50% |
| 阶段转换摩擦 | 每阶段必须过 Gate | 仅关键节点过 Gate | 大幅降低 |

### 3.3 安全 Gate 动态上浮规则（NFR-SEC）

当 Feature 的追踪矩阵中包含 `NFR-SEC-*` 类型的非功能需求时，`security_clear` Gate 条件自动上浮，追加 SAST 静态扫描要求。此规则**无论 Feature Size**（S/M/L）均生效。

**判定逻辑**：

```
function resolveSecurityChecks(featureId):
  baseChecks = ['OWASP_TOP_10', 'SCA']
  hasNfrSec = traceMatrix.hasNfrType(featureId, 'NFR-SEC-*')
  if hasNfrSec:
    baseChecks.push('SAST')   // 风险上浮：追加 SAST 静态扫描
  return { checks: baseChecks, threshold: 'NO_HIGH_CRITICAL' }
```

**上浮矩阵**：

| 场景 | Size | NFR-SEC | 安全检查项 |
|------|------|---------|-----------|
| 普通 Feature | S/M/L | 无 | OWASP Top 10 + SCA |
| 含安全需求 Feature | S/M/L | 有 | OWASP Top 10 + SCA + **SAST** |

> **对齐依据**：`spec-first-v5.md:1945` — "当 Feature 存在 NFR-SEC-* 类型的非功能需求时，无论 Size 大小，SAST 静态扫描为必须项"

### 3.4 Sign-off 记录检测机制

人工签核（manual）类条件通过解析产出物文件中的 Sign-off 区块来判定：

**Sign-off 区块标准格式**：

```markdown
---
## Sign-off

| 角色 | 签核人 | 日期 | 结论 |
|------|--------|------|------|
| Tech Lead | Leo | 2026-02-08 | APPROVED |
| Architect | — | — | — |

> 签核说明：需求完整，无歧义，ID 已分配。
---
```

**检测算法**：

```javascript
function detectSignoff(filePath, requiredRoles) {
  const content = readFile(filePath);

  // 1. 定位 Sign-off 区块（## Sign-off 标题）
  const signoffSection = extractSection(content, 'Sign-off');
  if (!signoffSection) {
    return { found: false, reason: 'Sign-off 区块不存在' };
  }

  // 2. 解析表格，提取已签核的角色
  const table = parseMarkdownTable(signoffSection);
  const approvedRoles = table
    .filter(row => row['结论'] === 'APPROVED')
    .map(row => row['角色']);

  // 3. 校验必要角色是否全部签核
  const missing = requiredRoles.filter(r => !approvedRoles.includes(r));

  return {
    found: true,
    allApproved: missing.length === 0,
    approvedRoles,
    missingRoles: missing,
  };
}
```

**各 Gate Sign-off 必要角色**：

| Gate | 产出物文件 | 必要签核角色 |
|------|-----------|------------|
| Gate 1: Design Ready | `spec.md` + `design.md` | Tech Lead；L 规模追加 Architect |
| Gate 2: Code Ready | CR Report（PR 描述） | Tech Lead 或 Peer |
| Gate 3: Release Ready | Test Report | QA Lead + PM |
| Gate 4: Go Live | Release Note | Tech Lead + Ops |

### 3.5 专家会审记录

> **[Arch]**: Gate 条件详表是 M3 的核心配置——每个阶段的条件 ID、类型、阈值都是确定性的，不允许运行时动态修改。条件的增减通过 `config.yaml` 的 Layer 1/Layer 2 规则实现（如 Size S 可豁免 AC 级覆盖率），但条件 ID 本身是稳定的。Sign-off 检测通过解析 Markdown 表格实现，这与 M2 的 ID 提取逻辑一致——纯文本解析，不依赖外部服务。
> **[DevEff]**: 32 个 Gate 条件中，auto 类占 60%+，这意味着大部分 Gate 校验可以自动完成，开发者只需关注 manual 类的签核操作。建议 CLI 在 Gate 失败时按条件逐项列出状态（✅/❌），开发者一眼就能看到哪些条件未满足。Sign-off 区块的标准格式需要在模板文件中预置，降低手动编写的出错率。
> **[QA]**: hybrid 类条件（如 `code_cr`、`archive_checklist`、`smoke_test`）的评估顺序很重要——必须先通过自动校验，再检查人工签核。这避免了「人工签核了但自动校验未通过」的不一致状态。建议 hybrid 条件的评估结果中同时记录自动部分和人工部分的状态，便于审计。
> **[决议]**: Gate 条件 ID 稳定不变，增减通过 Layer 1/Layer 2 配置。CLI 输出逐项条件状态。hybrid 条件严格「先自动后人工」顺序。Sign-off 模板预置在 `.spec-first/templates/` 中。

---

## 4. SCA 一致性校验引擎

### 4.1 SCA 概述

SCA（Spec-Consistency-Analysis）是跨产物一致性校验的核心机制，确保各阶段产出物之间的 ID 追踪链完整、无断裂。

**核心原则**：不一致项必须在当前阶段修复，不得带入下一阶段。

### 4.2 3 次合并触发时机与校验范围

> **优化说明**：原 5 次独立 SCA 触发合并为 3 次，与 4 道关键 Gate 对齐。每次 SCA 合并相邻阶段的校验内容，减少重复加载和校验开销。

| # | 时机 ID | 对应 Gate | 校验范围 | 合并的原 SCA | 校验内容 |
|---|---------|----------|---------|-------------|---------|
| 1 | `sca_design` | Gate 1: Design Ready | spec 内部 + spec ↔ design | SCA#1 + SCA#2 | AC 覆盖所有 FR；NFR 有量化指标；每个 FR 有 DS 引用；需接口的 FR 有 API 引用 |
| 2 | `sca_code` | Gate 2: Code Ready | spec ↔ tasks + spec ↔ code | SCA#3 + SCA#4 | Task 覆盖率 = 100%；Task 合规率 = 100%；PR TASK 关联覆盖率 = 100%；API 实现与契约一致 |
| 3 | `sca_test` | Gate 3: Release Ready | spec ↔ test | SCA#5 | Test 覆盖率 = 100%；所有 AC 有对应 TC 且通过 |

### 4.3 SCA 校验流程

```
SCA 校验触发（Gate 评估 或 pre-push Hook）
    │
    ▼
确定当前 SCA 时机（sca_design / sca_code / sca_test）
    │
    ▼
加载校验范围内的产出物文件
    │
    ├── sca_design: 加载 spec.md + design.md + contracts/*.yaml
    ├── sca_code:   加载 spec.md + tasks.md + PR 列表 + contracts/*.yaml
    └── sca_test:   加载 spec.md + tests/*.test.md
    │
    ▼
提取所有 ID 及其 traces/verifies 引用关系
    │
    ▼
构建 ID 引用图（有向图）
    │
    ▼
执行校验规则（按时机不同）
    │
    ├── 正向检查：每个源 ID 是否有目标 ID 引用
    ├── 反向检查：每个目标 ID 是否有源 ID 追溯
    └── 覆盖率计算：调用 M2.getCoverage()
    │
    ▼
生成 SCA Report
    │
    ├── 全部通过 → PASS
    └── 存在不一致 → FAIL + 不一致项清单
```

### 4.4 各时机校验规则详述

#### sca_design 校验规则（Gate 1: Design Ready）

**Part A — spec 内部一致性（原 SCA#1）**

```javascript
function sca1_specInternal(specContent) {
  const checks = [];

  // 规则 1: 每个 FR 至少有 1 个 AC
  const frs = extractIds(specContent, 'FR');
  for (const fr of frs) {
    const acs = extractACsForFR(specContent, fr.id);
    if (acs.length === 0) {
      checks.push({ rule: 'FR_HAS_AC', id: fr.id, passed: false,
        message: `${fr.id} 缺少 AC（验收标准）` });
    }
  }

  // 规则 2: 每个 NFR 有量化指标（含数字或百分比）
  const nfrs = extractIds(specContent, 'NFR');
  for (const nfr of nfrs) {
    if (!hasQuantitativeMetric(nfr.description)) {
      checks.push({ rule: 'NFR_QUANTIFIED', id: nfr.id, passed: false,
        message: `${nfr.id} 缺少量化指标` });
    }
  }

  // 规则 3: FR 间无逻辑矛盾（基于关键词检测，非语义理解）
  const contradictions = detectContradictions(frs);
  checks.push(...contradictions);

  return checks;
}
```

**Part B — spec ↔ design 一致性（原 SCA#2）**

| 校验规则 | 源 | 目标 | 判定条件 |
|---------|-----|------|---------|
| 每个 FR 有设计方案 | spec.md 中的 FR | design.md 中的 DS | 矩阵 Design Ref 列非空 |
| 需接口的 FR 有 API | spec.md 中需接口的 FR | contracts/*.yaml | 矩阵 API/Data Ref 列非空 |
| DS 引用的 FR 存在 | design.md 中 traces | spec.md 中的 FR | 反向引用合法 |
| API operationId 合法 | contracts/*.yaml | M2 ID 校验 | API-SVC-NNN 格式合规 |

#### sca_code 校验规则（Gate 2: Code Ready）

**Part A — spec ↔ tasks 一致性（原 SCA#3）**

| 校验规则 | 源 | 目标 | 判定条件 |
|---------|-----|------|---------|
| Task 覆盖率 = 100% | spec.md 中 Active FR/NFR | tasks.md 中 TASK | C1 = 100% |
| Task 合规率 = 100% | tasks.md 中 TASK | spec.md 中 FR/NFR | C6 = 100% |
| TASK traces 引用合法 | tasks.md 中 traces 字段 | spec.md 中 FR/NFR | 引用的 ID 存在且 Active |

**Part B — spec ↔ code 一致性（原 SCA#4）**

| 校验规则 | 源 | 目标 | 判定条件 |
|---------|-----|------|---------|
| PR 合规率 = 100% | PR 描述 | tasks.md 中 TASK | C8 = 100% |
| API 实现与契约一致 | 代码中 API 端点 | contracts/*.yaml | 路径 + 方法 + 参数匹配 |
| 代码追踪注释合法 | `// implements:` 注释 | tasks.md 中 TASK | 引用的 TASK ID 存在 |

#### sca_test 校验规则（Gate 3: Release Ready）

> 对应原 SCA#5

| 校验规则 | 源 | 目标 | 判定条件 |
|---------|-----|------|---------|
| Test 覆盖率(FR级) = 100% | spec.md 中 Active FR/NFR | tests/*.test.md 中 TC | C3 = 100% |
| TC 合规率 = 100% | tests/*.test.md 中 TC | spec.md 中 FR/NFR | C7 = 100% |
| TC verifies 引用合法 | TC 中 verifies 字段 | spec.md 中 FR/AC/NFR | 引用的 ID 存在 |
| 所有 TC 执行通过 | Test Report | TC 列表 | 无 FAIL 状态的 TC |

### 4.5 增量 SCA 与全量 SCA

| 模式 | 触发场景 | 校验范围 | 性能约束 |
|------|---------|---------|---------|
| **增量 SCA** | pre-push Hook | 仅校验 `git diff` 涉及的文件中的 ID 引用关系 | < 10s |
| **全量 SCA** | CI Pipeline / Gate 评估 | 校验全部产出物的完整 ID 引用图 | < 120s |

**增量 SCA 算法**：

```javascript
function incrementalSCA(featureId, changedFiles) {
  // 1. 从变更文件中提取涉及的 ID 集合
  const changedIds = new Set();
  for (const file of changedFiles) {
    const ids = M2.extractIds(file, readFile(file));
    ids.forEach(id => changedIds.add(id.id));
  }

  // 2. 扩展影响范围：找到引用了这些 ID 的其他 ID
  const impactedIds = new Set(changedIds);
  const matrix = M2.loadMatrix(featureId);
  for (const [entryId, entry] of matrix.entries) {
    const refs = [
      ...entry.designRef, ...entry.apiDataRef,
      ...entry.taskRef, ...entry.testCaseRef
    ];
    if (refs.some(ref => changedIds.has(ref))) {
      impactedIds.add(entryId);
    }
  }

  // 3. 仅对受影响的 ID 执行校验规则
  const stage = M1.getCurrentStage(featureId);
  const scaId = getSCAIdForStage(stage);
  return runSCAChecks(scaId, matrix, impactedIds);
}
```

**增量 vs 全量的一致性保证**：增量 SCA 可能遗漏间接影响（如 A→B→C 链路中修改 A，增量仅检查 A→B，不检查 B→C）。因此增量 SCA 仅用于 pre-push Hook 的快速反馈，CI Pipeline 始终执行全量 SCA 作为兜底。

### 4.6 专家会审记录

> **[Arch]**: SCA 引擎的核心是「ID 引用图」——将所有产出物中的 ID 和 traces/verifies 关系构建为有向图，校验就是图的连通性检查。SCA#1 是特殊的——它不做跨产物校验，而是 spec 内部的自洽性检查（AC 覆盖 FR、NFR 量化）。这需要 Markdown AST 级别的解析能力，依赖 remark/unified。
> **[DevEff]**: 增量 SCA 的性能是开发者体验的关键——pre-push 时 10s 内完成。增量算法的「影响范围扩展」步骤是性能瓶颈，建议限制扩展深度为 1 层（直接引用），不做传递闭包。传递闭包留给全量 SCA。SCA Report 的输出格式建议采用 diff 风格——标记哪些 ID 引用断裂、缺失什么，开发者可以直接定位修复。
> **[QA]**: SCA#4 的「API 实现与契约一致」校验是最复杂的——需要解析代码中的 API 路由定义，与 contracts/*.yaml 中的 OpenAPI 定义做比对。建议 MVP 阶段仅校验路径和方法匹配，参数级校验留到工具链成熟后再加。SCA#5 的「所有 TC 执行通过」需要读取 Test Report，建议 Test Report 采用结构化格式（YAML front-matter + Markdown body），便于脚本解析。
> **[决议]**: SCA 基于 ID 引用图实现。增量 SCA 影响扩展限 1 层。SCA#4 API 校验 MVP 仅做路径+方法匹配。SCA Report 采用 diff 风格输出。Test Report 采用结构化格式。

---

## 5. 阻断与放行策略

### 5.1 阻断层级模型

```
┌─────────────────────────────────────────────────────────────┐
│                    阻断层级（由柔到刚）                        │
│                                                             │
│  Level 0 — 信息提示（Informational）                         │
│  │  场景：Layer A Stop Hook 校验摘要                          │
│  │  行为：输出校验结果，不阻断任何操作                          │
│  │                                                          │
│  Level 1 — 柔性引导（Soft Block）                            │
│  │  场景：Layer A PreToolUse / PostToolUse                   │
│  │  行为：提示 AI 修正，AI 可选择忽略（但记录警告）              │
│  │                                                          │
│  Level 2 — 刚性阻断（Hard Block）                            │
│  │  场景：Layer B commit-msg / pre-push                      │
│  │  行为：拒绝操作，必须修正后重试                              │
│  │  旁路：开发者可用 --no-verify 绕过（CI 兜底）               │
│  │                                                          │
│  Level 3 — 不可绕过阻断（Enforced Block）                     │
│  │  场景：CI Pipeline Gate 校验                               │
│  │  行为：Block PR merge，无旁路                              │
│  │                                                          │
│  Level 4 — 人工终审放行（Manual Override）                     │
│     场景：Gate Owner 签核                                     │
│     行为：所有自动校验通过后，Gate Owner 人工确认放行            │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 各 Hook 阻断行为详表

| Hook | 阻断层级 | 校验失败时的行为 | 输出内容 |
|------|---------|----------------|---------|
| Layer A PreToolUse | Level 1 | 向 AI 返回阻断提示，AI 可修正操作或忽略 | 当前阶段 + 期望操作 + 修正建议 |
| Layer A PostToolUse | Level 1 | 向 AI 返回校验结果，提示补充缺失项 | 不合法 ID 列表 + 正确格式 + 缺失 traces |
| Layer A Stop | Level 0 | 输出校验摘要到终端，不阻断会话结束 | 三文件完成度 + 未同步项清单 |
| Layer B commit-msg | Level 2 | 拒绝 commit，输出错误信息到 stderr | 期望标签格式 + 当前阶段 + 示例 |
| Layer B pre-push | Level 2 | 拒绝 push，输出 SCA 校验报告 | 不一致项清单 + 修复建议 |
| CI Pipeline | Level 3 | Block PR merge，输出完整校验报告 | Gate 条件逐项状态 + SCA 报告 + 覆盖率 |
| Gate 评估 | Level 4 | 阻断阶段转换，等待修正后重新提交 | 失败条件列表 + 修复指引 + 历史记录 |

### 5.3 阻断输出格式规范

所有阻断输出遵循统一的「What-Why-How」三段式格式：

**commit-msg 阻断输出示例**：

```
❌ Commit message 校验失败

[What] Commit message 缺少合法 ID 标签
[Why]  当前阶段: 04_implement，期望标签格式: [TASK-<FEAT>-NNN]
[How]  请修改 commit message，示例:
       [TASK-AUTH-001] 实现用户登录接口

       已注册的 FEAT 缩写: AUTH, PAY, ORDER
```

**Gate 评估阻断输出示例**：

```
❌ Gate 评估未通过 — 01_specify → 02_design

条件状态:
  ✅ dor_signoff        DoR Sign-off 已签核
  ✅ no_clarification   零歧义标记
  ❌ all_id_assigned    FR-AUTH-003 未在矩阵中登记
  ❌ sca_design         NFR-PERF-001 缺少量化指标

修复指引:
  1. 在 traceability-matrix.md 中添加 FR-AUTH-003 行
  2. 为 NFR-PERF-001 补充量化指标（如 "P99 延迟 < 200ms"）

Gate 历史: 本次为第 2 次尝试（首次失败于 2026-02-08T10:30:00Z）
```

### 5.4 专家会审记录

> **[Arch]**: 5 级阻断层级模型是 M3 的核心架构决策——从 Level 0（信息提示）到 Level 4（人工终审），严格度递增。关键设计点是 Level 2（本地 Hook）可被 `--no-verify` 绕过，但 Level 3（CI Pipeline）不可绕过。这形成了「本地快速反馈 + CI 刚性兜底」的双保险。Level 4 的人工终审是最终防线——即使所有自动校验通过，Gate Owner 仍需人工确认，防止自动化盲区。
> **[DevEff]**: 阻断输出的「What-Why-How」三段式格式是开发者体验的关键——开发者看到阻断信息后，应该能在 30 秒内理解问题并知道如何修复。建议 CLI 输出时使用颜色编码（✅ 绿色、❌ 红色、⚠️ 黄色），提升可读性。Gate 评估的逐项条件状态输出让开发者一眼看到进度，避免「不知道还差什么」的焦虑。
> **[QA]**: Level 2 的 `--no-verify` 旁路是已知风险（R3），但这是 Git 的设计决策，无法在工具层面阻止。关键是 Level 3 的 CI 兜底必须 100% 可靠——CI Pipeline 的 Gate 校验失败必须 Block PR merge，不允许任何旁路。建议 CI 配置中将 Gate 校验设为 required check，即使仓库管理员也不能跳过。
> **[决议]**: 5 级阻断层级确认。输出采用「What-Why-How」三段式 + 颜色编码。CI Gate 校验设为 GitHub required check。`--no-verify` 绕过事件通过 CI 全量校验捕获并记录。

---

## 6. 核心数据结构

### 6.1 Gate 条件定义

```typescript
/** Gate 条件（从裁剪后流程实例中提取） */
interface GateCondition {
  conditionId: string;           // 如 "dor_signoff", "sca_design"
  description: string;           // 人类可读描述
  type: "auto" | "manual" | "hybrid";
  threshold?: number;            // 阈值类条件（如覆盖率 ≥ 0.8）
  coverageType?: CoverageType;   // 关联的覆盖率指标（auto 条件）
  signoffFile?: string;          // 签核文件路径（manual 条件）
  signoffRoles?: string[];       // 必要签核角色（manual 条件）
  scaId?: string;                // 关联的 SCA 时机（如 "sca_design"）
  platform?: Platform;           // Layer 2 端特有条件
}
```

### 6.2 Gate 评估结果

```typescript
/** Gate 评估结果（M3 返回给 M1） */
interface GateResult {
  verdict: "PASS" | "FAIL" | "TIMEOUT";
  stage: StageId;                // 评估的阶段
  featureId: string;
  checkedItems: GateCheckItem[]; // 逐项校验结果
  scaReport?: SCAReport;         // SCA 校验报告（如有）
  duration_ms: number;           // 评估耗时
  timestamp: string;             // ISO 8601
  attemptNumber: number;         // 第几次尝试
}

/** Gate 单项检查结果 */
interface GateCheckItem {
  conditionId: string;
  type: "auto" | "manual" | "hybrid";
  passed: boolean;
  message?: string;              // 失败时的说明
  details?: {                    // 详细数据（auto 条件）
    actual?: number;             // 实际值（如覆盖率 0.95）
    expected?: number;           // 期望值（如阈值 1.0）
    uncoveredIds?: string[];     // 未覆盖的 ID 列表
  };
  signoffInfo?: {                // 签核信息（manual 条件）
    found: boolean;
    approvedRoles: string[];
    missingRoles: string[];
  };
}
```

### 6.3 SCA 校验报告

```typescript
/** SCA 校验报告（SCA Engine 输出） */
interface SCAReport {
  scaId: string;                   // "sca_design", "sca_code", "sca_test"
  featureId: string;
  mode: "incremental" | "full";    // 增量 or 全量
  verdict: "PASS" | "FAIL";
  checks: SCACheckResult[];
  summary: {
    totalChecks: number;
    passedChecks: number;
    failedChecks: number;
  };
  duration_ms: number;
  timestamp: string;               // ISO 8601
}

/** SCA 单项校验结果 */
interface SCACheckResult {
  rule: string;                    // 规则 ID，如 "FR_HAS_AC", "TASK_TRACES_VALID"
  passed: boolean;
  sourceId?: string;               // 源 ID（校验对象）
  targetId?: string;               // 目标 ID（期望引用）
  message: string;                 // 人类可读描述
  severity: "error" | "warning";   // error = 阻断，warning = 提示
  fixSuggestion?: string;          // 修复建议
}
```

### 6.4 Hook 执行结果

```typescript
/** Hook 执行结果（Hook Dispatcher 输出） */
interface HookResult {
  hookType: HookType;
  layer: "A" | "B";
  verdict: "PASS" | "FAIL" | "SKIP" | "TIMEOUT";
  blockLevel: 0 | 1 | 2 | 3 | 4;  // 阻断层级
  checks: HookCheckItem[];
  duration_ms: number;
  timestamp: string;
}

type HookType =
  | "PreToolUse" | "PostToolUse" | "Stop"       // Layer A
  | "commit-msg" | "pre-push" | "ci-pipeline";  // Layer B

/** Hook 单项检查结果 */
interface HookCheckItem {
  checkId: string;                 // 如 "stage_match", "id_format", "traces_valid"
  passed: boolean;
  message?: string;
  autoFixed?: boolean;             // Layer A 是否已自动修正
  fixAction?: string;              // 自动修正的具体操作描述
}
```

### 6.5 gate-history.jsonl 记录格式

每次 Gate 评估（无论 PASS 还是 FAIL）都追加一条 JSON 记录到 `gate-history.jsonl`：

```jsonc
// 单条记录示例（实际存储为单行 JSON，此处展开便于阅读）
{
  "featureId": "001-user-auth",
  "stage": "01_specify",
  "attemptNumber": 2,
  "verdict": "PASS",
  "checkedItems": [
    { "conditionId": "dor_signoff", "type": "manual", "passed": true },
    { "conditionId": "no_clarification", "type": "auto", "passed": true },
    { "conditionId": "all_id_assigned", "type": "auto", "passed": true },
    { "conditionId": "sca_design", "type": "auto", "passed": true }
  ],
  "duration_ms": 1230,
  "timestamp": "2026-02-08T14:30:00Z",
  "triggeredBy": "cli",            // "cli" | "ci" | "hook"
  "operator": "Leo"                // 触发人
}
```

**存储约束**：

| 约束 | 说明 |
|------|------|
| 写入模式 | 追加写入（Append-Only），不修改历史记录 |
| 并发安全 | 采用 `flock` 排他锁 + 原子追加写入（见下方） |
| 文件位置 | `.spec-first/runtime/gate-history.jsonl` |
| 轮转策略 | 按月轮转：`gate-history-YYYY-MM.jsonl`，保留 6 个月，超期归档至 `.spec-first/runtime/archive/` |
| 查询方式 | `grep` + `jq` 按 featureId/stage 过滤 |
| 度量用途 | 返工率 = attemptNumber > 1 的比例；Gate 首次通过率 = attemptNumber = 1 且 PASS 的比例 |

**并发写入安全机制**：

多人同时 push 触发 CI 时，可能并发写入同一 JSONL 文件。采用文件锁 + 原子追加模式：

```javascript
async function appendJsonl(filePath, record) {
  const fd = await fs.open(filePath, 'a');
  try {
    await flock(fd, LOCK_EX);              // 获取排他锁
    await fs.appendFile(fd, JSON.stringify(record) + '\n');
  } finally {
    await flock(fd, LOCK_UN);              // 释放锁
    await fd.close();
  }
}
```

跨平台兼容：macOS/Linux 使用 `flock`，Windows 使用 `proper-lockfile` npm 包。

### 6.6 专家会审记录

> **[Arch]**: 数据结构设计遵循「最小充分」原则——每个接口只包含必要字段，不做过度抽象。`GateResult` 和 `SCAReport` 是 M3 的两大核心输出，前者面向 M1（流程引擎），后者面向 CI 报告和开发者终端。`HookResult` 是内部数据结构，不跨模块传递，仅用于 Hook Dispatcher 内部的结果汇总。`gate-history.jsonl` 的 Append-Only 设计保证了审计轨迹不可篡改——即使手动编辑文件，CI 全量校验也会检测到不一致。
> **[DevEff]**: `SCACheckResult` 的 `fixSuggestion` 字段是开发者体验的关键——SCA 校验失败时，不仅告诉「哪里不一致」，还告诉「怎么修」。建议 `fixSuggestion` 输出可执行的 CLI 命令或文件编辑指引。`HookCheckItem` 的 `autoFixed` 字段记录了 Layer A 的自动修正行为，便于开发者了解 AI 做了什么修改。
> **[QA]**: `gate-history.jsonl` 是度量体系的核心数据源——返工率、Gate 首次通过率、各阶段平均尝试次数都从这里计算。`triggeredBy` 字段区分了 CLI/CI/Hook 三种触发来源，便于分析哪种触发方式的通过率更高。建议在 `GateResult` 中增加 `attemptNumber` 字段（已有），确保与 `gate-history.jsonl` 中的记录一致。
> **[决议]**: 数据结构确认。`SCACheckResult.fixSuggestion` 输出可执行修复指引。`gate-history.jsonl` 保持 Append-Only，按月轮转（与 `ai-stats.jsonl` 一致），保留 6 个月。JSONL 写入采用 `flock` 排他锁确保并发安全。`HookResult` 仅内部使用，不跨模块暴露。

---

## 7. 核心接口定义

### 7.1 GateEngine 对外接口

```typescript
interface GateEngine {
  /**
   * 评估 Gate 条件（M1 调用入口）
   * 接收条件列表，逐项执行校验，返回汇总结果
   * 同时写入 gate-history.jsonl
   */
  evaluateGate(
    stage: StageId,
    featureId: string,
    conditions: GateCondition[]
  ): Promise<GateResult>;

  /**
   * 查询 Gate 历史记录（M6/M7 调用）
   * 支持按 featureId、stage、时间范围过滤
   */
  getGateHistory(
    featureId: string,
    filter?: GateHistoryFilter
  ): GateHistoryEntry[];

  /**
   * 获取 Gate 评估摘要（用于 CLI 输出和 CI 报告）
   * 格式化为 What-Why-How 三段式
   */
  formatGateReport(result: GateResult): string;
}

/** Gate 历史查询过滤器 */
interface GateHistoryFilter {
  stage?: StageId;
  verdict?: "PASS" | "FAIL" | "TIMEOUT";
  since?: string;                  // ISO 8601，起始时间
  until?: string;                  // ISO 8601，截止时间
}

/** Gate 历史条目（gate-history.jsonl 单行解析） */
interface GateHistoryEntry {
  featureId: string;
  stage: StageId;
  attemptNumber: number;
  verdict: "PASS" | "FAIL" | "TIMEOUT";
  checkedItems: GateCheckItem[];
  duration_ms: number;
  timestamp: string;
  triggeredBy: "cli" | "ci" | "hook";
  operator: string;
}
```

### 7.2 HookDispatcher 接口

```typescript
interface HookDispatcher {
  /**
   * 执行指定类型的 Hook 校验
   * 统一入口，内部根据 hookType 分发到 Layer A 或 Layer B 处理器
   */
  runHook(
    hookType: HookType,
    context: HookContext
  ): Promise<HookResult>;

  /**
   * 注册 Hook 处理器（启动时调用）
   * 支持动态注册自定义校验逻辑
   */
  registerHandler(
    hookType: HookType,
    handler: HookHandler
  ): void;

  /**
   * 获取已注册的 Hook 列表及状态
   */
  listHooks(): HookRegistration[];
}

/** Hook 执行上下文 */
interface HookContext {
  featureId: string;
  stage: StageId;
  layer: "A" | "B";
  // Layer A 特有
  toolName?: string;               // PreToolUse/PostToolUse 的工具名
  filePath?: string;               // 操作的目标文件路径
  fileContent?: string;            // PostToolUse 时的写入内容
  // Layer B 特有
  commitMessage?: string;          // commit-msg Hook
  stagedFiles?: string[];          // commit-msg Hook 的暂存文件列表
  diffFiles?: string[];            // pre-push Hook 的变更文件列表
  prNumber?: string;               // CI Pipeline 的 PR 编号
}

/** Hook 处理器函数签名 */
type HookHandler = (context: HookContext) => Promise<HookResult>;

/** Hook 注册信息 */
interface HookRegistration {
  hookType: HookType;
  layer: "A" | "B";
  timeout_ms: number;
  enabled: boolean;
}
```

### 7.3 SCAEngine 接口

```typescript
interface SCAEngine {
  /**
   * 执行全量 SCA 校验（Gate 评估 / CI Pipeline 调用）
   * 加载校验范围内的全部产出物，构建完整 ID 引用图
   */
  runFullSCA(
    scaId: string,
    featureId: string
  ): Promise<SCAReport>;

  /**
   * 执行增量 SCA 校验（pre-push Hook 调用）
   * 仅校验 git diff 涉及的文件中的 ID 引用关系
   * 影响扩展限 1 层（直接引用）
   */
  runIncrementalSCA(
    featureId: string,
    changedFiles: string[]
  ): Promise<SCAReport>;

  /**
   * 构建 ID 引用图（内部方法，供全量/增量共用）
   * 返回有向图：节点 = ID，边 = traces/verifies 关系
   */
  buildIdGraph(
    featureId: string,
    scope: string[]              // 需加载的文件路径列表
  ): IdReferenceGraph;

  /**
   * 格式化 SCA 报告（diff 风格输出）
   * 标记断裂的引用链、缺失的 ID、未覆盖的需求
   */
  formatSCAReport(report: SCAReport): string;
}

/** ID 引用图（有向图） */
interface IdReferenceGraph {
  nodes: Map<string, IdGraphNode>;   // key = ID
  edges: IdGraphEdge[];
}

/** 图节点 */
interface IdGraphNode {
  id: string;
  type: IdType;
  sourceFile: string;
  lineNumber?: number;
  status: "active" | "cancelled";
}

/** 图边（引用关系） */
interface IdGraphEdge {
  fromId: string;
  toId: string;
  relationType: "traces" | "verifies" | "implements";
  sourceFile: string;
  lineNumber?: number;
}
```

### 7.4 专家会审记录

> **[Arch]**: 三个接口职责清晰——GateEngine 管「评估与记录」，HookDispatcher 管「调度与分发」，SCAEngine 管「一致性校验」。GateEngine 是 M3 唯一的对外接口（M1 调用 `evaluateGate`，M6/M7 调用 `getGateHistory`），HookDispatcher 和 SCAEngine 是内部组件，由 GateEngine 编排调用。`IdReferenceGraph` 是 SCA 的核心数据结构——将产出物中的 ID 和引用关系建模为有向图，校验就是图的连通性和完整性检查。图的构建与校验分离，便于增量模式复用校验逻辑。
> **[DevEff]**: `HookContext` 的设计是关键——Layer A 和 Layer B 的上下文字段不同（Layer A 有 `toolName`/`fileContent`，Layer B 有 `commitMessage`/`stagedFiles`），但通过统一的 `HookContext` 接口传递，HookDispatcher 内部根据 `layer` 字段分发。这避免了两套独立的 Hook 调度逻辑。`registerHandler` 支持动态注册，便于未来扩展自定义校验（如团队特有的代码规范检查）。
> **[QA]**: `formatGateReport` 和 `formatSCAReport` 是面向开发者的输出接口——Gate 报告采用「What-Why-How」三段式，SCA 报告采用 diff 风格。两种格式都应支持终端彩色输出（ANSI escape codes）和纯文本输出（CI 日志），通过参数控制。建议增加 `outputFormat: "terminal" | "plain" | "json"` 参数，支持不同消费场景。
> **[决议]**: 三接口划分确认。GateEngine 对外，HookDispatcher/SCAEngine 内部。报告输出支持 terminal/plain/json 三种格式。HookContext 统一 Layer A/B 上下文。`registerHandler` 保留扩展能力。

---

## 8. 错误处理与边界场景

### 8.1 错误分类与处理策略

| 错误类别 | 触发场景 | 处理策略 | 用户提示 |
|---------|---------|---------|---------|
| **Hook 脚本异常** | Hook 处理器抛出未捕获异常 | 捕获异常，按超时降级策略处理（Layer A 跳过，Layer B 本地跳过/CI 标记 FAIL） | 输出异常摘要 + 建议检查 Hook 脚本 |
| **Hook 超时** | Hook 执行超过超时限制 | 强制终止，按层级降级（见 §2.4 超时降级策略） | 输出超时 Hook 类型 + 超时限制 + 建议优化 |
| **Gate 条件脚本错误** | 自动校验脚本执行失败（如文件不存在、解析错误） | 该条件标记为 FAIL，附带错误信息 | 输出失败条件 + 具体错误 + 修复建议 |
| **Gate 评估超时** | M3 整体评估超过 60s | 返回 TIMEOUT verdict，M1 回退到 active 状态 | 提示重试或检查校验脚本性能 |
| **SCA 文件加载失败** | 产出物文件不存在或格式错误 | SCA 标记为 FAIL，报告缺失/损坏的文件 | 输出缺失文件列表 + 创建模板命令 |
| **SCA ID 引用图构建失败** | ID 提取正则匹配异常或文件编码错误 | 跳过异常文件，记录警告，继续处理其余文件 | 输出跳过的文件 + 异常原因 |
| **gate-history.jsonl 写入失败** | 文件权限不足或磁盘空间不足 | Gate 评估结果正常返回，写入失败记录到 stderr | 警告：Gate 历史未记录，建议检查文件权限 |
| **Sign-off 区块解析失败** | Markdown 表格格式不标准（缺列、多余空行） | 该 manual 条件标记为 FAIL | 输出期望的 Sign-off 格式 + 模板路径 |
| **Layer A Hook 配置缺失** | `claude-hooks.json` 不存在或格式错误 | Layer A 整体跳过，Layer B 独立运行 | 信息提示：Layer A 未配置，仅 Layer B 生效 |
| **跨模块调用失败** | M3 调用 M2.validateId() 或 M2.getCoverage() 失败 | 相关 Gate 条件标记为 FAIL，附带调用错误信息 | 输出失败的跨模块调用 + 建议检查 M2 状态 |

### 8.2 边界场景处理

#### 场景 1：开发者使用 `--no-verify` 绕过本地 Hook

```
触发：git commit --no-verify 或 git push --no-verify
影响：Layer B 本地 Hook（commit-msg / pre-push）被跳过
处理：
  1. 本地 Hook 无法阻止此行为（Git 设计决策）
  2. CI Pipeline 作为 Level 3 兜底防线，执行全量 Gate 校验
  3. CI 检测到不合规提交时：
     a. Block PR merge（required check）
     b. 在 PR Comment 中输出完整校验报告
     c. 标记该 commit 为 "bypassed local hook"
  4. 度量采集：记录 --no-verify 绕过事件（通过 CI 检测 commit 无对应 Hook 记录）
风险等级：🟡 中（R3）——CI 兜底可靠，但增加了修复成本
```

#### 场景 2：Layer A 和 Layer B 校验结果不一致

```
触发：Layer A PostToolUse 校验通过，但 Layer B commit-msg 校验失败
原因：
  - Layer A 校验范围较窄（仅本次写入），Layer B 校验范围较广（全部 staged files）
  - Layer A 和 Layer B 之间无数据传递，各自独立校验
  - 时间差：Layer A 校验时文件状态与 commit 时可能不同
处理：
  1. 以 Layer B 结果为准（Layer B 是刚性防线）
  2. 不视为系统错误——两层校验范围不同是设计决策
  3. 开发者根据 Layer B 的错误提示修正后重新提交
  4. 若频繁出现不一致，检查 Layer A 校验规则是否需要扩展
```

#### 场景 3：SCA 增量校验遗漏间接影响

```
触发：修改 FR-AUTH-001 的描述，增量 SCA 仅检查直接引用（DS-AUTH-001），
      未检查间接引用（TASK-AUTH-001 通过 DS-AUTH-001 间接依赖 FR-AUTH-001）
影响：间接影响链断裂未被 pre-push Hook 捕获
处理：
  1. 增量 SCA 影响扩展限 1 层（设计决策，保证 < 10s）
  2. CI Pipeline 执行全量 SCA，捕获所有间接影响
  3. 全量 SCA 构建完整 ID 引用图，做传递闭包检查
  4. 开发者在 CI 报告中看到间接影响，在 PR 中修复
一致性保证：增量 SCA 是「快速反馈」，全量 SCA 是「完整校验」，两者互补
```

#### 场景 4：Gate 评估期间产出物被修改

```
触发：Gate 评估正在执行（gate_checking 状态），开发者同时修改了产出物文件
影响：Gate 校验读取的文件内容可能与最终提交的内容不一致
处理：
  1. Gate 评估开始时，记录所有校验文件的 Git hash（快照）
  2. Gate 评估完成后，比对文件 hash 是否变化
  3. 若文件已变化：
     a. Gate 结果标记为 STALE（过期）
     b. 提示开发者重新触发 Gate 评估
     c. 不写入 gate-history.jsonl（避免记录过期结果）
  4. 若文件未变化：正常返回 Gate 结果
注意：此场景在 CLI 触发时概率较低，CI Pipeline 中不会发生（Pipeline 基于固定 commit）
```

#### 场景 5：多 Feature 共享 Gate 条件的隔离

```
触发：同一仓库中多个 Feature 并行开发，各自触发 Gate 评估
影响：Gate 条件中的覆盖率计算、SCA 校验需要按 Feature 隔离
处理：
  1. 所有 Gate 条件评估以 featureId 为作用域
  2. 覆盖率计算：M2.getCoverage(featureId, type) 仅计算该 Feature 的矩阵
  3. SCA 校验：仅加载该 Feature 目录下的产出物文件
  4. gate-history.jsonl：每条记录包含 featureId，查询时按 featureId 过滤
  5. Hook 校验：commit-msg 从 staged files 路径推断 featureId
隔离保证：Feature 之间的 Gate 评估完全独立，互不影响
```

### 8.3 专家会审记录

> **[Arch]**: 错误处理的核心原则是「不因校验系统自身故障而阻断开发」——Hook 超时跳过、Gate 历史写入失败不影响评估结果、SCA 文件加载失败仅标记该项 FAIL 而非整体崩溃。唯一的例外是 CI Pipeline——作为最终防线，CI 的任何异常都应标记为 FAIL 而非跳过。场景 4（评估期间文件被修改）的 hash 快照机制是数据一致性的重要保障，但仅在 CLI 场景需要，CI 基于固定 commit 天然不存在此问题。
> **[DevEff]**: 场景 1（`--no-verify` 绕过）是现实中最高频的边界场景。降低绕过动机的最佳策略是让 Hook 足够快——commit-msg < 2s、pre-push < 10s。如果开发者频繁绕过，应该检查 Hook 性能而非加强限制。场景 2（Layer A/B 不一致）不应视为 bug——两层校验范围不同是设计决策，开发者只需关注 Layer B 的结果。
> **[QA]**: 场景 3（增量 SCA 遗漏）是已知的精度-性能权衡。建议在 CI 全量 SCA 报告中标注「增量 SCA 未捕获的不一致项」，帮助团队评估增量 SCA 的有效性。场景 5（多 Feature 隔离）的关键是 commit-msg Hook 如何从 staged files 推断 featureId——如果一次提交涉及多个 Feature 的文件，应该拒绝并提示拆分提交。
> **[决议]**: 错误处理遵循「不因自身故障阻断开发」原则，CI 例外。Hook 性能是降低绕过率的核心手段。增量 SCA 遗漏在 CI 报告中标注。多 Feature 混合提交拒绝并提示拆分。

---

## 9. 专家会审总结

### 9.1 关键设计决策汇总

| # | 决策项 | 决策结论 | 决策理由 | 提出方 |
|---|--------|---------|---------|--------|
| D1 | M3 定位 | 质量守门人：Hook 调度 + Gate 评估 + SCA 校验 | 不做流程编排（M1）、不做数据计算（M2），只负责校验执行和结果判定 | Arch |
| D2 | 双层 Hook 独立性 | Layer A/B 独立运行，无数据传递 | Layer B 必须能独立承载全部 Gate 校验，Layer A 是增强而非依赖 | Arch |
| D3 | Hook 超时策略 | 本地 Hook 超时放行 + 警告，CI 超时标记 FAIL | 本地阻断损害开发者体验，CI 作为兜底防线不可妥协 | DevEff |
| D4 | commit-msg 阶段感知 | 根据 staged files 路径识别阶段，允许对应 ID 标签 | 不同阶段的 commit message 格式不同，避免「ID 还不存在」的尴尬 | DevEff |
| D5 | Gate 条件 ID 稳定性 | 32 个条件 ID 固定不变，增减通过 Layer 1/2 配置 | 条件 ID 是 Gate 历史记录的主键，变更会破坏度量数据连续性 | Arch |
| D6 | hybrid 条件评估顺序 | 严格「先自动后人工」 | 避免「人工签核了但自动校验未通过」的不一致状态 | QA |
| D7 | SCA 增量影响扩展 | 限 1 层（直接引用），不做传递闭包 | 保证 pre-push Hook < 10s，传递闭包留给 CI 全量 SCA | DevEff |
| D8 | SCA 报告格式 | diff 风格输出，标记断裂引用链 | 开发者可直接定位修复，无需理解完整引用图 | DevEff |
| D9 | 阻断层级模型 | 5 级（Level 0-4），由柔到刚 | 覆盖从信息提示到人工终审的完整阻断谱系 | Arch |
| D10 | 阻断输出格式 | What-Why-How 三段式 + 颜色编码 | 开发者 30 秒内理解问题并知道如何修复 | DevEff |
| D11 | CI Gate 校验 | 设为 GitHub required check，不可绕过 | `--no-verify` 绕过本地 Hook 后的最终防线 | QA |
| D12 | Gate 历史记录 | Append-Only，每次评估（含 FAIL）都记录 | 返工率、首次通过率等度量数据的核心来源 | QA |
| D13 | Sign-off 检测 | 解析 Markdown 表格，模板预置在 templates/ | 纯文本解析，不依赖外部服务，与 M2 ID 提取逻辑一致 | Arch |
| D14 | 报告输出格式 | 支持 terminal/plain/json 三种 | 终端彩色、CI 日志纯文本、API 消费 JSON | QA |

### 9.2 遗留问题与后续跟进

| # | 问题 | 责任模块 | 跟进方式 |
|---|------|---------|---------|
| O1 | Refactoring 子类型的「行为等价验证」Gate 条件具体实现 | M3 实现阶段 | 编码时定义 Snapshot Testing / Contract Testing 策略 |
| O2 | Layer A Claude Code Hooks 的 `claude-hooks.json` 完整 Schema | M7 ToolIntegration | 在 07-工具链集成设计中定义 |
| O3 | CI Pipeline 的 GitHub Actions YAML 配置模板 | M7 ToolIntegration | 在 07-工具链集成设计中定义 |
| O4 | SCA#4 API 实现与契约一致性校验的参数级匹配（MVP 后） | M3 后续迭代 | MVP 仅做路径+方法匹配，参数级留后续版本 |
| O5 | Hook 性能基准测试（commit-msg < 2s、pre-push < 10s 的验证） | M3 测试阶段 | 集成测试中增加性能基准用例 |
| O6 | `--no-verify` 绕过事件的度量采集机制 | M6 + M7 | CI 检测无 Hook 记录的 commit，写入度量 JSONL |
| O7 | 多 Feature 混合提交的 featureId 推断算法边界 | M3 + M7 | 编码时定义路径匹配规则，处理跨 Feature 文件 |
| O8 | Gate 评估期间文件 hash 快照的性能开销评估 | M3 实现阶段 | 仅对 CLI 触发场景启用，CI 场景跳过 |

### 9.3 与其他模块的设计约定

| 约定 | M3 承诺 | 对方模块承诺 |
|------|---------|------------|
| M1 → M3 | 提供 `evaluateGate()` 接口，接收标准化条件列表，返回 `GateResult` | M1 提供 `getCurrentStage()` 查询，响应 < 10ms；M1 从裁剪结果中提取条件列表，不由 M3 自行加载 |
| M3 → M2 | 通过 `M2.validateId()` 校验 ID 格式，通过 `M2.getCoverage()` 查询覆盖率 | M2 提供高效查询接口（< 50ms），返回标准 `CoverageResult`；M3 按阈值判定 PASS/FAIL，不修改覆盖率数据 |
| M3 → M7 | 提供 Hook 校验逻辑（`HookHandler` 函数），由 M7 负责 Hook 安装和入口脚本 | M7 负责 Git Hook 安装（symlink）、CI Pipeline YAML 配置；M7 调用 M3 的 `runHook()` 执行校验 |
| M6 → M3 | 提供 `getGateHistory()` 接口，支持按 featureId/stage/时间范围过滤 | M6 定期采集 Gate 历史数据，计算返工率、首次通过率等度量指标 |
| M7 → M3 | 提供 `getGateHistory()` 接口，供 CI Pipeline 生成度量报告 | M7 在 CI Pipeline 中调用，将 Gate 历史格式化为 PR Comment |

---

> **文档结束** | 下一步：编写 04-变更与缺陷管理设计.md
