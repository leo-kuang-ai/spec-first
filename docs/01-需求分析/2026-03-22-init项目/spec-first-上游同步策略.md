# spec-first 上游同步策略

文档日期：2026-03-22
上游项目：`/Users/kuang/xiaobu/gstack`
目标项目：`/Users/kuang/Desktop/ops/spec-first-pro`
目标问题：`gstack` 后续持续更新时，`spec-first` 如何稳定同步，而不破坏已完成的迁移

## 1. 问题定义

迁移完成后，`spec-first` 会面临一个长期问题：

```text
上游 gstack 在持续变化
    +
spec-first 已经做了品牌、路径、目录、命令前缀改造
    =
后续不能直接裸 merge
```

如果没有同步策略，后果会很快出现：

1. `spec-first` 很快落后于 `gstack`。
2. 每次同步都要全仓人工比对。
3. `gstack -> spec-first` 的改名逻辑反复打架。
4. 一旦 `setup`、`gen-skill-docs.ts`、`browse` 路径层被上游改动，手工同步成本会陡增。

所以这件事不能靠“以后再说”，必须在第一次迁移时就把同步架构设计好。

## 2. 核心结论

`spec-first` 不应被设计成“永久手工改名版 gstack”，而应被设计成：

```text
上游核心层（持续吸收 gstack）
    +
spec-first 适配层（品牌、路径、命名前缀、兼容层）
    +
标准化同步流程
```

这是唯一能长期维持同步成本可控的方式。

## 3. 三种同步模式

### 模式 A：硬分叉

定义：

- 迁移后完全不再跟 `gstack` 同步。

优点：

- 最简单。
- 不需要处理上游冲突。

缺点：

- 会丢掉 `gstack` 后续所有改进。
- `spec-first` 很快变成孤岛。

结论：

- 不适合当前目标。

### 模式 B：整仓同步 + 每次重新 rename

定义：

- 每次上游更新后，把整个 `gstack` 仓库重新同步进来，再对全仓重新做 `gstack -> spec-first` 替换。

优点：

- 直觉上简单。

缺点：

- 每次同步都是一次重复迁移。
- 冲突会集中爆发在：
  - `setup`
  - `scripts/gen-skill-docs.ts`
  - `bin/gstack-*`
  - `~/.gstack` / `.gstack`
  - `.agents/skills/gstack-*`
- 很容易出现“这次同步只改了一半”的半失稳状态。

结论：

- 不推荐。

### 模式 C：上游核心层同步 + spec-first 适配层覆盖

定义：

- `gstack` 中真正承载能力的代码与模板，作为“上游核心层”定期同步。
- `spec-first` 自己只保留一层稳定、很薄的“适配层”。

优点：

- 同步冲突范围最小。
- 大部分上游变化都能低成本进入。
- 改名逻辑集中在少数中枢文件里。

缺点：

- 迁移初期要多做一点架构约束。

结论：

- 推荐采用。

## 4. 推荐架构

### 4.1 分层原则

以后 `spec-first` 的文件应按三类管理：

#### A 类：上游优先层

原则：

- 尽量跟随 `gstack`。
- 不做大规模本地改写。

建议包含：

- `browse/`
- `scripts/`
- `test/`
- `supabase/`
- 各 skill 目录的主体流程内容
- `review/` 里的 checklist、参考材料

这些地方的价值主要来自上游持续演化，应该尽可能保持接近原始结构。

#### B 类：spec-first 适配层

原则：

- 专门承接品牌、路径、安装位置、命名前缀、兼容层。
- 尽量少，尽量集中。

建议包含：

- `setup`
- `scripts/gen-skill-docs.ts`
- `bin/*` 中命名前缀相关入口
- runtime 路径配置代码
- 兼容迁移脚本

这些文件是 `gstack` 和 `spec-first` 真正分叉的地方。

#### C 类：spec-first 自主管理层

原则：

- 不再以上游为准。
- 明确由 `spec-first` 自己负责。

建议包含：

- `README.md`
- `ARCHITECTURE.md`
- `AGENTS.md`
- `CLAUDE.md`
- `CONTRIBUTING.md`
- `CHANGELOG.md`
- `docs/` 下与 spec-first 产品定位相关的文档

这些文件本来就会越来越偏离 `gstack`，没必要强行保持同步。

## 5. 目录级同步清单

下面给出建议的目录同步策略。

### 5.1 建议持续同步的目录

这些目录以后原则上要持续吸收 `gstack` 上游更新：

- `browse/`
- `scripts/`
- `test/`
- `supabase/`
- `brainstorm/`
- `plan-ceo-review/`
- `plan-eng-review/`
- `plan-design-review/`
- `review/`
- `qa/`
- `qa-only/`
- `design-review/`
- `design-consultation/`
- `ship/`
- `land-and-deploy/`
- `canary/`
- `benchmark/`
- `document-release/`
- `investigate/`
- `retro/`
- `setup-browser-cookies/`
- `setup-deploy/`
- `codex/`
- `careful/`
- `freeze/`
- `guard/`
- `unfreeze/`

### 5.2 建议谨慎同步的文件

这些文件需要“上游变更参考 + 本地人工裁决”：

- `setup`
- `scripts/gen-skill-docs.ts`
- `package.json`
- `SKILL.md.tmpl`
- 各 skill 的 `SKILL.md.tmpl`
- `bin/*`

原因：

- 这些文件最容易同时承载“上游功能变化”和“本地品牌适配”。

### 5.3 建议不直接覆盖同步的文件

这些文件应由 `spec-first` 独立维护：

- `README.md`
- `ARCHITECTURE.md`
- `AGENTS.md`
- `CLAUDE.md`
- `CONTRIBUTING.md`
- `CHANGELOG.md`
- `docs/01-需求分析/*`

原因：

- 它们的职责已经从“描述 gstack”变成“描述 spec-first”。

## 6. 同步的标准流程

以后每次 `gstack` 更新，`spec-first` 不应直接把变更 merge 到主分支，而应走固定流程。

### 第 1 步：建立上游变更窗口

输入：

- 上次同步基线 commit
- 本次上游最新 commit

动作：

1. 记录同步区间。
2. 查看上游这段时间改动主要落在哪些目录。
3. 给变更分类：
   - 核心功能变化
   - 路径/安装变化
   - 文档变化
   - 测试变化

输出：

- 一份同步窗口说明

### 第 2 步：先同步 A 类目录

动作：

1. 把 A 类目录从上游同步进来。
2. 不立即处理品牌 rename。
3. 保留原始差异，先看是否引入结构变化。

输出：

- 新的上游核心层

### 第 3 步：再审查 B 类中枢文件

动作：

重点检查：

- `setup`
- `scripts/gen-skill-docs.ts`
- `bin/*`
- browse 路径配置相关文件

检查问题：

1. 上游是否新增了新路径常量？
2. 上游是否新增了新 helper 命令？
3. 上游是否修改了安装逻辑？
4. 上游是否修改了生成模板逻辑？

输出：

- 一份“必须重新应用 spec-first 适配”的变更点清单

### 第 4 步：重新应用 spec-first 适配层

动作：

1. 重新覆盖品牌名：
   - `gstack` -> `spec-first`
2. 重新覆盖状态目录：
   - `~/.gstack` -> `~/.spec-first`
   - `.gstack` -> `.spec-first`
3. 重新覆盖安装路径：
   - `~/.claude/skills/gstack` -> `~/.claude/skills/spec-first`
   - `~/.codex/skills/gstack` -> `~/.codex/skills/spec-first`
4. 重新覆盖 sidecar 与 agents 输出前缀：
   - `gstack-*` -> `spec-first-*`
5. 补齐兼容层逻辑。

输出：

- 新一轮适配后的 `spec-first`

### 第 5 步：重新生成产物

动作：

1. 重新生成 `SKILL.md`
2. 重新生成 `.agents/skills/spec-first-*`
3. 检查 sidecar 与生成路径是否一致

输出：

- 同步后的生成产物

### 第 6 步：运行验证

动作：

至少验证：

- build
- 生成脚本
- 单测
- 至少一条 browse 路径
- 至少一条 skill 运行路径

输出：

- 一份同步验证结果

### 第 7 步：最后再更新 C 类文档

动作：

1. 只吸收上游文档里有价值的能力变化说明。
2. 不直接覆盖 `spec-first` 的品牌和安装文案。

输出：

- 同步后的产品文档

## 7. 建议引入的同步资产

为了避免每次同步靠记忆，建议在 `spec-first` 仓库里固定增加三类资产。

### 7.1 上游清单文件

建议文件：

- `docs/designs/upstream-sync-manifest.md`

作用：

- 记录哪些目录属于 A 类、B 类、C 类
- 记录同步边界
- 记录不能直接覆盖的文件

### 7.2 同步脚本

建议文件：

- `scripts/sync-from-gstack.sh`

作用：

- 标准化同步 A 类目录
- 输出待处理差异

### 7.3 适配脚本

建议文件：

- `scripts/apply-spec-first-branding.sh`

作用：

- 在上游同步后，统一重新施加 `spec-first` 适配层

注意：

- 这不是粗暴全局替换脚本。
- 它只应该处理已经定义清楚的 rename 点。

## 8. 冲突处理规则

以后每次同步时，按下面规则处理冲突。

### 规则 1：功能变化优先吸收

如果上游改的是实际功能逻辑，比如：

- browse 命令
- runtime bugfix
- test coverage
- skill 流程增强

则优先保留上游变化，再重新套 `spec-first` 适配。

### 规则 2：品牌变化不直接跟随

如果上游改的是：

- README 品牌叙事
- 安装文案
- 产品定位文案

则不直接覆盖 `spec-first` 的文档层。

### 规则 3：中枢文件必须人工过目

以下文件不允许盲同步：

- `setup`
- `scripts/gen-skill-docs.ts`
- `package.json`
- `bin/*`

原因：

- 它们同时承载上游功能逻辑和本地适配逻辑。

### 规则 4：生成物永远不手改合并

以下内容不应手工 merge：

- `SKILL.md`
- `.agents/skills/spec-first-*`

原则：

- 只改模板和生成器
- 然后重新生成

## 9. 什么情况下不能直接同步

以下几种情况，不能按普通流程同步，必须单独做迁移评估。

### 场景 A：上游改了安装模型

比如：

- `setup` 整体重构
- host 安装方式变化
- sidecar 目录结构变化

这会直接影响 `spec-first` 的安装中枢。

### 场景 B：上游改了生成模型

比如：

- `gen-skill-docs.ts` 的 host path 结构变化
- skill 模板协议变化
- 输出目录结构变化

这会直接影响 `spec-first` 的生成中枢。

### 场景 C：上游改了状态目录协议

比如：

- `.gstack` 下文件结构变化
- browse server 状态模型变化
- config.yaml 路径变化

这会直接影响 `spec-first` 的运行时兼容层。

### 场景 D：上游新增了新 skill 或新命令前缀

这时必须决定：

1. 是否同步进 `spec-first`
2. 是否纳入命名映射
3. 是否进入安装、生成、文档和测试清单

## 10. 长期维护建议

为了让同步成本始终可控，迁移初期就应坚持三条纪律。

### 纪律 1：把 rename 集中到中枢，不要全仓散射

越多 `gstack -> spec-first` 的改动散在各处，后续越难同步。

所以 rename 应尽量集中在：

- `setup`
- `scripts/gen-skill-docs.ts`
- 路径配置文件
- helper 命名前缀层

### 纪律 2：生成物不当源码维护

所有生成产物都应视为 build artifact，而不是手工维护文件。

### 纪律 3：每次同步都记录基线

建议每次同步都记录：

- 上次上游 commit
- 本次上游 commit
- 同步范围
- 人工处理点
- 是否改动兼容层

否则两三次之后就没人知道系统为什么变成现在这样。

## 11. 最终建议

我建议 `spec-first` 采用下面这个长期模型：

```text
gstack upstream
   ->
同步 A 类核心层
   ->
人工审查 B 类中枢
   ->
重新施加 spec-first 适配层
   ->
重新生成产物
   ->
跑验证
   ->
更新 spec-first 文档层
```

这套模型的本质是：

- `gstack` 负责持续产出能力演进
- `spec-first` 负责稳定承接并包装成自己的产品形态

这样 `spec-first` 才能既保持自己的品牌和结构，又不会和上游能力演化脱钩。

## 12. 下一步建议

如果要继续把这件事落细，下一份应该写：

`spec-first-上游同步任务清单.md`

这份文档应进一步拆成：

- 同步前检查项
- 同步脚本责任边界
- A/B/C 类目录清单
- 冲突升级规则
- 每次同步的验收标准

