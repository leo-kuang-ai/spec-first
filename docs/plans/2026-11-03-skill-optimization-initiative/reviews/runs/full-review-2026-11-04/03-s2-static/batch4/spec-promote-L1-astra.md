| 维度 | 最终裁决 | 关键证据（file:line + 一句事实） | 一句理由 |
|---|---|---|---|
| D03 | fail | `skills/spec-promote/scripts/check-spiral-auth.cjs:50-54`：成功分支先以 `authenticated === true \|\| status === 'authenticated'` 返回 ready，再检查显式 `authenticated === false`。 | 对 `{"authenticated":false,"status":"authenticated"}`，脚本确定性输出 `ready` 与 `authenticated: true`；这不是验证强度不足，而是把矛盾输入提升为确定事实，R2 的 F1 成立。 |
| B02 | fail | `skills/spec-promote/references/spiral-cli.md:13-16` 承诺按认证合同输出 readiness；`skills/spec-promote/scripts/check-spiral-auth.cjs:50-58` 却允许成功标记覆盖显式否定或 pending 标记。 | reference 与实现的认证事实边界不一致；独立外发授权门仍然存在，但不能消除 readiness 合同本身的错误，R2 的 F1 成立。 |
| B03 | pass | `skills/spec-promote/SKILL.md:78,83` 明确逐次外发授权、失败回执及原始输出禁入聊天、日志和持久化产物；`skills/spec-promote/references/spiral-cli.md:3,71,103,144` 另有调用包装、持久化披露和字段排除要求。 | 静态保密与授权承诺存在且可一致执行；`:73-75` 的命令语法示例没有要求未经捕获直接回显，不能仅凭未提供专用生成 helper，推定合同必然要求泄露原始输出，R2 的 F2 不足以判 fail。 |
| B05 | pass | `skills/spec-promote/SKILL.md:68,83` 要求 provider 失败或超时不阻塞交付，并定义逐渠道 fallback 与 unknown 回执；`skills/spec-promote/references/spiral-cli.md:139-144` 明确将 hangs 纳入 fallback。 | 恢复承诺存在、可定位，且没有无限等待或禁止取消的相反指令；缺少生成调用的具体 timeout／终止方式是落实细节缺口，不足以单独推翻本轮静态合同，R2 的 F3 不成立为该层 fail。 |

**修复建议：** D03、B02 共用一个根因，只修 `check-spiral-auth.cjs` 的认证分类：先识别已知认证信号间的冲突，冲突时返回 `unverified`、`authenticated: null` 和固定 reason code，再处理一致或单一有效信号；保留原始 stdout/stderr 隔离。同步补充 `authenticated: false + status: authenticated`、`authenticated: true + status: pending` 的负例，并保留现有脱敏断言。以上为当前 worktree 的只读源码裁决；未修改文件、未运行测试或真实 provider；全局 `/Users/kuang/.codex/AGENTS.md` 未获读取许可。
