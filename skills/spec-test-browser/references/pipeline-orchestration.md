# Pipeline-Mode Browser Orchestration

仅当 `spec-test-browser` 被 `spec-lfg` 或其他 automated caller 以 `mode:pipeline` 调用时读取。Pipeline 无人值守，但不代表拥有项目 mutation、project command 或 browser effect 授权。

## Exact Origin And Caller-Owned Server

- Browser applicable 时必须提供一个 explicit exact loopback `target-origin:<origin>`。缺失时返回 `not_run` / `target-origin-missing`；非法值返回 `not_run` / `target-origin-invalid`。
- 不读 runtime profile，不解析 package script、cwd 或 env，不做 reachability preflight、free-port scan、origin 改写或 server 启动。caller-owned server 在运行前后都保持 caller-owned，不被 wrapper 信号、关闭或清理。
- 先调用 `node "$SKILL_DIR/scripts/agent-browser-run-context.cjs" probe`。Probe 为当前 binary identity 现场运行独立的 controlled conformance producer，不读取外部 receipt；只有返回 `execution_readiness: ready`、`conformance_status: passed` 且 `capabilities.exact_origin_confirmed: true` 才能执行。缺少参数、只有 help marker、provider/caller 自报、identity 无法绑定、producer 异常/超时/畸形输出、正向控制失败或任一负向场景失败都返回 `not_supported`，navigation/interaction subprocess 为 0。static/provider evidence 不等于 conformance，capability probe 也不等于本次 browser field outcome。

## Effect Gate And Browser Execution

- 不暂停等待 headed/headless、人工验证或 failure-handling prompt。OAuth、email、payment、SMS 等人工 flow 记录为 `Skip` 及 limitation。
- 对删除、发布、发送、购买、权限变更或其他 durable/external effect，包括通过 `open` 或 keyboard action 可触发的 effect，返回 `not_run` / `browser-mutation-authorization-required`，不将该 step 写入 test plan。这是 workflow-level semantic gate，不声称 wrapper 能从 action 字符串确定业务 effect。
- 仅通过唯一 wrapper 执行 prepare/run/cleanup。首个 `open` 是 availability evidence；任何 page-context action 不得位于它之前，其失败后不运行后续 action。
- wrapper 或 browser cleanup 的 `not_supported`、`not_run`、`failed`、missing 或 indeterminate 均是该 applicable 流程的 blocker；不得让 passed route/step 覆盖 cleanup failure，也不得因此将流程改写为 `not_applicable`。

## Claim Ceiling

输出 target-origin provenance、wrapper probe/capability、route/step 结果、`action_process_calls`、browser cleanup、private evidence refs 和 limitations。证据最高只支持在 caller-authorized exact origin 上的观察，不证明 server 对应当前 branch、由 spec-first 启动或被 spec-first 清理。
