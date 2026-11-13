| 维度 | 最终裁决 | 关键证据（file:line + 一句事实） | 一句理由 |
|---|---|---|---|
| X04 | fail | `skills/spec-rule-miner/SKILL.md:36,57,67`：证据摘要默认不写入规则文件，source refs、限制及刷新验证结果只要求在 preview/closeout 输出；`skills/spec-rule-miner/references/write-targets.md:7-18,41`：默认持久化内容仅为规则块和 pointer，未要求携带 freshness 或失效条件；`docs/methodology/结构化项目角色契约.md:86`：进入 durable knowledge 的经验必须带 invalidation condition。 | 采纳 R1 的核心结论：当前会话取证与刷新约定不能替代跨会话产物自身的有效性边界，R2 引用的图候选回源和限制披露也未补齐规则产物的失效条件；这是静态契约缺口，而非运行效果或覆盖不足。 |

**修复建议：** 在 canonical 规则块内增加简短的“适用与失效边界”，明确“仅适用于所列包范围；代表性源码、配置或包结构变化及出现相反证据时，相关规则须重新核实，未核实前不得作为强制依据”，并保留最小 source refs；同步明确这属于规则有效性边界，不属于禁止的挖掘过程元说明。沿用现有 marker 管理和 `refresh_noop`，不要求仅为更新时间戳重写文件。单加日期或采样范围不能替代失效条件。本次仅完成源码静态核实，未修改文件、未运行 eval。
