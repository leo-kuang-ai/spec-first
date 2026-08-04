# Project Profiles

仅当目标 repo 的本地规则、治理、catalog 或 source/runtime generator 会改变 patch 时读取。Portable core 不依赖本文件。

## Discovery

按权威顺序读取：

1. 目标 repo 的 `AGENTS.md`、`CLAUDE.md` 或明确项目规则；
2. 项目声明的 canonical Skill source root；
3. governance/registry/catalog generator；
4. tests、logs 和当前 runtime 仅用于验证或 drift 证据。

Project profile 必须说明 source、producer、consumer、authority 与失效方式。找不到 canonical owner 时保持 `preview-only`。

## Spec-First Profile

在 spec-first repo 中：

- Skill source 是 `skills/<skill-name>/`；
- workflow/standalone/internal delivery 由 `src/cli/contracts/dual-host-governance/skills-governance.json` 管理；
- Claude command metadata source 在 `templates/claude/commands/spec/`；
- `docs/catalog/runtime-capabilities.md` 是 generator 生成的只读 catalog；
- `.claude/`、`.codex/`、`.agents/skills/`、`.cursor/`、`.kiro/`、`.qoder/` 是 generated runtime surfaces；
- source 变化更新 tests、必要 docs 和 `CHANGELOG.md`；runtime 通过 `spec-first init` 重建。

新增 user-visible Skill 时先更新 source/governance，再运行 `npm run docs:runtime-catalog` 和项目批准的 runtime projection。不要把 catalog 或 runtime patch 当 source change。

## Non-Spec-First Projects

只采用目标 repo 已声明的规则。不得创建 spec-first governance JSON、命令模板、catalog 或 runtime projection，除非用户明确要求在该项目采用这些机制。

## Multiple Projects Or Sources

一次 invocation 只允许一个 mutation target。多个 repo、多个 canonical candidates 或 source/runtime 冲突时：

- 分别报告候选与证据；
- 不 batch apply；
- 要求用户选择 target/source owner，或保持 validate-only。
