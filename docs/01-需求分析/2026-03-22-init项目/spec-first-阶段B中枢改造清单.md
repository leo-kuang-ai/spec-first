# spec-first 阶段 B 中枢改造清单

文档日期：2026-03-22
阶段目标：打通 `spec-first` 迁移的四个中枢，不改变任何功能
阶段范围：

1. `setup`
2. `scripts/gen-skill-docs.ts`
3. `bin/gstack-*` helper 脚本层
4. `browse` 运行时路径与状态目录解析

## 1. 阶段 B 的定位

阶段 B 不是“全面改名”，而是“先把系统主干改成能跑的 spec-first”。

这一步只解决一个问题：

```text
spec-first 能不能以自己的名字、自己的路径、自己的状态目录
完成安装、生成、运行
```

如果这一步没完成，后面的模板、测试、文档全部没有意义。

## 2. 四大中枢

### 中枢 1：安装中枢

文件：

- `setup`

职责：

- 安装到宿主技能目录
- 初始化全局状态目录
- 创建 `.agents` sidecar
- 构建 `browse`

### 中枢 2：生成中枢

文件：

- `scripts/gen-skill-docs.ts`

职责：

- 生成 Claude host skill
- 生成 Codex/Agents host skill
- 注入路径、命令、状态目录、升级提示、telemetry 提示

### 中枢 3：helper 命令中枢

文件：

- `bin/gstack-config`
- `bin/gstack-update-check`
- `bin/gstack-slug`
- `bin/gstack-review-log`
- `bin/gstack-review-read`
- `bin/gstack-diff-scope`
- `bin/gstack-telemetry-log`
- `bin/gstack-telemetry-sync`
- 以及其他 `bin/gstack-*`

职责：

- 提供 skill 真正执行时依赖的命令入口
- 读写 `~/.gstack`
- 连接 review / telemetry / update-check / config 等公共能力

### 中枢 4：运行时中枢

文件：

- `browse/src/config.ts`
- `browse/src/cli.ts`
- `browse/src/server.ts`
- `browse/src/browser-manager.ts`
- 相关路径配置代码

职责：

- 决定 `.gstack` / `.spec-first` 的状态目录归属
- 决定 browse state/log 的实际落点
- 决定 server 如何恢复与启动

## 3. 阶段 B 的原则

### 原则 1：只改主干，不改全仓

阶段 B 不追求把所有 `gstack` 字样都清掉。

阶段 B 的目标是：

- 主干能工作
- 路径能闭环
- 生成能闭环
- 运行时能闭环

### 原则 2：新路径一次定准

优先级应该是：

1. 新路径 `spec-first` 可工作
2. 旧路径只用于审计与迁移输入
3. 目标态不保留旧别名

### 原则 3：阶段 B 不设计长期兼容层

阶段 B 的职责是把主干一次切到新路径，而不是设计双轨运行。

旧 `gstack` 目录和命令只允许用于：

- 现状扫描
- 迁移前数据确认
- 一次性迁移动作说明

## 4. 中枢 1：`setup` 改造清单

## 4.1 已确认的关键旧引用

从现有文件扫描，`setup` 至少存在以下关键旧引用：

- `mkdir -p "$HOME/.gstack/projects"`
- `.agents/skills/gstack-*`
- `.agents/skills/gstack`
- `Welcome! Run /gstack-upgrade anytime to stay current.`
- `/tmp/gstack-latest-version`

## 4.2 目标状态

改造完成后，`setup` 应满足：

1. 默认安装到：
   - `~/.claude/skills/spec-first`
   - `~/.codex/skills/spec-first`
2. 默认初始化全局状态目录：
   - `~/.spec-first`
3. 默认创建 agents sidecar：
   - `.agents/skills/spec-first`
4. 默认安装 agents 生成目录：
   - `.agents/skills/spec-first-*`

## 4.3 具体任务

### B1-1 改变量命名

目标：

- 把 `GSTACK_DIR` 一类内部变量体系改成 `SPEC_FIRST_DIR` 或中性变量名。

说明：

- 这一步主要是可维护性，不是功能要求。
- 如果保留旧变量名，也能运行，但后续同步会更乱。

### B1-2 改宿主安装目录

目标：

- Claude/Codex 安装目录默认落在 `spec-first`

要改：

- 所有 `~/.claude/skills/gstack`
- 所有 `~/.codex/skills/gstack`

### B1-3 改全局状态目录初始化

目标：

- `~/.gstack/projects` -> `~/.spec-first/projects`

附加要求：

- 如果存在旧 `~/.gstack` 数据，应通过迁移动作搬到 `~/.spec-first`，而不是在目标态继续双读

### B1-4 改 agents 生成目录前缀

目标：

- `.agents/skills/gstack-*` -> `.agents/skills/spec-first-*`

### B1-5 改 sidecar 目录名

目标：

- `.agents/skills/gstack` -> `.agents/skills/spec-first`

### B1-6 改欢迎提示与缓存文件名

目标：

- 把面向用户的 `/gstack-upgrade` 提示改成 `spec-first` 版本
- 把 `/tmp/gstack-latest-version` 这类品牌化临时文件改名

## 4.4 `setup` 的验收标准

完成后至少满足：

1. `./setup --host claude` 安装目录正确
2. `./setup --host codex` 安装目录正确
3. `./setup --host auto` 路径推导正确
4. `.agents/skills/spec-first` 被正确创建
5. `.agents/skills/spec-first-*` 被正确链接

## 4.5 `setup` 风险

最高风险：

- 安装目录改了，但 sidecar 还叫 `gstack`
- sidecar 改了，但生成目录还叫 `gstack-*`
- 状态目录初始化改了，但脚本和 skill 还写回旧目录

## 5. 中枢 2：`scripts/gen-skill-docs.ts` 改造清单

## 5.1 已确认的关键旧引用

扫描结果显示，这个文件是迁移中最密集的旧名聚集点，至少包括：

- `~/.claude/skills/gstack`
- `~/.codex/skills/gstack`
- `.agents/skills/gstack`
- `gstack-update-check`
- `gstack-config`
- `gstack-telemetry-log`
- `~/.gstack/*`
- `.gstack/*`
- `gstack-diff-scope`
- `gstack-review-log`
- `gstack-review-read`
- `gstack-slug`
- `gstack-upgrade`
- `gstack-` 目录前缀生成逻辑

说明：

- 这是整个迁移里最关键、也最危险的单文件。

## 5.2 目标状态

改造完成后，这个文件应满足：

1. 生成给 Claude 的 skill 文档，默认指向：
   - `~/.claude/skills/spec-first`
2. 生成给 Codex 的 skill 文档，默认指向：
   - `~/.codex/skills/spec-first`
   - `.agents/skills/spec-first`
3. 所有 helper 命令默认变为：
   - `spec-first-*`
4. 所有用户全局状态目录默认变为：
   - `~/.spec-first`
5. 所有项目局部状态目录默认变为：
   - `.spec-first`

## 5.3 具体任务

### B2-1 改 `HOST_PATHS`

要改：

- `skillRoot`
- `localSkillRoot`
- `binDir`
- `browseDir`

目标：

- Claude 与 Codex 的路径指向 `spec-first`

### B2-2 改 preamble 中的 helper 命令

要改：

- `gstack-update-check`
- `gstack-config`
- `gstack-telemetry-log`

目标：

- 生成出来的 skill 文档不会再调用旧命令前缀

### B2-3 改用户全局状态目录引用

要改：

- `~/.gstack/sessions`
- `~/.gstack/analytics`
- `~/.gstack/.completeness-intro-seen`
- `~/.gstack/.telemetry-prompted`
- `~/.gstack/contributor-logs/*`
- `~/.gstack/projects/*`

目标：

- 统一切换到 `~/.spec-first/*`

### B2-4 改项目局部状态目录引用

要改：

- `.gstack/design-reports/*`
- `.gstack/no-test-bootstrap`

目标：

- 统一切换到 `.spec-first/*`

### B2-5 改 skill 路径与 sidecar 路径

要改：

- `.agents/skills/gstack/review`
- `~/.claude/skills/gstack/bin/*`

目标：

- skill 运行时能在新目录找到资产

### B2-6 改文案中的项目名

要改：

- `"Running gstack v{to}"`
- `gstack-config set ...`
- `/gstack-upgrade`

目标：

- 生成文档中的用户可见名称统一为 `spec-first`

### B2-7 改 agents 目录前缀生成逻辑

当前已识别逻辑：

- `if (skillDir.startsWith('gstack-')) return skillDir;`
- `return \`gstack-${skillDir}\`;`

目标：

- 改为 `spec-first-*`

这是 Codex/Agents 生成产物命名的核心点。

## 5.4 `gen-skill-docs.ts` 的验收标准

完成后至少满足：

1. 重新生成后，所有 `SKILL.md` 的路径引用正确
2. 重新生成后，所有 helper 命令前缀正确
3. 重新生成后，所有 `.agents/skills/spec-first-*` 命名正确
4. 重新生成后，没有“装在 spec-first，运行时还去找 gstack”的断裂

## 5.5 `gen-skill-docs.ts` 风险

最高风险：

- 源码已改，生成产物未改
- Claude host 已改，Codex host 未改
- 命令前缀已改，状态目录仍旧写在 `~/.gstack`
- 文案已改，但脚本路径还指向旧 sidecar

## 6. 中枢 3：`bin/gstack-*` helper 改造清单

## 6.1 已确认的关键事实

当前代码中，阶段 B 之外仍有一整批 helper 脚本直接构成运行闭环的一部分，包括：

- `bin/gstack-config`
- `bin/gstack-update-check`
- `bin/gstack-slug`
- `bin/gstack-review-log`
- `bin/gstack-review-read`
- `bin/gstack-diff-scope`
- `bin/gstack-telemetry-log`
- `bin/gstack-telemetry-sync`

这些脚本目前直接写死：

- `~/.gstack`
- `gstack-*` 命令前缀
- `gstack` 相关 usage / 自调用

所以如果不把它们纳入阶段 B，阶段 B 的“安装/生成/运行闭环”结论并不成立。

## 6.2 目标状态

改造完成后，这批 helper 应满足：

1. 默认命令前缀切到 `spec-first-*`
2. 默认全局状态目录切到 `~/.spec-first`
3. 自调用链条统一使用新命令名
4. 目标态不再把旧 `~/.gstack` 作为合法运行路径

## 6.3 具体任务

### B4-1 改命令文件名与 usage

目标：

- `gstack-*` -> `spec-first-*`

### B4-2 改全局状态目录默认值

目标：

- `~/.gstack` -> `~/.spec-first`

### B4-3 改 helper 之间的互相调用

目标：

- `gstack-config`、`gstack-update-check`、`gstack-telemetry-log` 等之间的内部调用统一切换

### B4-4 清理旧入口策略

目标：

- 决定 helper 如何彻底退出旧命令入口

## 6.4 helper 中枢的验收标准

完成后至少满足：

1. `spec-first-config`、`spec-first-update-check` 等命令可直接工作
2. 默认写入 `~/.spec-first`
3. helper 之间的互相调用不再依赖 `gstack-*`

## 6.5 helper 中枢风险

最高风险：

- `setup` 和生成器都改了，但真实执行时仍落回旧 helper
- 新旧 helper 混调，导致状态目录和缓存目录错乱

## 7. 中枢 4：browse 运行时改造清单

## 7.1 已确认的关键旧引用

已扫描到的关键点包括：

- `browse/src/config.ts`
  - `projectDir/.gstack/`
  - `.gstack/browse.json`
  - `.gstack/` 写入 `.gitignore`
- `browse/src/cli.ts`
  - `Read .gstack/browse.json`
- `browse/src/server.ts`
  - `State file: <project-root>/.gstack/browse.json`
  - `Log files: <project-root>/.gstack/browse-*.log`
- `browse/src/browser-manager.ts`
  - `.gstack/browse-*.log`

## 7.2 目标状态

改造完成后，browse runtime 应满足：

1. 默认状态目录为：
   - `<project-root>/.spec-first/`
2. 默认状态文件为：
   - `<project-root>/.spec-first/browse.json`
3. 默认日志文件为：
   - `.spec-first/browse-console.log`
   - `.spec-first/browse-network.log`
   - `.spec-first/browse-dialog.log`
4. `.gitignore` 自动写入：
   - `.spec-first/`
5. 兼容旧项目中的 `.gstack/`

## 7.3 具体任务

### B3-1 改 `browse/src/config.ts`

这是运行时中枢的第一优先文件。

要改：

- 默认 `stateDir`
- 默认 `stateFile`
- 注释中的 `.gstack`
- `.gitignore` 自动追加逻辑

处理要求：

- 如果存在旧 `.gstack` 数据，应通过迁移动作搬到 `.spec-first`
- 目标态运行时不再把 `.gstack` 作为合法状态目录

### B3-2 改 `browse/src/cli.ts`

要改：

- 注释与说明中的 `.gstack`
- 启动、恢复、健康检查对状态文件路径的假设

重点：

- `resolveConfig()` 一旦切换，新 CLI 应自动围绕 `.spec-first` 运作

### B3-3 改 `browse/src/server.ts`

要改：

- 注释中的状态文件和日志文件路径说明
- 如有硬编码路径，统一改掉

### B3-4 改 `browse/src/browser-manager.ts`

要改：

- 面向用户或日志输出中的 `.gstack/browse-*.log`

### B3-5 设计旧状态退出逻辑

这里必须明确策略，建议采用：

1. 运行时只读写 `.spec-first`
2. 如果存在旧 `.gstack` 数据，只允许执行一次性迁移
3. 迁移完成后，不再把旧目录作为目标态分支

这一步是阶段 B 中最敏感的行为设计点。

## 7.4 browse runtime 的验收标准

完成后至少满足：

1. 新项目启动 browse，状态写到 `.spec-first`
2. 新项目启动 browse，`.gitignore` 自动加入 `.spec-first/`
3. 旧项目只有 `.gstack` 时，不会直接崩
4. 浏览器 server 能正常启动、恢复、重启

## 7.5 browse runtime 风险

最高风险：

- 新旧目录混用导致 server 状态丢失
- `.gitignore` 仍写入 `.gstack/`
- CLI 和 server 对 stateDir 的推导不一致

## 7. 阶段 B 的依赖顺序

阶段 B 内部也必须分顺序。

### 顺序 1：先改 `setup`

原因：

- 它决定安装落点和 sidecar 结构

### 顺序 2：再改 `scripts/gen-skill-docs.ts`

原因：

- 它决定最终生成物的路径与命令前缀

### 顺序 3：再改 `bin/gstack-*` helper

原因：

- 它把安装和生成真正连到可执行命令

### 顺序 4：最后改 browse runtime

原因：

- 它依赖前面三者定义好的路径语义

推荐执行顺序：

1. `B1 setup`
2. `B2 gen-skill-docs.ts`
3. `B4 bin helper`
4. `B3 browse runtime`

## 8. 阶段 B 的完成定义

阶段 B 只有在下面全部成立时，才算真正完成：

1. `setup` 默认安装到 `spec-first` 路径
2. `gen-skill-docs.ts` 注入的公共路径与命令默认引用 `spec-first`
3. `bin/gstack-*` helper 已迁到 `spec-first-*`
4. browse runtime 默认写入 `.spec-first`
5. `.agents/skills/spec-first` 与 `.agents/skills/spec-first-*` 路径闭环
6. 旧 `.gstack` / `~/.gstack` 不再作为目标态运行路径存在

只改了名字但没有打通闭环，不算阶段 B 完成。

## 9. 阶段 B 之后才能做什么

只有阶段 B 完成后，下面这些工作才值得做：

- 改所有 skill 模板
- 重新生成所有 `SKILL.md`
- 改所有 tests
- 改 README / CONTRIBUTING / ARCHITECTURE
- 做文档收口

否则就是在不稳定主干上做表层美化。

## 10. 最终建议

如果要真正开始执行迁移，阶段 B 应再拆成 3 个 patch 级任务包：

1. `B1-setup-改造包`
2. `B2-gen-skill-docs-改造包`
3. `B4-bin-helper-改造包`
4. `B3-browse-runtime-改造包`

每个任务包都应包含：

- 目标文件
- 必改点
- 兼容点
- 验收点
- 不能碰的范围

这会比继续扩写抽象方案更适合进入实际实施。
