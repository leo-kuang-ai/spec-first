---
title: 为 GET /entries 增加按月筛选 - Plan
type: feat
date: 2026-11-07
status: active
artifact_contract: spec-unified-plan/v1
artifact_readiness: implementation-ready
product_contract_source: spec-plan-bootstrap
execution: code
---

# 为 GET /entries 增加按月筛选 - Plan

## Goal Capsule

- **目标：** 使用者可以按月查看 MiniLedger 支出条目——`GET /entries?month=YYYY-MM` 只返回该月的条目，不带参数时响应与现状完全一致。
- **推荐路径：** 扩展现有 GET handler（KTD3）：用 Node 内建 URL 解析查询串，在内存数组上按 UTC 日历月过滤；附最小可测性导出（KTD4）。
- **决策焦点：** month 参数语法与非法值处理（KTD1，依据 A1）；月归属的时区基准（KTD2，依据 A2）。
- **验证焦点：** 带参、无参、非法参、跨月边界、404 回归共七类场景（U1 测试场景 1–7）。
- **最大风险与边界：** 现路由用整串全等匹配（src/server.js:16），带查询串的请求会落入 404 分支；时区语义（A2）未经 caller 确认。
- **停止条件：** caller 推翻 A1 或 A2 的默认；实施期发现未知消费者依赖被破坏的行为。
- **执行画像：** 执行 owner 为 caller 侧（spec-work caller / caller 指定的执行流程）；本计划产出者不实施。
- **尾部职责：** 实施与验证、提交、landing 均归 caller（本轮任务 commit、push、PR 未授权）。

---

## Product Contract

### Summary

为 `GET /entries` 增加可选 `month` 查询参数（`YYYY-MM`），按条目时间戳的 UTC 日历月筛选返回子集；不带参数时行为不变。

### Problem Frame

MiniLedger 是一个内存记账 demo（README.md）：条目只增不改，`GET /entries` 全量返回。条目跨月积累后，查看单月收支只能手工筛选；README 已把"无汇总视图"列为已知粗糙边。本计划补上其中最小的一块：按月过滤列表。

### Requirements

- R1. `GET /entries` 支持可选 `month` 查询参数，仅返回条目 `ts` 所在日历月匹配该参数的条目（参数语法见 KTD1，时区基准见 KTD2）。
- R2. 未携带 `month` 时，`GET /entries` 的响应与现状一致：返回全部条目的 JSON 数组。
- R3. `month` 值非法时以 400 拒绝该请求，并在响应中说明期望格式（依据 A1，非 caller 已确认）。

### Scope Boundaries

#### Deferred to Follow-Up Work

- 分页与排序（`GET /entries` 目前无分页语义）。
- 按 `note` / `amount` 筛选；月度汇总统计视图（README "summary view" 粗糙边的更大目标）。
- 可配置时区（当前按 UTC 固定，见 KTD2）。
- 持久化存储（数据当前在内存，重启即空，维持现状）。
- `POST /entries` 的 JSON 解析容错（既有粗糙点，与本变更无关，considered and not built）。

---

## Planning Contract

### Key Technical Decisions

- KTD1. **参数语法与校验：** `month` 采用 `YYYY-MM`（ISO 8601 月粒度），年 4 位、月 01–12；非法值整请求拒绝为 400 并说明期望格式。依据 A1。备选"忽略非法值返回全量"被否：静默容错会掩盖调用方的拼写错误。（Governs R1、R3）
- KTD2. **时区基准：** 月归属按 UTC 计算——条目 `ts` 为毫秒时间戳，取其 UTC 年月与参数比对。依据 A2。服务器本地时区未配置且不可知，UTC 使行为跨环境确定、可测。（Governs R1）
- KTD3. **解析与过滤位置（架构姿态：extend）：** 全部改动收在现有 GET handler 分支内——用 Node 内建 URL 能力解析 `req.url` 的 pathname 与查询串（不手工 split），过滤在内存数组上进行；路由匹配从"整串全等"改为"pathname 比对"，否则 `?month=...` 请求落入现有 404 分支（src/server.js:16）。已检视既有能力：仓库无任何可复用的查询/筛选模块（src/server.js 为唯一源文件），故直接扩展现有 owner，不新建中间件或抽象层。（Governs R1、R2）
- KTD4. **可测性接缝：** 跨月边界场景需要可控 `ts`，而现有 POST 接口把 `ts` 固定为服务端时间。为测试构造数据，最小化导出内部 `entries` 数组（或等价接缝），不改变运行行为。若 caller 禁止该接缝，跨月边界场景保留为验证缺口（见 Verification Contract）。（Governs R1）

### Assumptions

本轮为 pipeline 无交互运行，以下推断均未经 caller 确认，caller 可在实施前低成本改写：

- A1. `month` 语法为 `YYYY-MM`，非法值返回 400。来源：caller 仅给出"month 筛选"，语法与错误行为未指定。影响：R1、R3、KTD1。失效条件：caller 改定其他语法（如 `YYYYMM`）或要求忽略非法值。
- A2. 月边界按 UTC。来源：时区未指定，服务器时区不可知。影响：R1、KTD2、场景 3。失效条件：caller 要求按服务器本地时区或其他基准。
- A3. 无 `month` 参数时返回全部条目。来源：对既有端点做加法式变更的标准语义。影响：R2。失效条件：caller 对无参行为另有所指。
- A4. 该端点无已知外部消费者（未知不等于不存在）。来源：本轮无枚举/搜索授权，消费者情况未核实。影响：兼容性按 additive 处理（Interface Contracts）。失效条件：实施期发现依赖具体行为的消费者。
- A5. 宿主 Node 版本未知（仅确认 node 可执行）。来源：shell 仅授权基线准备命令，未运行版本查询。影响：`node:test`（需 Node ≥ 18）可用性与验证途径选择。失效条件：实施期确认版本。

### Interface Contracts

| 字段 | 内容 |
| --- | --- |
| Interface / mode | `GET /entries` 查询参数 `month` — evolution |
| Consumers | 未知（A4：无枚举授权，未核实；README 定位为 demo 应用） |
| Canonical artifact | `src/server.js` 的路由实现（代码即契约，仓库无独立 schema 工件）；owner：`src/server.js` |
| Contract summary | `GET /entries?month=YYYY-MM` 返回 `ts` 落在该 UTC 日历月的条目子集（JSON 数组）；无参数时返回全部；非法值 400 |
| Compatibility | additive（新增可选参数，向后兼容；无参行为不变，R2）；不替换、不废弃既有字段 |
| Verification | `parser_unavailable`：仓库无 repo 原生契约 parser/test（package.json 无 scripts、无测试框架）。原因：demo 仓库无测试设施；owner：caller（执行方）；unblock：执行方采用 U2 的 node:test 或 HTTP smoke 契约验证，或后续引入测试框架后由契约测试接管 |

### Evidence & Limitations

- 直接证据：`src/server.js`（全文件读取，26 行；GET 分支在 16–20 行）、`package.json`（无 scripts、无 devDependencies）、`README.md`（端点与数据形状描述）。
- 环境限制：本轮 shell 仅授权 `node prepare-eval.cjs`（已执行一次）；无目录枚举/搜索工具，`docs/plans/`、`docs/brainstorms/`、`docs/solutions/` 与测试文件状态未核实（上游 Product Contract 存在性按"未发现"处理）；git 身份与脏状态未核对；宿主无真实 Plan Mode 写入保证。
- 影响：Verification Contract 的命令为建议性，由 caller 执行时确认；消费者兼容面按 A4 处理。
- 本轮无 provider 图谱、外部调研或历史 learnings 参与，无需再落地的 advisory 证据。

---

## Risks & Dependencies

- 时区语义与使用者预期不符（跨月边界条目归月争议）：缓解为 README 明示 UTC；可配置时区已列 Deferred。
- 无既有测试设施（package.json 无 scripts），验证途径分叉（A5）：U2 提供 node:test 与 HTTP smoke 双路径。
- 未知消费者兼容面（A4）：以 additive 变更保持无参行为不变（R2）兜底。
- 无外部依赖、无迁移、无数据变更；实现仅依赖 Node 内建能力。

---

## Implementation Units

### U1. GET /entries 增加 month 筛选

- **Goal：** 实现 R1、R2、R3——带 `month` 参数的按月过滤、无参行为不变、非法值 400。
- **Requirements：** R1、R2、R3
- **Dependencies：** 无
- **Files：** `src/server.js`（修改）；`README.md`（修改，端点说明补 `month` 参数一句）；`test/entries-month-filter.test.js`（新建，首选 `node:test`，可用性受 A5 约束）
- **Approach：**
  1. 路由匹配改为解析 pathname（KTD3），使带查询串的请求不再落入 404 分支。
  2. 解析查询串提取 `month`，按 KTD1 校验；非法值返回 400 与格式说明。
  3. 按 KTD2 对内存 `entries` 做 UTC 月过滤后序列化返回；无参数走现状路径。
  4. 按 KTD4 增加最小可测性导出（不改变运行行为）。
- **Execution note：** 若采用 node:test，先为场景 1、3、4 写失败契约测试再实现；若 Node < 18，退化为 U2 的 HTTP smoke 路径，先确认场景 6 的 404 回归再验证筛选。
- **Patterns to follow：** 沿用现有 handler 的分支结构与 `res.end` 直写风格；不模仿 POST 分支无容错的 `JSON.parse` 用法（该粗糙点已列 Deferred）。
- **Test scenarios：**
  1. 无 `month`：GET /entries 返回全部条目，形状与顺序不变（R2 回归）。
  2. 合法 `month`：仅返回 `ts` 落在该 UTC 月的条目（R1）。
  3. 跨月边界：两条 `ts` 分别为某月最后一日 23:59:59.999Z 与次日 00:00:00.000Z 的条目分别归属前后两月（KTD2；需 KTD4 接缝构造数据）。
  4. 非法值（月 13、单位月、非数字）：返回 400，不返回条目数组（R3）。
  5. 合法 `month` 但无匹配条目：返回 200 与空数组（R1 边界）。
  6. `GET /entries?month=...` 不落入 404 分支（src/server.js:16 路由修复的回归确认）。
  7. `POST /entries` 行为不受影响（回归）。
- **Verification：** 场景 1–7 全部通过；不带参数的响应与改动前逐项一致。

### U2. 运行验证与文档确认

- **Goal：** 以真实运行确认 R1–R3 与向后兼容，并完成 README 更新。
- **Requirements：** R1、R2、R3
- **Dependencies：** U1
- **Files：** `test/entries-month-filter.test.js`（若采用 node:test）；`README.md`
- **Approach：** 启动服务（`node src/server.js`，端口 3000）后按 U1 场景 1–7 逐一发 HTTP 请求核对响应；或运行 node:test（视 A5）。README 端点描述补 `month` 参数与 UTC 语义一句。验证结束停掉服务进程，不留后台进程。
- **Execution note：** smoke-first：先验证场景 1（无参回归）再验证其余场景，保证兼容性先行。
- **Test scenarios：** U1 场景 1–7 的 HTTP 层运行版本（同表）。
- **Verification：** 每个场景的请求/响应证据留档；无残留进程。

---

## Verification Contract

仓库无既有测试命令（package.json 无 scripts）。以下为 caller 实施阶段执行的验证途径（建议性，受 A5 约束）：

- `node --test`（含 `test/entries-month-filter.test.js`）——适用 U1、U2；期望场景 1–7 全部通过；前置：Node ≥ 18（A5 未核实）。
- `node src/server.js` + HTTP 请求集（curl 或 node 脚本）——适用 U1、U2；期望场景 1–7 的响应符合 R1–R3。

- Product Contract confirmation：R1–R3 的确认途径即上表场景；本计划本身未运行任何实现验证（planning-only）。
- largest unproven risk：跨月边界的 UTC 归月语义未经运行验证；且若 KTD4 接缝被 caller 否决，场景 3 保留为验证缺口。
- 盲区（per 途径）：HTTP 场景无法确认重启后数据保留（内存存储，预期即失）；无法覆盖未知消费者的兼容性（A4）。
- 既有契约测试核对：未发现断言 `src/server.js` / `README.md` 的测试（未枚举，无法确认不存在）；caller 实施时若发现，须并入上表。

---

## Open Questions

均为 deferred（非阻塞，不持有 readiness）：

- Q1. caller 确认或改写 A1（`YYYY-MM` 语法与 400 行为）。owner：caller。
- Q2. caller 确认或改写 A2（UTC 月基准）。owner：caller。
- Q3. 验证途径取舍（node:test vs HTTP smoke）与 KTD4 接缝是否采用。owner：caller / 执行方，实施期决定。

---

## Definition of Done

- 全局：R1–R3 全部有运行证据；无参 `GET /entries` 响应与改动前一致；README 已更新；无实验/死代码残留（清理标准）；验证所用服务进程已停止。
- U1：场景 1–7 通过；路由修复确认（场景 6）。
- U2：运行证据留档完成；README 的 `month` 说明与实际行为一致。
