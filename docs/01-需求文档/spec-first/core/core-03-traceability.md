# Spec-First v7.1 — 文档关联索引体系

> **模块**: 核心研发流程 #3 | **拆分自**: spec-first-v7.md L515-693
> **版本**: v7.1 | **更新**: 2026-02-09

---

## 设计目标

解决"需求遗漏"和"过度实现"两大核心问题：通过统一 ID 体系 + 文档关联索引 + 最小健康度指标，实现以源文档为中心的可追踪、可量化、可审计流程。

---

## ID 规范

### 设计原则

- **稳定性**：ID 一次分配，终身不改；需求废弃后不得复用
- **可解析**：统一前缀和序号位数，支持正则校验
- **全局可识别**：ID 携带 Feature/Domain 缩写，脱离目录上下文仍可识别来源

### ID 类型定义（6 种）

> 权威定义见本章与 `document-links.yaml` 规范。本文只保留 ID 体系、文档关联索引和最小健康检查，不再维护条目级矩阵。

| 前缀 | 全称 | 格式 | 示例 | 正则 | 定义阶段 |
|------|------|------|------|------|---------|
| `Feature` | Feature ID | `FSREQ-YYYYMMDD-<FEAT>-NNN` | `FSREQ-20260210-AUTH-001` | — | 00 Init |
| `FR` | Functional Requirement | `FR-<FEAT>-NNN` | `FR-AUTH-001` | `^FR-[A-Z][A-Z0-9]{1,15}-\d{3}$` | 01 Specify |
| `DS` | Design Section | `DS-<FEAT>-NNN` | `DS-AUTH-001` | `^DS-[A-Z][A-Z0-9]{1,15}-\d{3}$` | 02 Design |
| `TASK` | Implementation Task | `TASK-<FEAT>-NNN` | `TASK-AUTH-001` | `^TASK-[A-Z][A-Z0-9]{1,15}-\d{3}$` | 03 Plan |
| `TC` | Test Case | `TC-<LVL>-<FEAT>-NNN` | `TC-E2E-AUTH-001` | `^TC-(UT\|IT\|E2E\|ST)-[A-Z][A-Z0-9]{1,15}-\d{3}$` | 05 Verify |
| `RFC` | Request for Change | `RFC-NNN` | `RFC-001` | `^RFC-\d{3}$` | 横切机制 C |

**合并说明**：

| 原独立类型 | 合入目标 | 方式 | 示例 |
|-----------|---------|------|------|
| NFR | FR | 加 `[NFR:DIM]` 标签 | `FR-AUTH-003 [NFR:PERF]` |
| API | DS | `api_ref` 属性字段 | DS 记录中引用 `contracts/*.yaml` |
| ADR | RFC | `type: ADR` 子类型 | RFC 记录中标注 `type: ADR` |

**说明**：

- `<FEAT>` 为 Feature 缩写（2-16 位大写字母+数字，首位必须为字母），如 AUTH、PAY、ORDER。**FEAT 缩写必须全局唯一**，通过 FEAT 注册表治理
- `<LVL>` 固定枚举：`UT`（单元测试）、`IT`（集成测试）、`E2E`（端到端测试）、`ST`（静态分析测试）
- NNN 为三位数字，从 001 开始递增
- **ID 生成**：通过 CLI 命令 `spec-first id next <type> <featAbbr>` 自动生成，禁止手动编造

### FEAT 注册表

为确保 `<FEAT>` 缩写全局唯一，项目须维护 FEAT 注册表文件 `specs/.feat-registry.md`。

**治理规则**：

1. **Init 内联校验**：00 Init 阶段必须检查新 FEAT 缩写是否与注册表中已有条目冲突，冲突则阻塞
2. **先注册后使用**：任何 FR/TASK/TC/API 使用新 FEAT 缩写前，必须先在注册表中登记
3. **禁止歧义缩写**：同一业务域不得注册多个缩写
4. **废弃不复用**：FEAT 缩写废弃后标记 `Deprecated`，不得被新 Feature 复用

### 跨产物引用规则

| 引用场景 | 格式 | 示例 |
|---------|------|------|
| 产出物正文中引用 | 直接写 ID | "本设计实现 FR-AUTH-001 的注册功能" |
| 结构化元数据引用 | `traces: [ID, ...]` | `traces: [FR-AUTH-001, FR-AUTH-002]` |
| AC 级别引用 | `ID/AC-N` | `FR-AUTH-001/AC-2` |
| 代码注释引用 | `// implements: ID` | `// implements: TASK-AUTH-001` |
| Git Commit 引用 | `[ID] message` | `[TASK-AUTH-001] 实现用户注册接口` |
| PR 描述引用 | `Implements: ID` | `Implements: TASK-AUTH-001` |

**强制规则**：

- 每个 TASK 必须有 `traces` 字段，引用至少 1 个 FR 或 NFR
- 每个 TC 必须有 `verifies` 字段，引用至少 1 个 FR/AC 或 NFR
- 每个 PR 描述中必须包含至少 1 个 TASK ID
- 无 traces 的 TASK 视为"过度实现"，需在 CR 中说明理由

---

## 文档关联索引

文档关联索引（Document Links）是全链路协作的核心产出物，记录文档之间的引用链路。

**产出物**：`document-links.yaml`，存放于 Feature 目录根下。

### 索引格式

```markdown
# 文档关联索引 — <Feature Name>

- path: spec.md
  kind: requirements
  stage: 01_specify
  references: []
```

> 关联索引只记录文档引用，不承载任务/测试条目级状态流转。

---

## 文档关联规则

文档关联索引只记录文档级引用，不记录 FR/DS/TASK/TC 条目级多跳关系。

### 索引内容

| 项 | 说明 |
|----|------|
| `path` | 文档相对路径 |
| `kind` | 文档类别，如 requirements / design / task / report |
| `stage` | 所属阶段 |
| `references` | 该文档显式引用的其他文档路径 |

### 校验范围

1. 文档是否存在
2. 引用是否指向已声明文档
3. 当前阶段是否声明了必要文档

### 异常与豁免

- 变更、缺陷、豁免统一记录在 `rfc/*.json`、`known-exceptions.md`、`gate-history.jsonl`
- 不再通过矩阵状态机表达 Exception/Cancelled/Accepted 的条目流转
- 健康度指标由 `metrics report` 汇总展示，不在本文维护公式

---

*core-03-traceability.md 完成 — 下一篇：[core-04-process.md](core-04-process.md)*
