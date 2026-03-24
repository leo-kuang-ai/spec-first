# spec-first npm 安装与发布改造方案

日期：2026-03-22

## 1. 背景

当前 `spec-first` 是一个“仓库即技能包”的项目：技能文件、浏览器二进制、安装脚本、调试脚本都放在同一个仓库根目录下，通过 `setup` 把内容链接到 `~/.claude/skills/spec-first` 和 `~/.codex/skills/spec-first`。

现在要新增两件事：
- 支持用户通过 `npm install -g spec-first` 安装
- 支持维护者把 `spec-first` 发布到 npm 仓库

这意味着项目要同时满足两种分发形态：
- 仓库开发态：仍然可以从源码目录构建、调试、迭代
- npm 发布态：用户拿到的是可直接使用的发行包，不应依赖本机先装 Bun 再构建

## 2. 当前阻塞点

先看现状，当前有四个明显阻塞：

1. `package.json` 只有 `browse` 的 `bin`，没有对外的 `spec-first` CLI 入口。
2. `setup` 脚本一开始就强依赖 `bun`，这对 npm 用户不友好。
3. `package.json` 的版本号是 `0.9.8.0`，这不是 npm 期望的标准 semver 版本格式，发布前需要修正。
4. 现在没有明确的 npm 发布清单，容易把分析文档、历史方案、内部产物一起打进 tarball。

## 3. 目标

本次改造的目标是：
- `npm install -g spec-first` 后可以直接获得 `spec-first` 命令
- npm 安装后的用户不需要先安装 Bun 也能完成首次 setup
- 发布到 npm 的包是自洽的，包含必须的 skill、脚本和浏览器二进制
- 维护者仍然可以从源码仓库继续走 Bun 构建链路
- Claude / Codex 的 skill 安装行为保持不变，只是换了分发通路

## 4. 方案对比

### 方案 A：直接把当前仓库按原样发到 npm

做法：
- 直接给现有仓库加 npm 发布配置
- 继续让 `setup` 负责构建和安装
- 发布时尽量把整个仓库打包上去

优点：
- 改动最少，最快能发版

缺点：
- 用户端仍然会碰到 Bun 依赖
- tarball 容易过大，内部分析文档和历史迁移包都可能被打进去
- 发布物和源码态混在一起，后面维护会越来越乱

结论：
- 不推荐，只适合临时验证

### 方案 B：单包发布 + 发行态/开发态分离

做法：
- 仍然保持一个 npm 包：`spec-first`
- 增加一个真正的 npm CLI 入口 `spec-first`
- 发布前通过 `prepack` 生成 skill 文档和浏览器二进制
- 发行包包含已编译产物，用户安装后不需要 Bun 才能完成 setup
- `setup` 保留开发态行为，但在发行态要能跳过本地构建

优点：
- 改造量可控
- 兼容当前仓库结构
- 用户体验最好：安装路径统一，发布路径统一

缺点：
- 需要补一个 CLI 包装层
- `setup` 需要区分“源码态”和“发行态”

结论：
- **推荐**

### 方案 C：拆成 runtime 包 + installer 包

做法：
- 一个包只负责 runtime / skill 资产
- 另一个包只负责安装器 / 更新器 / 发布工具

优点：
- 最干净，后续扩展性最好

缺点：
- 复杂度最高
- 当前项目阶段收益不大

结论：
- 暂不推荐，留作未来拆分方向

## 5. 推荐方案

我建议采用 **方案 B：单包发布 + 发行态 / 开发态分离**。

核心思路是把 npm 包当成“可直接安装使用的发行版”，而不是“安装后再构建源码”的壳子。

### 5.1 npm 包的职责

npm 包应该直接提供：
- `spec-first` 这个主命令
- 现有 skill 目录和模板
- 已生成的 Claude / Codex skill 文件
- 已编译好的 `browse` 二进制
- 安装与校验所需的 helper 脚本

### 5.2 安装流转图

```text
npm publish
   ↓
npm registry
   ↓
npm install -g spec-first
   ↓
spec-first setup --host auto
   ↓
链接到 ~/.claude/skills/spec-first
   ↓
Claude / Codex 读取 skill
```

### 5.3 为什么要区分发行态和开发态

因为两类使用场景不一样：

- 发行态用户只想安装和使用，不想先装 Bun 再编译
- 开发态维护者需要继续改 skill、改脚本、重新生成产物

所以 `setup` 不能把“本地重建”当成硬前置条件。
它必须先判断当前是不是发行包，如果已经带着可用二进制，就直接进入安装步骤。

## 6. 具体改造清单

### 6.1 package.json

需要补这几类配置：
- `bin`：增加 `spec-first` 主命令入口
- `files`：只发布必要资产，避免把分析类文档和迁移包一起打包
- `scripts.prepack`：发布前生成 skill 文档和浏览器二进制
- `scripts.publish:npm` 或类似发布脚本：统一发版流程
- `publishConfig.access=public`：如果是公共包，明确公开发布

同时要把版本号改成合法 semver，比如 `0.9.8` 或 `0.9.8-rc.0`，不能继续用四段式版本。

### 6.2 CLI 入口

需要新增一个 `spec-first` 主入口，负责：
- `spec-first setup`
- `spec-first install`
- `spec-first update`
- `spec-first doctor`
- `spec-first analytics`

这个入口最好是 Node 包装层，而不是直接依赖用户机器上的 Bun。

### 6.3 setup 行为

`setup` 要拆成两个分支：

- 发行态：
  - 不要求本机先装 Bun
  - 直接使用包内已经生成好的 `browse/dist/browse`
  - 只做技能链接、环境检查、Playwright 验证

- 开发态：
  - 保留当前从源码重建的能力
  - 允许 Bun 重新编译浏览器二进制

### 6.4 发布物清单

发行包应当至少包含：
- `setup`
- `bin/`
- `browse/dist/`
- 顶层 skill 目录
- `.agents` 里对应的生成结果
- `README.md` / `README-CN.md`
- `LICENSE`
- `package.json`

### 6.4.1 浏览器二进制交付策略

为避免 npm-only 安装在不同平台上失效，发行包需要自包含三套平台二进制或等价的本地可解析 artifact：
- macOS
- Linux
- Windows

`spec-first install` 在安装后根据当前平台选择对应二进制，不依赖用户再从网络补下载，保证离线也能完成首次初始化。

不应该默认包含：
- `docs/01-需求分析/**`
- 历史分析产物
- 各种迁移中间件和审查报告

### 6.5 发布流程

建议建立稳定的发布链路：
1. 更新版本号
2. 运行 `bun run build`
3. 运行测试和 smoke check
4. 执行 `npm pack --dry-run`
5. 确认 tarball 内容正确
6. 执行 `npm publish`

## 7. 验收标准

这个改造完成后，至少要满足：
- 新机器上只有 Node / npm，也可以安装 `spec-first`
- `npm install -g spec-first` 后能得到 `spec-first` 命令
- `spec-first setup --host claude` 可以正常链接 Claude skill
- `spec-first setup --host codex` 可以正常链接 Codex skill
- 发行包里包含 `browse` 可执行文件，不依赖用户再本地编译
- `npm pack --dry-run` 不包含分析目录和历史迁移包
- 版本号符合 npm 的 semver 规则

## 8. 风险与待确认

### 风险

- npm 包名 `spec-first` 是否可用，需要最终发布前确认
- 发行包体积可能较大，需要靠 `files` 白名单控制
- 现有 shell 入口在 Windows 下的兼容性需要额外验证
- 如果 `setup` 仍然过度依赖 Bun，会抵消 npm 安装的价值

### 待确认

- 主命令是否只做安装和诊断，还是要把所有 helper 也都开放出来
- npm 发布是否需要同时走 GitHub Actions 的 provenance / automation 流程

## 9. 推荐结论

结论很明确：**保留单仓库、单 npm 包的分发方式，采用发行态 / 开发态分离的改造**。  
这样可以在不拆仓库的前提下，把 `spec-first` 变成真正可 npm 安装、可 npm 发布、又不牺牲当前技能体系的产品形态。

### 已确认的命令面补充

- `spec-first install` 作为面向 npm 用户的显式安装入口，对外暴露给用户。
- `spec-first install` 内部调用 `setup` 完成初始化与环境接线。
- `spec-first install` 需要透传 `setup` 已有参数，避免两套入口出现不同语义。
- `spec-first install` 和 `setup` 都应该拒绝未知参数并明确报错，避免静默忽略导致安装结果和用户预期不一致。
- `setup` 继续保留为底层初始化入口，供开发态、补装和脚本链路复用。

## SPEC_FIRST REVIEW REPORT

| 评审 | 触发器 | 目的 | 运行次数 | 状态 | 结论 |
|------|--------|------|----------|------|------|
| CEO 评审 | `/plan-ceo-review` | 范围与战略 | 1 | clean | 1 个战略问题，0 个未决决定 |
| Codex 评审 | `/codex review` | 独立第二意见 | 0 | — | 未运行 |
| Eng 评审 | `/plan-eng-review` | 架构与测试（必需） | 2 | issues_open | 5 个问题，2 个关键缺口 |
| Design 评审 | `/plan-design-review` | UI/UX 缺口 | 0 | — | 未运行 |

- **未决：** 0
- **结论：** CEO 已收口；仍需要 eng review

### 不在范围内
- 把仓库拆成 runtime 包和 installer 包；对第一版 npm 改造来说，影响面太大。
- 用另一种语言重写浏览器运行时；对 npm 发布不是必要条件。
- 重做整套 skill 架构；这份方案只针对分发与安装可用性。

### 已有基础
- `setup` 已经负责构建浏览器二进制、链接 Claude/Codex skills，并校验 Playwright。
- `package.json` 已经把项目定义成基于 Bun 的工具链，并暴露了 `browse` 二进制。
- `scripts/gen-skill-docs.ts` 已经能生成 Claude 和 Codex 两套 skill 树。
- `bin/dev-setup` 和 `bin/dev-teardown` 已经提供了干净的开发态 symlink 流程。

### 失效模式
- 只有 macOS 编译出来的 `browse` 二进制发到 npm 后，会在 Linux/Windows 安装时失败。
- 从 npm 全局安装后执行 `spec-first setup`，因为不在 `.claude/skills/` 里，会跳过 Claude skill 链接。
- `bunx playwright install chromium` 仍然会让没有 Bun 的 npm-only 用户卡住。
- 把 `.agents` 和整个 docs 树一起打包，会让 tarball 变大，拖慢安装与发布。

### CEO 评审备注

当前的战略缺口在于跨平台分发。方案仍然默认“一个编译好的 `browse` 二进制可以直接通过 npm 发布”，但没有说明 Linux 和 Windows 用户如何拿到可用产物。这是产品决策，不只是实现细节。

建议的选项：
- 维持单包形态，但为浏览器二进制增加按平台感知的安装/下载逻辑。
- 把 v1 的支持范围收窄到单一操作系统，并在方案里明确写死。
- 保持当前方案不变，同时接受 npm 安装在 macOS 之外可能失败。

## Reviewer Concerns

1. `spec-first install` 仍然无法真正落地到无 Bun 环境，因为 `setup` 在一开始就硬检查 Bun，并且后续还用 `bunx playwright install chromium`。
2. `browse` 的跨平台交付方式仍然没有被写成可执行方案，只有“平台感知分发”的方向，没有明确的 artifact 结构或下载机制。
3. 安装流程图还停留在 `npm install -g spec-first -> spec-first setup --host auto`，和现在的 `install -> setup` 边界不一致。
4. 还缺少一组明确的 smoke test：npm-only 安装、无 Bun 安装、技能链接、以及 tarball 内容校验。
5. `files` / publish 清单还没有收敛成真正的白名单，也没有 tarball 体积上限，`.agents` 和 docs 树的膨胀风险仍然存在。
