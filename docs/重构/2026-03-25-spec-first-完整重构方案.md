# spec-first 完整重构方案

> 目标工程：`/Users/kuang/Desktop/ops/spec-first`
>
> 重构性质：`replacement`
>
> 约束前提：
> - 基于 spec-first 代码直接重构，脱离原开源版本
> - 不做 spec-first 用户项目向下兼容
> - 迁移系统重建，仅服务 `spec-first` 自身未来版本
> - 重构完成后持续补功能并开源

## 1. 冻结协议基线

- npm 包名：`@leokuang/spec-first`
- CLI 命令：`spec-first`
- 工作流根目录：`.spec-first/`
- slash namespace：`spec`
- skill 动作名：保持不变

对应公开命令：

- `/spec:start`
- `/spec:brainstorm`
- `/spec:check`
- `/spec:finish-work`

## 2. 核心目标

本次重构的目标不是“把 spec-first 改个名字”，而是把当前工程切换成一套新的、可长期稳定演进的 `spec-first` 公开协议。

交付结果必须满足：

- 新包分发入口是 `@leokuang/spec-first`
- 新 CLI 入口是 `spec-first`
- 新工作流根目录是 `.spec-first/`
- 各平台命令前缀统一收口到 `spec`
- 仓库自身 dogfooding 副本与模板源一致
- `update` / `migration` 仅围绕 `spec-first` 新协议工作

## 3. 非目标

本次明确不做：

- 不支持 spec-first 项目自动升级到 `spec-first`
- 不保留 `spec` 作为长期运行时 alias
- 不保留 `.spec-first/` 与 `.spec-first/` 双栈运行
- 不继续维护 spec-first 旧 migration manifests 的运行时兼容
- 不在本次重构中重做 `spec/tasks/workspace/scripts` 子结构语义

## 4. 架构决策

### ADR-1：这是 replacement，不是 fork 兼容演进

- spec-first 历史语义仅作为代码来源和设计参考
- `spec-first` 自己定义新的公开协议
- 对旧 spec-first 项目最多提供“识别 + 拒绝 + 手工迁移参考”，不进入主流程

### ADR-2：`.spec-first/` 是长期公开协议

- 把 `.spec-first/` 当 API 设计，而不是内部实现细节
- 未来 1.0 后不轻易改根目录名
- 本次只改根前缀，不改子结构语义：
  - `spec/`
  - `tasks/`
  - `workspace/`
  - `scripts/`

### ADR-3：模板目录做物理重命名

决策：

- `packages/cli/src/templates/spec` 物理重命名为 `packages/cli/src/templates/spec-first`

原因：

- 避免源码层继续保留旧产品语义
- 减少 import 与目录命名认知错位
- 便于后续维护者理解系统边界

### ADR-4：旧 `.spec-first/` 数据不做盲改

当前仓库的 `.spec-first/` 里混有三类内容：

- 运行时协议文件
- dogfooding 副本
- 历史任务、workspace journal、归档 spec 文档

决策：

- 不对现有 `.spec-first/**/*` 做全量字符串替换
- 运行时需要的协议文件，从模板源重新生成到 `.spec-first/`
- 历史性的 `.spec-first/` 数据迁入归档区，仅作参考，不参与新协议运行

建议归档位置：

- `docs/archive/spec-legacy/`

### ADR-5：迁移系统重建，但保留 legacy 资料

决策：

- 新运行时只加载 `spec-first` manifests
- spec-first 历史 manifests 移入 `legacy/`，不参与运行时

建议目录：

- `packages/cli/src/migrations/legacy/*`
- `packages/cli/src/migrations/manifests/*` 仅保留 `spec-first` 新版 manifests

### ADR-6：dogfooding 保留，但改成单一真源模式

决策：

- 保留仓库自身使用 `spec-first` 协议
- 模板源是单一真源
- 项目根 dogfooding 副本通过同步脚本生成
- 不再长期接受“模板源和根目录副本双手工维护”

## 5. 品牌与协议常量设计

新增统一品牌常量模块：

- `packages/cli/src/config/brand.ts`

建议内容：

```ts
export const BRAND = {
  productName: "spec-first",
  packageName: "@leokuang/spec-first",
  cliCommand: "spec-first",
  workflowRoot: ".spec-first",
  slashNamespace: "spec",
} as const;
```

要求：

- 所有品牌名、包名、CLI 名、目录根名、namespace 都从该模块读取
- 不再允许在业务代码里散落 `spec` / `.spec-first` / `/spec:` 字面量

## 6. 平台命名映射规则

这是本次重构必须补齐的显式规则。

### 支持子目录的平台

- Claude
- iFlow
- Gemini
- OpenCode
- CodeBuddy

规则：

- `commands/spec/` -> `commands/spec/`
- 用户入口从 `/spec:*` -> `/spec:*`

### 不支持子目录的平台

- Cursor

规则：

- `spec-start.md` -> `spec-start.md`
- `spec-check.md` -> `spec-check.md`
- 对应命令语义映射为平台支持的扁平命令格式

### workflow 型平台

- Kilo
- Antigravity

规则：

- workflow 文件名去掉 spec-first 前缀，改为 `spec-*` 或等价命名
- 文案统一使用 `/spec:*` 作为抽象命名空间说明

### Codex / Kiro / Qoder

规则：

- 保留 skill 动作名
- 所有技能描述、示例路径、workflow root 改为 `spec-first`
- hooks / config / agents 中所有 `.spec-first` 路径改为 `.spec-first`

## 7. 依赖图（DAG）

按执行依赖，模块顺序如下：

1. 模块 A：品牌与协议常量
2. 模块 B：CLI 与路径根切换
3. 模块 C：模板源物理重命名与核心模板改造
4. 模块 D：平台配置器与平台模板切换
5. 模块 E：项目内 dogfooding 副本重建
6. 模块 F：迁移系统重建
7. 模块 G：文档、品牌资产、marketplace
8. 模块 H：测试、扫描、CI 校验

依赖关系：

- A -> B
- A -> C
- B -> D
- C -> D
- C -> E
- B -> F
- D -> H
- E -> H
- F -> H
- G -> H

## 8. 模块级实施方案

### 模块 A：品牌与协议常量

目标：

- 建立单一真源，消灭散落硬编码

核心文件：

- `packages/cli/src/config/brand.ts`（新增）
- `packages/cli/src/constants/paths.ts`
- `packages/cli/src/constants/version.ts`
- `packages/cli/src/index.ts`
- `packages/cli/src/cli/index.ts`
- `package.json`
- `packages/cli/package.json`

完成标准：

- 源码中不再依赖硬编码的 `spec` 品牌常量
- 包名、CLI、workflow root、namespace 从统一常量读取

### 模块 B：CLI 与路径根切换

目标：

- 让 `spec-first init/update` 与 `.spec-first/` 成为新的运行时入口

核心文件：

- `packages/cli/src/commands/init.ts`
- `packages/cli/src/commands/update.ts`
- `packages/cli/src/utils/project-detector.ts`
- `packages/cli/src/utils/template-hash.ts`
- `packages/cli/src/utils/template-fetcher.ts`
- `packages/cli/src/configurators/workflow.ts`
- `packages/cli/src/configurators/index.ts`

关键动作：

- `DIR_NAMES.WORKFLOW` 切到 `.spec-first`
- 所有帮助文案改为 `spec-first`
- 检测到 `.spec-first/` 时，输出明确拒绝提示，而不是兼容运行

建议错误提示：

```txt
This project uses legacy spec-first protocol.
spec-first does not support in-place migration from spec-first.
Use a fresh spec-first project baseline or follow the manual migration guide.
```

### 模块 C：模板源物理重命名与核心模板改造

目标：

- 从“生成 spec-first 工程”切成“生成 spec-first 工程”

核心目录：

- `packages/cli/src/templates/spec-first/**/*`（由 `templates/spec` 重命名而来）

必须覆盖的文件范围：

- `config.yaml`
- `gitignore.txt`
- `workflow.md`
- `worktree.yaml`
- `tasks/.gitkeep`
- `scripts/*.py`
- `scripts/common/*.py`
- `scripts/multi_agent/*.py`
- `scripts/hooks/*.py`
- `scripts-shell-archive/**/*`
- `index.ts`

注意：

- 这里不能只改入口脚本，必须覆盖 `common/`、`multi_agent/`、`hooks/`
- 所有脚本中的路径、usage、注释、错误提示全部切换

### 模块 D：平台配置器与平台模板切换

目标：

- 11 个平台注册逻辑和模板生成规则全部切换到新协议

核心文件：

- `packages/cli/src/types/ai-tools.ts`
- `packages/cli/src/configurators/*.ts`
- `packages/cli/src/templates/claude/**/*`
- `packages/cli/src/templates/cursor/**/*`
- `packages/cli/src/templates/iflow/**/*`
- `packages/cli/src/templates/opencode/**/*`
- `packages/cli/src/templates/codex/**/*`
- `packages/cli/src/templates/kilo/**/*`
- `packages/cli/src/templates/kiro/**/*`
- `packages/cli/src/templates/gemini/**/*`
- `packages/cli/src/templates/antigravity/**/*`
- `packages/cli/src/templates/qoder/**/*`
- `packages/cli/src/templates/codebuddy/**/*`

必须新增：

- `scripts/validate-platforms.js` 或等价验证脚本

验证目标：

- 所有平台输出的新命名规则一致
- 不再生成 `commands/spec`、`spec-*`、`.spec-first/*`

### 模块 E：项目内 dogfooding 副本重建

目标：

- 仓库根目录自身切到 `spec-first`，但不污染历史资料

处理策略：

- 现有 `.spec-first/` 不做全量就地替换
- 从新模板源生成新的 `.spec-first/`
- 根目录下的平台副本同步切到新协议：
  - `.claude/**/*`
  - `.cursor/**/*`
  - `.opencode/**/*`
  - `.codex/**/*`
  - `AGENTS.md`

建议新增脚本：

- `pnpm run sync-dogfooding`

脚本职责：

- 将模板源同步到项目根 dogfooding 副本
- 避免继续手工双改

### 模块 F：迁移系统重建

目标：

- 建立 `spec-first` 自己的协议升级体系

核心文件：

- `packages/cli/src/migrations/index.ts`
- `packages/cli/src/types/migration.ts`
- `packages/cli/src/migrations/manifests/*`
- `packages/cli/src/migrations/legacy/*`（新增）

决策：

- 运行时仅消费新的 `manifests/*`
- spec-first 历史 manifests 迁移到 `legacy/`，只做参考

建议新增协议元信息文件：

- `.spec-first/protocol.json`

建议内容：

```json
{
  "version": "1.0.0-alpha.1",
  "product": "spec-first"
}
```

### 模块 G：文档、品牌资产、Marketplace

目标：

- 对外品牌统一成 `spec-first`

核心文件：

- `README.md`
- `README_CN.md`
- `CONTRIBUTING.md`
- `CONTRIBUTING_CN.md`
- `COPYRIGHT`
- `AGENTS.md`
- `marketplace/README.md`
- `marketplace/index.json`
- `marketplace/skills/**/*`
- `assets/*`
- `docs/**/*` 中所有对外说明性文档

要求：

- 旧品牌入口全部移除
- 旧品牌资料如有保留，需要明确放入 archive/legacy 语境
- `spec-meta` 若继续保留，应重命名为 `spec-first-meta`

### 模块 H：测试、扫描、CI 校验

目标：

- 保证不是“文案改名”，而是协议真正切完

核心文件：

- `packages/cli/test/**/*`
- `packages/cli/scripts/*`
- `.github/workflows/*.yml`

必须新增：

- 品牌残留扫描脚本
- 平台模板一致性校验脚本
- dogfooding 同步校验

建议校验维度：

- `spec-first`
- `spec`
- `.spec-first`
- `/spec:`
- `commands/spec`
- `@leokuang/spec-first`
- `leokuang/spec-first`

## 9. 旧 `.spec-first/` 数据处理方案

这是本次最容易出错的部分，必须单独明确。

### 要迁出的历史资料

- `.spec-first/tasks/**/*`
- `.spec-first/workspace/**/*`
- `.spec-first/spec/**/*`
- `.spec-first/.version`
- `.spec-first/.template-hashes.json`

### 处理策略

- 不直接修改这些历史内容
- 迁入归档目录，例如：
  - `docs/archive/spec-legacy/tasks/`
  - `docs/archive/spec-legacy/workspace/`
  - `docs/archive/spec-legacy/spec/`
- 新的 `.spec-first/` 仅承载新协议运行所需内容

### 原则

- 运行时资产与历史资产分离
- `spec-first` 只对自己的协议负责

## 10. 回滚策略

因为当前工程已删除 Git 历史，本次必须采用文件系统级回滚策略。

### 执行前

- 对当前工程做完整目录快照

建议：

```bash
cp -R /Users/kuang/Desktop/ops/spec-first /Users/kuang/Desktop/ops/spec-first.backup.$(date +%Y%m%d-%H%M%S)
```

### 阶段回滚

- 阶段 A/B 失败：回退到最近一次目录快照
- 阶段 C/D 失败：回退模板源和 dogfooding 副本
- 阶段 E/F 失败：删除新 `.spec-first/`，恢复快照
- 阶段 G/H 失败：保留代码回退，重做文档和测试同步

### 原则

- 每个阶段结束后做一次目录快照
- 不做跨阶段无边界大改

## 11. 工作量估算

以单人主导、串行执行估算：

- 阶段 1：品牌常量 + 路径根 + CLI 入口，`1-2 天`
- 阶段 2：模板源重命名与核心脚本切换，`2-3 天`
- 阶段 3：平台配置器与模板适配，`2-3 天`
- 阶段 4：dogfooding 重建 + 迁移系统重建，`1-2 天`
- 阶段 5：文档、资产、marketplace、测试、CI，`2-3 天`

总计：

- `8-13 天` 单人工作量

## 12. 推荐执行顺序

### 阶段 1：协议底座

- 模块 A
- 模块 B

产出：

- 品牌常量统一
- `.spec-first/` 路径根可运行
- `spec-first` CLI 可启动

### 阶段 2：模板源与平台出口

- 模块 C
- 模块 D

产出：

- 模板源改名完成
- 各平台生成物改名完成

### 阶段 3：仓库自身切换

- 模块 E
- 模块 F

产出：

- 项目根 dogfooding 使用新协议
- 新 migration 体系落地

### 阶段 4：品牌收口与质量封板

- 模块 G
- 模块 H

产出：

- 对外品牌统一
- 测试、扫描、CI 收口

## 13. 自动化工件清单

本次建议新增以下工件：

- `packages/cli/src/config/brand.ts`
- `packages/cli/scripts/validate-platforms.js`
- `packages/cli/scripts/scan-legacy-branding.sh`
- `packages/cli/scripts/sync-dogfooding.js`
- `scripts/create-snapshot.sh`
- `scripts/diff-snapshots.sh`
- `scripts/test-rollback.sh`
- `docs/重构/dependency-dag.md`
- `docs/重构/rollback.md`

## 14. 关键风险与缓解

### 风险 1：平台模板遗漏

风险等级：`高`

背景：

- 本次重构覆盖 10+ 平台模板和配置器
- 任一平台遗漏，都会导致生成物仍暴露旧协议

缓解措施：

- 新增 `packages/cli/scripts/validate-platforms.js`
- 校验项至少包括：
  - 是否仍输出 `.spec-first`
  - 是否仍输出 `/spec:*`
  - 是否仍输出 `commands/spec`
  - 是否仍输出 `spec-*` 风格命名
  - 各平台命名规则是否符合新映射
- CI 强制执行该脚本
- 保留人工复查平台矩阵：
  - Claude
  - Cursor
  - OpenCode
  - Codex
  - Gemini
  - Kilo
  - Kiro
  - iFlow
  - Qoder
  - CodeBuddy
  - Antigravity

原则：

- 自动化校验为主
- 人工复查只做最终抽样确认

### 风险 2：Python 脚本路径硬编码

风险等级：`中`

背景：

- Python 脚本是工作流协议的执行层
- 一旦在多个脚本里散落 `.spec-first` / `.spec-first` 字面量，后续维护会再次返工

缓解措施：

- 路径常量集中到：
  - `packages/cli/src/templates/spec-first/scripts/common/paths.py`
  - 项目内 dogfooding 对应副本的 `common/paths.py`
- 其他 Python 脚本统一通过公共模块读取：
  - workflow root
  - scripts path
  - workspace path
  - tasks path
- 禁止在其他脚本中直接写 `.spec-first` 或 `.spec-first`
- 在残留扫描中单独检查 Python 文件中的路径字面量

原则：

- 单一真源
- 其余脚本只消费常量，不重新定义

### 风险 3：测试快照过期

风险等级：`中`

背景：

- 本次重构会大面积改变命令、路径、品牌、模板输出
- 快照更新不代表行为正确，只代表断言基线被重写

缓解措施：

- 更新快照：

```bash
pnpm test -- -u
```

- 在无 Git 历史前提下，使用阶段快照做目录对比审查：

```bash
diff -ru /Users/kuang/Desktop/ops/spec-first.backup.post-<previous-stage>.<timestamp>/packages/cli/test /Users/kuang/Desktop/ops/spec-first/packages/cli/test
```

- 如果存在快照目录，重点审查：

```bash
diff -ru /Users/kuang/Desktop/ops/spec-first.backup.post-<previous-stage>.<timestamp>/packages/cli/test /Users/kuang/Desktop/ops/spec-first/packages/cli/test | rg "__snapshots__"
```

- 在 CI 中增加快照一致性检查，防止未更新快照混入

原则：

- 快照更新只是第一步
- 必须结合人工审查和行为测试一起完成

### 风险 4：回滚快照不可审计或不可恢复

风险等级：`中`

背景：

- 当前工程没有 `.git`
- 阶段回滚完全依赖目录快照
- 如果快照缺少元数据、差异审查和恢复验证，回滚本身会变成新的风险源

缓解措施：

- 统一使用 `scripts/create-snapshot.sh` 创建：
  - `pre-S1` / `post-S1`
  - `pre-S2` / `post-S2`
  - `pre-S3` / `post-S3`
  - `pre-S4` / `post-S4`
  - 必要时 `emergency-Sx`
- 每个快照写入 `.snapshot-meta.json`，至少记录：
  - `snapshotName`
  - `stage`
  - `type`
  - `createdAt`
  - `creator`
  - `repoMode`
  - `protocolBaseline`
  - `nodeVersion`
  - `pnpmVersion`
- 使用 `scripts/diff-snapshots.sh` 对比阶段前后快照：
  - 默认摘要对比
  - 排除 `node_modules`
  - 排除 `.snapshot-meta.json`
- 使用 `scripts/test-rollback.sh` 在临时目录验证：
  - 快照可复制
  - 依赖可安装
  - CLI 基础入口可启动
  - 必要的 lint / typecheck / smoke test 可通过

原则：

- 没有元数据的快照不视为有效回滚点
- 没做差异审查和恢复测试的快照不进入下一阶段

## 15. 完成判定

只有满足以下条件，才算本次重构完成：

- 包名、CLI、根目录、namespace 全部切换到冻结基线
- `templates/spec` 已物理重命名
- 所有平台模板不再生成旧命令和旧路径
- 项目根存在新的 `.spec-first/` dogfooding 副本
- spec-first 历史资料已迁入 archive/legacy
- migration 体系只服务 `spec-first`
- 全量测试通过
- 品牌残留扫描通过
- CI 校验通过

## 16. 一句话结论

本次重构应被当作一次“新公开协议发布”，而不是一次普通 rename。所有设计和执行都要围绕这条原则：`spec-first` 只为自己的长期稳定性负责，不为 spec-first 的历史兼容性背债。
