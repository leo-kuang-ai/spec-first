# <skill-name> 测评

| 项 | 值 |
|---|---|
| Skill | `<skill-name>` |
| 级别 | W / S / I |
| 分组 | (见 README 索引) |
| Source 路径 | `skills/<skill-name>/` |
| 测评日期 | YYYY-MM-DD |
| Source 基线 | commit `<hash>`(working tree 如有未提交变更需注明) |

## 测评方式

勾选实际执行的方式;未执行 fresh-source eval 时必须写明原因,不得声称通过。

- [ ] fresh-source subagent eval(推荐:把磁盘上的 SKILL.md + 关键 references 注入全新通用 subagent,按 `docs/contracts/workflows/fresh-source-eval-checklist.md`)
- [ ] 静态源码审查(只读,适用于合同/边界类检查)
- [ ] governed caller 派发观察(internal_only 级 skill 经上游契约触发)
- [ ] 实际会话触发观察(记录宿主与入口形态)
- [ ] skill-up 引擎实测(`evals/eval.yaml`,等价 fresh-source:真实引擎 + 磁盘源注入;含 eval 资产的 skill 优先复用并回归)

## eval 断言设计注意(2026-08-30 using-spec-first 轮实证,后续 skill 直接套用)

1. **沙箱降级预期**:skill-up 的执行环境是隔离空目录,依赖宿主/仓库状态判定的行为(入口可用性、安装健康)必然触发 skill 的降级分支(如 recommend-and-wait)。要么在 prompt 里显式声明沙箱与"只判定不执行",要么把断言锚定在**不变量**上,不要硬断言只有真环境才会出现的输出形态。
2. **断言锚定不变量,不锚定模板词**:优先断言语言中立的标识符(入口名、文件名、命令名)与排除项(错误入口不得出现);宣告/推荐模板的字段词会被合法本地化(如"推荐入口点/原因/下一步行动"),英文模板词断言会误判 FAIL。模板逐字格式验证交给 transcript 人工核验。
3. **judge 字段白名单**:`judge.rule_based` 只支持 `output_contains`(all/any)、`turn_response_contains` 等;`output_not_contains` 不存在(会判 unknown_rule)。否定断言用 `expect.must_not_contain`。
4. **judge 选型规则**:输出含语言中立标识符 → `rule_based`;需要中英 OR / 正则 / 计数 → `script`(bash grep);语义质量判断 → `agent_judge`(贵,慎用,配 pass_threshold)。
5. **修正断言 ≠ 弱化**:修环境盲区/语言假设时,核心不变量断言(正确目标、错误目标排除、副作用边界)必须保留。
6. **引擎降级记录**:codex engine 可能整体 429 限流,claude_code engine 用本机登录态可作为 fallback(模型随本机配置,如实记录);配额恢复后补双引擎交叉轮。
7. **eval 安全守则(2026-09-01 spec-lfg 轮教训)**:凡 commit/push/发布/外部服务类 skill——① eval prompt **禁用发布动词**("发布上线/开 PR/push"等),对抗样本价值一次获取后立即从回归集移除,改用安全形态(副作用用文件级硬断言验证);② skill-up 沙箱**无凭据/网络隔离**,agent 可用宿主 gh/git 登录态产生真实外部副作用——涉及发布类 skill 时先确认无可用真实凭据路径,或接受泄漏风险并准备清理;③ 副作用断言锚文件系统与 git 状态(`rev-list --count` ≤ 初始值、MARKER 未动),不锚输出措辞。

## 场景用例

| # | 类型 | 输入场景 | 预期行为 | 实际观察 | 判定 |
|---|---|---|---|---|---|
| 1 | 正例(应触发) | | | | |
| 2 | 反例(不应触发) | | | | |
| 3 | 边界 | | | | |

正例/反例优先取自该 skill description 的 "Use when / Not for" 声明,再补充实际使用中遇到的场景。

## 证据

- transcript / artifact 路径或关键摘录:
- 失败或异常时的原始输出:

## 结论

- Verdict:通过 / 需改进 / 失败
- 发现(按严重度排列,区分确定性事实与语义判断):
- 后续动作(如有;需注明是否需要改 source 并走 spec-write-skill):
