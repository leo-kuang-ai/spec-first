# B1-setup-改造包

文档日期：2026-03-22
所属阶段：阶段 B
任务包目标：完成 `setup` 安装中枢迁移，使 `spec-first` 能以自己的路径、sidecar 和状态目录完成安装

## 1. 任务包定位

`B1` 解决的是整个迁移里最靠前的主干问题：

```text
spec-first 安装后，技能究竟落在哪
sidecar 究竟叫什么
全局状态目录究竟写到哪
```

如果 `B1` 没有打通，后面的：

- `gen-skill-docs.ts`
- `.agents/skills/spec-first-*`
- browse runtime

都会出现路径断裂。

所以 `B1` 的目标不是“改 setup 里的文案”，而是建立新安装结构的单一真相源。

## 2. 本任务包覆盖文件

### 主文件

- `setup`

### 延伸文件

- `bin/dev-setup`
- `bin/dev-teardown`

说明：

- 这三个文件共同组成“安装中枢”。
- `setup` 负责正式安装。
- `dev-setup` / `dev-teardown` 负责本地开发模式下的安装与切换。

## 3. 当前已识别的关键旧引用

## 3.1 `setup`

已确认存在以下旧引用：

- `GSTACK_DIR`
- `mkdir -p "$HOME/.gstack/projects"`
- `.agents/skills/gstack-*`
- `.agents/skills/gstack`
- `CODEX_GSTACK="$CODEX_SKILLS/gstack"`
- `Welcome! Run /gstack-upgrade anytime to stay current.`
- `rm -f /tmp/gstack-latest-version`
- `link_claude_skill_dirs()` 内部的 `ln -snf "gstack/$skill_name" "$target"`
- `link_codex_skill_dirs()` 中的 `for skill_dir in "$agents_dir"/gstack*/`

## 3.2 `bin/dev-setup`

已确认存在以下旧引用：

- `.claude/skills/gstack`
- `.agents/skills/gstack`
- `GSTACK_LINK`
- 注释与输出中的 `gstack`

## 3.3 `bin/dev-teardown`

已确认存在以下旧引用：

- `.claude/skills/gstack`
- `.agents/skills/gstack`
- `Global gstack (~/.claude/skills/gstack)`

## 4. 目标状态

`B1` 完成后，安装中枢应满足以下目标。

### 4.1 正式安装目标

默认安装目录应为：

- `~/.claude/skills/spec-first`
- `~/.codex/skills/spec-first`

默认 agents sidecar 应为：

- `.agents/skills/spec-first`

默认 agents 生成技能前缀应为：

- `.agents/skills/spec-first-*`

默认全局状态目录初始化应为：

- `~/.spec-first`
- `~/.spec-first/projects`

### 4.2 开发模式目标

本地开发模式应为：

- `.claude/skills/spec-first -> repo root`
- `.agents/skills/spec-first -> repo root`

### 4.3 兼容要求

至少在迁移第一版，应考虑：

- 旧全局状态 `~/.gstack` 不被破坏
- 旧开发模式目录不会被误删

## 5. 任务拆解

## 5.1 B1-01 改 `setup` 的路径根命名

目标：

- 把 `GSTACK_DIR` 一类项目根变量重命名为更中性的名字，或直接改为 `SPEC_FIRST_DIR`

建议：

- 若只为了快速迁移，可先保留旧变量名
- 若为了后续维护与同步，建议立即改名

推荐做法：

- `GSTACK_DIR` -> `SPEC_FIRST_DIR`
- `CODEX_GSTACK` -> `CODEX_SPEC_FIRST`

验收：

- 脚本变量语义与实际目录一致

风险：

- 只改部分变量会增加维护混乱度

## 5.2 B1-02 改 `setup` 的 Claude 安装目录

目标：

- 正式安装默认落到 `~/.claude/skills/spec-first`

要改点：

- `link_claude_skill_dirs()` 中的软链相对路径
- “当前是否在 skills 目录中”的逻辑说明
- 所有输出提示里的项目名

注意：

- `ln -snf "gstack/$skill_name" "$target"` 必须改，否则即使目录名变了，软链目标还是错的

验收：

- 安装后 Claude skills 目录结构正确

风险：

- 最容易出现“目录叫 spec-first，但子 skill 软链仍指向 gstack/xxx”

## 5.3 B1-03 改 `setup` 的 Codex 安装目录

目标：

- 正式安装默认落到 `~/.codex/skills/spec-first`

要改点：

- `CODEX_GSTACK="$CODEX_SKILLS/gstack"`
- 所有相关输出提示

验收：

- `~/.codex/skills/spec-first` 建立成功

风险：

- Codex 安装目录和生成技能前缀不一致

## 5.4 B1-04 改 `setup` 的 generated skills 前缀

目标：

- `link_codex_skill_dirs()` 不再安装 `gstack-*`
- 改为安装 `spec-first-*`

要改点：

- `for skill_dir in "$agents_dir"/gstack*/`

验收：

- 新生成 skill 能被正确发现

风险：

- 这是正式安装与生成产物闭环的关键点

## 5.5 B1-05 改 `setup` 的 agents sidecar 目录

目标：

- `.agents/skills/gstack` -> `.agents/skills/spec-first`

要改点：

- `create_agents_sidecar()`
- 里面的 `agents_gstack` 变量

验收：

- runtime 资产 sidecar 路径正确

风险：

- 生成技能即使安装成功，运行时也可能因为找不到 sidecar 资产而失败

## 5.6 B1-06 改 `setup` 的全局状态目录初始化

目标：

- `~/.gstack/projects` -> `~/.spec-first/projects`

要改点：

- `mkdir -p "$HOME/.gstack/projects"`
- 首次 welcome 目录判断

兼容建议：

- 这里不要立刻删除对 `~/.gstack` 的判断能力

验收：

- 新安装初始化到新目录

风险：

- 用户历史状态丢失

## 5.7 B1-07 改 `setup` 的品牌提示和缓存文件名

目标：

- 所有提示和临时文件统一为 `spec-first`

要改点：

- `/gstack-upgrade`
- `/tmp/gstack-latest-version`
- `gstack ready (claude|codex)`

验收：

- 用户可见输出统一

风险：

- 表层，但会直接暴露半迁移状态

## 5.8 B1-08 改 `bin/dev-setup`

目标：

- 开发模式本地软链路径切到 `spec-first`

要改点：

- `.claude/skills/gstack`
- `.agents/skills/gstack`
- `GSTACK_LINK`
- 输出文案

目标结果：

- `.claude/skills/spec-first -> repo root`
- `.agents/skills/spec-first -> repo root`

验收：

- 开发模式启用后，本地 repo 直接作为 `spec-first` 技能源

风险：

- 如果 dev 模式不改，后面本地调试会一直混用旧路径

## 5.9 B1-09 改 `bin/dev-teardown`

目标：

- 开发模式清理逻辑切到 `spec-first`

要改点：

- 删除 `.claude/skills/spec-first`
- 删除 `.agents/skills/spec-first`
- 输出提示改为 `Global spec-first`

验收：

- 开发模式开关闭环成立

风险：

- teardown 只清旧名不清新名，会遗留脏链接

## 6. 推荐执行顺序

`B1` 内部建议按下面顺序改。

1. 先改 `setup` 的正式安装路径
2. 再改 generated skills 前缀
3. 再改 sidecar
4. 再改全局状态目录初始化
5. 最后改 `dev-setup` / `dev-teardown`

原因：

- 正式安装路径是主干
- dev 模式是补充链路

## 7. 本任务包的完成定义

`B1` 只有在下面全部成立时，才算完成：

1. `setup` 默认安装到 `~/.claude/skills/spec-first`
2. `setup` 默认安装到 `~/.codex/skills/spec-first`
3. `.agents/skills/spec-first` 能被正确创建
4. `.agents/skills/spec-first-*` 能被正确链接
5. `~/.spec-first/projects` 被初始化
6. `bin/dev-setup` 与 `bin/dev-teardown` 形成新路径闭环

## 8. 本任务包不处理的内容

下面这些内容不属于 `B1`：

- `scripts/gen-skill-docs.ts`
- `browse` runtime 的 `.spec-first` 状态目录逻辑
- 所有 skill 模板内容
- 所有测试与文档收口

这些要放到后续任务包。

## 9. B1 完成后的下一步

`B1` 完成后，应立即进入：

- `B2-gen-skill-docs-改造包`

因为安装目录与 sidecar 语义一旦确定，生成器才能正确生成新的技能文档路径。

