---
name: spec-rule-miner
description: "Use this standalone skill when the user asks to mine a repo's existing coding conventions for future AI coding, generate or refresh project rules in AGENTS.md, create .cursorrules or Copilot/Cursor/Kiro/Qoder/Claude pointer rules from actual code evidence, or make AI-generated code follow a specific project's habits. Do not use for team standards governance, normal code review/debug/refactor work, linter/formatter configuration, generic best practices, or generated runtime mirror edits."
---

# Spec Rule Miner

`spec-rule-miner` 从目标仓库的真实代码中提炼项目级 AI 编码规则，并把规则写入 `AGENTS.md` 这类 agent 可读配置。它是 standalone skill，不是 `/spec:*` 或 `$spec-*` workflow。

核心产物是 <=1000 words 的项目规则块，规则必须来自当前目标仓库证据，而不是语言默认、个人偏好或通用最佳实践。

## 触发与近邻边界

- 使用本 skill：用户要“分析项目风格”“学习代码规范”“生成项目规则”“挖掘编码习惯”“让 AI 像团队一样写代码”，或明确要生成 `AGENTS.md`、`.cursorrules`、Copilot/Cursor/Kiro/Qoder/Claude 规则文件。
- 不使用本 skill：用户要审查当前 diff、修复代码、重构、调试、写 lint/format 配置、生成通用语言规范，或治理 `docs/standards/**` confirmed team standards。
- 近邻路由：团队标准的查询/提升/废弃走 `spec-team-standards-governance`；代码质量评审走 `$spec-code-review`；实际实现或修复走 `$spec-work`；创建或修改 spec-first source skill 走 `$spec-write-skill`。

## 硬边界

- 只读目标仓库代码；不要修改业务源码、测试、构建配置或 formatter/linter 配置。
- 不手改 generated runtime mirrors，例如 `.claude/`、`.codex/`、`.agents/skills/`、`.cursor/skills/`、`.kiro/skills/`、`.qoder/skills/` 或 spec-first managed runtime state。
- 写入规则文件前必须 preview 规则正文和目标文件；交互可用时等待用户确认。只有用户明确要求直接写入，或宿主/调用参数明确证明当前运行是 headless/non-interactive，才使用默认目标；普通聊天里用户暂未回复不能算 headless。默认写入必须在 closeout 记录 `headless_default_write`、目标文件和限制。
- 不覆盖用户已有规则。读取目标文件后，只替换 `spec-rule-miner` markers 内的旧块；无 markers 时追加；疑似旧版无 marker 输出时先询问替换还是追加。
- 每条规则必须有当前仓库证据：默认至少 2 个文件支撑；小仓库样本不足时降级说明 sample-size；不确定或 50/50 分裂的模式不写成规则。
- 不泄露敏感信息：密钥、内部 URL、私有包名、账号、生产路径、安全实现细节只用于判断，不进入规则正文。

## 工作流

1. 明确 `target_repo`。父级多仓工作区必须先锁定一个目标仓库；不清楚时只问一个问题。
2. 盘点仓库形态：根目录、主要语言、源码目录、测试目录、配置文件、生成物/依赖目录和已有 agent rule 文件。
3. 过滤读取范围：跳过依赖、构建产物、锁文件、minified 文件、二进制、vendored/generated 代码；大仓库使用分层抽样并在 preview 中披露。
4. 读取并记录证据。抽取前先读 [Pattern Categories](references/pattern-categories.md)，用其中类别组织证据；配置已强制的 formatter/linter 规则只记录为“已由工具处理”，不要重复写入 AI 规则。
5. 合成规则：按 `frequency x deviation from defaults` 排序，保留高频且偏离默认的做法；必须包含至少一个 hidden association 和至少一个 anti-pattern，除非证据明确不存在，并在 preview 限制中说明。
6. Preview：展示将写入的规则块、目标文件、word count、采样/证据限制，以及每个规则组的代表性 source refs。规则正文不要包含挖掘过程元说明。
7. 写入前读 [Write Targets](references/write-targets.md)，按目标文件的 marker、frontmatter、pointer/inline 规则执行。默认写 `AGENTS.md`，并给 `CLAUDE.md` 写指向 `AGENTS.md` 的轻量 pointer。
8. 收尾输出：列出写入文件、规则字数、是否采样、未写入的近邻工具文件、需要用户手动检查的限制；如果没有写文件，说明 preview-only 状态；如果因 headless 走默认写入，必须说明 `headless_default_write` 的证据来源。

## 输出合同

Preview 和最终回复都必须区分：

- `rules_block`：将写入文件的纯规则正文，使用 `spec-rule-miner-start` / `spec-rule-miner-end` markers。
- `evidence_summary`：每个规则组的代表性文件路径和样本限制；不写入规则文件，除非用户明确要求。
- `target_files`：默认与用户指定的输出文件，说明 pointer 还是 inline。
- `limitations`：小样本、大仓库抽样、混合语言、生成代码占比高、冲突模式跳过、headless 默认写入等限制。

## 质量检查

- 规则块 <=1000 words；中文按连续中文字符粗略折算，宁可少写。
- 每条规则都能指向当前目标仓库证据；路径在文件树中真实存在。
- 规则只描述“当前项目如何做”，不提出重构建议，不评价团队好坏。
- 不把 language/framework 默认、formatter/linter 已强制项或生成代码习惯写成项目规则。
- `AGENTS.md` 是 canonical full rules；除 completion/inline 场景外，其他工具文件默认只写 pointer。
