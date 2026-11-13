# Mutation 强制范围与降级声明

本合同供 work、debug、PRD 和审查的副作用说明与 closeout 使用。宿主原生权限、spec-first 的受管机制、配置投射检查和真实宿主执行证据须分别描述；`active`、hook 文件存在、配置生成或单元测试通过都不证明当前会话已强制阻断。

## 当前 source 的覆盖范围

| 宿主 | spec-first 可回源机制 | 限制与缺少运行证据时的声明 |
| --- | --- | --- |
| Claude | `src/cli/claude-settings.js` 注册 PRD PreToolUse 与 Stop，模板在 `templates/claude/hooks/` | PreToolUse 只覆盖 Write/Edit/MultiEdit 和规范 PRD 路径；Bash/外部进程直写不受此预写门保护。Stop 的事后检查不等于预先阻止副作用 |
| Codex | `templates/codex/hooks/hooks.json` 提供 SessionStart | 此受管 hook 不强制 PRD 预写或任意危险命令；相关 workflow 约定为 loud-convention。当前会话原生权限单独核实 |
| Cursor | `src/cli/adapters/cursor.js` 生成 Skill 与指令投射 | 无已确认的同等受管 PRD hook；loader 未验证。不可由投射成功提升为 mutation hard gate |
| Kiro | `src/cli/adapters/kiro.js` 生成 Skill/agent/steering | 无已确认的同等受管 PRD hook；loader 证据不足时显式降级 |
| Qoder | `src/cli/qoder-settings.js` 与 `templates/qoder/hooks/` 提供 PRD hooks | 激活仍为 `qoder_hook_activation_unverified`；即使激活，工具与路径匹配也不是通用 shell 防护 |
| OpenCode | `skills/spec-runtime-setup/scripts/lib/opencode-permissions.cjs` 对 bash/edit/task/webfetch/websearch 投射 `ask`，拒绝宽泛 allow 与危险规则覆盖 | 本地检查证明配置约束；实际阻断取决于原生权限加载、当前配置与授权。没有版本绑定的运行证据时不得宣称所有危险命令被硬拦截 |
| ZCode | `src/cli/adapters/zcode.js` 投射 Skill 与 SessionStart | discovery/SessionStart 证据不证明 PRD 预写或 shell mutation 强制能力 |
| Pi | `src/cli/adapters/pi.js` 复用 Skill，保留原生 trust 激活路径 | trust/discovery 不是逐次写入批准，也不是 PRD 预写门 |

所有宿主均可通过特定 CLI/producer 强制路径、schema、hash、冲突与原子写等确定性约束；这些约束只保护实际经过该入口的操作。不能将它们外推为对其他工具、直接文件写入或外部进程的全局拦截。

## 消费与验证

- 涉及 mutation 强度声明时，记录本次 host/version、实际 primitive、保护的工具与路径、已执行负例、旁路和未验证范围；无证据的部分写 `loud-convention` 或 `not-run`。
- 不因缺少某项 host gate 就重建通用权限引擎。优先使用宿主原生权限，或将高风险操作收敛到已有确定性入口；不可等价时保留明确降级。
- `docs/brainstorms/*-requirements.md` 是 PRD 规范产物路径。非规范名称先按输入/路由处理，不承诺被 PRD hook 保护；finalize 后的修改必须重验，旧 receipt 不能继续证明 ready。
- 适配器、hook、权限策略或宿主版本变化后重评本表。真实 loader/阻断测试缺失时，只能关闭声明不准确的问题，不能关闭真实宿主验证缺口。
