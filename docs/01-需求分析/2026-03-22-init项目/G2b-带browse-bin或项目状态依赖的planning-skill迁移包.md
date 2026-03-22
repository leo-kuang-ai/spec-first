# G2b-带browse-bin或项目状态依赖的planning-skill迁移包

文档日期：2026-03-22
所属阶段：阶段 C
任务包目标：迁移带 `browse/bin` 资产依赖或重度依赖 `~/.spec-first/projects` 的 planning skill，打通 planning skill 之间的项目级交接链路

## 1. 任务包定位

`G2b` 是阶段 C 中 planning skill 的重依赖子组。

本组包含：

- `plan-ceo-review`
- `plan-eng-review`
- `plan-design-review`

之所以把它们从 `G2a` 中拆出来，是因为它们已经不是简单的“品牌和路径替换”问题，而是带有明显的 cross-skill handoff 和项目级状态目录依赖。

它们共同依赖三类东西：

1. `browse/bin/remote-slug`
2. `~/.gstack/projects/$SLUG/...`
3. `gstack-review-log` / `gstack-slug` 等 helper 链路

这意味着它们必须建立在阶段 B 和 G2a 已经稳定的前提上。

## 2. 本任务包覆盖文件

- `plan-ceo-review/SKILL.md.tmpl`
- `plan-ceo-review/SKILL.md`
- `plan-eng-review/SKILL.md.tmpl`
- `plan-eng-review/SKILL.md`
- `plan-design-review/SKILL.md.tmpl`
- `plan-design-review/SKILL.md`

## 3. 当前已识别的关键迁移点

## 3.1 `plan-ceo-review`

已确认存在：

- `~/.claude/skills/gstack/browse/bin/remote-slug`
- `~/.gstack/projects/$SLUG/*-$BRANCH-design-*.md`
- `~/.gstack/projects/$SLUG/*-$BRANCH-ceo-handoff-*.md`
- `mkdir -p ~/.gstack/projects/$SLUG`
- `~/.gstack/projects/$SLUG/ceo-plans`
- `~/.claude/skills/gstack/bin/gstack-slug`
- `~/.claude/skills/gstack/bin/gstack-review-log`

说明：

- 这是当前 planning skill 里依赖最重的一支

## 3.2 `plan-eng-review`

已确认存在：

- `~/.claude/skills/gstack/browse/bin/remote-slug`
- `~/.gstack/projects/$SLUG/*-$BRANCH-design-*.md`
- `~/.claude/skills/gstack/bin/gstack-slug`
- `~/.gstack/projects/{slug}/{user}-{branch}-test-plan-{datetime}.md`
- `~/.claude/skills/gstack/bin/gstack-review-log`

说明：

- 它是 `/qa` 与 `/qa-only` 的上游 test-plan 产物生产者

## 3.3 `plan-design-review`

已确认存在：

- `~/.gstack/` 相关说明
- `~/.claude/skills/gstack/bin/gstack-review-log`

说明：

- 它的路径复杂度低于前两者，但仍处在同一交付链里

## 4. 目标状态

G2b 迁移完成后，这组 skill 应满足：

1. 所有项目级计划/交接文档统一写入 `~/.spec-first/projects`
2. 所有 `remote-slug` 路径统一切到 `spec-first` 的 browse sidecar
3. 所有 review logging 统一切到 `spec-first-review-log`
4. 所有 `gstack-slug` 引用统一切到 `spec-first-slug`
5. handoff、ceo-plans、test-plan 这些跨 skill 产物路径彼此一致

## 5. 任务拆解

## 5.1 G2b-1 迁移 `plan-ceo-review`

重点：

- `remote-slug` 路径
- `~/.spec-first/projects/$SLUG/*-$BRANCH-design-*.md`
- `~/.spec-first/projects/$SLUG/*-$BRANCH-ceo-handoff-*.md`
- `~/.spec-first/projects/$SLUG/ceo-plans`
- `spec-first-slug`
- `spec-first-review-log`

专项验证：

- handoff note 的读写路径一致
- ceo-plans 的写入和 archive 路径一致

## 5.2 G2b-2 迁移 `plan-eng-review`

重点：

- `remote-slug` 路径
- `~/.spec-first/projects/$SLUG/*-$BRANCH-design-*.md`
- `spec-first-slug`
- `~/.spec-first/projects/{slug}/{user}-{branch}-test-plan-{datetime}.md`
- `spec-first-review-log`

专项验证：

- test-plan 产物路径为后续 `/qa` / `/qa-only` 所能承接的目标路径

## 5.3 G2b-3 迁移 `plan-design-review`

重点：

- `~/.gstack` 说明文本
- `spec-first-review-log`

专项验证：

- 与 `plan-ceo-review` / `plan-eng-review` 的 review logging 语义一致

## 6. 统一验证步骤

### Step 1：逐个改模板

对每个 skill，检查并替换：

- `~/.claude/skills/gstack/browse/bin/remote-slug`
- `~/.claude/skills/gstack/bin/gstack-slug`
- `~/.claude/skills/gstack/bin/gstack-review-log`
- `~/.gstack/projects`
- `~/.gstack/`

### Step 2：逐个重新生成

每改完一个模板，就重新生成对应 `SKILL.md`

### Step 3：逐个静态搜索

对每个 skill 单独搜索：

- `gstack`
- `~/.gstack`
- `.gstack`
- `gstack-slug`
- `gstack-review-log`
- `browse/bin/remote-slug`

### Step 4：逐个专项验证

- `plan-ceo-review`：handoff + ceo-plans
- `plan-eng-review`：test-plan
- `plan-design-review`：review-log 与状态目录文案

### Step 5：组内交接一致性验证

最终统一检查：

- `~/.spec-first/projects/$SLUG/...design...`
- `~/.spec-first/projects/$SLUG/...handoff...`
- `~/.spec-first/projects/$SLUG/ceo-plans/...`
- `~/.spec-first/projects/...test-plan...`

这些 cross-skill 交接路径是否完全统一

## 7. 完成定义

`G2b` 只有在下面全部成立时，才算完成：

1. 3 个 skill 模板都已迁移
2. 3 个 `SKILL.md` 都已重新生成
3. `remote-slug` 路径已切到 spec-first 结构
4. `~/.spec-first/projects` 下的设计文档、handoff、ceo-plans、test-plan 路径已统一
5. review logging 已统一切到 `spec-first-review-log`

## 8. 风险提示

这组最大的风险不是“单 skill 没改干净”，而是“skill 之间的交接路径不一致”。

典型错误会是：

1. `plan-ceo-review` 写 handoff 到 `~/.spec-first/projects`
2. 但后续 skill 仍在 `~/.gstack/projects` 读

或者：

1. `plan-eng-review` 写 test-plan 到新路径
2. 但 `/qa` 还在旧路径找

所以 `G2b` 的验证必须以 cross-skill handoff 为中心，而不是只看单个 skill 的模板是否替换完。

## 9. 后续关系

`G2b` 完成后，下一步应进入：

- `G3-评审与质量类skill迁移包`

因为到这时：

- planning 链上的项目级状态目录语义已经稳定
- review-log / slug / remote-slug 这些关键 helper 的真实使用路径已经跑过

再去处理 `review`、`investigate`、`codex`、`ship` 的风险会更低。

