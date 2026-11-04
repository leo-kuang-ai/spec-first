崩溃现场证据齐了。因果链每一环都有实测证据支撑，Phase 2 结论如下。

## 诊断结果

**根因（完整因果链，全部已实测证实）：**

1. **触发**：`POST /entries` 携带非法 JSON body（复现用 `{"amount": }`）。
2. `src/server.js:8` 把原始 body 文本累积进 `body`。
3. `src/server.js:10` 在请求流的 `'end'` 回调里执行 `JSON.parse(body || '{}')`——`|| '{}'` 只兜住**空 body**，非空的非法 JSON 照样进入 `JSON.parse`，抛出 `SyntaxError`。
4. `'end'` 是由流内部机制**异步**发射的（栈里可见 `endReadableNT` → `process.processTicksAndRejections`），此处没有任何 try/catch、也没有进程级 `uncaughtException` 兜底，异常直接成为 uncaught exception。
5. Node 默认行为：打印栈、终止进程（实测后台任务 exit code 1，`pgrep` 确认进程消失）。
6. **症状**：监听 socket 随进程关闭——崩溃当次请求收到空回复（curl exit 52），之后所有请求 `connection refused`（curl exit 7）。

**复现记录**：合法 POST/GET 均正常 → 发非法 JSON → 进程退出 → 后续 GET 连接被拒，服务端日志留有 `SyntaxError ... at server.js:10:37` 完整栈。

**修复方案**（改动仅 `src/server.js` 一个文件）：在 `'end'` 回调内用 try/catch 包住解析，失败时回 `400 Bad Request` 并 return，进程保持存活。服务无其他 `JSON.parse` 调用点，波及面仅此一处。

**回归测试建议**：仓库目前**零测试**（package.json 无 test script、无测试目录）——这正是此 bug 没被拦住的原因。建议用 Node 内置 `node:test`（零新依赖，符合该仓库风格）起真实 server 发请求：① 非法 JSON POST → 断言 400 且**进程存活**；② 随后 GET /entries → 断言 200，证明服务未崩。

**关联工单/PR**：无（本 fixture 无 remote、无 tracker）。

---

修复意图需要你确认一下：

1. **现在就修** —— 我直接进入 Phase 3：建分支、先写上面那个回归测试（先红后绿）、应用修复、跑验证。
2. **仅诊断，到此为止** —— 你自己接手。

（此 bug 根因清晰、修复局部化，不涉及设计问题，无需 brainstorm。）
