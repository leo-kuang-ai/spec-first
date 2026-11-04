证据链完整,且未改动任何代码。以下为诊断交付。

## Debug Summary

**Problem**:向 `POST /entries` 发送无效 JSON 请求体,服务进程直接崩溃退出(exit code 1),端口停止监听——任何客户端都能用一段乱码字节远程杀死该服务(可用性缺陷/DoS 触发点)。

**Root Cause**(因果链,每一环均有运行时证据):

1. 客户端 POST 非空但格式非法的 JSON 体(如 `{"amount": 5,`)→ 命中路由 `src/server.js:6`;
2. `req.on('data')` 把原始字节累积进 `body`(`src/server.js:8`),`body` 非空,因此 `src/server.js:10` 的 `body || '{}'` 兜底**不生效**——它只覆盖空字符串一种情况(证据:报错信息 `position 13`,说明解析器读到的是真实载荷而非兜底值);
3. 流结束时,`'end'` 监听器回调里裸调用 `JSON.parse(body || '{}')`(`src/server.js:10:37`),抛出 `SyntaxError: Expected double-quoted property name in JSON at position 13`;
4. Node 的 EventEmitter **不会捕获监听器回调中抛出的异常**,异常沿堆栈 `IncomingMessage.emit → endReadableNT → processTicksAndRejections` 逃逸到事件循环(以上三帧均在捕获的堆栈中可见);
5. 该进程没有 try/catch、没有 `process.on('uncaughtException')` 处理器(`'clientError'` 事件也帮不上——它只管 HTTP 协议层错误,不管应用代码异常),于是走 Node 默认策略:**打印堆栈、进程以 exit code 1 退出**;
6. 观测到的症状三连:在途请求无响应(curl 52 empty reply)、端口 3000 失去监听、后台任务退出码 1。

**差分对照**(确认触发归因):同一实例上,`GET /entries` 返回 `[]`、合法 JSON 的 POST 返回 `ok` 且条目持久化(`{"id":1,"amount":5,...}`)——仅无效 JSON 一发致命,崩溃帧精确指向 `JSON.parse` 调用点。

**Target Repo / Scenario**: 当前 fixture 仓库(single commit `b4756cc eval fixture baseline`,无 remote、无 tracker,无历史修复可查);环境 Node v22.22.3、darwin。

**Fix**:诊断 only,未改任何代码。建议的最小修复(供参考,~6 行,位于 `src/server.js:9-13` 的 `'end'` 回调内):用 try/catch 包住 `JSON.parse`,解析失败时返回 `400 Bad Request` 并 `return`,不再继续执行 `entries.push`/`res.end('ok')`。两点附带建议:

- **不要**用 `process.on('uncaughtException')` 兜底作为主修复——Node 官方明确此时进程处于未定义状态,应当退出;正确修法就是在抛出点处理。
- `body || '{}'` 把空请求体静默当作 `{}` 接受,与"格式错误应拒绝"的语义不一致,修复时可一并明确:空体是返回 400 还是视作 `{}`,做一个显式决定。

**Recommended Tests**: fixture 目前零测试,所以没有任何东西拦住它。建议用 Node 22 内置 `node:test` 加一条回归:POST 格式非法 JSON → 断言 (a) 进程仍存活、(b) 响应为 400、(c) 随后合法请求仍正常。注意 `src/server.js` 在 require 时就无条件 `listen(3000)` 且不导出 server,进程内不可测——需以子进程方式测试,或做小型可测性改造(如 `module.exports = server` + `process.env.PORT || 3000`),这属于代码变更,留待授权后实施。

**verification_run_summary_ref**: null(仅诊断,无修复后验证)
**honest_closeout_verdict**: not-run(未运行修复,故无 post-fix 验证)
**claim_limitations**: diagnosis-only-no-post-fix-verification
**Confidence**: High(崩溃堆栈逐帧对应源码行,因果链无未验证环节)

**Prevention**: 上述回归测试 + 修复时在 `'end'` 回调内就地处理解析错误。

另注:仓库工作区与基线一致(仅原有的未跟踪 `.claude/`);我复现用的服务进程已随崩溃退出,端口 3000 现为空闲,原 prepare 留下的实例在我接手前也已自行退出——需要时 `node src/server.js` 即可重启。
