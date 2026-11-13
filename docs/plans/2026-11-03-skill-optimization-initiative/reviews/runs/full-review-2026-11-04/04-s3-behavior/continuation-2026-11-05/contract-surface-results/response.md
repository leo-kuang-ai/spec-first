全部必需参考已按阶段读取完毕。以下为规划交付。

**范围声明（自动继续，依据本轮既有授权）**：为 `GET /entries` 规划一个可选 `month` 查询筛选（`YYYY-MM`、按 UTC、缺省不过滤），仅在现有路由内扩展并同步 README 一行；不涉及其他筛选维度、测试脚手架改造或 POST 行为变更。

**分档与审查状态（如实报告）**：本任务为低风险、单文件、无风险面、仅一项契约决策，按 **Chat brief** 交付——不写计划文件（用户未要求保存，故 `artifact_path: null`）、不运行置信检查与独立文档审查（该分档契约明确跳过，非“审查通过”）。依据均来自本轮直读源码：`src/server.js` 已成功读取。

**关键事实与限制**：`GET /entries` 现用 `req.url === '/entries'` 精确匹配，任何查询串都会落入 404，故必须改为路径名匹配+查询参数解析；条目 `ts` 为创建时服务端写入的 epoch 毫秒，API 不支持回填日期。本轮无派发授权（`dispatch_authorization_missing`，内联分析）；无 Glob/Grep 且 shell 仅限基线准备命令，测试文件与 `docs/plans/`、`docs/solutions/` 目录状态保留为未知（不推断不存在）；外部研究跳过（本地证据充分）。基线准备命令已运行一次，除此之外未执行任何命令、未写入任何文件、未派发子代理。

```json
{
  "plan": {
    "summary": "为 GET /entries 增加可选 month 查询参数（格式 YYYY-MM，按条目 ts 的 UTC 年月过滤）。核心前置：现有路由对 req.url 做精确字符串匹配，带任何查询串都会 404，因此需改为按路径名匹配并解析查询参数；无参数时行为保持不变（向后兼容的 additive 变更）。分档 Chat brief，不落盘。",
    "source_refs": ["src/server.js", "README.md", "package.json"],
    "changes": [
      "src/server.js：GET /entries 路由由 req.url 精确匹配改为路径名匹配并解析查询串（消除查询串即 404 的现状）",
      "src/server.js：新增可选 month 参数，校验为 4 位年份-01..12 合法月份；非法格式返回 400（沿用现有简短纯文本响应风格），未知其他查询参数忽略",
      "src/server.js：按条目创建时服务端写入的 ts（epoch 毫秒）对应 UTC 年-月过滤，仅返回匹配条目；无 month 参数返回全部",
      "README.md：为 GET /entries 增补一行可选参数说明（README 是该端点唯一契约文档）",
      "兼容性说明：此前 /entries?任意查询串 一律 404，改动后按路径返回 200——属纠正性变化，证据中无已知外部消费者"
    ],
    "verification_scenarios": [
      "回归：无参数 GET /entries 返回全部条目，行为与现状一致",
      "先 POST 若干条目，再 GET /entries?month=<当前UTC年月>：仅返回本月条目，状态 200",
      "GET /entries?month=2000-01（确定无数据的月份）：返回 []，状态 200",
      "非法格式（2026-13 / abc / 2026-1）：返回 400",
      "带无关查询参数（?foo=1）：不再 404，按无 month 处理返回全部",
      "已知验证缺口：ts 由服务端写入且 API 无法回填历史日期，故『历史月份含数据』与『月边界精确性』无法仅经公开接口构造；覆盖它需先抽取纯过滤辅助函数并导出模块（当前 require 即监听、无导出），列为后续工作不纳入本次范围"
    ],
    "artifact_path": null
  },
  "handoff": {
    "status": "blocked",
    "owner": "spec-work",
    "reason": "本轮授权仅覆盖规划产出：用户明确不授权搜索、加载或调用执行 owner（spec-work），不创建原生 goal，也不派发子代理；且无已运行的执行 caller 可交回。这是授权限制，不是宿主能力缺失——宿主存在技能调用原语（本轮已用于加载 spec-plan），解除限制后即可交接。Chat brief 可作为 spec-work 的会话内输入。",
    "next_action": "由用户在后续轮次授权实施：直接调用 /spec-work 并以本 brief 为输入（或先要求将本 brief 保存为 docs/plans/ 下的 Markdown 再作为 legacy plan 输入），届时由 spec-work 修改 src/server.js 并运行上述验证场景；任务 commit/push/PR 仍需届时另行授权"
  },
  "implementation_started": false
}
```

**决策（Chat brief 唯一决策行）**：`month` 语义 = `YYYY-MM`、按 UTC 匹配、非法返回 400、缺省不过滤（基于源码事实的工程默认，非用户确认的产品决策，实施者可按此执行）。**范围外/后续**：可测性重构（导出 server + 抽取过滤 helper）、其他筛选维度与汇总视图、POST 查询串行为。
