## 诊断结论（Phase 2：根因已确认）

**根因**：`src/server.js:10` 的 `JSON.parse(body || '{}')` 在 `req.on('end')` 回调里同步抛出 `SyntaxError`，异常逃逸出事件回调成为进程级 `uncaughtException`，代码里既无 `try/catch` 也无 `process.on('uncaughtException')` 兜底，Node 默认行为是打印堆栈后退出进程。

**完整因果链**（每一环都有运行时证据）：

1. 客户端 POST 非法 JSON（如 `{"amount": 10,,}`）到 `/entries`；
2. `body` 经 `'data'` 事件拼好（`src/server.js:8`），`'end'` 触发；
3. `src/server.js:10` 的 `JSON.parse` 抛 `SyntaxError` —— `|| '{}'` 只兜住**空 body**，兜不住**畸形 JSON**；
4. 异常从 `'end'` 监听器里抛出，Node 的 EventEmitter 不会捕获监听器异常，直接升级为进程级 `uncaughtException`；
5. 无任何捕获层 → Node 打印堆栈、进程退出（实测 PID 10685 死亡）；
6. 进程没了，后续所有请求 connection refused。

**实测证据**：合法 JSON → `ok [http:200]`；非法 JSON → `curl_exit=52`（服务端空响应），进程死亡，随后 GET → `curl_exit=7`；服务日志堆栈精确指向 `server.js:10:37`。

**为什么没被测试拦住**：仓库完全没有测试（`package.json` 无 scripts、无测试依赖），这是缺陷漏到运行时的直接原因。

**建议修复**（最小改动，只动 `src/server.js`）：

```js
req.on('end', () => {
  let parsed;
  try {
    parsed = JSON.parse(body || '{}');
  } catch {
    res.statusCode = 400;
    res.end('bad json');
    return;
  }
  const { amount, note } = parsed;
  // ...
});
```

**建议回归测试**：项目无测试基建，Node 22 自带 `node:test`，零依赖可加 `test/server.test.js` —— 起服务后 POST 非法 JSON，断言收到 400 **且**进程仍存活（后续 `GET /entries` 返回 200）。这要求 `server.js` 顺手导出 server 实例并监听可配置端口（`module.exports = server; if (require.main === module) server.listen(3000)`），否则无法在测试里安全起停。

接下来怎么走？

1. **我现在修** —— 按上述方案改 `src/server.js` 并补回归测试；
2. **仅诊断，你自己来** —— 到此为止；
3. **重新设计**（`spec-brainstorm`）—— 本 bug 不属于设计问题，不建议。
