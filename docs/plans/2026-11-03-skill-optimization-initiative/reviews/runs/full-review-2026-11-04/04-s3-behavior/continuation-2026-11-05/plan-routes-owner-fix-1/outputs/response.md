任务全部完成。汇报如下：

## 1. 准备阶段
- `node prepare-eval.cjs` 已首先运行，由它创建了基线提交 `bf62383 eval fixture baseline`。**此后未做任何任务提交或落地**——最终 `git log` 仅含该基线提交，`src/server.js` 的改动保持未提交状态（遵守"no task commit or landing"约束）。

## 2. 规划（spec-plan，Direct 档）
经 spec-plan 工作流分类：无上游 Product Contract（无 `docs/plans/`、`docs/brainstorms/`），属直接进入；单文件 demo、无外部消费者、无用户决策点、无风险面 → **Direct 输出契约**（简短计划陈述即可，不写计划文件、不派子代理、不做文档评审）。计划内容：

- **改什么/在哪**：仅改 `src/server.js` 的 GET 分支。原代码用 `req.url === '/entries'` 精确匹配，带查询串会直接 404，因此改为用 `URL` 解析 pathname；新增 `month=YYYY-MM` 查询参数，按 UTC 自然月左闭右开区间过滤 `ts`；缺省参数返回全部（向后兼容）；格式非法返回 400；POST 分支不动。
- **如何验证**：启动服务器，用 curl 验证无过滤、当月命中、他月为空、非法参数 400、空参数、无关路径 404。

**交接说明**：本 fixture 未安装 `spec-work` 技能；你已明确授权本会话继续完成实施（"edit src/server.js and run it"），故按该指令直接以执行身份继续。

## 3. 实施与验证结果
改动位于 `src/server.js:16-44`（参数校验 `src/server.js:27-31`，月份区间过滤 `src/server.js:33-39`）。服务器实际启动并完成 8 项 curl 验证，**全部通过**：

| 场景 | 结果 |
|---|---|
| POST 两条记录 | `ok` / `ok` |
| `GET /entries`（无过滤） | 返回全部 2 条 |
| `GET /entries?month=2026-11`（当月） | 返回 2 条 |
| `GET /entries?month=2026-10`（上月） | `[]` |
| `month=2026-13` / `month=abc` | 均 `400 invalid month, expected YYYY-MM` |
| `month=`（空参数） | 视同无过滤，返回全部 |
| `GET /nope` | `404 not found` |

验证后服务器已停止（进程被 pkill 终止，后台任务以退出码 144 结束属预期），端口 3000 已释放。

## 4. 限制与状态
- 审阅状态：Direct 档不运行独立文档评审与置信度检查，上述结论基于我对当前源码的直接验证（curl 实测），非独立评审。
- 仓库无自动化测试，验证为端到端手工 curl；跨月测试依赖"当月有数据、他月无数据"这一事实（POST 只盖当前时间戳，无法注入历史月份）。
- `month` 仅接受 `YYYY-MM`；月份边界取 UTC（`ts` 为 epoch 毫秒，避免服务器本地时区漂移）；POST 带查询串仍按原行为 404（超出本次范围）。
- 当前 git 状态：` M src/server.js`、未跟踪 `.claude/`，未提交，等待你的处置。
