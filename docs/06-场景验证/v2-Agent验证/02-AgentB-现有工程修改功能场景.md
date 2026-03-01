# 场景验证 02（Agent-B）

> 负责人：Agent-B（现有工程修改功能）  
> 场景类型：已有代码工程，对既有功能做迭代/修复/重构（Mode I，当前开始引入 Spec-First）  
> 目标：在不破坏已有能力的前提下，完成需求变更到发布闭环

## 0. 整体流程总览

| 步骤 | 执行命令（示例） | 说明 |
|---|---|---|
| Step 0 基线补齐 | `spec-first init feature FSREQ-000000-legacy-baseline --mode I --platforms Backend` | 无历史文档时先补可分析基线 |
| Step 1 识别变更等级 | `spec-matrix trace FR-ORDER-001`<br>`spec-matrix show FSREQ-000000-legacy-baseline --format table` | 识别影响范围并判定 Minor/Major/Critical |
| Step 2 启动迭代需求 | `spec-first init feature FSREQ-223344-order-risk-optimization --mode I --platforms Backend,H5` | 创建本次迭代 Feature 目录和运行态 |
| Step 3 Specify（变更版） | `spec-id next FR ORDER`<br>`spec-gate check FSREQ-223344-order-risk-optimization --stage 01_specify --fix-hints` | 输出变更 spec、矩阵和 impact-analysis |
| Step 4 RFC（条件执行） | `spec-rfc create ...`<br>`spec-rfc submit ...`<br>`spec-rfc approve ...` | Major/Critical 必须走审批链 |
| Step 5 Design（增量） | `spec-gate check FSREQ-223344-order-risk-optimization --stage 02_design --fix-hints` | 完成增量设计与兼容性策略 |
| Step 6 Plan（增量） | `spec-matrix check FSREQ-223344-order-risk-optimization`<br>`spec-gate check FSREQ-223344-order-risk-optimization --stage 03_plan --fix-hints` | 拆解任务与回归范围并过 Gate |
| Step 7 Implement | `git commit -m "[TASK-ORDER-001] ..."`<br>`spec-gate check FSREQ-223344-order-risk-optimization --stage 04_implement --fix-hints` | 实施改动并通过实现阶段门禁 |
| Step 8 Verify（回归） | `spec-metrics coverage FSREQ-223344-order-risk-optimization --uncovered`<br>`spec-gate check FSREQ-223344-order-risk-optimization --stage 05_verify --fix-hints` | 回归验证 + 兼容性验证 |
| Step 9 Wrap-up + Release | `spec-gate check FSREQ-223344-order-risk-optimization --stage 06_wrap_up --fix-hints`<br>`spec-gate check FSREQ-223344-order-risk-optimization --stage 07_release --fix-hints`<br>`spec-metrics report FSREQ-223344-order-risk-optimization --output specs/FSREQ-223344-order-risk-optimization/reports/metrics-report.md` | 变更闭环、发布观察与度量沉淀 |

## 1. 场景说明

本场景对应“需求已上线后继续迭代”的高频现实。核心差异是：

1. 不是从空白开始，而是在现网能力上增量演进。
2. 必须做 Impact Analysis。
3. 重大变更要走 RFC 审批链。

## 2. 前置条件

1. 仓库已有可运行业务代码，但历史规范文档可能为空。
2. 已完成 `spec-first init` 和基础配置。
3. 已确认此次改动属于 Mode I（Enhancement/Bugfix/Refactor）。

## 3. Step-by-step 执行流程

## Step 0：先补“可分析基线”（无历史文档时）

命令：

```bash
spec-first init feature FSREQ-000000-legacy-baseline --mode I --platforms Backend
# 立即确认基线阶段状态
spec-gate status FSREQ-000000-legacy-baseline
```

说明：

1. 以最小成本补齐现状：`spec.md`、`design.md`、`traceability-matrix.*`。
2. 只覆盖本次将被修改的模块与接口，不要求全量历史一次补全。
3. 形成后续 Impact Analysis 的输入基线。

## Step 1：识别变更等级（Minor/Major/Critical）

命令：

```bash
# 查看本次迭代涉及链路（示例 ID）
spec-matrix trace FR-ORDER-001

# 查看基线矩阵，识别影响范围
spec-matrix show FSREQ-000000-legacy-baseline --format table
```

说明：

1. 先判定是否影响 API 契约、核心数据模型、跨 Feature 依赖。
2. 判定变更等级，决定是否必须 RFC。

1. 本步骤目标是先把“改动影响”看清楚，再决定走 Minor 还是 Major/Critical。
2. 影响接口、数据模型、跨 Feature 依赖时，优先按高等级处理。

建议：

1. Minor：可快速通道，但仍要保留追踪与验证证据。
2. Major/Critical：必须先建 RFC，再进入执行。

## Step 2：启动迭代 Feature（Mode I）

命令：

```bash
spec-first init feature FSREQ-223344-order-risk-optimization --mode I --platforms Backend,H5
# 检查初始化状态
spec-gate status FSREQ-223344-order-risk-optimization
```

说明：

1. 关联原有 Feature 与历史版本。
2. 初始化迭代目录与运行态三文件。
3. 记录当前 baseline。

## Step 3：01 Specify（变更需求规格化）

命令：

```bash
# 生成/补充 ID（示例）
spec-id next FR ORDER
spec-id next TASK ORDER

# 执行 Specify 内联校验
spec-gate check FSREQ-223344-order-risk-optimization --stage 01_specify --fix-hints
```

说明：

1. 基于产品需求输出“变更版 spec”。
2. 标记新增/修改/废弃 FR/NFR。
3. 对高风险项增加约束与验收条件。

必须产出：

1. `spec.md`（增量规范）。
2. `traceability-matrix.*`（保留历史行，新增/变更行标记状态）。
3. `impact-analysis.md`（Mode I 关键文档）。

1. 变更 spec 里要明确“新增/修改/废弃”三类需求。
2. `impact-analysis.md` 是 Mode I 的关键输入，必须在本步骤形成初稿。

## Step 4：变更管理（RFC 分支）

若变更等级为 Major/Critical，执行：

命令：

```bash
spec-rfc create FSREQ-223344-order-risk-optimization --level major --reason "订单风控规则升级"
spec-rfc submit RFC-012
spec-rfc approve RFC-012
```

说明：

1. RFC 必须列出受影响 FR/NFR/TASK/TC。
2. 审批链完整（签名可追溯）。

## Step 5：02 Design（增量技术方案）

命令：

```bash
# 设计阶段前先看条件
spec-gate conditions FSREQ-223344-order-risk-optimization

# 执行 ★ Gate 1: Design Ready
spec-gate check FSREQ-223344-order-risk-optimization --stage 02_design --fix-hints
```

说明：

1. 在 `design.md` 明确“旧行为 vs 新行为”。
2. 如涉及契约，更新 `contracts/*.yaml` 并执行兼容性策略。
3. 更新 `data-model.md`（如有字段或状态机变更）。

1. 必须写清“旧行为 vs 新行为”，否则回归边界不清。
2. 契约变更要同步消费方并记录在影响分析中。

## Step 6：03 Plan（增量任务与回归范围）

命令：

```bash
# 任务拆解后先校验矩阵，再推进 Gate
spec-matrix check FSREQ-223344-order-risk-optimization
spec-gate check FSREQ-223344-order-risk-optimization --stage 03_plan --fix-hints
```

说明：

1. 拆解增量 TASK，标明 `traces` 与依赖。
2. 明确回归范围（P0/P1/P2）。
3. 对跨模块变更增加并行/串行执行策略。

1. 任务与回归范围必须一一对应，避免“改了但没测”。
2. 对高风险链路标注 P0 回归优先级。

## Step 7：04 Implement（安全改造 + 风险控制）

命令：

```bash
git add .
git commit -m "[TASK-ORDER-001] refine risk rule"
git push

# ★ Gate 2: Code Ready
spec-gate check FSREQ-223344-order-risk-optimization --stage 04_implement --fix-hints
```

说明：

1. 按任务实施改动并补充追踪注释。
2. pre-push 做增量 SCA 快速反馈。
3. PR 强制关联 TASK/RFC。

1. 先通过本地 Hook，再依赖 CI 全量校验。
2. 若涉及 RFC，PR 和提交信息里都要保留 RFC 关联。

## Step 8：05 Verify（重点做回归与兼容性验证）

命令：

```bash
# 先看覆盖率缺口，再补测
spec-metrics coverage FSREQ-223344-order-risk-optimization --uncovered

# ★ Gate 3: Release Ready
spec-gate check FSREQ-223344-order-risk-optimization --stage 05_verify --fix-hints
```

说明：

1. 产出或更新 `regression-report.md`。
2. 执行关键链路回归与异常路径验证。
3. 对外部依赖或消费方做联调确认。

1. 兼容性验证与回归测试是本场景核心，不可简化为只跑冒烟。
2. `regression-report.md` 要可复现（范围、用例、结果、结论）。

## Step 9：06 Wrap-up 与 07 Release

命令：

```bash
spec-gate check FSREQ-223344-order-risk-optimization --stage 06_wrap_up --fix-hints
spec-gate check FSREQ-223344-order-risk-optimization --stage 07_release --fix-hints
spec-metrics report FSREQ-223344-order-risk-optimization --output specs/FSREQ-223344-order-risk-optimization/reports/metrics-report.md
```

说明：

1. 完成归档与复盘（含变更收益、缺陷、返工分析）。
2. 发布前确认回滚方案和观察指标。
3. 发布后跟踪缺陷逃逸率窗口。
1. Wrap-up 关注“变更闭环证据”，Release 关注“上线风险可控”。
2. 变更类需求建议在发布后固定观察窗口内追踪逃逸缺陷。

## 4. 场景验收标准

1. Impact Analysis 可追溯到所有变更项。
2. Major/Critical 变更均有 RFC 审批证据。
3. 回归范围、执行结果、逃逸缺陷可量化复盘。
4. 发布后关键指标稳定，无新增阻断级事故。

## 5. 常见失败与修复建议

1. 只改代码不改矩阵：必须同步追踪矩阵与 RFC 影响清单。
2. 只做增量 SCA 不看全量：CI 全量失败后需补齐间接影响链。
3. 变更说明不完整：在 `design.md` 增加“行为差异说明”专节。

## 6. 当前实现状态说明

本场景命令链在文档中已定义（`spec-rfc`、`spec-gate` 等），落地时需确认 CLI 发行版本是否包含对应子命令；若未落地，先按同名文档模板手工执行并保留审计记录。
