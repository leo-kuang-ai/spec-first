# Skills 功能列表

来源：`/Users/kuang/xiaobu/skills`

说明：以下内容根据每个 `SKILL.md` 的 `description`、主流程和附属文档整理，目标是快速看清每个 skill 解决什么问题、适合什么时候用、会做哪些事。

## Skill 清单

| 序号 | Skill |
|---|---|
| 1 | `design-an-interface` |
| 2 | `edit-article` |
| 3 | `git-guardrails-claude-code` |
| 4 | `grill-me` |
| 5 | `improve-codebase-architecture` |
| 6 | `migrate-to-shoehorn` |
| 7 | `obsidian-vault` |
| 8 | `prd-to-issues` |
| 9 | `prd-to-plan` |
| 10 | `request-refactor-plan` |
| 11 | `scaffold-exercises` |
| 12 | `setup-pre-commit` |
| 13 | `tdd` |
| 14 | `triage-issue` |
| 15 | `ubiquitous-language` |
| 16 | `write-a-prd` |
| 17 | `write-a-skill` |

## 功能总表

| 分类 | Skill | 核心功能 | 典型触发/场景 | 主要动作/产出 |
|---|---|---|---|---|
| 规划与设计 | `write-a-prd` | 通过访谈、代码库探索和模块设计来撰写 PRD，并提交为 GitHub issue。 | 需要写 PRD、定义产品需求、规划新功能。 | 访谈需求、梳理用户故事、写出实施决策和测试决策、生成 PRD issue。 |
| 规划与设计 | `prd-to-plan` | 把 PRD 拆成分阶段的 tracer-bullet 实施计划，并保存到本地 `./plans/`。 | 需要把 PRD 转成可执行计划、里程碑或分阶段方案。 | 识别持久架构决策、拆分阶段、确认范围、写入 Markdown 计划文件。 |
| 规划与设计 | `prd-to-issues` | 把 PRD 拆成可独立领取的 GitHub issues，强调端到端的垂直切片。 | 需要把 PRD 拆任务、创建 implementation tickets。 | 生成 HITL/AFK issue 列表，确认依赖关系，逐个创建 GitHub issue。 |
| 规划与设计 | `grill-me` | 对方案或设计进行高强度追问，直到所有分支决策都被澄清。 | 需要压力测试方案、做设计评审、补齐决策树。 | 连续提问、给出推荐答案、逐项收敛不确定性。 |
| 规划与设计 | `design-an-interface` | 针对模块设计多种截然不同的接口方案，再比较权衡。 | 设计 API、探索模块形态、比较接口方案、想“design it twice”。 | 并行生成多个设计、展示接口签名和使用方式、比较优缺点、合成推荐方案。 |
| 规划与设计 | `request-refactor-plan` | 通过访谈、代码库核查和测试覆盖检查，制定细粒度重构计划并提交 issue。 | 需要规划重构、写 refactoring RFC、拆解安全增量步骤。 | 明确问题与范围、评估测试、拆成 tiny commits、写 GitHub issue。 |
| 开发 | `tdd` | 用红-绿-重构循环进行测试驱动开发，强调通过公共接口测试行为。 | 需要做 TDD、red-green-refactor、补集成测试。 | 先定测试行为、一次写一个测试、最小实现、最后重构；附带 `tests.md`、`mocking.md`、`interface-design.md`、`deep-modules.md` 指南。 |
| 开发 | `triage-issue` | 调查 bug 或问题根因，并生成带 TDD 修复计划的 GitHub issue。 | 用户报 bug、要 triage、要定位根因。 | 调查代码路径、分析根因、设计 RED-GREEN 修复步骤、输出 issue。 |
| 开发 | `improve-codebase-architecture` | 从架构角度探索代码库，找出浅模块和可深化的重构机会。 | 想改进架构、提高可测试性、减少耦合、让代码更易导航。 | 探索代码库、列出候选重构点、分析依赖类别、形成 RFC issue。 |
| 开发 | `migrate-to-shoehorn` | 把测试里的 `as` 类型断言迁移成 `@total-typescript/shoehorn`。 | 测试里需要部分对象、想去掉 `as`/`as unknown as`。 | 用 `fromPartial`、`fromAny`、`fromExact` 替代断言，并补齐导入。 |
| 开发 | `scaffold-exercises` | 按课程规划搭建练习目录结构、说明文件和基础内容。 | 要 scaffold exercises、创建练习骨架、设置课程章节。 | 创建 section/exercise 目录、写 `readme.md`、跑 lint 验证结构。 |
| 工具与设置 | `setup-pre-commit` | 配置 Husky、lint-staged、Prettier、typecheck 和 test 的 pre-commit 钩子。 | 想加提交前检查、自动格式化和基础质量门禁。 | 安装依赖、初始化 Husky、写 `.husky/pre-commit`、`.lintstagedrc`、必要时补 `.prettierrc`。 |
| 工具与设置 | `git-guardrails-claude-code` | 为 Claude Code 配置钩子，阻止危险 git 命令。 | 想防止 `git push`、`reset --hard`、`clean -f` 等破坏性操作。 | 询问作用范围、复制 hook 脚本、写入 settings、验证拦截效果。 |
| 写作与知识 | `edit-article` | 通过重组章节、提升清晰度和压缩表达来编辑文章。 | 要改写文章、润色文稿、优化结构。 | 先分章节并确认，再逐段改写；要求段落更短、更清晰。 |
| 写作与知识 | `ubiquitous-language` | 从对话中提炼领域词汇表，识别歧义并写入 `UBIQUITOUS_LANGUAGE.md`。 | 需要定义领域术语、构建 glossary、统一命名。 | 扫描对话、提炼术语、标注歧义、写出关系和示例对话。 |
| 写作与知识 | `obsidian-vault` | 搜索、创建和整理 Obsidian 笔记，使用 wikilink 和 index note。 | 需要在 Obsidian Vault 中找笔记、建笔记、整理结构。 | 按固定命名创建/搜索笔记、维护索引页、用 `[[wikilinks]]` 组织关联。 |
| 写作与知识 | `write-a-skill` | 创建新的 agent skill，包含结构化说明、可选参考文件和脚本。 | 想新建 skill 或扩展现有 skill。 | 访谈需求、搭建 `SKILL.md`、必要时拆分参考文件和脚本、复审覆盖面。 |

## 逐个 Skill 小节

### `design-an-interface`
针对模块设计多种截然不同的接口方案，再比较权衡，适合做 API 设计和接口取舍。

### `edit-article`
通过重组章节、提升清晰度和压缩表达来编辑文章，适合文章改写和润色。

### `git-guardrails-claude-code`
为 Claude Code 配置钩子，阻止危险 git 命令，适合做 git 安全限制。

### `grill-me`
对方案或设计进行高强度追问，直到所有分支决策都被澄清，适合做方案压力测试。

### `improve-codebase-architecture`
从架构角度探索代码库，找出浅模块和可深化的重构机会，适合做架构改进。

### `migrate-to-shoehorn`
把测试里的 `as` 类型断言迁移成 `@total-typescript/shoehorn`，适合清理测试类型断言。

### `obsidian-vault`
搜索、创建和整理 Obsidian 笔记，适合管理知识库和笔记索引。

### `prd-to-issues`
把 PRD 拆成可独立领取的 GitHub issues，适合拆分端到端垂直切片任务。

### `prd-to-plan`
把 PRD 拆成分阶段的 tracer-bullet 实施计划，并保存到本地，适合输出执行计划。

### `request-refactor-plan`
通过访谈、代码库核查和测试覆盖检查，制定细粒度重构计划并提交 issue。

### `scaffold-exercises`
按课程规划搭建练习目录结构、说明文件和基础内容，适合生成练习骨架。

### `setup-pre-commit`
配置 Husky、lint-staged、Prettier、typecheck 和 test 的 pre-commit 钩子，适合提交前质量门禁。

### `tdd`
用红-绿-重构循环进行测试驱动开发，强调通过公共接口测试行为，适合 TDD 开发和修复。

### `triage-issue`
调查 bug 或问题根因，并生成带 TDD 修复计划的 GitHub issue，适合故障排查。

### `ubiquitous-language`
从对话中提炼领域词汇表，识别歧义并写入 `UBIQUITOUS_LANGUAGE.md`，适合统一术语。

### `write-a-prd`
通过访谈、探索和模块设计写 PRD，并作为 GitHub issue 提交，适合需求文档编写。

### `write-a-skill`
创建新的 agent skill，包含结构化说明、可选参考文件和脚本，适合新增技能能力。

## 补充说明

| Skill | 备注 |
|---|---|
| `tdd` | 额外包含 `tests.md`、`mocking.md`、`deep-modules.md`、`interface-design.md`、`refactoring.md`，用于细化测试和重构原则。 |
| `improve-codebase-architecture` | 额外包含 `REFERENCE.md`，定义依赖分类、测试策略和 issue 模板。 |
| `scaffold-exercises` | 强调目录结构、命名规则和 lint 约束，偏向课程/练习仓库初始化。 |
| `setup-pre-commit` | 默认会检测包管理器并适配 `npm`、`pnpm`、`yarn` 或 `bun`。 |
| `git-guardrails-claude-code` | 需要明确安装范围是项目级还是全局级。 |
