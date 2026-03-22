# G0-根SKILL-迁移包

文档日期：2026-03-22
所属阶段：阶段 C
任务包目标：迁移根 `SKILL.md.tmpl` 与根 `SKILL.md`，收口全局品牌、总路由建议、公共前导和顶层 browse 说明

## 1. 任务包定位

`G0` 是阶段 C 的第一个 skill 级任务包。

它之所以必须先做，不是因为它“最简单”，而是因为它是所有 skill 的共享顶层。

根模板承担了这些职责：

1. 顶层 skill 名与描述
2. 对其他 skill 的建议路由
3. 顶层 proactive 建议文案
4. 顶层 browse 说明和 QA 工作流示例
5. 共享 preamble 的承接位置

如果根 `SKILL` 还停留在 `gstack` 语义，后面的 skill 即使逐个迁了，整体仍会呈现一个混合系统。

## 2. 本任务包覆盖文件

- `SKILL.md.tmpl`
- `SKILL.md`

说明：

- `SKILL.md` 是生成产物
- 真正应改的是 `SKILL.md.tmpl`

## 3. 当前已识别的关键迁移点

从代码看，根模板至少存在以下几类旧引用：

### 3.1 顶层名称与描述

- `name: gstack`
- `gstack also includes development workflow skills`
- `# gstack browse: QA Testing & Dogfooding`

### 3.2 顶层 skill 建议路由

- `Upgrading gstack to latest version → suggest /gstack-upgrade`

### 3.3 顶层配置命令

- `Run: gstack-config set proactive false`
- `Run: gstack-config set proactive true`
- `` `gstack-config` ``

### 3.4 顶层 skill 生态文案

- `If PROACTIVE is false: do NOT proactively suggest other gstack skills`

### 3.5 顶层浏览器定位文案

- `gstack browse`

## 4. 目标状态

迁移完成后，根 `SKILL` 应满足：

1. 顶层产品名统一为 `spec-first`
2. 顶层配置命令统一为 `spec-first-*`
3. 顶层升级 skill 名与最终决策一致
4. 顶层 proactive / browse / workflow 描述不再残留 `gstack`
5. 不改变 browse 本身的能力与工作流语义

## 5. 任务拆解

### G0-1 改根模板的产品名

目标：

- `name: gstack` -> `name: spec-first`

同步改：

- 描述段中的品牌提法
- 标题中的品牌提法

### G0-2 改顶层 skill 建议路由

目标：

- 所有“suggest /xxx”文案与最终 skill 命名保持一致

重点：

- `/gstack-upgrade` 这里必须与升级 skill 的最终命名决策一致

### G0-3 改顶层配置命令

目标：

- `gstack-config` -> `spec-first-config`

说明：

- 这里依赖阶段 B 的 `B4-bin-helper-改造包`

### G0-4 改顶层 proactive 文案

目标：

- `do NOT proactively suggest other gstack skills`
- `This preference persists across sessions via gstack-config`

都切到 `spec-first`

### G0-5 改顶层 browse 品牌文案

目标：

- `# gstack browse` -> `# spec-first browse` 或更中性写法

注意：

- `/browse` 能力名不改
- 改的是所属产品名，不是命令名

## 6. 验证步骤

### Step 1：改 `SKILL.md.tmpl`

检查：

- 名称
- 顶层描述
- 顶层建议路由
- 顶层配置命令
- browse 标题与品牌文案

### Step 2：重新生成 `SKILL.md`

要求：

- 生成结果与模板一致

### Step 3：静态搜索

在根模板和根 `SKILL.md` 中搜索：

- `gstack`
- `gstack-config`
- `/gstack-upgrade`
- `.gstack`
- `~/.gstack`

### Step 4：做顶层一致性验证

验证重点：

- 顶层 name 正确
- 顶层 browse 说明未被误改成功能变化
- 顶层 skill 建议列表与现有 skill 集一致

## 7. 完成定义

`G0` 只有在下面全部成立时，才算完成：

1. 根模板已迁移
2. 根 `SKILL.md` 已重新生成
3. 顶层品牌、命令、upgrade 路由已统一
4. 没有未受控的旧品牌残留

## 8. 后续关系

`G0` 完成后，才适合进入：

- `G1-基础安全skill迁移包`

因为 G1 虽然简单，但仍然处在根 skill 的总体生态叙事之下。

