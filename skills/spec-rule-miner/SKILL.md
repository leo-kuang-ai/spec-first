---
name: spec-rule-miner
description: "Use this standalone skill when the user asks to mine a repo's existing coding conventions for future AI coding, generate or refresh project rules with AGENTS.md/CLAUDE.md pointers, create Cursor or Qoder rule files from actual code evidence, or make AI-generated code follow a specific project's habits. Do not use for confirmed team policy governance, normal code review/debug/refactor work, linter/formatter configuration, generic best practices, unsupported tool rule files such as .cursorrules or .kiro/steering rules, or generated runtime mirror edits."
---

# Spec Rule Miner

## Purpose

`spec-rule-miner` 从目标仓库的真实代码中提炼项目级 AI 编码规则，把完整规则写入独立规则文件，并让 `AGENTS.md` / `CLAUDE.md` 这类 host 入口文件引用该文件。它是 standalone skill，不是 `spec-*` public workflow。

核心产物是 <=1000 words 的项目规则块，规则必须来自当前目标仓库证据，而不是语言默认、个人偏好或通用最佳实践。

## When To Use

- 使用本 skill：用户要“分析项目风格”“学习代码规范”“生成项目规则”“挖掘编码习惯”“让 AI 像团队一样写代码”，或明确要生成 `AGENTS.md`/`CLAUDE.md` 引用入口、Cursor/Qoder 规则文件。

## When Not To Use

- 不使用本 skill：用户要审查当前 diff、修复代码、重构、调试、写 lint/format 配置、生成通用语言规范，或治理 confirmed team policy。
- 近邻路由：confirmed team policy governance 已退役，不再提供专用入口；代码质量评审走 `spec-code-review`；实际实现或修复走 `spec-work`（bug 根因排查走 `spec-debug`）；创建或修改 spec-first source skill 走 `spec-write-skill`。命中近邻路由时必须在回复中点名目的地 skill（例如：「这是代码评审请求，属于 `spec-code-review`」）——只解释不匹配而不指路，owner 依然无路可走。点名之后不得在本会话内替目的地干活：直接修 bug、直接做代码评审、直接实现需求，都是把别的 workflow 的职责搬进 rule-miner 执行；用户的即时指令（「顺手修了」「直接审了」）不构成跨 workflow 代行授权——正确动作始终是点名目的地并交还路由。

## Inputs

- `target_repo`：必须是一个明确的本地目标仓库。
- 当前仓库的人写源码、测试、配置和已有 agent rule 文件。
- 用户指定的输出目标；未指定时使用默认目标。

## Outputs

- `rules_block`：写入独立规则文件的纯规则正文，使用 `spec-rule-miner-start` / `spec-rule-miner-end` markers。
- `evidence_summary`：每个规则组的代表性文件路径和样本限制；不写入规则文件，除非用户明确要求。
- `target_files`：默认独立规则文件、入口 pointer 文件与用户指定输出文件，说明 pointer 还是 inline。
- `limitations`：小样本、大仓库/多包抽样、混合语言、生成代码占比高、历史例外、冲突模式跳过、图候选未回源、refresh no-op、headless 默认写入等限制。

## Hard Boundaries

- 只读目标仓库代码；不要修改业务源码、测试、构建配置或 formatter/linter 配置。
- Host-projected copies are outside this skill's rule targets；具体禁区见 [Write Targets](references/write-targets.md)。宿主投影过期时从 source 运行 `spec-first init` 修复。
- 写入独立规则文件和引用入口前必须 preview 规则正文和目标文件；交互可用时等待用户确认。只有用户明确要求直接写入，或宿主/调用参数明确证明当前运行是 headless/non-interactive，才使用默认目标；普通聊天里用户暂未回复不能算 headless。默认写入必须在 closeout 记录 `headless_default_write`、目标文件和限制。
- 不覆盖用户已有规则。读取目标文件后，只替换 `spec-rule-miner` markers 内的旧块；无 markers 时追加；疑似旧版无 marker 输出时先询问替换还是追加。
- 非首次执行必须先重新取证并生成 candidate rules block，再与现有 canonical marked block / pointer 对比；无实质变化时不重写文件，closeout 记录 `refresh_noop`、采样范围和限制；有变化时 preview diff 后只替换 marker 内内容。
- 每条规则必须有当前仓库证据：默认至少 2 个文件支撑；小仓库样本不足时降级说明 sample-size；不确定或 50/50 分裂的模式不写成规则。
- 不泄露敏感信息：密钥、内部 URL、私有包名、账号、生产路径、安全实现细节只用于判断，不进入规则正文。

## Workflow

1. 明确 `target_repo`。父级多仓工作区必须先锁定一个目标仓库；不清楚时只问一个问题。
2. 盘点仓库形态：根目录、主要语言、源码目录、测试目录、配置文件、包/应用边界、生成物/依赖目录和已有 agent rule 文件；多包 workspace 必须识别具体子项目范围。
3. 过滤读取范围：跳过依赖、构建产物、锁文件、minified 文件、二进制、vendored/generated 代码；大仓库或多包仓库使用分层抽样并在 preview 和 closeout 中披露样本包、未覆盖子项目和适用范围。
4. 读取并记录证据。抽取前先读 [Pattern Categories](references/pattern-categories.md)，用其中类别组织证据；大仓库可按其中 capability-class 边界使用 `code-graph` / `project-graph` 候选缩小阅读范围，但规则证据必须回到当前源码；配置已强制的 formatter/linter 规则只记录为“已由工具处理”，不要重复写入 AI 规则。
5. 合成规则：按 `frequency x deviation from defaults` 排序，保留高频且偏离默认的做法；多包规则必须区分跨包通用模式、包级专属模式和历史例外，旧项目反例只能写成“新增代码优先”或“不扩大例外”；除非证据在适用范围内压倒性一致，不使用全仓库绝对措辞。必须包含至少一个 hidden association 和至少一个 anti-pattern，除非证据明确不存在，并在 preview 限制中说明。规则正文可以包含适用范围和例外边界，这不算挖掘过程元说明。
6. Preview：展示将写入独立规则文件的规则块、入口引用文件、word count、采样/证据限制、适用包范围、历史例外、refresh diff/no-op 判断，以及每个规则组的代表性 source refs。规则正文不要包含挖掘过程元说明。
7. 写入前读 [Write Targets](references/write-targets.md)，按目标文件的 marker、frontmatter、pointer/inline 规则执行。默认把完整规则写入 `docs/ai/project-rules.md`，并让 `AGENTS.md` 与 `CLAUDE.md` 指向该文件。
8. 收尾输出：列出写入文件、规则字数、是否采样、未写入的近邻工具文件、需要用户手动检查的限制；如果没有写文件，说明 preview-only 状态；如果因 headless 走默认写入，必须说明 `headless_default_write` 的证据来源。

## Failure Modes

- 目标仓库没有可分析源码：不生成空规则，说明需要先有代码样本。
- 用户请求 `.cursorrules`、`.kiro/steering/**`、GitHub Copilot、Trae 或其他未支持规则文件：说明目标不在当前支持范围内，不猜路径、不写 pointer。
- 旧版无 marker 规则块无法安全识别：先询问“迁移到独立规则文件还是追加 pointer”。
- 证据不足、模式冲突或生成代码占比过高：降级为 limitations，不把不确定模式写成规则。
- 重新挖掘后与现有 marked block 无实质变化：不要为更新时间戳、排序或同义改写而重写文件；输出 `refresh_noop` 和本次验证过的 source refs / limitations。

## Quality Checks

- 规则块 <=1000 words；中文按连续中文字符粗略折算，宁可少写。
- 每条规则都能指向当前目标仓库证据；路径在文件树中真实存在。
- 规则只描述“当前项目如何做”，不提出重构建议，不评价团队好坏。
- 不把 language/framework 默认、formatter/linter 已强制项或生成代码习惯写成项目规则。
- 多包或混合框架仓库中，跨包规则只写稳定通用模式；包级规则必须带适用范围，并提示改具体子项目先跟随本包现有结构。
- 存在历史例外或旧项目反例时，用“新增代码优先沿用主模式”“不要扩大历史例外”这类收窄表达；不要写成“全仓库统一/只/永远/不得”的绝对事实。
- `docs/ai/project-rules.md` 是默认 canonical full rules；`AGENTS.md`、`CLAUDE.md` 和其他非 inline 工具文件默认只写 pointer。
