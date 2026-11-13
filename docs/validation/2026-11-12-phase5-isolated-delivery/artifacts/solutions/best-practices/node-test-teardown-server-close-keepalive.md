---
title: "node:test 集成测试 teardown：server.close() 何时真的被 fetch keep-alive 拖住"
date: "2026-11-12"
category: docs/solutions/best-practices/
module: "test/server.test.js teardown（node:test + 全局 fetch 进程内集成测试）"
problem_type: best_practice
component: testing_framework
severity: low
source_refs:
  - "test/server.test.js:16-20"
  - "src/server.js:45-49"
  - "package.json:6-8"
  - "docs/plans/2026-11-12-001-feat-entry-by-id-plan.md"
invalidation_condition: "本文依赖外部运行时行为：Node http server.close() 的连接等待语义与 undici 全局 fetch 的客户端 keep-alive 行为（实测于 node v22.22.3 / darwin，其它版本未核实）。失效触发：项目测试不再用全局 fetch 打真实 server（如改 mock 或子进程方案），或所用 Node 版本的 http 文档 / release notes 宣布 close() 语义变化（例如对 close 之后才转为空闲的连接也主动关闭）。只读核查方式：重跑正文 Examples 中的一次性实验脚本（node -e，不修改仓库文件）比对 close 回调时延，并查阅所用 Node 版本的 http 模块文档。"
applies_when:
  - "进程内启动真实 Node http server、用全局 fetch（undici）发请求的测试 teardown（node:test 或任何测试器）"
  - "teardown 时刻可能存在非空闲连接：漏 await 的 floating fetch、慢端点、并发未收尾的请求"
  - "需要 teardown 确定性退出，不依赖连接恰好全部空闲或客户端 keep-alive 超时"
tags: [node-test, http-teardown, keep-alive, fetch, undici, closeallconnections]
---

# node:test 集成测试 teardown：server.close() 何时真的被 fetch keep-alive 拖住

## Context

本仓库建立首个自动化测试面（`test/server.test.js`：node:test + 全局 fetch，对 `src/server.js` 导出的 server 在 port 0 上打真实 HTTP，`package.json` 的 test script 为 `node --test`）。规划阶段按流行建议预判「fetch 的 keep-alive 会挂起 `server.close()` 回调」，teardown 落成了 `closeAllConnections()` + `close()`（现行实现 `test/server.test.js:16-20`），实现注释也把该机制当作事实陈述。本次沉淀时用一次性实验核对了这一表述，发现它对当前运行时**不精确**：笼统归因于 keep-alive 会把排查引向错误方向。实测语义（node v22.22.3，darwin；脚本见 Examples）：

| close() 调用时刻的连接状态 | 只调 `server.close(cb)` | 先 `closeAllConnections()` 再 `close()` |
| --- | --- | --- |
| 全部 socket 空闲（fetch 均 await 且 body 已消费） | 回调立即触发（15 次连续请求后同样立即；响应已返回但 body 未消费的也立即） | 立即 |
| 存在在途请求（如漏 await 的 fetch、慢端点） | 回调需等请求完成，**再等该 socket 转入 keep-alive 空闲后自然超时**（实测请求 1535ms 已完成，close 回调 4545ms 才触发） | 立即（实测 124ms） |

关键在第二行：请求完成后 close() 并不回收它留下的空闲 keep-alive socket——close() 只按「调用时刻」的连接状态处理，之后才转为空闲的连接要等客户端 keep-alive 超时自然断开。

## Guidance

进程内真实 server + 全局 fetch 的集成测试，teardown 固定采用现行模式（先 `closeAllConnections()`，再 `close()`）：

```js
// test/server.test.js:16-20（现行实现；注释行原文如此，机制表述的修正见下文）
after(async () => {
  // fetch 的 keep-alive 连接会让 close 的回调一直挂起，先断开全部连接
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
});
```

配套纪律：测试用例里每个 fetch 都要 await 并消费 body。这是「即使不加 `closeAllConnections()` 也能立即退出」的前提，更是防 floating request 语义错误的根本——`closeAllConnections()` 让 teardown 不为漏 await 买单，但不豁免请求本身没被断言的问题。

## Why This Matters

- 真正拖住/挂起测试进程的条件是 close 时刻存在**非空闲**连接，而不是「用了 keep-alive」本身。机制归因错了，排查就会走错方向：以为禁用 keep-alive 就安全（在途连接照样拖住 close），或以为加了 `closeAllConnections()` 就覆盖一切（它只救 teardown 的退出时机）。
- CI 表现形态：用例全绿但进程迟迟不退、直到超时被杀——最常被误判为 flaky 或 runner bug。
- `test/server.test.js:17` 的现行注释在本运行时对空闲 socket 不成立：本仓库套件全部用例 await + 消费 body，整套 `npm test`（10 用例）约 113ms 完成，teardown 实际并未挂起。`closeAllConnections()` 的真实价值是**确定性兜底**：无论连接处于何种状态、无论运行时版本语义如何，teardown 都不等任何连接。
- 版本边界：`closeAllConnections()` 实测存在于本环境（v22.22.3，套件 teardown 即在调用）；其引入版本与更老 Node 上 close() 对空闲 socket 的语义未在本地核实，社区流行说法的来源版本亦未核实，均不作事实陈述。

## When to Apply

- 任何「进程内起真实 Node http server + fetch 断言」的测试 teardown（不限 node:test）。
- teardown 前可能有未收尾请求（并发用例、floating fetch、慢端点）时，`closeAllConnections()` 从「礼貌」升级为「必要」。
- 不适用于：mock 掉 HTTP 层的测试；子进程起 server、靠进程退出回收连接的形态。

## Examples

复现实验（一次性 `node -e`，不依赖仓库文件；node v22.22.3）：

- 场景 A（空闲即 close）：15 次顺序 `await fetch` 且消费 body → 只调 close()，回调立即触发。body 未消费的已返回响应（场景 C）同样立即。
- 场景 D（在途即 close）：server 延迟 1.5s 响应；发起 fetch 不 await；100ms 后只调 close() → 回调 4545ms 才触发（响应 1535ms 已完成，其后 socket 空闲 keep-alive，close() 等它自然超时）。
- 场景 E（D + 兜底）：同 D，close 前 `closeAllConnections()` → 124ms 完成。

```js
// 场景 D/E 最小脚本：去掉 closeAllConnections() 一行即场景 D
const http = require('http');
const t0 = Date.now();
const s = http.createServer((req, res) => setTimeout(() => res.end('slow'), 1500));
s.listen(0, '127.0.0.1', async () => {
  fetch('http://127.0.0.1:' + s.address().port).then((r) => r.text());
  await new Promise((r) => setTimeout(r, 100));
  s.closeAllConnections();
  s.close(() => { console.log('closed at', Date.now() - t0, 'ms'); process.exit(0); });
});
```

移除前验证（若未来想退役 `closeAllConnections()`）：注释掉该行后重跑 `npm test`——在本运行时预期仍立即退出（socket 均空闲）；一旦套件引入任何非 await 的请求即回到场景 D。它是零成本兜底，建议保留。

## Related

- `docs/plans/2026-11-12-001-feat-entry-by-id-plan.md` — U1 对挂起的先验预判（「必要时关闭全部连接，避免 keep-alive 挂起」）。
- `test/server.test.js:16-20` — 现行 teardown；`src/server.js:45-49` — 使进程内测试成为可能的接缝（`require.main === module` 守卫 + `module.exports`）。
