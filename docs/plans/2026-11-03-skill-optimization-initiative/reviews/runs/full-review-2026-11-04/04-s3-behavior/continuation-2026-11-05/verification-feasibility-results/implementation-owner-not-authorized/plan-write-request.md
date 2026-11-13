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

- **Objective:** 使用者可以按自然月查看 MiniLedger 支出条目：`GET /entries?month=YYYY-MM` 只返回该月创建的条目。
- **Recommended approach:** 扩展现有 GET /entries 处理分支（architecture posture: `extend`）：用 Node 全局 `URL` 解析请求路径，严格校验 `month` 参数，按条目 `ts` 归属的服务器本地自然月同步过滤；零新增依赖。
- **Authority hierarchy:** Product Contract（R1-R4）拥有 WHAT；KTD1-KTD4 拥有 HOW；`### Assumptions` 记录未获用户确认的推断。
- **Decision focus:** 月份时区语义（服务器本地 vs UTC）；非法 `month` 的响应（400 vs 静默忽略）。
- **Verification focus:** 加性兼容（无参数调用行为不变）、过滤正确性、400 错误路径。
- **Largest risk / boundary:** 时区语义与参数格式为规划期假设（A1-A3），未经用户逐项确认；仓库无测试框架，验证依赖 smoke 场景。
- **Stop conditions:** 发现既有调用方依赖 `/entries?...` 的 404 行为，或用户指定不同的月份语义/参数格式时，停止执行并回报。
- **Execution profile:** `execution: code`；执行 owner 为 `spec-work`（规划轮未获执行授权）。
- **Tail ownership:** `spec-work` 拥有实现、验证与收尾。

---

## Product Contract

### Summary

为 `GET /entries` 增加可选查询参数 `month`（`YYYY-MM`）：提供时仅返回该自然月创建的条目，未提供时行为与现状一致。

### Problem Frame

MiniLedger 目前只能全量列出条目：`src/server.js` 的 GET 分支把内存数组原样返回。条目增多后无法回答"某个月有哪些支出"这一记账场景的基本问题。README 已把缺少汇总视图列为已知粗糙点，按月筛选是最小的第一步。

### Requirements

- R1. `GET /entries` 接受可选查询参数 `month`，格式为 `YYYY-MM`；提供时仅返回创建时间（`ts`）落在该自然月内的条目。
- R2. 未提供 `month` 时，`GET /entries` 返回全部条目，响应形状（JSON 数组）与顺序（插入序）不变。
- R3. 提供了 `month` 但格式非法（年份非 4 位数字，或月份非 01-12 的 2 位数字）时，返回 4xx 客户端错误，不返回未过滤的完整列表。
- R4. `POST /entries` 的行为与条目结构 `{id, amount, note, ts}` 保持不变。

### Scope Boundaries

#### Deferred to Follow-Up Work

- 年度/自定义时间区间筛选与分页
- 月度合计等汇总视图、类别字段（README 已列方向）
- 统一路由为 pathname 匹配（含 POST 分支）与整体路由重构
- 引入测试框架与自动化契约测试

#### Outside this product's identity

- 持久化存储（保持内存实现）
- 时区配置参数（单机 demo，服务器本地时区足够）
- 第三方依赖（保持零依赖）

---

## Planning Contract

### Key Technical Decisions

- KTD1. `month` 严格校验：年份 4 位数字、月份 2 位数字且在 01-12（如 `2026-11`；`2026-1`、`2026-13` 均非法）。非法值返回 400 与纯文本错误信息，沿用现有 404 `'not found'` 的纯文本先例，不引入 JSON 错误 envelope。Governs R1、R3。（依据 A1、A3）
- KTD2. 月份归属语义：条目按服务器本地时区的自然月归类——把 `ts` 换算为本地日历的年与月后与参数比较。替代方案 UTC 的确定性更强，但会把本地月初/月末附近的条目归入相邻月份，不符合个人记账直觉。Governs R1。（依据 A2；未经用户确认）
- KTD3. GET 分支改用 Node 全局 `URL` 解析 `req.url`（相对引用加任意合法 base），以 pathname 精确匹配 `/entries` 并从 `searchParams` 读取 `month`；不引入依赖，不改 POST 分支的现有精确匹配（最小 diff，替代的统一路由见 Deferred）。Governs R1、R2。
- KTD4. 过滤为内存数组同步筛选，响应仍为 JSON 数组且保持插入顺序；无匹配条目返回空数组与 200。Governs R1、R2。

### Interface Contracts

| Field | Content |
| --- | --- |
| Interface / mode | `GET /entries` 查询契约 — `evolution` |
| Consumers | 无已知下游消费者（demo 应用）；最终使用者经 README 了解端点 |
| Canonical artifact | `src/server.js`（代码即契约，无独立 schema 工件） |
| Contract summary | 可选查询参数 `month=YYYY-MM`；缺省=全量列表；非法=400 纯文本；响应=条目 JSON 数组 |
| Compatibility | 加性（additive）可选参数，无参调用行为不变。注意点：`GET /entries?任意查询` 从 404 变为 200（month 缺省时全量返回），按兼容性修正对待而非破坏 |
| Verification | `parser_unavailable`——`package.json` 无测试框架与 scripts，仓库无契约测试；由执行 owner 以 Verification Contract 的 smoke 场景验证；解除条件：仓库引入测试框架后补自动化契约测试 |

### Assumptions

本轮按用户授权跳过范围确认，以下推断选择未经用户逐项确认：

- A1. 参数格式取 `YYYY-MM`（替代：`YYYYMM`、ISO 时间区间）。影响 KTD1。失效条件：用户指定其他格式。
- A2. "自然月"按服务器本地时区解释（替代：UTC）。影响 KTD2。失效条件：用户要求 UTC 或可配置时区。
- A3. 非法输入返回 400 而非静默忽略。影响 KTD1。失效条件：用户要求宽松处理。
- A4. 除 `month` 外的未知查询参数被容忍并忽略。影响 Interface Contracts 兼容性注意点。
- A5. 无既有调用方依赖 `/entries?...` 返回 404。影响 Interface Contracts。失效条件：发现真实调用方（触发 Goal Capsule 的 stop condition）。

### Implementation Scope Boundaries

- 只改 `src/server.js` 的 GET 分支与 `README.md` 的端点说明；不重构 `src/server.js` 其余结构，不新增文件。

### Evidence & Limitations

- 直接源：`src/server.js`（全文 26 行，当前工作树快照）、`README.md`、`package.json`（无依赖、无 scripts、无测试）。
- 降级事实：git 身份与工作树脏状态未核实——本用例 shell 仅授权 `node prepare-eval.cjs`（已运行一次，输出确认基线已捕获，不构成任务提交授权）；无 `docs/solutions/`、无 `STRATEGY.md`/`CONCEPTS.md`；`.claude/**` 为宿主 runtime 镜像，已排除出规划证据。
- 外部研究未运行：改动仅使用 Node 全局 `URL` 与日期换算，无依赖决策，非 load-bearing。
- 对计划的影响：以上缺口不改变任何 KTD 或单元。

---

## Implementation Units

### U1. GET /entries 路由改为 pathname 匹配并提取 month 参数

- **Goal:** `/entries?...` 请求不再落入 404；`month` 缺省时 GET 行为与现状完全一致。
- **Requirements:** R2；R1 的参数提取部分。
- **Dependencies:** 无。
- **Files:** `src/server.js`
- **Approach:** GET 分支用全局 `URL` 解析 `req.url`，pathname 精确等于 `/entries` 时进入（依据 KTD3）；从 `searchParams` 读取 `month`，读取结果为 null 表示缺省，空字符串视为"已提供且非法"并交给 U2 校验。URL 解析异常按 400 处理，不抛未捕获异常。
- **Patterns to follow:** 现有分支的守卫式结构（`req.method === 'GET' && ...`）。
- **Test scenarios:**
  - 无查询参数 `GET /entries` → 返回全部条目，与改动前一致（回归）。
  - 带无关查询参数 `GET /entries?foo=1` → `month` 缺省，返回全部条目（依据 A4）。
  - `POST /entries` 新增条目仍正常返回（R4 回归）。
  - `GET /entries/`（尾斜杠）与其他未知路径仍 404（回归）。
- **Verification:** 上述请求的实际响应（状态码、响应体形状、条目集合）与改动前基线一致。

### U2. month 校验、按月过滤与 400 错误路径

- **Goal:** 合法 `month` 仅返回该自然月条目；非法 `month` 返回 400；README 同步端点说明。
- **Requirements:** R1、R3；R4 保持不变。
- **Dependencies:** U1。
- **Files:** `src/server.js`、`README.md`
- **Approach:** 按 KTD1 严格校验（空字符串同样非法）；非法时设 400 并以纯文本响应，沿用 `'not found'` 的既有错误风格；合法时解析年月，按 KTD2 把每条 `ts` 换算为本地年月比较过滤（KTD4），无匹配返回空数组。README 的 `GET /entries` 行补 `?month=YYYY-MM` 用法一句。
- **Execution note:** 仓库无测试框架——smoke-first：先起服务用真实请求验证行为；如想引入测试框架，先回报（属 Deferred），不自行引入。
- **Patterns to follow:** 既有错误路径的纯文本响应风格。
- **Test scenarios:**
  - 当月过滤（happy path）：先 `POST /entries` 两条，`GET /entries?month=<当前年月>` → 包含这两条。
  - 排除其他月份（edge）：`GET /entries?month=<上一个月>` → 不包含刚创建的条目。
  - 无匹配返回空数组（edge）：查询远过去月份如 `2000-01` → 200 且 `[]`。
  - 非法格式（error path）：`month=2026-13`、`month=2026-1`、`month=bad`、`month=`（空值）→ 均为 400，且不返回列表。
  - 回归：无 `month` 的 `GET /entries` 仍返回全部条目。
  - 验证缺口（如实记录）：跨自然月边界条目的精确归类无法仅靠现有 API 构造——`POST` 固定以当前时间写入 `ts`，无法注入历史时间戳；该场景由 KTD2 的年月比较逻辑保证，执行 owner 可临时构造数据做一次性验证，不作为硬性 smoke 门槛。
- **Verification:** 全部 smoke 场景按期望通过；README 与实现行为一致。

---

## Verification Contract

| 项 | 内容 |
| --- | --- |
| 服务启动 | `node src/server.js`（内存数据、零依赖，监听 3000） |
| 请求工具 | `curl` 或等价 HTTP 客户端；场景见 U1/U2 的 Test scenarios |
| 既有仓库契约测试 | 无——仓库不存在任何测试文件或 test script，无可断言 `src/server.js`/`README.md` 的既有测试 |
| 质量门槛 | U1、U2 全部 Test scenarios 通过；R1-R4 逐条对照成立 |
| 最大未证风险 | 时区归类（KTD2/A2）：smoke 只在执行机器本地时区验证当前月；跨时区与跨月边界行为无自动化覆盖 |
| 盲区（每类命令） | smoke 无法证明：重启后数据留存（内存实现，产品现状）、并发请求语义、非本机时区的月份归类 |

---

## Definition of Done

- 全局：R1-R4 全部满足；U1、U2 验证通过；`POST /entries` 与条目结构不变；未引入新依赖与新文件；README 已更新。
- 清理：diff 中无实验性/死代码残留（无未用辅助函数、无注释掉的旧分支）。
- U1：带/不带查询参数的 GET 路由行为与基线一致。
- U2：合法过滤、空结果、400 错误路径全部按场景通过。
