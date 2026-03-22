# G3-评审与质量类skill迁移包

文档日期：2026-03-22
所属阶段：阶段 C
任务包目标：迁移评审、调查、二次审查和发版交付链上的高耦合 skill，打通 `spec-first-review-log`、`spec-first-slug`、`spec-first-diff-scope` 与 `~/.spec-first/projects` 的 review handoff 闭环

## 1. 任务包定位

`G3` 是阶段 C 中第一组明显依赖 helper 命令、review 记录和项目级 override 文件的高耦合 skill。

本组包含：

- `review`
- `investigate`
- `codex`
- `ship`

之所以把它们单独成组，是因为这组已经不只是模板内品牌替换问题，而是直接碰到 review 生命周期里的 4 条主链：

1. review 结果如何记录
2. review override 如何写入项目状态目录
3. diff scope 如何为 ship/design review 提供判定输入
4. ship 阶段如何继承前序 review 的状态

这意味着 `G3` 必须建立在阶段 B 和 `G2b` 已经稳定的前提上。

## 2. 本任务包覆盖文件

- `review/SKILL.md.tmpl`
- `review/SKILL.md`
- `investigate/SKILL.md.tmpl`
- `investigate/SKILL.md`
- `codex/SKILL.md.tmpl`
- `codex/SKILL.md`
- `ship/SKILL.md.tmpl`
- `ship/SKILL.md`

## 3. 当前已识别的关键迁移点

## 3.1 `review`

当前结论：

- `review` 本身更像 review 语义和流程入口
- 它是否直接写死旧路径，需要在实际 patch 时再做逐项静态搜索确认

说明：

- 即使模板内旧路径较少，它仍处在这组里，因为它定义了 review handoff 的上游语义

## 3.2 `investigate`

已确认存在：

- `STATE_DIR="${CLAUDE_PLUGIN_DATA:-$HOME/.gstack}"`

说明：

- `investigate` 是这组里最明确依赖全局状态目录的 skill
- 它的迁移重点不是项目级 `projects` 子目录，而是全局 state 根路径

## 3.3 `codex`

已确认存在：

- `~/.claude/skills/gstack/bin/gstack-review-log '{"skill":"codex-review",...}'`

说明：

- `codex` 是 review 记录链上的直接消费者和写入者
- 它必须和 `review`、`ship` 在 review log 语义上保持一致

## 3.4 `ship`

已确认存在：

- `~/.claude/skills/gstack/bin/gstack-slug`
- `grep '"skill":"ship-review-override"' ~/.gstack/projects/$SLUG/$BRANCH-reviews.jsonl`
- `~/.claude/skills/gstack/bin/gstack-diff-scope`
- `echo ... >> ~/.gstack/projects/$SLUG/$BRANCH-reviews.jsonl`

说明：

- `ship` 是这组里依赖最重的一支
- 它同时碰到 helper、项目状态目录、review override 持久化和 design review 提示逻辑

## 4. 目标状态

G3 迁移完成后，这组 skill 应满足：

1. 所有 review 记录统一写入 `spec-first-review-log`
2. 所有 `slug` 解析统一切到 `spec-first-slug`
3. 所有 diff scope 判定统一切到 `spec-first-diff-scope`
4. 所有 review override 文件统一写入 `~/.spec-first/projects/$SLUG/$BRANCH-reviews.jsonl`
5. `investigate` 的默认状态目录统一切到 `~/.spec-first`
6. review、codex、ship 三者对 review 状态的读写语义保持一致

## 5. 任务拆解

## 5.1 G3-1 迁移 `review`

重点：

- 模板内是否残留 `gstack` 品牌或 helper 命令
- review 结果描述是否与 `spec-first-review-log` 语义一致

专项验证：

- `review` 的模板与 `codex` / `ship` 的 review gate 术语一致

## 5.2 G3-2 迁移 `investigate`

重点：

- `STATE_DIR="${CLAUDE_PLUGIN_DATA:-$HOME/.gstack}"` -> `STATE_DIR="${CLAUDE_PLUGIN_DATA:-$HOME/.spec-first}"`
- 全局状态目录说明文案

专项验证：

- 如果未设置 `CLAUDE_PLUGIN_DATA`，默认落点明确为 `~/.spec-first`

## 5.3 G3-3 迁移 `codex`

重点：

- `gstack-review-log` -> `spec-first-review-log`
- `~/.claude/skills/gstack/bin/...` -> `~/.claude/skills/spec-first/bin/...`
- `codex-review` 事件写入格式保持不变，只改命令入口和品牌路径

专项验证：

- `codex` 写出的 review 事件仍能被后续 review/ship 链承接

## 5.4 G3-4 迁移 `ship`

重点：

- `gstack-slug` -> `spec-first-slug`
- `gstack-diff-scope` -> `spec-first-diff-scope`
- `~/.gstack/projects/$SLUG/$BRANCH-reviews.jsonl` -> `~/.spec-first/projects/$SLUG/$BRANCH-reviews.jsonl`
- design review 提示中的 helper 命令说明

专项验证：

- review override 的读写路径一致
- ship 对 design review 的提示逻辑仍基于正确的新 helper

## 6. 统一验证步骤

### Step 1：逐个改模板

对每个 skill，检查并替换：

- `~/.gstack` -> `~/.spec-first`
- `.gstack` -> `.spec-first`
- `gstack-review-log` -> `spec-first-review-log`
- `gstack-review-read` -> `spec-first-review-read`
- `gstack-slug` -> `spec-first-slug`
- `gstack-diff-scope` -> `spec-first-diff-scope`
- `~/.claude/skills/gstack/...` -> `~/.claude/skills/spec-first/...`

### Step 2：逐个重新生成

每改完一个模板，就重新生成对应 `SKILL.md`

### Step 3：逐个静态搜索

对每个 skill 单独搜索：

- `gstack`
- `~/.gstack`
- `.gstack`
- `gstack-review-log`
- `gstack-review-read`
- `gstack-slug`
- `gstack-diff-scope`

### Step 4：逐个专项验证

- `review`：review gate 术语是否和新链路一致
- `investigate`：默认 `STATE_DIR` 是否切到 `~/.spec-first`
- `codex`：review-log 写入命令是否已切到 `spec-first-review-log`
- `ship`：review override、slug、diff-scope 三条链是否都已切新

### Step 5：组内 handoff 一致性验证

最终统一检查：

- `spec-first-review-log`
- `spec-first-review-read`
- `spec-first-slug`
- `spec-first-diff-scope`
- `~/.spec-first/projects/$SLUG/$BRANCH-reviews.jsonl`

这些 review handoff 关键点是否在组内完全统一

## 7. 完成定义

`G3` 只有在下面全部成立时，才算完成：

1. 4 个 skill 模板都已迁移
2. 4 个 `SKILL.md` 都已重新生成
3. review log 链统一切到 `spec-first-review-log`
4. slug 和 diff scope 链统一切到 `spec-first-slug` / `spec-first-diff-scope`
5. review override 文件统一切到 `~/.spec-first/projects/...-reviews.jsonl`
6. `investigate` 的默认状态目录已切到 `~/.spec-first`

## 8. 风险提示

这一组最大的风险不是单个 skill 留下一个旧品牌，而是 review handoff 断链。

典型错误会是：

1. `codex` 已写入 `spec-first-review-log`
2. 但 `ship` 仍从 `~/.gstack/projects/...-reviews.jsonl` 读取 override

或者：

1. `ship` 已切到 `spec-first-diff-scope`
2. 但 design review 提示文案还在指导用户运行旧 helper

所以 `G3` 的验证重点必须放在 review 生命周期里的“写入方和读取方是否一致”，而不是只看模板替换是否完成。

## 9. 后续关系

`G3` 完成后，下一步应进入：

- `G4-浏览器与部署重依赖skill迁移包`

因为到这时：

- review / codex / ship 的 helper 链已经稳定
- `~/.spec-first/projects` 下的 review override 语义已经固定
- 再进入 `browse`、`qa`、`design-review`、deploy 这类重交互 skill 的风险会更低
