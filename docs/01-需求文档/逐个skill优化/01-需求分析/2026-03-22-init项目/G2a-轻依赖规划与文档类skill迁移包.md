# G2a-轻依赖规划与文档类skill迁移包

文档日期：2026-03-22
所属阶段：阶段 C
任务包目标：迁移阶段 C 中相对轻依赖的一组规划与文档类 skill，验证 `~/.spec-first/projects`、模板收口和逐个 skill 验证流程

## 1. 任务包定位

`G2a` 是阶段 C 第一批真正进入“业务型 skill”迁移的任务包。

本组包含：

- `brainstorm`
- `design-consultation`
- `document-release`
- `retro`

之所以把它们归为 `G2a`，是因为它们虽然已经比 G1 复杂，但仍然比 browse/qa/deploy 一类 skill 更容易控风险。

这组 skill 的特点是：

1. 开始大量使用 `~/.gstack/projects`
2. 开始出现 `~/.claude/skills/gstack/bin/...` 这种模板内硬编码
3. 开始出现 `.gstack/*` 与 `/tmp/gstack-*` 这类项目与临时文件路径
4. 依赖公共 helper 和状态目录，但不以浏览器交互为主

## 2. 本任务包覆盖文件

- `brainstorm/SKILL.md.tmpl`
- `brainstorm/SKILL.md`
- `design-consultation/SKILL.md.tmpl`
- `design-consultation/SKILL.md`
- `document-release/SKILL.md.tmpl`
- `document-release/SKILL.md`
- `retro/SKILL.md.tmpl`
- `retro/SKILL.md`

## 3. 当前已识别的关键迁移点

## 3.1 `brainstorm`

已确认存在：

- `~/.claude/skills/gstack/bin/gstack-slug`
- `~/.gstack/projects/$SLUG/*-design-*.md`
- `mkdir -p ~/.gstack/projects/$SLUG`
- `Write to ~/.gstack/projects/{slug}/...`
- 对 `~/.gstack/projects/` 的 discoverability 文案

说明：

- `brainstorm` 是这一组里最典型的“项目级状态目录 skill”

## 3.2 `design-consultation`

已确认存在：

- `~/.claude/skills/gstack/bin/gstack-slug`
- `ls ~/.gstack/projects/$SLUG/*brainstorm*`

说明：

- 它依赖 `brainstorm` 的产物发现链

## 3.3 `document-release`

已确认存在：

- `find ... -not -path "./.gstack/*"`
- `/tmp/gstack-pr-body-$$.md`

说明：

- 这里主要是项目内忽略路径和品牌化临时文件名

## 3.4 `retro`

已确认存在：

- `cat ~/.gstack/greptile-history.md`
- `cat ~/.gstack/analytics/skill-usage.jsonl`
- `~/.gstack/analytics/eureka.jsonl`

说明：

- `retro` 是这组里对全局状态目录依赖最重的 skill

## 4. 目标状态

G2a 迁移完成后，这组 skill 应满足：

1. 所有项目级历史文档统一落到 `~/.spec-first/projects`
2. 所有 analytics / greptile / eureka 读取路径统一落到 `~/.spec-first`
3. 所有模板内 `gstack-slug` / `gstack-*` helper 引用切到 `spec-first-*`
4. 所有项目局部 `.gstack/*` 路径切到 `.spec-first/*`
5. 所有品牌化临时文件名切到 `spec-first-*`

## 5. 任务拆解

## 5.1 G2a-1 迁移 `brainstorm`

重点：

- `gstack-slug` -> `spec-first-slug`
- `~/.gstack/projects` -> `~/.spec-first/projects`
- 项目发现文案
- 输出落点文案

专项验证：

- 设计文档的写入路径说明正确
- 下游 discoverability 文案与新路径一致

## 5.2 G2a-2 迁移 `design-consultation`

重点：

- 对 `brainstorm` 产物的读取路径
- `gstack-slug` -> `spec-first-slug`

专项验证：

- 能正确描述如何从 `~/.spec-first/projects/$SLUG/` 读取 brainstorm 产物

## 5.3 G2a-3 迁移 `document-release`

重点：

- `.gstack` 忽略目录 -> `.spec-first`
- `/tmp/gstack-pr-body-$$.md` -> `/tmp/spec-first-pr-body-$$.md`

专项验证：

- 文档扫描忽略路径与新项目状态目录一致

## 5.4 G2a-4 迁移 `retro`

重点：

- `~/.gstack/greptile-history.md`
- `~/.gstack/analytics/skill-usage.jsonl`
- `~/.gstack/analytics/eureka.jsonl`

专项验证：

- retro 中所有统计型路径与阶段 B 的 helper / state 目录语义一致

## 6. 统一验证步骤

### Step 1：逐个改模板

对每个 skill，检查并替换：

- `~/.gstack` -> `~/.spec-first`
- `.gstack` -> `.spec-first`
- `gstack-*` -> `spec-first-*`
- `~/.claude/skills/gstack/...` -> `~/.claude/skills/spec-first/...`
- `/tmp/gstack-*` -> `/tmp/spec-first-*`

### Step 2：逐个重新生成

每改完一个模板，就重新生成对应 `SKILL.md`

### Step 3：逐个静态搜索

每个 skill 改完后，单独搜索：

- `gstack`
- `~/.gstack`
- `.gstack`
- `gstack-config`
- `gstack-slug`
- `/gstack-upgrade`

### Step 4：逐个专项验证

- `brainstorm`：项目设计文档路径
- `design-consultation`：对 `brainstorm` 产物的读取路径
- `document-release`：文档扫描忽略目录与临时文件名
- `retro`：analytics / greptile / eureka 路径

### Step 5：组内一致性验证

最终统一检查：

- `~/.spec-first/projects`
- `~/.spec-first/analytics`
- `.spec-first/*`
- `spec-first-slug`

这 4 类核心引用是否在组内保持一致

## 7. 完成定义

`G2a` 只有在下面全部成立时，才算完成：

1. 4 个 skill 模板都已迁移
2. 4 个 `SKILL.md` 都已重新生成
3. 项目级产物路径统一切到 `~/.spec-first/projects`
4. analytics / greptile / eureka 路径统一切到 `~/.spec-first`
5. 临时文件名和忽略目录不再残留旧品牌

## 8. 风险提示

这一组的核心风险不是 browse 交互，而是“项目级状态目录漂移”。

最容易出的问题：

1. `brainstorm` 写到 `~/.spec-first/projects`
2. `design-consultation` 还在读 `~/.gstack/projects`

这会让 skill 间交接链路直接断掉。

所以 G2a 的验证重点必须放在“跨 skill 的路径一致性”，而不是单个 skill 文案是否漂亮。

## 9. 后续关系

`G2a` 完成后，下一步应进入：

- `G2b-带browse-bin或项目状态依赖的planning-skill迁移包`

因为这时：

- `~/.spec-first/projects` 语义已经稳定
- `spec-first-slug` 等 helper 的使用模式已经跑过一轮

再进入 `plan-ceo-review` / `plan-eng-review` / `plan-design-review` 风险会更可控。

