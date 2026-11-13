---
title: Entries Month Filter - Plan
type: feat
date: 2026-11-05
status: active
artifact_contract: spec-unified-plan/v1
artifact_readiness: implementation-ready
product_contract_source: spec-plan-bootstrap
execution: code
---

# Entries Month Filter - Plan

## Goal Capsule

- **目标：** GET /entries 支持 `month` 查询参数后，调用方可获取指定日历月的记账条目；不带参数时行为与现状完全一致。
- **推荐方案：** 扩展现有单文件服务器（extend 既有路由模式）：路由匹配从 `req.url` 全串相等改为解析 pathname，GET 分支增加 `month` 校验与按 `ts` 的月份过滤。
- **权威层级：** 本 Product Contract（bootstrap 产生）> `src/server.js` 当前源码事实 > 本计划其余章节。
- **决策焦点：** `month` 参数格式与非法输入的拒绝方式（KTD2）、月份判定的时区基准（KTD3）。
- **验证焦点：** 无测试框架仓库中的运行时 smoke 场景矩阵（见 Verification Contract）。
- **最大风险/边界：** 路由匹配方式变更影响所有带查询串的请求（现状一律 404，见 KTD1 兼容性说明）；范围仅限 GET /entries，不含 POST、持久化与其他筛选维度。
- **停止条件：** caller 否决 Assumptions 中任一假设（格式、时区、错误形态）时，先修订本计划再实施。
- **执行画像：** 单实现单元、单文件改动。**tail 归属：** 实施与验证归 caller（执行 owner）所有。

---

## Product Contract

### Summary

为 MiniLedger 的 GET /entries 增加 month 筛选：带 `month=YYYY-MM` 时只返回该日历月的条目；不带参数时保持现有全量返回。POST /entries 与条目数据结构不变。

### Problem Frame

GET /entries 目前只能全量返回内存中的所有条目（src/server.js:16-19）。条目累积后，调用方无法按月查看支出，只能在客户端自行过滤。README 将"无汇总视图"列为已知粗糙点，按月筛选是其最小可行切片。另需注意：当前路由以 `req.url` 全串相等匹配，任何查询串都会落入 404 分支，因此本能力必然伴随路由解析方式的变化。

### Requirements

- R1. GET /entries 支持 `month` 查询参数，格式为四位年份-两位月份，仅返回该日历月内产生的条目（按条目写入时的 `ts` 判定）。
- R2. 不带 `month` 参数的 GET /entries 行为保持现状：返回全部条目，响应形态不变。
- R3. `month` 值非法（格式不符或月份越界）时请求被拒绝并返回客户端错误与可读原因，不得静默回退为全量返回。

### Acceptance Examples

- AE1. **Covers R1.** Given 已写入 2026-10 与 2026-11 两个月的条目，When `GET /entries?month=2026-11`，Then 仅返回 `ts` 落在 2026-11（UTC）的条目，JSON 数组形态与现状一致。
- AE2. **Covers R2.** Given 已写入任意条目，When `GET /entries`（无查询串），Then 返回全部条目，与变更前响应一致。
- AE3. **Covers R3.** When `GET /entries?month=2026-13`，Then 返回客户端错误与可读原因，而非全量数组。
- AE4. **Covers R3.** When `GET /entries?month=2026-1`（月份未零填充），Then 返回客户端错误。
- AE5. **Covers R1.** When `GET /entries?month=` 某无条目的月份，Then 返回 200 与空数组 `[]`。

### Scope Boundaries

- 不做：POST /entries 的任何筛选或行为变更。
- 不做：分页、排序、按类目/金额等其他筛选维度、汇总统计。
- 不做：持久化存储、测试框架引入、端口配置化（仍为 3000）。
- 不做：README.md 的端点文档同步。

#### Deferred to Follow-Up Work

- README.md 端点说明补充 `month` 参数文档（一行改动；本轮 caller 范围限定 `src/server.js`）。Owner：caller。
- 引入测试框架并为路由/筛选建立自动化测试（当前仓库无任何测试设施）。Owner：caller。

---

## Planning Contract

### Key Technical Decisions

- KTD1. **路由匹配改为 URL pathname 相等（一次解析，GET/POST 两分支共用）。** 现状 `req.url === '/entries'` 使任何查询串请求直接 404，`month` 参数无法进入路由。改为以 `new URL(req.url, <base>)` 解析后按 `pathname` 匹配；解析异常按客户端错误处理。兼容性影响：带查询串的 /entries 请求从 404 变为正常处理或参数错误；POST /entries 带查询串从 404 变为按原逻辑受理——单文件 demo 无已知消费者依赖该 404 行为，属可接受放宽（见 A4）。Governs R1, R2。
- KTD2. **`month` 校验：严格 `YYYY-MM`（月份 01–12 零填充）；非法值返回 400 与纯文本错误。** 沿用现有 404 `'not found'` 的纯文本错误风格，不引入 JSON 错误体新约定。重复参数取第一个（首值语义）；`?month=`（空串）按非法处理。Governs R1, R3。
- KTD3. **月份语义按 UTC 日历月，以 `ts` 判定。** 以 `new Date(ts).toISOString()` 的 `YYYY-MM` 前缀与参数比较，与 KTD2 格式天然对齐。选 UTC 而非服务器本地时区：服务器时区不可控，UTC 行为确定；demo 场景可接受（见 A2）。Governs R1。
- KTD4. **未知查询参数一律忽略，仅 `month` 有语义。** 保持宽松兼容，不为 demo 引入严格参数白名单。Governs R2。

### Assumptions

以下为 headless 规划期的推断，未经产品 owner 确认；引用它们的 KTD 不因此视为已确认决策。

- A1. `month` 参数格式为 `YYYY-MM`（caller 未指定格式）。影响 KTD2、KTD3。失效条件：caller 指定其他格式（如 `YYYYMM`）。
- A2. UTC 月份语义可接受。影响 KTD3。失效条件：要求按用户本地时区判定月份。
- A3. 纯文本错误体可接受（无 JSON error envelope 需求）。影响 KTD2。失效条件：API 需要 JSON 错误结构。
- A4. 带查询串的 POST 请求从 404 放宽为受理，无外部消费者受影响。影响 KTD1。失效条件：发现依赖该 404 行为的调用方。

### Implementation Scope Boundaries

- POST body 非法 JSON 会使现有 handler 抛异常（src/server.js:10 无容错）：considered and not built——不在请求范围内且无已证明损害路径；若 caller 将范围扩展至输入加固，另行立项。
- 不引入路由/校验第三方库（package.json 无 dependencies，保持零依赖）。

### Interface Contracts

| 字段 | 内容 |
| --- | --- |
| Interface / mode | `GET /entries` 查询契约 — evolution（既有接口新增可选参数） |
| Consumers | demo 使用者与 README 读者；无已知独立机器消费者（未发现，标记 unknown） |
| Canonical artifact | `src/server.js`（实现即契约；仓库无机器可读契约文件，README.md 为人读文档） |
| Contract summary | 输入：可选 `month=YYYY-MM`；输出：无参数时与现状一致的 JSON 数组，带参数时为过滤子集（可为空数组）；错误：非法 `month` 返回 400 纯文本（KTD2） |
| Compatibility | additive：无参数路径行为不变；新增 400 路径仅影响原先即 404 的 URL（KTD1）；回滚 = 还原单文件改动 |
| Verification | `parser_unavailable` — 仓库无契约测试/parser；原因：无测试设施；owner：执行 caller；unblock：引入测试框架后以路由级测试替代 curl smoke |

### Evidence & Limitations

- 直接源证据：`src/server.js`（25 行全读）、`README.md`、`package.json`、`prepare-eval.cjs`。基线提交仅含上述文件；仓库无 `docs/plans/`、`docs/solutions/`、`STRATEGY.md`、`CONCEPTS.md` 与任何测试文件。
- 工具限制：本轮可用命令仅限基线准备（`node prepare-eval.cjs`，已单次执行）；git 状态、Node 版本与目录枚举未直接核实。`URL`/`URLSearchParams` 为 Node 稳定全局 API，demo 语境下版本风险可忽略；执行阶段以 `node --check` 兜底语法门。
- 调研方式：worker 派发未获授权（`dispatch_authorization_missing`），全部结论来自 inline 直接读源；外部研究未运行（本地证据充分且外部访问未授权）。

---

## Implementation Units

### U1. Month filter on GET /entries

- **Goal:** GET /entries 带合法 `month` 参数时返回该 UTC 日历月的条目；无参数时行为不变；非法参数被拒绝。
- **Requirements:** R1, R2, R3（验收对应 AE1–AE5）
- **Dependencies:** 无
- **Files:** `src/server.js`（唯一改动文件；仓库无测试框架，不新建测试文件，见 Deferred to Follow-Up Work）
- **Approach:**
  1. 请求处理器入口以 `new URL(req.url, 'http://localhost')` 解析出 `pathname` 与 `searchParams`；两个方法分支改按 `pathname === '/entries'` 判定（KTD1）。
  2. GET 分支读取 `searchParams.get('month')`；值为 null 时走现状全量返回（R2，KTD4）。
  3. 值非空时按 KTD2 校验格式与月份范围，非法则设 400 并返回纯文本错误。
  4. 合法时按 KTD3 以条目 `ts` 的 UTC `YYYY-MM` 前缀过滤数组后返回，保持 `content-type: application/json`（R1）。
- **Execution note:** 仓库无测试设施且改动为运行时行为——先过 `node --check` 语法门，再以下述 smoke 场景验证，不引入测试框架。
- **Patterns to follow:** 现有分支式路由与响应风格（src/server.js:5-23 的 if/return 结构、纯文本错误、`res.end(JSON.stringify(...))`）。
- **Test scenarios:**
  - Happy：预写两个月条目后 `GET /entries?month=2026-11` 仅返回当月条目，JSON 形态不变（Covers AE1.）
  - Happy：目标月无条目时返回 200 与 `[]`（Covers AE5.）
  - 兼容：`GET /entries` 与 `GET /entries?foo=1` 均返回全量（Covers AE2.；KTD4）
  - 错误：`month=2026-13`、`month=2026-1`、`month=abc`、`month=`（空）各返回 400 与可读原因（Covers AE3, AE4.）
  - 边界：重复参数 `?month=2026-11&month=2026-12` 取第一个值；月末 23:59 UTC 与次月 00:00 UTC 的边界条目分别落入各自月份（KTD3）
  - 集成：POST /entries 写入后立即带当月 `month` 查询能取回该条目（写入-查询闭环）
- **Verification:** 上述场景全部按预期返回；无参数路径响应与变更前基线一致（可在改动前先采样保存对照）；无残留调试代码。

---

## Verification Contract

| 门 | 命令/动作 | 适用 | 期望证据 |
| --- | --- | --- | --- |
| 语法 | `node --check src/server.js` | U1 | 退出码 0 |
| Smoke | 启动 `node src/server.js`（端口 3000）后按 U1 test scenarios 发起 curl 请求 | U1 | 每场景状态码与响应体符合预期 |

- Product Contract confirmation：AE1–AE5 由 U1 smoke 场景覆盖；实施后由 caller 确认 Assumptions A1–A4，或回写修订本计划。
- 最大未证风险：KTD1 路由放宽的兼容性（无消费者清单可查证，A4 为假设）。
- 盲区（按命令类）：curl smoke 不能证明并发与长时运行行为，不覆盖 POST 非法 JSON 等超范围既有路径，且无 CI 回归网。
- 仓库契约测试搜索：基线仅 4 个文件、无测试套件，未发现对触碰路径断言的契约测试，故无既有测试可并入本命令集。
- 操作注意：`prepare-eval.cjs` 以基线 sha256 固定 `src/server.js` 内容；基线已单次捕获，实施阶段不得重跑该脚本。

---

## Definition of Done

- 全局：U1 完成；Verification Contract 两门通过；Assumptions A1–A4 经 caller 确认或已回写修订；计划生命周期状态由执行 owner 按 closeout 流程处理。
- U1：全部 test scenarios 通过；无参数路径行为不变已显式对照验证；清理实验与死代码后，diff 仅含目的性改动。
