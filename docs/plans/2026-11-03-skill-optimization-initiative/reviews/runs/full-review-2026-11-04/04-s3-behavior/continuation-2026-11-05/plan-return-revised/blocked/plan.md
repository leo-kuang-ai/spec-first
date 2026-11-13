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

## Goal Capsule

- **Objective:** 使用者可以按月份查看开销条目,而不是只能全量获取 `GET /entries`。
- **Recommended approach:** 扩展 `src/server.js` 现有路由分发:先按 pathname 匹配,再解析可选 `month` 查询参数并按时间戳过滤(架构姿态 `extend`,不新增文件、抽象或依赖)。
- **Authority hierarchy:** Product Contract(WHAT)> 当前源码事实 > 计划内技术判断(KTD/Assumption)。
- **Decision focus:** `month` 参数语义(格式、时区、无效值处理);路由匹配从 `req.url` 全串相等改为 pathname 比较。
- **Verification focus:** 实施阶段以运行时 HTTP 请求验证筛选正确性与向后兼容(本仓库无测试设施)。
- **Largest risk / boundary:** 行为宽容化变更——当前任何带查询串的 `/entries` 请求返回 404,改为 pathname 匹配后变为有效响应。
- **Stop conditions:** 若实施中发现有未知消费方依赖"带查询串必须 404"或要求其他月份格式,停止并返回计划 owner。
- **Execution profile:** 单文件小改动,2 个实施单元。
- **Tail ownership:** `spec-work`(获得执行授权后)。

---

## Product Contract

### Summary

`GET /entries` 接受可选 `month` 查询参数(YYYY-MM),仅返回时间戳落在该月的条目;不带参数时保持现有全量行为。

### Problem Frame

MiniLedger 的条目只能全量获取,开销记录逐月累积后,查看单月开销无法在 API 层完成。README 已把"无 summary 视图"列为已知粗糙点,按月筛选是其中最小、可直接落地的一步。

### Requirements

- R1. `GET /entries?month=YYYY-MM` 仅返回时间戳(`ts`)落在该月的条目。
- R2. 未提供 `month` 时,`GET /entries` 返回全部条目,现有行为不变。
- R3. `month` 格式无效时,`GET /entries` 返回 400,不得静默回退为未筛选结果。
- R4. `/entries` 路由按 pathname 匹配,带查询串的请求不再因查询串本身返回 404。

### Scope Boundaries

#### Deferred to Follow-Up Work

- 分类、汇总视图、分页、持久化(README 列出的其余粗糙点)。
- `POST /entries` 输入校验加固(JSON 解析错误处理、字段校验)。
- 月份时区参数化(当前固定按服务器本地时区)。

---

## Planning Contract

### Key Technical Decisions

- KTD1. `month` 严格匹配 `^\d{4}-(0[1-9]|1[0-2])$`,月边界按服务器本地时区计算(条目 `ts` 为 `Date.now()`,单机个人记账语境,本地月份直觉一致;UTC 为被拒备选,确定性更高但与使用语境不符)。Governs R1。
- KTD2. 无效 `month` 返回 400 而非静默忽略——忽略会把客户端拼写错误伪装成"该月无开销"。Governs R3。
- KTD3. 路由匹配改为解析 `req.url` 取 pathname 后比较,GET 与 POST 一致接受查询串——`month` 是查询参数,全串相等匹配下 `/entries?month=...` 会 404;统一 pathname 是最小一致改动。Governs R4。
- KTD4. 架构姿态 `extend`:扩展 `src/server.js` 内现有分发逻辑,不新增依赖、文件或抽象层。

### Interface Contracts

| Field | Content |
| --- | --- |
| Interface / mode | `GET /entries` 查询契约 — evolution |
| Consumers | demo 使用者与 eval 验证脚本;已知独立消费方:无 |
| Canonical artifact | `src/server.js`(行为即契约);`README.md` 端点概述随行更新 — owner: U1/U2 |
| Contract summary | 可选 `month=YYYY-MM`;缺省=全量 JSON 数组;无效=400;响应结构不变 |
| Compatibility | additive(缺省行为不变);附带宽容化变更:带查询串请求 404→200(KTD3) |
| Verification | `parser_unavailable` — 仓库无测试设施(`package.json` 无 scripts/devDependencies);owner: `spec-work` 实施者;unblock: 引入测试框架(本计划范围外);以运行时 HTTP smoke 替代 |

### Assumptions

- A1. `month` 格式为 `YYYY-MM`(任务描述只说"month 筛选",格式为推断)。失效条件:消费方需要其他格式。
- A2. 月边界按服务器本地时区。失效条件:跨时区部署或消费方要求 UTC。
- A3. 无效 `month` 返回 400 而非忽略。失效条件:消费方期望宽容回退。
- A4. `POST /entries` 同步获得查询串容忍;若存在依赖"POST 带查询串 404"的消费方(未发现),回退为仅放宽 GET 匹配。

### Implementation Scope Boundaries

- 不新增依赖、不引入测试框架、不改 `POST /entries` 语义与条目数据结构。
- `README.md` 中 `GET /entries` 的描述随 U2 同步一小句。

### Evidence & Limitations

- 直接源证据:`src/server.js`(25 行,GET/POST 精确串匹配,条目含 `ts: Date.now()`)、`package.json`(无依赖与 scripts)、`README.md`;`docs/` 无既有计划。
- 未做外部研究:Node 内置 `http` 单文件服务,本地模式充分。
- 规划阶段未启动服务、未运行任何实现验证(本轮仅授权规划);仓库无契约测试可纳入验证集。

---

## Implementation Units

### U1. pathname 路由匹配

- **Goal:** `/entries` 路由按 pathname 匹配,GET/POST 均接受查询串。
- **Requirements:** R4
- **Dependencies:** 无
- **Files:** `src/server.js`
- **Approach:** 请求入口用 Node 内置 URL 解析分离 pathname 与查询串,GET/POST 分支以 pathname 比较;本单元暂不消费查询参数。
- **Test scenarios:**
  - `GET /entries?x=1` 返回 200 与全量 JSON(不再 404)。
  - `POST /entries`(无查询串)行为不回归。
  - `POST /entries?x=1` 正常添加条目。
  - 非 `/entries` 路径仍返回 404。
- **Verification:** 实施阶段运行时请求观察状态码与响应体符合上述场景。

### U2. month 查询参数筛选

- **Goal:** `GET /entries?month=YYYY-MM` 仅返回该月条目。
- **Requirements:** R1, R2, R3
- **Dependencies:** U1
- **Files:** `src/server.js`, `README.md`
- **Approach:** 从查询串读取 `month`;缺省全量;按 KTD1 正则校验,无效即 400(KTD2);有效时以本地时区月界 `[当月首日, 次月首日)` 过滤 `ts`。筛选判断可提取为小函数以便独立验证,非强制。
- **Test scenarios:**
  - 无 `month`:空库与多条目两种状态均返回全量。
  - 添加两条不同月份条目后按当月查询,仅返回当月条目。
  - 查询无条目的月份,返回空数组。
  - `month=2026-13`、`month=abc`、`month=`(空值)均返回 400。
  - 跨月边界条目归入正确月份(通过可注入的受控 `ts` 或函数级验证)。
  - 携带 `month` 之外的无关键串参数时筛选仍生效。
- **Verification:** 实施阶段运行时 smoke 覆盖上述全部场景;`README.md` 描述与实际行为一致。
- **Execution note:** 本仓库无测试设施,以运行时 HTTP smoke 为主要证明(实施阶段执行)。

---

## Verification Contract

- 启动 `node src/server.js` 并按 U1/U2 场景发起 HTTP 请求 — 覆盖 R1–R4,预期全部场景通过(状态码与响应体符合各场景预期)。
- `README.md` 端点描述比对 — 覆盖 R1,预期描述包含 `month` 参数且与行为一致。

- 仓库契约测试检索:`package.json` 无 scripts、仓库无 test 目录,无既有契约测试需要纳入。
- Blind spot:运行时 smoke 不能证明并发与长时运行行为,也不能证明未知外部消费方的兼容性(无消费方清单)。

---

## Definition of Done

- 全局:R1–R4 全部满足并经运行时场景验证;偏离计划的决策均已记录;无遗留探索性代码。
- U1:pathname 匹配生效,非 `/entries` 路径保持 404。
- U2:`month` 筛选与校验场景全部通过,README 同步完成。
