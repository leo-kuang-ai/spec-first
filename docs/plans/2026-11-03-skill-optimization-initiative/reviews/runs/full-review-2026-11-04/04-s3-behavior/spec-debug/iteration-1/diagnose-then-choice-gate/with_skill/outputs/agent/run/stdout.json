复现完成、因果链闭合（那条 exit 144 是我主动 `pkill` 对照进程产生的，非崩溃）。以下是诊断结论。

---

## 诊断结果

### 根因（完整因果链，每环有证据）

1. **触发**：向 `POST /entries` 发送畸形 JSON body（复现载荷：`{"amount": 12.`）。
2. `src/server.js:8` 的 `'data'` 监听把原始字节累积进 `body` 字符串——到这里状态仍正常。
3. **缺陷点 `src/server.js:10`**：`'end'` 回调执行 `JSON.parse(body || '{}')` 抛出 `SyntaxError: Unterminated fractional number`。`body || '{}'` 只防了**空** body，防不了**畸形** JSON。
4. **为什么会杀掉整个进程**（关键一环）：这个 throw 发生在 EventEmitter 回调里。`http.createServer` 的请求处理函数（`src/server.js:5-23`）注册完监听器后就已同步返回，`'end'` 回调是稍后由事件循环直接调用的——它不在任何 try/catch 的作用域内，异常一路冒到事件循环，成为 `uncaughtException`。
5. 进程没有注册 `process.on('uncaughtException')` 处理器 → Node 默认行为：打印堆栈并以非零码退出（后台任务确认 **exit code 1**，堆栈精确指向 `server.js:10:37` → `IncomingMessage` 'end' 回调 → `processTicksAndRejections`）。
6. 监听 socket 随进程消亡 → **后续所有请求 ECONNREFUSED**（复现确认 curl exit 7）。

**对照实验**（排除“任何 POST 都崩”的替代假设）：同一服务，POST 合法 JSON → `ok`，随后 GET 正常返回、进程存活。确认只有畸形 JSON 触发此链。

### 建议修复（如果你要修）

只改 `src/server.js` 一个文件：把 `src/server.js:10-12` 的解析和写入包进 try/catch，parse 失败时返回 `400` + 错误信息，不再让异常逃逸。这等价于 Express `express.json()` 的行为（解析失败回 400 而不是崩进程）。**不建议**用 `process.on('uncaughtException')` 兜底——那会留下状态未知的僵尸进程，是症状修补不是根因修复。

### 回归测试建议

仓库目前**零测试、零提交**，所以没有任何东西拦住它。建议用 Node 22 内置 `node:test`（不加任何依赖）新建 `test/server.test.js`：
- **原始复现用例**：POST 畸形 JSON → 断言收到 HTTP 400，且**之后** GET `/entries` 仍能响应（守护“进程不崩”这个契约）
- POST 空 body → 200；POST 合法 JSON → 200；GET 列表正常

### 复现备注

端口 3000 被你机器上另一个进程（PID 68796）占用，我没有动它；复现用的是 `src/server.js` 的逐字节副本、仅端口换成 3179（diff 已确认仅一行端口差异）。

---

你只说了“帮我查”，所以到此为止没有改任何代码。接下来：

1. **现在就修** —— 我按上述方案改 `src/server.js` 并补回归测试、跑验证
2. **只要诊断** —— 到此结束，你自己接手

选哪个？
