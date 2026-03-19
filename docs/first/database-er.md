# 数据存储模型

## 概述

Spec-First 是 CLI 工具，使用**文件系统**存储数据，不依赖数据库。

## 存储架构

```
文件系统存储
    │
    ├── JSON 文件 — 结构化状态数据
    │   ├── stage-state.json
    │   └── .spec-first/runtime/first/*.json
    │
    └── Markdown 文件 — 人类可读文档
        ├── traceability-matrix.md
        ├── prd.md
        ├── spec.md
        └── ...
```

## Feature 产物存储

### 目录结构

```
specs/{featureId}/
├── stage-state.json        # 阶段状态（机器真源）
├── traceability-matrix.md  # 追踪矩阵（Git 追踪）
├── constitution.md         # 项目宪法副本
├── prd.md                  # PRD 文档
├── spec.md                 # 需求规格
├── design.md               # 技术设计
├── task_plan.md            # 任务计划
├── findings.md             # 决策记录
├── impact-analysis.md      # 影响分析（Mode I）
├── reports/                # 报告目录
│   └── *.md
├── contracts/              # 契约目录
│   └── *.md
└── tests/                  # 测试目录
    └── *.md
```

### stage-state.json 结构

```json
{
  "featureId": "FSREQ-20260319-WEBSITE-001",
  "mode": "N",
  "size": "M",
  "platforms": ["frontend"],
  "currentStage": "03_plan",
  "history": [
    {
      "from": "00_init",
      "to": "01_specify",
      "timestamp": "2026-03-19T00:00:00.000Z"
    }
  ],
  "terminal": false,
  "createdAt": "2026-03-19T00:00:00.000Z",
  "updatedAt": "2026-03-19T00:00:00.000Z"
}
```

### traceability-matrix.md 结构

```markdown
| ID | Type | Title | Status | Upstream | Downstream |
|----|------|-------|--------|----------|------------|
| FR-WEBSITE-001 | FR | 首页展示 | Planned | | DS-WEBSITE-001 |
| DS-WEBSITE-001 | DS | 首页组件设计 | Planned | FR-WEBSITE-001 | |
```

## 项目配置存储

### 目录结构

```
.spec-first/
├── current                 # 当前 Feature ID（单行文本）
├── constitution.md         # 项目宪法
├── meta/
│   └── config.yaml         # 项目配置
└── runtime/
    └── first/              # 项目认知 runtime
        ├── index.json      # 索引
        ├── summary.json
        ├── steering.json
        └── ...
```

### current 文件

```
FSREQ-20260319-WEBSITE-001
```

### config.yaml 结构

```yaml
gate:
  thresholds:
    G-IMPL-01:
      value: 0.8
      direction: higher_is_better
    G-VERIFY-01:
      value: 0.9
      direction: higher_is_better
```

## 注册表存储

### FEAT 缩写注册表

**位置**：`specs/.feat-registry.md`

```markdown
| FEAT | Feature ID |
|------|------------|
| WEBSITE | FSREQ-20260319-WEBSITE-001 |
| UIOPT | FSREQ-20260313-UIOPT-001 |
```

## 存储特性

### 优势

| 特性 | 说明 |
|------|------|
| Git 可追踪 | 所有文件可被 Git 版本控制 |
| 人类可读 | Markdown 格式便于审阅 |
| 无外部依赖 | 无需数据库安装与维护 |
| 审计友好 | 历史记录可追溯 |

### 约束

| 约束 | 说明 |
|------|------|
| 并发写入 | 使用文件锁（.registry.lock）保护 |
| 大规模 | 单项目建议 < 100 Features |
| 查询性能 | 无索引，依赖文件遍历 |

## 证据来源

- Feature 目录 (`specs/`) — 显式
- 配置目录 (`.spec-first/`) — 显式
- 类型定义 (`src/shared/types.ts:77-102`) — StageState 结构 — 显式
