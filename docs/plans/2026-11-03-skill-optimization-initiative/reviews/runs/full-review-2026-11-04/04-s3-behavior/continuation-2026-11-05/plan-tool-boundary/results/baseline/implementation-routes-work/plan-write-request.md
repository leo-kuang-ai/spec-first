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

- **Objective:** 调用方可以通过 `GET /entries` 的可选 `month` 参数只获取某个自然月的支出条目;不带参数的调用返回全部条目,行为与现在一致。
- **Recommended approach:** 在 `src/server.js` 现有请求处理内做 additive 扩展(evolution):把请求 URL 解析为 pathname 与查询参数,GET 路由按 pathname 匹配,`month` 校验后按条目 `ts` 的所属月份过滤;零新依赖。
- **Authority hierarchy:** Product Contract(WHAT)→ 当前源码与 README(HOW 约束)→ 本计划 Key Technical Decisions。
- **Decision focus:** `month` 参数契约 —— 格式(YYYY-MM)、无效值处理(400)、月份归属时区;三项均为规划期假设,待 caller 审阅(见 Assumptions)。
- **Verification focus:** `node --test` 契约测试覆盖筛选/兼容/错误三态,加上启动真实进程后的手动冒烟。
- **Largest risk / boundary:** 现路由用 `req.url` 严格相等匹配,任何带查询参数的请求都会 404 —— 路由匹配必须先行调整;月界条目的时区归属存在语义歧义。
- **Stop conditions:** caller 若要求不同的参数格式、错误策略或时区语义,或追加持久化、其他筛选维度,本计划退回重新规划。
- **Execution profile:** 单仓库、单文件行为扩展,外加一个契约测试文件与 README 同步。
- **Tail ownership:** 实施与验证由 caller 保留;本计划为交接产物。

---

## Product Contract

### Summary

为 MiniLedger 的 `GET /entries` 增加可选 `month` 查询参数,按条目创建时间所在自然月过滤返回结果;不带参数时保持现有全量返回。

### Problem Frame

`GET /entries` 目前一次性返回内存中的全部支出条目。条目只有 `{id, amount, note, ts}`,没有任何按时间维度查看的方式;用户想核对某月开销时只能取全量后自行过滤。README 已把"没有汇总视图"列为已知粗糙点,按月查看是其中最小、最直接的一步。本计划只解决"按月取条目",不解决汇总、分类或持久化。

### Requirements

- R1. `GET /entries` 接受可选 `month` 查询参数,只返回 `ts` 落在该自然月内的条目(筛选基准是条目创建时间 `ts`)。
- R2. 不带 `month` 参数时,`GET /entries` 返回全部条目,响应形状与现状一致(规划期假设 A1)。
- R3. `month` 值不符合约定格式时,返回明确的客户端错误响应,不静默降级为全量或空列表(规划期假设 A2)。

### Acceptance Examples

- AE1. **Covers R1.** Given 条目分别创建于 2026-01 与 2026-02,When `GET /entries?month=2026-01`,Then 响应只含 2026-01 的条目。
- AE2. **Covers R2.** Given 任意存量条目,When `GET /entries`(无参数),Then 返回全部条目,与变更前一致。
- AE3. **Covers R3.** When `GET /entries?month=2026-13`(或 `202601`、`abc`),Then 返回 400 与错误信息,不返回条目数组。
- AE4. **Covers R1.** Given 条目 `ts` 恰在本月 1 日 00:00(服务器本地时区),When 按该月筛选,Then 该条目包含在结果中(时区语义见 KTD3 与假设 A3)。

### Scope Boundaries

非目标(本次不做):

- 其他筛选维度(年份、金额、note 关键字)、分页、排序。
- 持久化存储;数据仍为内存态,重启即失。
- 引入 web 框架或任何 npm 依赖。
- 汇总/统计视图(README 所列粗糙点中的其余项)。
- `POST /entries` 行为保持现状,本计划不给 POST 增加任何查询语义。

#### Deferred to Follow-Up Work

- `POST /entries` 路由匹配方式与 GET 统一(现状下带查询参数的 POST 请求仍 404;统一化属于行为扩展,不在本次确认范围)。
- 若未来出现多时区使用场景,月份归属从服务器本地时区迁移到显式时区参数(触发条件: 出现跨时区用户或明确的时区需求)。

---

## Planning Contract

### Key Technical Decisions

- KTD1. **请求路由改为按 pathname 匹配(仅 GET 分支)。** 现状 `req.method === 'GET' && req.url === '/entries'` 是严格相等,`/entries?month=2026-01` 会直接落入 404 分支。用 Node 内置 `URL` 解析 `req.url` 取 pathname 与查询参数,GET 分支按 pathname 匹配;解析失败(如非法百分号编码)兜底为 400,不抛未捕获异常。POST 分支保持现有匹配方式不变,避免引入未确认的行为变化(一致性统一见 Deferred)。Governs R1。
- KTD2. **`month` 契约: 可选、`YYYY-MM`、严格校验、无效即 400。** 4 位年份 + 01-12 两位月份;校验失败返回 400 与简短错误说明;参数缺省走全量返回。选择显式拒绝而非静默忽略: 静默忽略会把"格式写错"伪装成"返回全部",调用方难以察觉。Governs R1、R2、R3。(依据假设 A1、A2)
- KTD3. **月份归属按服务器本地时区解释 `ts`。** 个人记账的"某月"与用户本地日历感知一致,服务器本地时区是当前单机 demo 下最贴近的语义;UTC 会让临近月界的条目归错月。测试用本地时区锚定的 `ts` 构造边界数据。Governs R1。(依据假设 A3;这是实现约定而非已确认的产品决策)
- KTD4. **可测试性: 导出 `{ server, entries }` + `require.main` 守卫,验证用 `node:test`。** 现状模块加载即监听 3000,测试进程无法复用。把 `server.listen(3000)` 放进 `require.main === module` 守卫并导出 server 与 entries,测试内以临时端口启动并做真实 HTTP 往返。`node:test` 是 Node 内置,与仓库零依赖现状一致。Governs R1、R2、R3 的可验证性。(依据假设 A4)

### Interface Contracts

| 字段 | 内容 |
| --- | --- |
| Interface / mode | `GET /entries` 查询契约 / evolution(additive) |
| Consumers | 当前无已知外部消费者;`README.md` 是端点行为的既有文档面,demo 调用方按其理解接口 |
| Canonical artifact | `src/server.js`(代码即契约,无独立 schema 文件);`README.md` 承载人读契约,随 U2 同步 |
| Contract summary | 可选 `month=YYYY-MM`;缺省返回全量 JSON 数组;无效 `month` 返回 400 与错误信息;其余行为不变 |
| Compatibility | additive 可选变更: 不带参数的调用行为等价;无 deprecation、无 breaking |
| Verification | U1 新增 `test/server.month.test.js` 以 `node --test` 断言契约;`parser_unavailable` —— 仓库无独立契约 schema/解析器,以测试断言为替代证据,owner 为 caller,unblock 条件是未来引入正式 API 契约文件 |

架构姿态: **extend** —— 在既有 `src/server.js` 请求处理内扩展现有端点,不引入新抽象、新生产文件面(测试文件除外)或新依赖;reuse/compose/new 均不适用。

### Assumptions

以下推断在本次规划中按推荐默认值采用,均未经 caller 或产品方确认;每项含来源、影响与失效条件。caller 否决任一项时,回到对应 KTD 调整。

- A1. `month` 采用 `YYYY-MM` 格式。来源: ISO 8601 月粒度惯例推断。影响: 参数校验逻辑与 README 文档。失效: caller 指定其他格式(如 `2026/1`)。
- A2. 无效 `month` 返回 400。来源: 显式错误优于静默降级的 API 常规推断。影响: 错误路径行为与 AE3。失效: caller 选择静默忽略策略。
- A3. 月份归属按服务器本地时区。来源: 单机个人记账 demo 的使用场景推断。影响: 月界条目归属(见 KTD3)。失效: 出现多时区需求或 caller 指定 UTC。
- A4. 运行环境为 Node ≥ 18(`node:test` 与全局 `URL` 可用)。来源: `package.json` 无 `engines` 声明,仓库无版本锁定文件。影响: 验证命令可用性。失效: 宿主 Node < 18 —— 自动测试不可用,验证退化为仅手动冒烟。
- A5. 不带参数返回全量是预期兼容行为而非疏忽。来源: "增加筛选"语义的强惯例推断。影响: R2 与回归场景。

### Evidence & Limitations

- 直接依据: `src/server.js`(GET/POST 路由的严格相等匹配、`entries` 数组与 `ts` 字段)、`README.md`(端点行为与数据形状描述)、`package.json`(零依赖、无 scripts、无 engines)。仓库无任何既有测试、CI 配置或 `docs/` 目录,故无可参考的本地测试惯例,也无断言 `src/server.js` 的既有契约测试需要纳入验证命令。
- 限制: 规划阶段未运行服务或任何测试(规划产出者边界);Node 实际版本未验证(见 A4);`month` 契约细节未获产品确认(见 A1-A3)。

---

## Implementation Units

### U1. `GET /entries` 的 `month` 筛选实现与契约测试

- **Goal:** 带可选 `month` 参数的 `GET /entries` 按自然月过滤返回;无效参数返回 400;无参数行为不变;并附契约测试。
- **Requirements:** R1、R2、R3
- **Dependencies:** 无
- **Files:** `src/server.js`(修改);`test/server.month.test.js`(新建)
- **Approach:**
  1. 按 KTD4 建立可测性 seam(`require.main` 守卫监听 3000,导出 server 与 entries),`node src/server.js` 的启动行为不变。
  2. 按 KTD1 在请求处理中解析 `req.url` 为 pathname 与查询参数;GET 分支改按 pathname 匹配,POST 分支保持现状匹配。
  3. 按 KTD2 校验 `month`(参数存在时): 通过则按 KTD3 将每个条目 `ts` 的本地年月与请求月份比对后过滤;不通过则返回 400 与错误信息;参数缺省返回全量。
- **Execution note:** 先为三态(筛选/全量/400)写失败的契约测试,再实现到绿。
- **Patterns to follow:** 沿用 `src/server.js` 现有的零依赖、CommonJS、原生 `http` 风格;错误响应保持与现有 `not found` 一致的纯文本简洁风格。
- **Test scenarios:**
  - 无参数 `GET /entries` 返回全部条目,JSON 数组形状不变(Covers AE2)。
  - 数据集含 2026-01 与 2026-02 条目时,`month=2026-01` 只返回 2026-01 条目(Covers AE1)。
  - 筛选月份无任何条目时返回空数组 `[]`,不是 404 或错误。
  - `month=2026-13`、`month=202601`、`month=abc`、`month=`(空值)均返回 400(Covers AE3)。
  - `ts` 恰为本地时区月初 00:00:00 的条目归入当月;上月最后一天 23:59:59 归入上月(Covers AE4)。
  - 裸 `/entries` 与 `/entries?month=...` 两种 URL 均命中 GET 处理器,不再 404。
  - 畸形百分号编码(如 `month=%zz`)不使进程崩溃,按 400 兜底。
  - 裸 `POST /entries` 仍可正常添加条目(回归)。
- **Verification:** `node --test` 全绿;`node src/server.js` 直接启动仍监听 3000 且裸 GET/POST 行为不变。

### U2. README 端点文档同步与端到端冒烟

- **Goal:** 人读契约(README)反映新的 `month` 参数;真实进程冒烟确认三态行为。
- **Requirements:** R1、R2、R3(文档面)
- **Dependencies:** U1
- **Files:** `README.md`(修改)
- **Approach:** 在 README 端点描述中补充可选 `month` 参数: 格式 `YYYY-MM`、缺省全量、无效返回 400、按条目 `ts` 所在自然月(服务器本地时区)过滤。随后启动服务,`POST` 若干不同月份条目,依次冒烟无参数、有效 `month`、无效 `month` 三种调用。
- **Test expectation:** none -- 纯文档与冒烟收尾单元,行为断言由 U1 契约测试承担。
- **Verification:** README 与实现行为一致(人工核对);三种调用的实际响应符合 AE1-AE3。

---

## Verification Contract

| 命令 / 检查 | 适用单元 | 说明 |
| --- | --- | --- |
| `node --test` | U1 | 发现并运行 `test/` 下契约测试;要求 Node ≥ 18(假设 A4) |
| 启动 `node src/server.js` 后依次请求 `http://localhost:3000/entries`、`/entries?month=2026-01`、`/entries?month=2026-13` | U2 | 真实进程冒烟,依次核对全量/筛选/400 三态,对照 AE1-AE3 |

- 既有契约测试核查: 仓库当前无任何测试文件或 CI 配置断言 `src/server.js` 或 `README.md`,无既有契约测试可纳入上表;U1 的新测试文件是首个。
- 最大未证风险: 月份边界的时区归属(KTD3)只在测试构造的 `ts` 上验证,真实部署时区下的表现未证。
- 各命令类的盲区: `node --test` 不能证明 README 描述与实现一致(需 U2 人工核对),也不覆盖并发请求;冒烟只抽查三态、不构成回归面;仓库无 CI 门禁,全部验证由 caller 在实施阶段手动执行并记录结果。
- 证明意图: U1 契约测试是本计划产品契约确认的主要证据,冒烟为辅助;`release:validate` 无对应发布面,不适用。

---

## Definition of Done

- 全局: R1-R3 满足且 U1 测试全绿(或 Node < 18 时冒烟三态通过);裸 `GET /entries` 与裸 `POST /entries` 行为回归确认无变化;README 已同步;未引入 npm 依赖;无遗留实验或死代码。
- U1: 三态契约测试与边界场景全部通过;`node src/server.js` 启动行为不变。
- U2: README 描述与实际响应一致;冒烟三态结果记录在案。
