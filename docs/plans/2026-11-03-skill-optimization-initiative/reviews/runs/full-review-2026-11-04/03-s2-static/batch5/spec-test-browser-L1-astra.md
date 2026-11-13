| 维度 | 最终裁决 | 关键证据（file:line + 一句事实） | 一句理由 |
|---|---|---|---|
| B02 | **fail** | `skills/spec-test-browser/scripts/agent-browser-run-context.cjs:440-456` 将恢复引用、修复范围及下一步写入 blocked probe；但 `:803-820` 的 run 内部 probe 失败返回仅保留状态、原因及动作统计，丢弃 `conformance_recovery` 等字段。 | 已存在的结构化恢复事实未穿过 run → caller 输出边界；首次独立 probe 成功不能替代第二次 probe 新产生的恢复证据，属于输出合同不一致。 |
| B05 | **fail** | `skills/spec-test-browser/scripts/agent-browser-run-context.cjs:262-275` 对 producer 设置默认 180 秒总超时，`:278-281` 超时分支仅返回原因；`skills/spec-test-browser/scripts/agent-browser-exact-origin-conformance.cjs:50-83` 每动作可等待 30 秒，`:201-249` 连续执行多个动作后才清理，`:267-269` 在清理结束后才写恢复 receipt。 | 多个慢动作可耗尽外层预算并终止 producer，使其无法执行完 finally、也未留下可达的 session/namespace 恢复记录；这是确定性的失败恢复缺口，不是 runtime 成本问题。 |
| X04 | **fail** | `skills/spec-test-browser/references/pipeline-orchestration.md:17` 明确承诺通过 `conformance_recovery` 定位私有 receipt 并恢复指定隔离会话，`:22` 要求报告私有证据引用及解除 blocker 的方法；`skills/spec-test-browser/scripts/agent-browser-run-context.cjs:812-820` 未将内部 probe 的恢复引用交给 caller。 | caller-owned 职责划分成立，但 conformance 失败分支缺少文档明确要求的恢复交接载荷，正常报告与 spec-debug 移交约定不能补足这一断点。 |

**修复建议（仅建议，未修改源码、未运行测试或浏览器）：**

1. **补齐 run 的失败输出：** 在内部 probe 阻断分支透传有界的 `conformance_status`、`repair_scope`、`next_action` 与 `conformance_recovery`，不外露原始浏览器输出；增加该分支保留恢复引用的合同测试。这一修复同时覆盖 B02 与 X04 的共享根因。
2. **让恢复事实先于浏览器副作用落盘：** 首次启动浏览器前保存 owner-private 的 binary、session、namespace 和恢复位置，并让父进程预先掌握该位置；外层超时分支仍须返回可定位的恢复引用。为内部执行设置总预算并预留 cleanup 时间，补充外层超时下恢复事实仍可达的回归测试；不能只延长外层超时或依赖 finally。
