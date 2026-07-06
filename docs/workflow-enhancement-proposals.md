# Spec-First Workflow 节点增强提案

> 参考来源：`/Users/kuang/xiaobu/scale-engine/docs/workflow/WORKFLOW_COMPARISON_SCALE_CONFIGS.md`
> 分析日期：2026-06-02

---

## 核心 Workflow 链路

```
Codebase → Graph → Spec → Plan → Tasks → Code → Review → Knowledge
 setup      bootstrap ideate  plan  write-  work   code-   compound
 update               brainstorm     tasks          review  sessions
                      prd         (standalone)      doc-
                                                    review
```

---

## 一、Codebase 节点

**对应命令**：`spec-mcp-setup`；runtime CLI 维护动作走 `spec-first update`

**当前能力**：环境就绪检查、runtime 资产同步。

**缺口**：无法在 setup 阶段感知仓库健康度；无 preflight 清单生成。

### 建议新增

| 类型 | 名称 | 用途 |
|------|------|------|
| Agent | `spec-repo-health-auditor` | setup 时扫描仓库健康信号：无测试覆盖的高频改动文件、循环依赖、陈旧 `docs/solutions/`、过期 plan 状态 |
| Agent | `spec-context-budget-advisor` | 读取仓库规模和当前任务描述，输出建议的 context 预算分配——哪些文件优先、哪些应排除，避免 context 溢出 |

---

## 二、Graph 节点

**对应命令**：`spec-graph-bootstrap`（计划移除 GitNexus 后待替换）

**移除 GitNexus 后的增强方向**（provider-agnostic）：

### 建议新增

| 类型 | 名称 | 用途 |
|------|------|------|
| Skill | `spec-codebase-indexer` | 轻量代码索引：基于 ast-grep / tree-sitter 生成符号-文件映射，写入 `.spec-first/graph/symbol-index.json`，不依赖外部 MCP |
| Agent | `spec-dependency-graph-analyzer` | 分析模块间依赖关系，识别高耦合模块、循环依赖、blast-radius 高风险点，输出 advisory facts |

---

## 三、Spec 节点

**对应命令**：`spec-brainstorm`、`spec-prd`、`spec-ideate`

**当前能力**：需求探索 + PRD 产出。

**缺口**：缺少结构化的"主要矛盾识别"步骤；缺少外部调研标准化通道；PRD 完成后无自动 trace self-check。

### 建议新增

| 类型 | 名称 | 用途 |
|------|------|------|
| Agent | `spec-requirements-gap-detector` | 对已有 PRD 或 brainstorm 文档做静态分析：找出无验收标准的需求、互相矛盾的假设、scope creep 风险 |
| Agent | `spec-prior-art-researcher` | ideate/brainstorm 阶段搜索类似已有实现（内部 `docs/solutions/` + 外部），防止重造轮子 |
| Agent | `spec-trace-self-checker` | PRD 产出后验证 R/F/AE 可追溯性闭环：每条需求是否有对应验收示例，每个 AE 是否可测 |

---

## 四、Plan 节点

**对应命令**：`spec-plan`

**当前能力**：多 agent 研究 + 结构化计划产出，已有 confidence-first deepening。

**缺口**：缺少设计阶段 threat model（安全问题在 review 发现太晚）；缺少 API contract 设计校验；缺少 rollback plan 标准化生成。

### 建议新增

| 类型 | 名称 | 用途 |
|------|------|------|
| Agent | `spec-plan-threat-modeler` | 规划阶段对涉及 auth/payments/external API/DB 的计划做 lightweight STRIDE threat model，输出威胁清单和缓解建议，在实现前可见 |
| Agent | `spec-api-design-reviewer` | Plan 阶段对拟设计 API 做 contract-first 审查：幂等性、版本兼容、错误码规范，早于实现发现问题 |
| Agent | `spec-rollback-plan-generator` | 对每个实施单元生成标准化 rollback plan：哪些改动可逆、依赖回滚顺序、数据迁移回滚点 |

---

## 五、Tasks 节点

**对应命令**：`spec-write-tasks`

**当前能力**：将计划编译为派生任务包。

**缺口**：无任务依赖图可视化；无并行化潜力分析；无 task 与测试覆盖的自动绑定检查。

### 建议新增

| 类型 | 名称 | 用途 |
|------|------|------|
| Agent | `spec-task-dag-analyzer` | 分析任务包的依赖关系图，识别关键路径、可并行执行的任务组、循环依赖风险，输出优化后的执行顺序建议 |
| Agent | `spec-task-test-coverage-binder` | 检查每个 feature-bearing 任务单元是否有绑定的测试场景，对缺少测试的任务给出警告和补充覆盖点建议 |

---

## 六、Code 节点

**对应命令**：`spec-work`

**当前能力**：系统化执行开发任务。

**缺口**：缺少 TDD 纪律保障；缺少 commit 节律监控；缺少持续 verification；缺少多会话文件冲突检测。

### 建议新增

| 类型 | 名称 | 用途 |
|------|------|------|
| Agent | `spec-tdd-enforcer` | 监督 TDD 节律：检测新行为是否先有失败测试，识别跳过 TDD 的模式，输出 TDD coverage gap |
| Agent | `spec-commit-discipline-advisor` | 分析当前 git status：未提交文件数/行数阈值告警，建议合理的原子提交切分，防止巨型单提交 |
| Agent | `spec-verification-evidence-recorder` | work 完成后生成结构化 verification evidence：哪些命令实际运行了、退出码、关键输出摘要，写入 `.spec-first/workflows/` 存档 |

---

## 七、Review 节点

**对应命令**：`spec-code-review`、`spec-doc-review`

**当前能力**：已相当完善，20+ reviewer agents；dispatch 可用且授权时多 persona，缺失时有 report-only fallback。

**缺口**：缺少 supply chain 安全审查；缺少 AI 生成代码质量专项检测；缺少跨 PR 累积债务追踪。

### 建议新增

| 类型 | 名称 | 用途 |
|------|------|------|
| Agent | `spec-supply-chain-reviewer` | 审查 PR 中新增/升级的依赖包：版本锁定、CVE 风险、license 合规、unusual 依赖树变更 |
| Agent | `spec-ai-slop-detector` | 专门检测 AI 生成代码的常见问题：过度抽象、无用注释、僵尸代码、幻觉 API 调用、命名通货膨胀 |
| Agent | `spec-tech-debt-tracker` | 结合 git history 和当前 diff，识别本次改动是否引入新 tech debt 或偿还了已知债务，输出 debt delta |

---

## 八、Knowledge 节点

**对应命令**：`spec-compound`、`spec-compound-refresh`、`spec-sessions`

**当前能力**：解决方案沉淀到 `docs/solutions/`，历史会话查询。

**缺口**：缺少结构化复盘（不只沉淀解决方案，还要提炼模式）；缺少 knowledge freshness 衰减管理；缺少 rejected rationale 系统性记录。

### 建议新增

| 类型 | 名称 | 用途 |
|------|------|------|
| Agent | `spec-retrospective-synthesizer` | compound 时不只记录"怎么解决"，而是提炼"为什么会出现这类问题"的模式，写入可复用 pattern doc |
| Agent | `spec-knowledge-freshness-auditor` | 定期扫描 `docs/solutions/` 的文档年龄、被引用频率、是否仍适用，输出"过期/有效/待验证"状态，防止知识腐烂 |
| Skill | `spec-rejected-rationale-capture` | brainstorm/plan/review 完成时，专门记录"考虑了但未采用的方案"及其原因，沉淀到 decisions log，防止下次重蹈覆辙 |

---

## 优先级汇总

### 高优先级（解决当前最明显的 gap）

| 节点 | 新增 | 核心价值 |
|------|------|---------|
| Code | `spec-verification-evidence-recorder` | work 执行后有可追溯证据 |
| Code | `spec-tdd-enforcer` | TDD 纪律保障 |
| Plan | `spec-plan-threat-modeler` | 安全问题前置发现 |
| Review | `spec-ai-slop-detector` | AI 代码质量专项 |
| Knowledge | `spec-retrospective-synthesizer` | 知识沉淀质量提升 |

### 中优先级（增强现有节点深度）

| 节点 | 新增 |
|------|------|
| Spec | `spec-requirements-gap-detector` |
| Plan | `spec-api-design-reviewer` |
| Tasks | `spec-task-dag-analyzer` |
| Review | `spec-supply-chain-reviewer` |
| Knowledge | `spec-knowledge-freshness-auditor` |

### 低优先级 / 长期方向

| 节点 | 新增 |
|------|------|
| Codebase | `spec-repo-health-auditor` |
| Graph | `spec-codebase-indexer`（GitNexus 移除后替代） |
| Code | `spec-commit-discipline-advisor` |
| Knowledge | `spec-rejected-rationale-capture` |

---

## 设计原则提示

来自 WORKFLOW_COMPARISON_SCALE_CONFIGS.md 的核心取舍建议，应在新增 skill/agent 时遵守：

- **脚本产出事实，LLM 做语义判断**：新 agent 不应硬编码业务优先级或架构结论
- **source 优先于 runtime**：agent 产出写入 source 目录（`docs/`、`agents/`），不手改 generated mirrors
- **light contract 优先于完整状态机**：新 agent 输出 reason_code + advisory facts，不做强 block
- **证据前置化**：plan 阶段就开始收集 security/contract 证据，不等到 review 阶段才暴露
- **知识活化**：不只沉淀，还要管理知识的鲜度和模式提炼

---

## 参考资料

- scale-engine 项目：`/Users/kuang/xiaobu/scale-engine`
- 对比分析文档：`/Users/kuang/xiaobu/scale-engine/docs/workflow/WORKFLOW_COMPARISON_SCALE_CONFIGS.md`
- 当前 spec-first workflow 映射：`docs/workflow-skill-agent-map.md`
