# G4-浏览器与部署重依赖skill迁移包

文档日期：2026-03-22
所属阶段：阶段 C
任务包目标：迁移依赖 browse runtime、项目内报告目录、项目级产物目录和 deploy helper 链的重交互 skill，打通 `.spec-first/*`、`~/.spec-first/projects/*` 与 `spec-first-*` helper 的浏览器和部署闭环

## 1. 任务包定位

`G4` 是阶段 C 中最重的一组 skill。

本组包含：

- `browse`
- `qa-only`
- `qa`
- `design-review`
- `setup-browser-cookies`
- `setup-deploy`
- `canary`
- `benchmark`
- `land-and-deploy`

之所以把它们放到 `G4`，是因为这一组同时依赖 4 条链：

1. browse runtime 与 sidecar 资产
2. 项目内 `.gstack/*` 报告目录
3. `~/.gstack/projects/$SLUG/*` 项目级交付产物
4. `gstack-slug`、`gstack-review-read`、`gstack-diff-scope` 等 helper 命令

这意味着 `G4` 必须建立在阶段 B 和 `G3` 已经稳定的前提上。

## 2. 本任务包覆盖文件

- `browse/SKILL.md.tmpl`
- `browse/SKILL.md`
- `qa-only/SKILL.md.tmpl`
- `qa-only/SKILL.md`
- `qa/SKILL.md.tmpl`
- `qa/SKILL.md`
- `design-review/SKILL.md.tmpl`
- `design-review/SKILL.md`
- `setup-browser-cookies/SKILL.md.tmpl`
- `setup-browser-cookies/SKILL.md`
- `setup-deploy/SKILL.md.tmpl`
- `setup-deploy/SKILL.md`
- `canary/SKILL.md.tmpl`
- `canary/SKILL.md`
- `benchmark/SKILL.md.tmpl`
- `benchmark/SKILL.md`
- `land-and-deploy/SKILL.md.tmpl`
- `land-and-deploy/SKILL.md`

## 3. 当前已识别的关键迁移点

## 3.1 `browse`

当前结论：

- `browse` 的核心迁移已经在阶段 B 的 `B3-browse-runtime-改造包` 中处理
- 阶段 C 这里的重点是 skill 文档层与 runtime 实际路径保持一致

说明：

- `browse` 在 `G4` 中是整组的基础锚点

## 3.2 `qa-only`

已确认存在：

- `.gstack/qa-reports`
- `~/.gstack/projects/` 下的 `*-test-plan-*.md`
- `~/.claude/skills/gstack/bin/gstack-slug`
- `~/.gstack/projects/{slug}/{user}-{branch}-test-outcome-{datetime}.md`

说明：

- `qa-only` 是 QA 链上的只读/只报告版本
- 它既读 planning 链产出的 test-plan，也写自己的 test-outcome

## 3.3 `qa`

已确认存在：

- `.gstack/qa-reports/`
- `~/.gstack/projects/` 下的 `*-test-plan-*.md`
- `~/.claude/skills/gstack/bin/gstack-slug`
- `~/.gstack/projects/{slug}/{user}-{branch}-test-outcome-{datetime}.md`

说明：

- `qa` 与 `qa-only` 共享大部分路径语义
- 两者必须成对迁移，否则 QA 报告和结果沉淀会分叉

## 3.4 `design-review`

已确认存在：

- `REPORT_DIR=".gstack/design-reports"`
- `.gstack/design-reports/`
- `~/.claude/skills/gstack/bin/gstack-slug`
- `~/.gstack/projects/{slug}/{user}-{branch}-design-audit-{datetime}.md`

说明：

- `design-review` 是设计审计链上的产物生产者
- 它的本地报告目录和项目级审计产物目录都要一起迁

## 3.5 `setup-browser-cookies`

当前结论：

- 它不只是 skill 名和调用入口层
- 生成后的 skill 文档会继承完整 preamble，因此会间接带入：
  - `gstack-update-check`
  - `gstack-config`
  - `~/.gstack/sessions`
  - `~/.gstack/analytics`
  - `~/.claude/skills/gstack/gstack-upgrade/SKILL.md`

说明：

- 如果只看 `SKILL.md.tmpl`，它的直接迁移点偏少
- 但如果按实际交付物看，仍然属于完整 preamble 链的一部分，不能低估

## 3.6 `setup-deploy`

已确认存在：

- “how do I deploy with gstack”
- “Configure Deployment for gstack”
- “How can gstack check if a deploy succeeded?”
- 生成后的 skill 文档会继承完整 preamble，因此同样包含：
  - `gstack-update-check`
  - `gstack-config`
  - `~/.gstack/sessions`
  - `~/.gstack/analytics`
  - `~/.claude/skills/gstack/gstack-upgrade/SKILL.md`

说明：

- `setup-deploy` 不只是品牌与部署语义文案迁移
- 它和 `setup-browser-cookies` 一样，也受完整 preamble 链影响
- 但它会影响 `land-and-deploy` 的用户指导一致性

## 3.7 `canary`

已确认存在：

- `~/.claude/skills/gstack/bin/gstack-slug`
- `.gstack/canary-reports`
- `.gstack/canary-reports/baselines`
- `.gstack/canary-reports/screenshots`
- `~/.gstack/projects/$SLUG`

说明：

- `canary` 同时依赖本地报告目录和项目级产物目录
- 是部署后验证链上的关键一环

## 3.8 `benchmark`

已确认存在：

- `~/.claude/skills/gstack/bin/gstack-slug`
- `.gstack/benchmark-reports`
- `.gstack/benchmark-reports/baselines`

说明：

- `benchmark` 的核心迁移点是报告目录和 slug helper

## 3.9 `land-and-deploy`

已确认存在：

- `~/.claude/skills/gstack/bin/gstack-review-read`
- `~/.gstack-dev/evals/*`
- `gstack-diff-scope`
- `~/.claude/skills/gstack/bin/gstack-diff-scope`
- `.gstack/deploy-reports`
- `~/.claude/skills/gstack/bin/gstack-slug`
- `~/.gstack/projects/$SLUG`

说明：

- `land-and-deploy` 是这组里最重的一支
- 它同时碰到 review 读取、diff-scope、eval 目录、deploy 报告目录和项目级 deploy 产物

## 4. 目标状态

G4 迁移完成后，这组 skill 应满足：

1. 所有项目内报告目录统一切到 `.spec-first/*`
2. 所有项目级 QA / design / deploy 产物统一写入 `~/.spec-first/projects/$SLUG/*`
3. 所有 `slug`、`review-read`、`diff-scope` 调用统一切到 `spec-first-*`
4. `browse` skill 文档与阶段 B 的 browse runtime 路径语义保持一致
5. deploy / canary / benchmark / QA / design-review 的本地报告目录命名完全统一
6. `~/.gstack-dev/evals/*` 这类开发态评估目录是否改名，要在本组中显式决策而不是放任漂移

## 5. 任务拆解

## 5.1 G4-1 迁移 `browse`

重点：

- skill 文档中的品牌与路径说明是否和 `B3` 保持一致
- sidecar 与 runtime 说明文案

专项验证：

- `browse` 的 skill 文档不再指导用户使用旧状态目录或旧 sidecar 路径

## 5.2 G4-2 迁移 `qa-only`

重点：

- `.gstack/qa-reports` -> `.spec-first/qa-reports`
- `gstack-slug` -> `spec-first-slug`
- `~/.gstack/projects/...test-plan...` -> `~/.spec-first/projects/...test-plan...`
- `~/.gstack/projects/...test-outcome...` -> `~/.spec-first/projects/...test-outcome...`

专项验证：

- `qa-only` 能正确承接 `G2b` 产出的 test-plan 路径

## 5.3 G4-3 迁移 `qa`

重点：

- `.gstack/qa-reports` -> `.spec-first/qa-reports`
- `gstack-slug` -> `spec-first-slug`
- `~/.gstack/projects/...test-plan...` -> `~/.spec-first/projects/...test-plan...`
- `~/.gstack/projects/...test-outcome...` -> `~/.spec-first/projects/...test-outcome...`

专项验证：

- `qa` 与 `qa-only` 的报告目录和产物目录完全一致

## 5.4 G4-4 迁移 `design-review`

重点：

- `.gstack/design-reports` -> `.spec-first/design-reports`
- `gstack-slug` -> `spec-first-slug`
- `~/.gstack/projects/...design-audit...` -> `~/.spec-first/projects/...design-audit...`

专项验证：

- design audit 的本地报告与项目级审计产物路径一致

## 5.5 G4-5 迁移 `setup-browser-cookies`

重点：

- skill 名、调用样例、用户提示文案
- 是否有旧品牌说明残留

专项验证：

- skill 入口示例与 `spec-first` 命名体系一致

## 5.6 G4-6 迁移 `setup-deploy`

重点：

- `gstack` 品牌文案 -> `spec-first`
- 部署成功检查的说明与后续 `land-and-deploy` 保持一致

专项验证：

- 用户从 `setup-deploy` 进入 `land-and-deploy` 时不会看到旧品牌分叉

## 5.7 G4-7 迁移 `canary`

重点：

- `.gstack/canary-reports` -> `.spec-first/canary-reports`
- `gstack-slug` -> `spec-first-slug`
- `~/.gstack/projects/$SLUG` -> `~/.spec-first/projects/$SLUG`

专项验证：

- baseline、screenshot、最终 canary report 三类产物都统一到新目录

## 5.8 G4-8 迁移 `benchmark`

重点：

- `.gstack/benchmark-reports` -> `.spec-first/benchmark-reports`
- `gstack-slug` -> `spec-first-slug`

专项验证：

- benchmark baseline 与 report 目录统一切新

## 5.9 G4-9 迁移 `land-and-deploy`

重点：

- `gstack-review-read` -> `spec-first-review-read`
- `gstack-diff-scope` -> `spec-first-diff-scope`
- `gstack-slug` -> `spec-first-slug`
- `.gstack/deploy-reports` -> `.spec-first/deploy-reports`
- `~/.gstack/projects/$SLUG` -> `~/.spec-first/projects/$SLUG`
- `~/.gstack-dev/evals/*` 是否同步改名为 `~/.spec-first-dev/evals/*`

专项验证：

- review-read、diff-scope、deploy report、project artifact 4 条链全部保持一致

## 6. 统一验证步骤

### Step 1：逐个改模板

对每个 skill，检查并替换：

- `~/.gstack` -> `~/.spec-first`
- `.gstack` -> `.spec-first`
- `~/.gstack-dev` -> `~/.spec-first-dev` 或保留旧名并在文档中显式说明
- `gstack-slug` -> `spec-first-slug`
- `gstack-review-read` -> `spec-first-review-read`
- `gstack-diff-scope` -> `spec-first-diff-scope`
- `~/.claude/skills/gstack/...` -> `~/.claude/skills/spec-first/...`

### Step 2：逐个重新生成

每改完一个模板，就重新生成对应 `SKILL.md`

### Step 3：逐个静态搜索

对每个 skill 单独搜索：

- `gstack`
- `~/.gstack`
- `.gstack`
- `~/.gstack-dev`
- `gstack-slug`
- `gstack-review-read`
- `gstack-diff-scope`

### Step 4：逐个专项验证

- `browse`：文档层与 `B3` 路径语义一致
- `qa-only`：test-plan / test-outcome 路径一致
- `qa`：与 `qa-only` 的目录语义一致
- `design-review`：design-audit 的本地和项目级路径一致
- `setup-browser-cookies`：入口与品牌一致
- `setup-deploy`：部署说明与下游 skill 一致
- `canary`：baseline / screenshots / report 三类目录一致
- `benchmark`：baseline / report 目录一致
- `land-and-deploy`：review-read / diff-scope / deploy report / evals 语义一致

### Step 5：组内交接一致性验证

最终统一检查：

- `.spec-first/qa-reports`
- `.spec-first/design-reports`
- `.spec-first/canary-reports`
- `.spec-first/benchmark-reports`
- `.spec-first/deploy-reports`
- `~/.spec-first/projects/$SLUG/*`
- `spec-first-slug`
- `spec-first-review-read`
- `spec-first-diff-scope`

这些浏览器与部署链的关键路径是否在组内完全统一

## 7. 完成定义

`G4` 只有在下面全部成立时，才算完成：

1. 9 个 skill 模板都已迁移
2. 9 个 `SKILL.md` 都已重新生成
3. 本地报告目录全部统一切到 `.spec-first/*`
4. QA / design / deploy / canary / benchmark 的项目级产物目录统一切到 `~/.spec-first/projects/*`
5. `spec-first-slug`、`spec-first-review-read`、`spec-first-diff-scope` 三条 helper 链全部统一
6. `~/.gstack-dev/evals/*` 的命名去向已明确决策，不再处于悬空状态

## 8. 风险提示

这一组最大的风险不是改漏一个路径，而是本地报告目录和项目级产物目录之间发生“双轨制”。

典型错误会是：

1. `qa` 把本地报告写到 `.spec-first/qa-reports`
2. 但 `qa-only` 还把 test-outcome 写到 `~/.gstack/projects/...`

或者：

1. `land-and-deploy` 已切到 `spec-first-review-read`
2. 但 `setup-deploy` 文案还在指导用户进入旧的 deploy 链路

再或者：

1. `canary`、`benchmark`、`design-review` 三者的本地目录命名各自改法不同
2. 最终导致阶段 D 的统一验证无法收口

所以 `G4` 的验证重点必须放在“目录体系和交接链路的一致性”，而不是单个 skill 的替换数量。

## 9. 后续关系

`G4` 完成后，下一步应进入：

- `G5-升级与特殊迁移skill迁移包`

因为到这时：

- 框架、planning、review、browser、deploy 这几条主链都已经稳定
- 升级入口、版本检查和命名决策才适合做最后定版
