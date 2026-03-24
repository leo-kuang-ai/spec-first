# spec-first 迁移执行清单

文档日期：2026-03-22
目标：在 `不改变任何功能` 的前提下，将 `/Users/kuang/xiaobu/gstack` 完整迁入 `spec-first`
源仓库：`/Users/kuang/xiaobu/gstack`
目标仓库：`/Users/kuang/Desktop/ops/spec-first-pro`

## 1. 顶层架构

这次迁移完成后的顶层架构，应该按“产品层、生成层、运行时层、技能层、测试层、状态层”六层理解，而不是按“复制几个目录”理解。

### 1.1 目标顶层结构

```text
spec-first-pro/
├── README.md
├── ARCHITECTURE.md
├── AGENTS.md
├── CLAUDE.md
├── CONTRIBUTING.md
├── CHANGELOG.md
├── ETHOS.md
├── LICENSE
├── VERSION
├── package.json
├── setup
├── SKILL.md
├── SKILL.md.tmpl
├── bin/
├── browse/
├── scripts/
├── test/
├── supabase/
├── brainstorm/
├── plan-ceo-review/
├── plan-eng-review/
├── plan-design-review/
├── review/
├── qa/
├── qa-only/
├── design-review/
├── design-consultation/
├── ship/
├── land-and-deploy/
├── canary/
├── benchmark/
├── document-release/
├── investigate/
├── retro/
├── setup-browser-cookies/
├── setup-deploy/
├── codex/
├── careful/
├── freeze/
├── guard/
├── unfreeze/
├── gstack-upgrade/ 或 spec-first-upgrade/
├── .agents/
└── docs/
```

### 1.2 六层架构定义

#### A. 产品壳层

作用：对外定义项目是谁、怎么安装、怎么贡献、怎么理解。

包含：

- `README.md`
- `ARCHITECTURE.md`
- `AGENTS.md`
- `CLAUDE.md`
- `CONTRIBUTING.md`
- `CHANGELOG.md`
- `ETHOS.md`

#### B. Skill 定义层

作用：定义 slash skill 的行为协议。

包含：

- 顶层 `SKILL.md.tmpl`
- 各 skill 目录下的 `SKILL.md.tmpl`
- 生成后的 `SKILL.md`

#### C. 生成编译层

作用：把模板、命令元数据、路径常量编译成实际可用 skill 文档和运行产物。

包含：

- `scripts/gen-skill-docs.ts`
- `scripts/skill-check.ts`
- `scripts/dev-skill.ts`

#### D. 运行时层

作用：真正执行浏览器、路径发现、server 管理、helper 脚本。

包含：

- `browse/src/*`
- `browse/bin/*`
- `bin/*`
- `setup`

#### E. 测试验证层

作用：证明迁移未破坏功能。

包含：

- `browse/test/*`
- `test/*`

#### F. 状态与集成层

作用：承接 agent 宿主安装、sidecar、用户状态目录、项目运行时状态目录。

包含：

- `~/.claude/skills/spec-first`
- `~/.codex/skills/spec-first`
- `.agents/skills/spec-first-*`
- `.agents/skills/spec-first`
- `~/.spec-first`
- `.spec-first`

### 1.3 迁移后的四个中枢

整个迁移能否成功，核心看四个中枢是否被打通：

#### 中枢 1：安装中枢

文件：

- `setup`

职责：

- build
- 安装 skill
- 创建 sidecar
- 确保 browse binary 可用

#### 中枢 2：生成中枢

文件：

- `scripts/gen-skill-docs.ts`

职责：

- 生成 Claude host skill
- 生成 Codex/Agents host skill
- 注入路径、命令、前缀、preamble

#### 中枢 3：helper 命令中枢

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

#### 中枢 4：运行时中枢

文件：

- `browse/src/config.ts`
- `browse/src/platform.ts`
- `browse/src/server.ts`
- `browse/src/cli.ts`
- 相关路径解析代码

职责：

- 决定状态目录写在哪里
- server 状态如何恢复
- 浏览器日志如何落盘

## 2. 迁移任务树

任务应按“先落位、再改名、再验证、最后清理”的顺序执行。

```text
T0 基线冻结
T1 原仓完整迁入
T2 顶层品牌与元数据改名
T3 安装链路改名
T4 生成链路改名
T5 二进制与 helper 脚本改名
T6 运行时状态目录迁移
T7 skill 模板与产物改名
T8 sidecar 与 agents 目录改名
T9 测试收口
T10 文档收口
T11 兼容层验证
T12 清理与发布决策
```

## 3. 逐个任务

下面按“目标、输入、操作、输出、验收标准、风险”逐个展开。

### 任务 T0：基线冻结

目标：

- 锁定源项目当前功能基线，防止迁移过程中混入功能改动。

输入：

- 源仓库 `/Users/kuang/xiaobu/gstack`
- 当前基线 commit `dbd98af`

操作：

1. 记录源仓当前 commit。
2. 记录源仓未提交内容：
   - `.serena/`
   - `.spec-first/`
   - `docs/first/`
   - `docs/skill-flow-zh.md`
   - `docs/tdd需求/`
3. 扫描所有关键引用：
   - `gstack`
   - `.gstack`
   - `~/.gstack`
   - `gstack-`
4. 输出基线说明文档。

输出：

- 一份基线说明
- 一份引用清单

验收标准：

- 团队对“迁什么、不迁什么”没有歧义。

风险：

- 如果这一步没做，后续很难判断 bug 是迁移引入还是源仓本来就存在。

### 任务 T1：原仓完整迁入

目标：

- 不做 rename，先把完整代码树落到 `spec-first-pro`。

输入：

- `gstack` 全量目录

操作：

1. 复制顶层文件。
2. 复制 skill 目录。
3. 复制 `browse/`、`scripts/`、`bin/`、`test/`、`supabase/`。
4. 不复制：
   - `.git`
   - `node_modules`
   - 本地缓存
5. 明确保留或忽略：
   - `.spec-first`
   - `.serena`
   - 源仓未提交文档

输出：

- 新仓中出现一个“未改名但完整”的中间态系统

验收标准：

- 新仓文件树完整
- 没有结构性缺失

风险：

- 如果迁入时就顺手重命名，定位错误会非常困难。

### 任务 T2：顶层品牌与元数据改名

目标：

- 把项目的对外身份从 `gstack` 切到 `spec-first`。

输入：

- 顶层产品文档与元数据

操作：

1. 修改 `package.json`
   - `name`
   - `description`
2. 修改顶层文档中的品牌名
   - `README.md`
   - `ARCHITECTURE.md`
   - `CONTRIBUTING.md`
   - `AGENTS.md`
   - `CLAUDE.md`
   - `CHANGELOG.md`
3. 明确保留不变的能力名：
   - `/browse`

输出：

- 顶层文案统一为 `spec-first`

验收标准：

- 新用户只看到 `spec-first`

风险：

- 这里只是“品牌壳”改名，还没碰安装与运行时，不能误以为迁移已完成。

### 任务 T3：安装链路改名

目标：

- `setup` 能把系统安装到 `spec-first` 路径，而不是 `gstack`。

输入：

- `setup`

操作：

1. 改安装根路径：
   - `~/.claude/skills/gstack` -> `~/.claude/skills/spec-first`
   - `~/.codex/skills/gstack` -> `~/.codex/skills/spec-first`
2. 改内部变量命名和路径推导。
3. 改全局状态目录初始化：
   - `~/.gstack/projects` -> `~/.spec-first/projects`
4. 改 `create_agents_sidecar` 的目标目录：
   - `.agents/skills/gstack` -> `.agents/skills/spec-first`
5. 改 Codex 生成产物软链逻辑前缀：
   - `gstack-*` -> `spec-first-*`

输出：

- 新安装目录完全转向 `spec-first`

验收标准：

- 执行 `./setup --host codex|claude|auto` 时，所有产物落在新路径

风险：

- setup 改漏一个路径，就会出现安装成功但运行失败的假象。

### 任务 T4：生成链路改名

目标：

- 让所有生成后的 `SKILL.md` 指向新路径、新命令、新 sidecar。

输入：

- `scripts/gen-skill-docs.ts`
- 所有 `SKILL.md.tmpl`

操作：

1. 修改 `HOST_PATHS`
   - `skillRoot`
   - `localSkillRoot`
   - `binDir`
   - `browseDir`
2. 修改 preamble 中的命令调用：
   - `gstack-update-check`
   - `gstack-config`
   - `gstack-telemetry-log`
3. 修改 upgrade 提示文本中的 skill 路径。
4. 修改 telemetry 提示文本中的命令名。
5. 修改生成的 agents 目录前缀。

输出：

- 重新生成后的所有 `SKILL.md` 都不再依赖 `gstack`

验收标准：

- 生成产物中没有错误引用旧路径

风险：

- 这是最容易出现“源码名已改，生成物未改”的地方。

### 任务 T5：二进制与 helper 脚本改名

目标：

- 全部 helper 入口从 `gstack-*` 收口为 `spec-first-*`。

输入：

- `bin/gstack-analytics`
- `bin/gstack-community-dashboard`
- `bin/gstack-config`
- `bin/gstack-diff-scope`
- `bin/gstack-review-log`
- `bin/gstack-review-read`
- `bin/gstack-slug`
- `bin/gstack-telemetry-log`
- `bin/gstack-telemetry-sync`
- `bin/gstack-update-check`

操作：

1. 重命名脚本文件。
2. 更新脚本内部自引用。
3. 更新所有 skill 模板与文档里的命令调用。
4. 评估是否保留旧命令包装脚本。

输出：

- helper 脚本统一前缀

验收标准：

- 新命令全部可调用

风险：

- 如果命令已重命名而模板未更新，运行时会直接找不到命令。

### 任务 T6：运行时状态目录迁移

目标：

- 把 `~/.gstack` / `.gstack` 切换到 `~/.spec-first` / `.spec-first`。

输入：

- browse runtime
- config / platform / server / cli 相关路径逻辑

操作：

1. 修改默认全局状态目录。
2. 修改默认项目内状态目录。
3. 保留旧目录兼容读取。
4. 增加旧目录迁移或回退逻辑。
5. 校验日志、PID、server state、version 文件位置。

输出：

- 新运行时写入新目录
- 老目录可被识别

验收标准：

- 新项目正常写入 `.spec-first`
- 老项目仍可恢复会话/状态

风险：

- 这是最容易破坏用户现有工作流的部分。

### 任务 T7：skill 模板与产物改名

目标：

- 全部 skill 的运行时引用与展示文本收口到 `spec-first`。

输入：

- 顶层 `SKILL.md.tmpl`
- 各子 skill `SKILL.md.tmpl`
- 已生成的 `SKILL.md`

操作：

1. 扫描所有 `SKILL.md.tmpl` 中的旧路径和旧命令。
2. 修改品牌名、路径名、命令名。
3. 重新生成 `SKILL.md`。
4. 对比生成前后差异，确认没有行为性变化。

输出：

- 所有 skill 文档一致使用新命名

验收标准：

- skill 文档中的每个命令和路径都能在新结构中找到

风险：

- 某些 skill 模板里嵌了长 Bash preamble，最容易藏旧路径。

### 任务 T8：sidecar 与 agents 目录改名

目标：

- 让 Codex/Gemini/Cursor 发现的新 skill 目录统一为 `spec-first-*`。

输入：

- `.agents/skills/gstack-*`
- `.agents/skills/gstack`

操作：

1. 修改生成输出目录前缀。
2. 修改 sidecar 名称。
3. 修改 setup 中 sidecar 软链逻辑。
4. 检查 skill 运行时通过 `$SKILL_ROOT` 找相对资产时是否仍成立。

输出：

- `.agents/skills/spec-first-*`
- `.agents/skills/spec-first`

验收标准：

- 非 Claude 宿主也能正确发现和执行技能

风险：

- 这是跨宿主兼容的关键，不能只验证 Claude。

### 任务 T9：测试收口

目标：

- 所有测试断言与 fixture 同步新命名。

输入：

- `browse/test/*`
- `test/*`

操作：

1. 搜索所有硬编码：
   - `gstack`
   - `.gstack`
   - `~/.gstack`
   - `gstack-`
2. 区分：
   - 业务预期
   - 兼容层预期
   - 历史文案预期
3. 更新测试快照与 fixture。
4. 跑 build / test。

输出：

- 测试红线被逐步收掉

验收标准：

- 单测通过
- 关键 E2E 通过

风险：

- 测试如果不分“兼容层保留”与“旧命名残留”，容易误杀。

### 任务 T10：文档收口

目标：

- 所有面向用户的入口文本切换为 `spec-first`。

输入：

- 顶层文档
- `docs/skills.md`
- `BROWSER.md`
- 其他教程文档

操作：

1. 更新安装命令。
2. 更新贡献命令。
3. 更新示例路径。
4. 更新配置与 telemetry 说明。
5. 更新截图和图注中的项目名。

输出：

- 用户文档完全切换

验收标准：

- 新用户按文档操作，不会再落到旧目录

风险：

- 文档常常不是功能错误来源，但会直接导致错误安装。

### 任务 T11：兼容层验证

目标：

- 验证旧用户升级不会中断。

输入：

- 旧状态目录
- 新状态目录

操作：

1. 构造仅有 `~/.gstack` 的环境。
2. 构造仅有 `.gstack` 的项目。
3. 运行新版本 setup 与关键 skill。
4. 验证是否能迁移、读取、恢复。

输出：

- 一套兼容验证结论

验收标准：

- 老用户升级后核心链路不坏

风险：

- 如果不做这一步，“不改功能”就只是口头承诺。

### 任务 T12：清理与发布决策

目标：

- 决定哪些旧名永久保留，哪些彻底移除。

输入：

- 前 11 个任务的结果

操作：

1. 统计剩余旧名引用。
2. 标记哪些属于兼容层。
3. 决定是否保留旧命令包装层。
4. 决定是否保留旧状态目录 fallback。
5. 补充 CHANGELOG 与迁移说明。

输出：

- 最终迁移策略

验收标准：

- 团队清楚“兼容多久、何时切断”

风险：

- 如果没有明确结论，项目会长期处于半迁移状态。

## 4. 推荐执行顺序

真正执行时，建议严格按下面顺序推进：

1. `T0 基线冻结`
2. `T1 原仓完整迁入`
3. `T3 安装链路改名`
4. `T4 生成链路改名`
5. `T5 二进制与 helper 脚本改名`
6. `T6 运行时状态目录迁移`
7. `T7 skill 模板与产物改名`
8. `T8 sidecar 与 agents 目录改名`
9. `T9 测试收口`
10. `T2 顶层品牌与元数据改名`
11. `T10 文档收口`
12. `T11 兼容层验证`
13. `T12 清理与发布决策`

这里特意把 `T2` 没有放到最前面，是因为：

- 如果先大改文档和品牌，很容易给人“已经迁完”的错觉。
- 实际上最先要打通的是安装、生成、helper、运行时四个中枢。

## 5. 每个任务的完成定义

为了避免“改了一半就进入下一个任务”，每个任务都必须有明确完成定义。

### 完成定义模板

一个任务只有同时满足下面 5 条才算完成：

1. 代码已改
2. 引用已更新
3. 生成物已同步
4. 测试已验证
5. 文档已记录

任何只完成前 1 到 2 条的状态，都不能算任务完成。

## 6. 最终建议

这次迁移如果要稳，最好的推进方式是：

1. 先把 `T0-T1` 做完，得到一个“完整迁入但未改名”的中间态。
2. 然后只盯四个中枢：
   - `setup`
   - `scripts/gen-skill-docs.ts`
   - `browse` 路径解析
3. 四个中枢跑通后，再批量收 skill、测试、文档。

这才是真正的一步一步思考规划。
