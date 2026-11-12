Phase 5.4（pipeline 模式）：跳过交互菜单，立即将控制权返回 caller。

**审查状态（降级出口）**：仅完成 producer 自审，独立审查未运行（`review_source: producer-self-review`，`review_status: degraded`，`reason_code: dispatch_authorization_missing`，能力未探测）。自审应用 2 处唯一确定修正（补 H2 分隔线；计划级补 U2 验证方式），修正后已知剩余 findings 为 0，独立审查覆盖范围未知（不作零报告）。限制：无目录枚举工具（`docs/plans/` 既有序号、测试文件状态未知）；shell 仅授权基线命令，Node 版本与 git 状态未核实；无宿主 Plan Mode 写入保证，规划边界为本工作流约定。本轮除授权的基线准备命令外仅写入 `docs/plans/` 产物，未改实现代码、未运行实现测试、未启动服务。

```json
{
  "plan": {
    "summary": "为 GET /entries 增加可选 month=YYYY-MM 查询参数：将 src/server.js 的 req.url 精确匹配改为路径+查询串解析（现状下带查询串直接 404），合法月份按条目 ts 的 UTC 归属过滤，非法值返回 400 纯文本，无参数与未知参数行为不变；同步更新 README；零新增依赖。",
    "source_refs": ["src/server.js", "package.json", "README.md"],
    "changes": [
      "src/server.js GET 分支：用 Node 内建 URL 解析 req.url，按 pathname 判断 /entries，替代精确匹配",
      "新增可选 month 参数校验（格式 ^\\d{4}-(0[1-9]|1[0-2])$），非法值（含空串、未补零、月份越界）返回 400 纯文本",
      "按条目 ts 的 UTC YYYY-MM 前缀归属过滤；无 month 返回全量，未知查询参数忽略",
      "src/server.js 末尾新增 CommonJS 导出（server 句柄与 entries 引用）作为最小测试出口，不引入测试框架",
      "README.md 在 GET /entries 说明处补一行 month 参数与 400 行为"
    ],
    "verification_scenarios": [
      "播种 2026-01 与 2026-02 各至少 1 条（Date.UTC 时间戳）后，GET /entries?month=2026-01 仅返回 1 月条目",
      "无参数 GET /entries 返回全部条目且顺序不变；带未知参数 ?foo=1 返回全量（向后兼容）",
      "month=2026-13、month=2026-1、month=abc、month=（空串）各返回 400",
      "目标月份无条目时返回 200 与 []",
      "边界：ts 为该月第 1 毫秒与最后 1 毫秒的条目被包含，上月最后 1 毫秒被排除（UTC 归属）",
      "POST /entries（无查询串）行为不变",
      "README 描述与实现行为一致（实现后人工核对）"
    ],
    "artifact_path": "docs/plans/2026-11-07-001-feat-entries-month-filter-plan.md"
  },
  "handoff": {
    "status": "returned-to-caller",
    "owner": "caller",
    "reason": "规划子任务完成：Durable Markdown 计划已写入 docs/plans/（artifact_contract: spec-unified-plan/v1，artifact_readiness: implementation-ready，execution: code，status: active）。审查状态为降级：caller 禁止派发子代理与独立文档审查，5.3.8 按显式降级出口仅完成 producer 自审（independent_review: not_run，应用 2 处修正，已知剩余 findings 0，独立覆盖未知）。限制：无枚举工具，目录与测试文件状态保留未知；Node 版本与 git 状态未核实（shell 仅授权基线命令）；无宿主 Plan Mode 写入保证。实施与验证归 caller，implementation_started=false。",
    "next_action": "caller 以执行 owner 身份接手：先确认或改写计划中 A1（month 参数名/格式/400 语义）与 A2（UTC 月份归属）两项假设并同步对应 KTD，再按 U1→U2 顺序实施 src/server.js 与 README 改动，并运行 Verification Contract 中的零依赖验证场景（node --test 或 node+assert 脚本）；验证通过后按 Definition of Done 收尾。"
  },
  "implementation_started": false
}
```
