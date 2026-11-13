规划完成。Direct 分档（单文件、零用户决策、无风险面）：不写计划文件、不派子代理、不跑置信检查与文档审查；调研为 inline（记录 `dispatch_authorization_missing`），外部研究无必要（Node 原生 http、无依赖、无显式请求）。依据已核对：`src/server.js` 全文（准备命令后成功读取）、`README.md`、`package.json`（无 test 脚本；测试文件与 `docs/plans/` 等目录状态未知，不推断不存在）。本轮未改任何实现代码、未启动服务、未创建 goal、未调用执行 owner——实施未开始。

```json
{
  "plan": {
    "summary": "在 src/server.js（全 26 行已读；辅证 README.md、package.json——零依赖、无 test 脚本）为 GET /entries 增加可选 month=YYYY-MM 查询筛选。前置缺陷必须先修：当前 GET 分支为 req.url === '/entries' 精确匹配（src/server.js:16），带查询串会直接落入 404（src/server.js:21-22），需改为 URL 解析后按 pathname 匹配；再按条目 ts（Date.now() 毫秒，src/server.js:11）的 UTC 自然月闭开区间过滤。无参数时行为与现状完全一致，非法格式返回 400，POST 分支不动。Lightweight 深度、Direct 分档、单实施单元，未写计划文件。",
    "source_refs": ["src/server.js"],
    "changes": [
      "U1 路由修复：GET 分支由 req.url === '/entries' 精确匹配改为 URL 解析（new URL(req.url, 'http://localhost')）后按 pathname === '/entries' 匹配，使查询串不再 404",
      "U1 参数读取：url.searchParams.get('month')，缺省时返回全部条目（向后兼容，响应仍为 JSON 数组且顺序不变）",
      "U1 格式校验（规划层 HOW 决策）：month 约定 YYYY-MM，用 /^\\d{4}-(0[1-9]|1[0-2])$/ 校验，非法值返回 400 与简短错误信息",
      "U1 过滤逻辑：月起点 Date.UTC(y, m-1, 1)、终点 Date.UTC(y, m, 1)（12 月自动进位到次年 1 月），保留 ts >= start && ts < end 的条目并维持写入顺序（UTC 基准，确定性可测）",
      "范围边界：POST /entries 分支（src/server.js:6-15）不改动；统一其 pathname 匹配列为非目标（反扩张，按需另行跟进）"
    ],
    "verification_scenarios": [
      "GET /entries 无参数：200 且返回全部条目，与改动前完全一致（向后兼容回归）",
      "GET /entries?month=<当月 YYYY-MM>：200 且仅含该月条目，顺序与写入顺序一致",
      "GET /entries?month=<无条目月份>：200 且返回 []",
      "跨月隔离：写入相邻两个月条目后，各自 month 只返回对应月份条目",
      "边界语义：ts 恰为当月首日 00:00:00 UTC 的条目包含在内，恰为下月首日 00:00:00 UTC 的条目排除（闭开区间）",
      "非法 month（2026-13、2026-1、20261、abc）：400",
      "POST /entries 不受影响：仍写入并返回 ok；GET /entries?month=… 不再 404",
      "验证途径说明：package.json 无 test 脚本且测试文件状态未知（本轮无目录枚举能力，保留未知），实施阶段由执行 owner 按 repo 约定选择测试或临时脚本 + HTTP 请求验证（注意 server.listen(3000) 固定端口）；本轮不启动服务、不运行实现测试"
    ],
    "artifact_path": null
  },
  "handoff": {
    "status": "blocked",
    "owner": "spec-work",
    "reason": "本轮仅授权规划产出：没有已运行的执行 caller，且用户明确不授权搜索、加载或调用执行 owner（spec-work），不创建原生 goal；shell 仅授权基线准备命令 node prepare-eval.cjs（已按要求运行一次），不得启动服务或运行实现验证，也不得派发子代理。此为授权限制，不表示宿主不具备相应能力。",
    "next_action": "下一轮由用户授权实施并实际进入 spec-work（例如调用 /spec-work），以本 JSON 的 plan 作为会话内输入（Direct 分档，无计划文件），按 changes 完成 src/server.js 修改并运行 verification_scenarios 1-7 的验证；如需持久化计划文件（docs/plans/ Markdown）或盘点测试文件，请先解除相应写入/枚举限制。"
  },
  "implementation_started": false
}
```

补充状态：本 Direct 结果未经独立文档审查（聊天分档不运行该流程，非跳过审查后冒称已审）；计划随时可作为 `spec-work` 的会话内输入使用，实施未开始。
