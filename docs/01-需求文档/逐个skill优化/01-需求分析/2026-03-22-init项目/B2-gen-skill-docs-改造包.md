# B2-gen-skill-docs-改造包

文档日期：2026-03-22
所属阶段：阶段 B
任务包目标：完成 `scripts/gen-skill-docs.ts` 生成中枢迁移，使生成器注入的公共路径、公共命令前缀与 `spec-first` 一致

## 1. 任务包定位

`B2` 是整个迁移里最关键、最密集的单文件改造包。

原因很直接：

```text
setup 决定装在哪
gen-skill-docs.ts 决定生成出来的 skill 最终引用哪
browse runtime 决定运行时写到哪
```

其中 `gen-skill-docs.ts` 是“生成闭环”的中心。

如果 `B2` 没改对，会直接出现下面这种断裂：

- `setup` 已安装到 `spec-first`
- 但生成后的 `SKILL.md` 还在调用 `~/.claude/skills/gstack/bin/gstack-config`
- 或者 Codex 产物还在 `.agents/skills/gstack-*`

这会导致迁移表面完成，运行时实际不可用。

注意：

- `B2` 只覆盖生成器里“由生成器注入的公共内容”
- 各个 `SKILL.md.tmpl` 自己手写的 `gstack` / `.gstack` / `gstack-*` 不属于 `B2` 单独完成范围
- 那部分要在阶段 C 逐个 skill 收口

## 2. 本任务包覆盖文件

### 主文件

- `scripts/gen-skill-docs.ts`

说明：

- `B2` 只处理这个文件
- 不直接处理生成后的 `SKILL.md`
- 不直接处理各个 `SKILL.md.tmpl`

这些属于后续阶段 C 的模板和产物收口

## 3. 当前已识别的关键旧引用类型

从扫描结果看，这个文件里的旧引用可以分成 6 类。

### 3.1 Host 路径常量

已识别：

- `~/.claude/skills/gstack`
- `.claude/skills/gstack`
- `~/.codex/skills/gstack`
- `.agents/skills/gstack`
- `~/.claude/skills/gstack/bin`
- `~/.codex/skills/gstack/bin`
- `~/.claude/skills/gstack/browse/dist`
- `~/.codex/skills/gstack/browse/dist`

### 3.2 Helper 命令前缀

已识别：

- `gstack-update-check`
- `gstack-config`
- `gstack-telemetry-log`
- `gstack-diff-scope`
- `gstack-review-log`
- `gstack-review-read`
- `gstack-slug`

### 3.3 用户全局状态目录

已识别：

- `~/.gstack/sessions`
- `~/.gstack/analytics`
- `~/.gstack/.completeness-intro-seen`
- `~/.gstack/.telemetry-prompted`
- `~/.gstack/contributor-logs/*`
- `~/.gstack/projects/*`

### 3.4 项目局部状态目录

已识别：

- `.gstack/design-reports/*`
- `.gstack/no-test-bootstrap`

### 3.5 品牌和产品名文案

已识别：

- `gstack follows the Boil the Lake principle`
- `Help gstack get better!`
- `Running gstack v{to}`
- `/gstack-upgrade`

### 3.6 Agents 生成前缀逻辑

已识别：

- `if (skillDir.startsWith('gstack-')) return skillDir;`
- `return \`gstack-${skillDir}\`;`
- `.agents/skills/gstack/review`

## 4. 目标状态

`B2` 完成后，生成中枢应满足以下目标。

### 4.1 Claude host 目标

默认引用：

- `~/.claude/skills/spec-first`
- `.claude/skills/spec-first`

### 4.2 Codex host 目标

默认引用：

- `~/.codex/skills/spec-first`
- `.agents/skills/spec-first`
- `.agents/skills/spec-first-*`

### 4.3 Helper 命令目标

默认注入命令前缀：

- `spec-first-*`

### 4.4 状态目录目标

默认全局状态目录：

- `~/.spec-first`

默认项目局部状态目录：

- `.spec-first`

### 4.5 文案目标

所有由生成器注入到最终 skill 文档中的用户可见品牌，统一为：

- `spec-first`

## 5. 任务拆解

## 5.1 B2-01 改 `HOST_PATHS`

目标：

- 把生成器内对 Claude/Codex 的安装根路径切到 `spec-first`

当前关键结构：

- `claude.skillRoot`
- `claude.localSkillRoot`
- `claude.binDir`
- `claude.browseDir`
- `codex.skillRoot`
- `codex.localSkillRoot`
- `codex.binDir`
- `codex.browseDir`

目标结果：

- `~/.claude/skills/spec-first`
- `.claude/skills/spec-first`
- `~/.codex/skills/spec-first`
- `.agents/skills/spec-first`

验收：

- 生成文档里的所有 host 路径都统一指向 `spec-first`

风险：

- Claude 和 Codex 改了一半，容易形成宿主不一致

## 5.2 B2-02 改 preamble 中的 update/config/telemetry 命令

目标：

- 生成文档中的 preamble 不再调用 `gstack-*`

当前关键点：

- `_UPD=$(${ctx.paths.binDir}/gstack-update-check ...`
- `_CONTRIB=$(${ctx.paths.binDir}/gstack-config ...`
- `_PROACTIVE=$(${ctx.paths.binDir}/gstack-config ...`
- `${ctx.paths.binDir}/gstack-telemetry-log ...`

目标结果：

- `spec-first-update-check`
- `spec-first-config`
- `spec-first-telemetry-log`

验收：

- 最终生成出来的任意 `SKILL.md` 中，preamble 命令前缀正确

风险：

- 命令前缀不统一会直接导致 skill 无法执行

## 5.3 B2-03 改用户全局状态目录注入

目标：

- 生成器注入到文档里的所有 `~/.gstack/*` 切到 `~/.spec-first/*`

当前已知点：

- `~/.gstack/sessions`
- `~/.gstack/analytics`
- `~/.gstack/.completeness-intro-seen`
- `~/.gstack/.telemetry-prompted`
- `~/.gstack/contributor-logs`
- `~/.gstack/projects`

目标结果：

- 全部切到 `~/.spec-first/*`

兼容要求：

- 阶段 B 里只要求生成的默认路径改为新目录
- 旧目录兼容逻辑主要应由脚本和 runtime 处理

验收：

- 最终 skill 文档里的默认状态目录全部统一为 `~/.spec-first`

风险：

- 如果脚本层与生成文档层状态目录不一致，用户会看到自相矛盾的指令

## 5.4 B2-04 改项目局部状态目录注入

目标：

- 把生成器注入的 `.gstack/*` 切到 `.spec-first/*`

当前已知点：

- `.gstack/design-reports/...`
- `.gstack/no-test-bootstrap`

目标结果：

- `.spec-first/design-reports/...`
- `.spec-first/no-test-bootstrap`

验收：

- 生成文档中不再建议用户写入 `.gstack/*`

风险：

- browse runtime 如果已经迁到 `.spec-first`，而生成文档仍写 `.gstack`，会形成项目内双状态目录

## 5.5 B2-05 改 skill 运行时资产路径

目标：

- skill 文档运行时去找的 `bin/`、`review/` 等资产，路径统一到 `spec-first`

当前已知点：

- `~/.claude/skills/gstack/bin/...`
- `.agents/skills/gstack/review`
- `.claude/skills/review` -> `.agents/skills/gstack/review` 替换逻辑

目标结果：

- `~/.claude/skills/spec-first/bin/...`
- `.agents/skills/spec-first/review`

验收：

- 生成后的 skill 文档引用 sidecar 时能找到正确资产

风险：

- 这类路径如果漏改，问题通常只会在某个具体 skill 运行时才暴露

## 5.6 B2-06 改品牌与用户可见文案

目标：

- 所有注入到最终技能文档中的品牌文案统一为 `spec-first`

当前已知点：

- `gstack follows the Boil the Lake principle`
- `Help gstack get better!`
- `Running gstack v{to}`
- `/gstack-upgrade`
- `gstack-config set telemetry off`

目标结果：

- `spec-first follows ...`
- `Help spec-first get better!`
- `Running spec-first v{to}`
- `/spec-first-upgrade` 或新的升级 skill 名

注意：

- 升级 skill 名是否保留 `gstack-upgrade` 需要统一决策
- 若最终决定改名，这里必须同步切换

验收：

- 生成器注入的公共文案中，用户不会再看到旧品牌名

风险：

- 若文案改了但路径没改，属于假迁移
- 若路径改了但文案没改，属于半迁移

## 5.7 B2-07 改 agents 输出前缀生成逻辑

目标：

- 生成的 Codex/Agents skill 前缀从 `gstack-*` 改为 `spec-first-*`

当前关键逻辑：

- `if (skillDir.startsWith('gstack-')) return skillDir;`
- `return \`gstack-${skillDir}\`;`

目标结果：

- 避免双前缀
- 正确输出 `spec-first-*`

验收：

- 生成目录名称与 `setup` 安装规则一致

风险：

- 这是 `.agents/skills/spec-first-*` 是否成立的单点核心

## 5.8 B2-08 改特殊临时文件与截图路径中的品牌名

目标：

- 把品牌化的临时文件名切到 `spec-first`

当前已知点：

- `/tmp/gstack-sketch-*.html`
- `/tmp/gstack-sketch.png`

目标结果：

- `/tmp/spec-first-sketch-*.html`
- `/tmp/spec-first-sketch.png`

说明：

- 这类改动不影响功能，但影响一致性和调试体验

验收：

- 生成文档里的临时文件名不再残留旧品牌

## 5.9 B2-09 改 `gstack-upgrade` 相关路径与 skill 名

目标：

- 明确升级 skill 的新名字和路径引用

当前已知点：

- `${ctx.paths.skillRoot}/gstack-upgrade/SKILL.md`
- `/gstack-upgrade`

这里必须做一个统一决策：

### 方案 A

保留目录名和 skill 名为 `gstack-upgrade`

优点：

- 少改一点

缺点：

- 品牌残留非常明显

### 方案 B

统一改成 `spec-first-upgrade`

优点：

- 品牌完整

缺点：

- 要同步改目录、模板、安装、文档和生成器

建议：

- 从迁移完整性出发，推荐方案 B

验收：

- 生成文档中升级入口名称与真实目录结构一致

## 6. 推荐执行顺序

`B2` 内部建议按下面顺序推进。

1. 先改 `HOST_PATHS`
2. 再改 helper 命令前缀
3. 再改全局/局部状态目录
4. 再改 sidecar 与资产路径
5. 再改 agents 输出前缀逻辑
6. 最后改品牌文案与临时文件名

原因：

- 路径和前缀是结构性改动
- 文案和临时文件名是表层一致性改动

## 7. 本任务包的完成定义

`B2` 只有在下面全部成立时，才算完成：

1. 生成器的 Claude/Codex host 路径全部切到 `spec-first`
2. 生成器注入的 helper 命令前缀全部切到 `spec-first-*`
3. 生成器注入的默认状态目录全部切到 `~/.spec-first` / `.spec-first`
4. agents 输出前缀逻辑改为 `spec-first-*`
5. 生成器负责的升级 skill 路径与公共品牌文案达成统一

## 8. 本任务包不处理的内容

`B2` 不处理：

- `setup`
- `browse` runtime 的真实状态目录实现
- 各 `SKILL.md.tmpl` 中手写旧路径/旧命令的直接人工修改
- 生成后产物的逐文件收口
- 测试修复

这些分别属于 `B1`、`B3` 和阶段 C。

## 9. B2 完成后的下一步

`B2` 完成后，最合理的下一步是：

- `B3-browse-runtime-改造包`

因为到这时安装与生成语义已经确定，运行时路径层就可以围绕 `spec-first` 做最终闭环。
