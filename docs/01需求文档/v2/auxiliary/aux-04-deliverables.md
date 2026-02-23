# Spec-First v7.1 — 产出物标准化

> **模块**: 辅助功能模块 #4 | **拆分自**: spec-first-v7.md L1590-1668
> **版本**: v7.1 | **更新**: 2026-02-09

---

## 目录结构

```text
.spec-first/                        # 项目级配置目录
├── current                         # 当前 Feature 指针（纯文本，纳入 .gitignore）
├── config.yaml                     # 全局配置（可选）
├── constitution.md                 # 项目宪法（项目级单例，所有 Feature 共享）
└── layer2/                         # Layer 2 端规范目录
    ├── h5.yaml                     # H5 前端端规范
    ├── java-backend.yaml           # Java 后端端规范
    ├── go-backend.yaml             # Go 后端端规范
    └── ...                         # 各端独立维护，按需补录

specs/                              # Feature 工作区根目录
├── .feat-registry.md               # FEAT 缩写注册表（全局唯一）
└── <featureId>/                    # 单个 Feature 目录
    ├── stage-state.json            # 阶段状态机（M1 管理）
    ├── constitution.md             # 项目宪法引用（从 .spec-first/constitution.md 复制，00_init 生成）
    ├── spec.md                     # 需求规格（01_specify）
    ├── design.md                   # 技术设计（02_design）
    ├── research.md                 # 技术调研（02_design 可选）
    ├── contracts/*.yaml            # API 契约（02_design）
    ├── data-model.md               # 数据模型（02_design M/L）
    ├── adr/*.adr.md                # 架构决策记录
    ├── rfc/*.rfc.md                # 变更请求记录（横切 Change Management）
    ├── impact-analysis.md          # 变更影响分析（Mode I 必须）
    ├── known-exceptions.md         # 已知豁免清单（按 Feature 管理）
    ├── task_plan.md                # 任务拆解与执行计划（03_plan 产出，运行态持续更新）
    ├── checklist.md                # 验证清单（03_plan）
    ├── tests/*.test.md             # 测试用例（05_verify）
    ├── reports/                    # 报告目录
    │   ├── code-review-report.md   # 代码评审报告（04_implement）
    │   ├── test-report.md          # 测试报告
    │   ├── security-scan.md        # 安全扫描报告
    │   ├── uat-signoff.md          # 验收签核记录
    │   ├── regression-report.md    # 回归验证报告（Mode I 必须）
    │   ├── release-note.md         # 发布说明（07_release）
    │   └── smoke-test-report.md    # 冒烟测试报告（07_release）
    ├── retro.md                    # 复盘报告（06_wrap_up）
    ├── traceability-matrix.md      # 追踪矩阵（或 .yaml）
    ├── progress.md                 # 进度记录（运行态）
    ├── findings.md                 # 过程发现（运行态）
    ├── gate-history.jsonl          # Gate 评估历史
    ├── ai-stats.jsonl              # AI 调用统计
    └── metrics.jsonl               # 度量数据
```

**产物命名**：任务拆解产物统一命名为 `task_plan.md`，不再支持 `tasks.md`。

---

## 文件格式规范

| 文件类型 | 格式 | 解析方式 |
|----------|------|----------|
| 规范文档（spec/design/task_plan） | Markdown + YAML frontmatter | remark AST |
| API 契约 | OpenAPI 3.x YAML | js-yaml |
| 状态数据 | JSON | 原生 JSON.parse |
| 时序数据（gate/metrics/ai-stats） | JSONL（每行一条 JSON） | 逐行解析 |
| 追踪矩阵 | Markdown 表格 或 YAML | remark / js-yaml |

---

## 运行态三文件

Skill 执行过程中持续更新的 3 个文件，用于 Session Catchup 和进度追踪：

| 文件 | 用途 | 更新时机 |
|------|------|----------|
| `progress.md` | 记录阶段完成状态和关键里程碑 | Phase 完成时必须更新；其余步骤按需更新 |
| `findings.md` | 记录关键发现、决策、风险 | 出现关键决策/风险/取舍时更新（建议） |
| `task_plan.md` | 当前任务计划和进度状态 | 任务开始/完成时更新；Phase 完成时必须标记 `complete` |

### 轻量更新约束（v2 默认）

- `MUST`：Phase 标记为 `complete` 时，`task_plan.md` 与 `progress.md` 在同一会话内同步更新。
- `SHOULD`：`findings.md` 仅记录关键内容，不要求高频更新。
- `MUST NOT`：因 `findings.md` 未更新而单独阻断阶段推进。

---

## 模板系统

所有初始化文件通过 Handlebars 模板生成，模板存放于 `templates/` 目录：

```text
templates/
├── init/                           # 项目初始化模板
│   ├── stage-state.json.hbs       ✅ 已存在
│   └── constitution.md.hbs        ✅ 已存在
├── matrix/                         # 追踪矩阵模板
│   ├── traceability-matrix.md.hbs ✅ 已存在
│   └── traceability-matrix.yaml.hbs ✅ 已存在
├── gate/                           # Gate 报告模板
│   └── gate-report.md.hbs        ✅ 已存在
├── review/                         # 代码评审报告模板
│   └── code-review-report.md.hbs 📋 待创建（格式规范见 code-review-integration.md 第四章）
└── metrics/                        # 度量报告模板
    └── health-report.md.hbs      ✅ 已存在
```

---

*aux-04-deliverables.md 完成 — 下一篇：[aux-05-metrics.md](aux-05-metrics.md)*
