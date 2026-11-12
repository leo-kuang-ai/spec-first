# Planning Output Contracts

## Owned

Classify low-risk solo planning output as Direct, Chat brief, or Durable before expensive research or dispatch.

## Not Owned

Product decisions, implementation, repository mutation, or execution authorization.

## Trigger

Read when the output-contract gate in `spec-plan/SKILL.md` selects Direct or Chat brief.

## Fallback

If the classification is uncertain, choose Durable and continue the normal planning workflow.

**Direct** is a one-pass result with no user decision and no risk surface. **Chat brief** allows at most one decision and no risk surface. **Durable** is required for ambiguity, multi-pass verification, user-requested files or plans, pipeline/headless execution, existing-plan continuation, or authentication, payment, migration, and external contracts.

两种聊天分档只结束本次**规划产出**：用简短文字交付，不派子代理、不跑置信检查或文档审查；除非用户要求保存文件，否则不写 `docs/plans/`。`spec-plan` 始终不实施代码。Direct 的“一次陈述并校核”仅核对方案所据的现有事实，不包括改 `src/`、启动服务或运行实现测试。用户已授权“规划后实施”时，授权只免去重复询问；必须先真实进入 `spec-work` 或交回此前已在运行的执行 caller，同一规划会话和可写工具本身不是执行 owner。没有可调用的 `spec-work` 时，须核对当前安装包的 canonical 执行 owner 源文件，或用户明确指定并确认权威的 canonical source；其他宿主的 `.agents/skills/` 等 generated runtime 镜像只说明镜像存在，不能据此宣称已加载源码或进入执行 owner。若仅有此类镜像而无可用执行路径，交付规划结果并明确实施尚未开始、交接阻塞及恢复路径，不得自行承担实现。

**Direct 结果。** 用几句话说明改什么、在哪改，以及实施阶段如何验证。若只请求计划，交付后可选提示 `spec-work` 或由用户自行改动；若同一请求已授权后续实施，结果是交接输入，按上方执行 owner 边界直接交接，不把规划陈述当作整项任务完成。

**Chat brief 结果。** 在聊天中给出改动摘要及原因、含文件与测试预期的实现单元；仅当请求或 brainstorm 摘要已经定下一项实施者必须遵守的选择时列一行决策。仅请求计划时，可选提示保存 brief 或交给 `spec-work`；已授权实施时直接交接。两种聊天分档的结果都可作为 `spec-work` 的会话内输入；不能调用或加载执行 owner 时保留在规划交接阻塞，不因用户说“继续”就由规划产出者自己改码。

## Saving a chat-tier result

A request to save anything this reference cannot produce — another output format, or the full durable-plan floor — is a Durable request whenever it arrives: re-enter the Durable workflow, which owns renderer and artifact rules. Otherwise write the result as a plain Markdown file under `docs/plans/` using the plan filename shape, with frontmatter `title`, `type`, `date`, and `execution: code` for a code deliverable. Reserve the path with exclusive creation; on collision retry with the smallest available numeric suffix before the extension, never overwriting an existing file. Do not set `artifact_contract` or `artifact_readiness`: a saved brief does not carry the unified-plan floor, and labeling it implementation-ready would misinform `spec-work` and `spec-lfg`. `spec-work` treats a saved brief as a legacy plan (no contract field, normal code lifecycle).
