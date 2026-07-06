# Claude/Codex 双宿主 Skill 整改清单

- 日期：`2026-04-16`
- 审查范围：`skills/*` 全量 `47` 个 skill
- 审查口径：以仓库代码与打包/同步实现为事实依据，不以测试文件为主依据
- 宿主范围：`Claude Code` + `Codex`
- 本轮已确认的产品契约：
  - Claude 用户可见 workflow 入口：`spec-*`
  - Codex 用户可见 workflow 入口：`spec-*`
  - `Skill(...)`、`skill:` 属于内部调用 DSL，不纳入“用户可见入口治理”
- 对标基准：`/Users/kuang/xiaobu/compound-engineering-plugin`
- 关联审计：
  - `docs/业界分析/9.spec-first-vs-compound-engineering-plugin-全量同步审计-2026-04-14.md`
  - 本轮结论聚焦“当前项目作为 Claude/Codex 双宿主工作流产品，哪些 skill / runtime / 文案需要修复”
- 审查方法：
  - 先以源项目产品面与工作流组织方式做对标基线
  - 再对本仓 `skills/*` 做逐个 skill 阅读与流程核对，测试文件不作为主依据
  - 同时引入多 reviewer 视角交叉审阅，但最终只以当前仓库代码、runtime 同步实现、文档真源为定论

## 0. 最新完成态（2026-04-16 回写）

以下状态以当前代码、runtime 同步实现、治理真源与验证结果为准；后续章节保留的是**执行前问题清单与整改依据**，不应再被当作“当前仍未修复”的事实陈述。

当前已落地的关键结果：

1. Codex 已停止生成 `.codex/commands/spec/*`，用户可见 workflow 入口统一为 `spec-*`
2. `src/cli/contracts/dual-host-governance/skills-governance.json` + `skills-governance.schema.json` 已形成 `47` 个 skill 的 machine-readable 真源
3. `src/cli/plugin.js` 已改为由 `plugin manifest + src/cli/contracts/dual-host-governance/skills-governance.json` 共同驱动 filtered asset set；`init / sync / doctor / state` 共用同一治理模型
4. `orchestrating-swarms` 已被 runtime 正式收口为 `host_exclusive(owner_host=claude)`；Codex 不再安装该 skill
5. `claude-permissions-optimizer` 已被正式收口为 `target_host_maintenance(owner_host=claude)`；Codex 仍可加载该 skill 以维护 Claude 侧配置
6. `report-bug`、`reproduce-bug`、`docs/10-prompt/skills/**` 镜像与 source `skills/` 已同步刷新，宿主中立入口口径已对齐
7. 已新增 `npm run lint:skill-entrypoints` 与 `.github/workflows/skill-entrypoint-gate.yml`，形成本地 + PR 双层防回流闸门
8. 本轮关键验证已通过：
   - `npx jest tests/unit/skills-governance-contracts.test.js tests/unit/dual-host-governance-contracts.test.js tests/unit/managed-state-contracts.test.js tests/unit/lint-skill-entrypoints.test.js tests/unit/report-bug-contracts.test.js tests/unit/reproduce-bug-contracts.test.js --runInBand`
   - `npm run lint:skill-entrypoints`
   - `npm run test:smoke`
   - `npm run test:integration`

## 1. 初始审查结论（执行前）

当前仓库的主要问题不是“大多数 skill 本体逻辑差”，而是以下四类问题没有收口：

1. 用户可见入口没有按最终产品契约收口
2. standalone / maintenance skill 的入口文案持续漂移
3. 少量文档路径和宿主变量已经漂移，照文档执行会卡死
4. 双宿主分发与宿主专有能力边界还没有形成可落地的治理模型

当前代码里的 workflow 源集合，准确说是**由 `.claude-plugin/plugin.json` 的 `commands` 驱动的 command-backed workflow skill 集合**，仍然只有 `13` 个：

- `spec-ideate`
- `spec-brainstorm`
- `spec-plan`
- `spec-work`
- `spec-debug`
- `spec-code-review`
- `spec-compound`
- `spec-sessions`
- `spec-graph-bootstrap`
- `spec-graph-bootstrap`
- `spec-mcp-setup`
- `spec-update`
- `setup`

重要说明：

1. 上述 `13` 个不是通过扫描 `skills/*` 自然得出的，而是由 manifest 真源驱动，并被 `init` / `sync` / `doctor` 共同消费
2. 上述 `13` 个是 workflow source set，不代表当前各宿主的用户可见入口已经正确
3. 其余 `34` 个是 standalone skill；它们可以被加载和使用，但**当前不应该在文档中被写成已经暴露的用户命令**
4. `Skill(...)` 与 `skill:` 只用于内部编排，不属于本清单中的用户入口治理范围

## 2. 执行前事实基线

### 2.1 真实 runtime 与分发真源

真源在：

- `.claude-plugin/plugin.json`
- `src/cli/plugin.js`
- `src/cli/commands/init.js`
- `src/cli/commands/doctor.js`
- `src/cli/adapters/claude.js`
- `src/cli/adapters/codex.js`
- `src/cli/state.js`

关键事实：

1. `.claude-plugin/plugin.json` 的 `commands` 声明了 `13` 个 workflow command source，并驱动 `13` 个 command-backed workflow skill
2. Claude runtime 当前会把：
   - workflow command 模板同步到 `.claude/commands/spec/`
   - standalone skill 同步到 `.claude/skills/`
   - command-backed workflow skill 同步到 `.claude/spec-first/workflows/`
3. Codex runtime 当前代码仍然：
   - 生成 `.codex/commands/spec/`
   - 把 `skillsRoot` 与 `workflowsRoot` 都指向 `.agents/skills/`
   - 在 `init` / `doctor` 中按“Codex 也有 `spec-*` commands”处理
4. 当前代码只逻辑区分：
   - `command-backed workflow`
   - `standalone skill`
5. 当前代码**还没有**可落地地区分：
   - `entry_surface`
   - `host_scope`
   - `target-host maintenance`
6. 当前主分发链路已经存在并且清晰：
   - `init`
   - `load manifest / listBundled*`
   - `build previewState`
   - `removeObsoleteManagedAssets`
   - `pruneCommandNamespace`
   - `syncBundledAssets`
   - `writeState`
7. `doctor` / `clean` 围绕 `state.json` 构成运行面闭环；这里的 `state` 是模块与状态文件，不是独立 CLI 子命令

### 2.2 本轮确认的入口治理边界

本轮按下面的边界执行整改：

1. Claude 用户可见 workflow 入口统一为 `spec-*`
2. Codex 用户可见 workflow 入口统一为 `spec-*`
3. standalone skill 不得写成已暴露的用户命令，除非产品明确声明
4. `Skill(...)`、`skill:`、其他内部路由 token 不纳入用户可见入口治理
5. 因此，本轮“入口错位”只审：
   - 标题
   - Usage / Quick Usage
   - Next step / Related commands
   - README / init / doctor / 镜像文档中的对外口径

### 2.3 当前审查底线

本轮已确认：

1. `47/47` 个 skill 目录都有 `SKILL.md`
2. `skills/*/SKILL.md` 内显式 `references/`、`scripts/`、`assets/`、`templates/` 相对路径引用已做全量静态核对
3. `skills/*/SKILL.md` 内 `spec-first:category:name` agent 引用已做全量静态核对
4. 仓内 `skills/**` 下 shell / `.mjs` / `.py` 脚本语法静态检查通过
5. `pwsh` 在当前环境不可用，PowerShell 脚本仅做静态阅读，没有运行验证

## 3. 整改原则

后续修复建议统一按这六条执行：

1. 先让代码和文档收敛到**已确认的产品契约**，不要继续混写“当前现状”和“未来待定策略”
2. 保留当前 `13` 个 workflow source set，不要为了补文档把大量 standalone skill 升格成用户命令
3. 用户可见入口只治理两层：
   - Claude：`spec-*`
   - Codex：`spec-*`
4. 宿主治理不能再用单一 `Claude-only / Codex-only / dual-host` 轴，至少要拆成：
   - `entry_surface`：workflow command / standalone skill / internal-only
   - `host_scope`：dual-host / host-exclusive / target-host-maintenance
5. runtime 过滤必须有单一真源，统一驱动：
   - `init` 的 preview / 清理
   - 实际同步
   - `doctor` / `clean` / `state` 模块
6. 短期最优落地优先采用**集中式 machine-readable 真源文件**驱动 runtime 过滤；`SKILL.md` frontmatter 自描述可作为第二阶段增强，不应在第一阶段就让 `init / doctor / clean` 直接依赖 `47` 个 Markdown frontmatter 解析

### 3.1 `T00` 必须先锁定的前置决策

以下三项如果不先落文，后续任务会继续互相打架：

这三项在执行 backlog 中已经 formalize 为 `T00`，不再是悬空说明，而是所有后续整改的正式前置任务：

1. **Codex compatibility layer 决策**
   - `.codex/commands/spec/*` 是彻底移除，还是保留为兼容层但明确排除在“用户可见入口”之外
2. **治理枚举决策**
   - `entry_surface`
   - `host_scope`
   - 必要补充字段与 allowed values
3. **filtered asset set contract 决策**
   - 输入
   - 输出
   - 构建时机
   - 状态落盘边界

推荐输出落位：

- 主文档优先落位 `docs/contracts/dual-host-governance/README.md`
- machine-readable runtime truth source 固定落位 `src/cli/contracts/dual-host-governance/`

### 3.2 整改完成定义（DoD）

后续每一类修复都必须满足最小完成标准，否则不算真正收口：

1. 入口治理类：
   - 标题、Usage、Quick Usage、Next step、Related commands、README、CLI 可见输出中，不再出现未声明的 slash command
   - `Skill(...)` 与 `skill:` 明确不纳入此项治理
   - command-backed workflow skill 的 H1 应与 command template 对齐，使用描述性标题，不写成 `# /...`
2. 路径漂移类：
   - 文档中出现的路径在当前仓库中真实存在
   - 优先改成 skill-local 相对路径，降低未来重命名漂移
3. 宿主变量类：
   - 示例命令不得依赖仓库内未定义、未稳定注入的环境变量
4. 宿主校验类：
   - 文档承诺不得超过脚本现实能力
   - 如果 Codex 侧只能做到 `key-only` 或 `unchecked`，文档必须写明
5. 合并前闸门：
   - 必须对 `skills/*/SKILL.md` 做一次全量入口静态扫描
   - 扫描至少覆盖：`^# /`、`/todo-`、`/test-`、`/feature-video`、`/proof`、`/agent-native-architecture`、`/research`、`/simplify`、`/ralph-loop`
   - 建议追加标签感知规则：拦截 `**Codex entry point:** spec-*` 这类错误宿主入口写法；不要用过宽的 `spec-*` 全局匹配误伤合法 Claude 文案
6. 代码与脚本类：
   - 必须补对应验证
   - `T01` 至少补 unit / smoke
   - `T01` 若改动 Codex compatibility layer，必须同步更新 `tests/smoke/cli.sh` 中 `init --codex` / `doctor --codex` / `clean --codex` 场景的断言；当前这些断言显式守卫 `.codex/commands/spec/*`
   - `T12` 必须补 filtered asset set 相关 unit，并补 smoke 覆盖 `init --codex` → `doctor --codex` → `clean --codex`
   - 不把现有 `tests/integration/e2e.sh` 作为 runtime 治理链的主验收
7. `CHANGELOG.md`：
   - 任何代码、脚本、打包真源变更，必须同步追加 `CHANGELOG.md`
   - 纯文档修订默认不强制，但一旦触达源码或打包真源即强制执行
8. 静态扫描落地顺序：
   - 第一阶段先提供 `npm run lint:skill-entrypoints`
   - 第二阶段接入 CI gate
   - `pre-commit` 只作为规则稳定后的增强项

### 3.3 宿主中立表述模板

后续批量修文案时，统一按下面的标准模板执行，避免每个 skill 各自发挥：

1. 引用另一个 standalone skill
   - 禁止：`/todo-resolve`
   - 标准：`使用 todo-resolve skill`
2. 宿主专属控制面操作
   - 禁止：`/model to Haiku`
   - 标准：`切换到快速/低成本模型（宿主相关）`
3. 用户可见 workflow 入口
   - Claude：`spec-*`
   - Codex：`spec-*`
   - 除这两类外，不把其他文案写成已声明命令
4. 下一步引导
   - 禁止：`Run /proof`
   - 标准：`继续使用 proof skill`

## 4. 完整修复列表

## P0：必须先修

### 4.1 Codex 仍在暴露错误的 `spec-*` 产品面，且口径未在 CLI 与关键 skill 文案中全量收口

- 类型：`代码+文档`
- 文件：
  - `src/cli/adapters/codex.js`
  - `src/cli/commands/init.js`
  - `src/cli/commands/doctor.js`
  - `src/cli/index.js`
  - `README.md`
  - `skills/spec-mcp-setup/SKILL.md`
  - `skills/spec-graph-bootstrap/SKILL.md`
  - `skills/setup/SKILL.md`
- 问题：
  - 当前代码仍为 Codex 生成 `.codex/commands/spec/*`
  - `init` 仍提示 Codex 重启后获取新的 `spec-* commands`
  - 当前 `init.js` 的错误不是“完全没有 `spec-*` 分支”，而是 `adapter.hasCommands === true` 时 Codex 永远走进 `spec-* commands` 分支
  - `doctor` 仍把 Codex command 目录当成正式产品面检查
  - `printVersion()` 仍提示“使 `spec-*` 命令生效”
  - README 仍在传播 Codex `spec-*` 入口
  - `spec-mcp-setup`、`spec-graph-bootstrap`、`setup` 仍显式写 `**Codex entry point:** spec-*`
- 影响：
  - 当前代码和公开文档都偏离已确认契约：`Codex = spec-*`
- 建议动作：
  - 先锁定 `.codex/commands/spec/*` 的最终策略：删除，或保留为兼容层但明确排除在用户可见入口之外
  - 停止把 `.codex/commands/spec/*` 作为 Codex 用户可见入口
  - `init.js` / `doctor.js` / `printVersion()` 的修法必须直接参照 compatibility layer 决策，不能让执行者自行猜测
  - `init` / `doctor` / `printVersion()` / README 全量改成 `spec-*`
  - 同批修 `spec-mcp-setup`、`spec-graph-bootstrap`、`setup` 中显式写死的 Codex `spec-* entry point`
  - 先收口产品面，再做后续文档批修

### 4.2 `spec-mcp-setup` 旧路径漂移

- 类型：`文档`
- 文件：`skills/spec-mcp-setup/SKILL.md`
- 问题：
  - 正文仍然引用旧路径 `skills/mcp-setup/...`
  - 当前真实目录是 `skills/spec-mcp-setup/...`
- 影响：
  - 用户按文档执行会直接失败
- 建议动作：
  - 全量替换为 `skills/spec-mcp-setup/...`
  - 更优方案是改成 skill-local 相对路径，避免后续再次重命名漂移
  - 此项应与 4.1 同批完成，因为同文件还在传播错误的 Codex 入口口径

### 4.3 `lfg` 的错误入口与数据流没有真正闭环

- 类型：`文档`
- 文件：`skills/lfg/SKILL.md`
- 问题：
  - 第 1 步仍写 `/ralph-loop:ralph-loop`
  - 第 5、6、7 步直接写成 `/todo-resolve`、`/test-browser`、`/feature-video`
  - 第 3 步裸调用 `spec-work`，没有把第 2 步产出的 plan path 传下去
- 影响：
  - 当前流水线编排不能按文档闭环
  - 即使只修第 5/6/7 步，主数据流仍然是断的
- 建议动作：
  - 拆成“错误用户入口”与“计划路径传递”两个修复点
  - 非 workflow 能力改成“加载 skill”表述
  - 第 3 步明确传递第 2 步生成的 plan path

### 4.4 `git-worktree` 使用失效宿主变量

- 类型：`文档`
- 文件：`skills/git-worktree/SKILL.md`
- 问题：
  - 所有 bash 示例依赖 `${CLAUDE_PLUGIN_ROOT}`
  - 当前产品运行时中没有这个稳定变量
- 影响：
  - 用户无法按示例执行脚本
- 建议动作：
  - 不再写死任何宿主 runtime 路径
  - 统一改成“加载 `git-worktree` skill，由 skill 内脚本处理实际路径”的宿主中立表述

### 4.5 `todo-triage` 的宿主耦合和错误入口

- 类型：`文档`
- 文件：`skills/todo-triage/SKILL.md`
- 问题：
  - 写成 `/todo-resolve`
  - 明确要求先切 `/model` 到 Haiku
- 影响：
  - 入口写错
  - 明显残留 Claude 控制面假设，不符合双宿主口径
- 建议动作：
  - 改成 standalone skill 调用表述
  - 把 `/model` / Haiku 改成宿主中立的“快速模型/低成本模型”策略

### 4.6 `todo-create` / `todo-resolve` 的入口文案错误

- 类型：`文档`
- 文件：
  - `skills/todo-create/SKILL.md`
  - `skills/todo-resolve/SKILL.md`
- 问题：
  - `todo-create` integration table 把 `/todo-triage`、`/todo-resolve` 当成 command
  - `todo-resolve` 提示用户 `run /todo-triage`
- 影响：
  - 用户可见控制面错误
- 建议动作：
  - 统一改成 standalone skill 表述

### 4.7 `test-browser` / `test-xcode` / `feature-video` 的 Quick Usage 错误

- 类型：`文档`
- 文件：
  - `skills/test-browser/SKILL.md`
  - `skills/test-xcode/SKILL.md`
  - `skills/feature-video/SKILL.md`
- 问题：
  - Quick Usage 全写成 `/test-browser`、`/test-xcode`、`/feature-video`
- 影响：
  - 用户会误以为这些能力已被暴露成 workflow command
- 建议动作：
  - 改成真实 skill 使用方式
  - upload-only 示例也一并修

### 4.8 `spec-debug` / `agent-native-audit` 的下一步入口错误

- 类型：`文档`
- 文件：
  - `skills/spec-debug/SKILL.md`
  - `skills/agent-native-audit/SKILL.md`
- 问题：
  - `spec-debug` 写 `/proof`
  - `agent-native-audit` 写 `/agent-native-architecture`
- 影响：
  - 下一步指引与真实 product surface 不一致
- 建议动作：
  - 统一改成“加载 `xxx` skill”

### 4.9 `spec-work` / `spec-work-beta` 仍引用未声明交付的可选 `/simplify` 入口

- 类型：`文档`
- 文件：
  - `skills/spec-work/SKILL.md`
  - `skills/spec-work-beta/SKILL.md`
- 问题：
  - 两个主执行 workflow 都仍写“如果有 `/simplify` skill”
  - 源项目 `ce-work` / `ce-work-beta` 也保留同样条件句，说明这是继承的历史文案，不是当前仓独有新增
  - 当前问题不在于流程一定会卡死，而在于它把一个**未在当前插件内声明或交付**的可选入口带进了正式 workflow 文案
- 影响：
  - 用户会误以为产品原生提供 `/simplify`
  - 由于句子带有 `Otherwise ...` fallback，它属于产品面误导，不是硬阻断依赖
  - 当前清单若不补这一项，入口治理不会真正收口
- 建议动作：
  - 不再把 `/simplify` 写成显式用户入口
  - 改成纯能力描述，例如“如有可用的 simplify 类 skill 或等效能力则使用，否则自行审查近期改动并做复用/收敛”
  - 在 `T11` 完成前，`spec-work-beta` 一律按 standalone skill 语言表述，不提前假定它是 workflow command

### 4.10 `spec-compound` / `spec-sessions` 仍保留显眼旧命令别名

- 类型：`文档`
- 文件：
  - `skills/spec-compound/SKILL.md`
  - `skills/spec-sessions/SKILL.md`
- 问题：
  - 顶层标题仍写 `# /compound`、`# /sessions`
  - `spec-compound` 末尾仍写未声明的 `/research`
- 影响：
  - 用户继续会看到不存在的命令面
- 建议动作：
  - 顶层标题、Usage、Related commands 一起改
  - H1 改成与 command template 一致的描述性标题，例如 `# Spec-First Compound`、`# Spec-First Sessions`
  - 去掉所有未声明旧别名

## P1：应尽快修

### 4.11 宿主治理模型不能继续用单一过滤轴

- 类型：`代码+文档`
- 文件：
  - `src/cli/plugin.js`
  - `src/cli/commands/init.js`
  - `src/cli/state.js`
  - `src/cli/commands/doctor.js`
  - 宿主分类真源文件（待新增）
- 问题：
  - 当前仓库没有可以落地表达 `entry_surface` 与 `host_scope` 的真源
  - 继续沿用 `Claude-only / Codex-only / dual-host` 单轴，会把 cross-host maintenance skill 分错
- 影响：
  - 过滤策略会把正确能力过滤掉，或把错误能力继续暴露到另一宿主
- 建议动作：
  - 先锁定 allowed values 与字段 contract，再开始 `47` 个 skill 分类
  - 先产出 `47` 个 skill 的宿主分类矩阵
  - `13` 个 command-backed workflow skill 的分类必须显式消费 `T00` compatibility layer 决策；是否保留 `.codex/commands/spec/*` 只改变兼容层表达，不得借此发明新的对外产品面
  - `entry_surface` 至少区分：`workflow command`、`standalone skill`、`internal-only`
  - `host_scope` 至少区分：`dual-host`、`host-exclusive`、`target-host-maintenance`
  - 同时显式给 `spec-work-beta` 定位，避免它继续处于“既像 workflow 又不在 command set 里”的模糊状态

### 4.12 runtime 过滤不能只改 `plugin.js`

- 类型：`代码`
- 文件：
  - `src/cli/plugin.js`
  - `src/cli/commands/init.js`
  - `src/cli/state.js`
  - `src/cli/commands/doctor.js`
  - `src/cli/commands/clean.js`
- 问题：
  - 当前 `init` 先基于全量 skill 构造 preview / cleanup
  - `inspect` / `doctor` / `clean` 也仍是全量心智模型
  - 如果只在 `plugin.js` copy/sync 分支加过滤，旧污染不会被一致清理
- 影响：
  - 过滤上线后仍会留下错误宿主 skill
  - runtime、state、doctor、clean 四个面会继续打架
- 建议动作：
  - 先定义 `filtered asset set` 的 schema，再实现
  - schema 至少明确：
    - 输入：manifest command set、宿主治理真源、目标平台
    - 输出：`commands`、`workflowSkills`、`skills`、`agents`、`agentSupportFiles`、`skipped`
    - 构建时机：runtime 启动时统一计算
    - 状态落盘边界：继续复用 `state.json` 的 tracked arrays，不另造第二套 state 语义
  - 提升“filtered asset set”为单一真源
  - 统一驱动：
    - previewState
    - removeObsoleteManagedAssets
    - 实际同步
    - inspect / doctor / clean

### 4.13 宿主专有盘点当前至少漏了 `claude-permissions-optimizer`

- 类型：`代码+文档`
- 文件：
  - `skills/claude-permissions-optimizer/SKILL.md`
  - `skills/orchestrating-swarms/SKILL.md`
  - 宿主分类真源文件（待新增）
- 问题：
  - 当前清单只把 `orchestrating-swarms` 视为宿主边界样板
  - 但 `claude-permissions-optimizer` 明确读写 `~/.claude/settings.json` 与 `.claude/settings.json`
- 影响：
  - 如果不先补全 inventory，宿主治理不会真正闭环
- 建议动作：
  - 先把 `claude-permissions-optimizer` 纳入盘点
  - 明确它属于 `host-exclusive` 还是 `target-host-maintenance`

### 4.14 `spec-mcp-setup` 的 Codex 校验缺口必须先重新核实

- 类型：`代码+文档`
- 文件：
  - `skills/spec-mcp-setup/scripts/verify-tools.sh`
  - `skills/spec-mcp-setup/scripts/verify-tools.ps1`
  - `skills/spec-mcp-setup/SKILL.md`
- 问题：
  - 文档与脚本现实可能仍存在“Codex 校验弱于 Claude”的残余认知
  - 但这类缺口不能再按旧印象直接下结论，必须先重新核实当前脚本与测试现实
- 影响：
  - 如果 gap 已经关闭，却仍按“未实现”推进，会制造无效整改
  - 如果 gap 仍存在，却不做重新定性，就会让依赖关系继续混乱
- 建议动作：
  - 先做 residual gap re-validation
  - 若只剩文档口径问题，则与 `4.2` 同批直接收口
  - 若仍有真实脚本缺口，再在宿主治理 contract 落定后补实现
  - 无论结果如何，都要让文档口径与脚本现实完全一致

### 4.15 `spec-graph-bootstrap` 产品叙述过时

- 类型：`文档`
- 文件：`skills/spec-graph-bootstrap/SKILL.md`
- 问题：
  - 仍写“Automatic injection into the five-stage workflow is a future capability”
  - 但 `spec-plan`、`spec-work`、`spec-code-review` 已经内建 Stage-0 预载逻辑
  - 当前这些预载段落点名上游是 `spec-graph-bootstrap` 产物，而不是直接宣告 `spec-graph-bootstrap` 自动注入
- 影响：
  - 主 workflow 叙事前后矛盾
  - 如果直接把 `spec-graph-bootstrap` 改写成“已自动注入主工作流”，会再次偏离代码事实
- 建议动作：
  - 改为“主 workflow 当前已支持按降级策略预载已存在的 Stage-0 产物”
  - 避免写成“`spec-graph-bootstrap` 已被主工作流自动注入”

### 4.16 打包与公开文档仍有 Claude-only / Codex 错位 copy

- 类型：`文档`
- 文件：
  - `.claude-plugin/plugin.json`
  - `README.md`
- 问题：
  - `.claude-plugin/plugin.json` 的产品描述仍是 Claude Code 口径
  - README 仍混写 Codex `spec-*` 与 `spec-*`
- 影响：
  - 即使 skill 文案修完，外层产品定位仍会继续误导
- 建议动作：
  - 直接并入 `4.1` 同批完成，不再后置成独立晚期动作
  - 按最终契约同步更新打包描述与 README

## P2：顺手修

### 4.17 `report-bug` 的尾注写法

- 类型：`文档`
- 文件：`skills/report-bug/SKILL.md`
- 问题：
  - 末尾写成 `Reported via /report-bug skill`
- 影响：
  - 入口表述不真实
- 建议动作：
  - 改成宿主中立表述

### 4.18 关联 reference 文档同步修

- 类型：`文档`
- 文件：
  - `skills/feature-video/references/*`
  - `skills/spec-brainstorm/references/*`
  - `skills/spec-plan/references/*`
  - 其他引用错误入口的 reference 文档
- 问题：
  - 主 skill 修完后，reference 文档可能仍残留旧入口写法
- 建议动作：
  - 批量统一修正

### 4.19 `docs/10-prompt/` 镜像文档同步刷新

- 类型：`文档`
- 文件：`docs/10-prompt/skills/**`
- 问题：
  - 如果这里只是发布镜像，源码修了而镜像不刷，外部文档仍会继续误导
- 建议动作：
  - 源 skill 修完后统一刷新镜像

### 4.20 增补仓库级入口规范

- 类型：`文档`
- 文件：
  - `AGENTS.md`
  - 或新增维护文档
- 问题：
  - 当前没有一个仓库级规则，明确：
    - Claude 对外入口
    - Codex 对外入口
    - standalone skill 写法
    - internal DSL 排除范围
    - host_scope 分类规则
- 建议动作：
  - 新增一份维护约定文档，作为后续新增 skill 的校验准则

### 4.21 增加入口口径静态扫描闸门

- 类型：`文档+脚本`
- 文件：
  - `scripts/`（待新增扫描脚本）
  - 或 CI / pre-merge 校验配置
- 问题：
  - 当前入口治理完全依赖人工阅读，修完后容易再次回退
- 建议动作：
  - 增加对 `skills/*/SKILL.md` 的全量静态扫描
  - 默认阻断：`^# /`、`/todo-`、`/test-`、`/feature-video`、`/proof`、`/agent-native-architecture`、`/research`、`/simplify`、`/ralph-loop`
  - 明确豁免：`Skill(...)`、`skill:`
  - 增强项：追加 `Codex entry point.*\\spec-*` 这类标签感知规则，专门拦截错误宿主入口，不把所有 `spec-*` 写法一刀切判错
  - 第一阶段先提供 `npm run lint:skill-entrypoints`
  - 第二阶段接入 CI gate
  - `pre-commit` 作为增强项，等规则稳定后再决定是否默认启用

## 5. 按文件汇总

### 5.1 需要立即修改的 skill 文档

- `skills/spec-mcp-setup/SKILL.md`
- `skills/spec-graph-bootstrap/SKILL.md`
- `skills/setup/SKILL.md`
- `skills/lfg/SKILL.md`
- `skills/git-worktree/SKILL.md`
- `skills/todo-create/SKILL.md`
- `skills/todo-resolve/SKILL.md`
- `skills/todo-triage/SKILL.md`
- `skills/test-browser/SKILL.md`
- `skills/test-xcode/SKILL.md`
- `skills/feature-video/SKILL.md`
- `skills/spec-debug/SKILL.md`
- `skills/spec-work/SKILL.md`
- `skills/spec-work-beta/SKILL.md`
- `skills/spec-compound/SKILL.md`
- `skills/spec-sessions/SKILL.md`
- `skills/agent-native-audit/SKILL.md`

### 5.2 需要代码层收口的文件

- `src/cli/adapters/codex.js`
- `src/cli/plugin.js`
- `src/cli/commands/init.js`
- `src/cli/commands/doctor.js`
- `src/cli/commands/clean.js`
- `src/cli/state.js`
- `src/cli/index.js`
- `package.json`
- `skills/spec-mcp-setup/scripts/verify-tools.sh`
- `skills/spec-mcp-setup/scripts/verify-tools.ps1`

### 5.3 需要同步修的打包与文档

- `.claude-plugin/plugin.json`
- `README.md`
- `skills/orchestrating-swarms/SKILL.md`
- `skills/claude-permissions-optimizer/SKILL.md`
- `skills/report-bug/SKILL.md`
- `skills/**/references/*`
- `docs/10-prompt/skills/**`

## 6. 建议执行顺序

### 第一阶段：先切到最终产品契约

1. 先完成 `T00`，锁定 Codex compatibility layer、治理枚举与 filtered asset set contract
2. 再停止 Codex 对外产品面继续传播 `spec-*`
3. 把 Codex 的 `init` / `doctor` / `printVersion()` / README 统一改成 `spec-*`
4. 同批修 `spec-mcp-setup` / `spec-graph-bootstrap` / `setup` 中显式写死的 Codex `spec-* entry point`
5. 同步修 `.claude-plugin/plugin.json` 与外层产品 copy

### 第二阶段：清硬断点

1. 修 `spec-mcp-setup` 路径漂移
2. 重新核实 `spec-mcp-setup` 的 Codex residual gap 是否真实存在
3. 修 `git-worktree` 失效变量
4. 修 `lfg` 的错误入口与 plan path 传递

### 第三阶段：清用户可见入口错位

1. 修 `todo-*`
2. 修 `test-*`
3. 修 `feature-video`
4. 修 `spec-debug`
5. 修 `spec-work` / `spec-work-beta`
6. 修 `spec-compound`
7. 修 `spec-sessions`
8. 修 `agent-native-audit`

### 第四阶段：先收口独立叙事，再补双宿主治理

1. 先修 `spec-graph-bootstrap` 的过时叙述；这一步是独立前置项，不依赖双宿主治理设计/实现
2. 再完成 `T11 + T13`：做完 `47` 个 skill 的宿主分类矩阵，并明确 `orchestrating-swarms` 与 `claude-permissions-optimizer`
3. 让 `src/cli/contracts/dual-host-governance/` 下的 machine-readable 宿主治理真源文件落地
4. 再执行 `T12`：把 filtered asset set 做成 `init` / `sync` / `doctor` / `clean` / `state` 共用真源
5. 只有当第二阶段确认 `spec-mcp-setup` 仍有真实脚本缺口时，才在这里补实现

### 第五阶段：清镜像与仓库尾项

1. 修 `report-bug`
2. 刷新 `skills/**/references/*`
3. 刷新 `docs/10-prompt/` 镜像
4. 补仓库级入口规范

### 第六阶段：补机械治理闸门

1. 先提供 `npm run lint:skill-entrypoints`
2. 为 `skills/*/SKILL.md` 增加入口口径静态扫描
3. 在扫描规则中显式豁免 `Skill(...)` 与 `skill:`
4. 把该扫描作为后续新增 / 修改 skill 的 CI / 合并前检查

## 7. 最终判断

当前仓库距离“真正收敛的 Claude/Codex 双宿主工作流产品”还差最后一层产品化收口。

差的不是能力数量，而是：

1. Claude / Codex 的用户可见入口还没有按最终契约落到代码与文档
2. standalone / maintenance skill 的文案边界还在漂
3. 少量路径和宿主变量已经失效
4. 宿主兼容边界还没有在分发层以正确模型落地

只要按本清单完成整改，当前 skill 资产本身的能力密度仍然足够支撑双宿主产品成立；但前提是先把“Codex = `spec-*`、Claude = `spec-*`、内部 DSL 不纳入用户入口治理”这三个边界彻底钉死。
