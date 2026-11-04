假设已验证 — 进程在收到无效 JSON 的 POST 后**死亡**。诊断完成，所有证据链闭合。清理测试进程后交付结论（测试进程已随崩溃退出，无残留）。

---

## 诊断结论

**核心事实：服务本身能正常启动。** `node src/server.js` 实测启动成功、正确监听 3000 端口，GET/POST 均正常工作。"无法启动"的体感来自下面三条**都已实测复现**的故障路径，它们会交替出现，让你觉得“怎么修都不行”。

### 路径 1（主因）：服务不是"起不来"，而是"一起来就死"

`src/server.js:10` 的 `JSON.parse(body || '{}')` 没有 try/catch，且位于请求 `end` 事件处理器内。**任何格式非法的 POST body 都会产生未捕获的 `SyntaxError`，直接杀死整个进程。**

我的复现证据：

| 步骤 | 观测结果 |
|---|---|
| 启动服务 | ✅ 正常监听（lsof 确认） |
| `curl -X POST -d 'this is not json'` | curl 退出码 52（服务端空回复） |
| 检查进程 | ❌ **DEAD** |
| 服务日志 | `SyntaxError: Unexpected token 'h' ... at src/server.js:10:37` → 进程退出 |

用户体验就是：启动 → 发一个请求（哪怕 curl 忘了写 JSON）→ 服务无声消失 → 反复"重启失败"。

### 路径 2：`npm start` 是必失败路径

`package.json` **没有 `scripts` 块**。实测 `npm start` → `Missing script: "start"`，退出码 1 — npm 在调起 node 之前就拒绝了。如果你习惯用 `npm start` 启动服务，这一步永远过不去。

### 路径 3：端口被占时以裸崩溃呈现

`src/server.js:25` 的 `server.listen(3000)` 没有注册 `error` 事件处理器。只要 3000 端口被旧实例占用，就直接抛裸的 `EADDRINUSE` 堆栈。我自己测试时就撞上了一次（同机另一个会话的实例短暂占了 3000 端口）— 这证明该故障在真实环境确实会发生。崩溃后的僵尸实例 + 重启 = 看起来"起不来"。

### 三条路径如何串成你的经历

启动服务 → 一个非法 POST 杀死进程（路径 1）→ 换 `npm start` 尝试重启 → `Missing script`（路径 2）→ 偶尔旧实例未退干净 → `EADDRINUSE`（路径 3）→ “试了几次修复都没用”。

### 建议修复（本次仅诊断，未改代码）

1. **`src/server.js:10`** — 用 try/catch 包住 `JSON.parse`，失败时返回 400 而非崩溃（这是核心缺陷）
2. **`package.json`** — 补上 `"scripts": { "start": "node src/server.js" }`
3. **`src/server.js:25`** — 注册 `server.on('error', ...)`，把 `EADDRINUSE` 转成可读的提示

**建议回归测试**：仓库目前完全没有测试。应添加一个测试：POST 无效 JSON → 断言收到 400 **且**进程/服务器仍然存活、后续请求正常。这能同时锁住路径 1 的修复。

---

```
## Debug Summary
**Problem**: 用户报告"服务无法启动"；实测服务可正常启动，但存在三条交替出现的故障路径
**Root Cause**: 
  1. src/server.js:10 — POST body 非法 JSON 时 JSON.parse 未捕获异常导致进程死亡（实测复现）
  2. package.json — 无 scripts 块，npm start 必失败（实测复现）
  3. src/server.js:25 — 无 error 处理器，端口被占时 EADDRINUSE 裸崩溃（实测复现）
**Target Repo / Scenario**: 当前仓库 mini-ledger（单 repo，无 remote/tracker，Phase 1.4 无先例可查；仓库无历史提交）
**Recommended Tests**: 新增 POST invalid-JSON → 400 + 进程存活的回归测试（仓库当前零测试，无测试基础设施）
**Fix**: diagnosis only（用户要求诊断）
**Prevention**: 上述回归测试 + 可选的 server 'error' 事件兜底
**verification_run_summary_ref**: null（diagnosis-only，无 post-fix 验证）
**honest_closeout_verdict**: not-run
**claim_limitations**: diagnosis-only-no-post-fix-verification；路径 1/2/3 均已在本环境实测复现，但用户实际使用的启动命令未确认，三条路径按可能性排序呈现
**Confidence**: High
```

需要我实施这三处修复的话，直接说一声即可。
