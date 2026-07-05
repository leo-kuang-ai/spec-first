---
spec_id: 2026-06-01-002-readme-onboarding-promotion
artifact_kind: prd-requirements
target_surface: generic
status: draft
evidence_grade: mixed
created: 2026-06-01
---

# README 快速接入与推广优化

## Summary

`README.md` 与 `README.zh-CN.md` 经过多轮迭代后已重新膨胀到 662 / 663 行、17 个 H2 节(`confirmed-source`)。同一条 workflow 链路在 `See It In 90 Seconds`、`A Tiny Example`、`End-To-End Development Flow`、`Current Engineering Loop` 中以四种形态重复出现;同一组 workflow 入口在 `Choose Your Path`、`Core Workflows`、`Full Workflow Reference`、`Main flows`、`Current Engineering Loop` 的子表中重复列举;`Runtime Reference`(约 75 行)与 `Supported Development Modes` 把 graph readiness、scenario fingerprint、workspace 子仓、init 输出预期、capability 计数等内部治理细节抬到了主体高位。

本次增量面向两个明确目的:**让首次接触的开源用户更快完成接入**,以及**便于项目推广**。做法是在不丢失关键治理边界的前提下,合并重复的链路/入口表达、把内部 runtime/治理细节下沉到既有 docs 链接,并轻量强化 README 的价值与差异化表达。本次**仅做内容层重构**,不录制 GIF/截图、不新增营销素材(owner-confirmed)。

本工件是 PRD-grade 需求,供当前宿主 plan workflow 消费;它定义重构后 README 应满足的 WHAT(信息架构、保留项、下沉项、双语一致性、验证口径),不规定具体逐行编辑、章节命名细节或工具实现。

## Problem Frame

README 是开源项目最高频的首访入口,直接决定"用户是否在几分钟内完成接入"和"用户是否愿意转发推广"。当前 README 信息准确但存在三类损害接入与推广效率的问题(`confirmed-source`,基于阅读当前 `README.md`):

- **冗余稀释价值**:workflow 链路重复 4 次、入口表重复 3+ 次,读者反复看到同一信息,首屏到"如何开始"的有效信息密度被拉低。
- **内部治理细节前置**:`Supported Development Modes`(单仓/多模块/多仓拓扑)、`Runtime Reference`(scenario fingerprint、workspace 子仓、provider readiness、init 输出预期、capability 计数)对首次接入用户不是必读,却占据大量主体篇幅,延后了上手路径。
- **推广钩子偏弱且分散**:差异化表达(vs agent orchestration tools)、一句话定位、适用性判断已存在但分散,缺少一个让读者"愿意一句话转述并转发"的紧凑表达。

本次重构继承 `docs/brainstorms/2026-05-01-001-readme-community-entry-requirements.md` 确立的价值优先与渐进披露方向,目标从"社区入口重构"推进到"接入转化 + 推广友好",核心是**收敛重复、下沉细节、强化价值表达**,而不是再次重排全部章节。

## Change Delta

| 现状(confirmed-source) | 变更类型 | 目标 |
|---|---|---|
| 首屏一句话定位 + 90 秒链路 + 官网/双语互链 | `keep` | 保留并轻量锐化定位句,使其更易被一句话转述。 |
| 价值优先 + 渐进披露的整体顺序(是什么→为什么→Quickstart→第一个 workflow) | `keep` | 保留 `2026-05-01-001` 已建立的阅读路径。 |
| workflow 链路在 4 处重复呈现 | `replace` | 收敛为一处规范可视化 + 一个极简示例,其余处改为引用而非重复全链路。 |
| workflow 入口在 `Choose Your Path` / `Core Workflows` / `Full Workflow Reference` / `Main flows` 等多表重复 | `replace` | 收敛为一张规范入口表 + 必要时的轻量分组;移除冗余重复表。 |
| `Supported Development Modes` 完整拓扑(单仓/多模块/多仓)置于主体高位 | `extend` | 主体只保留最小说明,完整拓扑下沉到 docs 链接或后半段压缩段。 |
| `Runtime Reference`(约 75 行 graph/provider/workspace/init 细节) | `replace` | 主体只保留首次接入必需的 runtime 摘要 + CLI reference;深层细节链接到既有 docs/catalog/contracts。 |
| `What You Get` 与 `How It Works` 对 durable entities/artifact roots 的重叠描述 | `replace` | 合并为单一"产物与工作方式"表达,去除重复。 |
| trust badges / 官网链接 / `CONTRIBUTING`·`SECURITY`·`LICENSE` 社区入口 | `keep` | 推广信号保留;复用现有 1 个 SVG,不新增素材。 |
| 首屏可承载演示素材的位置 | `extend` | 收敛后预留首屏素材位,使将来嵌入终端动画/截图无需二次重构;本次只预留接口,不生产素材。 |
| GIF/截图/录屏等可视化营销素材 | `keep`(本次不引入) | 录制类素材延续历史 brief,作为独立 polish follow-up,不阻塞本次。 |

本次不改变 CLI 行为、workflow 行为、runtime 生成契约或 graph readiness 机制;只改 README 两份文档的内容与信息架构。

## Current System Snapshot

仅记录影响本 PRD 的当前事实(均为 `confirmed-source`,来自阅读仓库文件):

- `README.md` = 662 行,`README.zh-CN.md` = 663 行;两者保持镜像关系。
- 英文 H2 节(17 个):See It In 90 Seconds、A Tiny Example、Why spec-first?、Quickstart、End-To-End Development Flow、Current Engineering Loop、Supported Development Modes、What You Get、How It Works、Choose Your Path、Core Workflows、Trust Model、Use spec-first when、Documentation、Full Workflow Reference、Runtime Reference、Development & Contributing;中文版节序与之等价。
- workflow 链路重复出现在:`See It In 90 Seconds`、`A Tiny Example`、`End-To-End Development Flow`(大型 ASCII)、`Current Engineering Loop`。
- 入口表/映射重复出现在:`Choose Your Path`、`Core Workflows`、`Full Workflow Reference`、`How It Works > Main flows`、`Current Engineering Loop` 内的 "Need / Better entrypoint" 子表。
- 推广相关资产已存在:npm/license/node/CI/docs 徽章、官网 `http://spec-first.cn/`、`docs/assets/readme/spec-first-flow.svg`(目录中唯一 SVG)、`CONTRIBUTING.md` / `SECURITY.md` / `LICENSE`。
- 既有承载下沉内容的 docs 链接已存在:Core Concepts、Architecture Overview、Source/Runtime/Provider Customization Boundary、Runtime Capability Catalog、Workflows and Artifacts Map、首次工作流走查、产物目录等(README `Documentation` 节中已链接)。
- 历史已有 README 相关回归测试 `tests/unit/readme-open-source-entry.test.js`(`gitnexus-pointer`:由 `2026-05-01-001` 验证记录提及,实施时需直接确认其当前断言再决定是否扩展)。

## Requirements

**价值与推广表达(便于快速判断与转发)**

- R1. 首屏一句话定位必须保留并锐化为一句可被读者直接转述的表达,覆盖"面向 Claude Code 与 Codex 的 spec-driven AI engineering workflows"与"把一次性 AI coding 对话变成可复用研发闭环"两层含义;不得用内部 asset 术语(如 capability 计数、runtime mirror)作为首屏主定位。
- R2. README 前半段必须保留一处紧凑的差异化表达,说明 spec-first 编排的是 requirement/plan/task/diff/review/learning 等工程实体,而非 agent/role/team;该表达最多一张对照表或一段 bullet,不扩展为竞品评测。
- R3. README 前半段必须保留轻量适用性判断("Use spec-first when" / "May not fit when"),帮助读者快速自判是否值得接入;保留现有 trust badges、官网链接与中英互链作为推广信号。

**接入路径(更快跑通)**

- R4. Quickstart 必须保持在主体前半段,并保留最短可验证闭环:terminal 安装 CLI → `doctor` → 按当前宿主 `init` → 重启宿主 → 宿主会话运行第一个 workflow;必须明确区分 terminal 命令块与 host-session 入口(`spec-*` 标注为 Claude Code 会话内、`spec-*` 标注为 Codex 会话内),不得混入同一未标注 `bash` 块。
- R5. Quickstart 必须保留"按实际宿主选择 `--claude` 或 `--codex`",不得暗示所有用户必须同时初始化双宿主;必须保留最小 prerequisites(Node `>=20` + npm、Git on PATH、已选择并安装 Claude Code 或 Codex、shell 位于目标仓库根目录、首次可用 throwaway repo)。
- R6. README 必须保留"第一个 workflow 怎么选"的指引,把常见起点映射到公开入口,并以 brainstorm 作为默认 first-run 示例,说明其产出 `docs/brainstorms/YYYY-MM-DD-NNN-topic-requirements.md` 并可继续进入 plan。

**冗余收敛(提升信息密度)**

- R7. 重复的 workflow 链路表达必须收敛:全文保留**一处**规范的端到端 workflow 可视化作为权威呈现,外加**最多一个**极简示例;其余位置如需提及链路,只能引用该权威呈现或仅列出与当前语境相关的子集,不得再次重复完整链路。
- R8. 重复的 workflow 入口表必须收敛为**一张**规范入口表(覆盖 intent → Claude Code `spec-*` → Codex `spec-*` → 预期产物);`Choose Your Path`、`Core Workflows`、`Full Workflow Reference`、`Main flows` 等并存的入口映射必须合并去重,保留的入口信息总量不少于现状(不得丢失任何公开 workflow 入口)。
- R9. `What You Get` 与 `How It Works` 中对 durable entities、artifact roots、runtime shape 的重叠描述必须合并为单一表达,去除重复说明同一组产物目录的段落。

**内部细节下沉(降低接入阅读负担)**

- R10. `Supported Development Modes` 的完整仓库拓扑(单仓/单项目、单仓/多模块、多仓 workspace 的 ASCII 与 `.spec-first` authority 规则)不得占据主体前半段;主体只保留"`.spec-first` facts 以所选 Git repo root 为权威"这一最小约束,完整拓扑下沉到既有 docs 链接或移至后半段的压缩段落。
- R11. `Runtime Reference` 中的 graph readiness/provider config/scenario fingerprint/workspace 子仓/init 输出预期/capability 计数等深层细节必须从主体下沉:README 只保留首次接入必需的 runtime 摘要(source assets → `spec-first init` → host runtime → workflow artifacts 的一句话因果)与 CLI reference 命令块;深层参考改为链接到既有 `docs/catalog/runtime-capabilities.md`、`docs/contracts/*`、`spec-first doctor`/`--help` 可发现信息。
- R12. 下沉不得造成信息丢失:任何从主体移除的必要参考,必须在 README 后半段保留压缩摘要或指向既有 docs 的可达链接;若既有 docs 没有等价承载位置,则不得直接删除该必要参考(沿用 `2026-05-01-001` R11 约束)。
- R13. 不得在 README 中硬编码会随版本漂移的内部计数(如 skills/agents/commands 数量);需要展示数量时,改为引导用户通过 `spec-first doctor` 或 init 输出查看(沿用 `2026-04-28-002` R6 约束)。

**素材预留位(为推广素材留接口,不在本次生产)**

- R17. 收敛后的 README 必须在首屏价值区(现 `See It In 90 Seconds` 附近)保留一处可承载终端动画/演示素材的位置,使将来嵌入 GIF/截图不需要二次结构重构;本次仍复用现有 `docs/assets/readme/spec-first-flow.svg`,不生产新素材。该位置可以是现有 SVG 引用本身,或一段标注清晰、便于后续替换的占位标记。

**双语一致性**

- R14. `README.md` 与 `README.zh-CN.md` 必须保持相同信息架构、等价信息量与一致的收敛结果;两份文档的 H2 节顺序与数量必须一致,不得一方收敛而另一方保留冗余。
- R15. 中文版可保留中文治理表达,但不得比英文版多出或少掉关键约束;收敛后双方均须保留 source/runtime 边界、当前宿主选择、适用性判断与设计边界收尾。

**验证闭环**

- R16. 重构完成后必须记录轻量验证结果,不新增正式用户研究或评测框架:(a) 行数/章节收敛度量(重构前后 H2 节数与总行数对比,且无公开 workflow 入口丢失);(b) 30 秒首访阅读检查可回答"这是什么、为什么值得试、下一步怎么开始";(c) 单一宿主 Quickstart trace 在文档上可被跟随;(d) 若 `tests/unit/readme-open-source-entry.test.js` 存在相关断言,运行其确认仍通过或按需更新。

## Acceptance Examples

- AE1. **Covers R1, R2, R3.** Given 一名首次用户打开 README 首屏,when 他阅读定位句、差异化对照与适用性判断,then 他能用一句话向同事转述 spec-first 是什么、和 agent 编排工具有何不同,并据此判断是否值得接入,且首屏未被内部 capability 计数或 runtime mirror 术语干扰。
- AE2. **Covers R4, R5, R6.** Given 一名只使用 Codex 的用户,when 他在目标仓库根目录阅读 Quickstart,then 他在 terminal 运行 `spec-first init --codex`、重启后在 Codex 会话尝试 `spec-brainstorm`,而不会误以为必须同时 init Claude,也不会把 `spec-*` 当作 shell 命令;随后他知道首个 brainstorm 产出 `docs/brainstorms/...-requirements.md` 并可进入 plan。
- AE3. **Covers R7, R8, R9.** Given 一名读者从头读到尾,when 他经过 README 主体,then 他只看到**一处**权威 workflow 链路可视化与**一张**规范入口表,不再遇到四次重复链路或多张重复入口表,且所有公开 workflow 入口仍可在那张表中找到。
- AE4. **Covers R10, R11, R12, R13.** Given 一名首次接入用户,when 他阅读 README 主体前半段,then 他不会被仓库拓扑全集、scenario fingerprint、workspace 子仓、provider readiness、init 完整输出或内部计数打断;当他确实需要这些细节时,能通过 README 后半段的压缩摘要或 docs 链接到达,且没有必要参考被无承载地删除。
- AE5. **Covers R14, R15.** Given 维护者收敛英文 README 结构,when 同步中文 README,then 两份文档的 H2 节顺序、数量与关键约束保持一致,仅存在语言本地化差异,不出现一方仍冗余、另一方已收敛的结构漂移。
- AE6. **Covers R17.** Given 重构完成后将来要嵌入终端动画 GIF,when 维护者把素材放进 README,then 首屏价值区已有清晰可承载的素材位,只需替换/补充资源引用,无需再次移动章节或重排首屏;本次该位置仍复用现有 `spec-first-flow.svg`。
- AE7. **Covers R16.** Given 重构已实现,when 执行验证,then 记录重构前后行数/章节收敛度量(并确认无公开入口丢失)、一次 30 秒阅读检查、一次单宿主 Quickstart trace,以及 README 回归测试的运行结果。

## Scope Boundaries

- 本次优先服务"首次接入的开源用户"与"项目推广";已安装用户与贡献者仍被支持,但不是首屏与前半段的主导读者。
- **仅内容层重构**(owner-confirmed):本次不录制 GIF/asciinema、不新增截图或营销素材;复用现有徽章与唯一 SVG。收敛后按 R17 预留首屏素材位,但只预留接口、不生产素材。
- **推广素材作为独立 follow-up**(owner-confirmed):终端演示素材分两类,均不在本 PRD 交付——(1) **CLI setup 动画**:`npm i -g spec-first` → `doctor` → `init` 的确定性段,适合用工具链中已具备的 `vhs`(checked-in `.tape` → 生成 GIF)可重生成,符合 source/runtime 边界,建议作为首个 polish follow-up;(2) **workflow 实跑录制**:`spec-brainstorm` 等会话产出非确定性,只能录真实会话(asciinema/录屏),维护成本更高、易随版本过期,作为第二阶段可选项。两者都不得用 VHS 伪造 workflow 输出。
- 不删除任何公开 workflow 入口;只收敛展示方式并下沉深层参考。
- 不改变 CLI 行为、workflow 行为、runtime 生成契约、graph readiness 机制或测试运行契约(除按需更新 README 回归测试断言)。
- 不修改 `CLAUDE.md`、`AGENTS.md` 或其他治理文件;不手改 `.claude/`、`.codex/`、`.agents/skills/` 下的 generated runtime assets。
- 不引入新的章节类型(Roadmap、赞助、社区聊天渠道等);推广强化限于复用与重组现有价值表达。
- 不规定具体逐行编辑、最终章节命名或收敛后的精确节数——这些属于 plan/work 决策,本 PRD 只约束信息架构与保留/下沉边界。

## Evidence And Assumptions

证据来源标注:

- `confirmed-source`:README 行数(662/663)、17 个 H2 节及其名称、链路与入口重复位置、徽章/官网/SVG/社区文件存在性、`docs/assets/readme/` 仅含 `spec-first-flow.svg`、`Documentation` 节已有的下沉目标链接 —— 均来自本次直接阅读 `README.md`、`README.zh-CN.md` 与目录列举。
- `confirmed-source`:历史 README 需求 brief(`2026-04-01`、`2026-04-28-002`、`2026-05-01-001`)确立的价值优先、渐进披露、双语镜像、不硬编码计数等约束。
- `gitnexus-pointer`:`tests/unit/readme-open-source-entry.test.js` 的具体断言由 `2026-05-01-001` 验证记录提及,实施前需直接读取该测试确认当前覆盖面,再决定扩展或更新。
- `assumption`:`Documentation` 节现有 docs 链接(Core Concepts、Architecture Overview、Runtime Capability Catalog、Customization Boundary 等)足以承载从主体下沉的内部细节;若实施时发现某项内部细节无等价 docs 承载,按 R12 在 README 后半段保留压缩摘要,而非删除。
- `assumption`:开发者 profile 为 `leokuang` / `zh`(读自 `~/.spec-first/.developer`),CHANGELOG 作者与语言据此生成。

无需外部研究即可完成本次增量;未执行任何外部检索。

## Outstanding Questions

### Deferred to Planning

- [Affects R7, R8] 实施计划需决定收敛后保留哪一处作为"权威 workflow 链路可视化"(候选:现有 `End-To-End Development Flow` ASCII 或 `See It In 90 Seconds` 文本流)与哪一张作为规范入口表(候选:合并 `Core Workflows` 与 `Full Workflow Reference`),并据此确定其余重复表达的删除/引用方式。
- [Affects R10, R11, R12] 实施计划需确认每一项下沉内容的最终承载位置(既有 docs 链接 vs README 后半段压缩段),并核对既有 docs 是否已覆盖;无覆盖项按 R12 保留最小可发现参考。
- [Affects R16] 实施计划需指定收敛度量与两项轻量验证(30 秒阅读检查、单宿主 Quickstart trace)的记录位置(建议追加到本工件的 Implementation Verification 段)。

## Implementation Verification

- 收敛度量: 以 `git show HEAD:README*` 作为实施前基线测量,`README.md` 从 663 行 / 17 个 H2 收敛到 319 行 / 11 个 H2;`README.zh-CN.md` 从 664 行 / 17 个 H2 收敛到 319 行 / 11 个 H2。
- 公开入口完整性: `tests/unit/readme-open-source-entry.test.js` 的 `PUBLIC_WORKFLOW_ENTRIES` 覆盖 21 个公开入口,并断言英文与中文 README 均保留 Claude Code `spec-*`、Codex `spec-*` 或 standalone `write-tasks` 映射;验证通过,无公开 workflow 入口丢失。
- 30 秒首访阅读检查: 首屏定位句回答"这是面向 Claude Code 与 Codex 的 spec-driven AI engineering workflow";`Why spec-first?` 回答"为什么不同于 prompt snippet / agent team";`Quickstart` 在前半段给出 terminal 安装、`doctor`、按当前宿主 `init`、重启宿主和首个 workflow 入口。
- 单宿主 Quickstart trace: Codex-only 读者可在 terminal 执行 `npm install -g spec-first` -> `spec-first doctor` -> `spec-first init --codex`,重启 Codex 后在 Codex 会话运行 `spec-brainstorm "Improve onboarding"`,并预期得到 `docs/brainstorms/YYYY-MM-DD-NNN-topic-requirements.md`;README 明确 host-session workflow entries 不是 shell commands,且不要求同时初始化 Claude Code。
- 验证命令: `npx jest tests/unit/readme-open-source-entry.test.js tests/unit/readme-language-split.test.js tests/unit/runtime-contract-boundary.test.js tests/unit/gitnexus-capability-catalog-contracts.test.js tests/unit/package-install-contracts.test.js --runInBand` -> 5 suites passed,38 tests passed。
- 边界确认: 本次未新增 GIF/截图/录屏,继续复用 `docs/assets/readme/spec-first-flow.svg`;未修改 CLI 行为、workflow 行为、runtime generation、graph readiness 机制或 generated runtime mirrors。

## Next Steps

-> 已完成 README 快速接入与推广优化的计划、实现、验证记录和 changelog 收口。
