# Spec-First 数据模型文档

> 基于运行时分析生成 | 生成时间: 2026-03-20

---

## 数据库状态

**Status**: `not_applicable`

**原因**：Spec-First 是一个 CLI 工具，使用基于文件系统的存储机制进行数据持久化，而非传统数据库系统 (`package.json:1-102` — 无数据库相关依赖 — `[显式]`)

---

## 项目类型分析

| 属性 | 值 | 证据 |
|------|-----|------|
| 项目类型 | cli-tool | `.spec-first/runtime/first/summary.json:1-188` — `[显式]` |
| 平台 | backend | `.spec-first/runtime/first/summary.json:1-188` — `[显式]` |
| 子类型 | ai-workflow-engine | `.spec-first/runtime/first/summary.json:1-188` — `[显式]` |
| 是否有数据库 | false | `package.json:1-102` — 无 prisma/typeorm/sequelize/mongoose 等 — `[显式]` |
| 是否有 ORM | false | `package.json:1-102` — `[显式]` |
| 是否有 Migrations | false | 项目结构分析 — `[推断]` |

---

## 存储架构

### 设计理念

Spec-First 采用**纯文件系统存储**，所有数据以文件形式持久化到本地磁盘 (`src/shared/fs-utils.ts:1-102` — 文件 I/O 封装层 — `[显式]`)

### 设计理由

| 理由 | 说明 |
|------|------|
| CLI 工具特性 | 作为命令行工具，无需服务器端数据库 |
| 可移植性 | 文件存储便于版本控制和团队协作（可直接提交到 Git） |
| 简单性 | 避免引入额外的数据库依赖和运维复杂度 |
| 人类可读 | JSON/YAML/Markdown 格式便于直接查看和编辑 |

---

## 持久化机制

### 1. JSON 文件存储

**描述**：JSON 文件存储，用于配置和状态管理

**示例文件** (`src/shared/fs-utils.ts:23-53` — readJson/writeJson 实现 — `[显式]`):

| 文件路径 | 用途 | 核心字段 |
|---------|------|----------|
| `specs/{featureId}/stage-state.json` | Feature 阶段状态 | featureId, currentStage, history, terminal |
| `specs/{featureId}/todo-state.json` | Todo 状态管理 | todos, completed, pending |
| `.spec-first/runtime/*.json` | 运行时数据缓存 | 各类分析结果缓存 |
| `.spec-first/meta/config.yaml` | 项目级配置 | 平台配置、规则配置 |

**数据结构示例** (`src/shared/types.ts:77-102` — StageState 接口定义 — `[显式]`):

```json
{
  "featureId": "FSREQ-20260319-WEBSITE-001",
  "mode": "standard",
  "size": "medium",
  "platforms": ["web"],
  "currentStage": "03_plan",
  "history": [
    {
      "from": "02_design",
      "to": "03_plan",
      "timestamp": "2026-03-19T10:00:00Z",
      "gateResult": "PASS"
    }
  ],
  "terminal": false,
  "createdAt": "2026-03-19T08:00:00Z",
  "updatedAt": "2026-03-19T10:00:00Z",
  "mergedRules": {},
  "stageStatus": {},
  "autoAdvancePolicy": "manual"
}
```

---

### 2. JSONL 日志格式

**描述**：JSONL 格式日志，用于追加式记录

**示例文件** (`src/shared/fs-utils.ts:66-70` — appendJsonl 实现 — `[显式]`):

| 文件路径 | 用途 | 记录类型 |
|---------|------|----------|
| `specs/{featureId}/gate-history.jsonl` | Gate 校验历史记录 | GateResult 对象 |

**数据结构示例** (`src/shared/types.ts:105-132` — GateResult 接口 — `[显式]`):

```jsonl
{"featureId":"FSREQ-20260319-WEBSITE-001","stage":"02_design","status":"PASS","conditions":[{"id":"G-DESIGN-01","status":"PASS"}],"timestamp":"2026-03-19T09:30:00Z"}
{"featureId":"FSREQ-20260319-WEBSITE-001","stage":"02_design","status":"PASS","conditions":[{"id":"G-DESIGN-03","status":"PASS"}],"timestamp":"2026-03-19T09:45:00Z"}
```

**优势**：
- 支持追加写入，无需读取整个文件
- 每行一个完整的 JSON 对象，便于流式处理
- 历史记录完整，支持审计和回溯

---

### 3. Markdown 文件存储

**描述**：Markdown 文件存储，用于规范产物

**示例文件** (`src/shared/fs-utils.ts:55-64` — readMarkdown/writeMarkdown 实现 — `[显式]`):

| 文件路径 | 用途 | 章节结构 |
|---------|------|----------|
| `specs/{featureId}/spec.md` | 需求规范 | Background, FR, NFR, Constraints |
| `specs/{featureId}/design.md` | 技术设计 | Architecture, Modules, DS |
| `specs/{featureId}/task_plan.md` | 任务计划 | TASK 清单，支持 Markdown checkbox |
| `specs/{featureId}/prd.md` | 产品需求文档 | 产品视角的需求描述 |
| `specs/{featureId}/traceability-matrix.md` | 追溯矩阵 | ID → Type → Title → Status → Upstream → Downstream |

**追溯矩阵示例** (`src/shared/types.ts:199-208` — MatrixRow 接口定义 — `[显式]`):

```markdown
| ID | Type | Title | Status | Upstream | Downstream |
|----|------|-------|--------|----------|------------|
| FR-WEBSITE-001 | FR | 首页展示功能 | Planned | - | DS-WEBSITE-001 |
| DS-WEBSITE-001 | DS | 首页模块设计 | Planned | FR-WEBSITE-001 | TASK-WEBSITE-001 |
| TASK-WEBSITE-001 | TASK | 实现首页组件 | Planned | DS-WEBSITE-001 | TC-UT-WEBSITE-001 |
```

---

### 4. YAML 配置文件

**描述**：YAML 格式配置文件

**依赖**：js-yaml@^4.1.0 (`package.json:1-102` — 依赖声明 — `[显式]`)

**示例文件**:

| 文件路径 | 用途 | 配置内容 |
|---------|------|----------|
| `.spec-first/meta/config.yaml` | 项目元配置 | 平台、规则、豁免配置 |
| `templates/migrations/*.yaml` | 迁移清单模板 | 迁移步骤定义 |

**配置示例**:

```yaml
project:
  name: spec-first
  version: 1.1.4

platforms:
  - web
  - mobile
  - backend

rules:
  gate:
    blocking: true
  coverage:
    c3_threshold: 1.0
    c4_threshold: 0.8
```

---

## 关键数据文件清单

### 状态文件（禁止手动编辑）

| 文件 | 作用 | 编辑方式 | 风险等级 |
|------|------|----------|----------|
| `stage-state.json` | Feature 阶段状态 | `spec-first stage advance` | 🔴 高（状态机不可逆） |
| `traceability-matrix.md` | 追溯矩阵 | `spec-first matrix sync` | 🟠 中（覆盖率会失准） |
| `todo-state.json` | Todo 状态 | 对应 CLI 子命令 | 🟠 中 |
| `gate-history.jsonl` | Gate 历史记录 | 自动追加 | 🟢 低 |

**违规后果** (`CLAUDE.md:9-27` — 状态文件禁止手动编辑 — `[显式]`):
- 手动修改状态文件会导致 Gate 校验失准
- 覆盖率数据污染
- 审计日志断裂

---

### 规范产物（可编辑）

| 文件 | 作用 | 编辑时机 |
|------|------|----------|
| `spec.md` | 需求规范 | 01_specify 阶段 |
| `design.md` | 技术设计 | 02_design 阶段 |
| `task_plan.md` | 任务计划 | 03_plan 阶段 |
| `prd.md` | 产品需求文档 | 01_specify 阶段 |
| `rfc/*.md` | 变更请求 | 任意阶段（需变更时） |
| `defects/*.md` | 缺陷记录 | 发现缺陷时 |

---

## 数据流向

### Feature 生命周期数据流

```
00_init
  ├─ 创建 stage-state.json
  └─ 初始化 traceability-matrix.md
     ↓
01_specify
  ├─ 编写 spec.md
  └─ 编写 prd.md
     ↓
02_design
  └─ 编写 design.md（包含 DS）
     ↓
03_plan
  ├─ 编写 task_plan.md
  └─ 更新 traceability-matrix.md（添加 TASK/TC）
     ↓
04_implement
  └─ 执行 TASK，更新 task_plan.md 状态
     ↓
05_verify
  ├─ 执行 TC
  └─ 更新 traceability-matrix.md 状态
     ↓
06_wrap_up
  └─ 整理产物，更新文档
     ↓
07_release
  ├─ 生成 release-note.md
  └─ 执行 smoke test
     ↓
08_done
  └─ 终态，数据归档
```

### Gate 校验数据流

```
用户执行 spec-first gate check
     ↓
读取 stage-state.json（获取当前阶段）
     ↓
读取 traceability-matrix.md（计算覆盖率）
     ↓
读取规范产物（spec.md, design.md, task_plan.md）
     ↓
执行 Gate 条件评估
     ↓
生成 GateResult
     ↓
追加到 gate-history.jsonl
     ↓
返回结果给用户
```

---

## 文件 I/O 封装

Spec-First 提供了统一的文件 I/O 封装层 (`src/shared/fs-utils.ts:1-102` — `[显式]`):

| 函数 | 用途 | 格式 |
|------|------|------|
| `readJson(filePath)` | 读取 JSON 文件 | JSON → Object |
| `writeJson(filePath, data)` | 写入 JSON 文件 | Object → JSON |
| `appendJsonl(filePath, record)` | 追加 JSONL 记录 | Object → JSONL line |
| `readMarkdown(filePath)` | 读取 Markdown 文件 | Markdown → String |
| `writeMarkdown(filePath, content)` | 写入 Markdown 文件 | String → Markdown |
| `readYaml(filePath)` | 读取 YAML 文件 | YAML → Object |
| `writeYaml(filePath, data)` | 写入 YAML 文件 | Object → YAML |

---

## 版本控制集成

### Git 友好设计

所有数据文件都设计为 Git 友好：

| 特性 | 说明 |
|------|------|
| 文本格式 | JSON/YAML/Markdown 均为文本格式，便于 diff |
| 可读性 | 人类可直接阅读和审查 |
| 合并友好 | 结构化格式便于解决合并冲突 |
| 历史追溯 | 通过 Git 历史可追溯所有变更 |

### 推荐的 .gitignore 配置

```gitignore
# 运行时缓存（可重新生成）
.spec-first/runtime/

# 临时文件
*.tmp
*.log

# 依赖
node_modules/
```

---

## 数据完整性保障

### 1. Schema 校验

- JSON 文件通过 TypeScript 类型系统校验 (`src/shared/types.ts:1-248` — `[显式]`)
- YAML 文件通过 js-yaml 解析校验

### 2. 状态机约束

- Stage 转换通过状态机校验 (`src/core/process-engine/stage-machine.ts:30-38` — `[显式]`)
- RFC 状态转换通过状态机校验 (`src/core/change-mgr/rfc-machine.ts:27-35` — `[显式]`)
- Defect 状态转换通过状态机校验 (`src/core/change-mgr/defect-machine.ts:29-37` — `[显式]`)

### 3. ID 格式校验

- 所有追溯 ID 通过正则表达式校验 (`src/core/trace-engine/id-validator.ts:8-23` — `[显式]`)
- ID 生成遵循预定义格式 (`src/core/trace-engine/id-generator.ts:30-52` — `[显式]`)

### 4. 矩阵完整性校验

- 追溯矩阵通过完整性检查 (`src/core/trace-engine/matrix.ts:54-101` — `[显式]`)
- 避免孤儿项和断链

---

## 迁移策略

### 版本升级

当数据格式需要变更时 (`src/core/migrations/` — 迁移模块 — `[推断]`):

1. 检测旧版本格式
2. 执行迁移脚本
3. 生成新版本格式
4. 保留原始文件备份

### 向后兼容

- 新版本 CLI 可读取旧版本数据文件
- 自动迁移机制确保平滑升级

---

## 性能考虑

### 文件 I/O 优化

| 策略 | 说明 |
|------|------|
| 懒加载 | 只在需要时读取文件 |
| 缓存 | 运行时数据缓存到 `.spec-first/runtime/` |
| 流式处理 | JSONL 文件支持流式读取 |
| 批量操作 | 避免频繁的小文件读写 |

### 大型 Feature 处理

对于包含大量 TASK/TC 的 Feature：

- 追溯矩阵采用 Markdown 表格格式，便于增量更新
- Gate 历史采用 JSONL 格式，避免大文件读取
- 覆盖率计算使用缓存机制

---

## 备份与恢复

### 备份策略

由于所有数据均为文件，推荐：

1. **Git 版本控制**：将 `specs/` 目录纳入 Git 管理
2. **定期快照**：对重要 Feature 创建快照
3. **云同步**：使用云存储同步 `.spec-first/` 目录

### 恢复流程

1. 从 Git 历史恢复特定版本
2. 或从备份快照恢复
3. 运行 `spec-first gate check` 验证数据完整性

---

## 总结

Spec-First 的文件存储架构体现了以下设计哲学：

| 原则 | 体现 |
|------|------|
| 简单性 | 无数据库依赖，纯文件存储 |
| 可移植性 | 跨平台兼容，Git 友好 |
| 可读性 | 人类可读的 JSON/YAML/Markdown 格式 |
| 可追溯性 | 完整的历史记录和审计日志 |
| 健壮性 | 类型校验、状态机约束、完整性检查 |

这种架构特别适合 CLI 工具和中小型团队的协作场景，在保持简单性的同时提供了足够的数据完整性和可追溯性保障。
