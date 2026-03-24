# G5-升级与特殊迁移skill迁移包

文档日期：2026-03-22
所属阶段：阶段 C
任务包目标：完成升级入口、版本检查、自动升级配置、snooze 状态与“刚升级”标记的最终迁移定版，收口 `gstack-upgrade` / `spec-first-upgrade` 相关的命名和执行链

## 1. 任务包定位

`G5` 是阶段 C 的最后一个任务包。

本组包含：

- `gstack-upgrade` 或未来定版后的 `spec-first-upgrade`

之所以把它单独放在最后，是因为升级 skill 不是普通 skill。

它同时碰到 5 条主链：

1. 根 skill 与 setup 的用户入口提示
2. `gstack-update-check` 的前导检查链
3. `gstack-config` 的自动升级配置链
4. `~/.gstack/*` 下的升级状态文件
5. vendored install / primary install 的同步与回滚链

这意味着 `G5` 只能在前面所有主链都稳定后再做最终定版。

## 2. 本任务包覆盖文件

- `gstack-upgrade/SKILL.md.tmpl`
- `gstack-upgrade/SKILL.md`
- 根 `SKILL.md.tmpl`
- 根 `SKILL.md`
- `setup`
- `scripts/gen-skill-docs.ts`
- `bin/gstack-update-check`
- `bin/gstack-config`

说明：

- 这组虽然名义上是“skill 包”，但实际已经横跨阶段 B 的部分中枢文件
- 这里的目标不是重新设计功能，而是为升级链做最终命名定版和文档收口

## 3. 当前已识别的关键迁移点

## 3.1 根入口与安装提示

已确认存在：

- 根 `SKILL.md.tmpl` 中的 `suggest /gstack-upgrade`
- `setup` 中的 `Welcome! Run /gstack-upgrade anytime to stay current.`
- `setup` 中的 `/tmp/gstack-latest-version`

说明：

- 只要这里还保留旧入口，整个品牌迁移在用户第一视角上就是未完成状态

## 3.2 生成器前导升级检查

已确认存在：

- `scripts/gen-skill-docs.ts` 调用 `gstack-update-check`
- `scripts/gen-skill-docs.ts` 读取 `gstack-upgrade/SKILL.md`
- 生成器里已有 “不要 double-prefix `gstack-upgrade`” 的特殊逻辑

说明：

- 升级 skill 的命名不是纯文本替换问题
- 生成器里已经为它写了专门分支，所以必须显式迁

## 3.3 升级 skill 模板本身

已确认存在：

- skill 名 `gstack-upgrade`
- 标题 `# /gstack-upgrade`
- `~/.claude/skills/gstack/bin/gstack-config`
- `~/.claude/skills/gstack/bin/gstack-update-check`
- `~/.gstack/config.yaml`
- `~/.gstack/just-upgraded-from`
- `~/.gstack/last-update-check`
- 用户提示文案中的 `upgrade gstack`

说明：

- 这是当前项目里品牌耦合最重的单 skill

## 3.4 `gstack-update-check`

已确认存在：

- 注释直接写 `gstack-update-check`
- `last-update-check`
- `just-upgraded-from`
- 升级提示 telemetry 事件 `upgrade_prompted`

说明：

- telemetry 事件名是否保留，不一定要跟着品牌改
- 但命令名、状态目录根路径和注释文案必须收口

## 3.5 `gstack-config`

已确认存在：

- 升级链依赖 `gstack-config get auto_upgrade`
- 升级链依赖 `gstack-config set auto_upgrade true`

说明：

- 如果升级 skill 改名但 config helper 不改，升级链会断

## 4. 必须先做的定版决策

在真正 patch 之前，必须先明确下面 3 个决策。

## 4.1 升级入口最终命名

必须二选一：

1. 保留 skill 目录名和入口名为 `gstack-upgrade`
2. 全量迁为 `spec-first-upgrade`

推荐：

- 全量迁为 `spec-first-upgrade`

原因：

- 用户入口、根 skill 路由、安装欢迎语和品牌迁移目标一致
- 避免在 `spec-first` 中长期保留一个最显眼的旧品牌命令

## 4.2 状态文件目录是否统一迁到 `~/.spec-first`

必须明确：

- `config.yaml`
- `last-update-check`
- `just-upgraded-from`
- snooze 状态

是否全部统一到 `~/.spec-first`

推荐：

- 全量统一到 `~/.spec-first`

原因：

- 否则升级链会成为最后一个仍在写 `~/.gstack` 的主路径

## 4.3 telemetry 事件名是否改品牌

必须明确：

- `upgrade_prompted` 这类事件名是产品语义名，还是品牌绑定名

推荐：

- 事件名保留，命令名和路径改品牌

原因：

- 事件名本身不带 `gstack` 品牌
- 没必要为事件名改动增加额外兼容成本

## 5. 目标状态

G5 迁移完成后，这组链路应满足：

1. 升级入口统一为最终定版名，推荐 `spec-first-upgrade`
2. 根 skill、setup 欢迎语、生成器前导升级提示全部引用同一入口
3. `gstack-update-check` / `gstack-config` 统一切到 `spec-first-*`
4. `config.yaml`、`last-update-check`、`just-upgraded-from` 等升级状态文件统一切到 `~/.spec-first`
5. vendored install 同步、失败回滚、just-upgraded marker 逻辑保持原功能不变
6. 生成器中的特殊命名分支与最终入口名保持一致，不再残留 `gstack-upgrade` 特判

## 6. 任务拆解

## 6.1 G5-1 定版升级入口名

重点：

- 最终确定 `gstack-upgrade` 还是 `spec-first-upgrade`
- 同步影响 skill 目录名、skill 名、slash 命令名、根入口提示

专项验证：

- 根 `SKILL.md`、`setup`、升级 skill 本体三处的入口名完全一致

## 6.2 G5-2 迁移升级 skill 模板

重点：

- skill 名
- 标题
- 用户提示语
- `gstack-config` -> `spec-first-config`
- `gstack-update-check` -> `spec-first-update-check`
- `~/.gstack/*` -> `~/.spec-first/*`

专项验证：

- auto-upgrade、not-now snooze、never-ask-again 三条分支都引用新路径

## 6.3 G5-3 迁移根入口和 setup 提示

重点：

- 根 `SKILL.md.tmpl` 中的升级建议
- `setup` 欢迎语
- `/tmp/gstack-latest-version` -> `/tmp/spec-first-latest-version`

专项验证：

- 新安装用户只能看到 `spec-first` 品牌入口，不会再被引导到旧 slash 命令

## 6.4 G5-4 迁移生成器前导升级检查

重点：

- `gstack-update-check` -> `spec-first-update-check`
- `gstack-upgrade/SKILL.md` -> 最终定版 skill 路径
- “不要 double-prefix” 的特殊逻辑同步改到最终命名

专项验证：

- 生成器不会产生 `spec-first-spec-first-upgrade` 这类双前缀错误

## 6.5 G5-5 迁移 helper 与状态文件路径

重点：

- `gstack-config` -> `spec-first-config`
- `gstack-update-check` -> `spec-first-update-check`
- `~/.gstack/config.yaml` -> `~/.spec-first/config.yaml`
- `~/.gstack/just-upgraded-from` -> `~/.spec-first/just-upgraded-from`
- `~/.gstack/last-update-check` -> `~/.spec-first/last-update-check`

专项验证：

- update-check、config、upgrade skill 三方都能读写同一组状态文件

## 7. 统一验证步骤

### Step 1：先做命名定版

在动模板前，先写死：

- 最终 slash 入口名
- skill 目录名
- helper 命令名前缀
- 状态目录根路径

### Step 2：迁模板与文案

统一替换：

- `gstack-upgrade`
- `/gstack-upgrade`
- `upgrade gstack`
- `gstack-config`
- `gstack-update-check`
- `~/.gstack`
- `/tmp/gstack-latest-version`

### Step 3：重新生成 skill 文档

重新生成：

- 根 `SKILL.md`
- 升级 skill 的 `SKILL.md`

### Step 4：静态搜索

统一搜索：

- `gstack-upgrade`
- `/gstack-upgrade`
- `gstack-update-check`
- `gstack-config`
- `~/.gstack`
- `last-update-check`
- `just-upgraded-from`

### Step 5：升级链闭环验证

最终统一检查：

- 前导 preamble 能否正确触发 upgrade check
- standalone upgrade skill 能否正确读取 force check 结果
- auto-upgrade 能否读取新 config
- snooze 与 just-upgraded marker 是否写入新目录
- setup 欢迎语和根入口提示是否完全一致

## 8. 完成定义

`G5` 只有在下面全部成立时，才算完成：

1. 升级入口名已最终定版
2. 根 skill、setup、生成器、升级 skill 本体已经全部引用同一入口
3. `spec-first-update-check` 与 `spec-first-config` 已接管升级链
4. `~/.spec-first/config.yaml`、`last-update-check`、`just-upgraded-from` 已接管状态文件
5. 自动升级、snooze、never-ask-again、just-upgraded 提示语义保持不变
6. 代码和文档中不再残留旧升级入口的主路径引用

## 9. 风险提示

这一组最大的风险不是“文案还写着 gstack”，而是升级链出现半迁移状态。

典型错误会是：

1. 根 `SKILL.md` 已经建议 `/spec-first-upgrade`
2. 但生成器前导仍然在读取 `gstack-upgrade/SKILL.md`

或者：

1. upgrade skill 已经写入 `~/.spec-first/just-upgraded-from`
2. 但 `update-check` 还在 `~/.gstack/just-upgraded-from` 读 marker

或者：

1. `setup` 欢迎语已经变成 `spec-first-upgrade`
2. 但 helper 命令仍然只有 `gstack-update-check` / `gstack-config`

所以 `G5` 的验证必须围绕“升级链是否完整闭环”展开，而不能只看 skill 模板替换数量。

## 10. 后续关系

`G5` 完成后，阶段 C 才算真正收口。

因为到这时：

- 普通 skill 迁移已完成
- 重依赖 browser / deploy 链已完成
- 升级与版本检查这条最后的特殊链路也已经定版

之后才适合进入阶段 D 的整体验证与定版。
