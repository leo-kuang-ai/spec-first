# 00-first Skill Optimization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Optimize the 00-first skill to support quick/deep dual-mode architecture with intelligent end-type detection, reducing onboarding time from 5 minutes to 30 seconds for quick mode.

**Architecture:** Extend the existing 8-Agent three-wave dispatch architecture by adding a quick mode execution path (main thread, no subagents), end-type detection rules, and product combination configuration. The deep mode retains the current subagent-driven architecture with enhanced features.

**Tech Stack:** TypeScript, ESM, Vitest, Handlebars templates, YAML config

---

## Phase 1: Core Infrastructure (P0)

### Task 1: Add End-Type Detection Types

**Files:**
- Modify: `skills/spec-first/00-first/references/detection-rules.md`
- Test: Manual verification

**Step 1: Add end-type detection rules to detection-rules.md**

Append the following content to `references/detection-rules.md` after the existing "多端技术栈检测" section:

```markdown
## 端类型检测规则

### 检测优先级

当同时检测到多种端类型特征时，按以下优先级判断：

1. **Monorepo** - 优先判断（可能包含多种端类型）
2. **后端 + Admin 混合** - 同时检测到后端和前端 Admin 特征
3. **跨平台** - Flutter/RN/UniApp/KMP
4. **原生 App** - iOS/Android
5. **PC 桌面** - Windows/macOS/Linux
6. **Web 前端** - Admin/H5
7. **后台服务** - 默认兜底

### 7 种端类型检测规则（含子类型）

| 端类型 | 检测特征 | 优先级 |
|--------|----------|--------|
| **后台服务** | `pom.xml`/`build.gradle`/`go.mod`/`requirements.txt`/`Cargo.toml` + 无前端目录 | 7 |
| **前端 Web** | `package.json` + `antd`/`element-plus`(Admin子类型) 或 `vant`/`nutui`(H5子类型) 或 `react`/`vue`(通用) | 6 |
| **移动端 App** | iOS: `*.xcodeproj`/`Podfile`; Android: `AndroidManifest.xml` + `com.android` | 4 |
| **跨平台** | `pubspec.yaml`(Flutter) / `react-native` / `manifest.json`+`uni` / `kotlin("multiplatform")` | 3 |
| **PC 桌面** | Win: `*.csproj`/`*.sln`; Mac: `*.xcodeproj`+macOS; Linux: GTK/Qt/SDL; 跨平台: Electron/Tauri | 5 |
| **Monorepo** | `turbo.json`/`nx.json`/`lerna.json`/`pnpm-workspace.yaml` | 1 |
| **后端+前端混合** | 同时检测到后台服务特征 + 前端 Web 特征 | 2 |

### 复合类型检测

当检测到多种端类型时，输出复合结果：

```yaml
检测结果:
  主类型: Monorepo
  子类型: [后端+前端混合, 前端 Web(Admin), 前端 Web(H5)]
  产物策略: 根级产物(9个) + packages/admin/(12个) + packages/h5/(12个)
```

### 检测失败降级

| 场景 | 特征 | 处理方式 |
|------|------|----------|
| **空项目/新项目** | 无代码文件，只有 README/.gitignore | Greenfield 模式：提示用户先创建代码 |
| **多端混合项目** | 同时检测到 3+ 种端特征 | Monorepo 模式 |
| **未知技术栈** | 有代码但无匹配的包管理文件 | 通用模式：7 个核心产物 |
| **配置文件缺失** | 无 package.json/pom.xml/go.mod 等 | 交互式询问 |
```

**Step 2: Verify the file is valid markdown**

Run: `cat skills/spec-first/00-first/references/detection-rules.md | head -100`
Expected: File content displayed without errors

**Step 3: Commit**

```bash
git add skills/spec-first/00-first/references/detection-rules.md
git commit -m "feat(00-first): add end-type detection rules for 7 platform types with subtypes"
```

---

### Task 2: Create End-Type Product Mapping Configuration

**Files:**
- Create: `skills/spec-first/00-first/references/端类型产物映射.md`
- Test: Manual verification

**Step 1: Create the product mapping file**

```markdown
# 端类型产物映射配置

> 版本: v1.0.0 | 定义各端类型对应的产物组合策略

---

## Layer 分层策略

| 层级 | 产物数 | 执行模式 | 说明 |
|------|--------|----------|------|
| **Layer 0** | 3 个 | quick | 核心产物，所有端必须 |
| **Layer 1** | 4-6 个 | deep | 标配产物，按端类型自动选择 |
| **Layer 2** | 2-4 个 | deep --full | 扩展产物，按需生成 |

---

## Layer 0：核心产物（quick 模式）

所有端类型必须生成：

| 产物 | 文件名 | 说明 |
|------|--------|------|
| 技术栈摘要 | `tech-stack.md` | 语言、框架、构建工具 |
| 代码结构概览 | `codebase-overview.md` | 目录结构、模块职责 |
| 快速命令 | `quick-commands.md` | 构建/测试/运行命令 |

---

## Layer 1：标配产物（按端类型，deep 模式）

### 后台服务

| 产物 | 文件名 | 视角 |
|------|--------|------|
| 系统架构 | `architecture.md` | 分层架构 + 中间件 |
| API 文档 | `api-docs.md` | 暴露方视角 |
| 数据库 ER | `database-er.md` | 表结构 + 关系 |
| 领域模型 | `domain-model.md` | 核心概念 + 状态机 |
| 外部依赖 | `external-deps.md` | 中间件为主 |
| 研发规范 | `development-guidelines.md` | 后端规范 |

**产物数量**：6 个（Layer 0: 3 + Layer 1: 6 = 9 个）

### Admin 后台

| 产物 | 文件名 | 视角 |
|------|--------|------|
| 系统架构 | `architecture.md` | FSD 分层 |
| API 文档 | `api-docs.md` | 调用方视角 |
| 组件库 | `component-library.md` | UI 组件清单 |
| 状态管理 | `state-management.md` | Store 结构 |
| 研发规范 | `development-guidelines.md` | 前端规范 |

**产物数量**：5 个（Layer 0: 3 + Layer 1: 5 = 8 个）

### H5/移动Web

| 产物 | 文件名 | 视角 |
|------|--------|------|
| 系统架构 | `architecture.md` | 简化版 |
| API 文档 | `api-docs.md` | 调用方视角 |
| 性能分析 | `performance.md` | 包大小 + 首屏 |
| 兼容性 | `compatibility.md` | 浏览器版本 |

**产物数量**：4 个（Layer 0: 3 + Layer 1: 4 = 7 个）

### iOS/Android

| 产物 | 文件名 | 视角 |
|------|--------|------|
| 系统架构 | `architecture.md` | 简化版 |
| API 文档 | `api-docs.md` | 调用方视角 |
| 发布流程 | `app-release.md` | App Store/Play |
| 兼容性 | `compatibility.md` | iOS/Android 版本 |
| 测试策略 | `testing-strategy.md` | 单元/UI/E2E |

**产物数量**：5 个（Layer 0: 3 + Layer 1: 5 = 8 个）

### 跨平台（Flutter/RN/UniApp）

| 产物 | 文件名 | 视角 |
|------|--------|------|
| 系统架构 | `architecture.md` | 原生 + 跨平台层 |
| API 文档 | `api-docs.md` | 调用方视角 |
| 原生桥接 | `platform-bridge.md` | JSBridge/Channel |
| 兼容性 | `compatibility.md` | 多端兼容 |
| 国际化 | `i18n.md` | 多语言配置 |

**产物数量**：5 个（Layer 0: 3 + Layer 1: 5 = 8 个）

### PC 桌面（Electron/Tauri）

| 产物 | 文件名 | 视角 |
|------|--------|------|
| 系统架构 | `architecture.md` | 主进程/渲染进程 |
| API 文档 | `api-docs.md` | IPC 通道 |
| 原生依赖 | `desktop-native.md` | Node 原生模块 |
| 发布流程 | `release.md` | 安装包/自动更新 |
| 性能分析 | `performance.md` | 内存/CPU |

**产物数量**：5 个（Layer 0: 3 + Layer 1: 5 = 8 个）

### Monorepo

| 产物 | 文件名 | 视角 |
|------|--------|------|
| 系统架构 | `architecture.md` | 项目图 |
| 模块图 | `module-graph.md` | Nx/Turbo 依赖 |
| 环境配置 | `env-config.md` | 环境变量 |
| 测试策略 | `testing-strategy.md` | 各 package 测试 |

**产物数量**：4 个（Layer 0: 3 + Layer 1: 4 = 7 个）

### 后端+Admin 混合

**产物数量**：16 个（完整产物集）

包含后台服务 + Admin 后台所有 Layer 1 产物，外加：
- `devops-integration.md`：DevOps 集成说明
- `monitoring.md`：监控配置

---

## Layer 2：扩展产物（按需生成）

| 产物 | 文件名 | 触发条件 |
|------|--------|----------|
| 调用链分析 | `call-graph.md` | `--with-call-graph` 或 `depth=deep` 且复杂度 > 中等 |
| 监控配置 | `monitoring.md` | `--with-monitoring` 或检测到 Prometheus/Grafana/Sentry |
| 国际化 | `i18n.md` | `--with-i18n` 或检测到 i18n/locale 目录 |
| 性能分析 | `performance.md` | `--with-performance`（非 H5/PC 默认不生成） |

---

## 命令行参数映射

```bash
# quick 模式（默认）
/spec-first:first                    # Layer 0 产物

# deep 模式
/spec-first:first --deep             # Layer 0 + Layer 1（按端类型）
/spec-first:first --deep --full      # Layer 0 + Layer 1 + Layer 2

# 按需扩展
/spec-first:first --deep --with-call-graph
/spec-first:first --deep --with-monitoring
/spec-first:first --deep --with-i18n

# 手动指定端类型
/spec-first:first --端类型=后台服务
/spec-first:first --deep --端类型=Admin

# 强制全量更新
/spec-first:first --force
/spec-first:first --deep --force
```

---

## 版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| v1.0.0 | 2026-03-02 | 初始版本，定义 7 种端类型（含子类型）的产物映射 |
```

**Step 2: Verify file creation**

Run: `ls -la skills/spec-first/00-first/references/端类型产物映射.md`
Expected: File exists

**Step 3: Commit**

```bash
git add skills/spec-first/00-first/references/端类型产物映射.md
git commit -m "feat(00-first): add end-type product mapping configuration"
```

---

### Task 3: Update SKILL.md with Quick Mode Support

**Files:**
- Modify: `skills/spec-first/00-first/SKILL.md`
- Test: `tests/unit/first-skill-docs.test.ts`

**Step 1: Update the skill description and version**

Find line 3-5 in SKILL.md:
```yaml
description: "快速认知项目：分析技术栈、代码结构、架构、API、规范、调用链等，生成 9-11 份认知文档（根据条件产物动态调整）"
version: 1.11.1
```

Replace with:
```yaml
description: "项目快速认知：quick 模式秒级入户（3 个核心文档），deep 模式企业级分析（按端类型 7-16 个文档）"
version: 1.12.0
```

**Step 2: Add changelog entry**

Find the `changelog:` section and add new entry at top:
```yaml
changelog: |
  1.12.0: 双模式架构 — 新增 quick 模式（秒级入户）、端类型智能检测（7 种 + 子类型）、分层产物策略（Layer 0/1/2）
  1.11.1: 文档一致性与治理增强 — 统一证据格式描述、修复 A4 波次依赖冲突、统一超时口径、抽取共享 QA 规则、补充 Context7 密钥治理/DB 凭证技术防护、新增测试策略矩阵
```

**Step 3: Update interactive options (Q1)**

Find the Q1 section (around line 63-68):
```markdown
**Q1: 分析深度**

| 选项 | 说明 |
|------|------|
| `overview`（默认） | 结构概览：目录树、模块划分、入口识别 |
| `deep` | 深度分析：追加类/函数关系、业务流程、调用链、代码采样验证 |
```

Replace with:
```markdown
**Q1: 执行模式**

| 选项 | 说明 |
|------|------|
| `quick`（默认） | 秒级入户：3 个核心文档，主线程执行，<30s |
| `deep` | 企业级分析：按端类型 7-16 个文档，8 Agent 并发，<5min |

> 内部变量映射：Q1→`mode`（替代原 `depth`）
```

**Step 4: Add Q4 for end-type confirmation (optional)**

After Q3 section, add:
```markdown
**Q4: 端类型确认**（仅自动检测后展示，可跳过）

| 选项 | 说明 |
|------|------|
| `确认`（默认） | 使用自动检测到的端类型 |
| `手动指定` | 从列表中选择端类型 |

> 内部变量映射：Q4→`端类型`
```

**Step 5: Commit**

```bash
git add skills/spec-first/00-first/SKILL.md
git commit -m "feat(00-first): add quick mode support and simplify interactive options"
```

---

### Task 4: Add Quick Mode Execution Flow to SKILL.md

**Files:**
- Modify: `skills/spec-first/00-first/SKILL.md`

**Step 1: Add quick mode execution section after P0**

Find the end of P0 section (around line 217) and add after it:

```markdown
### P0.5: Quick Mode Fast Path（仅 `mode=quick` 时执行）

当用户选择 `quick` 模式时，跳过 Agent 派发，主线程直接执行：

```
P0.5 Quick Fast Path:
    │
    ├─ Step 1: Greenfield/Brownfield 判断
    │   ├─ Greenfield（代码文件 < 10）→ 提示"项目为空，建议先创建代码"，退出
    │   └─ Brownfield → 继续
    │
    ├─ Step 2: 技术栈识别（<10s）
    │   ├─ 语言/框架检测（复用 P1a 逻辑）
    │   ├─ 端类型检测（复用 P1a 逻辑）
    │   └─ 包管理器检测
    │
    ├─ Step 3: 目录结构扫描（<15s）
    │   ├─ git ls-files 或目录遍历
    │   ├─ 入口文件识别
    │   └─ 模块划分推断
    │
    ├─ Step 4: 生成产物（<5s）
    │   ├─ tech-stack.md
    │   ├─ codebase-overview.md
    │   └─ quick-commands.md
    │
    └─ Step 5: 输出摘要
        ├─ 项目类型、技术栈、快速命令
        ├─ 检测到的端类型
        └─ 提示"运行 --deep 获取完整分析"
```

**quick 模式产物位置**：`docs/first/`（与 deep 模式统一位置，通过产物数量区分）

**quick 模式产物清单**：
```
docs/first/
├── .quick-meta.yaml      # quick 模式标记
├── tech-stack.md         # 技术栈摘要
├── codebase-overview.md  # 代码结构概览
└── quick-commands.md     # 构建/测试/运行命令
```

**quick 模式不执行**：
- 无 Agent 派发
- 无证据标注要求
- 无交叉验证
- 无数据库分析
- 无调用链分析
```

**Step 2: Commit**

```bash
git add skills/spec-first/00-first/SKILL.md
git commit -m "feat(00-first): add quick mode execution flow (P0.5)"
```

---

### Task 5: Add Quick Mode Success Criteria

**Files:**
- Modify: `skills/spec-first/00-first/SKILL.md`

**Step 1: Add quick mode success criteria**

Find the "成功标准" section (around line 408) and add before "基础要求":

```markdown
## 成功标准

### quick 模式要求

- `docs/first/` 目录存在
- 必须生成：`tech-stack.md`、`codebase-overview.md`、`quick-commands.md`、`.quick-meta.yaml`
- 所有文档为合法 Markdown
- 执行时间 < 30s
- 无证据标注要求
- 无交叉验证要求

### deep 模式要求

#### 基础要求
```

**Step 2: Update success criteria to reference mode**

Find the "条件产物" section and update to:
```markdown
#### 条件产物（deep 模式）

- 如 `mode=deep`，`call-graph.md` 存在且包含模块依赖矩阵（当项目复杂度 > 中等时）
- 如检测到 DB，`database-er.md` 存在且包含 Mermaid 图（关系型）或 Collection 结构（NoSQL）
```

**Step 3: Commit**

```bash
git add skills/spec-first/00-first/SKILL.md
git commit -m "feat(00-first): add quick mode success criteria"
```

---

## Phase 2: Enhanced Features (P1)

### Task 6: ~~Add Confidence Tracking Types~~ (Deferred to Future Backlog)

> **状态**：⏳ 延后实施。当前证据标注 + 交叉验证已提供质量保证，置信度追踪投入产出比低。
> 待 quick/deep 双模式和端类型检测稳定后再考虑引入。
>
> 原计划内容保留供后续参考，但不在本次迭代中实施。

**Step 1: Add confidence tracking section**

Append to `references/quality-assurance-rules.md`:

```markdown
## 置信度追踪（deep 模式）

### 置信度等级定义

| 等级 | 进度条 | 名称 | 说明 |
|------|--------|------|------|
| 0 | ░░░░░ | Gathering | 收集初始证据 |
| 1 | ▓░░░░ | Surveying | 广泛扫描，发现模式 |
| 2 | ▓▓░░░ | Investigating | 深入分析，验证模式 |
| 3 | ▓▓▓░░ | Analyzing | 交叉引用，填补空白 |
| 4 | ▓▓▓▓░ | Synthesizing | 连接发现，高置信度 |
| 5 | ▓▓▓▓▓ | Concluded | 交付结论 |

### 置信度报告格式

每个 Agent 完成后，在产物头部输出置信度报告：

```markdown
---
last_updated: [YYYY-MM-DD]
confidence: 4
confidence_bar: "▓▓▓▓░"
confidence_note: "部分推断，建议验证"
---
```

### 低置信度处理

- 置信度 < 3 的产物自动标记 `[需验证]`
- 用户可随时打断并获取当前置信度的中间结果
- 置信度汇总到 `docs/first/.index.yaml`

### 置信度报告示例

```markdown
## 置信度报告

| 产物 | 置信度 | 说明 |
|------|--------|------|
| tech-stack.md | ▓▓▓▓▓ (5/5) | 基于配置文件检测 |
| architecture.md | ▓▓▓▓░ (4/5) | 部分推断，建议验证 |
| domain-model.md | ▓▓▓░░ (3/5) | ⚠️ 需要补充验证 |

**Caveats**：
- `domain-model.md` 中 3 个实体为推断，需确认
```

**Step 2: Commit**

```bash
git add skills/spec-first/00-first/references/quality-assurance-rules.md
git commit -m "feat(00-first): add confidence tracking types and report format"
```

---

### Task 7: Add Product Index Schema

**Files:**
- Modify: `skills/spec-first/00-first/SKILL.md`

**Step 1: Add product index schema after P5 section**

```markdown
### P5.5: 生成产物索引（deep 模式）

deep 模式完成后，生成 `docs/first/.index.yaml` 用于会话恢复：

```yaml
# docs/first/.index.yaml
version: 1.0.0
last_run: 2026-03-02T14:30:00Z
mode: deep
端类型: 后端+Admin
git_commit: abc1234
confidence_avg: 4.2
products:
  - name: tech-stack.md
    confidence: 5
    last_updated: 2026-03-02T14:25:00Z
  - name: architecture.md
    confidence: 4
    last_updated: 2026-03-02T14:28:00Z
  - name: domain-model.md
    confidence: 3
    last_updated: 2026-03-02T14:29:00Z
    needs_verification: true
```

**会话恢复提示**：

当检测到已有 `.index.yaml` 时，输出：

```
检测到已有 00-first 产物（2026-03-02 14:30）
端类型: 后端+Admin | 模式: deep | 平均置信度: 4.2/5

选项：
1. 查看现有产物摘要
2. 增量更新（基于 git diff）
3. 全量重新生成
4. 跳过（直接使用现有产物）

请选择 [1/2/3/4]:
```

**产物过期提醒**：

- 产物超过 7 天未更新 → 提示"产物可能过期"
- git commit 不匹配 → 提示"代码已更新，建议重新生成"
```

**Step 2: Commit**

```bash
git add skills/spec-first/00-first/SKILL.md
git commit -m "feat(00-first): add product index schema for session recovery"
```

---

### Task 8: Add Greenfield Detection Logic

**Files:**
- Modify: `skills/spec-first/00-first/SKILL.md`

**Step 1: Add Greenfield detection to P0 section**

Find the P0 section and add after step 4:

```markdown
5. **Greenfield/Brownfield 检测**：
   - **Greenfield 判定条件**（满足任一）：
     - 无 `.git` 目录且代码文件 < 10
     - 只有 README.md / .gitignore / LICENSE
     - `git log --oneline | wc -l` < 3 且代码文件 < 50
   - **Greenfield 处理**：
     - 输出提示："检测到空项目/新项目，建议先初始化项目后再运行 00-first"
     - 提供"项目初始化建议"（推荐技术栈、目录结构模板）
     - 用户确认后可继续生成简化版产物（仅 tech-stack.md）
   - **Brownfield 处理**：继续正常流程
```

**Step 2: Commit**

```bash
git add skills/spec-first/00-first/SKILL.md
git commit -m "feat(00-first): add Greenfield/Brownfield detection logic"
```

---

### Task 9: Update Testing Strategy for Quick Mode

**Files:**
- Modify: `skills/spec-first/00-first/references/testing-strategy.md`

**Step 1: Add quick mode test cases**

Append to `testing-strategy.md`:

```markdown
## Quick Mode Test Matrix

### Quick Mode 执行路径测试

| # | 测试场景 | 输入 | 预期输出 | 验证点 |
|---|----------|------|----------|--------|
| Q1 | quick 模式默认执行 | `mode=quick` | 3 个产物 + .quick-meta.yaml | 产物数量、执行时间 < 30s |
| Q2 | quick 模式 Greenfield | 空项目 | 提示"项目为空" | 不生成产物 |
| Q3 | quick 模式 Brownfield | 有代码项目 | 正常生成 3 个产物 | 产物完整性 |
| Q4 | quick → deep 升级 | 先 quick 后 deep | 复用 quick 产物 | 不重复生成 |

### 端类型检测测试

| # | 测试场景 | 项目特征 | 预期端类型 |
|---|----------|----------|------------|
| E1 | 纯后端项目 | pom.xml, 无前端 | 后台服务 |
| E2 | Admin 后台 | package.json + antd | Admin 后台 |
| E3 | 后端 + Admin | pom.xml + package.json + antd | 后端+Admin混合 |
| E4 | Monorepo | turbo.json + 多 package | Monorepo |
| E5 | 跨平台 Flutter | pubspec.yaml | 跨平台[Flutter] |
| E6 | 未知技术栈 | 无配置文件 | 通用模式 + 交互式询问 |

### 交互式选项测试

| # | 测试场景 | 用户输入 | 预期行为 |
|---|----------|----------|----------|
| I1 | 默认无交互 | 无参数 | 自动 quick 模式 |
| I2 | 指定 deep | `--deep` | 跳过 Q1，执行 deep |
| I3 | 指定端类型 | `--端类型=后台` | 跳过 Q4，使用指定端类型 |
| I4 | 交互模式 | `--interactive` | 展示所有问题 |
```

**Step 2: Commit**

```bash
git add skills/spec-first/00-first/references/testing-strategy.md
git commit -m "feat(00-first): add quick mode and end-type detection test cases"
```

---

### Task 9.5: Update Interactive Options for Quick/Deep Mode

**Files:**
- Modify: `skills/spec-first/00-first/SKILL.md`

**Step 1: Replace Q1-Q4 with new interactive options**

Find the "交互式选项" section and replace with:

```markdown
## 交互式选项

技能启动后，通过交互式提问收集用户选项（使用 `AskUserQuestion`）：

**Q1: 执行模式**

| 选项 | 说明 |
|------|------|
| `quick`（默认） | 秒级入户：3 个核心文档，主线程执行，<30s |
| `deep` | 企业级分析：按端类型 7-16 个文档，8 Agent 并发，<5min |

> 内部变量：`mode`（quick/deep）

**Q2: 更新策略**（仅产物已存在时展示）

| 选项 | 说明 |
|------|------|
| `增量更新`（默认） | 仅更新受变更影响的产物（基于 git diff） |
| `全量重新生成` | 重新生成所有产物 |
| `跳过` | 使用现有产物，不更新 |

> 内部变量：`update_mode`（incremental/full/skip）

**Q3: 端类型确认**（自动检测后展示）

| 选项 | 说明 |
|------|------|
| `确认（X）`（默认） | 使用自动检测到的端类型 X |
| `手动指定` | 从列表中选择端类型 |

**端类型可选值**（7 种主类型）：
- `后台服务` - Java/Go/Python/Rust 后端
- `前端 Web` - Vue/React 管理后台、H5 移动端 Web、通用前端
- `移动端 App` - 原生 iOS/Android
- `跨平台` - Flutter/RN/UniApp/KMP
- `PC 桌面` - Windows/macOS/Linux/Electron/Tauri
- `Monorepo` - 多包仓库
- `后端+前端混合` - 后端 + 前端在同一仓库

> 内部变量：`端类型`

**Q4: 数据库分析**（仅 deep 模式）

| 选项 | 说明 |
|------|------|
| `自动检测`（默认） | 从配置自动发现 DB 连接 |
| `手动指定` | 用户输入连接串 |
| `跳过` | 不生成 database-er.md |

> 内部变量：`db_mode`/`db_url`

**Q5: 扩展产物**（仅 deep 模式，多选）

| 选项 | 说明 | 默认 |
|------|------|------|
| `call-graph` | 调用链分析 | 按需（复杂度 > 中等） |
| `monitoring` | 监控配置 | 按需（检测到监控） |
| `i18n` | 国际化配置 | 按需（检测到多语言） |
| `full` | 生成所有扩展产物 | 否 |

> 内部变量：`extensions`（数组）
```

**Step 2: Add smart defaults note**

After the interactive options section, add:

```markdown
## 智能默认值

为减少用户决策负担，以下场景自动使用默认值（跳过对应问题）：

| 场景 | 自动行为 |
|------|----------|
| 首次运行 | 跳过 Q2（无产物可更新） |
| 端类型检测置信度高 | 跳过 Q3（直接使用检测结果） |
| quick 模式 | 跳过 Q4、Q5（仅 deep 模式需要） |
| 无数据库配置 | 跳过 Q4 中的 DB 选项 |

**渐进式升级**：

quick 模式完成后，检测到以下情况时提示升级：

```markdown
检测到项目包含 50+ API 端点，是否生成完整 API 文档？[Y/n]
检测到数据库配置，是否生成 ER 图？[Y/n]
检测到监控配置，是否生成监控文档？[Y/n]
```

用户选择 `Y` 后，自动切换到 deep 模式继续生成。
```

**Step 3: Update internal variable mapping note**

Find and update the variable mapping note:

```markdown
> **内部变量汇总**：
> | 变量 | 来源 | 默认值 |
> |------|------|--------|
> | `mode` | Q1 | quick |
> | `update_mode` | Q2（条件） | incremental |
> | `端类型` | Q3 | 自动检测 |
> | `db_mode` | Q4（deep） | auto |
> | `extensions` | Q5（deep） | [] |
```

**Step 4: Commit**

```bash
git add skills/spec-first/00-first/SKILL.md
git commit -m "feat(00-first): update interactive options for quick/deep mode with smart defaults"
```

---

### Task 9.6: Add Detection Failure Handling

**Files:**
- Modify: `skills/spec-first/00-first/SKILL.md`

**Step 1: Add detection failure handling section**

Add after P0 section (after Greenfield detection):

```markdown
**端类型检测失败处理**：

当端类型自动检测无法匹配任何已知类型时：

1. **输出检测结果**：
   ```markdown
   ## ⚠️ 端类型检测失败

   **检测到的特征**：
   - 存在文件：src/, package.json
   - 未匹配：已知框架特征

   **可能原因**：
   1. 使用了不在支持列表中的框架
   2. 项目配置文件不标准
   3. 这是一个新类型的项目
   ```

2. **提供用户选项**：
   | 选项 | 说明 |
   |------|------|
   | 1. 使用通用模式 | 生成 7 个核心文档（推荐） |
   | 2. 手动指定端类型 | 从列表中选择 |
   | 3. 取消 | 不生成产物 |

3. **通用模式产物集**（7 个）：
   - README.md（索引）
   - tech-stack.md
   - codebase-overview.md
   - architecture.md（简化版）
   - api-docs.md（如有）
   - development-guidelines.md
   - local-setup.md
```

**Step 2: Commit**

```bash
git add skills/spec-first/00-first/SKILL.md
git commit -m "feat(00-first): add detection failure handling with fallback options"
```

---

### Task 9.7: Update Unit Tests for Quick Mode

> **标注**：此任务为后续迭代，当前计划仅更新测试策略文档。

**Files:**
- Modify: `tests/unit/first-skill-docs.test.ts`（如存在）
- Create: `tests/unit/first-skill-quick-mode.test.ts`

**Step 1: Create quick mode test file**

```typescript
// tests/unit/first-skill-quick-mode.test.ts
import { describe, it, expect } from 'vitest';

describe('00-first quick mode', () => {
  describe('end-type detection', () => {
    it('should detect backend service with pom.xml', () => {
      // Test: pom.xml + no frontend → 后台服务
    });

    it('should detect Admin with package.json + antd', () => {
      // Test: package.json + antd → Admin后台
    });

    it('should detect Monorepo with turbo.json', () => {
      // Test: turbo.json → Monorepo
    });

    it('should detect mixed backend+Admin', () => {
      // Test: pom.xml + package.json + antd → 后端+Admin混合
    });

    it('should fallback to generic mode for unknown stack', () => {
      // Test: no config files → 通用模式
    });
  });

  describe('quick mode execution', () => {
    it('should generate 3 products in quick mode', () => {
      // Test: mode=quick → tech-stack + codebase-overview + quick-commands
    });

    it('should skip greenfield project', () => {
      // Test: empty project → prompt "项目为空"
    });

    it('should complete within 30 seconds', () => {
      // Test: execution time < 30s
    });
  });

  describe('command line parameters', () => {
    it('should parse --deep flag', () => {
      // Test: --deep → mode=deep
    });

    it('should parse --force flag', () => {
      // Test: --force → skip idempotent check
    });

    it('should parse --端类型=后台服务', () => {
      // Test: --端类型 → skip end-type detection
    });
  });
});
```

**Step 2: Commit**

```bash
git add tests/unit/first-skill-quick-mode.test.ts
git commit -m "test(00-first): add quick mode and end-type detection unit tests"
```

> **Note**: 此任务在 Phase 3 验证时执行，当前仅定义测试用例结构。

---

## Phase 3: Documentation & Finalization

### Task 10: Update Reference List in SKILL.md

**Files:**
- Modify: `skills/spec-first/00-first/SKILL.md`

**Step 1: Add new reference file to list**

Find the "参考清单" section and add new entry:

```markdown
| `references/端类型产物映射.md` | 端类型 → 产物集映射配置 | P1a 主线程（端类型检测后） |
```

**Step 2: Commit**

```bash
git add skills/spec-first/00-first/SKILL.md
git commit -m "docs(00-first): add end-type product mapping to reference list"
```

---

### Task 11: Update Subagent Architecture Document

**Files:**
- Modify: `skills/spec-first/00-first/references/subagent-architecture.md`

**Step 1: Add quick mode section**

Append to the document:

```markdown
## Quick Mode 架构说明

Quick 模式不使用 Subagent 架构，由主线程直接执行：

```
┌─────────────────────────────────────────────────────────────┐
│ Quick Mode: 主线程直接执行                                    │
├─────────────────────────────────────────────────────────────┤
│ Step 1: Greenfield/Brownfield 判断                           │
│ Step 2: 技术栈识别（复用 P1a 逻辑）                            │
│ Step 3: 目录结构扫描（复用 A1 部分逻辑）                        │
│ Step 4: 生成 3 个核心产物                                     │
│ Step 5: 输出摘要                                             │
└─────────────────────────────────────────────────────────────┘
```

### Quick vs Deep 对比

| 维度 | Quick 模式 | Deep 模式 |
|------|------------|-----------|
| **执行方式** | 主线程 | 8 Agent 三波派发 |
| **产物数量** | 3 个 | 7-16 个（按端类型） |
| **执行时间** | < 30s | < 5min |
| **Subagent** | 无 | 有 |
| **证据标注** | 无要求 | 强制 |
| **交叉验证** | 无 | 4 项校验 |
| **置信度追踪** | 无 | 有 |

### Deep 模式复用 Quick 产物

当用户先运行 quick 后运行 deep 时：
1. 检测 `docs/first/.quick-meta.yaml` 存在
2. **复用中间数据**：端类型检测结果、语言/框架检测结果（加速 P1a）
3. **重新生成 Layer 0 产物**：deep 模式要求 ≥90% 证据标注覆盖率，quick 产物无证据标注，不可直接复用
4. Layer 1/2 产物全新生成
5. 删除 `.quick-meta.yaml`，生成 `.index.yaml`

---

## 版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| 1.1.0 | 2026-03-02 | 新增 Quick 模式架构说明、Deep 复用 Quick 产物策略 |
| 1.0.0 | 2026-02-28 | 初始版本 |
```

**Step 2: Commit**

```bash
git add skills/spec-first/00-first/references/subagent-architecture.md
git commit -m "docs(00-first): add quick mode architecture documentation"
```

---

### Task 11.5: Add Skill-Runtime Parameter Parsing Support

**Files:**
- Create: `src/core/skill-runtime/first-args.ts`
- Modify: `src/core/skill-runtime/dispatcher.ts`
- Test: `tests/unit/first-args.test.ts`

**Step 1: Create first-args.ts**

参照 `orchestrate-args.ts` 的模式，新增 first skill 参数解析器：

```typescript
// src/core/skill-runtime/first-args.ts
import type { ExitCode } from '../../shared/types.js';

export interface FirstArgs {
  mode: 'quick' | 'deep';
  force: boolean;
  endType?: string;          // --端类型=X
  interactive: boolean;      // --interactive
  extensions: string[];      // --with-call-graph, --with-monitoring, --with-i18n, --full
}

// 允许的 flag
const ALLOWED_FLAGS = new Set([
  '--deep',
  '--force',
  '--interactive',
  '--with-call-graph',
  '--with-monitoring',
  '--with-i18n',
  '--full',
]);

// --端类型= 前缀
const END_TYPE_PREFIX = '--端类型=';

export function parseFirstArgs(rawArgs: string[]): { args: FirstArgs } | { error: string; code: ExitCode } {
  const result: FirstArgs = {
    mode: 'quick',
    force: false,
    interactive: false,
    extensions: [],
  };

  for (const arg of rawArgs) {
    if (arg === '--deep') {
      result.mode = 'deep';
    } else if (arg === '--force') {
      result.force = true;
    } else if (arg === '--interactive') {
      result.interactive = true;
    } else if (arg.startsWith(END_TYPE_PREFIX)) {
      result.endType = arg.slice(END_TYPE_PREFIX.length);
    } else if (arg === '--with-call-graph') {
      result.extensions.push('call-graph');
    } else if (arg === '--with-monitoring') {
      result.extensions.push('monitoring');
    } else if (arg === '--with-i18n') {
      result.extensions.push('i18n');
    } else if (arg === '--full') {
      result.extensions = ['call-graph', 'monitoring', 'i18n'];
    } else {
      return { error: `Unknown flag: ${arg}`, code: 1 as ExitCode };
    }
  }

  return { args: result };
}
```

**Step 2: Update dispatcher.ts Skill route to pass args**

在 `dispatcher.ts` 的 `loadSkill()` 调用处，检测技能名为 `first` 时调用 `parseFirstArgs()`，并将解析结果注入 SKILL.md 模板变量：

```typescript
// dispatcher.ts — 在 Skill Route 分支中
if (skillName === 'first') {
  const parsed = parseFirstArgs(remainingArgs);
  if ('error' in parsed) {
    return { code: parsed.code, message: parsed.error };
  }
  // 注入模板变量供 SKILL.md 使用
  ctx.firstArgs = parsed.args;
}
```

**Step 3: Add template variables to SKILL.md**

在 SKILL.md 头部 metadata 区域新增变量接收：

```yaml
# 运行时参数（由 skill-runtime 注入）
# {{FIRST_MODE}}     — quick | deep
# {{FIRST_FORCE}}    — true | false
# {{FIRST_END_TYPE}} — 自动检测 | 用户指定值
# {{FIRST_INTERACTIVE}} — true | false
# {{FIRST_EXTENSIONS}}  — [] | ['call-graph', ...]
```

**Step 4: Create unit tests**

```typescript
// tests/unit/first-args.test.ts
import { describe, it, expect } from 'vitest';
import { parseFirstArgs } from '../../src/core/skill-runtime/first-args.js';

describe('parseFirstArgs', () => {
  it('should default to quick mode', () => {
    const result = parseFirstArgs([]);
    expect(result).toEqual({ args: { mode: 'quick', force: false, interactive: false, extensions: [] } });
  });

  it('should parse --deep flag', () => {
    const result = parseFirstArgs(['--deep']);
    expect('args' in result && result.args.mode).toBe('deep');
  });

  it('should parse --端类型=后台服务', () => {
    const result = parseFirstArgs(['--端类型=后台服务']);
    expect('args' in result && result.args.endType).toBe('后台服务');
  });

  it('should parse --full as all extensions', () => {
    const result = parseFirstArgs(['--full']);
    expect('args' in result && result.args.extensions).toEqual(['call-graph', 'monitoring', 'i18n']);
  });

  it('should reject unknown flags', () => {
    const result = parseFirstArgs(['--unknown']);
    expect('error' in result).toBe(true);
  });

  it('should combine multiple flags', () => {
    const result = parseFirstArgs(['--deep', '--force', '--端类型=Admin']);
    expect('args' in result && result.args).toMatchObject({ mode: 'deep', force: true, endType: 'Admin' });
  });
});
```

**Step 5: Commit**

```bash
git add src/core/skill-runtime/first-args.ts src/core/skill-runtime/dispatcher.ts tests/unit/first-args.test.ts
git commit -m "feat(skill-runtime): add first skill parameter parsing (--deep/--force/--端类型)"
```

---

### Task 11.6: Review All Reference Files for Consistency

**Files:**
- Review: `skills/spec-first/00-first/references/agents-code-analysis.md`
- Review: `skills/spec-first/00-first/references/agents-api-deps.md`
- Review: `skills/spec-first/00-first/references/agent-guidelines-setup.md`
- Review: `skills/spec-first/00-first/references/agent-database.md`
- Review: `skills/spec-first/00-first/references/agent-domain-model.md`

**背景**：quick 模式引入后，现有 reference 文件需要与新方案对齐。

**Step 1: 检查并更新以下内容**

| Reference 文件 | 检查点 | 预期更新 |
|---------------|--------|----------|
| `agents-code-analysis.md` | A1 在 quick 模式下的行为 | 补充：quick 模式下 A1 不派发，主线程直接生成简化版 codebase-overview |
| `agents-api-deps.md` | 端类型影响 api-docs 视角 | 补充：按端类型选择暴露方/调用方视角 |
| `agent-guidelines-setup.md` | quick 模式不生成 | 补充：仅 deep 模式派发 C2 |
| `agent-database.md` | quick 模式不生成 | 补充：仅 deep 模式且 db_mode≠跳过时派发 D |
| `agent-domain-model.md` | quick 模式不生成 | 补充：仅 deep 模式派发 A4 |

**Step 2: 确保所有 reference 文件头部版本号更新**

**Step 3: Commit**

```bash
git add skills/spec-first/00-first/references/
git commit -m "docs(00-first): update all reference files for quick/deep mode consistency"
```

---

### Task 11.7: E2E Verification on Real Project

**目标**：在 spec-first 项目自身上跑一次 quick 模式端到端验证。

**Step 1: 验证 quick 模式路由**

确认 `/spec-first:first` 能正确路由到 SKILL.md，且参数解析正确：

```bash
# 验证参数解析
npx vitest run tests/unit/first-args.test.ts
```

**Step 2: 验证端类型检测**

在 spec-first 项目根目录手动验证端类型检测：
- 预期：检测到 `package.json` + TypeScript → 后台服务（Node.js CLI 工具）
- 验证：检测结果是否合理

**Step 3: 验证 quick 模式产物生成**

手动运行 `/spec-first:first`，验证：
- [ ] `docs/first/` 目录创建成功
- [ ] `tech-stack.md` 内容正确（TypeScript, Node.js, ESM, tsup, Vitest）
- [ ] `codebase-overview.md` 内容正确（core/, cli/, shared/ 模块）
- [ ] `quick-commands.md` 内容正确（npm run build, npm test, npm run lint）
- [ ] `.quick-meta.yaml` 存在
- [ ] 执行时间 < 30s

**Step 4: 验证 deep 模式升级路径**

运行 `/spec-first:first --deep`，验证：
- [ ] 检测到 `.quick-meta.yaml`，复用端类型检测结果
- [ ] Layer 0 产物被重新生成（包含证据标注）
- [ ] Layer 1 产物正常生成
- [ ] `.quick-meta.yaml` 被删除
- [ ] `.index.yaml` 生成

**Step 5: 记录验证结果**

将验证结果记录到实施计划或 tasks/todo.md 中。

---

### Task 12: Final Verification and Changelog Update

**Files:**
- Verify: All modified files
- Update: `CHANGELOG.md`

**Step 1: Run lint check**

Run: `npm run lint`
Expected: No errors (or only pre-existing warnings)

**Step 2: Run tests**

Run: `npm test`
Expected: All tests pass

**Step 3: Update project CHANGELOG.md**

Add entry to `CHANGELOG.md`:

```markdown
- v1.12.0 2026-03-02 Claude: 00-first Skill 双模式架构优化 — 新增 quick 模式（秒级入户）、端类型智能检测（7 种 + 子类型）、分层产物策略（Layer 0/1/2） (user-visible)
```

**Step 4: Final commit**

```bash
git add CHANGELOG.md
git commit -m "chore: update CHANGELOG for 00-first v1.12.0"
```

---

## Summary

| Phase | Tasks | Estimated Time |
|-------|-------|----------------|
| Phase 1: Core Infrastructure | Task 1-5 | 4 hours |
| Phase 2: Enhanced Features | Task 7-9.7 (Task 6 deferred) | 3 hours |
| Phase 3: Documentation & Integration | Task 10-11.7 (含 skill-runtime, reference review, E2E) | 3 hours |
| Phase 4: Finalization | Task 12 | 0.5 hours |
| **Total** | **~16 tasks** | **~10.5 hours** |

### Key Deliverables

1. **End-type detection rules** for 7 platform types with subtypes
2. **Product mapping configuration** (Layer 0/1/2)
3. **Quick mode execution path** (< 30s)
4. ~~**Confidence tracking** for deep mode~~ (deferred to future backlog)
5. **Product index** for session recovery
6. **Greenfield/Brownfield detection**
7. **Updated test matrix** for quick mode
8. **Interactive options with smart defaults** (Q1-Q5 渐进式交互)
9. **Detection failure handling** with fallback options
10. **Unit test structure** for quick mode (后续迭代)
11. **Skill-runtime parameter parsing** (`first-args.ts` + dispatcher integration)

