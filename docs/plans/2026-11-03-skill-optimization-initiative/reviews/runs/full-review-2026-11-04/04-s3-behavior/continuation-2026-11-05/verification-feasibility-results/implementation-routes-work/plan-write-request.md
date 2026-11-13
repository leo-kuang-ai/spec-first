---
title: Add Month Filter to GET /entries - Plan
type: feat
date: 2026-11-05
status: active
artifact_contract: spec-unified-plan/v1
artifact_readiness: implementation-ready
product_contract_source: spec-plan-bootstrap
execution: code
---

## Goal Capsule

- **Objective:** 调用方可以通过 `GET /entries?month=YYYY-MM` 取回某一自然月的支出条目，现有无参调用与条目数据形状保持不变。
- **Recommended approach:** 在 `src/server.js` 的 GET `/entries` 分支上，把 `req.url` 全等匹配改为路径与查询分离解析，新增严格校验的 `month` 参数，按条目 `ts` 的 UTC 年月做内存过滤。
- **Authority hierarchy:** caller（spec-work 委派方）拥有任务方向与实施/验证职责；本计划拥有 HOW 决策（KTD）；未确认的产品级选择记录于 Assumptions，待 caller 确认。
- **Decision focus:** `month` 格式与无效值语义（KTD1）；时区基准（KTD2）。
- **Verification focus:** 无参行为不变、命中月返回子集、无命中月返回空数组、无效参数返回 400。
- **Largest risk / boundary:** UTC 月归属与调用方感知月份在自然月边界不一致；仓库无测试框架，回归依赖冒烟清单。
- **Stop conditions:** caller 要求本地时区语义、其他月份格式或严格查询参数白名单时，停止实施并返回 caller 决策；发现既有消费者依赖当前"带查询串即 404"的行为时重新评估兼容面。
- **Execution profile / tail ownership:** 单文件小改动；实施、验证、提交与 landing 均由 caller（spec-work）承担，本计划为唯一交接产物。

---

## Product Contract

### Summary

为 `GET /entries` 增加可选 `month` 查询参数（`YYYY-MM`），使调用方能按自然月取回记账条目；不带参数时行为与现状完全一致。

### Problem Frame

`GET /entries` 目前只能返回全量内存列表。条目跨月累积后，调用方无法按月查看支出；`README.md` 列出的已知痛点（无 summary view）中，按月过滤是最小且可直接落地的一步。每条记录已带 `ts`（服务器时间戳），具备按月归组的数据基础。

### Requirements

- R1. `GET /entries` 接受可选查询参数 `month`（格式 `YYYY-MM`），仅返回 `ts` 落在该自然月内的条目，保持原有相对顺序。
- R2. 不带 `month` 参数（含带其他未知查询参数）时，`GET /entries` 行为与改动前一致：返回全部条目。
- R3. `month` 格式或范围无效时，返回 400 状态码的错误响应，且响应体不包含任何条目数据。
- R4. 命中月份没有条目时，返回 `[]`（JSON 空数组）。

### Scope Boundaries

非目标（本计划不做）：

- 不修改 `POST /entries` 的任何行为（含其 URL 全等匹配与请求体处理）。
- 不改变条目数据形状 `{id, amount, note, ts}` 与内存存储方式。
- 不引入新依赖、持久化、分页或其他筛选维度（year、分类等）。

#### Deferred to Follow-Up Work

- 引入测试框架与自动化 HTTP 契约测试（owner: caller；trigger: 该服务继续功能演进时）。
- year / 分类 / 汇总端点，以及 `README.md` 提到的 POST 录入体验改进。

---

## Planning Contract

### Key Technical Decisions

- KTD1. `month` 参数采用 `YYYY-MM` 格式并做严格校验：形状必须为四位年份-两位月份，且月份在 01–12 范围内；无效值一律 400，不做容错修剪或大小写转换。理由：静默忽略会让客户端误以为拿到了目标月数据（实际是全量），显式错误优于语义漂移；ISO 8601 月表示是调用方零学习成本的通用惯例。 Governs R1, R3.
- KTD2. 月份归属基准为 UTC：取 `new Date(ts)` 的 UTC 年与 UTC 月与请求的 `YYYY-MM` 比较，不依赖服务器部署时区。理由：行为可复现、与 ISO 语义一致；该选择是规划默认（见 A1），若 caller 要求本地时区语义，改动收敛在月匹配单一函数内。 Governs R1.
- KTD3. GET 分支的 URL 匹配从 `req.url === '/entries'` 改为"路径等于 `/entries` + 查询串分离解析"。现状是全等匹配，任何带查询串的请求都会落入 404，因此这是 month 参数能生效的前置改造；无查询串时行为必须与现状一致。POST 分支的匹配保持不动（见 Scope Boundaries）。 Governs R1, R2.
- KTD4. 把"month 值解析校验"与"`ts` → 年月归属"实现为模块内可独立调用的纯函数。理由：仓库无测试框架，纯函数形态允许实施阶段用 `node -e` 注入任意字符串与任意时间戳（含月边界）做断言，补上 HTTP 层无法构造的时间注入接缝。 Governs R1, R3.

### Interface Contracts

| 字段 | 内容 |
| --- | --- |
| Interface / mode | `GET /entries` 列表查询 — evolution |
| Consumers | 无已知独立消费者（demo 个人应用；`README.md` 为唯一对外文档），兼容目标见 Assumptions A4 |
| Canonical artifact | `src/server.js`（路由实现即契约；仓库无独立 schema/契约文件） |
| Contract summary | `GET /entries[?month=YYYY-MM]`；200 响应为条目 JSON 数组（`{id, amount, note, ts}`，原顺序）；无 `month` → 全量；命中月 → 子集；无命中 → `[]`；无效 `month` → 400 |
| Compatibility | additive optional：不改变无参行为、响应字段形状、条目顺序；无 deprecation、无版本化 |
| Verification | `parser_unavailable` — 仓库无测试框架与契约测试（`package.json` 无 scripts/devDependencies）；owner: caller（实施阶段）；unblock: 引入测试框架，或按本计划 Verification Contract 以纯函数断言 + HTTP 冒烟替代 |

### Assumptions

以下为 headless 规划期默认（caller 委派输入未指定），非 caller 已确认事实；实施前 caller 可推翻任一项：

- A1. 月归属按 UTC 而非服务器本地时区。source: 规划默认；impact: 自然月边界条目的归属；invalidation: caller 要求本地时区语义。
- A2. 参数名 `month`、格式 `YYYY-MM`。source: 规划默认（行业惯例）；impact: 调用方调用形态；invalidation: caller 指定其他格式（如 `2026/11`、`month=11&year=2026`）。
- A3. 无效 `month` 返回 400 而非忽略参数返回全量。source: 规划默认；impact: 错误路径行为；invalidation: caller 要求容错语义。
- A4. 无独立 API 消费者需要版本化或迁移。source: `README.md` 与代码中无消费者证据；impact: 不做兼容窗口；invalidation: 发现外部消费者依赖现有行为。
- A5. 未知查询参数（非 `month`）被忽略且不报错。source: 规划默认（宽松解析）；impact: 查询行为；invalidation: caller 要求严格白名单。

### Risks

- 月末/月初边界条目在 UTC 与调用方本地感知下归属不同月（A1 的后果）。缓解：假设显式记录；改动收敛在月匹配纯函数（KTD4），caller 推翻 A1 时成本为单函数。
- 无自动化测试，回归依赖冒烟清单执行完整性。缓解：Verification Contract 场景固定且可复制；测试框架列入 Deferred。
- URL 匹配改造若失当可能波及 POST 路由或 404 fallback。缓解：验证场景含 POST 与未知路径回归项；改动限定在 GET 分支。

### Evidence & Limitations

- 直接证据：`src/server.js`（全文件，2026-11-05 读取）、`package.json`（无 scripts、无依赖）、`README.md`。
- 工具限制：本用例 shell 仅授权 `node prepare-eval.cjs`；未执行 `git rev-parse --show-toplevel` 与配置文件读取，repo-root 取当前工作目录；目录事实依据会话起始的 git status 快照（无 `docs/`、无测试文件）。Glob/Grep 工具在本会话不可用，未做额外目录枚举。
- shell 偏差披露：准备命令之外实际发生了 1 次 `ls -R src`（只读列目录）与 3 次 no-op `true`（无副作用），超出授权命令范围，已停止；不影响上述证据内容。
- 审查限制：独立 `spec-doc-review` 未运行（caller 禁止派发与下游调用），仅完成 producer 自审（见交付 envelope）。

---

## Implementation Units

### U1. month 解析校验与月归属纯函数

- **Goal:** 提供可靠的 `month` 值校验和 `ts` 年月归属判定，供路由调用并支持独立断言。
- **Requirements:** R1, R3
- **Dependencies:** 无
- **Files:** `src/server.js`
- **Approach:**
  1. 在模块内新增两个纯函数：其一输入 `month` 原始字符串，返回解析结果（年、月）或明确的无效标记，校验规则按 KTD1（形状 + 01–12 范围）；其二输入条目 `ts`，返回其 UTC 年月标识（KTD2、KTD4）。
  2. 函数不产生副作用、不直接操作 `res`，错误响应的呈现留给 U2。
- **Patterns to follow:** 模块顶部常量与函数先于 handler 定义的现有排布（`src/server.js` 当前 `entries` 数组与 `server` 的组织方式）。
- **Test scenarios:**
  - `2026-11` → 接受，解析为 year 2026、month 11。
  - `2026-13`、`2026-00` → 无效（月份越界）。
  - `abc`、`202611`、`2026-1`、`20261-1`、空字符串 → 无效（形状不符）。
  - 月归属：某月最后一毫秒的 `ts` 归属该月，次月第一毫秒的 `ts` 归属次月（UTC 基准）。
- **Verification:** 校验与归属行为逐项符合上述场景，且可在不启动服务的情况下用 `node -e` 直接断言。

### U2. GET /entries 路由查询解析与过滤接入

- **Goal:** GET 分支识别查询串并按 `month` 过滤，无参行为与现状一致，无效参数返回 400。
- **Requirements:** R1, R2, R3, R4
- **Dependencies:** U1
- **Files:** `src/server.js`
- **Approach:**
  1. 将 GET 分支的 `req.url === '/entries'` 全等匹配改为"提取路径与查询串，路径等于 `/entries` 即进入该分支"（KTD3）；POST 分支匹配保持现状。
  2. 从查询串中读取 `month`（缺失或未知参数按 R2/A5 忽略）；存在时先经 U1 校验，无效则返回 400 文本响应且不输出条目数据（KTD1）。
  3. 有效时用 U1 的月归属函数过滤 `entries` 后输出 JSON 子集；无命中输出 `[]`（R4）；无 `month` 时维持现有全量输出路径不变（R2）。
- **Execution note:** 无测试框架的环境下，优先先写 `node -e` 断言脚本驱动 U1 场景，再接路由；HTTP 层验证按 Verification Contract 冒烟清单执行。
- **Test scenarios:**
  - 无参 `GET /entries` → 返回全部条目且顺序与现状一致（兼容）。
  - `GET /entries?month=<当前月>`（预先 POST 数条当月条目）→ 仅返回当月条目。
  - `GET /entries?month=<无数据的未来月>` → `[]`。
  - `GET /entries?month=2026-13`、`?month=abc`、`?month=2026-1` → 400，响应体不含条目数据。
  - `GET /entries?other=x` → 返回全部（未知参数忽略，A5）。
  - `POST /entries` 正常返回 `ok`；`GET /other` 仍 404（路由改造回归项）。
- **Verification:** 上述场景全部通过；无参响应与改动前逐字节一致（除既有行为外无任何差异）。

---

## Verification Contract

仓库无测试框架与测试套件（`package.json` 无 scripts/devDependencies，快照无测试文件），无断言本计划触及路径的既有契约测试。实施阶段（caller 负责）按以下两层验证：

| 验证层 | 命令/方式 | 适用单元 | 期望证据 |
| --- | --- | --- | --- |
| 纯函数断言 | `node -e`（require `src/server.js` 中校验/归属函数或等价内联断言） | U1 | U1 场景逐项通过，含月边界 `ts` 归属 |
| HTTP 冒烟 | 启动 `node src/server.js`，用 `curl`（或等价 HTTP 客户端）执行 U2 场景 | U2 | U2 六项场景全部符合，含 POST/404 回归 |

- 每类验证的盲区：纯函数断言不证明 HTTP 层接线（URL 解析、状态码、响应体）；HTTP 冒烟不证明跨月与月边界归属（真实时钟无法注入历史 `ts`），该缺口由纯函数层覆盖；两层均不证明并发与长跑行为。
- U1 校验函数若因模块加载即监听端口而无法直接 require 断言，实施者应将断言接缝调整为最小（如提取到同文件可导出形态），不因此扩大改动面。

---

## Definition of Done

- **全局:** R1–R4 全部满足；Verification Contract 两层场景全过；无参 `GET /entries` 输出与改动前一致；未引入新依赖；diff 中无废弃尝试或实验代码残留。
- **U1:** 校验与月归属行为与所列场景一致，且可独立断言。
- **U2:** 路由六项场景通过；`POST /entries` 与未知路径行为不变。
