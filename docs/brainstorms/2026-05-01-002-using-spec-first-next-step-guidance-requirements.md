---
date: 2026-05-01
topic: using-spec-first-next-step-guidance
spec_id: 2026-05-01-002-using-spec-first-next-step-guidance
---

# Using Spec First Next Step Guidance

## Problem Frame

`spec-first` 的公开 workflow 数量已经足够多，新手用户经常不会先说 `spec-plan`、`spec-work` 或 `spec-debug`，而是直接描述一个任务，或者在关键节点问“下一步该执行哪个命令”。现有 `using-spec-first` 已经是 workflow routing policy 的 source of truth，但正文主要服务 agent 在 substantial work 前做入口治理，缺少一个明确的用户可见 next-step 引导模式。

同时，`spec-first init --claude|--codex` 已经会向 `CLAUDE.md` 或 `AGENTS.md` 注入三类 managed blocks：language/changelog governance、`using-spec-first` bootstrap，以及 `spec-first:coding-guidelines`。其中 bootstrap 只是入口提醒，`using-spec-first` 是路由真源，`coding-guidelines` 明确只约束进入工作后的 execution posture，不替代 workflow entry governance。本需求必须保留这条分层模型，避免把“下一步该用哪个 workflow”的判断塞进 coding guidelines。

本次改进要让 `using-spec-first` 同时覆盖两类场景：用户显式求助时能给出一个下一步入口；用户直接描述具体任务时，agent 能高置信自动进入合适 workflow，低置信时先确认。目标是降低新手选择成本，同时不引入第二套路由真源、不把普通轻量问答过度 workflow 化，并让 init 注入后的 instruction 层与 skill 真源协同表达“先路由，再按执行准则施工”。

---

## Actors

- A1. 新手用户：知道自己要做什么或刚完成某个 workflow，但不知道当前应触发哪个 `spec-*` 入口。
- A2. 顶层 orchestrator agent：读取 `using-spec-first`，在行动前判断是否需要路由、建议或确认。
- A3. 下游 workflow：`spec-ideate`、`spec-brainstorm`、`spec-plan`、`spec-work`、`spec-debug`、`spec-code-review`、`spec-doc-review`、`spec-mcp-setup`、`spec-update` 等公开入口，负责真正执行对应工作。
- A4. spec-first 维护者：维护唯一 routing policy、双宿主 runtime delivery 和文档一致性。
- A5. instruction file 受管 blocks：`CLAUDE.md` / `AGENTS.md` 中由 init 注入的 bootstrap 与 coding-guidelines blocks，负责提供薄提醒和执行姿势边界。

---

## Key Flows

- F1. 用户显式询问下一步
  - **Trigger:** 用户说“我该用哪个 spec 命令”“下一步是什么”“不知道用哪个 workflow”等。
  - **Actors:** A1, A2
  - **Steps:** agent 识别为 user next-step guide mode；做只读轻量上下文判断；推荐一个最合适入口；用一句话解释原因；询问是否切过去或按用户明确选择继续。
  - **Outcome:** 用户得到一个可执行的当前宿主入口，而不是完整命令大全。
  - **Covered by:** R1, R2, R4, R5, R6

- F2. 用户直接描述具体任务
  - **Trigger:** 用户直接说“帮我修这个 bug”“给这个方案做 code review”“我想实现 X”等，但没有点名 workflow。
  - **Actors:** A1, A2, A3
  - **Steps:** agent 按 `using-spec-first` 做入口判断；对高置信场景说明将按哪个 workflow 处理并继续；对低置信或多路径场景先给一个建议并确认；进入下游 workflow 后不重复入口治理。
  - **Outcome:** 用户不需要先学习完整矩阵，任务仍进入正确 workflow 节点。
  - **Covered by:** R1, R3, R4, R7, R8

- F3. workflow 完成后的下一步
  - **Trigger:** 用户刚完成 brainstorm、plan、work、review、debug 或 setup 后问“然后呢”。
  - **Actors:** A1, A2, A3
  - **Steps:** agent 根据当前 active workflow 的 handoff 语义和已有 artifacts 判断下一步；优先遵循 active workflow 的 Phase 4/handoff；如果已离开 workflow，则使用 `using-spec-first` 的 guide mode 推荐一个入口。
  - **Outcome:** 下一步建议不覆盖下游 workflow 自己的 handoff 规则，也不会生成并行状态机。
  - **Covered by:** R2, R4, R7, R9

- F4. init 注入后的第一轮任务
  - **Trigger:** 用户在已 init 的项目中新开 Claude/Codex 会话，直接描述一个任务。
  - **Actors:** A1, A2, A5
  - **Steps:** instruction bootstrap 提醒 agent 先按当前用户意图选择一个最匹配入口；agent 以 `using-spec-first` 为完整路由真源判断是否进入 workflow；如果进入执行阶段，再受 coding-guidelines 约束保持最小、手术式、可验证改动。
  - **Outcome:** 用户不需要理解 managed blocks 的内部差异，但 agent 的行为仍保持分层：bootstrap 提醒、skill 判断、coding guidelines 约束执行。
  - **Covered by:** R9, R11, R15, R16, R17, R18

---

## Requirements

**Guide mode trigger**
- R1. `using-spec-first` 必须显式定义 user next-step guide mode，覆盖用户询问“下一步”“该用哪个命令”“不知道用哪个 workflow”的场景。
- R2. guide mode 必须支持 workflow 后续场景，例如刚 init 完不知道先跑什么、做完 brainstorm 后不知道该 plan 还是 work、已有 diff 不知道是否 review。
- R3. `using-spec-first` 必须继续支持用户直接描述任务时的自动入口分流，不要求用户先显式调用某个 `spec-*` 或 `spec-*`。

**Routing behavior**
- R4. 每次路由只能推荐一个最合适的公开入口；如果确实存在两个相互排斥的解释，先问一个窄确认问题，而不是列出完整菜单。
- R5. 用户显式求助时，输出必须包含推荐入口、一个具体原因，以及是否切换/继续的下一步提示。
- R6. guide mode 必须只做 read-only 轻量判断；不得写 brainstorm/plan/task/review/solution artifacts，不得替下游 workflow 执行实际工作。
- R7. 用户直接描述任务时，高置信场景可说明所选入口并直接进入；低置信场景必须先确认。高置信示例包括明确 bug/debug、明确 review、明确 setup/update、明确已有 plan/task 的 work；低置信示例包括 ideate/brainstorm/plan/work 边界不清、需求变更与 bug 修复边界不清、是否需要 durable artifact 不清。
- R8. `using-spec-first` 进入某个公开 workflow 后，不应在该 workflow 内部每一步重新启动入口分流，除非用户改变目标、workflow 明确 handoff，或请求明显越界。

**Source and runtime boundary**
- R9. `skills/using-spec-first/SKILL.md` 必须继续作为唯一 routing policy source of truth；不得新增第二套完整路由表。
- R10. 本阶段不新增 `spec-next`、`spec-next`、`spec-guide` 或 `spec-guide` 公开入口；如未来新增，只能作为读取/引用 `using-spec-first` guide mode 的薄壳，不拥有独立路由逻辑。
- R11. 不得手改 `.claude/`、`.codex/` 或 `.agents/skills/` runtime mirrors；需要 runtime 刷新时由 `spec-first init --claude|--codex` 生成。

**Managed instruction block interaction**
- R15. `CLAUDE.md` / `AGENTS.md` 中的 `spec-first:bootstrap` block 必须保持“薄入口提醒”定位；可以承接 next-step guidance 的简短触发提示，但不得复制 `using-spec-first` 的完整路由树。
- R16. `spec-first:coding-guidelines` block 必须保持 execution posture contract；不得加入 workflow 路由表、next-step 菜单或用户意图分类规则。
- R17. next-step guidance 的实现必须保留现有顺序语义：language/changelog governance → workflow entry bootstrap → coding-guidelines。该顺序表达先确定语言/治理，再判断 workflow 入口，最后约束执行姿势。
- R18. 如果实施阶段更新 bootstrap 文案，必须同步检查 `instruction-bootstrap` 和 `coding-guidelines` 的 contract tests，确保 bootstrap 仍指向 `using-spec-first`，coding-guidelines 仍包含“不替代 workflow entry governance”的边界句。

**User experience**
- R12. guide mode 的用户输出必须短，避免把完整 workflow reference 当作回答；默认形态是“建议走 `<entrypoint>`，因为 `<reason>`，接下来 `<action>`”。
- R13. 对刚 init 完的新手，建议应优先指向当前宿主的 setup/first workflow 路径：runtime/MCP 未 ready 时用 `spec-mcp-setup`；目标仍是想法时用 `spec-brainstorm`；目标已清楚但缺方案时用 `spec-plan`。
- R14. 该能力必须保留 `using-spec-first` 既有负向约束：不采用 `using-superpowers` 的 1% rule、不把 `spec-brainstorm` 作为万能默认入口、不把轻量事实问答强制 workflow 化。

---

## Acceptance Examples

- AE1. **Covers R1, R4, R5, R12.** Given 用户说“我现在不知道该用哪个 spec 命令”，when agent 响应，then agent 推荐一个当前最合适入口并给出一句原因，而不是打印完整 workflow 表。
- AE2. **Covers R3, R7.** Given 用户说“这个测试失败了，帮我看看为什么”，when agent 判断入口，then agent 可说明“我会按 `spec-debug` 处理”并进入 debug workflow，不需要先问是否使用 brainstorm。
- AE3. **Covers R7, R14.** Given 用户说“我想改一下登录逻辑”，when bug 修复和需求变更都可能成立，then agent 先确认这是现有行为错误还是策略变更，再决定 debug/work/brainstorm/plan 路径。
- AE4. **Covers R2, R9.** Given 用户刚完成 brainstorm requirements doc 后问“下一步呢”，when agent 响应，then agent 根据 active workflow handoff 或 `using-spec-first` policy 推荐 `spec-plan`，不新增第二套 handoff 规则。
- AE5. **Covers R10, R11.** Given 维护者实现本阶段能力，when 检查变更，then 只修改 source 真相源和必要文档/测试，不新增公开 `spec-next` governance entry，也不手改 generated runtime assets。
- AE6. **Covers R15, R16, R17.** Given 用户项目已经通过 init 注入 `bootstrap` 和 `coding-guidelines` blocks，when 用户直接描述任务，then agent 先基于 `using-spec-first` 做 workflow 入口判断，再在进入 work/debug 等执行阶段遵守 coding-guidelines；coding-guidelines 本身不承担入口路由。
- AE7. **Covers R18.** Given 实施阶段调整 bootstrap 文案以增强“下一步引导”可见性，when 运行 contract tests，then 测试仍能证明 bootstrap 是薄提醒、完整策略在 `using-spec-first`，且 coding-guidelines 仍声明不替代 workflow entry governance。

---

## Success Criteria

- 新手用户可以直接描述任务或询问下一步，并得到一个明确、可执行、符合当前宿主语法的 `spec-*` 入口建议。
- Agent 在高置信任务上能自然进入正确 workflow，在低置信任务上能先确认关键分歧，减少错误进入 plan/work/debug 的概率。
- `using-spec-first` 仍保持唯一 routing policy source of truth，没有出现 README、bootstrap block、新 skill 和 runtime mirror 各自维护路由表的漂移风险。
- init 注入后的 instruction file 分层清楚：bootstrap 帮助 agent 记得路由，coding-guidelines 只约束路由后的执行质量。
- 下游 planner 可以基于本需求直接规划 prose contract、测试覆盖和文档更新，不需要重新发明 guide mode 的触发、边界和输出形态。

---

## Scope Boundaries

- 不新增公开 `spec-next`、`spec-next`、`spec-guide` 或 `spec-guide`。
- 不实现新的 CLI 命令、状态机、router script 或 machine-readable routing engine。
- 不让脚本替 LLM 做语义路由判断；脚本只可在未来提供 deterministic facts。
- 不复制 `using-superpowers` 的 1% 必用规则。
- 不把 guide mode 变成教程、FAQ、完整命令目录或 onboarding 文档替代品。
- 不把 `spec-first:coding-guidelines` 扩展成入口 router 或 workflow selector。
- 不把完整路由策略复制进 `spec-first:bootstrap` block；bootstrap 只保留启动提醒、host 入口边界和少量锚点。
- 不修改 generated runtime assets；runtime 刷新由 `init` 负责。

---

## Key Decisions

- 决策：本阶段增强 `using-spec-first`，不新增独立公开 skill。
  - 理由：`using-spec-first` 已是 routing policy 真源，直接新增完整 `spec-next/spec-guide` 会形成第二套路由中心。
- 决策：同时支持用户求助触发和任务开场自动分流。
  - 理由：真实困惑既发生在“我不知道用哪个命令”时，也发生在用户直接描述任务但不懂 workflow 矩阵时。
- 决策：采用“高置信自动进入，低置信确认”。
  - 理由：这能降低新手成本，同时避免在需求定义、bug/变更分界、plan/work 分界等场景中过度自信。
- 决策：未来若新增 `spec-next`，只能作为薄壳。
  - 理由：公开入口可改善可发现性，但 routing 语义仍应集中在 `using-spec-first`。
- 决策：`spec-first:coding-guidelines` 不参与入口路由设计。
  - 理由：该 block 已有清晰 contract，只约束进入工作后的执行姿势；把下一步引导塞进去会破坏 managed block 的职责边界。
- 决策：如需提升 init 后第一轮体验，优先在 `using-spec-first` 和薄 bootstrap 提醒之间协同，而不是新增第四个 managed block。
  - 理由：现有 instruction file 已有 language、bootstrap、coding-guidelines 三层；新增同级 block 会扩大 clean/doctor/drift/test 面，且价值与 bootstrap 高度重叠。

---

## Dependencies / Assumptions

- `using-spec-first` 已在 dual-host governance 中作为 standalone skill 投递到 Claude 和 Codex runtime。
- 当前宿主入口语法保持不变：Claude 使用 `spec-*`，Codex 使用 `spec-*`。
- 当前 init/bootstrap block 已明确 `using-spec-first` 是 standalone meta skill，不是 command-backed workflow；本改动不改变该身份。
- 当前 `spec-first:coding-guidelines` block 已由 `src/cli/coding-guidelines.js` 独立生成、inspect、remove，并通过独立 tests 覆盖 installed/drifted/idempotent 行为。
- 当前 `CLAUDE.md` / `AGENTS.md` 中 coding-guidelines block 已明确“这些准则只约束进入工作后的执行姿势，不替代 `using-spec-first` 的 workflow 入口治理”。
- 计划阶段需要检查是否已有 `using-spec-first` contract/runtime tests 可扩展，用于防止未来把它变成 command 或复制路由表。

---

## Outstanding Questions

### Resolve Before Planning

- None.

### Deferred to Planning

- [Affects R4, R7][Technical] 规划阶段需要决定用 prose-only contract tests 还是增加 fixture-style tests 来覆盖 guide mode 的典型输入与推荐输出。
- [Affects R12][Technical] 规划阶段需要确定是否同步 README/README.zh-CN 的一句话发现性提示，还是只改 skill source 和 changelog。
- [Affects R9, R11][Technical] 规划阶段需要确认是否存在 docs mirror 或 runtime contract 测试需要同步，以保持 `using-spec-first` source/runtime 关系可验证。
- [Affects R15, R18][Technical] 规划阶段需要判断 bootstrap block 是否需要一行 user next-step guide trigger；如果需要，必须保持薄提醒并补 `instruction-bootstrap` contract tests。
- [Affects R16, R18][Technical] 规划阶段需要确认是否只通过现有 coding-guidelines tests 保护边界，还是新增断言防止未来把 workflow routing 文案加入 coding-guidelines。

---

## Next Steps

-> `spec-plan docs/brainstorms/2026-05-01-002-using-spec-first-next-step-guidance-requirements.md` for structured implementation planning.
