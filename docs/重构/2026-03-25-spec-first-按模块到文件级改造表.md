# spec-first Replacement 改造表

> 目标工程：`/Users/kuang/Desktop/ops/spec-first`
>
> 冻结命名基线：
> - npm 包名：`@leokuang/spec-first`
> - CLI 命令：`spec-first`
> - 工作流根目录：`.spec-first/`
> - slash namespace：`spec`
> - skill 动作名：保持不变
>
> 重构性质：`replacement`，不做 spec-first 向下兼容；迁移系统重建，仅服务后续 `spec-first` 版本演进。

## 使用说明

- 这份表按模块拆分，覆盖核心源码、模板源、项目内 dogfooding 副本、文档、测试、迁移系统。
- “必改文件”中：
  - 单个文件表示必须逐个修改。
  - 文件模式表示该目录下所有匹配文件都要扫描并处理。
- 本次重构建议只改“协议前缀和品牌”，不改 `spec/ tasks/ workspace/ scripts/` 这组子结构语义。

---

## 模块 1：产品身份与分发入口

### 目标

把产品对外身份从 spec-first 切到 `spec-first`，统一包名、CLI 名、版本说明、帮助文案来源。

### 必改文件

- `package.json`
- `packages/cli/package.json`
- `packages/cli/src/index.ts`
- `packages/cli/src/constants/version.ts`
- `packages/cli/src/cli/index.ts`
- `packages/cli/scripts/create-manifest.js`
- `packages/cli/.npmrc`

### 改造动作

- 根 `package.json`
  - 将 workspace script filter 从 `@leokuang/spec-first` 切到 `@leokuang/spec-first`
  - 检查 release/build/test/lint/typecheck 脚本是否引用旧包名
- `packages/cli/package.json`
  - `name` 改为 `@leokuang/spec-first`
  - `description` 改为 `spec-first` 品牌表述
  - `bin` 从 `spec` 切到 `spec-first`
  - 决定是否增加短别名；如果没有明确需求，本次不要新增
  - `keywords` 去掉 `spec`
  - `repository` 改为新仓库地址占位或二开仓库地址
- `packages/cli/src/index.ts`
  - 顶部注释与框架说明从 spec-first 改为 `spec-first`
- `packages/cli/src/constants/version.ts`
  - 保持实现结构不变，但后续所有包名提示以新 `PACKAGE_NAME` 为准
- `packages/cli/src/cli/index.ts`
  - 启动 banner、帮助提示、更新提示中的命令名和文案切到 `spec-first`
- `packages/cli/scripts/create-manifest.js`
  - 如果 manifest 中包含产品名、包名、模板根说明，统一替换
- `packages/cli/.npmrc`
  - 检查 publish scope、registry 相关配置是否仍指向旧组织逻辑

### 交付标准

- `npm install -g @leokuang/spec-first`
- CLI 执行入口为 `spec-first`
- 所有帮助文案不再要求用户执行 `spec ...`

---

## 模块 2：公开协议根与路径常量

### 目标

把运行时协议根从 `.spec-first/` 切到 `.spec-first/`，并集中管理，避免散落硬编码。

### 必改文件

- `packages/cli/src/constants/paths.ts`
- `packages/cli/src/configurators/index.ts`
- `packages/cli/src/configurators/workflow.ts`
- `packages/cli/src/utils/project-detector.ts`
- `packages/cli/src/utils/template-hash.ts`
- `packages/cli/src/utils/file-writer.ts`
- `packages/cli/src/utils/template-fetcher.ts`
- `packages/cli/src/commands/init.ts`
- `packages/cli/src/commands/update.ts`

### 改造动作

- `packages/cli/src/constants/paths.ts`
  - `DIR_NAMES.WORKFLOW` 从 `.spec-first` 改为 `.spec-first`
  - 保留 `workspace/tasks/spec/scripts` 子结构不变
  - 注释与 example 全部同步
- `packages/cli/src/configurators/index.ts`
  - `ALL_MANAGED_DIRS` 从包含 `.spec-first` 改为包含 `.spec-first`
  - 注释中的 managed root 示例同步
- `packages/cli/src/configurators/workflow.ts`
  - `createWorkflowStructure()` 的目录创建逻辑切到 `.spec-first`
  - 相关注释中的 `.spec-first/` 文案同步
- `packages/cli/src/utils/project-detector.ts`
  - 检测项目是否已初始化时，改为识别 `.spec-first/`
  - 如果当前实现显式寻找 `.spec-first/`，必须切到新协议
- `packages/cli/src/utils/template-hash.ts`
  - `.template-hashes.json`、路径登记、受保护路径判断改到 `.spec-first/`
- `packages/cli/src/utils/file-writer.ts`
  - 如果涉及受管理目录保护或特殊路径处理，需同步根目录名
- `packages/cli/src/utils/template-fetcher.ts`
  - 远程模板下载默认写入路径切到 `.spec-first/spec/`
- `packages/cli/src/commands/init.ts`
  - bootstrap 文案中的 `.spec-first/spec/`、命令示例、默认提示切到 `.spec-first/`
- `packages/cli/src/commands/update.ts`
  - 所有 “项目是否初始化”“根目录保护”“empty dir cleanup”“hash tracking”“version file” 逻辑切到 `.spec-first/`
  - 所有错误提示与帮助提示切到 `spec-first`

### 交付标准

- 所有核心路径均来自 `constants/paths.ts`
- 运行时只认 `.spec-first/`
- 仓库内部不存在影响运行的 `.spec-first/` 路径硬编码

---

## 模块 3：CLI 初始化与升级命令

### 目标

让 `spec-first init` 和 `spec-first update` 成为新产品的一致入口。

### 必改文件

- `packages/cli/src/commands/init.ts`
- `packages/cli/src/commands/update.ts`
- `packages/cli/src/cli/index.ts`
- `packages/cli/src/utils/compare-versions.ts`
- `packages/cli/src/utils/proxy.ts`

### 改造动作

- `packages/cli/src/commands/init.ts`
  - 欢迎语从 spec-first 改为 `spec-first`
  - 所有命令示例改为 `spec-first init ...`
  - bootstrap task / PRD 里的路径、slash command、品牌表述同步
  - 单仓/monorepo 相关 spec 路径文案改为 `.spec-first/spec/...`
- `packages/cli/src/commands/update.ts`
  - 所有 `spec update` 提示改为 `spec-first update`
  - 无版本、降级、迁移说明全部切换到新产品口径
  - 旧 spec-first migration 提示删除或重写，避免继续暗示向下兼容
  - `creator: "spec-update"` 改为新标识
- `packages/cli/src/cli/index.ts`
  - program name/help banner 切换
  - 更新检查提示中的安装命令改成 `npm install -g @leokuang/spec-first`
- `packages/cli/src/utils/compare-versions.ts`
  - 如果有版本前缀或文案假设，顺手校验
- `packages/cli/src/utils/proxy.ts`
  - 本模块一般不需要业务修改，但如帮助输出耦合产品文案需同步

### 交付标准

- `spec-first init` 可生成新协议工程
- `spec-first update` 只服务于新协议
- 帮助/错误/升级提示不再出现 `spec`

---

## 模块 4：工作流模板源（核心模板）

### 目标

把模板源从“生成 spec-first 工程”切到“生成 spec-first 工程”。

### 必改文件

- `packages/cli/src/templates/spec/index.ts`
- `packages/cli/src/templates/spec/config.yaml`
- `packages/cli/src/templates/spec/gitignore.txt`
- `packages/cli/src/templates/spec/workflow.md`
- `packages/cli/src/templates/spec/worktree.yaml`
- `packages/cli/src/templates/spec/scripts/__init__.py`
- `packages/cli/src/templates/spec/scripts/add_session.py`
- `packages/cli/src/templates/spec/scripts/create_bootstrap.py`
- `packages/cli/src/templates/spec/scripts/get_context.py`
- `packages/cli/src/templates/spec/scripts/get_developer.py`
- `packages/cli/src/templates/spec/scripts/init_developer.py`
- `packages/cli/src/templates/spec/scripts/task.py`
- `packages/cli/src/templates/spec/scripts-shell-archive/*`
- `packages/cli/src/templates/spec/tasks/.gitkeep`

### 改造动作

- `packages/cli/src/templates/spec/index.ts`
  - 模板注释与导出语义从 spec-first 改为 `spec-first`
  - 如有必要，目录名也可从 `templates/spec` 物理重命名为 `templates/spec-first`
  - 如果本次不物理改目录，至少要把对外语义全部切干净
- `config.yaml` / `workflow.md` / `worktree.yaml`
  - 路径根从 `.spec-first/` 切到 `.spec-first/`
  - 文案、示例命令、slash namespace 切到 `spec-first` / `/spec:*`
- `scripts/*.py`
  - 所有脚本中查找 `.spec-first`、`spec-first`、`spec`
  - Python help 文案、usage example、错误提示、路径查找、目录创建逻辑同步改为新协议
- `scripts-shell-archive/*`
  - 如果决定保留归档脚本，也要同步更名
  - 如果它们只属于 spec-first 历史遗留，可考虑在本次重构中删除整块归档目录

### 交付标准

- 模板生成的工作流目录为 `.spec-first/`
- Python 脚本全部基于新协议运行
- 不再生成任何 `.spec-first/*` 路径

---

## 模块 5：Markdown 模板与默认 spec 资产

### 目标

把默认说明文档与模板生成内容切到 `spec-first` 品牌，同时保持内部子结构语义不变。

### 必改文件

- `packages/cli/src/templates/markdown/index.ts`
- `packages/cli/src/templates/markdown/agents.md`
- `packages/cli/src/templates/markdown/gitignore.txt`
- `packages/cli/src/templates/markdown/workspace-index.md`
- `packages/cli/src/templates/markdown/worktree.yaml.txt`
- `packages/cli/src/templates/markdown/spec/**/*`

### 改造动作

- `agents.md`
  - `spec-first Instructions` 改为 `spec-first Instructions` 或新产品说明
  - `/spec:start` 改为 `/spec:start`
  - `@/.spec-first/` 改为 `@/.spec-first/`
- `markdown/spec/**/*`
  - 所有默认 spec 文案中的 spec-first 品牌名、路径示例、命令示例同步更改
  - 保留 `spec/ backend/ frontend/ guides/` 结构
- `workspace-index.md`
  - 根目录路径、初始化命令、上下文说明同步
- `gitignore.txt`
  - 忽略规则切到 `.spec-first/`、`.spec-first/workspace/` 等新路径

### 交付标准

- 用户初始化后看到的默认 spec 文档属于 `spec-first` 语义
- 默认 `AGENTS.md` 和工作流说明不再提 spec-first

---

## 模块 6：平台接入层与平台模板生成

### 目标

把所有 AI 平台生成物切到新的命令前缀和协议路径。

### 必改文件

- `packages/cli/src/configurators/claude.ts`
- `packages/cli/src/configurators/cursor.ts`
- `packages/cli/src/configurators/iflow.ts`
- `packages/cli/src/configurators/opencode.ts`
- `packages/cli/src/configurators/codex.ts`
- `packages/cli/src/configurators/kilo.ts`
- `packages/cli/src/configurators/kiro.ts`
- `packages/cli/src/configurators/gemini.ts`
- `packages/cli/src/configurators/antigravity.ts`
- `packages/cli/src/configurators/qoder.ts`
- `packages/cli/src/configurators/codebuddy.ts`
- `packages/cli/src/types/ai-tools.ts`
- `packages/cli/src/configurators/index.ts`

### 改造动作

- `types/ai-tools.ts`
  - 检查平台注册信息中的目录名、命令目录、描述文案是否存在旧值
- 各 `configurators/*.ts`
  - 写入目标路径时，把 `spec` 子目录、命令前缀、文案全部切到新协议
  - Cursor 这类不支持子目录的平台，要把 `spec-xxx` 改成新的前缀模式，例如 `spec-xxx`
  - Claude / Gemini / CodeBuddy / iFlow / OpenCode 等支持子目录的平台，把 `commands/spec/` 改成 `commands/spec/`
- `configurators/index.ts`
  - 所有 `collectTemplates()` 返回路径从 `.../spec/...` 改成 `.../spec/...`
  - 注释中的产品名、managed dir 名同步更改

### 平台模板文件模式

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

### 模板改造规则

- `/spec:*` 改为 `/spec:*`
- `commands/spec/` 改为 `commands/spec/`
- `spec-xxx.md` 改为新前缀形式
- `.spec-first/spec/...` 改为 `.spec-first/spec/...`
- `python3 ./.spec-first/scripts/...` 改为 `python3 ./.spec-first/scripts/...`
- `spec init/update` 改为 `spec-first init/update`
- 文案中的 “spec-first workflow” 改为 `spec-first`

### 交付标准

- 各平台生成物统一使用 `/spec:*`
- 所有模板内的脚本路径统一落在 `.spec-first/`
- 平台级模板目录命名规则清晰一致

---

## 模块 7：OpenCode / Claude / Codex 等项目内 dogfooding 副本

### 目标

项目仓库自身的运行副本与模板源保持一致，避免“模板改了，仓库自用版没改”。

### 必改文件

- `.claude/**/*`
- `.cursor/**/*`
- `.opencode/**/*`
- `.codex/**/*`
- `.spec-first/**/*`
- `AGENTS.md`

### 改造动作

- 项目内 `.spec-first/` 目录改为 `.spec-first/`
- `AGENTS.md`
  - `/spec:start` 改为 `/spec:start`
  - `@/.spec-first/` 改为 `@/.spec-first/`
  - `spec update` 改为 `spec-first update`
- `.claude/**/*`, `.opencode/**/*`, `.codex/**/*`, `.cursor/**/*`
  - 统一替换命令前缀和脚本路径
  - 检查 dogfooding 副本与 `packages/cli/src/templates/*` 是否一致

### 额外建议

- 本次重构后，建立一条规则：
  - 模板源是单一真源
  - 项目内 dogfooding 副本尽量由同步脚本生成
  - 避免继续手工双改

### 交付标准

- 项目自身使用的工作流副本就是 `spec-first` 协议
- dogfooding 不再依赖 spec-first 命名

---

## 模块 8：迁移系统重建

### 目标

从“维护 spec-first 历史升级”切换为“维护 spec-first 自身协议升级”。

### 必改文件

- `packages/cli/src/migrations/index.ts`
- `packages/cli/src/types/migration.ts`
- `packages/cli/src/migrations/manifests/*`
- `packages/cli/src/commands/update.ts`

### 改造动作

- `migrations/index.ts`
  - 重构为 `spec-first` 专用迁移入口
  - 去掉依赖 spec-first 历史版本语义的假设
- `types/migration.ts`
  - 保留通用类型，删除旧产品命名含义
- `manifests/*`
  - spec-first 历史 manifest 不再作为新产品发布基线
  - 方案二选一：
    - 直接清空重建，仅保留 `spec-first` 从 `0.5.0-alpha` 开始的 manifest
    - 迁移旧文件到 `legacy/`，新目录单独维护
- `commands/update.ts`
  - 只消费 `spec-first` 新迁移体系

### 交付标准

- `spec-first` 有自己的迁移基础设施
- 不再暗含“兼容 spec-first 历史项目”的职责

---

## 模块 9：Marketplace、开源资产与品牌内容

### 目标

把对外开源入口完全切成 `spec-first` 品牌。

### 必改文件

- `README.md`
- `README_CN.md`
- `CONTRIBUTING.md`
- `CONTRIBUTING_CN.md`
- `COPYRIGHT`
- `marketplace/README.md`
- `marketplace/index.json`
- `marketplace/skills/**/*`
- `assets/*`

### 改造动作

- README / README_CN
  - npm 安装命令改为 `@leokuang/spec-first`
  - CLI 示例改为 `spec-first`
  - 路径示例改为 `.spec-first/`
  - slash command 改为 `/spec:*`
  - 仓库地址、issues、docs、徽章地址切到新项目
  - 图片文件如 `assets/spec.png`、`assets/spec-demo.gif` 需要重命名或替换
- CONTRIBUTING / CONTRIBUTING_CN
  - 全部品牌名、仓库路径、目录结构同步
- `COPYRIGHT`
  - 产品名改为 `spec-first`
- `marketplace/index.json`
  - `spec-meta` 这类 ID、name、description、path、tag 需要重新定义
  - 如果保留 meta skill，建议命名成 `spec-first-meta`
- `marketplace/skills/**/*`
  - 所有 SKILL.md 中的品牌名、命令、路径、仓库地址同步切换
- `assets/*`
  - 替换或重命名含 spec-first 标识的图片资源

### 交付标准

- 对外文档、示例、品牌资产全部归一到 `spec-first`
- 新开源仓库看不到旧产品主叙事

---

## 模块 10：测试、快照与验证

### 目标

确保这次重构不是“看起来改完”，而是初始化、升级、模板输出都真正切到新协议。

### 必改文件

- `packages/cli/test/commands/init.integration.test.ts`
- `packages/cli/test/commands/update-internals.test.ts`
- `packages/cli/test/commands/update.integration.test.ts`
- `packages/cli/test/configurators/index.test.ts`
- `packages/cli/test/configurators/platforms.test.ts`
- `packages/cli/test/constants/paths.test.ts`
- `packages/cli/test/migrations/index.test.ts`
- `packages/cli/test/regression.test.ts`
- `packages/cli/test/templates/antigravity.test.ts`
- `packages/cli/test/templates/claude.test.ts`
- `packages/cli/test/templates/codebuddy.test.ts`
- `packages/cli/test/templates/codex.test.ts`
- `packages/cli/test/templates/cursor.test.ts`
- `packages/cli/test/templates/extract.test.ts`
- `packages/cli/test/templates/gemini.test.ts`
- `packages/cli/test/templates/iflow.test.ts`
- `packages/cli/test/templates/kilo.test.ts`
- `packages/cli/test/templates/kiro.test.ts`
- `packages/cli/test/templates/qoder.test.ts`
- `packages/cli/test/templates/spec.test.ts`
- `packages/cli/test/types/ai-tools.test.ts`
- `packages/cli/test/utils/file-writer.test.ts`
- `packages/cli/test/utils/project-detector.test.ts`
- `packages/cli/test/utils/template-fetcher.test.ts`
- `packages/cli/test/utils/template-hash.test.ts`

### 改造动作

- 所有测试中的：
  - `spec`
  - `spec-first`
  - `.spec-first`
  - `/spec:`
  - `commands/spec`
  都要替换为新协议
- 特别关注：
  - 临时目录名前缀
  - 期望生成的路径
  - 期望命令名
  - 期望模板目录结构
  - migration manifest 断言
- `packages/cli/test/templates/spec.test.ts`
  - 建议重命名为 `spec-first.test.ts`，或保留文件名但把断言语义全部改掉

### 验证命令

- `pnpm --filter @leokuang/spec-first test`
- `pnpm --filter @leokuang/spec-first lint`
- `pnpm --filter @leokuang/spec-first typecheck`

### 交付标准

- init / update / template / constants / migration / configurator 测试全部通过
- 测试断言不再绑定 spec-first 旧协议

---

## 模块 11：脚本与发布辅助工具

### 目标

确保内部脚本和发布流程不会继续输出旧品牌或旧路径。

### 必改文件

- `packages/cli/scripts/copy-templates.js`
- `packages/cli/scripts/create-manifest.js`
- `packages/cli/scripts/migrate-features-to-tasks.sh`
- `.github/workflows/ci.yml`
- `.github/workflows/publish.yml`
- `.husky/pre-commit`
- `.lintstagedrc`
- `pnpm-workspace.yaml`
- `pyrightconfig.json`
- `packages/cli/eslint.config.js`
- `packages/cli/tsconfig.json`
- `packages/cli/vitest.config.ts`

### 改造动作

- 发布 workflow 中的包名、publish path、tag 文案、仓库引用改成新产品
- `create-manifest.js`、`copy-templates.js` 校验模板目录名是否仍写死 `spec`
- `migrate-features-to-tasks.sh`
  - 如果脚本本身服务于旧工程历史，可视情况标为“删除候选”
- 其余工具配置主要做引用校验，确认不会继续指向旧包名

### 交付标准

- CI / publish 跑的是 `@leokuang/spec-first`
- 模板打包/发布辅助脚本不再依赖 spec-first 目录名

---

## 模块 12：残留扫描与最终清场

### 目标

把影响运行、生成、文档认知的 spec-first 残留清理干净。

### 必扫范围

- `packages/cli/src/**/*`
- `packages/cli/test/**/*`
- `packages/cli/scripts/**/*`
- `.spec-first/**/*` 或项目内工作流副本目录
- `.claude/**/*`
- `.cursor/**/*`
- `.opencode/**/*`
- `.codex/**/*`
- `README*`
- `CONTRIBUTING*`
- `marketplace/**/*`
- `AGENTS.md`

### 必扫关键字

- `spec-first`
- `spec`
- `.spec-first`
- `/spec:`
- `commands/spec`
- `spec-`
- `@leokuang/spec-first`
- `leokuang/spec-first`
- `docs.trytrellis.app`

### 允许保留的内容

- 历史分析文档中明确标记为“旧项目考古资料”的内容
- 不参与运行、不参与分发的归档材料

### 不允许保留的内容

- 会进入模板生成物的旧协议引用
- 会进入 README/帮助文案/错误信息的旧品牌
- 会影响 init/update 判定的旧路径

---

## 推荐执行顺序

1. 先改 `packages/cli/src/constants/*` 和 `commands/*`
2. 再改 `packages/cli/src/templates/spec/*` 与 `configurators/*`
3. 再同步项目内 dogfooding 副本
4. 再重建 migration framework
5. 最后统一文档、资产、测试、残留扫描

## 完成判定

满足以下条件，才算本次重构完成：

- 新包名、CLI、工作流根目录、slash namespace 全部切换到冻结基线
- 新项目初始化只生成 `.spec-first/`
- 所有平台模板命令前缀统一为 `/spec:*`
- `spec-first update` 与新 migration framework 已打通
- 项目内 dogfooding 副本已同步到新协议
- 主要测试通过，关键残留扫描通过
