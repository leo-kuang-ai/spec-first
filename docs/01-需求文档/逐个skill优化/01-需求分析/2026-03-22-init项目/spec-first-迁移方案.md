# spec-first 迁移方案

文档日期：2026-03-22
迁移对象：`/Users/kuang/xiaobu/gstack`
目标仓库：`/Users/kuang/Desktop/ops/spec-first-pro`
迁移原则：`不改变功能，只迁移，只重命名，只重组落位`

## 1. 目标定义

这次迁移不是“基于 gstack 重写一个新系统”，而是把现有 `gstack` 原样迁移进 `spec-first`，同时把所有对外与对内的重要标识，从 `gstack` 统一收敛为 `spec-first`。

这里的“不改变功能”有三个硬约束：

1. 浏览器运行时能力不变。
2. Skill 工作流能力不变。
3. 构建、安装、测试、生成、发布链路不变，只允许改名字、改路径、改文案、改产物落点。

换句话说，这次工作的本质是：

```text
gstack 的能力全集
    =
原样迁入 spec-first
    +
系统性 rename
    +
状态目录/安装目录/生成目录/文档目录的完整切换
    +
可验证、可回滚、可分阶段落地
```

## 2. 迁移边界

### 2.1 在范围内

以下内容全部属于迁移范围：

- 仓库顶层身份
  - `package.json` 中的包名、描述、版本说明中的项目名
  - `README.md`、`ARCHITECTURE.md`、`CONTRIBUTING.md`、`AGENTS.md`、`CLAUDE.md`
- 目录与安装路径
  - `~/.claude/skills/gstack`
  - `~/.codex/skills/gstack`
  - `.agents/skills/gstack-*`
  - `.agents/skills/gstack`
  - 运行时状态目录 `~/.gstack`
  - 项目内状态目录 `.gstack`
- 命令与二进制命名
  - `gstack-config`
  - `gstack-update-check`
  - `gstack-slug`
  - `gstack-review-log`
  - `gstack-review-read`
  - `gstack-telemetry-log`
  - `gstack-telemetry-sync`
  - `gstack-diff-scope`
  - `gstack-analytics`
  - `gstack-community-dashboard`
- 自动生成链路
  - `scripts/gen-skill-docs.ts`
  - 生成后的 `SKILL.md`
  - 生成后的 `.agents/skills/gstack-*`
- 浏览器运行时
  - `browse` 子系统中的状态文件路径、日志路径、server 发现逻辑
- 测试与 fixture
  - 单测、E2E、生成校验、路径断言、文档新鲜度校验
- 文档与教程
  - 安装命令、升级命令、贡献方式、仓库路径、截图、示例输出

### 2.2 不在范围内

以下内容本次不做：

- 不新增 skill。
- 不删减 skill。
- 不重写工作流逻辑。
- 不重构 browse 架构。
- 不改变 Supabase 遥测的数据结构。
- 不引入新的产品定位或功能定位。

## 3. 迁移原则

### 3.1 功能冻结原则

迁移期间不接受功能增强。所有改动必须能归类为以下四种之一：

1. `rename`：名称替换。
2. `relocate`：目录或产物落点迁移。
3. `rewire`：脚本与生成链路中的引用更新。
4. `cleanup`：清除旧品牌残留与旧路径依赖。

### 3.2 单一真相源原则

`gstack` 相关名字不是只出现在文档里，而是分布在：

- 代码常量
- 安装脚本
- 生成脚本
- 运行时状态路径
- 测试断言
- 生成产物
- 用户 home 目录中的全局状态

所以迁移必须从“单点搜索替换”升级为“分层识别 + 分阶段收口”。否则最容易出现“文档叫 spec-first，但脚本仍写进 ~/.gstack，生成产物还叫 gstack-review”的半迁移状态。

### 3.3 彻底切换原则

目标态不是“双轨运行”，而是彻底切到 `spec-first`。

这意味着：

- 运行时默认只认 `spec-first` 路径和 `spec-first-*` 命令
- 旧 `gstack` 只用于现状分析、迁移前审计和一次性数据搬迁说明
- 不把旧目录读取、旧命令别名、旧入口跳转设计成长期方案

### 3.4 先改标识，再改外壳，最后切断旧名

推荐顺序不是“一口气全改”，而是：

1. 先把代码中所有命名点找全。
2. 再完成生成链路与安装链路改名。
3. 再切换运行时状态目录。
4. 最后清理旧文案与残留旧路径引用。

这样可以确保每一步都能独立验证。

## 4. 当前 gstack 的实际构成

基于现有仓库扫描，`gstack` 不是单一目录集合，而是一个完整的软件工厂，至少包含六层：

### 4.1 顶层产品层

- `README.md`
- `ARCHITECTURE.md`
- `AGENTS.md`
- `CONTRIBUTING.md`
- `CHANGELOG.md`
- `CLAUDE.md`
- `ETHOS.md`

### 4.2 Skill 模板层

- 顶层 `SKILL.md.tmpl`
- 各 skill 目录下的 `SKILL.md.tmpl`
- 生成后的 `SKILL.md`

### 4.3 运行时层

- `browse/src/*`
- `bin/*`
- `setup`

### 4.4 生成层

- `scripts/gen-skill-docs.ts`
- `scripts/skill-check.ts`
- `scripts/dev-skill.ts`

### 4.5 测试层

- `browse/test/*`
- `test/*`

### 4.6 外部集成层

- `.agents/skills/gstack-*`
- `.agents/skills/gstack`
- `supabase/*`
- GitHub workflow

结论：这次迁移不能只搬 skill 目录，必须把“模板、生成器、二进制、状态目录、文档、测试、安装器”作为一个整体迁移。

## 5. 关键命名映射

### 5.1 项目级命名映射

建议统一采用以下映射：

| 原标识 | 新标识 | 说明 |
|---|---|---|
| `gstack` | `spec-first` | 主项目名、仓库名、目录名 |
| `~/.gstack` | `~/.spec-first` | 用户全局状态目录 |
| `.gstack` | `.spec-first` | 项目内运行时状态目录 |
| `~/.claude/skills/gstack` | `~/.claude/skills/spec-first` | Claude 安装目录 |
| `~/.codex/skills/gstack` | `~/.codex/skills/spec-first` | Codex 安装目录 |
| `.agents/skills/gstack-*` | `.agents/skills/spec-first-*` | 生成的 Codex/Agents skill |
| `.agents/skills/gstack` | `.agents/skills/spec-first` | sidecar 运行时目录 |

### 5.2 二进制与脚本命名映射

建议全部显式改名：

| 原命令 | 新命令 |
|---|---|
| `gstack-config` | `spec-first-config` |
| `gstack-update-check` | `spec-first-update-check` |
| `gstack-slug` | `spec-first-slug` |
| `gstack-review-log` | `spec-first-review-log` |
| `gstack-review-read` | `spec-first-review-read` |
| `gstack-telemetry-log` | `spec-first-telemetry-log` |
| `gstack-telemetry-sync` | `spec-first-telemetry-sync` |
| `gstack-diff-scope` | `spec-first-diff-scope` |
| `gstack-analytics` | `spec-first-analytics` |
| `gstack-community-dashboard` | `spec-first-community-dashboard` |

### 5.3 注意

`browse` 命令名不建议改。

原因：

- 它在系统中是能力名，不是品牌名。
- README、技能文档、测试、用户习惯都围绕 `/browse`。
- 改它会引入行为感知变化，不符合“只迁移，不改功能”。

所以应当保留：

- `/browse` skill 名称不变
- `browse` 二进制入口不变

改的是其所属项目与路径，而不是能力名。

## 6. 风险最高的迁移点

### 6.1 `~/.gstack` 到 `~/.spec-first`

这是最危险的点，因为这里承载：

- telemetry
- analytics
- sessions
- contributor logs
- projects
- config.yaml
- upgrade snooze / prompt state

如果只改写入路径、不同步搬迁状态内容，会导致：

- 配置丢失
- 遥测状态重置
- 用户看到“像第一次安装”
- 一些 skill 的行为与旧版本不一致

建议方案：

1. 一次性把状态目录目标定为 `~/.spec-first`。
2. 如需迁移旧数据，采用显式搬迁，而不是运行时双读。
3. 迁移完成后，代码中不再以旧路径作为合法运行路径。

### 6.2 `.gstack` 到 `.spec-first`

项目内状态目录保存 browse server 的状态和日志。

风险：

- server 找不到旧状态文件
- 老 PID 文件残留
- 版本文件与重启逻辑失效
- 测试断言仍写死 `.gstack`

建议方案：

- 运行时只使用 `.spec-first`
- 如有旧 `.gstack` 数据，迁移时一次性搬到新目录
- 不把 `.gstack` 保留为目标态运行分支

### 6.3 `scripts/gen-skill-docs.ts`

这是迁移的中枢，因为它会把：

- `skillRoot`
- `localSkillRoot`
- `binDir`
- `browseDir`
- preamble Bash
- upgrade 提示
- telemetry 提示

全部灌入最终 `SKILL.md`。

如果这里没彻底改干净，会出现：

- 源码叫 `spec-first`
- 生成产物仍引用 `gstack`
- setup 装的是 `spec-first`
- skill 运行时却去找 `~/.claude/skills/gstack/bin/gstack-update-check`

这会直接导致运行失败。

### 6.4 `setup`

`setup` 是第二个中枢。它负责：

- build
- playwright 校验
- 技能目录安装
- Claude/Codex 的软链创建
- `.agents/skills/*` sidecar 创建

风险点：

- 变量名 `GSTACK_DIR`
- 全局状态目录 `~/.gstack/projects`
- Claude 安装目录
- Codex 安装目录
- `.agents/skills/gstack-*`
- `.agents/skills/gstack`

这里如果只改一半，安装出来的系统会结构错乱。

### 6.5 生成产物目录 `.agents/skills/gstack-*`

这是一个很容易漏的地方，因为它不是源码目录，而是生成物目录，但运行时会依赖它。

必须同步改：

- 目录前缀
- 文档内部路径
- sidecar 指向
- setup 中的软链逻辑

### 6.6 测试中的硬编码引用

从仓库结构看，测试覆盖很广，很多断言很可能直接写了：

- `~/.gstack`
- `.gstack`
- `gstack-*`
- `~/.claude/skills/gstack`
- `~/.codex/skills/gstack`

如果这些不系统修复，就会出现“代码已改，测试全红”。

## 7. 推荐迁移策略

推荐采用“五阶段迁移”，而不是一次性整体替换。

### 阶段 0：冻结与基线

目标：锁住当前 gstack 的功能基线，避免迁移和功能修改混在一起。

动作：

1. 在 `spec-first-pro` 内建立迁移工作分支。
2. 记录源仓库基线 commit，例如当前看到的是 `dbd98af`。
3. 输出完整清单：
   - 所有目录
   - 所有 `gstack` 关键字引用
   - 所有 `.gstack`、`~/.gstack`、`gstack-` 引用
4. 记录当前 build/test/setup 的可运行状态。

交付物：

- 一份引用清单
- 一份迁移边界说明
- 一份基线验证结果

通过标准：

- 知道哪些地方要改，哪些地方绝不能碰。

### 阶段 1：源码原样迁入，不做 rename

目标：先把源仓库内容完整落入 `spec-first-pro`，得到一个“功能等价但名字仍旧”的中间态。

动作：

1. 把 gstack 源码完整复制进当前仓库的目标位置。
2. 保留目录结构与文件内容原样。
3. 不在这一阶段做逻辑调整。
4. 先确保：
   - 能 build
   - 能生成 skill 文档
   - browse 可编译
   - 测试可跑

原因：

- 先证明“代码迁入没坏”。
- 把“搬运问题”和“rename 问题”拆开。

通过标准：

- 在新仓库里，仍然以旧名字 `gstack` 跑通一次完整链路。

### 阶段 2：品牌与路径 rename

目标：把所有核心标识彻底改成 `spec-first`。

动作：

1. 改 package 名称与文档品牌。
2. 改 setup 中的安装目录与 sidecar 目录。
3. 改生成脚本中的 host path 常量。
4. 改二进制和 helper 命令名。
5. 改用户全局状态目录默认值：
   - `~/.gstack` -> `~/.spec-first`
6. 改项目本地状态目录默认值：
   - `.gstack` -> `.spec-first`
7. 清理所有目标态运行路径中的旧目录引用。

通过标准：

- 新安装全部落在 `spec-first` 名下。
- 运行时主路径不再接受旧目录。

### 阶段 3：生成产物与测试体系全面收口

目标：让“源码名、生成名、安装名、测试断言名”完全一致。

动作：

1. 重新生成所有 `SKILL.md`。
2. 重新生成 `.agents/skills/spec-first-*`。
3. 更新测试 fixture 与快照。
4. 修复所有硬编码路径断言。
5. 运行：
   - build
   - skill freshness check
   - 单测
   - 关键 E2E

通过标准：

- 仓库中不再残留目标态性质的 `gstack` 关键标识。

### 阶段 4：迁移安装链路与文档

目标：让用户首次接触到的一切入口都指向 `spec-first`。

动作：

1. 重写 README 安装命令。
2. 重写 CONTRIBUTING 中的本地开发方式。
3. 重写 CLAUDE/Codex/Cursor 的安装说明。
4. 更新截图、示例输出、命令示例。
5. 明确旧路径清理策略：
   - 是否需要一次性搬迁旧目录内容
   - 是否需要发布迁移说明
   - 哪些旧名仅允许存在于历史说明中

通过标准：

- 新用户不会再看到 `gstack`。
- 老用户只看到迁移说明，不继续使用旧入口。

### 阶段 5：残留旧名清理

目标：在确认稳定后，移除旧名的剩余包袱。

动作：

1. 统计仍依赖旧路径的代码点。
2. 清理以下旧名：
   - `~/.gstack`
   - `.gstack`
   - `gstack-*`
3. 如果决定移除：
   - 发布迁移说明
   - 给出一次性迁移脚本
   - 更新 CHANGELOG

通过标准：

- 项目内部只剩 `spec-first` 语义。

## 8. 详细执行方案

### 8.1 文件落位建议

建议把迁移后的核心代码落位为“项目根即产品根”，而不是包一层 `gstack/` 子目录。

推荐结果：

```text
spec-first-pro/
├── README.md
├── ARCHITECTURE.md
├── AGENTS.md
├── CLAUDE.md
├── package.json
├── setup
├── scripts/
├── browse/
├── review/
├── qa/
├── ship/
├── brainstorm/
├── ...
├── .agents/skills/spec-first-*
└── docs/
```

不推荐：

```text
spec-first-pro/
└── gstack/
    ├── ...
```

原因：

- 用户已经明确项目名是 `spec-first`。
- 如果再套一层 `gstack/`，后续文档、脚本、路径全部会变得别扭。

### 8.2 rename 执行顺序

推荐严格按下面顺序：

1. 顶层元数据
   - `package.json`
   - `README.md`
   - `CHANGELOG.md`
2. 安装脚本
   - `setup`
3. 生成脚本
   - `scripts/gen-skill-docs.ts`
4. 辅助脚本与 `bin/*`
5. browse 运行时路径常量
6. skill 模板
7. 生成产物
8. 测试
9. 文档

原因：

- `setup` 和 `gen-skill-docs.ts` 是最关键的两个中枢。
- 先改它们，后续生成物才会正确。

### 8.3 彻底替换设计

为了满足“彻底改为 spec-first”，迁移设计应遵守两条硬规则：

#### A. 状态目录只保留新名

逻辑：

1. 运行时只写 `~/.spec-first` 和 `.spec-first`
2. 如需处理旧目录，只在迁移动作里一次性搬迁
3. 搬迁完成后，旧目录不再作为合法运行路径

#### B. 命令入口只保留新名

逻辑：

1. 新脚本名全面使用 `spec-first-*`
2. 不把 `gstack-*` 包装脚本设计成长期保留层
3. 文档、欢迎语、skill 路由全部只指向 `spec-first`

### 8.4 自动生成体系调整

`scripts/gen-skill-docs.ts` 是最先要改的关键文件之一。

需要改的不是单词替换，而是语义映射：

- `skillRoot`
- `localSkillRoot`
- `binDir`
- `browseDir`
- preamble 中的 update-check/config/telemetry 命令
- 文案里的项目名
- `.agents/skills/gstack-*` 输出前缀

这里必须保证：

```text
源码常量
    ->
生成模板
    ->
最终 SKILL.md
    ->
setup 安装目录
    ->
运行时脚本查找路径
```

五者完全一致。

### 8.5 `setup` 改造重点

`setup` 中建议重点检查以下点：

1. `GSTACK_DIR` 变量体系改名
2. 全局状态目录创建位置
3. Claude 技能安装根目录
4. Codex 技能安装根目录
5. `link_claude_skill_dirs`
6. `link_codex_skill_dirs`
7. `create_agents_sidecar`
8. build 后产物检查路径

尤其是：

- `.agents/skills/spec-first-*`
- `.agents/skills/spec-first`

一定要与生成器保持一致。

### 8.6 browse 运行时调整

这里重点不是功能，而是路径与日志归宿：

- state file
- server log
- console/network/dialog log
- crash log
- version file发现逻辑

建议策略：

1. 默认写入 `.spec-first/`
2. 测试只验证新目录行为
3. 旧 `.gstack/` 只作为迁移前输入，不作为目标态运行分支

### 8.7 文档迁移策略

文档不能只搜 `gstack` 字符串替换，因为 README 里包含三类内容：

1. 品牌叙事
2. 安装命令
3. 使用示例

迁移要求：

- 品牌改成 `spec-first`
- 安装命令改成 `spec-first`
- 示例输出里的路径、命令、目录也同步更新

但以下可以保持不变：

- `/browse` 作为能力名
- skill 的行为描述
- 流程方法论

## 9. 验证方案

迁移不是“改完能编译”就算完成，至少要做四层验证。

### 9.1 静态验证

- 全仓搜索是否仍有不该存在的 `gstack`
- 全仓搜索是否仍有不该存在的 `.gstack`
- 全仓搜索是否仍有不该存在的 `~/.gstack`
- 全仓搜索是否仍有旧的 `.agents/skills/gstack-*`

注意：历史说明、现状分析和代码事实引用中的旧名不算问题；目标态设计中的旧名算问题。

### 9.2 构建验证

至少验证：

- `bun install`
- `bun run build`
- `bun run gen:skill-docs`
- 生成后的 skill 目录完整

### 9.3 安装验证

至少验证三条路径：

1. Claude 安装
2. Codex 安装
3. `--host auto`

检查点：

- 技能目录是否正确软链
- sidecar 是否正确创建
- browse 二进制是否可执行

### 9.4 运行验证

至少验证：

1. `/browse`
2. 一个 plan 类 skill
3. 一个 review/qa 类 skill
4. 一个 telemetry/config 相关命令

目标不是跑全量业务，而是证明：

- skill 文档引用正确
- runtime 路径正确
- helper 命令可找到
- state 目录正常读写

## 10. 回滚方案

迁移必须有回滚设计，否则一旦安装目录和状态目录切错，恢复会很痛苦。

推荐回滚策略：

### 10.1 代码回滚

- 每个阶段独立提交
- 每个阶段都保持可运行
- 不跨阶段混提交

### 10.2 状态回滚

在第一次自动迁移前备份：

- `~/.gstack` -> `~/.gstack.bak.<timestamp>`
- `.gstack` -> `.gstack.bak.<timestamp>`

如果新目录失败：

- 可恢复到旧状态目录继续工作

### 10.3 安装回滚

如果 `~/.claude/skills/spec-first` 安装失败：

- 恢复 `~/.claude/skills/gstack`
- 恢复旧 sidecar 软链

如果 `~/.codex/skills/spec-first` 安装失败：

- 恢复 `~/.codex/skills/gstack`

## 11. 推荐实施顺序

如果要真正落地，我建议按下面顺序执行，而不是一口气改完。

### 第 1 步：做 inventory

产出：

- 引用清单
- 命名映射表
- 风险表

### 第 2 步：把 gstack 原样迁入当前仓库

目标：

- 先证明“搬得进来”

### 第 3 步：先改 `setup` 与 `gen-skill-docs.ts`

目标：

- 先打通安装与生成的主干

### 第 4 步：改运行时路径与 `bin/*`

目标：

- 让 `spec-first` 版本真正能运行

### 第 5 步：改 skill 模板与生成产物

目标：

- 让最终用户看到的内容统一

### 第 6 步：修测试

目标：

- 把所有路径硬编码和旧命名断言收掉

### 第 7 步：改文档与升级说明

目标：

- 新用户看不到旧名
- 老用户知道如何迁移

### 第 8 步：清理残留旧名

目标：

- 从“可迁移”升级到“已完成迁移”

## 12. 结论

这次迁移的正确理解不是“复制一份 gstack，再批量替换字符串”，而是：

1. 把一个已有完整运行时、完整生成系统、完整安装系统、完整状态目录体系的项目，整体迁入 `spec-first`。
2. 把 `gstack` 从“品牌名 + 路径名 + 目录名 + 命令名前缀 + 状态目录前缀 + 生成产物前缀”六个层面全部替换为 `spec-first`。
3. 在不改变任何功能的前提下，把目标态运行路径、命令和入口全部切到 `spec-first`，不保留双轨目标态。

最关键的四个中枢是：

1. `setup`
2. `scripts/gen-skill-docs.ts`
3. `bin/gstack-*` helper 命令层
4. browse 运行时中的状态路径解析逻辑

只要这三个点先稳住，后面的 skill 文档、测试、安装和文档迁移都会变成可控工作；如果这三个点没先打通，后面改再多名字也只是表面迁移。

## 13. 下一步建议

下一步不要直接动手全改，应该先产出一份“迁移执行清单”，把具体要改的文件逐个列出来，按阶段拆成可以实际执行的 task。

建议下一份文档是：

`spec-first-迁移执行清单.md`

它应当包含：

- 要复制的目录
- 要重命名的文件
- 要改的脚本
- 要改的常量
- 要回归的测试
- 每一步的完成标准
