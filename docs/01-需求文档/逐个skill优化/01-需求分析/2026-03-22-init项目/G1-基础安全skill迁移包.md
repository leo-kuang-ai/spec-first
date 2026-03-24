# G1-基础安全skill迁移包

文档日期：2026-03-22
所属阶段：阶段 C
任务包目标：迁移基础安全 skill 组，验证低耦合 skill 的逐个迁移与逐个验证流程

## 1. 任务包定位

`G1` 是阶段 C 的第一批真实 skill 迁移对象。

选择这一组的原因不是它们最重要，而是它们最适合验证迁移方法：

- `careful`
- `freeze`
- `guard`
- `unfreeze`

它们共同具备几个优势：

1. skill 范围清晰
2. 强依赖 browse 页面交互的部分很少
3. 更适合作为“先改一个组、先验证一个组”的试验田

## 2. 本任务包覆盖文件

- `careful/SKILL.md.tmpl`
- `careful/SKILL.md`
- `freeze/SKILL.md.tmpl`
- `freeze/SKILL.md`
- `guard/SKILL.md.tmpl`
- `guard/SKILL.md`
- `unfreeze/SKILL.md.tmpl`
- `unfreeze/SKILL.md`

## 3. 当前已识别的关键迁移点

### 3.1 analytics 写入目录

这 4 个 skill 都直接写：

- `mkdir -p ~/.gstack/analytics`
- `~/.gstack/analytics/skill-usage.jsonl`

### 3.2 会话状态目录

`freeze`、`guard`、`unfreeze` 还直接使用：

- `STATE_DIR="${CLAUDE_PLUGIN_DATA:-$HOME/.gstack}"`

### 3.3 兄弟 skill 引用

`guard` 直接引用：

- `../careful/bin/check-careful.sh`
- `../freeze/bin/check-freeze.sh`

这里要确认迁移后目录名不变，避免误判成必须一起改目录结构。

### 3.4 品牌与说明文案

虽然这组 skill 的品牌暴露少于其他 skill，但仍存在：

- 顶层 analytics 路径
- 会话状态目录路径
- “由 gstack setup 安装”这类生态语义

## 4. 目标状态

迁移完成后，G1 这组 skill 应满足：

1. analytics 默认写到 `~/.spec-first/analytics`
2. freeze boundary 默认写到 `~/.spec-first`
3. 兄弟 skill 的相对依赖仍然成立
4. 钩子与行为不变
5. 生成后的 `SKILL.md` 与模板一致

## 5. 任务拆解

### G1-1 迁移 `careful`

重点：

- analytics 路径
- 品牌文案

验证：

- 模板生成结果正确
- hook 命令路径未被误伤

### G1-2 迁移 `freeze`

重点：

- analytics 路径
- `STATE_DIR`
- `freeze-dir.txt` 状态文件逻辑文案

验证：

- `STATE_DIR` 指向新目录
- 逻辑解释与路径一致

### G1-3 迁移 `guard`

重点：

- analytics 路径
- `STATE_DIR`
- 对 `../careful`、`../freeze` 的兄弟依赖说明

验证：

- 相对引用不变
- 文案和状态目录更新

### G1-4 迁移 `unfreeze`

重点：

- analytics 路径
- `STATE_DIR`
- 清理 freeze boundary 的路径说明

验证：

- 路径与 `freeze` 保持一致

## 6. 每个 skill 的统一验证步骤

### Step 1：改模板

检查：

- `~/.gstack` -> `~/.spec-first`
- `STATE_DIR`
- analytics 路径
- 品牌文案

### Step 2：重新生成

重新生成每个 skill 的 `SKILL.md`

### Step 3：静态搜索

分别对每个 skill 搜索：

- `gstack`
- `~/.gstack`
- `.gstack`
- `gstack-config`
- `/gstack-upgrade`

### Step 4：组内一致性验证

检查：

- `freeze` / `unfreeze` 的状态目录一致
- `guard` 对 `careful` / `freeze` 的依赖说明仍成立
- 4 个 skill 的 analytics 路径一致

## 7. 完成定义

`G1` 只有在下面全部成立时，才算完成：

1. 4 个 skill 模板都已迁移
2. 4 个 `SKILL.md` 都已重新生成
3. analytics 路径统一切到 `~/.spec-first`
4. `freeze` / `guard` / `unfreeze` 的 `STATE_DIR` 统一切到 `~/.spec-first`
5. 兄弟 skill 依赖未被破坏

## 8. 后续关系

`G1` 完成后，最合理的下一步是进入：

- `G2a 轻依赖规划与文档类 skill`

如果 `G1` 迁移和验证过程不顺，说明阶段 C 的“逐个 skill 迁移、逐个验证”方法还需要再调整，不能贸然进入更重的 skill 组。

