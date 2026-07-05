# Claude/Codex 双宿主工作流整改清单全局分析

> Lifecycle: historical-input / external-reference. 本文保留旧架构、方案、迁移或研究记录；当前 source of truth 以 `docs/README.md`、根目录 README、`docs/05-用户手册/`、`docs/contracts/`、`skills/`、`src/cli/` 和 `CHANGELOG.md` 为准。

- 日期：`2026-04-16`
- 目标文档：`docs/06-待办事项/2026-04-16-Claude-Codex-双宿主-skill-整改清单.md`
- 审查口径：只以当前仓库代码、runtime 同步实现、SKILL 文档真源为依据
- 对标上下文：延续 `docs/业界分析/9.spec-first-vs-compound-engineering-plugin-全量同步审计-2026-04-14.md` 的产品对标，但本篇不重复做跨仓结论外推
- 范围说明：
  - 审查 `skills/*` 全量 `47` 个 skill 的产品面与运行面关系
  - 核查 `plugin manifest -> adapter -> init -> sync -> state -> doctor -> clean` 主链路
  - 跳过测试文件，不以测试断言替代代码事实
  - `Skill(...)`、`skill:` 明确排除在用户可见入口治理之外

## 1. 执行摘要

这份整改清单的主方向是对的，而且抓住了当前系统最关键的问题：不是能力不够，而是产品面、宿主治理、文档路径、运行时收口没有真正闭环。

但从“顶尖 AI 研发效能产品”的要求看，当前清单仍有三个需要进一步校正的地方：

1. `13` 个 workflow source set 的结论成立，但它必须被精确定义为“由 `.claude-plugin/plugin.json` 的 `commands` 驱动的 command-backed workflow skill 集合”，而不是泛化成“仓库天然有 13 个 workflow”
2. “Stage-0 已被主工作流消费”只能写成“`spec-plan/spec-work/spec-code-review` 已内建 Stage-0 预载逻辑”，不能直接写成“`spec-graph-bootstrap` 已被自动注入主工作流”，因为 `spec-graph-bootstrap` 自身仍声明“自动注入是未来能力”
3. 当前清单对 P0/P1 的大方向判断基本正确，但仍漏掉少量会继续传播错误产品面的文件，例如 `skills/setup/SKILL.md` 和 `src/cli/index.js`

一句话判断：

当前仓库的**能力资产层**已经足够支撑“双宿主工作流产品”，但**产品入口层、分发治理层、宿主边界层**还没有形成业界领先产品应有的单一真源和机械校验闸门。

## 2. 审查方法

本次分析按三条证据链并行完成：

1. **主线程代码核查**
   - `src/cli/plugin.js`
   - `src/cli/adapters/base.js`
   - `src/cli/adapters/claude.js`
   - `src/cli/adapters/codex.js`
   - `src/cli/commands/init.js`
   - `src/cli/commands/doctor.js`
   - `src/cli/commands/clean.js`
   - `src/cli/state.js`
   - `src/cli/index.js`
   - `.claude-plugin/plugin.json`
   - `README.md`
2. **逐个 skill 事实复核**
   - 重点复核整改清单中列入 P0/P1 的 skill 文档
3. **多 reviewer 交叉审阅**
   - workflow 执行链完整性
   - runtime 分发与宿主治理模型
   - skill 文档整改可操作性

最终结论只保留能被代码和文档真源直接证实的部分。

## 3. 宏观审查

### 3.1 产品分层是否完整

从代码事实看，当前系统已经具备一个完整工作流产品应有的四层结构：

1. **产品真源层**
   - `.claude-plugin/plugin.json` 是 workflow command source set 的唯一真源
   - 其中定义了 `13` 个 command，对应 `13` 个 command-backed workflow skill
   - 证据：
     - `.claude-plugin/plugin.json:12-103`
     - `src/cli/plugin.js:57-72`
     - `src/cli/plugin.js:181-219`
2. **宿主适配层**
   - `ClaudeAdapter` 与 `CodexAdapter` 负责 runtime root、command root、skills root、agents root、内容变换规则
   - 证据：
     - `src/cli/adapters/claude.js:8-63`
     - `src/cli/adapters/codex.js:8-60`
3. **分发执行层**
   - `init` 负责 preview、清理旧资产、同步新资产、写 state、写 developer metadata、写语言治理
   - `doctor` 负责健康检查
   - `clean` 负责按 managed state 回收资产
   - 证据：
     - `src/cli/commands/init.js:82-172`
     - `src/cli/commands/doctor.js:60-90`
     - `src/cli/commands/clean.js:35-66`
4. **能力资产层**
   - `skills/` 为 skill 真源
   - `agents/` 为 agent 真源
   - command-backed workflow skill 与 standalone skill 已在分发层区分
   - 证据：
     - `src/cli/plugin.js:181-219`

结论：

**架构分层本身是完整的。**
问题不在“有没有层”，而在“层间治理模型是否足够表达双宿主产品契约”。

### 3.2 宿主治理模型是否完整

当前宿主治理模型还不完整。

代码里真实存在的治理轴只有一条：

1. `command-backed workflow skill`
2. `standalone skill`

这条轴来自 `manifest.commands[].skill`：

- `plugin.js` 先读取 manifest
- 再把 `manifest.commands.map((cmd) => cmd.skill)` 变成 `commandSkillNames`
- 再决定每个 skill 进入 `workflowsRoot` 还是 `skillsRoot`
- 证据：
  - `src/cli/plugin.js:181-219`

但是当前代码里**不存在**下列双宿主产品必须要有的维度：

1. `entry_surface`
   - workflow command
   - standalone skill
   - internal-only
2. `host_scope`
   - dual-host
   - host-exclusive
   - target-host-maintenance

全仓搜索没有看到 `entry_surface`、`host_scope` 这类真源字段。

这意味着当前系统虽然能复制 skill，但还不能用单一真源表达：

1. 哪些能力能被 Claude 对外暴露
2. 哪些能力能被 Codex 对外暴露
3. 哪些能力只是宿主维护能力
4. 哪些 token 只是内部 DSL

结论：

**整改清单把“宿主治理模型不完整”列为核心问题，是准确的。**
而且这是系统级问题，不是几个 SKILL 文案小修就能解决的。

### 3.3 整套体系是否完整

如果从“能力可用性”看，体系已经接近完整：

1. 有 Stage-0
2. 有 ideate / brainstorm / plan / work / review / compound 主链
3. 有 mcp-setup / update / setup 等外围支撑
4. 有 standalone skill 生态
5. 有 agents 分发与转换
6. 有 init / doctor / clean 运行面

但如果从“产品完成度”看，体系仍不完整，主要缺在三处：

1. **用户可见入口未完全收口**
   - Codex 仍被代码和文档双重暴露为 `spec-*`
2. **宿主专有能力没有被显式建模**
   - 例如 `claude-permissions-optimizer`
3. **静态治理闸门缺失**
   - 没有机械化 lint 去阻断旧 slash command、错误路径、过时变量

所以更准确的判断应该是：

**体系在能力层是完整的，在产品治理层还不完整。**

## 4. 微观审查

### 4.1 workflow source set 的定义是否清晰

整改清单里“当前仓库的 workflow 源集合仍然只有 `13` 个”这一结论成立，但需要更精确。

代码事实不是“仓库里自然只有 13 个 workflow”，而是：

1. `.claude-plugin/plugin.json` 里定义了 `13` 个 command
2. 每个 command 都绑定一个 `skill`
3. 这 `13` 个 `skill` 被分发逻辑视为 command-backed workflow skill
4. 其余 `34` 个 skill 被视为 standalone skill

核心证据：

- `.claude-plugin/plugin.json:12-103`
- `src/cli/plugin.js:57-72`
- `src/cli/plugin.js:181-219`
- `src/cli/commands/init.js:100-109`

因此，整改清单最好把“13 个 workflow source set”改写成：

> 当前代码中的 workflow source set，指 `.claude-plugin/plugin.json` 的 `commands` 数组所驱动的 `command-backed workflow skills` 集合，共 `13` 个。

这样定义后，后续所有“为什么是这 13 个”“为什么 Codex 也拿到了这 13 个”的问题都能落到代码事实上。

### 4.2 runtime 执行链路是否清晰

当前 runtime 主链路是清晰的，而且代码上已经闭环。

真实执行链如下：

1. `init`
2. `loadPluginManifest/listBundled*`
3. `build previewState`
4. `removeObsoleteManagedAssets`
5. `pruneCommandNamespace`
6. `syncBundledAssets`
   - `syncCommands`
   - `syncSkills`
   - `syncAgents`
7. `writeDeveloperFile`
8. `writeState`
9. `adapter.syncRuntimeFiles`
10. `writeLangPolicy`

对应证据：

- `src/cli/commands/init.js:82-143`
- `src/cli/plugin.js:152-247`
- `src/cli/state.js:194-242`

配套闭环如下：

1. `doctor` 检查 manifest、commands、skills、agents、developer、state
2. `clean` 读取 state 回收 managed assets
3. `state.js` 是运行面状态真源

对应证据：

- `src/cli/commands/doctor.js:60-90`
- `src/cli/commands/doctor.js:156-191`
- `src/cli/commands/doctor.js:432-468`
- `src/cli/commands/clean.js:35-66`
- `src/cli/state.js:151-224`

需要强调的一点：

整改清单里多次把 `state` 与 `init/doctor/clean` 并列，这在“模块”层面是对的，但在“CLI 命令”层面不精确。

因为当前 CLI 只注册了：

- `doctor`
- `init`
- `clean`

证据：

- `src/cli/index.js:23-40`

因此更准确的说法应该是：

> 当前存在 `init / doctor / clean` 围绕 `state.json` 的执行闭环，而不是存在一个对外的 `state` 命令。

### 4.3 Codex 产品面是否仍然错误暴露 `spec-*`

是，且这是当前系统最大的产品面偏差之一。

直接证据：

1. `CodexAdapter.hasCommands` 返回 `true`
2. `CodexAdapter.commandRoot` 是 `.codex/commands/spec`
3. `init` 在 `adapter.hasCommands` 为真时会生成 command files
4. `init` 对这一路径的提示文案仍然是“pick up the new spec-* commands”
5. `doctor` 会把 `adapter.commandRoot` 当成正式产品面检查
6. `clean` 会按 commandRoot 清理这批 commands
7. `state` 会记录 `commands`

证据：

- `src/cli/adapters/codex.js:28-33`
- `src/cli/commands/init.js:82-88`
- `src/cli/commands/init.js:167-171`
- `src/cli/commands/doctor.js:73-75`
- `src/cli/commands/clean.js:79-89`
- `src/cli/state.js:50-61`

README 也仍然在传播这个错误产品面：

- `README.md:55`

结论：

整改清单把这项放在 P0，是完全正确的。

### 4.4 Stage-0 消费链是否清晰

这部分是当前清单最容易被误读的地方，需要精确表述。

已被代码和文档证实的事实是：

1. `spec-plan` 有 Stage-0 预载
2. `spec-work` 有 Stage-0 预载
3. `spec-code-review` 有 Stage-0 预载
4. 三者都读取：
   - `docs/contexts/<slug>/...`
   - `.spec-first/workflows/bootstrap/<slug>/...`
5. 三者的预载描述点名上游为 `spec-graph-bootstrap`

证据：

- `skills/spec-plan/SKILL.md:55-96`
- `skills/spec-work/SKILL.md:22-64`
- `skills/spec-code-review/SKILL.md:11-55`

同时，`spec-graph-bootstrap` 自己又写了：

> Automatic injection into the five-stage workflow is a future capability.

证据：

- `skills/spec-graph-bootstrap/SKILL.md:20`

所以，最严谨的结论不是：

> `spec-graph-bootstrap` 已被主工作流自动消费

而应该是：

> 主 workflow 已经具备消费 Stage-0 产物的预载逻辑，但文案上当前明确点名的是 `spec-graph-bootstrap` 产物；`spec-graph-bootstrap` 与主 workflow 之间的叙事仍未完全统一。

这是一个**叙事一致性问题**，不是“有没有消费链”的问题。

### 4.5 skill 文档整改清单是否足够完整

整改清单列出的多数 P0/P1 skill 问题都被代码事实证实，包括：

1. `spec-mcp-setup` 路径漂移
   - `skills/spec-mcp-setup/SKILL.md:38`
   - `skills/spec-mcp-setup/SKILL.md:53`
2. `lfg` 错误入口与 plan path 断链
   - `skills/lfg/SKILL.md:10-28`
3. `git-worktree` 使用未定义变量 `${CLAUDE_PLUGIN_ROOT}`
   - `skills/git-worktree/SKILL.md:35`
4. `todo-triage` 写 `/model`、`Haiku`、`/todo-resolve`
   - `skills/todo-triage/SKILL.md:12-15`
   - `skills/todo-triage/SKILL.md:67`
5. `todo-create` / `todo-resolve` 错误入口
   - `skills/todo-create/SKILL.md:97-99`
   - `skills/todo-resolve/SKILL.md:65`
6. `test-browser` / `test-xcode` / `feature-video` 错误 Quick Usage
   - `skills/test-browser/SKILL.md:274-288`
   - `skills/test-xcode/SKILL.md:199-209`
   - `skills/feature-video/SKILL.md:455-468`
7. `spec-debug` / `agent-native-audit` 错误下一步入口
   - `skills/spec-debug/SKILL.md:119`
   - `skills/agent-native-audit/SKILL.md:30`
8. `spec-work` / `spec-work-beta` 仍写 `/simplify`
   - `skills/spec-work/SKILL.md:270`
   - `skills/spec-work-beta/SKILL.md:338`
9. `spec-compound` / `spec-sessions` 旧别名和未声明入口
   - `skills/spec-compound/SKILL.md:7`
   - `skills/spec-compound/SKILL.md:521`
   - `skills/spec-sessions/SKILL.md:7`

但这份清单还不够完整，至少漏了三类内容：

1. `skills/setup/SKILL.md`
   - 仍显式写 `**Codex entry point:** spec-setup`
   - 证据：`skills/setup/SKILL.md:12`
2. `skills/spec-graph-bootstrap/SKILL.md`
   - 仍显式写 `**Codex entry point:** spec-graph-bootstrap`
   - 证据：`skills/spec-graph-bootstrap/SKILL.md:11`
3. `src/cli/index.js`
   - `printVersion()` 仍传播 `spec-*`
   - 证据：`src/cli/index.js:89-91`

结论：

**整改清单主列表是对的，但还没有达到“第一阶段收口产品契约不漏口子”的完整度。**

## 5. 对整改清单本身的质量判断

### 5.1 文档优点

这份整改清单有四个明显优点：

1. **主矛盾抓得准**
   - 把问题定位为“产品面收口”而不是“能力数量不足”
2. **宿主边界已经开始从单轴思维升级**
   - 不再只看 Claude-only / Codex-only
3. **用户可见入口与内部 DSL 已被分界**
   - 这是非常关键的产品治理边界
4. **执行顺序基本合理**
   - 先收口契约，再修硬断点，再清 skill 文案，再补治理模型

### 5.2 文档当前不足

不足也很明确：

1. **个别结论表述还不够工程化**
   - 例如“13 个 workflow”没有写清真源
2. **Stage-0 叙事还不够精准**
   - 容易让读者误以为 `spec-graph-bootstrap` 已实现自动注入
3. **第一阶段修复范围还不够闭环**
   - 漏掉 `skills/setup/SKILL.md`
   - 漏掉 `src/cli/index.js`
   - `spec-graph-bootstrap` 仍被放得偏后
4. **缺少机械化完成定义**
   - 现在更像 expert 清单，不像可批量执行的整改规约

### 5.3 如果目标是“业界领先”，这份清单还缺什么

如果要达到业界领先水位，这份清单还应补两样东西：

1. **治理真源设计**
   - 明确未来要新增哪一个 metadata 文件
   - 明确它如何驱动 `init / plugin.sync / doctor / clean / state`
2. **静态扫描闸门**
   - 对旧 slash command、错误路径、失效变量做全量扫描
   - 明确排除 `Skill(...)` 与 `skill:`

没有这两样，整改仍然高度依赖人工记忆，产品质量会反复回退。

## 6. 完整执行链路判断

### 6.1 当前代码里的真实执行链

从运行面看，当前系统已经有一条完整的工程执行链：

1. `spec-first init`
2. manifest 解析
3. skill / agent / command 同步
4. developer profile 写入
5. state 写入
6. `spec-first doctor` 做校验
7. `spec-first clean` 按 state 回收

这条链路是清晰的。

### 6.2 当前产品链路不清晰的地方

不清晰的地方不在“程序怎么跑”，而在“用户怎么理解”：

1. Codex 到底应该用 `spec-*` 还是 `spec-*`
2. standalone skill 到底是显式命令还是宿主内 skill 调用
3. `spec-graph-bootstrap` 与 `spec-graph-bootstrap` 的边界是什么
4. Stage-0 是“自动注入”还是“按降级策略预载”
5. 哪些能力是宿主维护能力，哪些是通用 skill

所以，当前系统的问题本质是：

**代码运行链相对完整，产品认知链不完整。**

这也是为什么整改重点必须先放在产品契约与治理模型，而不是继续堆 skill。

## 7. 建议对整改清单做的补强

建议把下列内容补回整改清单：

### 7.1 补入第一阶段必修项

1. `src/cli/index.js`
   - `printVersion()` 仍写 `spec-*`
2. `skills/setup/SKILL.md`
   - 显式传播 `Codex entry point: spec-setup`
3. `skills/spec-graph-bootstrap/SKILL.md`
   - 显式传播 `Codex entry point: spec-graph-bootstrap`
4. `skills/spec-mcp-setup/SKILL.md`
   - 除路径漂移外，还显式传播 `Codex entry point: spec-mcp-setup`

### 7.2 为每类修复补 DoD

建议在清单中为每类问题定义最小完成标准：

1. **入口治理类**
   - 不再出现未声明 slash command
   - `Skill(...)`、`skill:` 不受影响
2. **路径漂移类**
   - 文档命令路径在仓库内真实存在
3. **宿主变量类**
   - 不依赖仓库内未定义的环境变量
4. **宿主校验类**
   - 文档不得承诺超过脚本现实能力

### 7.3 增加机械闸门

建议新增一个静态扫描脚本或明确扫描命令，对以下模式做全量阻断：

1. `^# /`
2. `/todo-`
3. `/test-`
4. `/feature-video`
5. `/proof`
6. `/agent-native-architecture`
7. `/research`
8. `/simplify`
9. `/ralph-loop`

并显式豁免：

1. `Skill(`
2. `skill:`

## 8. 最终结论

这份整改清单已经具备很强的工程判断力，足以作为下一阶段整改的主文档。

但如果目标是“高质量交付，达到业界领先水平”，它还需要从“专家经验清单”再升级一步，变成“带真源定义、带 DoD、带静态闸门、带执行闭环的治理文档”。

最终判断如下：

1. **宏观上**
   - 架构分层完整
   - 产品治理不完整
2. **微观上**
   - 多数 P0/P1 判断已被代码证实
   - 少量漏项需要补回
3. **执行链上**
   - 运行链完整
   - 产品认知链不完整
4. **整改清单质量上**
   - 可执行
   - 但还不够“机械可靠”

最关键的一条是：

**下一步不应继续泛化讨论“是否要双宿主”，而应直接把最终契约变成代码真源、文档真源、校验闸门三者一致的系统事实。**
