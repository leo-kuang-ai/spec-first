修复完成，保持未提交状态。以下为结构化交付总结：

## Debug Summary
**问题**：`POST /entries` 携带非法 JSON 时服务器进程直接崩溃（curl 得到空回复，随后连接被拒）。

**根因**：完整因果链——
1. 客户端 POST 非法 JSON（如 `{"amount": 1,`）到 `/entries`
2. `req.on('end')` 回调（`src/server.js:9`）执行 `JSON.parse(body || '{}')`，抛出 `SyntaxError`（复现堆栈确认指向 `src/server.js:10:37`）
3. 回调内无 try/catch、请求流上无 'error' 处理器 → 异常成为 uncaught exception
4. Node 默认行为终止进程（实测退出码 1，之后端口连接被拒）

**目标仓库**：当前 fixture 仓库（`skill-up-3125017024`，HEAD `ed0aa90`，分支 `main`）。同根核查：`src/` 内仅此一处 `JSON.parse`；相邻临时目录中其他 fixture 副本存在同样模式，但不在本仓库范围，仅记录移交。

**建议测试**：新增 `test/server.invalid-json.test.js`（Node 内置 `node:test`，零依赖）：子进程拉起真实服务器 → POST 非法 JSON 断言 **400 且进程存活** → 断言后续 GET 仍可用、合法 POST 不受影响。已确认其在基线源码上按根因失败（socket hang up + SyntaxError），在修复后通过。

**修复**：`src/server.js` 单文件 +11/−1 行——`JSON.parse` 纳入 try/catch，解析失败返回 `400 {"error":"invalid JSON"}` 并在改动 `entries` 之前提前返回；合法路径与空请求体行为与修复前完全一致（实测 200）。

**Prevention**：上述回归测试永久覆盖该触发链。

**verification_run_summary_ref**：`.spec-first/workflows/spec-debug/skill-up-3125017024/20261104-invalidjson-crash-final/verification-run-summary.json`

**honest_closeout_verdict**：`verified | all-claims-consistent`（修复前 RED 证据另存于 `.../20261104-invalidjson-crash/logs/pre-fix-red-confirmation.log`，未纳入最终验证集，因判定器无法表达"预期失败"）

**claim_limitations**：`broader-suite` 即全部套件（仓库此前无任何测试，套件目前仅含本回归文件）。

**Confidence**：高（根因有运行时堆栈证实，因果链无未证实环节，修复前后均有真实命令留痕）。

## Post-Fix Quality
**Scope**：fix-owned files only（`src/server.js` + 新增 `test/`；预存未跟踪的 `.claude/` 未触碰）
**Simplify**：跳过——单文件 11 行、单一错误边界新增，无共享/敏感面
**Review**：targeted manual 自审（变更逐行核对：失败路径不改数据、合法路径不变、无临时插桩残留）；spec 系列评审技能在本会话不可用
**Residuals**：无阻塞项。范围外观察一项：请求流中断（客户端中途断开）仍可能产生未处理 'error' 事件，属不同触发器，未捆绑修复
**Re-verification**：尾部无代码编辑，无需重跑
**Commit / Landing**：按你的指示**未提交**——`commit_authorization: 未授予`，`landing_authorization: 未授予`；变更保留为工作区未提交状态（`M src/server.js`、新增 `test/`、`.spec-first/` 验证工件）
