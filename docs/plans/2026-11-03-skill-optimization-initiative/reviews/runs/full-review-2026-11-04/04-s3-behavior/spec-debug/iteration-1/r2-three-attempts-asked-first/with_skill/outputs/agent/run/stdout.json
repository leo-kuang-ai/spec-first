端口已释放（`pgrep` 匹配到的是本机另一个无关进程，非本次测试残留）。诊断完成，证据链闭合。

---

## 诊断结论

**服务本身没有坏——`node src/server.js` 在本机可以正常启动并服务**（`GET /entries` 返回 200 和 `[]`）。问题出在**启动路径**上：这个仓库存在一个真正的缺陷加两个复合缺陷，恰好构成了三类必然失败的启动方式。

### 完整失败模式地图（全部直接复现验证）

| 启动方式 | 结果 | 实际报错 |
|---|---|---|
| `node src/server.js`（仓库根目录） | ✅ 成功，但**终端零输出** | 无（1 秒内输出 0 字节） |
| `node .`（走 `main` 字段） | ✅ 成功，HTTP 200 | 无 |
| `npm start` / `npm run start` / `npm run dev` | ❌ 失败 | `npm error Missing script: "start"`，退出码 1 |
| `node server.js`（在仓库根目录执行，路径错） | ❌ 失败 | `Cannot find module '.../server.js'` |
| 端口 3000 被任何进程占用时启动 | ❌ 崩溃 | `Error: listen EADDRINUSE: address already in use :::3000`，退出码 1 |

### 因果链（file:line）

1. **主根因——`package.json` 没有 `scripts` 字段**（整个文件只有 `name`/`version`/`private`/`main` 四行）。任何 npm 系启动方式（`npm start`、`npm run dev`…）都必然以 `Missing script` 失败。README 也没有写任何启动命令，用户只能猜。
2. **复合缺陷 A——静默启动**：`src/server.js:25` 是 `server.listen(3000)`，无回调、无日志。即使成功启动，终端也一片寂静——很容易被误判为“没启动”，于是 Ctrl+C 换下一种方式。
3. **复合缺陷 B——无错误处理**：server 没有监听 `'error'` 事件。一旦端口被占（典型场景：上一次“静默启动”的实例其实还活着），进程直接以未捕获异常崩溃，吐出原始堆栈而非可读的提示。

一个高度可能的完整故事：你某次尝试**其实启动成功了**（静默无输出）→ 以为失败 → 换 `npm start` 撞上 `Missing script` → 再试时撞上残留实例导致的 `EADDRINUSE`。三种方式三种报错，但服务代码本身从头到尾是好的。

### 修复建议（共 3 行改动，尚未实施）

1. `package.json` 加 `"scripts": { "start": "node src/server.js" }` —— 消除主根因；
2. `src/server.js:25` 改为 `server.listen(3000, () => console.log('listening on http://localhost:3000'))` —— 启动有反馈；
3. 可选：加 `server.on('error', ...)` 把 `EADDRINUSE` 转成一句友好提示。

```
## Debug Summary
**Problem**: MiniLedger 服务"无法启动"，用户三次尝试均失败
**Root Cause**: package.json 缺少 scripts 字段导致所有 npm 启动方式失败（主根因）；src/server.js:25 静默启动无输出导致成功启动被误判（复合 A）；无 server 'error' 处理导致端口冲突以未捕获异常崩溃（复合 B）
**Target Repo / Scenario**: 当前 mini-ledger 仓库（无提交历史、无远程、无 tracker，Phase 1.4 无先前工作可查）
**Recommended Tests**: `npm start` 后 `curl -s localhost:3000/entries` 应返回 `[]`；占用 3000 端口后再启动应输出可读错误而非堆栈
**Fix**: diagnosis only（未改动任何文件）
**Prevention**: 上述 3 行修复；README 补启动命令
**verification_run_summary_ref**: null（诊断运行，无修复后验证）
**honest_closeout_verdict**: not-run（diagnosis-only）
**claim_limitations**: 用户的三次具体尝试内容未知；诊断基于对全部 7 种启动路径的直接复现，三类失败模式均有实证，但"用户实际命中哪一类"待确认
**Confidence**: High（失败模式地图）；Medium（用户具体命中的组合）
```

如果你把当时看到的具体报错贴给我（或直接说“修吧”），我可以立即落实那 3 行修复并验证 `npm start` 全链路。
