# skills 项目架构篇

文档日期：2026-03-22
分析对象：`/Users/kuang/xiaobu/skills`
分支基线：`main`

## 1. 项目一句话定义

`skills` 不是一个传统意义上的软件系统，而是一个“可安装的 agent 技能目录仓库”。

它的核心产物不是二进制、服务端或运行时，而是一组按目录组织的 `SKILL.md` 工作流说明，供上层 agent 在不同场景下按需加载。

可以把它理解为：

```text
            skills
               |
   +-----------+-----------+
   |                       |
Skill 定义层            少量辅助资源层
   |                       |
SKILL.md 工作流          REFERENCE.md / shell script
   |                       |
告诉 agent 怎么做         提供长文档或确定性脚本
```

## 2. 顶层目录结构

```text
skills/
├── README.md                         技能目录总览与安装方式
├── LICENSE                           MIT 许可证
├── tdd/                              最完整的复合型 skill
│   ├── SKILL.md
│   ├── tests.md
│   ├── mocking.md
│   ├── interface-design.md
│   ├── deep-modules.md
│   └── refactoring.md
├── improve-codebase-architecture/    skill + REFERENCE.md
├── git-guardrails-claude-code/       skill + shell hook script
├── prd-to-plan/                      单文件 workflow skill
├── triage-issue/                     单文件 workflow skill
├── write-a-prd/                      单文件 workflow skill
├── write-a-skill/                    单文件 workflow skill
└── 其他若干 skill 目录
```

核心判断：

- 仓库的主资产是各目录下的 `SKILL.md`。
- `tdd/` 是最接近“模块化知识包”的目录，包含主 skill 和多份附属参考材料。
- `git-guardrails-claude-code/` 是少数带可执行脚本的 skill，说明该仓库允许“文档 + 小脚本”混合交付。
- 整个仓库没有看到独立的构建系统、模板生成器、测试目录或统一运行时。

### 2.1 全量 skill 功能表

| Skill | 类别 | 主要功能 | 典型输入 | 典型输出 | 附属资源 |
| --- | --- | --- | --- | --- | --- |
| `write-a-prd` | 规划设计 | 通过用户访谈、代码探索和模块设计产出 PRD，并提交为 GitHub issue | 新功能想法、问题陈述、现有仓库上下文 | PRD issue | 无 |
| `prd-to-plan` | 规划设计 | 把 PRD 拆成多阶段 tracer-bullet 实施计划，写入本地 `./plans/` | 已有 PRD、代码库架构信息 | Markdown plan 文件 | 无 |
| `prd-to-issues` | 规划设计 | 把 PRD 拆成可独立领取的 GitHub issues，按 vertical slices 切分 | 已有 PRD、里程碑想法 | 多个 GitHub issues | 无 |
| `grill-me` | 规划设计 | 持续追问计划或设计中的所有关键决策，并给出推荐答案 | 一个方案、设计草图、架构思路 | 被澄清后的决策树与共识 | 无 |
| `design-an-interface` | 规划设计 | 为模块生成多种差异明显的接口设计方案，并对比优劣 | 模块目标、约束、调用场景 | 多版 API/interface 设计提案 | 无 |
| `request-refactor-plan` | 规划设计 | 通过访谈和代码探索生成详细重构计划，强调小步提交，并提交为 GitHub issue | 重构目标、痛点描述、现有代码 | Refactor RFC / issue | 无 |
| `tdd` | 开发实现 | 按 red-green-refactor 和 vertical slices 做测试驱动开发 | 新特性、bugfix、待实现行为 | 一组按行为组织的测试与最小实现 | `tests.md`、`mocking.md`、`interface-design.md`、`deep-modules.md`、`refactoring.md` |
| `triage-issue` | 开发实现 | 调查 bug 根因，并生成带 TDD 修复计划的 GitHub issue | 问题现象、报错描述、复现路径 | Root cause 分析 + fix plan issue | 无 |
| `improve-codebase-architecture` | 开发实现 | 从 AI 可导航性和 deep modules 角度发现架构改进点，并提出 RFC | 代码库、架构痛点、模块耦合问题 | 架构候选清单 + GitHub issue RFC | `REFERENCE.md` |
| `migrate-to-shoehorn` | 开发实现 | 将测试代码中的 `as` 类型断言迁移到 `@total-typescript/shoehorn` | TypeScript 测试文件、类型断言场景 | 更安全的测试数据构造方式 | 无 |
| `scaffold-exercises` | 开发实现 | 生成练习目录、题目、答案和 explainer 结构，并满足 lint 约束 | 课程章节名、练习主题、目录规范 | 标准化 exercises 目录结构 | 无 |
| `setup-pre-commit` | 工具配置 | 为当前仓库配置 Husky、lint-staged、Prettier、类型检查和测试的 pre-commit 流程 | 一个尚未配置提交钩子的仓库 | Husky 配置、lint-staged 配置、hook 文件 | 无 |
| `git-guardrails-claude-code` | 工具配置 | 为 Claude Code 安装危险 git 命令拦截 hook，阻止破坏性操作 | 项目或全局 Claude 配置 | hook 脚本 + settings.json 配置 | `scripts/block-dangerous-git.sh` |
| `write-a-skill` | 写作知识 | 创建新的 agent skill，定义结构、description、引用文档与脚本策略 | 新 skill 的目标、触发条件、参考资料 | 新 skill 目录与 `SKILL.md` 草案 | 无 |
| `edit-article` | 写作知识 | 重组文章章节、提升清晰度并压缩表述 | 文章草稿、已有标题结构 | 更清晰的文章版本 | 无 |
| `ubiquitous-language` | 写作知识 | 从当前对话抽取 DDD 风格术语表，消除歧义并固化术语 | 领域讨论、产品语言、当前会话上下文 | `UBIQUITOUS_LANGUAGE.md` | 无 |
| `obsidian-vault` | 写作知识 | 在固定 Obsidian vault 中搜索、创建和组织笔记，使用 wikilinks 和 index notes | 关键词、笔记标题、知识点草稿 | 新笔记、索引笔记、反向链接结果 | 无 |

## 3. 核心设计思想

### 3.1 skill 是最小发布单元

这个仓库的设计不是“做一个平台，再往里塞能力”，而是直接把能力拆成一个个可安装 skill：

```text
需求类型
   |
   +--> 规划类: write-a-prd / prd-to-plan / prd-to-issues / grill-me
   |
   +--> 开发类: tdd / triage-issue / improve-codebase-architecture
   |
   +--> 工具类: setup-pre-commit / git-guardrails-claude-code
   |
   +--> 写作知识类: write-a-skill / edit-article / ubiquitous-language
```

结果是：

- 每个目录只负责一个明确能力。
- 安装单位天然就是目录，而不是 feature flag 或插件注册表。
- skill 之间的协作更多依赖 agent 自己选择与串联，而不是仓库里的编排器。

### 3.2 以自然语言流程为主，而不是代码驱动

这个仓库的核心实现方式是“在 `SKILL.md` 中定义流程、约束、提问顺序、输出格式”。

例如：

- `tdd/SKILL.md` 明确规定 red-green-refactor、vertical slices、public interface testing。
- `prd-to-plan/SKILL.md` 明确规定如何从 PRD 拆出 tracer-bullet phases。
- `triage-issue/SKILL.md` 明确规定如何先做 root cause，再输出 GitHub issue。

这说明其主要工程思想是：

- 用高质量操作说明替代大量框架代码。
- 让 agent 通过文档执行工作流，而不是通过运行时状态机执行。

### 3.3 渐进展开而不是把所有知识塞进一个文件

虽然大部分 skill 很轻，但仓库并不是把所有内容都塞进单个 `SKILL.md`。

代表性模式：

- `tdd/` 把测试哲学、mocking、interface design、deep modules、refactoring 分拆成多个引用文件。
- `improve-codebase-architecture/` 用 `REFERENCE.md` 承载更详细的依赖分类和 RFC 模板。
- `git-guardrails-claude-code/` 把确定性逻辑下沉到 shell 脚本。

这体现出一种轻量的 progressive disclosure 设计：

- 默认先读主 skill。
- 需要细节时再看一层引用文件。
- 只有确定性动作才交给脚本执行。

## 4. 项目运行主链路

### 4.1 安装链路

从 `README.md` 看，这个仓库的主要使用方式是：

```text
npx skills@latest add <owner/repo/skill-name>
```

例如：

```text
npx skills@latest add mattpocock/skills/tdd
```

设计含义：

- 仓库本身不是最终运行入口。
- 它假设存在一个外部技能安装分发机制 `skills@latest`。
- 每个子目录都被当成一个独立可分发单元。

### 4.2 执行链路

典型执行方式不是“启动服务”或“调用 CLI”，而是：

```text
用户提出任务
  -> agent 根据描述命中某个 skill
  -> 读取对应 SKILL.md
  -> 按步骤探索代码 / 提问 / 输出文件 / 调用工具
```

因此这个仓库的运行主链路本质上是“被动加载”：

- 仓库提供指令资产。
- agent 宿主负责发现、加载和执行。
- 真正的控制流留在 agent 会话里，而不在仓库代码里。

### 4.3 扩展链路

skill 的扩展方式主要有三种：

1. 新增一个目录并放入 `SKILL.md`
2. 如果内容太长，增加 `REFERENCE.md` 或附属文档
3. 如果动作可确定，增加 `scripts/` 下的小脚本

这说明仓库的演进单位也很简单：

- 增加 skill
- 增加附属说明
- 增加小型工具脚本

而不是扩展统一框架或插件 API。

### 4.4 skill 驱动的会话流程自动化

这个仓库虽然没有统一编排器，但大量 `SKILL.md` 都在定义一种“会话内自动推进”的流程。

它的抽象可以写成：

```text
用户触发 skill
  -> agent 命中 description / Use when
  -> 读取 skill 步骤
  -> 自动决定先问什么、查什么、产出什么
  -> 在必要节点回到用户确认
  -> 继续推进直到生成 issue / plan / 文件 / 配置
```

也就是说，自动化不在仓库级 runtime，而在单个会话里的“流程脚本化”。

#### 自动化链路的共性阶段

多数 skill 都反复出现同一类阶段：

1. 触发与命中  
   依赖 frontmatter 的 `description` 和 `Use when` 判断是否加载 skill。

2. 最小化澄清  
   只问 1 个或少量必要问题，不做长时间前置讨论。

3. 上下文获取  
   自动探索代码库、读取 PRD、查看现有文件、必要时读取 issue。

4. 中间结构化推导  
   例如切 phase、拆 issue、找 root cause、设计接口候选、归纳术语表。

5. 分叉点确认  
   在关键节点把候选方案呈现给用户，让用户选方向或确认粒度。

6. 产物生成  
   自动写本地 Markdown、创建 GitHub issue、创建目录、写配置、生成 glossary。

7. 可选验证  
   某些 skill 会要求 lint、smoke test 或 hook 测试。

#### 典型自动化模式表

| 自动化模式 | 代表 skill | 自动化动作 | 人工介入点 | 最终产物 |
| --- | --- | --- | --- | --- |
| 访谈驱动 | `write-a-prd`、`grill-me`、`request-refactor-plan` | 连续提问、收敛需求、补齐决策树 | 回答问题、确认范围 | PRD、refactor plan、澄清后的方案 |
| 探索驱动 | `triage-issue`、`improve-codebase-architecture` | 自动探索代码、定位问题、归纳候选项 | 选择候选方向或确认结论 | Root cause、架构候选、RFC issue |
| 规划驱动 | `prd-to-plan`、`prd-to-issues` | 从 PRD 自动拆 phase 或 issue，并组织依赖顺序 | 确认粒度、确认拆分 | 计划文档、issue 列表 |
| 生成驱动 | `scaffold-exercises`、`ubiquitous-language`、`write-a-skill` | 自动创建目录、文件、术语表、skill 草案 | 提供主题或审阅草稿 | 本地文件、skill 草案、知识文档 |
| 配置驱动 | `setup-pre-commit`、`git-guardrails-claude-code` | 自动写配置、hook、脚本并执行验证 | 选择安装范围或是否定制 | hook 配置、脚本、settings 更新 |
| 并行设计驱动 | `design-an-interface`、`improve-codebase-architecture` | 并行生成多个 radically different 方案并比较 | 选择推荐方案或要求混合 | 多版接口方案、推荐设计 |

#### 每个 skill 的自动化会话形态

| Skill | 自动化会话形态 |
| --- | --- |
| `write-a-prd` | 用户描述问题 -> agent 探索代码库 -> 连续访谈补齐方案 -> 自动写成 PRD issue |
| `prd-to-plan` | 读取 PRD -> 探索代码库 -> 自动切 vertical slices -> 让用户确认粒度 -> 写入 `./plans/` |
| `prd-to-issues` | 读取 PRD issue -> 可选探索代码库 -> 自动拆成依赖有序的多个 issue -> 批量创建 GitHub issues |
| `grill-me` | 围绕一个方案不断追问和推荐 -> 逐步消解决策树中的歧义 -> 收敛到共享理解 |
| `design-an-interface` | 获取模块需求 -> 并行拉起多个设计方案 -> 自动比较 trade-offs -> 请求用户选型 |
| `request-refactor-plan` | 访谈问题与候选方案 -> 探索仓库与测试覆盖 -> 自动拆 tiny commits -> 写成重构 issue |
| `tdd` | 先确认接口和优先行为 -> 一轮轮执行 red-green-refactor -> 每次只推进一个 vertical slice |
| `triage-issue` | 获取简短问题描述 -> 立即探索和诊断 -> 自动设计 TDD fix plan -> 创建 issue |
| `improve-codebase-architecture` | 自然探索代码库 -> 列出 deepening 候选 -> 用户选一个 -> 并行生成多版接口 -> 创建 RFC issue |
| `migrate-to-shoehorn` | 询问测试文件范围 -> 查找 `as` 断言 -> 自动迁移测试写法 -> 收敛到更安全的测试数据构造 |
| `scaffold-exercises` | 解析练习计划 -> 自动建目录与 stub 文件 -> 跑 lint -> 提交 commit |
| `setup-pre-commit` | 检查当前仓库工具链 -> 自动写 Husky / lint-staged / Prettier 配置 -> 做 smoke test |
| `git-guardrails-claude-code` | 询问安装范围 -> 复制脚本 -> 更新 Claude settings -> 可选定制规则 -> 验证拦截行为 |
| `write-a-skill` | 收集需求 -> 自动起草 `SKILL.md` 和附属资源建议 -> 给用户审阅修订 |
| `edit-article` | 先按标题拆章节 -> 与用户确认结构 -> 逐段重写优化 -> 产出压缩后的文章 |
| `ubiquitous-language` | 从当前会话提取术语 -> 自动归一术语和歧义 -> 写 `UBIQUITOUS_LANGUAGE.md` |
| `obsidian-vault` | 在固定 vault 中按命名和链接规则搜索/创建/整理笔记 -> 输出新笔记或索引结果 |

#### 关键判断

- 这套自动化是“会话流程自动化”，不是“后台系统自动化”。
- 自动化的执行单元是一个 skill，而不是整个仓库。
- 自动化推进依赖 agent 理解文档并调用工具，而不是仓库内部存在统一状态机。
- 因此它非常轻，但也更依赖 skill 文本质量和宿主 agent 的执行能力。

## 5. 代表性子系统逻辑

严格来说，这个仓库没有像 gstack `/browse` 那样的“程序核心子系统”。更准确的说法是，它有若干“代表性 skill 模式”。

### 5.1 workflow skill 模式

这是仓库里最常见的模式，典型例子：

- `prd-to-plan`
- `triage-issue`
- `write-a-prd`
- `request-refactor-plan`

共同特征：

- 通过 numbered steps 描述流程。
- 规定要问什么问题、何时探索代码、输出到哪里。
- 往往包含固定模板，如 GitHub issue 模板或 Markdown plan 模板。

这种模式本质上是“流程即产品”。

### 5.2 knowledge bundle 模式

典型例子是 `tdd/`。

结构如下：

```text
tdd/
  SKILL.md
  tests.md
  mocking.md
  interface-design.md
  deep-modules.md
  refactoring.md
```

它不是单一 prompt，而是一个围绕主题组织的小知识包：

- `SKILL.md` 负责主流程。
- 其他文档负责原则、反例和细节补充。

这使 `tdd` 成为仓库中最“体系化”的 skill。

### 5.3 script-backed skill 模式

`git-guardrails-claude-code` 是仓库里最接近“文档 + 可执行实现”的 skill。

它由两部分组成：

```text
SKILL.md
  -> 指导如何安装 hook
scripts/block-dangerous-git.sh
  -> 实际执行危险命令拦截
```

脚本逻辑很直接：

```text
读取 JSON 输入
  -> 取出 .tool_input.command
  -> 用危险模式列表逐条匹配
  -> 命中则 stderr 输出 BLOCKED 并 exit 2
```

价值：

- 把“危险 git 命令判断”从自然语言说明变成确定性行为。
- 同时保留轻量，不引入复杂运行时。

## 6. skill 系统公共逻辑

这个仓库没有发现像 gstack 顶层 `SKILL.md` 那样的统一 preamble，也没有看到生成器把公共逻辑注入到每个 skill。

因此它的“公共逻辑”更像是一组约定俗成的写法，而不是显式共享运行时。

### 6.1 统一的 frontmatter 约定

所有 skill 基本都以类似 frontmatter 开头：

```yaml
---
name: ...
description: ...
---
```

其中 `description` 的作用很关键：

- 说明 skill 提供什么能力。
- 明确 “Use when ...” 触发条件。

这说明 skill 被发现和选择时，高度依赖描述文本质量。

### 6.2 统一的流程写法

虽然没有统一模板文件，但多数 skill 都共享类似结构：

1. 定义任务目标
2. 给出分步骤流程
3. 明确提问点或探索点
4. 规定输出物格式

这意味着它们在风格层面是统一的，但统一性来自作者习惯，而不是编译系统。

### 6.3 输出导向明显

很多 skill 不只是“给建议”，而是直接要求产出具体工件：

- 本地 Markdown plan
- GitHub issue
- 重构 RFC
- 新 skill 目录

所以这套仓库虽然轻量，但它不是纯咨询型 prompt 集合，而是偏“交付驱动”的 agent 工作流库。

## 7. 安全与确定性逻辑

### 7.1 安全逻辑不是全局能力，而是局部 skill 能力

在这个仓库里，安全不是像 gstack 那样的系统级公共能力，而是由某个 skill 单独提供。

最典型的是：

- `git-guardrails-claude-code`

它负责拦截高风险 git 动作，如：

- `git push`
- `git reset --hard`
- `git clean -f/-fd`
- `git branch -D`
- `git checkout .`
- `git restore .`

### 7.2 确定性脚本只覆盖窄问题

仓库里的脚本很少，说明设计立场是：

- 能用说明文档解决的，不写代码。
- 只有当行为足够确定、重复且风险较高时，才下沉成脚本。

这是很克制的工程取舍。

## 8. skill 之间的依赖与协作关系

这个仓库的 skill 协作关系是“语义流程耦合”，而不是代码依赖耦合。

### 8.1 典型主流程

从 README 的分组和 skill 内容看，可以抽出一条常见链路：

```text
/write-a-prd
    |
    v
/prd-to-plan
    |
    +------> /prd-to-issues
    |
    v
/tdd
    |
    +------> /triage-issue
    +------> /improve-codebase-architecture
    |
    v
/write-a-skill 或其他交付型 skill
```

这里的协作方式不是仓库自动编排，而是：

- 前一个 skill 产出的文档进入上下文。
- 后一个 skill 基于这些上下文继续工作。

### 8.2 planning 与 development 分层明显

README 已经把 skill 分成四类：

- Planning & Design
- Development
- Tooling & Setup
- Writing & Knowledge

这说明作者对仓库的组织思想是“按任务域分层”，而不是按技术实现分层。

## 9. 项目最关键的工程取舍

### 9.1 选择“技能目录”而不是“统一平台”

这是本项目最大的结构性判断。

- 好处是极轻量、易安装、易新增、易理解。
- 代价是缺乏统一运行时、缺乏共享状态、缺乏全局协议与自动化校验。

换句话说，这个仓库优先优化的是“分发和复用 skill”，不是“把 agent 工作变成一个完整操作系统”。

### 9.2 选择“高质量说明文档”而不是“代码框架”

这个仓库把工程投入主要放在：

- 触发描述是否准确
- 步骤是否清晰
- 输出模板是否可复用

而不是放在：

- 代码生成器
- runtime 管理
- 多宿主适配层
- 测试与遥测系统

这让它更像“技能内容仓库”，而不是“技能平台工程”。

### 9.3 允许局部脚本化，但拒绝过度系统化

`git-guardrails-claude-code` 证明作者并不排斥脚本；
但脚本只用于一个很窄、很确定的问题。

这反映出一个明显取舍：

- 复杂度尽量留在 agent 自身。
- 仓库侧只补最必要的确定性工具。

## 10. 如何理解整个项目

如果用一句更工程化的话总结：

```text
skills = skill 目录集合
       + 约定式 frontmatter
       + 分步工作流文档
       + 少量参考资料
       + 极少量确定性脚本
```

如果用产品形态来理解：

```text
用户任务
 |
 +--> 规划: write-a-prd / prd-to-plan / grill-me
 |
 +--> 开发: tdd / triage-issue / improve-codebase-architecture
 |
 +--> 工具: setup-pre-commit / git-guardrails-claude-code
 |
 +--> 知识写作: write-a-skill / edit-article / ubiquitous-language / obsidian-vault
```

它更像一个“技能应用商店源码仓库”，每个目录是一件可安装商品。

## 11. 结论

这个仓库的真正价值不在复杂工程系统，而在它把常见 agent 工作模式提炼成了可分发、可复用、可组合的 skill 单元：

- 有清晰的任务域划分。
- 有稳定的 skill 目录结构。
- 有统一的 frontmatter 触发描述。
- 有少量渐进展开文档。
- 有必要时下沉的确定性脚本。

但它和 gstack 的本质不同：

- gstack 更像“AI 软件工程操作系统”。
- `skills` 更像“高质量 agent 工作流素材库”。

所以从本质上说，`skills` 不是一个带强运行时的 agent 平台，而是一个面向 agent 的轻量技能分发仓库。
