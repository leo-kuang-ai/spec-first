# 降级自审与工具环境的有界续作

日期：2026-11-06。类型：请求形状、测试和 dry-run 为对应范围的 confirmed 证据；根因解释与改进假设为 advisory；候选未验收。

## 工具环境诊断

来源为 `verification-feasibility-results/` 下两例原始 `transcript.jsonl`：

- 两例第 15 行 `api-request-shape` 均列出 Agent、Bash、Edit、ListAgents、Read、ReportFindings、ScheduleWakeup、Skill、ToolSearch、Workflow、DeferredToolPlaceholder、Write，没有 Glob/Grep。
- 第 17 行延迟工具列表也没有 Glob/Grep。运行中未发现提供它们的新请求形状。这是请求记录，不是模型自述。
- 两例第 22 行都在首次工具动作前准确识别 shell 仅授权准备命令。caller 的首次目录调用虽早于 skill 边界读取，但不等于没有收到授权限制。
- caller 第 119、124、129、136 行表现为意图使用 Glob、实际连续发出 Bash 占位；第 142 行才识别工具清单没有 Glob/Grep。不能把三次 true 全部描述成“用工具演示道歉”。
- blocked 第 54 行识别首次违规后仍执行 find，说明重复读取禁止语句不足以解释或修复行为。

判定：工具环境与用例所建议的发现工具不一致，但不是不可完成的用例。Read 可读取已知源码，缺少发现工具可显式降级，禁止额外 shell 仍是有效断言。原 FAIL 不翻绿；不改 judge、不添加命令词表、不把模型调用意图当实际工具能力。本轮继续沿用相同环境做单变量比较，结果仅覆盖这一降级环境，不外推为常规工具齐备场景。未来若补工具或修用例文案，需要另开同条件基线，不能与本次分数混计。

## 独立语义复核与最小候选

fresh-source 只读复核确认三个问题：兼容旧行为与新增查询行为矛盾；真实实现的独立测试接缝未充分闭合且容许内联替代；月界验证被豁免却又要求全部场景通过。现有 final-review 和 plan-sections 已覆盖，并被受测模型读取，不认定为缺少专项规则。

候选只在 `skills/spec-plan/references/plan-handoff.md:20` 的一次降级自审出口衔接原有 5.1 语义义务，优先核对实现单元、验证路径与完成条件的一致性，明确结构检查和缺口披露不能替代判断。不加审查轮次，不要求所有盲区阻塞，不要求特定时区或导出方案。

独立 reviewer fresh-read 当前新增句：未发现与单遍限制或合理降级冲突；这只支持表达与合同一致性，不证明行为有效。

## 验证与实验边界

- 修改前当前源码相关三套及隔离 profile 测试合计 4 套 58/58。
- 修改后规划相关三套 50/50；builder `--check`、`git diff --check` 通过；冻结 eval 配置 10 cases 有效。
- 实验根：`/private/tmp/plan-self-review-20261106-_94kb7ic`。
- 冻结包以此前 `plan-feasibility-20261105/candidate/spec-plan` 的 88 文件为基线，仅 handoff 新句不同；evals 逐文件 hash 不变。当前 handoff 去掉该句与历史基线逐字一致。
- 复用上一两例 0 PASS、2 FAIL、0 ERROR 为比较基线；新候选同模型 zhipu/glm-5.3、串行每例一次已启动。不是无变化重跑，不是当前整个工作树的全量行为验证。
- 结果已返回：0 PASS、2 FAIL、0 ERROR，780890 ms、225315 tokens。两例仍有 shell 越界；caller 真实修正一处兼容表述，blocked 更诚实地限制月界证明范围，但 caller 测试数据与 curl 替代路径仍未闭合，并有错误合规声明。已撤回本次单句，完整十例未启动；局部信号不等于可靠改善。详见 [原始结果、归因与撤回](self-review-results-2026-11-06/README.md)。纯表达校验不能作为接受候选的依据。

## Runtime 预检更新

当前源码八宿主 `init -y --dry-run` 退出 0：不变 4971、将更新 24、新增 0，删除/重建操作 241，删除路径 355。用户级 developer profile 为 **preserve/no-op**。这替代此前“本次必定覆写 profile”的旧预估，但不覆盖未来不同参数或候选版本。

未显式传入 user/lang 且 host 集合相同的 preserve 路径由 `src/cli/commands/init-developer.js:50–93` 支持；隔离 profile 单测已通过。仍有 managed hard reset，未执行真实宿主写入。预览涵盖当前工作树其他改动，不能把全部 24 项归给本次 Skill 修订。

另外使用隔离 HOME 与新建临时 git 仓库运行当前 CLI 八宿主 init，退出 0；遍历非符号链接文件发现六份 plan-handoff.md（Claude、Codex、Cursor、Kiro、OpenCode、Qoder），均与当前 source 逐字节一致。未据此声称 Pi/ZCode 独立副本已验证，也不证明任何真实宿主已加载新规则。结果留存于 `/var/folders/0v/f_smd31500113ppkqs66c9yr0000gn/T/plan-projection-isolated-8GeY4p/result.json`，实际用户 HOME 未作为子进程 HOME 使用。

真实 runtime 部署仍需最终候选的最新清单与重要副作用授权。未 commit、push、发布。历史 154/155 与此前失败证据均保留。
