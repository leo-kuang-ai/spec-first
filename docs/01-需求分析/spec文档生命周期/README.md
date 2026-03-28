# `.spec-first/spec/` 全生命周期分析

本文档分析的是 `.spec-first/spec/` 这组文档在 spec-first 体系里的完整生命周期：

1. 初始化时如何生成
2. 初次接入后如何补齐
3. 日常开发时如何被读取和消费
4. 何时、由谁、以什么机制更新
5. 框架升级时为什么不会被覆盖
6. 长期维护时有哪些边界和风险

分析基于当前仓库实现，而不是理想化流程。重点代码来源包括：

- `packages/cli/src/commands/init.ts`
- `packages/cli/src/configurators/workflow.ts`
- `packages/cli/src/commands/update.ts`
- `.spec-first/scripts/common/task_context.py`
- `.spec-first/scripts/common/packages_context.py`
- `.spec-first/scripts/common/config.py`
- `packages/cli/src/templates/claude/commands/spec/start.md`
- `packages/cli/src/templates/claude/commands/spec/update-spec.md`

---

## 1. 先给结论

`.spec-first/spec/` 在当前体系里不是“自动维护的数据库”，而是一个被多条流程共同驱动的长期知识层：

- 初始化阶段：由 `spec-first init` 写入骨架或远程模板
- 首次接入阶段：由 bootstrap 任务驱动团队补齐内容
- 日常使用阶段：被 `/spec:start`、`get_context --mode packages`、`task init-context`、各平台命令/skill 当作输入读取
- 任务执行阶段：主要通过 `implement.jsonl` 注入 `workflow.md` 和默认 spec index；`check.jsonl` / `debug.jsonl` 默认注入的是检查类命令/skill，上下文可再按任务显式扩展
- 显式更新阶段：通过 `/spec:update-spec` 或人工编辑回写新知识
- 框架升级阶段：被 `spec-first update` 视为受保护的用户内容，不会覆盖
- 长期维护阶段：依赖 index、package 作用域、文档裁剪和示例同步来避免腐化

一句话概括：

```text
spec/ 不是自动生成一次就结束
也不是每次 /spec:start 自动更新
而是 “初始化生成骨架 + 人工/AI 显式补齐 + 运行时被读取 + 后续显式回写”
```

---

## 2. `.spec-first/spec/` 到底是什么

从当前代码和模板设计看，`spec/` 承担的是“项目长期知识层”，但内部又分成两类文档：

1. code-spec
2. guides

它们的职责不同。

### 2.1 code-spec

典型位置：

- `backend/*.md`
- `frontend/*.md`
- monorepo 下是 `spec/<package>/backend/*.md`、`spec/<package>/frontend/*.md`

它关注的是“怎么安全实现”：

- 目录结构
- 类型约束
- 错误处理
- 状态管理
- 可执行契约
- 反模式

### 2.2 guides

典型位置：

- `guides/index.md`
- `guides/cross-layer-thinking-guide.md`
- `guides/code-reuse-thinking-guide.md`

它关注的是“写代码前该想到什么”，而不是直接规定某层代码怎么写。

### 2.3 默认模板目录模型

单仓库模式：

```text
.spec-first/spec/
├─ backend/
│  ├─ index.md
│  └─ *.md
├─ frontend/
│  ├─ index.md
│  └─ *.md
└─ guides/
   ├─ index.md
   └─ *.md
```

monorepo 模式：

```text
.spec-first/spec/
├─ guides/
│  ├─ index.md
│  └─ *.md
├─ <package-a>/
│  ├─ backend/
│  └─ frontend/
└─ <package-b>/
   ├─ backend/
   └─ frontend/
```

上面说的是 `spec-first init` 默认生成的骨架结构，不代表运行时只能识别这几类目录。

当前运行时代码真正固定的只有两件事：

- `guides/` 是保留目录
- 除 `guides/` 之外的其它子目录都会被当作可发现的 spec layer

其中：

- `guides/` 是共享层
- `spec/<package>/...` 是 package 专属层
- package 名来自 `config.yaml` 的 `packages`

---

## 3. 初始化生命周期

初始化阶段的核心问题是：`spec/` 第一次是怎么出现的？

答案分两种：

1. 使用本地空模板初始化
2. 使用远程模板初始化

### 3.1 本地空模板初始化

当前主链路在 `packages/cli/src/commands/init.ts` 和 `packages/cli/src/configurators/workflow.ts`。

流程如下：

```text
spec-first init
   │
   ├─ 解析 developer / projectType / monorepo / template 来源
   ├─ createWorkflowStructure(...)
   │   ├─ 建 .spec-first/
   │   ├─ 拷贝 scripts/
   │   ├─ 写 workflow.md / config.yaml / .gitignore
   │   ├─ 写 workspace/index.md
   │   ├─ 建 tasks/
   │   ├─ 写 worktree.yaml
   │   └─ createSpecTemplates(...)
   │       ├─ 建 spec/
   │       ├─ 写 guides/
   │       ├─ 写 backend/ 或 frontend/
   │       └─ monorepo 时写 spec/<package>/
   └─ （可选）初始化 developer + bootstrap
```

`createSpecTemplates()` 的行为很明确：

- 总会创建 `spec/guides/`
- 单仓库时，根据 `projectType` 写 backend/frontend 模板
- monorepo 时，为每个 package 写 `spec/<name>/...`

### 3.2 远程模板初始化

如果用户选择远程模板，`init.ts` 会先下载模板内容，然后再决定哪些本地空模板要跳过。

对应逻辑分两种：

- 单仓库：`skipSpecTemplates: useRemoteTemplate`
- monorepo：`remoteSpecPackages` 记录哪些 package 已经使用远程模板

效果也要分开看：

```text
单仓库远程模板
   │
   ├─ 先下载远程 spec 内容
   ├─ createWorkflowStructure(...)
   │   ├─ 仍会建 .spec-first 其它骨架
   │   └─ 跳过本地 spec 骨架创建
   └─ 避免“下载好的 spec 又被空模板覆盖”

monorepo 远程模板
   │
   ├─ 先为部分 package 下载远程 spec 内容
   ├─ createWorkflowStructure(...)
   │   ├─ 仍会建 .spec-first 其它骨架
   │   ├─ `guides/` 仍会创建
   │   └─ 仅对已远程下载的 package 跳过本地空模板
   └─ 未使用远程模板的 package 仍写本地空模板
```

所以“`guides/` 一定会创建”只在本地模板模式和 monorepo 远程模板模式下成立；单仓库远程模板模式下，`createSpecTemplates()` 会被整体跳过。

#### 3.2.1 默认远程地址在哪里

当前默认远程模板市场定义在 [template-fetcher.ts](/Users/kuang/xiaobu/spec-first/packages/cli/src/utils/template-fetcher.ts)：

- `TEMPLATE_INDEX_URL`
  - `https://raw.githubusercontent.com/leokuang/spec-first/main/marketplace/index.json`
- `TEMPLATE_REPO`
  - `gh:leokuang/spec-first`

这表示默认远程模板市场，实际上就是 `leokuang/spec-first` 仓库里的 `marketplace/` 目录。

#### 3.2.2 默认远程模板是怎么维护的

当前仓库里，远程模板市场本体就在：

- [marketplace/index.json](/Users/kuang/xiaobu/spec-first/marketplace/index.json)
- [marketplace/specs](/Users/kuang/xiaobu/spec-first/marketplace/specs)

例如当前可见的 spec 模板包括：

- [marketplace/specs/electron-fullstack](/Users/kuang/xiaobu/spec-first/marketplace/specs/electron-fullstack/README.md)
- [marketplace/specs/nextjs-fullstack](/Users/kuang/xiaobu/spec-first/marketplace/specs/nextjs-fullstack/README.md)
- [marketplace/specs/cf-workers-fullstack](/Users/kuang/xiaobu/spec-first/marketplace/specs/cf-workers-fullstack/README.md)

维护方式是：

```text
维护 marketplace/specs/<template-id>/
   │
   ├─ 更新模板目录内容
   ├─ 更新 marketplace/index.json 中的元数据
   │   ├─ id
   │   ├─ type
   │   ├─ name
   │   ├─ description
   │   ├─ path
   │   └─ tags
   └─ 之后远程初始化才能发现并下载它
```

也就是说，远程模板并不是存放在一个独立服务里，而是以“仓库目录 + index.json”的形式维护。

更准确地说，它的维护模型是：

```text
Git 仓库 = 模板市场
   │
   ├─ marketplace/index.json      # 模板索引
   ├─ marketplace/specs/*         # spec 模板目录
   └─ marketplace/skills/*        # skill 模板目录
```

CLI 的消费流程是：

```text
spec-first init
   │
   ├─ 请求 raw marketplace/index.json
   ├─ 根据 template id 找到 path
   ├─ 用 giget 下载 path 对应目录
   └─ 安装到目标项目目录
```

所以远程模板的“发布”动作，本质上就是：

```text
修改 marketplace/specs/<template-id>/
   ├─ 修改模板目录内容
   ├─ 修改 marketplace/index.json
   ├─ git commit
   └─ git push main
        │
        └─ raw.githubusercontent.com 上的新内容即可被 CLI 拉到
```

这意味着它不是：

- 独立模板服务
- 数据库驱动
- 单独发布后台

而是标准的“仓库内容即发布内容”模型。

#### 3.2.3 自定义远程地址怎么工作

除了默认市场，`spec-first init` 还支持：

- `--registry <source>`
- `--template <id>`

`--registry` 会先被 `parseRegistrySource()` 解析。支持的形式包括：

- `gh:myorg/myrepo/specs`
- `gitlab:myorg/myrepo/specs`
- `bitbucket:myorg/myrepo/specs`
- `https://github.com/user/repo/tree/main/specs`

工作流程如下：

```text
spec-first init --registry <source>
   │
   ├─ parseRegistrySource(...)
   ├─ 计算 rawBaseUrl
   ├─ 探测 <rawBaseUrl>/index.json
   │
   ├─ 如果 index.json 存在
   │   └─ 走 marketplace 模式
   │       ├─ 读取模板列表
   │       └─ 按 template id 下载
   │
   └─ 如果 index.json 不存在
       └─ 走 direct download 模式
           └─ 直接把 registry 指向的目录下载到 .spec-first/spec/
```

所以从维护角度看，有两种远程维护方式：

1. marketplace 模式
   - 维护 `index.json`
   - 维护多个模板目录
2. direct directory 模式
   - 不维护 `index.json`
   - 直接把某个仓库目录当作 spec 模板源

这也是为什么远程模板初始化并不是“固定绑死一个地址”，而是“默认有官方市场，同时支持用户自定义 registry”。

### 3.3 本地模板源文件放在哪里

当不是远程模板，而是走本地空模板初始化时，`workflow.ts` 并不是把 markdown 内容硬编码在函数里，而是从 CLI 自己的模板目录读取。

当前链路是：

```text
packages/cli/src/templates/markdown/spec/**/*.md.txt
   │
   └─ packages/cli/src/templates/markdown/index.ts
       ├─ 读取 backend/*.md.txt
       ├─ 读取 frontend/*.md.txt
       └─ 读取 guides/*.md.txt
            │
            ▼
packages/cli/src/configurators/workflow.ts
   ├─ writeBackendDocs(...)
   ├─ writeFrontendDocs(...)
   └─ createSpecTemplates(...)
            │
            ▼
目标项目的 .spec-first/spec/...
```

模板源目录实际在这里：

- [packages/cli/src/templates/markdown/spec/backend](/Users/kuang/xiaobu/spec-first/packages/cli/src/templates/markdown/spec/backend)
- [packages/cli/src/templates/markdown/spec/frontend](/Users/kuang/xiaobu/spec-first/packages/cli/src/templates/markdown/spec/frontend)
- [packages/cli/src/templates/markdown/spec/guides](/Users/kuang/xiaobu/spec-first/packages/cli/src/templates/markdown/spec/guides)

它们以 `*.md.txt` 的形式存在，再由 [index.ts](/Users/kuang/xiaobu/spec-first/packages/cli/src/templates/markdown/index.ts) 读成字符串常量。

对应关系可以理解成：

- backend 模板源 -> `packages/cli/src/templates/markdown/spec/backend/*.md.txt`
- frontend 模板源 -> `packages/cli/src/templates/markdown/spec/frontend/*.md.txt`
- guides 模板源 -> `packages/cli/src/templates/markdown/spec/guides/*.md.txt`
- 最终落盘 -> `.spec-first/spec/...`

这里有一个非常重要的边界：

- 改 `.spec-first/spec/...`，影响的是“当前项目实例”
- 改 `packages/cli/src/templates/markdown/spec/...`，影响的是“以后执行 spec-first init 时生成出来的模板”

对于 spec-first 仓库自己来说，这两者不是同一层。

### 3.4 初始化产物不是“已可用规范”

这是一个很容易误解的地方。

初始化阶段生成的 `spec/`，多数情况下只是：

- 模板骨架
- 目录占位
- 通用指导文本

它不是项目真实规范。真实规范要靠下一阶段补齐。

---

## 4. 初次接入后的 bootstrap 生命周期

初始化之后，spec-first 不会神奇地知道你的项目约定，所以它会尝试创建 bootstrap 任务来驱动“补规范”。

### 4.1 bootstrap 是什么

当前实现里，`init.ts` 在成功识别开发者身份后会调用 `createBootstrapTask()`，创建固定任务：

- `00-bootstrap-guidelines`

它会：

- 写 `task.json`
- 写 `prd.md`
- 写 `.current-task`

示意图：

```text
spec-first init
   │
   ├─ 如果识别到 developerName
   │   ├─ init_developer.py
   │   └─ createBootstrapTask(...)
   │       ├─ .spec-first/tasks/00-bootstrap-guidelines/task.json
   │       ├─ .spec-first/tasks/00-bootstrap-guidelines/prd.md
   │       └─ .spec-first/.current-task
   │
   └─ 如果没识别到 developerName
       └─ spec/ 骨架会存在，但 bootstrap 任务可能不存在
```

### 4.2 bootstrap 是如何触发的

bootstrap 任务的触发点不在 `/spec:start`，而在 `spec-first init`。

这里最容易混淆的是三件事：

- `spec-first init`：负责创建 bootstrap
- `/spec:start`：负责读取当前任务并进入它
- `00-bootstrap-guidelines/prd.md`：负责说明“你接下来要补什么”

如果把它们混在一起，就会误以为“执行 `/spec:start` 才触发 bootstrap”，但这和当前实现不一致。

当前 `init.ts` 的真实触发条件是：

1. 先完成工作流骨架创建
2. 尝试解析 `developerName`
3. 如果解析成功，执行 `init_developer.py`
4. 紧接着调用 `createBootstrapTask(...)`

`developerName` 的解析顺序是：

1. CLI `-u/--user`
2. 项目级 `.spec-first/.developer`
3. 全局 `~/.spec-first/.developer`
4. `git config user.name`
5. 若不是 `--yes` 模式，还会进入交互提问

因此 bootstrap 的触发逻辑可以压缩成：

```text
spec-first init
   │
   ├─ createWorkflowStructure(...)
   │
   ├─ resolve developerName
   │   ├─ --user
   │   ├─ .spec-first/.developer
   │   ├─ ~/.spec-first/.developer
   │   ├─ git config user.name
   │   └─ 交互输入（仅非 --yes）
   │
   ├─ developerName 存在？
   │   │
   │   ├─ 是
   │   │   ├─ init_developer.py
   │   │   └─ createBootstrapTask(...)
   │   │       ├─ 写 00-bootstrap-guidelines/task.json
   │   │       ├─ 写 00-bootstrap-guidelines/prd.md
   │   │       └─ 写 .current-task
   │   │
   │   └─ 否
   │       └─ 不创建 bootstrap，只保留 spec/ 骨架
   │
   └─ 后续 /spec:start 只是读取并进入这个任务
```

也可以换一个更直观的时序图来理解：

```text
第一次接入项目
   │
   ├─ 运行 spec-first init
   │   │
   │   ├─ 建 .spec-first/ 基础目录
   │   ├─ 建 .spec-first/spec/ 模板骨架
   │   ├─ 解析 developerName
   │   └─ 如果 developerName 存在
   │       └─ 创建 00-bootstrap-guidelines
   │
   ├─ 运行 /spec:start
   │   │
   │   └─ 读取 .current-task
   │       └─ 发现当前任务是 00-bootstrap-guidelines
   │
   └─ 打开 bootstrap 的 prd.md
       └─ 按任务要求分析代码并补写 .spec-first/spec/
```

这意味着：

- bootstrap 是 `init` 期间的“初始化副作用”
- `/spec:start` 不负责创建 bootstrap
- `/spec:start` 只会在 bootstrap 已存在时读取到它，并引导后续工作
- `prd.md` 负责解释“bootstrap 真正要求你做什么”，但它不是触发器

最容易漏掉的一种情况是：

- 使用 `--yes`
- 没传 `-u`
- 项目和全局都没有 `.developer`
- Git 也取不到用户名

这时会出现：

- `.spec-first/spec/` 已创建
- `.spec-first/tasks/00-bootstrap-guidelines/` 不一定存在
- 团队需要后续手动初始化 developer 并补做 bootstrap 或直接手工补规范

### 4.3 bootstrap 真正要求你做什么

bootstrap 任务不是开发业务，而是要求你：

1. 看现有代码
2. 看已有规则文件，例如 `AGENTS.md`、`CLAUDE.md`、`.cursorrules`
3. 把真实做法回填到 `.spec-first/spec/`
4. 给出 2 到 3 个真实例子
5. 写清反模式和边界

所以 bootstrap 阶段的本质是：

```text
空模板
  -> 真实代码分析
  -> 文档补齐
  -> 项目知识层可用
```

换句话说，触发链和执行链是两回事：

```text
触发链:
spec-first init
  -> 创建 bootstrap 任务

执行链:
/spec:start
  -> 读取 bootstrap 任务
  -> 你/AI 按 prd.md 补写 spec
```

### 4.4 bootstrap 完成后的状态变化

这里真正的分界线不是“bootstrap 任务是否已经归档完成”，而是“`spec/` 里的内容是否已经被补齐成真实规范”。

因为真实内容也可能来自：

- 远程模板初始化
- 团队人工先写好的 `spec/`
- AI 在 bootstrap 之外按显式指令补写的规范

在规范尚未补齐前：

- `/spec:start` 只能读到空模板或通用文本
- AI 拿到的只是“框架推荐”，不是项目事实

在规范已经补齐后：

- `/spec:start` 能读取真实索引
- `task init-context` 能把真实的 backend/frontend index 加入上下文
- 后续任务里的 `add-context` 有内容可选

---

## 5. 使用生命周期：`spec/` 什么时候被读取

这个阶段不是“更新文档”，而是“消费文档”。

### 5.1 `/spec:start` 读取但不更新

当前 `packages/cli/src/templates/claude/commands/spec/start.md` 明确写的是读取流程：

- `cat .spec-first/workflow.md`
- `python3 ./.spec-first/scripts/get_context.py`
- `python3 ./.spec-first/scripts/get_context.py --mode packages`
- `cat .spec-first/spec/<package>/<layer>/index.md`
- `cat .spec-first/spec/guides/index.md`

因此：

- `/spec:start` 会读 `spec/`
- `/spec:start` 不会自动写 `spec/`

对应关系：

```text
/spec:start
   │
   ├─ 读 workflow.md
   ├─ 读 get_context
   ├─ 读 packages mode
   ├─ 读 spec index
   └─ 向用户报告“现在有哪些规范可用”
```

### 5.2 `get_context --mode packages` 负责发现 spec 层

`.spec-first/scripts/common/packages_context.py` 的行为要按单仓库和 monorepo 分开看：

- 单仓库：扫描 `spec/` 下除 `guides/` 外的所有子目录，并输出 `Spec layers: ...`
- monorepo：扫描 `spec/<package>/` 下除 `guides/` 外的所有子目录，并输出每个 package 的 layer 和对应 `index.md`
- monorepo：如果存在 `spec/guides/index.md`，会额外显示 shared guides 路径

如果配置了 `session.spec_scope`，它会影响 monorepo 输出里的作用域标注：

- 命中的 package 正常显示
- 未命中的 package 会被标成 `(out of scope)`

它不是强制过滤器；当前 `--mode packages` 主要负责发现和标注，不负责阻止后续读取。

### 5.3 `task init-context` 把 spec 纳入任务上下文

真正把 `spec/` 和具体任务绑定起来的，不是 `/spec:start`，而是 `task init-context`。

`task_context.py` 的默认行为是：

- `implement.jsonl` 一定包含 `.spec-first/workflow.md`
- `backend` / `test` 再加 `spec[/<package>]/backend/index.md`
- `frontend` 再加 `spec[/<package>]/frontend/index.md`
- `fullstack` 同时加前后端 index
- `check.jsonl` 加当前平台的 `finish-work` 和 `check`
- `debug.jsonl` 加当前平台的 `check`

换句话说，默认会直接注入 spec index 的只有 `implement.jsonl`；`check.jsonl` / `debug.jsonl` 默认注入的是检查规范命令或 skill 文件，而不是 `spec/` 文档本身。

流程图：

```text
task.py init-context <dir> <dev_type>
   │
   ├─ 解析 package
   │   ├─ --package
   │   ├─ task.json.package
   │   └─ default_package
   │
   ├─ 写 implement.jsonl
   │   └─ workflow.md + spec index
   │
   ├─ 写 check.jsonl
   │   └─ finish-work + check
   │
   └─ 写 debug.jsonl
       └─ check
```

### 5.4 `task add-context` 让 spec 从“默认最小集”扩展到“任务所需全集”

`task init-context` 只加最小集。

更细的 spec 文件，例如：

- `backend/error-handling.md`
- `frontend/state-management.md`
- 某个 package 下的专用文档

需要在研究代码后显式执行：

```bash
python3 ./.spec-first/scripts/task.py add-context <dir> implement <spec-path> "<reason>"
python3 ./.spec-first/scripts/task.py add-context <dir> check <spec-path> "<reason>"
```

也就是说，`spec/` 在运行时的消费模型是：

```text
spec/ 全量知识库
   │
   ├─ 默认最小注入：index.md
   └─ 任务特定扩展：add-context 手工补充
```

### 5.5 `.current-task` 和 hooks 的角色

当前项目里的 `.spec-first/hooks/task-context.sh` 与 `current-task-common.sh` 主要做的是：

- 找当前任务
- 读 `task.json`
- 汇总 `implement.jsonl / check.jsonl / debug.jsonl` 是否存在
- 输出上下文刷新摘要

它们并不直接编辑 `spec/`，也不负责“生成规范”。它们只是让运行时知道当前任务绑定了哪些上下文文件。

### 5.6 `index.md` 在什么场景下会被读

`index.md` 不是自动全量注入，而是被“入口命令”作为导航页读取。

当前最明确的读取场景有两个：

| 场景 | 谁读 | 为什么读 |
|---|---|---|
| 写代码前 | `/spec:before-dev` | 先看 `Pre-Development Checklist`，再决定要读哪些具体规范 |
| 写代码后 / 提交前 | `/spec:check` | 先看 `Quality Check`，再决定要检查哪些具体规范 |

这两个命令都会先发现相关 package / spec 层，再读取 `spec/<package>/<layer>/index.md`，随后按 index 里的清单去读细则文件。

对应关系可以理解为：

```text
before-dev / check
   │
   ├─ 读 index.md
   ├─ 读 index.md 中列出的具体规范
   └─ 读 guides/index.md
```

因此：

- `index.md` 是导航页，不是最终规范正文
- `before-dev` 负责“开发前注入”
- `check` 负责“开发后校验”
- 其他分析型文档放进 `spec/`，只有在 index 或任务清单显式引用时才会被读
- 如果新增的是可自动消费的模板层，`index.md` 应当同步维护
- 如果只是新增纯阅读型分析文档，可以不改 `index.md`，但它不会自动进入上下文

---

## 6. 更新生命周期：`spec/` 什么时候被改写

`spec/` 的更新在当前体系里是显式动作，不是后台自动任务。

### 6.1 主要更新入口：`/spec:update-spec`

`packages/cli/src/templates/claude/commands/spec/update-spec.md` 定义了更新流程。

它强调几件事：

- 不是只有出 bug 才更新
- 实现新功能、做设计决策、发现新模式、形成新约定时都应该更新
- infra / 跨层变更需要更深的 code-spec
- `guides` 和 `backend/frontend` 文档职责不同，不能混写

因此，更新链路是：

```text
开发 / 调试 / 讨论中学到新东西
   │
   ├─ 判断属于 code-spec 还是 guide
   ├─ 读目标 spec
   ├─ 改正文档
   ├─ 必要时更新 index.md
   └─ 让后续任务能消费这份新知识
```

### 6.2 `finish-work` 只提醒，不代写

从模板设计上，`finish-work` 的职责是提醒你检查：

- backend/frontend/guides 是否需要更新

但它不是自动回写器。真正写内容仍然靠：

- `/spec:update-spec`
- 人工编辑
- 或 AI 按显式指令改对应 markdown 文件

### 6.3 更新的粒度

根据当前模板设计，更新最好按下面粒度进行：

- 小约定：补某个现有文档的一节
- 新模式：补某个现有文档的一段 + 例子
- 新主题：新增文档 + 更新对应 `index.md`
- 新思考清单：写入 `guides/*.md`

最不推荐的是：

- 把所有新知识塞进一个大杂烩文档
- 只改正文档，不更新 `index.md`
- 把可执行契约写进 `guides/`

---

## 7. 框架升级生命周期：为什么 `spec-first update` 不会覆盖 `spec/`

这是生命周期里最关键的保护边界之一。

`packages/cli/src/commands/update.ts` 明确把以下路径当作 `PROTECTED_PATHS`：

- `.spec-first/workspace`
- `.spec-first/tasks`
- `.spec-first/spec`
- `.spec-first/.developer`
- `.spec-first/.current-task`

所以：

```text
spec-first update
   │
   ├─ 可以升级框架脚本、平台命令、模板元信息
   ├─ 可以清理受管的旧命令文件
   └─ 不会覆盖 .spec-first/spec
```

这意味着：

- `spec/` 一旦进入项目，就是用户知识
- 框架升级不会回滚你的规范
- 模板升级也不会自动把“新的默认规范”灌进你项目里

### 7.1 这带来的正反两面

正面：

- 安全，不会把团队写好的规范覆盖掉

反面：

- 如果框架模板升级了，你项目里的 `spec/` 不会自动同步获得那些变化
- 是否采纳新模板思想，要靠团队主动维护

---

## 8. 维护生命周期：长期如何防止 `spec/` 腐化

`.spec-first/spec/` 最大的问题不是“初始化失败”，而是“用久了失真”。

### 8.1 典型腐化模式

1. 只在初始化那天写过一次，之后再也不更新
2. 只写原则，不写真实例子
3. 目录越来越大，但 index 不更新
4. monorepo 下 package 已拆分，spec 仍写成全局单仓库口径
5. 真实代码已改变，spec 仍在描述旧实现

### 8.2 建议的维护节奏

最稳妥的是把维护拆成三种频率：

#### 任务后维护

适用：

- 完成一个新功能
- 修完一个有代表性的 bug
- 做了新的设计决策

动作：

- 判断是否需要 `/spec:update-spec`
- 补具体规则、例子、反模式

#### 周期性维护

适用：

- 多人协作一段时间后
- 已出现“AI 产出和项目风格偏离”

动作：

- 检查 `index.md` 是否仍然能导航全量文档
- 清理过时规则
- 将泛化的经验从 task/PRD 沉淀进 `spec/`

#### 架构变更后维护

适用：

- monorepo 拆包
- API / DB / command contract 大改
- 引入新的基础设施

动作：

- 优先更新 code-spec
- 必要时再更新 guides
- 检查 package 边界和 `default_package` / `spec_scope`

### 8.3 维护时的最佳实践

- `index.md` 只做导航，不做百科全书
- 每条重要规则至少给一个真实例子
- 把“为什么”写进去，不只写“要这样做”
- 跨层契约写进 code-spec，不要只写到 guide
- 当某个文件明显过长时，拆主题并更新 index

---

## 9. 当前实现下的关键边界和误区

### 9.1 `/spec:start` 不会自动更新 `spec/`

这是最常见误区。

`/spec:start` 会：

- 读上下文
- 读 package / spec index
- 帮你进入任务流

它不会：

- 自动回写 `.spec-first/spec`
- 自动把空模板补成真实规范

### 9.2 `task init-context` 不等于“把整个 spec 全塞进上下文”

它只注入最小默认集。更细的 spec 需要 `add-context`。

### 9.3 `spec-first update` 不会帮你“升级项目规范内容”

它保护 `spec/`，所以不会替你同步新模板。

### 9.4 monorepo 下 package 不清晰会直接影响 spec 使用

如果：

- `task.json.package` 没有值
- 又没传 `--package`
- 也没有 `default_package`

那么 `task init-context` 在 monorepo 下会直接失败，导致 spec 无法被正确绑定到任务。

### 9.5 当前仓库自身还有一层“模板源”和“项目实例”的区别

对 spec-first 这个仓库自己来说，存在两套相关内容：

1. 当前项目实例里的 `.spec-first/spec/`
2. CLI 用来生成新项目骨架的 `packages/cli/src/templates/markdown/spec/...`

这两者不是同一个东西。

所以对于 spec-first 仓库本身：

- 改 `.spec-first/spec/` 是改“当前仓库自己的运行时规范实例”
- 改 `packages/cli/src/templates/markdown/spec/...` 是改“未来新项目初始化时的模板来源”

如果你只改前者，不会自动影响 `spec-first init` 对外生成的模板。

---

## 10. 全生命周期总图

把上面所有阶段压缩成一张大图：

```text
                    .spec-first/spec/ 生命周期

┌──────────────────────── 初始化阶段 ────────────────────────┐
│ spec-first init                                            │
│   ├─ createWorkflowStructure                               │
│   ├─ createSpecTemplates / 下载远程模板                    │
│   └─ 得到 spec/ 骨架                                       │
└────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌────────────────────── 首次补齐阶段 ────────────────────────┐
│ bootstrap 任务 00-bootstrap-guidelines                     │
│   ├─ 分析现有代码                                           │
│   ├─ 分析现有规则文件                                       │
│   ├─ 回填 backend/frontend/guides                          │
│   └─ 把空模板变成真实项目规范                               │
└────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌────────────────────── 日常使用阶段 ────────────────────────┐
│ /spec:start                                                │
│   ├─ 读取 workflow.md                                      │
│   ├─ 读取 get_context                                      │
│   ├─ 读取 packages mode                                    │
│   └─ 读取 spec index                                       │
│                                                             │
│ task init-context                                           │
│   ├─ workflow.md + spec index -> implement.jsonl           │
│   ├─ finish-work/check -> check.jsonl                      │
│   └─ check -> debug.jsonl                                  │
│                                                             │
│ task add-context                                            │
│   └─ 把更细粒度 spec 文档绑定到具体任务                      │
└────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌────────────────────── 更新回写阶段 ────────────────────────┐
│ /spec:update-spec 或人工编辑                               │
│   ├─ 学到新规则 / 新契约 / 新模式                           │
│   ├─ 判断 code-spec vs guide                               │
│   ├─ 更新目标文档                                           │
│   └─ 必要时更新 index.md                                    │
└────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌────────────────────── 框架升级阶段 ────────────────────────┐
│ spec-first update                                           │
│   ├─ 升级脚本和平台命令                                     │
│   └─ 跳过 .spec-first/spec （PROTECTED_PATHS）              │
└────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌────────────────────── 长期维护阶段 ────────────────────────┐
│ 周期性裁剪、补例子、修 index、跟进架构变化                  │
│ 防止 spec/ 与真实代码逐渐脱节                               │
└────────────────────────────────────────────────────────────┘
```

---

## 11. 最后的判断标准

判断 `.spec-first/spec/` 是否处于健康状态，不看“文件是不是存在”，而看下面四件事：

1. `/spec:start` 读到的是不是项目真实规范，而不是空模板
2. `task init-context` 之后，任务是否能拿到正确的 package / layer 索引
3. 新功能和新约定出现后，团队是否会显式回写 spec
4. 框架升级后，项目 spec 是否仍然被安全保护且由团队自主维护

如果这四点都成立，说明 `spec/` 的生命周期是闭环的。
