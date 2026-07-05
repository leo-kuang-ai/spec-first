---
date: 2026-05-01
topic: readme-community-entry
spec_id: 2026-05-01-001-readme-community-entry
---

# README 社区入口重构

## Problem Frame

当前 `README.md` 和 `README.zh-CN.md` 信息准确，但整体更像工程事实说明书：先列出当前范围、runtime assets、graph readiness 和完整 workflow surface，再在末尾解释设计边界。对首次接触 spec-first 的开源用户来说，这个顺序会过早暴露内部治理细节，延迟回答三个关键问题：这是什么、为什么值得试、如何快速跑通。

本次重构目标是把 README 调整为面向开源社区首访者的入口页：先建立价值和信任，再提供最短上手路径，最后把完整治理、runtime 和开发细节下沉到后半段或文档链接。

---

## Actors

- A1. 首次接触的开源用户：从 GitHub、npm 或官网进入仓库，想在几分钟内判断 spec-first 是否值得安装。
- A2. 已决定试用的 Claude Code / Codex 用户：需要按当前宿主完成 init、重启宿主，并找到第一个 workflow 入口。
- A3. 潜在贡献者 / 维护者：需要确认 source-of-truth、generated runtime、测试和文档入口，但不是 README 的第一优先级读者。

---

## Key Flows

- F1. 首访评估路径
  - **Trigger:** A1 打开 `README.md` 或 `README.zh-CN.md`。
  - **Actors:** A1
  - **Steps:** 先看到一句话定位和核心研发闭环；随后看到 spec-first 解决的痛点、适用性判断和轻量 trust summary；再看到 Quickstart 能在当前宿主跑通。
  - **Outcome:** A1 能在 30 秒内判断 spec-first 是否适合自己的 AI coding workflow。
  - **Covered by:** R1, R2, R3, R4, R5, R6, R7, R8, R16

- F2. 第一次跑通路径
  - **Trigger:** A2 决定安装并初始化当前宿主。
  - **Actors:** A2
  - **Steps:** 确认 prerequisites、项目仓库根目录和命令执行上下文；安装 CLI；运行 `doctor`；选择 `--claude` 或 `--codex` init；重启宿主；在宿主会话运行第一个公开 workflow；看到产物和下一步。
  - **Outcome:** A2 不需要同时理解双宿主完整 runtime 结构，也能完成一次可验证上手。
  - **Covered by:** R6, R7, R8, R9, R18

- F3. 深入理解路径
  - **Trigger:** A1 或 A3 想理解 runtime、graph readiness、workflow entrypoints 或贡献方式。
  - **Actors:** A1, A3
  - **Steps:** 通过 Core Concepts 和 Documentation map 找到对应文档；README 只保留必要摘要和入口。
  - **Outcome:** 深层信息仍可发现，但不会阻断首访阅读路径。
  - **Covered by:** R10, R11, R12, R13, R17

---

## Requirements

**首屏定位与价值**

- R1. README 首屏必须先给出一句话定位：spec-first 是面向 Claude Code 与 Codex 的 spec-driven AI engineering workflows。`workflow asset bundle` 只用于后文解释 source/runtime assets，不作为首屏主定位。
- R2. 首屏必须用 2-4 行说明 spec-first 帮助用户把 AI coding session 组织成可复用研发闭环：brainstorm、plan、task-pack handoff、work、review、debug、compound。
- R3. 首屏必须保留官网链接 `http://spec-first.cn/` 和中英文 README 互链。
- R4. "Why spec-first?" 或等价章节必须优先说明用户价值，而不是优先列出内部 asset 数量；至少覆盖 workflow 可复用、脚本/LLM 职责分离、Claude/Codex 双宿主一致性三点。
- R5. README 前半段必须包含简短的 "Use spec-first when" / "May not fit when" 适用性判断：适合已经使用 Claude Code 或 Codex、希望把 AI coding 过程沉淀为 brainstorm/plan/work/review 闭环的用户；不应包装成通用 agent marketplace、单次 prompt 集合，或无宿主依赖的独立应用。

**上手路径**

- R6. Quickstart 命令块前必须列出最小 prerequisites：可用的 Node/npm 环境，用户已选择 Claude Code 或 Codex 作为当前宿主，并且当前 shell 位于想启用 spec-first 的项目仓库根目录；首次试用者可以先在 throwaway/test repo 中体验。没有对应宿主的读者应先完成宿主安装或转到相关文档。
- R7. Quickstart 必须前置到 README 主体前半段，并呈现最短闭环：在 terminal 安装 CLI、运行 `doctor`、按当前宿主 init；重启宿主；在宿主会话运行第一个 workflow。命令示例必须明确区分 terminal commands 与 host-session workflow entries：CLI 命令使用 shell/terminal 命令块，`spec-*` 明确标注为 Codex 会话内入口，`spec-*` 明确标注为 Claude Code 会话内入口，不得放在同一个未标注的 `bash` 命令块中。
- R8. Quickstart 必须明确用户按实际宿主选择 `--claude` 或 `--codex`，不能暗示所有用户都必须同时初始化两个宿主。
- R9. README 必须给出 "First workflow" 指引，把常见起点映射到公开入口：有想法用 brainstorm，有计划用 plan，要执行用 work，要评审用 code-review，要调试用 debug；同时必须用 brainstorm 作为默认 first-run 示例，说明 `spec-brainstorm` / `spec-brainstorm` 是宿主会话内入口，会形成 requirements brief，并可继续进入 plan。

**渐进披露与信息架构**

- R10. README 主体结构应按“是什么 → 为什么/适用性/一条 trust summary → 快速上手 → 第一个 workflow → 核心概念 → Trust Model → 常用 workflows → 文档 → 开发/贡献 → 设计边界收束”组织。Quickstart 前只放轻量信任提示，详细职责清单放在 Core Concepts 之后。
- R11. Runtime assets、完整 init 输出、graph readiness provider 细节和完整 workflow 表不得占据 README 前半段；本次重构中 README 后半段只保留压缩摘要和高频 entrypoints，完整参考优先链接到既有 docs、CLI help 或 `doctor` 可发现信息；如果暂时没有等价承载位置，不得直接删除必要参考。
- R12. "Core Concepts" 必须聚焦首次用户必须理解的少数概念：source assets vs generated runtime assets、current host、scripts prepare / LLM decides、task-pack handoff。
- R13. Documentation map 必须采用结构化分组，而不是泛化链接列表：先放官网和语言入口，再按 "Learn the model"、"Use workflows"、"Develop and contribute"、"Release history" 等少数组列出 repo-relative 文档链接；每组最多 2-3 个链接，并明确详细手册中文优先。

**双语一致性**

- R14. `README.md` 与 `README.zh-CN.md` 必须保持相同信息架构和等价信息量；英文作为国际开源入口，中文作为中文用户入口，两者不应出现结构漂移。
- R15. 中文版可以保留中文治理表达，但不能比英文版多出关键约束；英文版不能只保留摘要而丢失 source/runtime、当前宿主和设计边界。

**信任模型**

- R16. README 必须提前呈现轻量 trust summary，并在 Core Concepts 之后展开详细 Trust Model，但要避免和 "Why spec-first?" 重复：Why section 只用价值型 bullet 提到 `scripts prepare, LLM decides`，Trust Model 再展开脚本负责安装、生成、校验、清理、hash 和事实报告，以及 LLM 负责范围、取舍、实现判断和评审证据。
- R17. README 必须明确 generated runtime assets 可丢弃，应通过 `spec-first init` 从 source assets 重建，不鼓励手改 `.claude/`、`.codex/` 或 `.agents/skills/` 下的生成副本。

**验证闭环**

- R18. README 重写完成后必须记录两项轻量验证结果，不新增正式用户研究或评测框架：30 秒首访阅读检查能回答“这是什么、为什么值得试、下一步怎么开始”；单一宿主 Quickstart trace 能证明 2 分钟上手路径在文档上可被跟随。

---

## Acceptance Examples

- AE1. **Covers R1, R2, R4, R5, R16.** Given 一名首次用户打开 README，when 他阅读首屏、"Why spec-first?"、适用性判断、轻量 trust summary 和后续 Trust Model，then 他能说出 spec-first 不是单个 prompt，而是一套适合 Claude Code / Codex 用户沉淀 AI 研发流程的 workflow，并能复述 `scripts prepare, LLM decides` 以及 Why 只做价值提示、详细 Trust Model 位于 Core Concepts 之后。
- AE2. **Covers R6, R7, R8, R9.** Given 一名 Codex 用户只使用 Codex，when 他在项目仓库根目录阅读 Quickstart，then 他会在 terminal 运行 `spec-first init --codex`，重启后在 Codex 会话中尝试 `spec-brainstorm` 或其他 `spec-*` 入口，而不是误以为还必须运行 Claude init，或把 `spec-*` 当作 shell 命令运行。
- AE3. **Covers R10, R11, R12.** Given 一名首访用户还没决定是否安装，when 他阅读 README 前半段，then 他看到 README 按“是什么 → 为什么/适用性/trust summary → 快速上手 → 第一个 workflow → 核心概念”推进，不会先被 runtime asset 数量、完整 graph provider 细节或完整生成路径打断，并能从 Core Concepts 看到 source assets vs generated runtime assets、current host、scripts prepare / LLM decides、task-pack handoff 四项少数必要概念。
- AE4. **Covers R14, R15.** Given 维护者更新英文 README 结构，when 同步中文 README，then 两份文档的章节顺序和关键约束保持一致，只做语言本地化差异。
- AE5. **Covers R9.** Given 一名用户运行第一个 brainstorm workflow，when README 展示 first-run result，then 用户能看到它会形成 `docs/brainstorms/...-requirements.md` 这类 requirements brief，并理解下一步可进入 plan。
- AE6. **Covers R18.** Given README 重构已经实现，when 执行验证，then 记录一次 30 秒阅读检查和一次单宿主 Quickstart trace，证明核心成功标准不是只靠作者主观判断。
- AE7. **Covers R3, R13, R17.** Given 用户需要深入理解项目或 runtime 边界，when 他阅读 Documentation map 和 Trust Model，then README 同时保留官网/语言入口、按分组提供 repo-relative 文档链接，并说明 generated runtime assets 可由 source assets 通过 `spec-first init` 重建。

---

## Success Criteria

- 首次接触 spec-first 的用户能在 30 秒内理解项目定位、核心价值、适用场景和下一步开始方式。
- 用户能在 2 分钟内从 README 找到当前宿主的安装初始化路径、第一个 workflow 入口、该 workflow 的预期产物，并知道哪些命令在 terminal 运行、哪些入口在宿主会话运行。
- README 前半段不再由 runtime assets、graph readiness 和完整 workflow surface 主导。
- `spec-plan` 或执行者不需要自行决定 README 的读者优先级、章节顺序或复杂信息下沉策略。
- README 仍保留 spec-first 的核心治理边界，不把项目包装成纯 marketing 文案。
- 实施完成后有可复查的验证记录，覆盖 30 秒阅读检查和单宿主 Quickstart trace。

## Implementation Verification

- 2026-05-01 17:28 30 秒首访阅读检查：`README.md` 与 `README.zh-CN.md` 首屏先回答“是什么”（面向 Claude Code 与 Codex 的 spec-driven AI engineering workflows）、“为什么值得试”（可复用 workflow loop、清晰脚本/LLM 信任边界、双宿主一致性）和“下一步怎么开始”（进入 Quickstart，按当前宿主 init 后运行第一个 brainstorm workflow）。
- 2026-05-01 17:28 单宿主 Quickstart trace（Codex）：从项目 repo 根目录阅读 prerequisites，terminal 中执行 `npm install -g spec-first`、`spec-first doctor`、`spec-first init --codex -u <name> --lang en|zh`；重启 Codex 或新开会话；在 Codex 会话内运行 `spec-brainstorm "Improve onboarding"` / `spec-brainstorm "改进 onboarding"`；文档明确预期产物为 `docs/brainstorms/YYYY-MM-DD-NNN-topic-requirements.md`，随后进入当前宿主 plan 入口。
- 2026-05-01 18:31 开源信任入口二阶段验证：`README.md` 与 `README.zh-CN.md` 已增加 trust badges、90 秒文本 demo、Quickstart 完成标志、`docs/brainstorms/` / `docs/plans/` / `docs/tasks/` 产物说明、source assets -> runtime assets -> workflow artifacts 工作方式说明，以及 `CONTRIBUTING.md` / `SECURITY.md` / `LICENSE` 社区入口；`tests/unit/readme-open-source-entry.test.js` 覆盖 proof/trust 结构、local links 和保守安全政策边界。

---

## Scope Boundaries

- 本次重构优先服务首次接触的开源用户；已安装用户和贡献者仍被支持，但不是首屏和前半段的主导读者。
- 不要求新增截图、GIF、徽章或官网内容；这些可以作为后续 polish，而不是本次 README 重构的阻塞项。
- 不删除双宿主 workflow entrypoints；只压缩展示方式，把完整参考信息下沉。
- 不改变 CLI 行为、workflow 行为、runtime 生成契约或 graph readiness 机制。
- 不手改 `.claude/`、`.codex/`、`.agents/skills/` 下的 generated runtime assets。

---

## Key Decisions

- **采用 Community README 方向**：相比只调整结构的方案，当前更需要让 README 成为 GitHub 首访入口，而不是维护者手册。
- **读者优先级收敛到首次开源用户**：用户已明确选择该方向，因此上手转化优先于完整内部说明。
- **保留工程边界，不做纯营销页**：spec-first 的差异点是职责边界和可维护 workflow，不应牺牲可执行命令和 source/runtime 规则。
- **适用性判断前置但保持轻量**：README 需要帮助用户判断是否适合安装，但不引入复杂 persona、竞品比较或市场化定位页。
- **brainstorm 作为默认 first-run result**：首次示例优先展示 requirements brief 产物，因为它最能体现 spec-first 从模糊想法进入结构化研发闭环的价值。
- **继承但强化既有 README 规划**：本 brief 继承 `docs/brainstorms/2026-04-28-002-readme-structural-reorganization-requirements.md` 的渐进披露方向，但把目标从结构整理提升为社区入口重构。

---

## Dependencies / Assumptions

- `README.md` 和 `README.zh-CN.md` 当前保持镜像关系，实施时应继续同步改动。
- 当前官网链接为 `http://spec-first.cn/`，首屏和 Documentation map 均应保留。
- 详细手册和实施文档目前中文优先；README 应如实说明，而不是承诺不存在的英文完整文档。
- 如果后续要加入演示 GIF、截图或徽章，应作为独立 polish 任务处理。

---

## Outstanding Questions

### Deferred to Planning

- [Affects R11, R13][Technical] 实施计划需要指定 runtime assets、完整 workflow 表和 graph readiness 细节的最终承载位置；若既有 docs 没有等价入口，README 后半段必须保留最小可发现参考。
- [Affects R18][Technical] 实施计划需要指定 30 秒阅读检查和单宿主 Quickstart trace 的记录位置，并明确它们作为 README 重构完成前的轻量验证项。

---

## Next Steps

-> `spec-plan` 进行结构化实施规划
