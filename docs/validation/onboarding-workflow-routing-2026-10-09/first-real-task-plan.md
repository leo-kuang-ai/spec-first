---
title: CLI 首次运行排错最小回归验证方案
type: test
date: 2026-10-09
status: active
artifact_contract: spec-unified-plan/v1
artifact_readiness: implementation-ready
product_contract_source: spec-plan-bootstrap
execution: code
---

# CLI 首次运行排错最小回归验证方案

## Goal Capsule

为 CLI 维护者补齐首次运行中容易误判的退出、宿主选择和只读恢复边界。建议只扩展两个现有单元测试文件，复用现有初始化输出测试；不新增命令、参数、文案、JSON 字段或测试框架。

本轮交付仅为方案，未实施或运行测试。`implementation-ready` 表示设计与验收已明确，不代表当前环境可以执行、测试通过或真实宿主可用。事实以本快照的 README、源码和测试为准；历史记忆仅提供导航线索。

最大限制：当前快照没有 `package.json`、锁文件、测试配置和完整依赖源码，Git 也没有已有提交。实施前需回到包含这些资产的完整仓库，并复核下列代码分支。不得通过临时伪造包配置让快照“通过”。若新测试揭示业务缺陷，保留失败证据，停止依赖步骤，另行进入 `spec-debug`，不在本方案范围内修正契约。

## Product Contract

### Requirements

| ID | 维护者需要的结果 | 验收边界 |
|---|---|---|
| R1 | 前置失败和选择歧义不能启动初始化 | Git ERROR 返回 3；多宿主加 `--yes` 返回 2；均不调用 init |
| R2 | 初始化失败不能被 quickstart 包装成成功 | init 返回的非零数值原样转发，参数与调用次数不变 |
| R3 | 恢复诊断保持只读且机器输出可解析 | doctor 各输出模式前后项目目录不变；JSON 全部 stdout 是单一 JSON 文档 |
| R4 | 保持现有用户旅程和证据上限 | 保留原目录恢复指引、默认简洁/verbose 明细和当前退出语义；projection 不等于宿主加载或首次任务成功 |

典型流程：维护者在原目标目录运行 quickstart；前置失败时先修环境，选择有歧义时显式选择宿主；已有初始化结果时使用 doctor 排错。README:49-90 明确了这些入口及“欢迎语不算成功”的边界。

不纳入：修改业务源码、重新设计退出码、init 回滚扩展、真实宿主自动化、付费模型调用、发布门禁或提交发布。本轮也不修改测试文件；下述单元是后续实施范围。

## Planning Contract

### Source Evidence

| 当前证据 | 已有行为或覆盖 | 本方案处理 |
|---|---|---|
| `src/cli/commands/quickstart.js:61-103`；`tests/unit/quickstart-command.test.js:35-166` | Node ERROR、唯一宿主、`-y` 转发、零/多宿主交互已有测试；Git ERROR、多宿主加 yes、非零返回未覆盖 | U1 补三个场景 |
| `tests/unit/quickstart-language.test.js:71-82` | 零宿主加 yes 已断言返回 2、不调用 init | 复用，不新增重复用例 |
| `src/cli/commands/init.js:226-236` | 应用结果、语言同步或 summary 失败时返回 1 | U1 以数值 1 验证真实返回类型，不造 receipt 对象契约 |
| `src/cli/commands/doctor.js:29-78,1350-1413`；`tests/unit/doctor-runtime-assets.test.js:66-140,142-223` | JSON 优先、ERROR 返回 3、异常 runtime 结构化报告、缺 CLI 分层退出已有测试；部分 JSON 用例仅检查最后一次 log | U2 补强全部 stdout 和目录不变 |
| `tests/unit/doctor-output.test.js:45-72,106-141,249-276` | 原目录恢复、部分失败、简洁与明细、证据维度已有覆盖 | focused 验收复用 |
| `src/cli/commands/init-output.js:896-937`；`tests/unit/init-runtime-readiness-guidance.test.js:17-66` | 初始化后只读恢复、目标含空格、中英文、动态宿主与部分失败指引 | focused 验收复用 |
| `src/cli/index.js:48-53,101-105`；`src/cli/version-reminder.js:656` | 入口先调用版本提醒；提醒缓存有既有写入路径 | 只读验收限定项目，不声称系统零写入 |

### Key Technical Decisions

- KTD1：沿用 Jest、模块隔离、console spy 和临时目录模式。只新增 U1 的三个场景族及 U2 的断言；无需包装器或新测试文件。
- KTD2：校验稳定语义、调用、字段与类型，不引入整页文本快照；不固定宿主总数、版本号、颜色或动态路径。宿主集合来自现有 registry，测试只控制探测结果。
- KTD3：doctor 只读通过项目树清单验证：比较相对路径、文件类型、普通文件字节摘要和链接目标；忽略读取可能改变的 atime。包含 runtime 根、既有 summary 和哨兵文件；空目录也入清单。限定 fixture 内，不扫描真实用户目录。
- KTD4：JSON 捕获按 stdout 顺序拼接所有 console.log 调用并解析，不能只取最后一条。stderr 独立捕获，不合并进 JSON；直接调用 `runDoctor` 的测试不覆盖入口版本提醒。

依赖顺序：先恢复完整仓库并核对测试配置，再独立实施 U1、U2，最后运行一次 focused 套件。不存在待用户决定的产品问题；执行环境缺失是运行前置条件。

### Risks

| 风险 | 控制与失败处理 |
|---|---|
| Mock 探测通过被误报为宿主可用 | 仅报告 CLI 分支回归；宿主 loader、真实模型与首次实质结果均未验证 |
| 将 WARNING/action_required 一律视作失败 | 复用现有退出矩阵：已记录初始化且 runtime pass/warn 可返回 0；未初始化或 runtime error 的明确缺 CLI 场景返回 3 |
| `process.chdir`、模块 mock、process.version 泄漏污染后续测试 | 沿用 try/finally，逐次清空 spy，恢复 cwd、属性描述符及模块 mock，再删除本用例临时目录；使用 runInBand |
| 只比较既有文件漏掉新写入 | 比较完整 fixture 树清单，纳入新增/删除路径和空目录 |
| 测试失败后无依据地改变契约 | 保存失败分支、输出通道和差异；不更新期望以掩盖回归，不修改业务源码 |
| 快照未提供依赖，无法确定 runner 配置 | 不运行、不补造；完整仓库检查本地 Jest 与 README 开发脚本后执行 |

## Implementation Units

### U1. 补齐 quickstart 的三个漏检边界

范围：仅 `tests/unit/quickstart-command.test.js`；对应 R1、R2、KTD1、KTD2。沿用现有 `jest.resetModules` / `jest.doMock` / `jest.dontMock` 和 console 恢复模式。

| 场景 | 安排 | 必须断言 |
|---|---|---|
| Git 前置失败 | Node PASS、Git ERROR；host probe 和 init 为 spy | 返回 3；host probe 与 init 调用均为 0；stdout 含 Git 诊断与当前语言的修复后重试指引 |
| 多宿主加 yes | 至少 Claude、Codex PASS，其余 WARNING；输入 `--yes` | 返回 2；init 调用为 0；stderr 保留 yes 无法选择目标及显式 init 的既有指引；stdout 保留探测/多宿主信息 |
| init 失败转发 | 参数化唯一宿主自动选择、多个宿主普通交互两条 init 分支；init 返回 1 | quickstart 返回 1；init 恰调用一次；自动选择参数为 `['--codex']`，交互为 `[]`；传入的 promptOverrides 对象保持原样 |

不得把已有 stdout 探测文案挪到 stderr。复用语言测试的零宿主加 yes，不重复扩展整个宿主/语言笛卡尔积。U1 完成条件：新场景及原有 quickstart 两个文件均通过，无生产文件变化。

### U2. 补强 doctor 的项目只读与完整 JSON 断言

范围：仅 `tests/unit/doctor-runtime-assets.test.js`；对应 R3、R4、KTD1、KTD3、KTD4。复用其临时目录和外部命令 mock，不执行真实宿主探测。

1. 在既有 JSON 与 JSON+verbose 成功/ERROR 用例中，逐次清空 spy，解析所有 stdout；要求单一 JSON 文档且无额外 human 段落。保持既有返回 0/3、`platforms`、ERROR check 和 reasonCode 断言。
2. 在健康 fixture 和已有“runtime 根为普通文件”的异常 fixture 中加入哨兵，记录基线树；分别运行显式宿主默认、verbose、JSON、JSON+verbose，每次调用后比较同一基线。异常 fixture 每种模式应返回 3，损坏文件仍保持原字节，诊断不得修复或删除它。
3. JSON 校验当前 schema_version 及既有字段集合/主要类型。字段集合回源 `doctor.js:1394-1413`，包括 health、basis、workspace、host_support、checks、projections、warnings；不新增字段，不把内部 `has_error` 纳入公开 JSON。动态路径和值采用结构断言。

U2 完成条件：所有模式项目树相同；JSON 成功与 ERROR 完整可解析；既有 missingCLI 退出矩阵、默认/verbose 及 init 恢复指引用例通过。只读证据限定 `runDoctor` 与 fixture 项目树，不升级为 CLI 全进程、全局配置或真实宿主保证。

## Verification Contract

### 执行前置

实施者在完整仓库先检查 `package.json`、锁文件、Jest 配置、被引用源码与 runtime assets 均存在，并确认 Node >=20、本地依赖已按锁文件恢复。README:255-264 声明 `npm run test:unit` 等脚本，但本快照无法核实其具体 runner 参数。以下命令仅在本地 Jest 与仓库配置匹配后执行；不在此快照安装依赖或运行。

### 最小验收命令

在仓库根目录执行以下一次 focused 回归，覆盖新增场景和已有输出保护：

```sh
./node_modules/.bin/jest --runInBand --runTestsByPath \
  tests/unit/quickstart-command.test.js \
  tests/unit/quickstart-language.test.js \
  tests/unit/doctor-runtime-assets.test.js \
  tests/unit/doctor-output.test.js \
  tests/unit/init-runtime-readiness-guidance.test.js
git diff --check
git diff --name-only
git status --short
```

通过标准：Jest 退出 0、上述用例无失败/新增 skip；diff 检查退出 0；新增实施差异只在两个约定测试文件，方案文件允许保留。已有用户修改单独记录，不能要求清空工作树。测试报告记录命令、退出码、失败名称和差异，不能仅记录测试数量。

不默认执行 build、smoke、integration、release 或真实初始化。只有修改触及共享测试配置、出现模块污染/跨套件问题或仓库 CI 明确要求时，才追加 README 中的 `npm run test:unit`；记录原因，不把测试范围扩张为发布验证。

当前验证状态：仅回源与方案结构/路径检查；测试未运行，CLI 行为待执行验证，真实宿主首次任务未验证。

## Definition of Done

- R1-R4 分别由 U1/U2 新断言及复用套件证明；各 U-ID 完成条件满足。
- 验收报告包含实际命令、退出码和覆盖范围；无新增业务源码、命令、参数、文案或 JSON 契约变更。
- 未提交、推送或发布；测试通过仍只报告单元行为，不声称宿主加载或首次任务成功。
- 当前规划交付完成不等于上述实施完成；环境缺失、独立审查缺失须随方案交付披露。

### 方案检查记录

已基于源码分支、同类测试和请求边界进行一次作者自审；设计依据充分，无需进一步扩大调研。当前宿主无独立 Skill 调用接口，未运行独立文档审查；以下记录是降级作者自审，不代表独立评审通过。

```yaml
review_source: producer-self-review
review_status: degraded
reason_code: spec_doc_review_capability_unavailable
independent_review: not_run
mutation_policy: markdown-write
fixes_applied: 0
known_findings: []
independent_coverage: unknown
reviewer_only_counts: unknown
limitations:
  - 当前快照缺少包配置、依赖源码与测试运行资产，未执行测试。
  - 没有独立审查结果；仅完成作者自审与确定性文档检查。
```
