# 场景验证 03（Agent-C）

> 负责人：Agent-C（全新项目全新工程）  
> 场景类型：0 到 1 新建工程 + 首个需求交付  
> 目标：完成首次初始化、首个 Feature 从需求到发布的端到端闭环

## 0. 整体流程总览

| 步骤 | 执行命令（示例） | 说明 |
|---|---|---|
| Step 0 项目初始化 | `spec-first init`<br>`spec-first doctor` | 新工程首次引入，先准备工具链与环境 |
| Step 1 建立项目规则 | `spec-first doctor` | 完成 constitution/config 后复检环境与配置 |
| Step 2 启动首个需求 | `spec-first init feature FSREQ-334455-account-onboarding --mode N --platforms Backend,H5` | 创建首个 Feature 工作目录 |
| Step 3 Specify | `spec-id next FR ACCT`<br>`spec-gate check FSREQ-334455-account-onboarding --stage 01_specify --fix-hints` | 从产品需求生成标准 PRD 与 ID 体系 |
| Step 4 Design | `spec-gate conditions FSREQ-334455-account-onboarding`<br>`spec-gate check FSREQ-334455-account-onboarding --stage 02_design --fix-hints` | 输出首版设计、契约、数据模型并过 Gate |
| Step 5 Plan + Implement | `spec-gate check FSREQ-334455-account-onboarding --stage 03_plan --fix-hints`<br>`spec-gate check FSREQ-334455-account-onboarding --stage 04_implement --fix-hints` | 完成任务拆解、开发实现、质量门禁 |
| Step 6 Verify | `spec-gate check FSREQ-334455-account-onboarding --stage 05_verify --fix-hints`<br>`spec-metrics coverage FSREQ-334455-account-onboarding --uncovered` | 建立首个项目质量基线（测试/安全/UAT） |
| Step 7 Wrap-up + Release | `spec-gate check FSREQ-334455-account-onboarding --stage 06_wrap_up --fix-hints`<br>`spec-gate check FSREQ-334455-account-onboarding --stage 07_release --fix-hints`<br>`spec-metrics report FSREQ-334455-account-onboarding --output specs/FSREQ-334455-account-onboarding/reports/metrics-report.md` | 归档复盘、发布放行、产出度量报告 |

## 1. 场景说明

该场景没有历史负担，但风险在于：

1. 团队尚未形成统一规范。
2. 工具链与目录结构第一次搭建，容易漏项。
3. 第一条需求是后续协作范式的模板，必须一次性做正确。

## 2. 前置条件

1. 新仓库已创建并 `git init`。
2. 团队确认采用 Spec-First 流程。
3. 产品已输出首个需求文档。

## 3. Step-by-step 执行流程

## Step 0：项目初始化（第一次加载）

命令：

```bash
spec-first init
spec-first doctor
```

说明：

1. `.spec-first/` 目录（hooks/scripts/templates/ci/runtime）。
2. `specs/.feat-registry.md`。
3. `constitution.md` 骨架。
4. Git Hook 安装完成。
5. `doctor` 通过后再进入需求执行，避免中途环境问题反复打断。

## Step 1：建立项目级规则（Constitution）

命令：

```bash
# 规则更新后建议做一次健康检查
spec-first doctor
```

说明：

1. 明确技术栈、质量底线、流程约束、协作规则。
2. 填写角色映射与 RACI。
3. 固化默认模式、默认平台、门禁策略。

输出：

1. `.spec-first/constitution.md`
2. `.spec-first/config.yaml`

## Step 2：启动首个 Feature

命令：

```bash
spec-first init feature FSREQ-334455-account-onboarding --mode N --platforms Backend,H5
spec-gate status FSREQ-334455-account-onboarding
```

说明：

1. `specs/FSREQ-334455-account-onboarding/` 全套目录。
2. 运行态三文件和阶段状态初始化完成。

## Step 3：01 Specify（产品需求 -> 标准 PRD）

命令：

```bash
# 生成首批 ID（示例）
spec-id next FR ACCT
spec-id next NFR ACCT --dim SEC

# Specify 内联校验
spec-gate check FSREQ-334455-account-onboarding --stage 01_specify --fix-hints
```

说明：

1. 把产品需求转成 `spec.md`（标准结构化 PRD）。
2. 分配 FR/NFR ID，并初始化追踪矩阵。
3. 清理歧义并完成 DoR 签核。

1. 把产品文档转换成标准 PRD 是后续所有步骤的输入基础。
2. 首个项目建议在此阶段就固化文档模板风格。

## Step 4：02 Design（首版技术方案）

命令：

```bash
spec-gate conditions FSREQ-334455-account-onboarding
spec-gate check FSREQ-334455-account-onboarding --stage 02_design --fix-hints
```

说明：

1. 输出 `research.md`、`design.md`。
2. 输出首版 API 契约与数据模型。
3. 完成设计评审并锁定基线。

1. 首版设计要重点保证“需求-设计-契约”三者一致。
2. 新项目建议在此阶段完成第一版工程约束（命名、目录、接口规范）。

## Step 5：03 Plan 与 04 Implement

命令：

```bash
spec-gate check FSREQ-334455-account-onboarding --stage 03_plan --fix-hints
spec-gate check FSREQ-334455-account-onboarding --stage 04_implement --fix-hints
```

说明：

1. 任务拆解、依赖标注、并行策略确定。
2. 按 TASK 开发，持续通过本地 Hook 和 CI 校验。
3. 规范提交信息与 PR 关联信息。

## Step 6：05 Verify（首个质量基线）

命令：

```bash
spec-gate check FSREQ-334455-account-onboarding --stage 05_verify --fix-hints
spec-metrics coverage FSREQ-334455-account-onboarding --uncovered
```

说明：

1. 输出测试用例与执行报告。
2. 执行安全扫描与 UAT 签核。
3. 回填矩阵验证列并确认覆盖率。

## Step 7：06 Wrap-up 与 07 Release

命令：

```bash
spec-gate check FSREQ-334455-account-onboarding --stage 06_wrap_up --fix-hints
spec-gate check FSREQ-334455-account-onboarding --stage 07_release --fix-hints
spec-metrics report FSREQ-334455-account-onboarding --output specs/FSREQ-334455-account-onboarding/reports/metrics-report.md
```

说明：

1. 做首个 Feature 复盘，沉淀团队模板。
2. 生成发布说明并执行部署与观察窗口。
3. 完成首个闭环后把模板固化到 `.spec-first/templates/`。

## 4. 首次落地推荐节奏

1. 第 1 周：只跑通 00-03（先把需求-方案-计划稳定住）。
2. 第 2 周：跑通 04-05（把质量门禁和追踪链打通）。
3. 第 3 周：跑通 06-07（完成发布闭环和团队复盘模板）。

## 5. 场景验收标准

1. 首个 Feature 从 `00_init` 到 `07_release` 全部有证据链。
2. 团队能复用同一套模板启动第二个 Feature。
3. `doctor` 检查、Gate 历史、度量报告三类输出齐全。

## 6. 常见失败与修复建议

1. 初始化后不维护 constitution：后续规则漂移，必须在首周定版。
2. 首个 Feature 文档深度不足：至少保证矩阵与 Gate 证据完整。
3. 只做流程不做复盘：06 阶段要产出可复用模板与行动项。

## 7. 当前实现状态说明

新项目场景最依赖 `spec-first init` 与 `doctor`。在正式推广前，建议先用一个 S/M 规模需求做试点，验证本地 Hook、CI 与文档模板是否一致，再扩大到全团队。
