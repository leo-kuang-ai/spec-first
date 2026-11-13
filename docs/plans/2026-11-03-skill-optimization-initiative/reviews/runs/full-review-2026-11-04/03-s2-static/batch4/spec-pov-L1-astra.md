| 维度 | 最终裁决 | 关键证据（file:line + 一句事实） | 一句理由 |
|---|---|---|---|
| B03 | fail | `skills/spec-pov/references/grounding.md:25,31`：研究 brief 携带问题、候选集及用户链接，external researcher 指引同时适用于 inline 与委派路径；`skills/spec-pov/references/agents/external-evidence-researcher.md:7-20`：要求搜索/抓取并围绕具体问题取证，但未约束外发内容；`skills/spec-pov/references/agents/pov-peer.md:12-15`：公开主题词及敏感信息禁发规则仅明确写在 peer 指引中；`skills/spec-pov/SKILL.md:53`、`skills/spec-pov/references/cross-model-panel.md:11`：面板外发门属于按需加载的 peer 分支。 | R2 的缺口成立：dispatch 授权不等于搜索 payload 的外发授权，peer 分支的最小化规则未覆盖常规外部研究路径；这是可定位的静态边界缺失，并非已发生泄露的运行结论。 |

**修复建议：** 在 `skills/spec-pov/references/agents/external-evidence-researcher.md` 的 Precondition 中补齐统一外发规则：搜索词及抓取请求只携带必要的公开主题信息，不发送仓库片段、私有路径、内部标识、凭证或 secrets，并检查用户链接是否包含敏感参数；无法在该边界内核实的证据标记为 unavailable，不自行扩大外发范围。`grounding.md:31` 已要求 inline 与委派路径共同加载该文件，无需新增机制或修改 generated runtime。此次仅核实当前 worktree 的源码，未修改文件、未运行测试或行为 eval；全局 `/Users/kuang/.codex/AGENTS.md` 因读取权限未获批准而未核对。
