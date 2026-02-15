# 场景验证 01（Agent-A）

> 负责人：Agent-A（现有工程新增功能）  
> 场景类型：已有代码工程，新增业务功能（Mode N，当前开始引入 Spec-First）  
> 目标：从产品需求输入到发布收尾，完整走通 Spec-First 研发链路

## 0. 整体流程总览

| 步骤 | 执行命令（示例） | 说明 |
|---|---|---|
| Step 0 初始化与检查 | `spec-first init`<br>`spec-first doctor` | 首次引入时先拉起工具链并做环境体检 |
| Step 0.5 基线建档 | `spec-first init feature FSREQ-000000-legacy-baseline --mode I --platforms Backend` | 为现有工程建立最小可分析基线（spec/design/matrix） |
| Step 1 启动新增需求 | `spec-first init feature FSREQ-123456-user-auth --mode N --platforms H5,Backend` | 创建新增需求目录与运行态文件 |
| Step 2 Specify | `spec-id next FR AUTH`<br>`spec-gate check FSREQ-123456-user-auth --stage 01_specify --fix-hints` | 生成标准 PRD（`spec.md`）并完成需求侧 Gate |
| Step 3 Design | `spec-gate check FSREQ-123456-user-auth --stage 02_design --fix-hints` | 完成技术设计、契约和数据模型并过 Gate |
| Step 4 Plan | `spec-matrix check FSREQ-123456-user-auth`<br>`spec-gate check FSREQ-123456-user-auth --stage 03_plan --fix-hints` | 任务拆解、追踪绑定、规划阶段放行 |
| Step 5 Implement | `git commit -m "[TASK-AUTH-001] ..."`<br>`spec-gate check FSREQ-123456-user-auth --stage 04_implement --fix-hints` | 开发实现并通过实现阶段质量门禁 |
| Step 6 Verify | `spec-metrics coverage FSREQ-123456-user-auth --uncovered`<br>`spec-gate check FSREQ-123456-user-auth --stage 05_verify --fix-hints` | 测试、安全、UAT 验证并补齐覆盖率 |
| Step 7 Wrap-up | `spec-matrix check FSREQ-123456-user-auth --strict`<br>`spec-gate check FSREQ-123456-user-auth --stage 06_wrap_up --fix-hints` | 收尾归档、复盘、矩阵状态收敛 |
| Step 8 Release | `spec-gate check FSREQ-123456-user-auth --stage 07_release --fix-hints`<br>`spec-metrics report FSREQ-123456-user-auth --output specs/FSREQ-123456-user-auth/reports/metrics-report.md` | 发布与观察窗口通过，输出最终度量报告 |

## 1. 场景说明

你收到产品输出的原始需求文档（可为 PRD 草稿、需求说明、评审纪要），作为研发负责人，需要：

1. 理解需求并产出标准化 PRD（Spec-First 的 `spec.md`）。
2. 通过评审后进入技术方案设计。
3. 按 00-07 阶段持续推进，直到发布完成。

本场景使用 **Mode N（新建能力）**，不走 RFC 变更主通道。  
重点前提：**历史规范文档为空**，先做一次最小基线建档。

## 2. 前置条件

1. 仓库已存在并可正常开发。
2. 当前没有历史 Spec-First 文档（首次引入）。
3. 产品需求输入已落盘（建议存放在 `specs/<feature>/inputs/`）。

## 3. Step-by-step 执行流程

## Step 0：项目初始化与环境检查（首次引入）

命令：

```bash
spec-first init
spec-first doctor
```

说明：

1. `.spec-first/`、`specs/.feat-registry.md` 已生成。
2. Hook 安装正常（commit-msg / pre-push）。
3. `constitution.md`、`config.yaml` 可用。

## Step 0.5：已有工程最小基线建档（一次性）

命令：

```bash
spec-first init feature FSREQ-000000-legacy-baseline --mode I --platforms Backend
# 基线建档后，建议立即检查当前状态
spec-gate status FSREQ-000000-legacy-baseline
```

说明：

1. 用 `FSREQ-000000-legacy-baseline` 建一个“现状基线 Feature”。
2. 最小补齐：`spec.md`（当前已上线能力摘要）、`design.md`（现状架构）、`traceability-matrix.*`（只登记主链路）。
3. 该基线仅用于后续新增功能的依赖与影响判断，不追求一次性补全全部历史细节。

## Step 1：启动新增 Feature（目录与元数据初始化）

命令（按技术方案口径）：

```bash
spec-first init feature FSREQ-123456-user-auth --mode N --platforms H5,Backend
# 确认当前阶段已初始化到 00_init
spec-gate status FSREQ-123456-user-auth
```

补充：部分手册写法是 `spec-first feature init`，实施时需统一成一个入口。

说明：

1. `specs/FSREQ-123456-user-auth/` 目录（与 `FSREQ-000000-legacy-baseline` 并存）。
2. 运行态三文件：`task_plan.md`、`findings.md`、`progress.md`。
3. `stage-state.json`（当前阶段 `00_init`）。
4. FEAT 注册表写入（如 `AUTH`）。

## Step 2：01 Specify（需求理解 -> 标准 PRD）

输入：

1. 产品原始需求文档。
2. 业务约束、范围边界、验收口径。

命令：

```bash
# 按需注册 FEAT（如未注册）
spec-id register AUTH "用户认证"

# 生成需求 ID（示例）
spec-id next FR AUTH
spec-id next NFR AUTH --dim SEC

# 完成文档后做阶段校验
spec-gate check FSREQ-123456-user-auth --stage 01_specify --fix-hints
```

说明：

1. 需求澄清：消除歧义点并固化结论。
2. 产出 `spec.md`（标准 PRD）：
3. 为每条 FR/NFR 分配 ID。
4. 初始化 `traceability-matrix.md` 或 `traceability-matrix.yaml`。

Gate 自检：

1. 无 `[NEEDS CLARIFICATION]`。
2. FR/NFR 全部有 ID。
3. DoR Sign-off 已补齐。

1. 本步骤核心是“把产品需求转成可追踪的标准 PRD（spec.md）”。
2. IDs 要与矩阵初始化同步，不要先写内容后补 ID。
3. Gate 失败时按 `--fix-hints` 修复再重试。

## Step 3：02 Design（技术方案设计）

命令：

```bash
# 设计产出完成后，先看当前 Gate 条件
spec-gate conditions FSREQ-123456-user-auth

# 再执行阶段校验
spec-gate check FSREQ-123456-user-auth --stage 02_design --fix-hints
```

说明：

1. 产出 `research.md`、`design.md`。
2. 产出 API 契约 `contracts/*.yaml` 与 `data-model.md`。
3. 完成 Design Review（Tech Lead / Architect）。

重点约束：

1. API 覆盖率必须满足阶段阈值。
2. SCA#2（spec↔design）通过。

1. Design 阶段重点是 spec 与 design 的一致性，不只是写设计文档。
2. 若存在 API 变更，确保 contracts 与 data-model 同步更新。

## Step 4：03 Plan（任务拆解）

命令：

```bash
# 任务拆解后先做矩阵完整性检查
spec-matrix check FSREQ-123456-user-auth

# 再做 Plan 内联校验（合并到 Gate 2）
spec-gate check FSREQ-123456-user-auth --stage 03_plan --fix-hints
```

说明：

1. 产出 `tasks.md`，每个 TASK 绑定 `traces`。
2. 产出 `checklist.md`。
3. 标注可并行任务（若有）。

1. TASK 必须显式带 `traces`，否则后续覆盖率会直接失败。
2. 并行任务建议在 tasks.md 内显式标注依赖关系。

## Step 5：04 Implement（开发实现）

命令：

```bash
# 日常开发提交示例
git add .
git commit -m "[TASK-AUTH-001] implement user registration"
git push

# 阶段 Gate 校验
spec-gate check FSREQ-123456-user-auth --stage 04_implement --fix-hints
```

说明：

1. 按 TASK 开发与提交。
2. Commit Message 使用阶段允许的标签格式。
3. PR 里标注 Implements/Traces 关系。

过程校验：

1. 本地 Hook：commit-msg / pre-push。
2. CI：全量 SCA + 覆盖率 + Gate 条件。

1. 本地 Hook 负责快速反馈，CI 负责全量兜底。
2. PR 描述要包含 TASK 关联，避免 PR 合规率丢分。

## Step 6：05 Verify（测试验证）

命令：

```bash
# 先看未覆盖项，再补 TC
spec-metrics coverage FSREQ-123456-user-auth --uncovered

# 验证阶段 Gate
spec-gate check FSREQ-123456-user-auth --stage 05_verify --fix-hints
```

说明：

1. 设计并执行 TC，产出 `tests/*.test.md`。
2. 产出测试/安全/UAT 报告：`reports/`。
3. 回填矩阵 Test Case Ref 与状态。

1. 先查缺口再补测试，比盲目补测更高效。
2. UAT/Security 报告建议在 reports/ 中结构化保存。

## Step 7：06 Wrap-up（收尾归档）

命令：

```bash
# 收尾前做矩阵严格检查
spec-matrix check FSREQ-123456-user-auth --strict

# Wrap-up 内联校验（合并到 Gate 3）
spec-gate check FSREQ-123456-user-auth --stage 06_wrap_up --fix-hints
```

说明：

1. 归档阶段产物并校验完整性。
2. 更新 `retro.md`。
3. 矩阵状态收敛到可验收状态（Accepted/Cancelled 等）。

1. 收尾不是“结束开发”，而是“完成证据闭环”。
2. `retro.md` 必须包含可执行改进项。

## Step 8：07 Release（发布）

命令：

1. 生成 `release-note.md`。
2. 执行部署、Smoke Test、观察窗口。
3. 完成发布后验证与关单。

推进：

```bash
spec-gate check FSREQ-123456-user-auth --stage 07_release --fix-hints
spec-metrics report FSREQ-123456-user-auth --format markdown --output specs/FSREQ-123456-user-auth/reports/metrics-report.md
```

说明：

1. 先通过 ★ Gate 4: Go Live，再生成最终度量报告归档。
2. 发布窗口内异常要回写到 `findings.md` 并触发后续缺陷流程。

## 4. 场景验收标准

1. 00-07 全阶段有连续记录（`progress.md` 可追溯）。
2. Gate 历史可追溯（含失败与重试记录）。
3. 追踪矩阵链路完整（需求->设计->任务->代码->测试）。
4. 发布后无阻断级异常，具备回滚证据。

## 5. 常见失败与修复建议

1. `spec.md` 歧义未清零：先补澄清结论再推进 Gate。
2. Task/TC 未关联需求：先修正 `traces/verifies` 再补提交流水。
3. CI 全量 SCA 失败：优先修复断裂 ID 引用链，再重跑 Gate。

## 6. 当前实现状态说明

当前仓库以规范与设计文档为主；CLI 在文档中已定义，但是否在团队环境中“可执行”取决于是否已发布并安装对应工具版本。落地时建议先跑一轮 `doctor` + 小 Feature 试点。
