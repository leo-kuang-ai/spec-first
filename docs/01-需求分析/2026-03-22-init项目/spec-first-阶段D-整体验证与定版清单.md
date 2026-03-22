# spec-first 阶段D 整体验证与定版清单

文档日期：2026-03-22
所属阶段：阶段 D
阶段目标：在阶段 B 和阶段 C 都完成后，证明迁移未改变功能，并为首个可交付的 `spec-first` 迁移版本做定版

## 1. 阶段 D 的定位

阶段 D 不是再改结构，而是做最后两件事：

1. 验证迁移是否真的没有破坏功能
2. 确认目标态已经彻底切到 `spec-first`

这一步不能再用“已经改完了，应该没问题”这种判断。

阶段 D 必须用证据回答下面 4 个问题：

1. `setup` 是否能按新路径安装
2. skill 生成链是否能完整生成
3. browse / helper / review / deploy 主链是否能按新路径运行
4. 是否还残留不该存在的旧路径、旧命令和旧入口

## 2. 阶段 D 的前置条件

只有下面条件全部成立，阶段 D 才应该开始：

1. [spec-first-阶段B中枢改造清单.md](./spec-first-%E9%98%B6%E6%AE%B5B%E4%B8%AD%E6%9E%A2%E6%94%B9%E9%80%A0%E6%B8%85%E5%8D%95.md) 已完成
2. [spec-first-阶段C-skill迁移顺序清单.md](./spec-first-%E9%98%B6%E6%AE%B5C-skill%E8%BF%81%E7%A7%BB%E9%A1%BA%E5%BA%8F%E6%B8%85%E5%8D%95.md) 下的 `G0-G5` 已完成
3. 阶段 C 中每个 skill 都已经做过独立验证

否则阶段 D 会退化成“边补边测”，失去总收口意义。

## 3. 阶段 D 的验证范围

阶段 D 必须覆盖 6 个面。

## 3.1 安装面

验证：

- `setup`
- `dev-setup`
- `dev-teardown`
- host 安装目录
- sidecar 安装目录

目标：

- 新用户按 `spec-first` 路径完成安装
- 开发态安装和卸载都不再依赖旧品牌路径

## 3.2 生成面

验证：

- `scripts/gen-skill-docs.ts`
- 根 `SKILL.md`
- 各 skill `SKILL.md`
- `.agents/skills/spec-first*`

目标：

- 所有生成产物都来自新路径和新命令体系

## 3.3 运行时面

验证：

- browse runtime
- `bin/spec-first-*` helper
- 状态目录解析
- log / server / recovery 路径

目标：

- runtime 已完全转到 `.spec-first` / `~/.spec-first`

## 3.4 skill 面

验证：

- `G0-G5` 全部 skill
- planning 链
- review 链
- QA / design-review / deploy 链
- upgrade 链

目标：

- skill 之间的交接链路完整闭环

## 3.5 测试面

验证：

- `test/*`
- `browse/test/*`
- skill 级静态搜索
- 生成物校验

目标：

- 证明迁移没有引入明显断裂

## 3.6 残留清零面

验证：

- 旧 `.gstack` 状态目录是否还作为运行时路径被使用
- 旧 `gstack-*` 命令是否还作为正式入口存在
- 旧 skill 路由是否还作为正式入口存在

目标：

- 明确把旧品牌残留清零，而不是默认保留

## 4. 阶段 D 的执行顺序

阶段 D 建议按下面顺序执行。

### D1：框架级验证

先验证公共主干：

1. `setup`
2. `gen-skill-docs.ts`
3. `bin/spec-first-*`
4. browse runtime

目的：

- 先证明基础框架健康，再看 skill 链

### D2：skill 链路验证

再按主链验证：

1. planning 链
2. review 链
3. QA / design-review 链
4. deploy / canary / benchmark 链
5. upgrade 链

目的：

- 验证 cross-skill handoff 真实可用

### D3：残留清零验证

最后再验证：

1. 旧状态目录是否已退出目标态
2. 旧命令入口是否已退出目标态
3. 升级链是否只暴露新入口

目的：

- 把“是否还残留旧入口”从隐含状态变成显式结果

### D4：定版决策

最后统一做：

1. 残留旧路径清单
2. 清零项确认清单
3. 首发版本的用户提示文案
4. 发布口径

目的：

- 形成一个可发布、可说明、可维护的迁移版本

## 5. 逐项验证清单

## 5.1 安装验证清单

必须检查：

- `setup` 是否创建 `~/.claude/skills/spec-first`
- `setup` 是否创建 `~/.codex/skills/spec-first`
- `setup` 是否创建 `~/.spec-first`
- `.agents/skills/spec-first` / `.agents/skills/spec-first-*` 是否正确落位
- `dev-setup` / `dev-teardown` 是否针对新目录工作

通过标准：

- 全新环境安装说明与实际落点一致

## 5.2 生成验证清单

必须检查：

- 根 `SKILL.md` 已重新生成
- 所有 skill 的 `SKILL.md` 已重新生成
- 生成物中不再残留未受控的 `gstack` 主路径引用
- `spec-first-upgrade` 或最终定版升级入口已进入生成链

通过标准：

- 生成链可重复执行，产物稳定

## 5.3 helper 与 runtime 验证清单

必须检查：

- `spec-first-config`
- `spec-first-update-check`
- `spec-first-review-log`
- `spec-first-review-read`
- `spec-first-slug`
- `spec-first-diff-scope`
- browse runtime 的 state / log / server 路径

通过标准：

- helper 和 runtime 对同一套新路径有一致理解

## 5.4 skill 主链验证清单

必须检查：

- `brainstorm` -> `design-consultation`
- `plan-*` -> `qa` / `qa-only`
- `review` / `codex` -> `ship`
- `design-review` / `canary` / `benchmark` -> `land-and-deploy`
- `setup` / 根 skill -> `spec-first-upgrade`

通过标准：

- 上游 skill 写出的产物能被下游 skill 在新路径中找到

## 5.5 报告目录验证清单

必须检查：

- `.spec-first/qa-reports`
- `.spec-first/design-reports`
- `.spec-first/canary-reports`
- `.spec-first/benchmark-reports`
- `.spec-first/deploy-reports`

通过标准：

- 本地报告目录命名统一，不再出现 `.gstack/*` 和 `.spec-first/*` 混用

## 5.6 项目级产物目录验证清单

必须检查：

- `~/.spec-first/projects/$SLUG/*-design-*.md`
- `~/.spec-first/projects/$SLUG/*-handoff-*.md`
- `~/.spec-first/projects/$SLUG/*-test-plan-*.md`
- `~/.spec-first/projects/$SLUG/*-test-outcome-*.md`
- `~/.spec-first/projects/$SLUG/*-design-audit-*.md`
- `~/.spec-first/projects/$SLUG/$BRANCH-reviews.jsonl`

通过标准：

- 项目级 handoff 目录全部统一到 `~/.spec-first/projects`

## 5.7 升级链验证清单

必须检查：

- 最终升级入口名
- `spec-first-update-check`
- `spec-first-config`
- `~/.spec-first/config.yaml`
- `~/.spec-first/last-update-check`
- `~/.spec-first/just-upgraded-from`

通过标准：

- 升级链完整闭环，不再处于半迁移状态

## 5.8 残留清零验证清单

必须检查：

- 是否仍在读取旧 `.gstack` 作为目标态运行路径
- 是否仍保留旧 `gstack-*` 作为正式命令入口
- 是否仍保留旧 `/gstack-upgrade` 作为正式 skill 入口

通过标准：

- 每一项旧入口都已明确退出目标态

## 6. 残留项分类规则

阶段 D 不能把所有残留 `gstack` 都当 bug。

应分成 3 类：

## A 类：必须清零

- 用户可见主路径
- 用户可见主命令
- 用户可见主入口
- 未受控写入旧状态目录的代码

## B 类：允许出现在迁移说明中

- 一次性迁移指引
- 旧目录来源说明
- 历史命名说明

## C 类：可以保留

- 不含品牌的 telemetry 事件名
- 对上游历史名的注释或迁移说明
- 现状分析中的代码事实引用

## 7. 定版输出

阶段 D 完成后，应形成下面 4 份输出：

1. 一份整体验证记录
2. 一份残留清零确认清单
3. 一份残留旧路径分类清单
4. 一份首个迁移版本发布口径

## 8. 完成定义

阶段 D 只有在下面全部成立时，才算完成：

1. 安装、生成、runtime、skill、测试、残留清零 6 个面都已验证
2. 所有主路径都已统一到 `spec-first`
3. 所有 cross-skill handoff 都已验证能在新路径闭环
4. 升级链已完成最终定版
5. 残留旧品牌项已被分类，不再存在未决的主路径漂移
6. 可以明确回答“现在是否能发布第一个迁移版本”

## 9. 与前序文档的关系

阶段 D 不是替代前面的执行包，而是收口它们。

对应关系如下：

- 阶段 B 文档负责“框架能不能迁”
- 阶段 C 文档负责“skill 能不能逐个迁完”
- 阶段 D 文档负责“整套系统能不能作为一个版本交付”
