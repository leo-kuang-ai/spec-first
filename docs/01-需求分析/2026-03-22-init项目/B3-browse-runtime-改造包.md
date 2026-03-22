# B3-browse-runtime-改造包

文档日期：2026-03-22
所属阶段：阶段 B
任务包目标：完成 browse runtime 的状态目录迁移，使浏览器运行时默认从 `.gstack` 切到 `.spec-first`，同时保留旧项目兼容能力

## 1. 任务包定位

`B3` 是阶段 B 的最后一个中枢包。

如果说：

- `B1` 解决“装在哪”
- `B2` 解决“生成出来引用哪”

那么 `B3` 解决的是：

```text
真正运行时，browse server 的状态到底写到哪
```

这一步如果不做，`spec-first` 即使安装和生成都看起来正确，实际运行仍会继续写 `.gstack`，形成最危险的“半迁移状态”。

## 2. 本任务包覆盖文件

### 主文件

- `browse/src/config.ts`

### 关联文件

- `browse/src/cli.ts`
- `browse/src/server.ts`
- `browse/src/browser-manager.ts`

说明：

- 真正的路径真相源在 `config.ts`
- 其他文件主要承接注释、日志输出、状态读取说明

## 3. 当前已识别的关键旧引用

## 3.1 `browse/src/config.ts`

已确认存在以下旧引用：

- `projectDir/.gstack/`
- `projectDir = path.dirname(stateDir); // parent of .gstack/`
- `stateDir = path.join(projectDir, '.gstack')`
- `stateFile = path.join(stateDir, 'browse.json')`
- `.gstack/` 自动写入 `.gitignore`

这是整个 runtime 路径层的单一真相源。

## 3.2 `browse/src/cli.ts`

已确认存在以下旧引用：

- `Read .gstack/browse.json for port + token`
- 若干注释中对旧状态目录的说明

注意：

- 这里的核心逻辑依赖 `resolveConfig()`，所以功能风险主要不在注释，而在 config 的行为语义

## 3.3 `browse/src/server.ts`

已确认存在以下旧引用：

- `State file: <project-root>/.gstack/browse.json`
- `Log files: <project-root>/.gstack/browse-{console,network,dialog}.log`
- `gstack browse server` 品牌注释

## 3.4 `browse/src/browser-manager.ts`

已确认存在以下旧引用：

- `Console/network logs flushed to .gstack/browse-*.log`

## 4. 目标状态

`B3` 完成后，browse runtime 应满足以下目标。

### 4.1 默认项目状态目录

默认项目状态目录应为：

- `<project-root>/.spec-first/`

### 4.2 默认状态文件

默认 state file 应为：

- `<project-root>/.spec-first/browse.json`

### 4.3 默认日志文件

默认日志文件应为：

- `.spec-first/browse-console.log`
- `.spec-first/browse-network.log`
- `.spec-first/browse-dialog.log`

### 4.4 `.gitignore` 自动写入

默认应自动写入：

- `.spec-first/`

### 4.5 兼容目标

如果旧项目只有 `.gstack/`，至少需要满足以下之一：

1. 能兼容读取旧状态目录
2. 能在启动时平滑迁移到 `.spec-first/`

推荐优先方案：

- 兼容读取 + 可选迁移

## 5. 任务拆解

## 5.1 B3-01 改 `browse/src/config.ts` 的默认目录真相源

目标：

- 把默认 `stateDir` 从 `.gstack` 切到 `.spec-first`

当前关键点：

- `stateDir = path.join(projectDir, '.gstack')`
- `stateFile = path.join(stateDir, 'browse.json')`

目标结果：

- `stateDir = path.join(projectDir, '.spec-first')`
- `stateFile = path.join(stateDir, 'browse.json')`

说明：

- 这是整个 `B3` 最核心的一步

验收：

- 在新项目中运行 browse，状态文件落到 `.spec-first/browse.json`

风险：

- 如果这里只改了一半，CLI 和 server 会围绕不同目录工作

## 5.2 B3-02 设计旧 `.gstack` 的兼容读取策略

目标：

- 避免老项目直接失效

建议策略：

### 方案 A：优先新目录，缺失时回退旧目录

逻辑：

1. 若 `.spec-first` 存在，使用 `.spec-first`
2. 若 `.spec-first` 不存在但 `.gstack` 存在，使用 `.gstack`

优点：

- 最稳

缺点：

- 旧项目可能长期不迁移

### 方案 B：首次发现旧目录时自动迁移

逻辑：

1. 若 `.spec-first` 不存在但 `.gstack` 存在
2. 自动移动或复制 `.gstack -> .spec-first`

优点：

- 迁移更彻底

缺点：

- 自动迁移行为更敏感

建议：

- 阶段 B 推荐先采用方案 A
- 等系统稳定后再评估是否做自动迁移

验收：

- 只有 `.gstack` 的旧项目不会崩

风险：

- 这是唯一一个带有“行为选择”的点，必须保守

## 5.3 B3-03 改 `ensureStateDir()` 的 `.gitignore` 写入逻辑

目标：

- `.gitignore` 自动追加 `.spec-first/`

当前关键点：

- `if (!content.match(/^\.gstack\/?$/m))`
- `fs.appendFileSync(gitignorePath, ... '.gstack/\n')`

目标结果：

- 检查 `.spec-first/`
- 写入 `.spec-first/`

兼容建议：

- 不需要自动删除 `.gstack/`
- 阶段 B 只保证新目录正确被忽略

验收：

- 新项目第一次启动 browse 后，`.gitignore` 正确包含 `.spec-first/`

风险：

- 若仍写入 `.gstack/`，项目会持续暴露旧名

## 5.4 B3-04 改 `browse/src/cli.ts` 的状态目录语义说明

目标：

- 把 CLI 注释和路径说明更新为 `.spec-first`

当前关键点：

- `Read .gstack/browse.json for port + token`

说明：

- 这里功能更多依赖 `resolveConfig()`
- 但注释必须和真实行为一致

验收：

- 注释、提示与实际运行路径一致

## 5.5 B3-05 改 `browse/src/server.ts` 的状态文件与日志路径说明

目标：

- 把 server 说明中的 `.gstack` 改为 `.spec-first`

当前关键点：

- `State file: <project-root>/.gstack/browse.json`
- `Log files: <project-root>/.gstack/browse-{console,network,dialog}.log`

验收：

- 源码注释与实际路径一致

## 5.6 B3-06 改 `browse/src/browser-manager.ts` 的日志输出文案

目标：

- 把用户/日志可见路径提示统一到 `.spec-first`

当前关键点：

- `Console/network logs flushed to .gstack/browse-*.log`

验收：

- 崩溃日志和提示不再暴露旧目录

## 5.7 B3-07 保持 `BROWSE_STATE_FILE` 机制不变

目标：

- 不改 `BROWSE_STATE_FILE` 协议

说明：

- 这是测试隔离和 CLI/server 通信的重要机制
- 它本身不绑定品牌名

结论：

- 不要重构这个机制
- 只改其默认解析到的新目录

验收：

- 测试和 server 启动模式不被破坏

## 5.8 B3-08 校验日志文件命名与路径闭环

目标：

- 确保 `consoleLog` / `networkLog` / `dialogLog` 路径全部源自新 `stateDir`

当前关键点：

- `browse-console.log`
- `browse-network.log`
- `browse-dialog.log`

说明：

- 文件名不需要改
- 路径目录必须改

验收：

- 所有日志都落到 `.spec-first/`

## 6. 推荐执行顺序

`B3` 内部建议按下面顺序改。

1. 先改 `config.ts` 的默认状态目录
2. 再补旧 `.gstack` 的兼容读取策略
3. 再改 `.gitignore` 写入逻辑
4. 最后改 `cli.ts` / `server.ts` / `browser-manager.ts` 的说明和日志文案

原因：

- `config.ts` 是行为主干
- 其余文件主要围绕这个主干收口

## 7. 本任务包的完成定义

`B3` 只有在下面全部成立时，才算完成：

1. 新项目默认写 `.spec-first/browse.json`
2. 新项目默认写 `.spec-first/browse-*.log`
3. `.gitignore` 自动写入 `.spec-first/`
4. 旧项目只有 `.gstack` 时，browse 仍可工作
5. 源码注释、日志输出、路径说明已同步更新

## 8. 本任务包不处理的内容

`B3` 不处理：

- `setup`
- `gen-skill-docs.ts`
- 所有 skill 模板中的 `.gstack` 文案
- 测试适配
- 文档收口

这些属于 `B1`、`B2` 和阶段 C。

## 9. 阶段 B 完成条件

当下面四个任务包全部完成后，阶段 B 才算完成：

1. [B1-setup-改造包.md](./B1-setup-%E6%94%B9%E9%80%A0%E5%8C%85.md)
2. [B2-gen-skill-docs-改造包.md](./B2-gen-skill-docs-%E6%94%B9%E9%80%A0%E5%8C%85.md)
3. [B4-bin-helper-改造包.md](./B4-bin-helper-%E6%94%B9%E9%80%A0%E5%8C%85.md)
4. [B3-browse-runtime-改造包.md](./B3-browse-runtime-%E6%94%B9%E9%80%A0%E5%8C%85.md)

阶段 B 的本质完成标志不是“改完名字”，而是：

- 安装闭环成立
- 生成闭环成立
- helper 命令闭环成立
- 运行时闭环成立
