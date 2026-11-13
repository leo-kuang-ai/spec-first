---
title: Entries Month Filter - Plan
type: feat
date: 2026-11-06
status: active
artifact_contract: spec-unified-plan/v1
artifact_readiness: implementation-ready
product_contract_source: spec-plan-bootstrap
execution: code
---

# Entries Month Filter - Plan

## Goal Capsule

- **Objective:** 用户访问 `GET /entries` 时可以按自然月筛选,只取指定月份的记账条目。
- **Recommended approach:** 在 `src/server.js` 现有的原生 `http` GET 处理器内增加查询串解析、`month` 参数校验与过滤;零新依赖。
- **Authority hierarchy:** WHAT 来自用户请求(bootstrap,无上游 Product Contract);微语义(校验失败行为、时区)为规划判断,见 KTD 与 Assumptions。
- **Decision focus:** 非法 `month` 的处理(400 还是忽略)、月份派生时区(UTC 还是本地)、查询串路由的兼容性变化。
- **Verification focus:** HTTP 级场景 — 无参回归、跨月筛选、空结果、非法输入、月边界、`POST /entries` 回归。
- **Largest risk / boundary:** `GET /entries?<任意查询串>` 的响应从 404 变为 200 全量,是一次已披露的行为变化;仓库无测试基建,验证路径需新建。
- **Stop conditions:** 实施轮若发现现有代码与计划前提冲突(例如已存在查询处理),停止并上报差异,不自行扩大范围。
- **Execution profile / tail ownership:** 单文件小改 + 新增一个测试文件;实施、验证与收尾(含本计划状态流转)归未来授权轮的执行 owner(`spec-work`)。

---

## Product Contract

### Summary

为 `GET /entries` 增加可选 `month` 查询参数(格式 `YYYY-MM`),只返回该月的条目;不带参数时行为与现状完全一致。

### Problem Frame

MiniLedger 目前只有内存条目列表,`GET /entries` 一律返回全部数据。随着条目跨月累积,用户无法只查看某个月的开销。README 已把"无汇总视图"列为已知粗糙点,按月查看是其中最小的第一步。

### Requirements

- R1. `GET /entries?month=YYYY-MM` 只返回 `ts` 落在该月的条目,响应仍为 JSON 数组,条目对象形状不变。
- R2. 不带 `month` 参数时,`GET /entries` 返回全部条目,顺序与响应行为与现状一致。
- R3. `month` 值不符合 `YYYY-MM`(含月份越界,如 `2026-13`)时,返回 400 客户端错误,不静默回退为全量。
- R4. `POST /entries` 的写入行为与未知路径的 404 行为保持不变。

### Scope Boundaries

- 只做 `month` 一个筛选参数;`year`、自定义区间、分页、分类留待后续。
- 不引入 Web 框架或任何新依赖;不做持久化改造。
- `POST /entries` 行为与数据形状(`{id, amount, note, ts}`)不变。

---

## Planning Contract

### Key Technical Decisions

- KTD1. **参数契约与校验失败行为**:`month` 采用 `YYYY-MM`,严格校验(4 位年份 + 01–12 两位月)。参数未出现视为缺席,走全量;参数出现但值为空串或格式非法(含 `2026-13`、`2026-1`、`2026/11`、`abc`)一律 400。拒绝"忽略非法参数静默返回全量"——那会掩盖调用方错误。Governs R1、R3。
- KTD2. **月份派生用 UTC**:由 `ts` 派生 `YYYY-MM` 采用 UTC(`toISOString` 前 7 位),保证跨环境可测、确定;备选"服务器本地时区"因跨环境不可预测被拒。如未来需本地时区,改动应收敛在单一派生点。Governs R1。
- KTD3. **路由匹配改为 pathname 解析**:现有 `req.url === '/entries'` 全串精确匹配无法承载查询串;改为解析 URL 后比较 `pathname`,未知查询参数忽略。披露兼容性变化:此前 `/entries?x=1` 返回 404,此后返回 200 全量——属 additive 姿态下可接受的对齐;回滚即还原本文件改动。Governs R1、R2、R4。
- KTD4. **复用 Node 内置能力(extend)**:查询解析用全局 `URL`/`URLSearchParams`,月份比较为派生串等值;不引入框架。架构姿态 `extend`:现有 GET handler 吸收查询解析与过滤,不新增抽象边界;可选提取纯函数(如 `monthOf(ts)`)仅为可测性,由实现者裁量。

### Interface Contracts

| Field | Content |
| --- | --- |
| Interface / mode | `GET /entries` HTTP 查询参数 — evolution |
| Consumers | 未知(私有演示应用,README 未记录外部调用方) |
| Canonical artifact | 无独立契约文件;`src/server.js` 内联实现即契约 owner |
| Contract summary | 新增可选 `month=YYYY-MM`;缺省行为不变;非法值 400。错误响应体格式无既有约定,维持仓库现状用纯文本即可 |
| Compatibility | additive-optional;附带行为变化见 KTD3(带任意查询串的 404→200);无弃用;回滚 = 还原 `src/server.js` |
| Verification | `parser_unavailable` — 仓库无契约测试/解析器(owner:实施轮执行 owner;unblock 条件:仓库引入契约测试基建);以 `node --test` 的 HTTP 级场景为最窄替代证据 |

### Assumptions

无同步用户可确认下列推断,均可在实施前推翻:

- A1. `month` 格式为 `YYYY-MM`(推断自"month 筛选"惯例)。若用户期望其他格式(如 `YYYYMM`),R1 与 KTD1 需改。
- A2. UTC 月份语义(KTD2)未经用户确认。若产品要求按用户本地时区归属月边界条目,KTD2 失效。
- A3. 非法参数返回 400(KTD1)未经用户确认。若产品偏好宽松忽略,R3 失效。
- A4. 以 `node:test` 承载测试,假设运行环境 Node ≥ 18(仓库无 `engines` 字段,版本未核实)。若环境更旧,换用直接 `assert` 脚本,U1 场景不变。

### Implementation Scope Boundaries

- `server.listen(3000)` 的启动方式重构(如 `require.main === module` 守卫、可配端口)默认不做;仅当实施轮测试确需随机端口时作为最小改动引入,且不改变直接运行行为。
- 计划外相邻工作留待后续:`year`/自定义区间筛选、分页、持久化、汇总视图。

### Evidence & Limitations

- 直接源证据:`src/server.js`(原生 `http`,内存 `entries`,`GET /entries` 为全串精确匹配)、`package.json`(无 scripts、无依赖)、`README.md`(记录两端点与 `{id, amount, note, ts}` 形状)。
- 仓库无任何测试目录与契约测试;`docs/solutions/` 不存在,无机构学习可引用;未做外部研究(无显式请求,Node 内置能力足够)。
- 规划轮 shell 仅授权 `node prepare-eval.cjs`(已执行,输出确认 fixture 基线已捕获);git 基线哈希与 Node 版本未直接核对,由实施轮按需确认。规划过程中另有一次只读 `ls` 误用(无副作用,已停止该类操作)。

---

## Implementation Units

### U1. GET /entries 的 month 筛选(实现 + 测试)

- **Goal:** `GET /entries` 支持 `?month=YYYY-MM` 过滤,且无参与相邻端点行为完全回归。
- **Requirements:** R1、R2、R3、R4(受 KTD1–KTD4 约束;A1–A4 为其下假设)。
- **Dependencies:** 无。
- **Files:** `src/server.js`(修改)、`README.md`(一行说明新参数)、`test/entries-month.test.js`(新建)。
- **Approach:** GET 分支先解析 URL:以 `pathname === '/entries'` 分发(KTD3);`month` 未出现走现状全量路径;出现则严格校验(KTD1),非法即 400;合法则按 UTC 派生月份做等值过滤(KTD2)。POST 分支与 404 兜底不动。月份派生收敛为单一辅助点,可导出纯函数供测试直测。
- **Execution note:** 先写失败的 HTTP 级测试再实现过滤逻辑;模块 require 即监听 3000,测试直接复用该端口即可,冲突时才启用上文可选守卫。
- **Patterns to follow:** 仓库现状风格 — 纯文本错误响应(如 `'not found'`)、`JSON.stringify(entries)` 返回。
- **Test scenarios:**
  - 回归:`GET /entries` 无查询串 → 200、`application/json`、全部条目按原顺序。
  - 筛选:经 `POST /entries` 预置条目后,对"当前月"(测试内由 `Date` 现算,保证可构造)筛选命中;对远端月份(如 `2000-01`)筛选得空数组 `[]`(200)。
  - 非法输入:`month=2026-13`、`2026-1`、`2026/11`、`abc`、`month=` 空串 → 400。
  - 月边界(UTC):若实现导出月份派生纯函数,直接断言"某月末 23:59:59.999Z 归属该月、次月首 00:00:00.000Z 归属次月";未导出则以"当前月命中 + 远月不命中"的黑盒场景为界,并在交付说明中记录边界未逐点验证。
  - 查询串路由:`GET /entries?other=1` → 200 全量(KTD3 披露的兼容性变化)。
  - 相邻回归:`POST /entries` 仍写入并返回 `ok`;未知路径仍 404。
- **Verification:** 上述场景全部通过;无参 `GET /entries` 与 `POST /entries`、未知路径行为与改动前一致。

---

## Verification Contract

- 主命令:`node --test`(运行 `test/entries-month.test.js`;需 Node ≥ 18,见 A4)。备选:`node test/entries-month.test.js`。
- 实施轮可另做一次性手工 smoke:启动服务后用 HTTP 客户端覆盖 U1 场景;证据记入交付说明,不入库。
- 既有契约测试核对:仓库无测试套件,无其他契约测试需要纳入。
- 盲区:自动化命令证实不了真实并发与时区环境差异;仓库无 CI,提交级回归依赖实施轮本地执行;手工 smoke 不构成可重复证据。

---

## Definition of Done

- R1–R4 全部满足,U1 测试场景通过,无参 `GET /entries`、`POST /entries`、未知路径行为与改动前一致。
- README 的一行参数说明已更新;无残留实验或死代码进入 diff。
- 计划状态流转(`active → completed`)与提交、落库动作由获得授权的执行 owner(`spec-work`)完成;规划产出者不执行。
